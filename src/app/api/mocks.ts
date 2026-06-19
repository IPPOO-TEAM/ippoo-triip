/**
 * Registre de mocks API IPPOO TRIIP — backend simulé AVEC ÉTAT.
 *
 * Branché sur la base en mémoire (./db). Contrairement à un mock figé :
 *  - les courses créées sont persistées et retrouvables ;
 *  - le statut d'une course active progresse automatiquement avec le temps ;
 *  - les paiements Mobile Money passent de "pending" à "success" et créditent le wallet ;
 *  - les notifications, parrainages, commandes groupées, etc. sont mutables.
 *
 * À désactiver via VITE_API_MOCK=false quand un vrai backend (Supabase/REST) est prêt.
 */
import { registerMock, ApiError } from "./client";
import { db, persist, helpers, PLACES } from "./db";
import type { Ride, RideStatus, Transaction } from "../types/domain";

const { uid, nowIso, distanceKm, estimatePrice } = helpers;

/* ─────────────────────────────────────────── */
/*  Utilitaires                                  */
/* ─────────────────────────────────────────── */

/** Parse ?key=value depuis un chemin mocké. */
function query(path: string): Record<string, string> {
  const q = path.split("?")[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q));
}
function basePath(path: string): string {
  return path.split("?")[0];
}
function paramAt(path: string, index: number): string {
  return basePath(path).split("/").filter(Boolean)[index];
}
function paginate<T>(items: T[], path: string) {
  const q = query(path);
  const page = Math.max(1, parseInt(q.page ?? "1", 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(q.pageSize ?? "20", 10)));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

/** Étapes du cycle de vie d'une course active, avec délais (secondes depuis création). */
const RIDE_TIMELINE: Array<{ at: number; status: RideStatus; label: string }> = [
  { at: 0,  status: "requested",   label: "Recherche d'un chauffeur" },
  { at: 6,  status: "accepted",    label: "Chauffeur trouvé" },
  { at: 14, status: "arriving",    label: "Le chauffeur arrive" },
  { at: 26, status: "in_progress", label: "Course en cours" },
  { at: 70, status: "completed",   label: "Course terminée" },
];

/** Fait progresser le statut d'une course selon le temps écoulé. */
function advanceRide(ride: Ride): Ride {
  if (ride.status === "cancelled" || ride.status === "completed") return ride;
  const elapsed = (Date.now() - new Date(ride.createdAt).getTime()) / 1000;
  let current = RIDE_TIMELINE[0];
  for (const step of RIDE_TIMELINE) if (elapsed >= step.at) current = step;

  if (current.status !== ride.status) {
    const d = db();
    ride.status = current.status;
    if (!ride.driverId && current.status !== "requested") {
      const online = Object.values(d.drivers).filter((dr) => dr.isOnline);
      ride.driverId = (online[0] ?? Object.values(d.drivers)[0])?.id;
    }
    if (current.status === "completed") ride.completedAt = nowIso();
    d.rideEvents.push({
      id: uid("ev"), rideId: ride.id, status: current.status,
      label: current.label, at: nowIso(),
      location: current.status === "arriving" ? ride.origin : undefined,
    });
    d.rides[ride.id] = ride;

    // À la complétion : débit wallet + transaction
    if (current.status === "completed") {
      const w = d.wallets[ride.clientId];
      if (w && w.balanceXOF >= ride.priceXOF) {
        w.balanceXOF -= ride.priceXOF;
        d.transactions.unshift({
          id: uid("tx"), userId: ride.clientId, type: "ride_payment",
          method: "wallet", amountXOF: ride.priceXOF, status: "success",
          rideId: ride.id, createdAt: nowIso(),
          description: `Course ${ride.origin.label ?? ""} → ${ride.destination.label ?? ""}`.trim(),
        });
      }
      d.notifications.unshift({
        id: uid("ntf"), userId: ride.clientId, type: "ride",
        title: "Course terminée", body: "Merci d'avoir voyagé avec IPPOO TRIIP. Notez votre course.",
        read: false, createdAt: nowIso(),
      });
    }
    persist();
  }
  return ride;
}

/* ═══════════════════════════════════════════ */
/*  AUTH                                          */
/* ═══════════════════════════════════════════ */

const OTP_CODE = "123456"; // OTP de démonstration (tout code à 6 chiffres est accepté)

registerMock("POST", "/auth/otp/request", ({ body }) => {
  if (!body?.phone) throw new ApiError(400, "PHONE_REQUIRED", "Numéro requis");
  return { ok: true, message: "Code envoyé par SMS", devCode: OTP_CODE };
});

registerMock("POST", "/auth/otp/verify", ({ body }) => {
  const otp: string = body?.otp ?? "";
  if (!/^\d{6}$/.test(otp)) throw new ApiError(401, "OTP_INVALID", "Code à 6 chiffres requis");
  const d = db();
  const phone = body?.phone ?? "+22997123456";

  // Retrouve ou crée l'utilisateur lié au numéro
  let user = Object.values(d.users).find((u) => u.phone === phone);
  if (!user) {
    user = {
      id: uid("u"), role: "client", fullName: "Nouvel utilisateur",
      phone, city: "Cotonou", language: "fr", kycStatus: "pending",
      createdAt: nowIso(),
    };
    d.users[user.id] = user;
    d.wallets[user.id] = { userId: user.id, balanceXOF: 0, pendingXOF: 0, currency: "XOF" };
    persist();
  }
  return {
    accessToken: "mock_at_" + Date.now(),
    refreshToken: "mock_rt_" + Date.now(),
    expiresAt: Date.now() + 3600_000,
    user,
  };
});

registerMock("POST", "/auth/refresh", () => ({
  accessToken: "mock_at_" + Date.now(),
  refreshToken: "mock_rt_" + Date.now(),
  expiresAt: Date.now() + 3600_000,
}));

registerMock("POST", "/auth/logout", () => ({ ok: true }));

/* ═══════════════════════════════════════════ */
/*  PROFIL UTILISATEUR                            */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/users/me", () => db().users["u_me"]);

registerMock("PATCH", "/users/me", ({ body }) => {
  const d = db();
  d.users["u_me"] = { ...d.users["u_me"], ...body, id: "u_me", role: "client" };
  persist();
  return d.users["u_me"];
});

registerMock("POST", "/users/me/kyc", ({ body }) => {
  const d = db();
  d.users["u_me"].kycStatus = "verified";
  persist();
  return { status: "verified", documentType: body?.documentType ?? "cni" };
});

/* ═══════════════════════════════════════════ */
/*  CHAUFFEURS                                    */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/drivers/nearby", ({ path }) => {
  const q = query(path);
  const origin = { lat: parseFloat(q.lat ?? "6.3654"), lng: parseFloat(q.lng ?? "2.4183") };
  const type = q.serviceType;
  const vehicleByService: Record<string, string> = {
    taxi_moto: "moto", delivery: "moto", heavy_transport: "truck", carpool: "car",
  };
  return Object.values(db().drivers)
    .filter((dr) => dr.isOnline)
    .filter((dr) => !type || !vehicleByService[type] || dr.vehicleType === vehicleByService[type])
    .map((dr) => ({
      ...dr,
      etaMin: Math.max(1, Math.round(distanceKm(origin, dr.currentLocation ?? origin) * 2.5)),
    }))
    .sort((a, b) => a.etaMin - b.etaMin);
});

