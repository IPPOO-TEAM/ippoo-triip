/**
 * Base de données mock IPPOO TRIIP — store en mémoire avec persistance localStorage.
 *
 * Simule un vrai backend avec état : les courses créées sont retrouvables,
 * le solde du wallet évolue avec les paiements, les statuts progressent dans le temps.
 * Données seedées avec des noms et lieux authentiquement béninois (Fon, Yoruba, Goun).
 *
 * Réinitialisable via resetDb() ou en vidant la clé localStorage "ippoo_db_v1".
 */
import type {
  User, DriverProfile, Ride, RideEvent, Transaction, Wallet,
  Notification, Referral, GroupOrder, CarpoolTrip, AirFreightShipment,
} from "../types/domain";

const DB_KEY = "ippoo_db_v1";
const nowIso = () => new Date().toISOString();
const isoAgo = (ms: number) => new Date(Date.now() - ms).toISOString();
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

export type Db = {
  users: Record<string, User>;
  drivers: Record<string, DriverProfile>;
  rides: Record<string, Ride>;
  rideEvents: RideEvent[];
  wallets: Record<string, Wallet>;
  transactions: Transaction[];
  notifications: Notification[];
  referrals: Referral[];
  groupOrders: Record<string, GroupOrder>;
  carpools: Record<string, CarpoolTrip>;
  airFreight: Record<string, AirFreightShipment>;
  payments: Record<string, { id: string; rideId?: string; userId: string; amountXOF: number; method: string; status: "pending" | "success" | "failed"; createdAt: string; expiresAt: number; attempts: number }>;
  meta: { seededAt: string };
};

/* ─────────────────────────────────────────── */
/*  Données de référence — Bénin                 */
/* ─────────────────────────────────────────── */

/** Lieux réels du Grand Nokoué (Cotonou, Calavi, Porto-Novo). */
export const PLACES = [
  { lat: 6.3654, lng: 2.4183, label: "Cotonou · Dantokpa" },
  { lat: 6.3703, lng: 2.3912, label: "Cotonou · Ganhi" },
  { lat: 6.3899, lng: 2.3489, label: "Cotonou · Cadjèhoun" },
  { lat: 6.3580, lng: 2.4290, label: "Cotonou · Akpakpa" },
  { lat: 6.4530, lng: 2.3560, label: "Abomey-Calavi · Carrefour" },
  { lat: 6.4969, lng: 2.6036, label: "Porto-Novo · Place Bayol" },
  { lat: 6.3290, lng: 2.3870, label: "Cotonou · Fidjrossè Plage" },
  { lat: 6.3760, lng: 2.4090, label: "Cotonou · Étoile Rouge" },
  { lat: 6.4150, lng: 2.3490, label: "Godomey · Marché" },
  { lat: 6.4780, lng: 2.6180, label: "Porto-Novo · Ouando" },
];

/** Noms authentiquement béninois (Fon, Yoruba, Goun). */
const NAMES = [
  "Kossi Ayodélé", "Mahougnon Dossou", "Adéwalé Akplogan", "Chimène Gbégo",
  "Sègla Houénou", "Rachidatou Tchabi", "Bénédicta Zinsou", "Comlan Aïzo",
  "Florentine Hounkpatin", "Saïdou Boukari", "Olusegun Adékambi", "Mariam Lawani",
  "Wassiou Yessoufou", "Carmel Dègbédji", "Pélagie Tossou", "Hervé Sossou",
  "Aurore Agossou", "Bachirou Issa", "Damien Vodounnou", "Nadège Aholoukpè",
];

const FIRST_FEMALE = ["Chimène", "Rachidatou", "Bénédicta", "Florentine", "Mariam", "Pélagie", "Aurore", "Nadège"];

const DRIVER_DATA: Array<{ name: string; vehicleType: DriverProfile["vehicleType"]; plate: string; rating: number; rides: number }> = [
  { name: "Sègla Houénou",      vehicleType: "moto",     plate: "AB 2841 RB", rating: 4.9, rides: 1284 },
  { name: "Comlan Aïzo",        vehicleType: "moto",     plate: "AC 5172 RB", rating: 4.7, rides: 932 },
  { name: "Wassiou Yessoufou",  vehicleType: "tricycle", plate: "AD 0934 RB", rating: 4.8, rides: 671 },
  { name: "Hervé Sossou",       vehicleType: "car",      plate: "AE 3318 RB", rating: 4.9, rides: 2043 },
  { name: "Damien Vodounnou",   vehicleType: "van",      plate: "AF 7765 RB", rating: 4.6, rides: 415 },
  { name: "Bachirou Issa",      vehicleType: "truck",    plate: "AG 1102 RB", rating: 4.8, rides: 188 },
];

function avatarFor(name: string): string {
  const female = FIRST_FEMALE.some((f) => name.startsWith(f));
  const seed = encodeURIComponent(name);
  // Portraits déterministes (placeholder réaliste) — remplaçables par avatars.ts côté UI.
  return `https://i.pravatar.cc/200?u=${seed}&${female ? "women" : "men"}`;
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function uid(prefix: string): string { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

/* ─────────────────────────────────────────── */
/*  Seed                                         */
/* ─────────────────────────────────────────── */

function seed(): Db {
  const seededAt = nowIso();

  // Utilisateur démo (client connecté)
  const me: User = {
    id: "u_me",
    role: "client",
    fullName: "Dosso Adjovi",
    phone: "+22997000000",
    email: "dosso.adjovi@email.com",
    avatarUrl: avatarFor("Dosso Adjovi"),
    city: "Cotonou",
    language: "fr",
    kycStatus: "verified",
    createdAt: isoAgo(120 * 86400_000),
  };

  const users: Record<string, User> = { [me.id]: me };

  // Chauffeurs
  const drivers: Record<string, DriverProfile> = {};
  DRIVER_DATA.forEach((d, i) => {
    const id = `d_${i + 1}`;
    drivers[id] = {
      id,
      role: "driver",
      fullName: d.name,
      phone: `+229${96000000 + i * 1111}`,
      avatarUrl: avatarFor(d.name),
      city: "Cotonou",
      language: "fr",
      kycStatus: "verified",
      createdAt: isoAgo((200 + i * 10) * 86400_000),
      vehicleType: d.vehicleType,
      vehiclePlate: d.plate,
      licenseNumber: `BJ-${100000 + i * 137}`,
      rating: d.rating,
      totalRides: d.rides,
      isOnline: i % 2 === 0,
      currentLocation: PLACES[i % PLACES.length],
    };
  });

  // Wallet
  const wallets: Record<string, Wallet> = {
    [me.id]: { userId: me.id, balanceXOF: 12500, pendingXOF: 0, currency: "XOF" },
  };

  // Historique de courses
  const rides: Record<string, Ride> = {};
  const rideEvents: RideEvent[] = [];
  const services: Ride["serviceType"][] = ["taxi_moto", "delivery", "heavy_transport", "carpool"];
  for (let i = 0; i < 8; i++) {
    const id = `ride_h${i + 1}`;
    const driver = Object.values(drivers)[i % DRIVER_DATA.length];
    const origin = PLACES[i % PLACES.length];
    const destination = PLACES[(i + 3) % PLACES.length];
    const price = 800 + Math.floor(Math.random() * 12) * 250;
    const createdAt = isoAgo((i + 1) * 2 * 86400_000);
    rides[id] = {
      id,
      clientId: me.id,
      driverId: driver.id,
      serviceType: services[i % services.length],
      status: "completed",
      origin,
      destination,
      priceXOF: price,
      distanceKm: +(2 + Math.random() * 14).toFixed(1),
      durationMin: 8 + Math.floor(Math.random() * 30),
      createdAt,
      completedAt: createdAt,
    };
  }

  // Transactions
  const transactions: Transaction[] = [
    { id: uid("tx"), userId: me.id, type: "topup", method: "mtn_momo", amountXOF: 5000, status: "success", createdAt: isoAgo(3 * 86400_000), description: "Recharge MTN MoMo" },
    { id: uid("tx"), userId: me.id, type: "ride_payment", method: "wallet", amountXOF: 1500, status: "success", createdAt: isoAgo(2 * 86400_000), description: "Course Dantokpa → Ganhi" },
    { id: uid("tx"), userId: me.id, type: "referral_bonus", method: "wallet", amountXOF: 1000, status: "success", createdAt: isoAgo(86400_000), description: "Bonus parrainage" },
    { id: uid("tx"), userId: me.id, type: "topup", method: "moov_money", amountXOF: 10000, status: "success", createdAt: isoAgo(6 * 3600_000), description: "Recharge Moov Money" },
  ];

  // Notifications
  const notifications: Notification[] = [
    { id: uid("ntf"), userId: me.id, type: "promo", title: "Moov Africa x IPPOO", body: "Course offerte à chaque recharge Illimix ce week-end !", read: false, createdAt: isoAgo(2 * 3600_000) },
    { id: uid("ntf"), userId: me.id, type: "ride", title: "Course terminée", body: "Merci d'avoir voyagé avec Sègla. Notez votre course.", read: false, createdAt: isoAgo(5 * 3600_000) },
    { id: uid("ntf"), userId: me.id, type: "payment", title: "Recharge réussie", body: "+5 000 FCFA crédités sur votre portefeuille.", read: true, createdAt: isoAgo(3 * 86400_000) },
    { id: uid("ntf"), userId: me.id, type: "system", title: "Bienvenue sur IPPOO TRIIP", body: "Votre compte est vérifié. Bon voyage !", read: true, createdAt: isoAgo(120 * 86400_000) },
  ];

  // Parrainages
  const referrals: Referral[] = [
    { id: uid("ref"), referrerId: me.id, code: "DOSSOU-IPP2026", inviteeName: "Aïdatou Tokpanou", inviteePhone: "+22996221144", status: "rewarded", rewardXOF: 1000, createdAt: isoAgo(20 * 86400_000) },
    { id: uid("ref"), referrerId: me.id, code: "DOSSOU-IPP2026", inviteeName: "Fifamè Dossou", inviteePhone: "+22997334455", status: "rewarded", rewardXOF: 1000, createdAt: isoAgo(12 * 86400_000) },
    { id: uid("ref"), referrerId: me.id, code: "DOSSOU-IPP2026", inviteeName: "Gbètoho Bokossa", inviteePhone: "+22997556600", status: "registered", rewardXOF: 1000, createdAt: isoAgo(8 * 86400_000) },
    { id: uid("ref"), referrerId: me.id, code: "DOSSOU-IPP2026", inviteePhone: "+22994556677", status: "pending", rewardXOF: 1000, createdAt: isoAgo(2 * 86400_000) },
  ];

  // Commandes groupées
  const groupOrders: Record<string, GroupOrder> = {};
  const go1: GroupOrder = {
    id: "go_1",
    hostId: me.id,
    title: "Déjeuner bureau · Akpakpa",
    vendor: "Chez Maman Bénin",
    status: "open",
    deliveryFeeXOF: 1000,
    participants: [
      { userId: me.id, name: "Kossi Ayodélé", items: 2, amountXOF: 3000 },
      { userId: "u_x1", name: "Bénédicta Zinsou", items: 1, amountXOF: 1500 },
      { userId: "u_x2", name: "Saïdou Boukari", items: 3, amountXOF: 4500 },
    ],
    totalXOF: 10000,
    deadline: isoIn(2 * 3600_000),
    createdAt: isoAgo(3600_000),
  };
  groupOrders[go1.id] = go1;

  // Covoiturages
  const carpools: Record<string, CarpoolTrip> = {};
  [
    { from: "Cotonou · Étoile Rouge", to: "Porto-Novo · Ouando", driver: "Hervé Sossou", seats: 4, left: 2, price: 1500, veh: "Toyota Corolla" },
    { from: "Abomey-Calavi · Carrefour", to: "Cotonou · Ganhi", driver: "Aurore Agossou", seats: 3, left: 1, price: 800, veh: "Hyundai i10" },
    { from: "Cotonou · Cadjèhoun", to: "Bohicon", driver: "Damien Vodounnou", seats: 6, left: 5, price: 3000, veh: "Toyota Hiace" },
  ].forEach((c, i) => {
    const id = `cp_${i + 1}`;
    const fromP = PLACES.find((p) => p.label === c.from) ?? PLACES[0];
    const toP = PLACES.find((p) => p.label === c.to) ?? PLACES[5];
    carpools[id] = {
      id,
      driverId: `d_${(i % DRIVER_DATA.length) + 1}`,
      driverName: c.driver,
      origin: fromP,
      destination: { ...toP, label: c.to },
      departAt: isoIn((i + 1) * 3600_000),
      seatsTotal: c.seats,
      seatsLeft: c.left,
      pricePerSeatXOF: c.price,
      vehicle: c.veh,
      createdAt: isoAgo(3600_000),
    };
  });

  // Fret aérien
  const airFreight: Record<string, AirFreightShipment> = {
    af_1: {
      id: "af_1",
      clientId: me.id,
      fromAirport: "COO · Cotonou Cadjèhoun",
      toAirport: "LFW · Lomé",
      weightKg: 12,
      category: "parcel",
      priceXOF: 45000,
      status: "in_transit",
      trackingCode: "IPP-AF-882193",
      createdAt: isoAgo(86400_000),
    },
  };

  return {
    users, drivers, rides, rideEvents, wallets, transactions,
    notifications, referrals, groupOrders, carpools, airFreight,
    payments: {},
    meta: { seededAt },
  };
}

/* ─────────────────────────────────────────── */
/*  Persistance                                  */
/* ─────────────────────────────────────────── */

let _db: Db | null = null;

function load(): Db {
  if (_db) return _db;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      _db = JSON.parse(raw) as Db;
      return _db;
    }
  } catch { /* ignore */ }
  _db = seed();
  persist();
  return _db;
}