registerMock("GET", /^\/drivers\/[^/]+$/, ({ path }) => {
  const id = paramAt(path, 1);
  const dr = db().drivers[id];
  if (!dr) throw new ApiError(404, "DRIVER_NOT_FOUND", "Chauffeur introuvable");
  return dr;
});

/* ─── Espace chauffeur ─── */
registerMock("PATCH", "/driver/status", ({ body }) => {
  const d = db();
  const dr = d.drivers["d_1"];
  dr.isOnline = !!body?.isOnline;
  persist();
  return { isOnline: dr.isOnline };
});

registerMock("GET", "/driver/earnings", () => {
  const rides = 8 + Math.floor(Math.random() * 6);
  const grossToday = rides * 1500 + 2000;
  const commissionToday = Math.round(grossToday * 0.15);
  const grossWeek = 87300, grossMonth = 342000;
  const totalBalance = 45600, pendingWithdrawals = 15000;
  return {
    // résumé synthétique
    todayXOF: grossToday - commissionToday,
    weekXOF: Math.round(grossWeek * 0.85),
    monthXOF: Math.round(grossMonth * 0.85),
    ridesToday: rides,
    acceptanceRate: 0.94,
    rating: 4.9,
    // ventilation détaillée (utilisée par l'écran Gains chauffeur)
    grossToday, commissionToday, netToday: grossToday - commissionToday,
    grossWeek, commissionWeek: Math.round(grossWeek * 0.15), netWeek: Math.round(grossWeek * 0.85),
    grossMonth, commissionMonth: Math.round(grossMonth * 0.15), netMonth: Math.round(grossMonth * 0.85),
    totalBalance, pendingWithdrawals, availableBalance: totalBalance - pendingWithdrawals,
    bonusEarned: 3500, totalRides: 28, avgPerRide: Math.round(grossToday / rides),
  };
});

/* ═══════════════════════════════════════════ */
/*  COURSES                                       */
/* ═══════════════════════════════════════════ */

registerMock("POST", "/rides/estimate", ({ body }) => {
  const origin = body?.origin ?? PLACES[0];
  const destination = body?.destination ?? PLACES[3];
  const dist = distanceKm(origin, destination);
  const priceXOF = estimatePrice(body?.serviceType ?? "taxi_moto", dist);
  return { distanceKm: dist, durationMin: Math.round(dist * 3 + 4), priceXOF };
});

registerMock("POST", "/rides", ({ body }) => {
  const d = db();
  const origin = body?.origin ?? PLACES[0];
  const destination = body?.destination ?? PLACES[3];
  const dist = body?.distanceKm ?? distanceKm(origin, destination);
  const ride: Ride = {
    id: uid("ride"),
    clientId: "u_me",
    serviceType: body?.serviceType ?? "taxi_moto",
    status: "requested",
    origin,
    destination,
    priceXOF: body?.priceXOF ?? estimatePrice(body?.serviceType ?? "taxi_moto", dist),
    distanceKm: dist,
    durationMin: body?.durationMin ?? Math.round(dist * 3 + 4),
    scheduledAt: body?.scheduledAt,
    notes: body?.notes,
    createdAt: nowIso(),
  };
  d.rides[ride.id] = ride;
  d.rideEvents.push({ id: uid("ev"), rideId: ride.id, status: "requested", label: "Recherche d'un chauffeur", at: nowIso() });
  persist();
  return ride;
});

registerMock("GET", "/rides", ({ path }) => {
  const d = db();
  const q = query(path);
  let list = Object.values(d.rides).filter((r) => r.clientId === "u_me");
  if (q.status) list = list.filter((r) => r.status === q.status);
  if (q.serviceType) list = list.filter((r) => r.serviceType === q.serviceType);
  list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  // Enrichissement chauffeur (clés ignorées par RideSchema, utiles à l'UI historique)
  const enriched = list.map((r) => {
    const dr = r.driverId ? d.drivers[r.driverId] : undefined;
    return {
      ...r,
      driverName: dr?.fullName ?? "—",
      driverRating: dr?.rating ?? 0,
      vehicle: dr?.vehiclePlate ?? "—",
    };
  });
  return paginate(enriched, path);
});

const VEHICLE_LABEL: Record<string, string> = {
  moto: "Moto", tricycle: "Tricycle", car: "Voiture", van: "Mini-bus", truck: "Camion",
};

registerMock("GET", /^\/rides\/[^/]+$/, ({ path }) => {
  const d = db();
  const id = paramAt(path, 1);
  const ride = d.rides[id];
  if (!ride) throw new ApiError(404, "RIDE_NOT_FOUND", "Course introuvable");
  const advanced = advanceRide(ride);
  // Chauffeur assigné, ou aperçu du premier chauffeur en ligne avant l'acceptation
  const dr = advanced.driverId
    ? d.drivers[advanced.driverId]
    : Object.values(d.drivers).find((x) => x.isOnline) ?? Object.values(d.drivers)[0];
  // Clés supplémentaires ignorées par RideSchema (consommateurs Zod), utiles au suivi UI
  return {
    ...advanced,
    driverName: dr?.fullName ?? "—",
    driverPlate: dr?.vehiclePlate ?? "—",
    driverRating: dr?.rating ?? 0,
    driverTrips: dr?.totalRides ?? 0,
    driverVehicle: dr ? VEHICLE_LABEL[dr.vehicleType] ?? dr.vehicleType : "—",
  };
});

registerMock("GET", /^\/rides\/[^/]+\/events$/, ({ path }) => {
  const id = paramAt(path, 1);
  const ride = db().rides[id];
  if (ride) advanceRide(ride);
  return db().rideEvents.filter((e) => e.rideId === id);
});