export function persist() {
  if (!_db) return;
  try { localStorage.setItem(DB_KEY, JSON.stringify(_db)); } catch { /* quota */ }
}

/** Accès direct à la base (mutations suivies de persist()). */
export function db(): Db {
  return load();
}

/** Réinitialise la base avec les données de seed. */
export function resetDb(): Db {
  _db = seed();
  persist();
  return _db;
}

/* ─────────────────────────────────────────── */
/*  Helpers métier réutilisés par les mocks      */
/* ─────────────────────────────────────────── */

export const helpers = {
  uid,
  rand,
  nowIso,
  isoIn,
  isoAgo,
  avatarFor,
  /** Distance approximative (Haversine simplifiée) en km. */
  distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(1);
  },
  /** Tarif estimé par type de service. */
  estimatePrice(serviceType: string, distanceKm: number): number {
    const base: Record<string, { flag: number; perKm: number }> = {
      taxi_moto: { flag: 300, perKm: 120 },
      delivery: { flag: 500, perKm: 150 },
      heavy_transport: { flag: 2000, perKm: 400 },
      group_order: { flag: 1000, perKm: 100 },
      carpool: { flag: 500, perKm: 80 },
      air_freight: { flag: 15000, perKm: 0 },
    };
    const cfg = base[serviceType] ?? base.taxi_moto;
    return Math.max(cfg.flag, Math.round((cfg.flag + cfg.perKm * distanceKm) / 50) * 50);
  },
};

export { NAMES, DRIVER_DATA };