registerMock("POST", /^\/rides\/[^/]+\/cancel$/, ({ path }) => {
  const id = paramAt(path, 1);
  const d = db();
  const ride = d.rides[id];
  if (!ride) throw new ApiError(404, "RIDE_NOT_FOUND", "Course introuvable");
  ride.status = "cancelled";
  d.rideEvents.push({ id: uid("ev"), rideId: id, status: "cancelled", label: "Course annulée", at: nowIso() });
  persist();
  return ride;
});

registerMock("POST", /^\/rides\/[^/]+\/rate$/, ({ path, body }) => {
  const id = paramAt(path, 1);
  const d = db();
  const ride = d.rides[id];
  if (ride?.driverId && d.drivers[ride.driverId]) {
    const dr = d.drivers[ride.driverId];
    dr.rating = +(((dr.rating * dr.totalRides) + (body?.rating ?? 5)) / (dr.totalRides + 1)).toFixed(2);
    dr.totalRides += 1;
    persist();
  }
  return { ok: true, rating: body?.rating ?? 5 };
});

/* ═══════════════════════════════════════════ */
/*  WALLET & TRANSACTIONS                         */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/wallet/me", () => {
  const w = db().wallets["u_me"];
  if (!w) throw new ApiError(404, "WALLET_NOT_FOUND", "Portefeuille introuvable");
  return w;
});

registerMock("GET", "/wallet/transactions", ({ path }) => {
  const list = db().transactions
    .filter((t) => t.userId === "u_me")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const q = query(path);
  return q.page || q.pageSize ? paginate(list, path) : list;
});

registerMock("POST", "/wallet/pay", ({ body }) => {
  const d = db();
  const amount = Number(body?.amountXOF ?? 0);
  const w = d.wallets["u_me"];
  if (amount < 100) throw new ApiError(400, "AMOUNT_MIN", "Montant minimum : 100 XOF");
  if (w.balanceXOF < amount) throw new ApiError(402, "INSUFFICIENT_FUNDS", "Solde insuffisant");
  const tx: Transaction = {
    id: uid("tx"), userId: "u_me", type: "ride_payment",
    method: "wallet", amountXOF: amount, status: "success",
    rideId: body?.rideCode, createdAt: nowIso(),
    description: body?.rideCode ? `Course #${body.rideCode}` : "Paiement course",
  };
  w.balanceXOF -= amount;
  d.transactions.unshift(tx);
  persist();
  return { transaction: tx, balanceXOF: w.balanceXOF };
});

registerMock("POST", "/wallet/topup", ({ body }) => {
  const d = db();
  const amount = Number(body?.amountXOF ?? 0);
  if (amount < 100) throw new ApiError(400, "AMOUNT_MIN", "Montant minimum : 100 XOF");
  const tx: Transaction = {
    id: uid("tx"), userId: "u_me", type: "topup",
    method: body?.method ?? "mtn_momo", amountXOF: amount, status: "success",
    createdAt: nowIso(), description: "Recharge portefeuille",
  };
  d.wallets["u_me"].balanceXOF += amount;
  d.transactions.unshift(tx);
  persist();
  return { transaction: tx, balanceXOF: d.wallets["u_me"].balanceXOF };
});

/* ═══════════════════════════════════════════ */
/*  PAIEMENTS MOBILE MONEY                        */
/* ═══════════════════════════════════════════ */

registerMock("POST", "/payments/momo/initiate", ({ body }) => {
  const d = db();
  const id = uid("pay");
  const ussd: Record<string, string> = { mtn_momo: "*880#", moov_money: "*555#", celtiis_cash: "*811#" };
  d.payments[id] = {
    id, rideId: body?.rideId, userId: "u_me",
    amountXOF: Number(body?.amount ?? 0), method: body?.operator ?? "mtn_momo",
    status: "pending", createdAt: nowIso(), expiresAt: Date.now() + 120_000, attempts: 0,
  };
  persist();
  return {
    transactionId: id, status: "pending",
    ussdHint: ussd[body?.operator ?? "mtn_momo"] ?? "*880#",
    expiresAt: d.payments[id].expiresAt,
  };
});

registerMock("GET", /^\/payments\/momo\/[^/]+\/status$/, ({ path }) => {
  const id = paramAt(path, 2);
  const d = db();
  const pay = d.payments[id];
  if (!pay) throw new ApiError(404, "PAYMENT_NOT_FOUND", "Transaction introuvable");
  if (pay.status === "pending") {
    pay.attempts += 1;
    // Réussite après 2 sondages (~6 s) ; expiration au-delà du délai
    if (Date.now() > pay.expiresAt) pay.status = "failed";
    else if (pay.attempts >= 2) {
      pay.status = "success";
      d.wallets["u_me"].balanceXOF += pay.amountXOF;
      d.transactions.unshift({
        id: uid("tx"), userId: "u_me", type: pay.rideId ? "ride_payment" : "topup",
        method: pay.method as Transaction["method"], amountXOF: pay.amountXOF,
        status: "success", reference: pay.id, rideId: pay.rideId,
        createdAt: nowIso(), description: pay.rideId ? "Paiement course" : "Recharge Mobile Money",
      });
    }
    persist();
  }
  return { status: pay.status };
});

/* ═══════════════════════════════════════════ */
/*  NOTIFICATIONS                                 */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/notifications", ({ path }) => {
  const list = db().notifications
    .filter((n) => n.userId === "u_me")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const q = query(path);
  return q.page || q.pageSize ? paginate(list, path) : list;
});

registerMock("GET", "/notifications/unread-count", () =>
  ({ count: db().notifications.filter((n) => n.userId === "u_me" && !n.read).length }));

registerMock("POST", /^\/notifications\/[^/]+\/read$/, ({ path }) => {
  const id = paramAt(path, 1);
  const n = db().notifications.find((x) => x.id === id);
  if (n) { n.read = true; persist(); }
  return { ok: true };
});

registerMock("POST", "/notifications/read-all", () => {
  db().notifications.forEach((n) => { if (n.userId === "u_me") n.read = true; });
  persist();
  return { ok: true };
});

/* ═══════════════════════════════════════════ */
/*  PARRAINAGE                                    */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/referrals/me", () => {
  const refs = db().referrals.filter((r) => r.referrerId === "u_me");
  return {
    code: "DOSSOU-IPP2026",
    link: "https://ippoo.bj/ref/DOSSOU-IPP2026",
    invited: refs.length,
    registered: refs.filter((r) => r.status !== "pending").length,
    totalEarnedXOF: refs.filter((r) => r.status === "rewarded").reduce((s, r) => s + r.rewardXOF, 0),
    referrals: refs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  };
});

registerMock("POST", "/referrals/invite", ({ body }) => {
  const d = db();
  const ref = {
    id: uid("ref"), referrerId: "u_me", code: "DOSSOU-IPP2026",
    inviteePhone: body?.phone, status: "pending" as const,
    rewardXOF: 1000, createdAt: nowIso(),
  };
  d.referrals.unshift(ref);
  persist();
  return ref;
});

/* ═══════════════════════════════════════════ */
/*  COMMANDES GROUPÉES                            */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/group-orders", () =>
  Object.values(db().groupOrders).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));

registerMock("GET", /^\/group-orders\/[^/]+$/, ({ path }) => {
  const go = db().groupOrders[paramAt(path, 1)];
  if (!go) throw new ApiError(404, "GROUP_ORDER_NOT_FOUND", "Commande introuvable");
  return go;
});

registerMock("POST", /^\/group-orders\/[^/]+\/join$/, ({ path, body }) => {
  const d = db();
  const go = d.groupOrders[paramAt(path, 1)];
  if (!go) throw new ApiError(404, "GROUP_ORDER_NOT_FOUND", "Commande introuvable");
  if (go.status !== "open") throw new ApiError(409, "GROUP_ORDER_LOCKED", "Commande clôturée");
  const amount = Number(body?.amountXOF ?? 0);
  go.participants.push({
    userId: "u_me", name: d.users["u_me"].fullName,
    items: Number(body?.items ?? 1), amountXOF: amount,
  });
  go.totalXOF += amount;
  persist();
  return go;
});

/* ═══════════════════════════════════════════ */
/*  COVOITURAGE                                   */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/carpools", ({ path }) => {
  const q = query(path);
  let list = Object.values(db().carpools).filter((c) => c.seatsLeft > 0);
  if (q.q) {
    const term = q.q.toLowerCase();
    list = list.filter((c) =>
      (c.origin.label ?? "").toLowerCase().includes(term) ||
      (c.destination.label ?? "").toLowerCase().includes(term));
  }
  return list.sort((a, b) => +new Date(a.departAt) - +new Date(b.departAt));
});

registerMock("POST", /^\/carpools\/[^/]+\/book$/, ({ path, body }) => {
  const d = db();
  const c = d.carpools[paramAt(path, 1)];
  if (!c) throw new ApiError(404, "CARPOOL_NOT_FOUND", "Trajet introuvable");
  const seats = Number(body?.seats ?? 1);
  if (c.seatsLeft < seats) throw new ApiError(409, "NO_SEATS", "Plus assez de places");
  c.seatsLeft -= seats;
  persist();
  return { ok: true, trip: c, totalXOF: seats * c.pricePerSeatXOF };
});

/* ═══════════════════════════════════════════ */
/*  FRET AÉRIEN                                   */
/* ═══════════════════════════════════════════ */

registerMock("POST", "/air-freight/quote", ({ body }) => {
  const weight = Number(body?.weightKg ?? 1);
  const base = body?.category === "cargo" ? 8000 : body?.category === "parcel" ? 4000 : 2000;
  return { priceXOF: base + Math.round(weight * 2500), etaDays: 2 + Math.ceil(weight / 20) };
});

registerMock("POST", "/air-freight", ({ body }) => {
  const d = db();
  const ship = {
    id: uid("af"), clientId: "u_me",
    fromAirport: body?.fromAirport ?? "COO — Cotonou Cadjèhoun",
    toAirport: body?.toAirport ?? "LFW — Lomé",
    weightKg: Number(body?.weightKg ?? 1),
    category: body?.category ?? "parcel",
    priceXOF: Number(body?.priceXOF ?? 45000),
    status: "booked" as const,
    trackingCode: "IPP-AF-" + Math.floor(100000 + Math.random() * 900000),
    createdAt: nowIso(),
  };
  d.airFreight[ship.id] = ship;
  persist();
  return ship;
});

registerMock("GET", "/air-freight", () =>
  Object.values(db().airFreight).filter((s) => s.clientId === "u_me"));

registerMock("GET", /^\/air-freight\/track\/[^/]+$/, ({ path }) => {
  const code = paramAt(path, 2);
  const ship = Object.values(db().airFreight).find((s) => s.trackingCode === code);
  if (!ship) throw new ApiError(404, "SHIPMENT_NOT_FOUND", "Colis introuvable");
  return ship;
});

/* ═══════════════════════════════════════════ */
/*  ADMIN                                         */
/* ═══════════════════════════════════════════ */

registerMock("GET", "/admin/stats", () => {
  const d = db();
  const rides = Object.values(d.rides);
  const services = ["taxi_moto", "delivery", "heavy_transport", "group_order", "carpool", "air_freight"] as const;
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return {
    usersTotal: Object.keys(d.users).length + 1280,
    driversOnline: Object.values(d.drivers).filter((dr) => dr.isOnline).length,
    ridesToday: 142 + rides.filter((r) => r.status !== "completed").length,
    ridesActive: rides.filter((r) => ["requested", "accepted", "arriving", "in_progress"].includes(r.status)).length,
    revenueTodayXOF: 1_245_000,
    revenueMonthXOF: 28_900_000,
    kycPending: Object.values(d.users).filter((u) => u.kycStatus === "pending").length,
    ridesByService: services.map((s) => ({ service: s, count: 20 + Math.floor(Math.random() * 180) })),
    revenue7d: days.map((day) => ({ day, amountXOF: 600_000 + Math.floor(Math.random() * 900_000) })),
  };
});

registerMock("GET", "/admin/users", ({ path }) => {
  const list = Object.values(db().users);
  return paginate(list, path);
});

registerMock("GET", "/admin/rides", ({ path }) => {
  const list = Object.values(db().rides).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return paginate(list, path);
});

registerMock("POST", /^\/admin\/kyc\/[^/]+\/(approve|reject)$/, ({ path }) => {
  const userId = paramAt(path, 2);
  const action = paramAt(path, 3);
  const d = db();
  if (d.users[userId]) {
    d.users[userId].kycStatus = action === "approve" ? "verified" : "rejected";
    persist();
  }
  return { ok: true, status: action === "approve" ? "verified" : "rejected" };
});
