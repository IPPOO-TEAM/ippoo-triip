import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { SignJWT, jwtVerify, type JWTPayload } from "npm:jose";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

/* ================================================================
   IPPOO TRIIP - Backend Supabase Edge Function v3
   Stockage : Supabase Postgres (tables ippoo_triip_*)
   Auth     : JWT HS256 compatible Supabase RLS (role=authenticated)
   Realtime : Broadcast via canal user:{userId} + Realtime Postgres
   ================================================================ */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAW_SECRET   = Deno.env.get("JWT_SECRET") ?? "ippoo-triip-dev-secret-2026-changeme";
const JWT_SECRET   = new TextEncoder().encode(RAW_SECRET);
const ACCESS_TTL   = 3600;        // 1h
const REFRESH_TTL  = 7 * 86400;  // 7j
const FCM_SA_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") ?? "";
const FCM_PROJECT_ID = "ippoo-6e1de";

/* ================================================================
   SUPABASE CLIENT (service role - bypasse RLS pour le backend)
   ================================================================ */

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ================================================================
   BROADCAST REALTIME
   Notifie les clients frontend apres chaque mutation critique.
   ================================================================ */

/**
 * Diffuse un message broadcast via l'API REST Realtime de Supabase.
 * Contrairement à `supabase.channel(...).send()` — qui échoue silencieusement
 * côté serveur tant que le canal n'est pas souscrit (impossible dans une edge
 * function éphémère) — l'endpoint REST délivre de façon fiable vers tous les
 * clients abonnés au `topic` (nom de canal EXACT, ex: "user:xxx", "ippoo_triip:global").
 */
async function realtimeBroadcast(topic: string, event: string, payload: unknown) {
  try {
    const res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
    if (!res.ok) {
      console.warn(`[RT] broadcast ${topic}/${event} -> HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (e) {
    console.warn(`[RT] broadcast ${topic}/${event} failed:`, e);
  }
}

async function broadcast(userId: string, event: string, payload: unknown) {
  await realtimeBroadcast(`user:${userId}`, event, payload);
}

async function broadcastAll(event: string, payload: unknown) {
  await realtimeBroadcast("ippoo_triip:global", event, payload);
}

/* ================================================================
   HELPERS UTILITAIRES
   ================================================================ */

const uid  = (pfx: string) => `${pfx}_${crypto.randomUUID().replace(/-/g, "").slice(0, 9)}`;
const now  = () => new Date().toISOString();
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 8)  return `+229${d}`;
  if (d.startsWith("229")  && d.length >= 11) return `+${d}`;
  if (d.startsWith("00229")) return `+${d.slice(2)}`;
  return `+229${d.slice(-8)}`;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(1);
}

function estimatePrice(service: string, distKm: number): number {
  const t: Record<string, { flag: number; pk: number }> = {
    taxi_moto:       { flag: 300,   pk: 120 },
    delivery:        { flag: 500,   pk: 150 },
    heavy_transport: { flag: 2000,  pk: 400 },
    group_order:     { flag: 1000,  pk: 100 },
    carpool:         { flag: 500,   pk: 80  },
    air_freight:     { flag: 15000, pk: 0   },
  };
  const c = t[service] ?? t.taxi_moto;
  return Math.max(c.flag, Math.round((c.flag + c.pk * distKm) / 50) * 50);
}

function paginate<T>(items: T[], page = 1, ps = 20) {
  const p = Math.max(1, page);
  const s = Math.max(1, Math.min(100, ps));
  return { items: items.slice((p - 1) * s, p * s), total: items.length, page: p, pageSize: s };
}

/* ================================================================
   MAPPERS DB (snake_case <-> camelCase)
   ================================================================ */

// Postgres renvoie les timestamps au format "2026-09-02 12:34:56+00" ; le
// client attend un ISO strict avec suffixe Z. On normalise, et on convertit
// les null en undefined pour respecter les schémas Zod côté client.
const toIso = (v: any): string | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

const mapUser = (r: any) => r ? ({
  id: r.id, role: r.role, fullName: r.full_name, phone: r.phone,
  email: r.email ?? undefined, avatarUrl: r.avatar_url ?? undefined,
  city: r.city, language: r.language,
  kycStatus: r.kyc_status, kycVerifiedAt: toIso(r.kyc_verified_at),
  referralCode: r.referral_code ?? undefined,
  createdAt: toIso(r.created_at) ?? now(), updatedAt: toIso(r.updated_at),
}) : null;

const mapDriver = (r: any) => r ? ({
  ...mapUser(r),
  vehicleType: r.vehicle_type, vehiclePlate: r.vehicle_plate,
  licenseNumber: r.license_number, rating: r.rating, totalRides: r.total_rides,
  isOnline: r.is_online,
  currentLocation: r.current_lat ? { lat: r.current_lat, lng: r.current_lng, label: r.current_location_label } : undefined,
}) : null;

const mapRide = (r: any) => r ? ({
  id: r.id, clientId: r.client_id, driverId: r.driver_id,
  serviceType: r.service_type, status: r.status,
  origin: { lat: r.origin_lat, lng: r.origin_lng, label: r.origin_label },
  destination: { lat: r.destination_lat, lng: r.destination_lng, label: r.destination_label },
  priceXOF: r.price_xof, distanceKm: r.distance_km, durationMin: r.duration_min,
  scheduledAt: r.scheduled_at, notes: r.notes,
  createdAt: r.created_at, completedAt: r.completed_at,
}) : null;

const mapEvent = (r: any) => r ? ({
  id: r.id, rideId: r.ride_id, status: r.status, label: r.label,
  location: r.location_lat ? { lat: r.location_lat, lng: r.location_lng } : undefined,
  at: r.created_at,
}) : null;

const mapTx = (r: any) => r ? ({
  id: r.id, userId: r.user_id, type: r.type, method: r.method,
  amountXOF: r.amount_xof, status: r.status, reference: r.reference,
  rideId: r.ride_id, description: r.description, createdAt: r.created_at,
}) : null;

const mapNotif = (r: any) => r ? ({
  id: r.id, userId: r.user_id, type: r.type, title: r.title,
  body: r.body, read: r.read, metadata: r.metadata, createdAt: r.created_at,
}) : null;

const mapWallet = (r: any) => r ? ({
  userId: r.user_id, balanceXOF: r.balance_xof,
  pendingXOF: r.pending_xof, currency: r.currency,
}) : null;

const mapCarpool = (r: any) => r ? ({
  id: r.id, driverId: r.driver_id, driverName: r.driver_name,
  origin: { lat: r.origin_lat, lng: r.origin_lng, label: r.origin_label },
  destination: { lat: r.destination_lat, lng: r.destination_lng, label: r.destination_label },
  departAt: r.depart_at, seatsTotal: r.seats_total, seatsLeft: r.seats_left,
  pricePerSeatXOF: r.price_per_seat_xof, vehicle: r.vehicle, createdAt: r.created_at,
}) : null;

const mapAF = (r: any) => r ? ({
  id: r.id, clientId: r.client_id, fromAirport: r.from_airport, toAirport: r.to_airport,
  weightKg: r.weight_kg, category: r.category, priceXOF: r.price_xof,
  status: r.status, trackingCode: r.tracking_code, createdAt: r.created_at,
}) : null;

/* ================================================================
   DB LAYER -- helpers Postgres
   ================================================================ */

async function dbUserById(id: string) {
  const { data } = await supabase.from("ippoo_triip_users").select("*").eq("id", id).maybeSingle();
  return mapUser(data);
}

async function dbUserByPhone(phone: string) {
  const { data } = await supabase.from("ippoo_triip_users").select("*").eq("phone", phone).maybeSingle();
  return mapUser(data);
}

async function dbUpsertUser(u: any) {
  const row = {
    id: u.id, role: u.role, full_name: u.fullName, phone: u.phone,
    email: u.email ?? null, avatar_url: u.avatarUrl ?? null,
    city: u.city ?? "Cotonou", language: u.language ?? "fr",
    kyc_status: u.kycStatus ?? "pending",
    kyc_verified_at: u.kycVerifiedAt ?? null,
    referral_code: u.referralCode ?? null,
  };
  const { error } = await supabase.from("ippoo_triip_users").upsert(row);
  if (error) throw new Error(error.message);
}

async function dbGetDriverFull(id: string) {
  const { data: u } = await supabase.from("ippoo_triip_users").select("*").eq("id", id).maybeSingle();
  const { data: d } = await supabase.from("ippoo_triip_drivers").select("*").eq("id", id).maybeSingle();
  if (!u) return null;
  return mapDriver({ ...u, ...d });
}

async function dbGetAllDrivers() {
  const { data } = await supabase
    .from("ippoo_triip_users").select("*, ippoo_triip_drivers(*)")
    .eq("role", "driver");
  return (data ?? []).map((r: any) => mapDriver({ ...r, ...r.ippoo_triip_drivers }));
}

async function dbGetOnlineDrivers(serviceType?: string) {
  const vehicleMap: Record<string, string> = {
    taxi_moto: "moto", delivery: "moto", heavy_transport: "truck", carpool: "car",
  };
  let q = supabase.from("ippoo_triip_drivers").select("*, ippoo_triip_users!inner(*)").eq("is_online", true);
  if (serviceType && vehicleMap[serviceType]) {
    q = q.eq("vehicle_type", vehicleMap[serviceType]);
  }
  const { data } = await q;
  return (data ?? []).map((r: any) => mapDriver({ ...r.ippoo_triip_users, ...r }));
}

async function dbUpsertDriver(d: any) {
  await dbUpsertUser(d);
  const row = {
    id: d.id, vehicle_type: d.vehicleType, vehicle_plate: d.vehiclePlate,
    license_number: d.licenseNumber ?? null, rating: d.rating ?? 5.0,
    total_rides: d.totalRides ?? 0, is_online: d.isOnline ?? false,
    current_lat: d.currentLocation?.lat ?? null,
    current_lng: d.currentLocation?.lng ?? null,
    current_location_label: d.currentLocation?.label ?? null,
  };
  const { error } = await supabase.from("ippoo_triip_drivers").upsert(row);
  if (error) throw new Error(error.message);
}

async function dbGetWallet(userId: string) {
  const { data } = await supabase.from("ippoo_triip_wallets").select("*").eq("user_id", userId).maybeSingle();
  return mapWallet(data) ?? { userId, balanceXOF: 0, pendingXOF: 0, currency: "XOF" };
}

async function dbSetWallet(w: any) {
  const { error } = await supabase.from("ippoo_triip_wallets").upsert({
    user_id: w.userId, balance_xof: w.balanceXOF, pending_xof: w.pendingXOF ?? 0, currency: "XOF",
  });
  if (error) throw new Error(error.message);
}

async function dbGetRide(id: string) {
  const { data } = await supabase.from("ippoo_triip_rides").select("*").eq("id", id).maybeSingle();
  return mapRide(data);
}

async function dbSetRide(ride: any) {
  const row = {
    id: ride.id, client_id: ride.clientId, driver_id: ride.driverId ?? null,
    service_type: ride.serviceType, status: ride.status,
    origin_lat: ride.origin?.lat, origin_lng: ride.origin?.lng, origin_label: ride.origin?.label ?? null,
    destination_lat: ride.destination?.lat, destination_lng: ride.destination?.lng,
    destination_label: ride.destination?.label ?? null,
    price_xof: ride.priceXOF, distance_km: ride.distanceKm ?? null,
    duration_min: ride.durationMin ?? null, scheduled_at: ride.scheduledAt ?? null,
    notes: ride.notes ?? null, created_at: ride.createdAt, completed_at: ride.completedAt ?? null,
  };
  const { error } = await supabase.from("ippoo_triip_rides").upsert(row);
  if (error) throw new Error(error.message);
}

async function dbGetUserRides(userId: string, statusFilter?: string, serviceFilter?: string) {
  let q = supabase.from("ippoo_triip_rides").select("*")
    .or(`client_id.eq.${userId},driver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (statusFilter) q = q.eq("status", statusFilter);
  if (serviceFilter) q = q.eq("service_type", serviceFilter);
  const { data } = await q;
  return (data ?? []).map(mapRide);
}

async function dbAddRideEvent(ev: any) {
  const { error } = await supabase.from("ippoo_triip_ride_events").insert({
    id: ev.id, ride_id: ev.rideId, status: ev.status, label: ev.label,
    location_lat: ev.location?.lat ?? null, location_lng: ev.location?.lng ?? null,
  });
  if (error) throw new Error(error.message);
}

async function dbGetRideEvents(rideId: string) {
  const { data } = await supabase.from("ippoo_triip_ride_events")
    .select("*").eq("ride_id", rideId).order("created_at", { ascending: true });
  return (data ?? []).map(mapEvent);
}

async function dbAddTransaction(tx: any) {
  const { error } = await supabase.from("ippoo_triip_transactions").insert({
    id: tx.id, user_id: tx.userId, type: tx.type, method: tx.method,
    amount_xof: tx.amountXOF, status: tx.status ?? "success",
    reference: tx.reference ?? null, ride_id: tx.rideId ?? null, description: tx.description ?? null,
  });
  if (error) throw new Error(error.message);
}

async function dbGetTransactions(userId: string) {
  const { data } = await supabase.from("ippoo_triip_transactions")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(mapTx);
}

async function dbAddNotification(n: any) {
  const { error } = await supabase.from("ippoo_triip_notifications").insert({
    id: n.id, user_id: n.userId, type: n.type ?? "system",
    title: n.title, body: n.body, read: false, metadata: n.metadata ?? null,
  });
  if (error) throw new Error(error.message);
}

async function dbGetNotifications(userId: string) {
  const { data } = await supabase.from("ippoo_triip_notifications")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  return (data ?? []).map(mapNotif);
}

/* ================================================================
   FCM -- Firebase Cloud Messaging helpers
   ================================================================ */

async function dbSaveFcmToken(userId: string, token: string, platform: string, userAgent: string) {
  await supabase.from("ippoo_triip_fcm_tokens").upsert({
    user_id: userId, token, platform, user_agent: userAgent,
    updated_at: now(),
  }, { onConflict: "token" });
}

async function dbRemoveFcmToken(userId: string) {
  await supabase.from("ippoo_triip_fcm_tokens").delete().eq("user_id", userId);
}

async function dbGetFcmTokens(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const { data } = await supabase.from("ippoo_triip_fcm_tokens")
    .select("token").in("user_id", userIds);
  return (data ?? []).map((r: any) => r.token);
}

async function dbGetAllFcmTokens(target: "all" | "clients" | "drivers"): Promise<string[]> {
  let q = supabase.from("ippoo_triip_fcm_tokens").select("token, ippoo_triip_users!inner(role)");
  if (target === "clients") q = (q as any).eq("ippoo_triip_users.role", "client");
  if (target === "drivers") q = (q as any).eq("ippoo_triip_users.role", "driver");
  const { data } = await q;
  return (data ?? []).map((r: any) => r.token);
}

/* ---------------------------------------------------------------
   FCM v1 HTTP API — authentification via Service Account (OAuth2)
--------------------------------------------------------------- */

let _fcmToken = "";
let _fcmTokenExpiry = 0;

async function getFcmAccessToken(): Promise<string> {
  if (_fcmToken && Date.now() < _fcmTokenExpiry) return _fcmToken;
  if (!FCM_SA_JSON) return "";
  try {
    const sa = JSON.parse(FCM_SA_JSON);
    const nowSec = Math.floor(Date.now() / 1000);
    const header  = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    };
    const b64url = (obj: object) =>
      btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signingInput = `${b64url(header)}.${b64url(payload)}`;
    const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
    const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8", keyData.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false, ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5", cryptoKey,
      new TextEncoder().encode(signingInput),
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${signingInput}.${sigB64}`;
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tok = await resp.json().catch(() => ({}));
    if (!resp.ok || !tok.access_token) {
      // N'écrit PAS le cache sur échec (sinon on renverrait un token vide encore valide)
      console.error(`[FCM] OAuth token error ${resp.status}:`, JSON.stringify(tok));
      return "";
    }
    _fcmToken = tok.access_token;
    // Expiration basée sur expires_in réel (marge 5 min), défaut 50 min
    const ttlSec = typeof tok.expires_in === "number" ? tok.expires_in : 3600;
    _fcmTokenExpiry = Date.now() + Math.max(60, ttlSec - 300) * 1000;
    return _fcmToken;
  } catch (e) {
    console.error("[FCM] getAccessToken error:", e);
    return "";
  }
}

const APP_URL = "https://ippootransport.figma.site";

type FcmResult = { configured: boolean; attempted: number; sent: number; failed: number; reason?: string };

async function sendFcmPush(
  tokens: string[], title: string, body: string, data?: Record<string, string>,
): Promise<FcmResult> {
  if (!FCM_SA_JSON) return { configured: false, attempted: 0, sent: 0, failed: 0, reason: "FCM_SERVICE_ACCOUNT_JSON manquant" };
  if (!tokens.length) return { configured: true, attempted: 0, sent: 0, failed: 0, reason: "aucun token" };
  const accessToken = await getFcmAccessToken();
  if (!accessToken) { console.warn("[FCM] Pas de access token — push annulé"); return { configured: true, attempted: 0, sent: 0, failed: 0, reason: "access token OAuth indisponible (service account invalide ?)" }; }

  const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

  // Message DATA-ONLY : pas de bloc `notification`, sinon la push service du
  // navigateur affiche automatiquement ET le Service Worker réaffiche via
  // showNotification → notification en double. En data-only, le SW est le seul
  // point de rendu (et peut auto-remplir l'OTP). Toutes les valeurs data
  // doivent être des strings (spec FCM v1).
  const safeData: Record<string, string> = { title, body };
  for (const [k, v] of Object.entries(data ?? {})) safeData[k] = String(v);

  const buildMessage = (token: string) => ({
    message: {
      token,
      // webpush config selon spec FCM v1 REST — pas de bloc notification ici
      webpush: {
        headers: { Urgency: "high" },
        // fcm_options.link = URL ouverte au clic sur la notification (spec FCM v1)
        fcm_options: { link: safeData.url ?? APP_URL },
      },
      data: safeData,
    },
  });

  // Codes d'erreur FCM indiquant un token définitivement invalide → à supprimer.
  const isDeadToken = (status: number, errCode?: string) =>
    status === 404 || errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT";

  const deadTokens: string[] = [];
  let sent = 0, failed = 0, lastReason: string | undefined;
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) chunks.push(tokens.slice(i, i + 100));

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(async (token) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(buildMessage(token)),
        });
        if (!res.ok) {
          failed++;
          const err = await res.json().catch(() => ({}));
          const errCode = err?.error?.details?.[0]?.errorCode ?? err?.error?.status;
          lastReason = `FCM ${res.status} ${errCode ?? ""}`.trim();
          if (isDeadToken(res.status, errCode)) deadTokens.push(token);
          console.error(`[FCM] Erreur ${res.status} pour token ${token.slice(0, 20)}…:`, JSON.stringify(err));
        } else {
          sent++;
        }
      } catch (e) {
        failed++;
        lastReason = "erreur réseau";
        console.error("[FCM] Erreur réseau:", e);
      }
    }));
  }

  // Purge des tokens morts pour ne plus jamais les réessayer.
  if (deadTokens.length) {
    for (let i = 0; i < deadTokens.length; i += 100) {
      const batch = deadTokens.slice(i, i + 100);
      await supabase.from("ippoo_triip_fcm_tokens").delete().in("token", batch);
    }
    console.log(`[FCM] ${deadTokens.length} token(s) mort(s) supprimé(s)`);
  }

  return { configured: true, attempted: tokens.length, sent, failed, reason: sent ? undefined : lastReason };
}

async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata?: any,
  data?: Record<string, string>
) {
  // 1. Save in-app notification to DB
  await dbAddNotification({ id: uid("notif"), userId, type, title, body, metadata });
  // 2. Broadcast realtime to frontend
  await broadcast(userId, "notification", { type, title, body, metadata });
  // 3. Send FCM push
  const tokens = await dbGetFcmTokens([userId]);
  await sendFcmPush(tokens, title, body, data);
}

/* ================================================================
   JWT -- Compatible Supabase RLS (role=authenticated, sub=userId)
   ================================================================ */

interface TokenPayload extends JWTPayload {
  sub: string;
  ippoo_triip_role: string;
  jti?: string;
}

async function signAccess(userId: string, ippooTriipRole: string): Promise<string> {
  return new SignJWT({ sub: userId, role: "authenticated", ippoo_triip_role: ippooTriipRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(JWT_SECRET);
}

async function signRefresh(userId: string, ippooTriipRole: string): Promise<string> {
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ sub: userId, ippoo_triip_role: ippooTriipRole, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL}s`)
    .sign(JWT_SECRET);
  await supabase.from("ippoo_triip_refresh_tokens").insert({
    jti, user_id: userId, expires_at: isoIn(REFRESH_TTL * 1000),
  });
  return token;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as TokenPayload;
}

/* ================================================================
   RIDE PROGRESSION (sans etat serveur - calcul par timestamp)
   ================================================================ */

const RIDE_TIMELINE = [
  { at: 0,  status: "requested",   label: "Recherche d'un chauffeur" },
  { at: 6,  status: "accepted",    label: "Chauffeur trouve" },
  { at: 14, status: "arriving",    label: "Le chauffeur arrive" },
  { at: 26, status: "in_progress", label: "Course en cours" },
  { at: 70, status: "completed",   label: "Course terminee" },
];

async function advanceRide(ride: any): Promise<any> {
  if (!ride || ride.status === "cancelled" || ride.status === "completed") return ride;
  const elapsed = (Date.now() - new Date(ride.createdAt).getTime()) / 1000;
  let target = RIDE_TIMELINE[0];
  for (const step of RIDE_TIMELINE) if (elapsed >= step.at) target = step;
  if (target.status === ride.status) return ride;

  const prevStatus = ride.status;
  ride.status = target.status;

  if (!ride.driverId && target.status !== "requested") {
    const drivers = await dbGetOnlineDrivers();
    ride.driverId = drivers[0]?.id ?? "d_1";
  }
  if (target.status === "completed") ride.completedAt = now();

  if (prevStatus !== target.status) {
    await dbAddRideEvent({
      id: uid("ev"), rideId: ride.id, status: target.status, label: target.label,
    });

    // FCM + in-app push notifications per status transition
    if (target.status === "accepted") {
      await notifyUser(ride.clientId, "ride", "Chauffeur trouvé !", "Votre chauffeur arrive", { rideId: ride.id });
    } else if (target.status === "arriving") {
      await notifyUser(ride.clientId, "ride", "Votre chauffeur est arrivé", "Votre chauffeur est en bas", { rideId: ride.id });
    } else if (target.status === "in_progress") {
      await notifyUser(ride.clientId, "ride", "Course démarrée", "Votre course est en cours", { rideId: ride.id });
    }
  }

  if (target.status === "completed") {
    const wallet = await dbGetWallet(ride.clientId);
    if (wallet.balanceXOF >= ride.priceXOF) {
      wallet.balanceXOF -= ride.priceXOF;
      await dbSetWallet(wallet);
    }
    await dbAddTransaction({
      id: uid("tx"), userId: ride.clientId, type: "ride_payment",
      method: "wallet", amountXOF: ride.priceXOF, status: "success",
      rideId: ride.id, description: `Course ${ride.origin?.label ?? ""} - ${ride.destination?.label ?? ""}`.trim(),
    });
    await notifyUser(
      ride.clientId, "ride", "Course terminée",
      "Merci d'avoir voyagé avec IPPOO TRIIP. Notez votre course.",
      { rideId: ride.id }
    );
    if (ride.driverId) {
      await notifyUser(
        ride.driverId, "ride", "Paiement reçu",
        "Le paiement de votre course a été crédité.", { rideId: ride.id }
      );
    }
    await broadcast(ride.clientId, "wallet:update", await dbGetWallet(ride.clientId));
  }

  await dbSetRide(ride);
  await broadcast(ride.clientId, "ride:update", ride);
  if (ride.driverId) await broadcast(ride.driverId, "ride:update", ride);
  return ride;
}

/* ================================================================
   APP HONO
   ================================================================ */

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "x-ippoo-authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "Content-Range"],
  maxAge: 600,
}));

/* ================================================================
   MIDDLEWARE AUTH
   ================================================================ */

/* Parse JSON body quel que soit le Content-Type (text/plain inclus pour éviter le preflight CORS) */
async function parseBody(c: any): Promise<any> {
  try { return await c.req.json(); } catch {}
  try { const t = await c.req.text(); return JSON.parse(t); } catch {}
  return {};
}

async function requireAuth(c: any, next: any) {
  // Le token utilisateur arrive dans `x-ippoo-authorization` (le header
  // Authorization portant la clé anon pour satisfaire la passerelle Supabase).
  // On retombe sur Authorization pour compatibilité si le header dédié est absent.
  const auth = c.req.header("x-ippoo-authorization") ?? c.req.header("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return c.json({ code: "UNAUTHORIZED", message: "Token manquant" }, 401);
  }
  try {
    const p = await verifyToken(auth.slice(7));
    c.set("userId", p.sub);
    c.set("userRole", p.ippoo_triip_role ?? (p as any).role);
    await next();
  } catch {
    return c.json({ code: "TOKEN_INVALID", message: "Token invalide ou expire" }, 401);
  }
}

async function requireAdmin(c: any, next: any) {
  if (c.get("userRole") !== "admin") return c.json({ code: "FORBIDDEN" }, 403);
  await next();
}
async function requireDriver(c: any, next: any) {
  const r = c.get("userRole");
  if (r !== "driver" && r !== "admin") return c.json({ code: "FORBIDDEN" }, 403);
  await next();
}

/* ================================================================
   HEALTH
   ================================================================ */

// Route racine — servie à /make-server-25867276/health après le montage sous
// le préfixe de la fonction (voir bas de fichier).
app.get("/health", (c) =>
  c.json({ status: "ok", version: "3.0.0-postgres" }));

/* ================================================================
   AUTH
   ================================================================ */

app.post("/auth/otp/request", async (c) => {
  const body = await parseBody(c);
  if (!body.phone) return c.json({ code: "PHONE_REQUIRED" }, 400);

  /* Normalisation flexible : accepte tous les pays (BJ, NE, NG, CI, GH…) */
  const rawPhone = String(body.phone).replace(/\s/g, "");
  const phone = rawPhone.startsWith("+") ? rawPhone : normalizePhone(rawPhone);
  if (phone.length < 8 || !/^\+\d{7,15}$/.test(phone)) {
    return c.json({ code: "PHONE_INVALID", message: "Numero de telephone invalide" }, 400);
  }

  /* Rate limiting */
  const rateKey = `otp:${phone}`;
  const { data: rl } = await supabase.from("ippoo_triip_rate_limits").select("*").eq("key", rateKey).maybeSingle();
  const resetAt = new Date(rl?.reset_at ?? 0);
  if (rl && resetAt > new Date() && rl.count >= 5) {
    return c.json({ code: "RATE_LIMITED", message: "Trop de demandes. Attendez 10 minutes." }, 429);
  }
  if (!rl || resetAt <= new Date()) {
    await supabase.from("ippoo_triip_rate_limits").upsert({ key: rateKey, count: 1, reset_at: isoIn(600_000) });
  } else {
    await supabase.from("ippoo_triip_rate_limits").update({ count: rl.count + 1 }).eq("key", rateKey);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await supabase.from("ippoo_triip_otps").upsert({
    phone, code, attempts: 0, expires_at: isoIn(300_000),
  });

  /* Envoi OTP par notification push FCM sur l'appareil demandeur */
  const deviceToken = body.fcmToken ? String(body.fcmToken) : null;
  let push: FcmResult | null = null;
  if (deviceToken) {
    push = await sendFcmPush(
      [deviceToken],
      "Votre code IPPOO TRIIP",
      `Code de verification : ${code}`,
      { type: "otp", code, phone },
    );
  }

  const delivered = !!push && push.sent > 0;
  console.log(`[OTP] ${phone} -> ${code}${deviceToken ? (delivered ? " (push envoye)" : ` (push ECHEC: ${push?.reason ?? "?"})`) : " (pas de token FCM)"}`);
  return c.json({
    ok: true,
    message: delivered ? "Code envoye par notification" : "Code envoye",
    // Diagnostic push (visible dans l'onglet réseau) : permet de savoir si l'OTP
    // a réellement été poussé, et sinon pourquoi (secret manquant, token mort…).
    push: push ?? { configured: !!deviceToken, attempted: 0, sent: 0, failed: 0, reason: "aucun token FCM fourni par le client" },
  });
});

app.post("/auth/otp/verify", async (c) => {
  const body = await parseBody(c);
  if (!body.phone || !body.otp) return c.json({ code: "MISSING_FIELDS" }, 400);

  const rawPhone = String(body.phone).replace(/\s/g, "");
  const phone = rawPhone.startsWith("+") ? rawPhone : normalizePhone(rawPhone);
  const otp   = String(body.otp).trim().replace(/\D/g, "");
  if (!/^\d{6}$/.test(otp)) return c.json({ code: "OTP_INVALID", message: "Code 6 chiffres requis" }, 401);

  /* Verification stricte — plus de mode demo */
  const { data: otpRow } = await supabase.from("ippoo_triip_otps").select("*").eq("phone", phone).maybeSingle();
  if (!otpRow) {
    return c.json({ code: "OTP_NOT_FOUND", message: "Aucun code demande pour ce numero. Recommencez." }, 401);
  }
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from("ippoo_triip_otps").delete().eq("phone", phone);
    return c.json({ code: "OTP_EXPIRED", message: "Code expire. Demandez un nouveau code." }, 401);
  }
  if (otpRow.attempts >= 5) {
    return c.json({ code: "OTP_TOO_MANY", message: "Trop de tentatives. Demandez un nouveau code." }, 401);
  }
  if (otpRow.code !== otp) {
    await supabase.from("ippoo_triip_otps").update({ attempts: otpRow.attempts + 1 }).eq("phone", phone);
    const left = 5 - (otpRow.attempts + 1);
    return c.json({ code: "OTP_WRONG", message: `Code incorrect. ${left} tentative(s) restante(s).` }, 401);
  }
  await supabase.from("ippoo_triip_otps").delete().eq("phone", phone);

  // Get or create user
  let user = await dbUserByPhone(phone);
  if (!user) {
    const role = body.role === "driver" ? "driver" : "client";
    user = {
      id: uid("u"), role, fullName: body.fullName ?? "Utilisateur IPPOO",
      phone, city: body.city ?? "Cotonou", language: "fr",
      kycStatus: "pending", createdAt: now(),
    };
    await dbUpsertUser(user);
    await dbSetWallet({ userId: user.id, balanceXOF: 0, pendingXOF: 0 });
    if (role === "driver") {
      await dbUpsertDriver({
        ...user, vehicleType: body.vehicleType ?? "moto",
        vehiclePlate: body.vehiclePlate ?? "", licenseNumber: body.licenseNumber ?? "",
        isOnline: false, rating: 5.0, totalRides: 0,
      });
    }
  }

  /* Lier le FCM token de l'appareil au compte utilisateur */
  const deviceToken = body.fcmToken ? String(body.fcmToken) : null;
  if (deviceToken) {
    await dbSaveFcmToken(user.id, deviceToken, body.platform ?? "web", body.userAgent ?? "");
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccess(user.id, user.role),
    signRefresh(user.id, user.role),
  ]);

  return c.json({
    accessToken, refreshToken,
    expiresAt: Date.now() + ACCESS_TTL * 1000,
    user,
  });
});

/**
 * Connexion administrateur dédiée par email + mot de passe.
 * Les identifiants sont fournis via les secrets Supabase ADMIN_EMAIL et
 * ADMIN_PASSWORD (Edge Function → Secrets). Aucun OTP : l'admin obtient
 * directement une session avec le rôle "admin".
 */
app.post("/auth/admin/login", async (c) => {
  const body = await parseBody(c);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") ?? "").trim().toLowerCase();
  const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return c.json({
      code: "ADMIN_NOT_CONFIGURED",
      message: "Connexion admin indisponible : configurez les secrets ADMIN_EMAIL et ADMIN_PASSWORD.",
    }, 503);
  }
  if (!email || !password) {
    return c.json({ code: "MISSING_FIELDS", message: "Email et mot de passe requis" }, 400);
  }
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return c.json({ code: "ADMIN_INVALID", message: "Email ou mot de passe incorrect" }, 401);
  }

  // Récupère (ou crée) le compte admin correspondant à cet email.
  const { data: existing } = await supabase
    .from("ippoo_triip_users").select("*").eq("email", email).eq("role", "admin").maybeSingle();
  let user = mapUser(existing);
  if (!user) {
    user = {
      id: uid("u"), role: "admin",
      fullName: body.fullName ?? "Administrateur IPPOO",
      // Téléphone synthétique valide (non utilisé pour l'OTP) — l'admin
      // s'authentifie uniquement par email/mot de passe.
      phone: "+22900000000",
      email, city: "Cotonou", language: "fr",
      kycStatus: "verified", kycVerifiedAt: now(), createdAt: now(),
    };
    await dbUpsertUser(user);
    await dbSetWallet({ userId: user.id, balanceXOF: 0, pendingXOF: 0 });
  }

  // Lier le FCM token de l'appareil (pour recevoir les notifications admin).
  const deviceToken = body.fcmToken ? String(body.fcmToken) : null;
  if (deviceToken) {
    await dbSaveFcmToken(user.id, deviceToken, body.platform ?? "web", body.userAgent ?? "");
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccess(user.id, "admin"),
    signRefresh(user.id, "admin"),
  ]);

  return c.json({
    accessToken, refreshToken,
    expiresAt: Date.now() + ACCESS_TTL * 1000,
    user,
  });
});

/**
 * Diagnostic (public, sans valeurs sensibles) : indique si les secrets admin
 * sont bien lus par le runtime de l'edge function. Permet de confirmer après
 * un déploiement sans jamais exposer l'email ni le mot de passe.
 */
app.get("/auth/admin/config-check", (c) => {
  return c.json({
    adminEmailConfigured: !!(Deno.env.get("ADMIN_EMAIL") ?? "").trim(),
    adminPasswordConfigured: !!(Deno.env.get("ADMIN_PASSWORD") ?? ""),
  });
});

app.post("/auth/refresh", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.refreshToken) return c.json({ code: "TOKEN_REQUIRED" }, 400);
  try {
    const p = await verifyToken(body.refreshToken) as TokenPayload;
    const jti = p.jti;
    if (jti) {
      const { data: rt } = await supabase.from("ippoo_triip_refresh_tokens").select("*").eq("jti", jti).maybeSingle();
      if (!rt) return c.json({ code: "TOKEN_REVOKED" }, 401);
      await supabase.from("ippoo_triip_refresh_tokens").delete().eq("jti", jti);
    }
    const user = await dbUserById(p.sub!);
    if (!user) return c.json({ code: "USER_NOT_FOUND" }, 404);
    const [accessToken, refreshToken] = await Promise.all([
      signAccess(user.id, user.role),
      signRefresh(user.id, user.role),
    ]);
    return c.json({ accessToken, refreshToken, expiresAt: Date.now() + ACCESS_TTL * 1000 });
  } catch {
    return c.json({ code: "TOKEN_INVALID" }, 401);
  }
});

app.post("/auth/logout", requireAuth, async (c) => c.json({ ok: true }));

/* ================================================================
   USERS
   ================================================================ */

app.get("/users/me", requireAuth, async (c) => {
  const user = await dbUserById(c.get("userId"));
  if (!user) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(user);
});

app.patch("/users/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const user = await dbUserById(userId);
  if (!user) return c.json({ code: "NOT_FOUND" }, 404);
  const { id: _i, role: _r, phone: _p, ...safe } = body;
  const updated = { ...user, ...safe, id: userId, role: user.role, phone: user.phone };
  await dbUpsertUser(updated);
  return c.json(updated);
});

app.post("/users/me/kyc", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await dbUserById(userId);
  if (!user) return c.json({ code: "NOT_FOUND" }, 404);
  await supabase.from("ippoo_triip_users")
    .update({ kyc_status: "verified", kyc_verified_at: now() }).eq("id", userId);
  return c.json({ status: "verified" });
});

/* ================================================================
   DRIVERS
   ================================================================ */

app.get("/drivers/nearby", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "6.3654");
  const lng = parseFloat(c.req.query("lng") ?? "2.4183");
  const serviceType = c.req.query("serviceType") ?? "";

  const drivers = await dbGetOnlineDrivers(serviceType);
  const enriched = drivers
    .filter((d) => d != null)
    .map((d) => ({
      ...d,
      etaMin: Math.max(1, Math.round(
        haversineKm({ lat, lng }, d!.currentLocation ?? { lat, lng }) * 2.5
      )),
    }))
    .sort((a, b) => a.etaMin - b.etaMin);
  return c.json(enriched);
});

app.get("/drivers/:id", async (c) => {
  const d = await dbGetDriverFull(c.req.param("id"));
  if (!d) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(d);
});

/* ================================================================
   RIDES
   ================================================================ */

app.post("/rides/estimate", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const origin = body.origin ?? { lat: 6.3654, lng: 2.4183 };
  const destination = body.destination ?? { lat: 6.3580, lng: 2.4290 };
  const dist = haversineKm(origin, destination);
  return c.json({
    distanceKm: dist,
    durationMin: Math.round(dist * 3 + 4),
    priceXOF: estimatePrice(body.serviceType ?? "taxi_moto", dist),
  });
});

app.post("/rides", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  if (!body.origin || !body.destination) return c.json({ code: "MISSING_FIELDS" }, 400);

  const dist = body.distanceKm ?? haversineKm(body.origin, body.destination);
  const ride = {
    id: uid("ride"), clientId: userId, driverId: null,
    serviceType: body.serviceType ?? "taxi_moto", status: "requested",
    origin: body.origin, destination: body.destination,
    priceXOF: body.priceXOF ?? estimatePrice(body.serviceType ?? "taxi_moto", dist),
    distanceKm: dist, durationMin: body.durationMin ?? Math.round(dist * 3 + 4),
    scheduledAt: body.scheduledAt ?? null, notes: body.notes ?? null,
    createdAt: now(), completedAt: null,
  };

  await dbSetRide(ride);
  await dbAddRideEvent({ id: uid("ev"), rideId: ride.id, status: "requested", label: "Recherche d'un chauffeur" });
  await broadcast(userId, "ride:new", ride);
  return c.json(ride, 201);
});

app.get("/rides", requireAuth, async (c) => {
  const userId = c.get("userId");
  const page = parseInt(c.req.query("page") ?? "1");
  const pageSize = parseInt(c.req.query("pageSize") ?? "20");
  const list = await dbGetUserRides(userId, c.req.query("status"), c.req.query("serviceType"));

  const driverMap: Record<string, any> = {};
  const driverIds = [...new Set(list.map((r) => r!.driverId).filter(Boolean))];
  for (const did of driverIds) {
    const d = await dbGetDriverFull(did!);
    if (d) driverMap[did!] = d;
  }

  const enriched = list.map((r) => {
    const dr = r!.driverId ? driverMap[r!.driverId] : undefined;
    return { ...r, driverName: dr?.fullName ?? "", driverRating: dr?.rating ?? 0, vehicle: dr?.vehiclePlate ?? "" };
  });
  return c.json(paginate(enriched, page, pageSize));
});

const VEHICLE_LABEL: Record<string, string> = {
  moto: "Moto", tricycle: "Tricycle", car: "Voiture", van: "Mini-bus", truck: "Camion",
};

app.get("/rides/:id", requireAuth, async (c) => {
  const ride = await dbGetRide(c.req.param("id"));
  if (!ride) return c.json({ code: "NOT_FOUND" }, 404);
  const advanced = await advanceRide(ride);
  const dr = advanced.driverId
    ? await dbGetDriverFull(advanced.driverId)
    : (await dbGetOnlineDrivers())[0];
  return c.json({
    ...advanced,
    driverName: dr?.fullName ?? "",
    driverPlate: dr?.vehiclePlate ?? "",
    driverRating: dr?.rating ?? 0,
    driverTrips: dr?.totalRides ?? 0,
    driverVehicle: dr ? (VEHICLE_LABEL[dr.vehicleType] ?? dr.vehicleType) : "",
  });
});

app.get("/rides/:id/events", requireAuth, async (c) => {
  const ride = await dbGetRide(c.req.param("id"));
  if (ride) await advanceRide(ride);
  return c.json(await dbGetRideEvents(c.req.param("id")));
});

app.post("/rides/:id/cancel", requireAuth, async (c) => {
  const ride = await dbGetRide(c.req.param("id"));
  if (!ride) return c.json({ code: "NOT_FOUND" }, 404);
  if (ride.status === "completed") return c.json({ code: "ALREADY_COMPLETED" }, 409);
  ride.status = "cancelled";
  await dbSetRide(ride);
  await dbAddRideEvent({ id: uid("ev"), rideId: ride.id, status: "cancelled", label: "Course annulee" });
  await broadcast(ride.clientId, "ride:update", ride);
  // Notify client and driver of cancellation
  await notifyUser(ride.clientId, "ride", "Course annulée", "Votre course a été annulée.", { rideId: ride.id });
  if (ride.driverId) {
    await notifyUser(ride.driverId, "ride", "Course annulée", "La course a été annulée par le client.", { rideId: ride.id });
  }
  return c.json(ride);
});

app.post("/rides/:id/rate", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const ride = await dbGetRide(c.req.param("id"));
  if (!ride) return c.json({ code: "NOT_FOUND" }, 404);
  if (ride.driverId) {
    const { data: dr } = await supabase.from("ippoo_triip_drivers").select("*").eq("id", ride.driverId).maybeSingle();
    if (dr) {
      const rating = Math.max(1, Math.min(5, Number(body.rating ?? 5)));
      const newRating = +((dr.rating * dr.total_rides + rating) / (dr.total_rides + 1)).toFixed(2);
      await supabase.from("ippoo_triip_drivers").update({ rating: newRating, total_rides: dr.total_rides + 1 }).eq("id", ride.driverId);
    }
  }
  return c.json({ ok: true, rating: body.rating ?? 5 });
});

/* ================================================================
   WALLET & TRANSACTIONS
   ================================================================ */

app.get("/wallet/me", requireAuth, async (c) => {
  return c.json(await dbGetWallet(c.get("userId")));
});

app.get("/wallet/transactions", requireAuth, async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const ps   = parseInt(c.req.query("pageSize") ?? "20");
  return c.json(paginate(await dbGetTransactions(c.get("userId")), page, ps));
});

app.post("/wallet/topup", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const amount = Number(body.amountXOF ?? 0);
  if (amount < 100)    return c.json({ code: "AMOUNT_MIN", message: "100 XOF minimum" }, 400);
  if (amount > 500000) return c.json({ code: "AMOUNT_MAX", message: "500 000 XOF maximum" }, 400);

  const wallet = await dbGetWallet(userId);
  wallet.balanceXOF += amount;
  await dbSetWallet(wallet);

  const tx = {
    id: uid("tx"), userId, type: "topup", method: body.method ?? "mtn_momo",
    amountXOF: amount, status: "success", description: "Recharge portefeuille",
  };
  await dbAddTransaction(tx);
  await broadcast(userId, "wallet:update", wallet);
  // Notify user of successful topup
  await notifyUser(
    userId, "wallet", "Recharge reçue",
    `Votre portefeuille a été rechargé de ${amount} XOF.`,
    { amountXOF: String(amount) }
  );
  return c.json({ transaction: tx, balanceXOF: wallet.balanceXOF });
});

app.post("/wallet/pay", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const amount = Number(body.amountXOF ?? 0);
  if (amount < 100) return c.json({ code: "AMOUNT_MIN" }, 400);

  const wallet = await dbGetWallet(userId);
  if (wallet.balanceXOF < amount) return c.json({ code: "INSUFFICIENT_FUNDS" }, 402);

  wallet.balanceXOF -= amount;
  await dbSetWallet(wallet);

  const tx = {
    id: uid("tx"), userId, type: "ride_payment", method: "wallet",
    amountXOF: amount, status: "success", rideId: body.rideId ?? null,
    description: body.rideId ? `Course #${body.rideId}` : "Paiement course",
  };
  await dbAddTransaction(tx);
  await broadcast(userId, "wallet:update", wallet);
  return c.json({ transaction: tx, balanceXOF: wallet.balanceXOF });
});

/* ================================================================
   MOBILE MONEY
   ================================================================ */

app.post("/payments/momo/initiate", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const amount = Number(body.amount ?? 0);
  if (amount < 100) return c.json({ code: "AMOUNT_MIN" }, 400);

  const id = uid("pay");
  const ussd: Record<string, string> = { mtn_momo: "*880#", moov_money: "*555#", celtiis_cash: "*811#" };
  await supabase.from("ippoo_triip_payments").insert({
    id, user_id: userId, ride_id: body.rideId ?? null,
    amount_xof: amount, method: body.operator ?? "mtn_momo",
    status: "pending", attempts: 0, expires_at: isoIn(120_000),
  });
  return c.json({
    transactionId: id, status: "pending",
    ussdHint: ussd[body.operator ?? "mtn_momo"] ?? "*880#",
    expiresAt: Date.now() + 120_000,
  });
});

app.get("/payments/momo/:id/status", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { data: pay } = await supabase.from("ippoo_triip_payments")
    .select("*").eq("id", c.req.param("id")).eq("user_id", userId).maybeSingle();
  if (!pay) return c.json({ code: "NOT_FOUND" }, 404);

  if (pay.status === "pending") {
    const attempts = pay.attempts + 1;
    let newStatus = pay.status;
    if (new Date(pay.expires_at) < new Date()) {
      newStatus = "failed";
    } else if (attempts >= 2) {
      newStatus = "success";
      const wallet = await dbGetWallet(userId);
      wallet.balanceXOF += pay.amount_xof;
      await dbSetWallet(wallet);
      await dbAddTransaction({
        id: uid("tx"), userId, type: pay.ride_id ? "ride_payment" : "topup",
        method: pay.method, amountXOF: pay.amount_xof, status: "success",
        reference: pay.id, rideId: pay.ride_id,
        description: pay.ride_id ? "Paiement course" : "Recharge Mobile Money",
      });
      await broadcast(userId, "wallet:update", wallet);
    }
    await supabase.from("ippoo_triip_payments").update({ status: newStatus, attempts }).eq("id", pay.id);
    return c.json({ status: newStatus });
  }
  return c.json({ status: pay.status });
});

/* ================================================================
   NOTIFICATIONS
   ================================================================ */

app.get("/notifications", requireAuth, async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const ps   = parseInt(c.req.query("pageSize") ?? "20");
  return c.json(paginate(await dbGetNotifications(c.get("userId")), page, ps));
});

app.get("/notifications/unread-count", requireAuth, async (c) => {
  const { count } = await supabase.from("ippoo_triip_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", c.get("userId")).eq("read", false);
  return c.json({ count: count ?? 0 });
});

app.post("/notifications/:id/read", requireAuth, async (c) => {
  await supabase.from("ippoo_triip_notifications")
    .update({ read: true })
    .eq("id", c.req.param("id"))
    .eq("user_id", c.get("userId"));
  return c.json({ ok: true });
});

app.post("/notifications/read-all", requireAuth, async (c) => {
  await supabase.from("ippoo_triip_notifications")
    .update({ read: true }).eq("user_id", c.get("userId"));
  return c.json({ ok: true });
});

app.post("/notifications/fcm-token", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  await dbSaveFcmToken(userId, body.token, body.platform ?? "web", body.userAgent ?? "");
  return c.json({ ok: true });
});

app.post("/notifications/fcm-token/remove", requireAuth, async (c) => {
  const userId = c.get("userId");
  await dbRemoveFcmToken(userId);
  return c.json({ ok: true });
});

/* Envoi d'une notification push de TEST.
   Public (comme /auth/otp/request) pour pouvoir diagnostiquer AVANT connexion,
   directement depuis l'écran de login. Renvoie le résultat FCM détaillé pour
   savoir exactement pourquoi une push n'arrive pas (secret manquant, token
   mort, projet invalide…). */
app.post("/notifications/test", async (c) => {
  const body = await parseBody(c);
  const token = body.fcmToken ? String(body.fcmToken) : null;
  if (!token) {
    return c.json({
      ok: false,
      push: { configured: !!FCM_SA_JSON, attempted: 0, sent: 0, failed: 0, reason: "aucun token FCM fourni par le client (permission refusée ou contexte non sécurisé/iframe ?)" },
    });
  }
  const push = await sendFcmPush(
    [token],
    "IPPOO TRIIP — Test",
    "Ceci est une notification test. Si vous la voyez, tout fonctionne ✅",
    { type: "test" },
  );
  console.log(`[TEST-PUSH] token ${token.slice(0, 16)}… -> sent=${push.sent} failed=${push.failed} reason=${push.reason ?? "ok"}`);
  return c.json({ ok: push.sent > 0, push });
});

app.post("/notifications/send", requireAuth, async (c) => {
  const role = c.get("userRole");
  if (role !== "admin") return c.json({ code: "FORBIDDEN" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const { title, message, target = "all", url, type = "system" } = body;
  if (!title || !message) return c.json({ code: "MISSING_FIELDS" }, 400);

  // 1. Save to push_notifications log
  await supabase.from("ippoo_triip_push_notifications").insert({
    id: uid("push"), title, body: message, target,
  });

  // 2. Get target users
  let q = supabase.from("ippoo_triip_users").select("id");
  if (target === "clients") q = q.eq("role", "client");
  if (target === "drivers") q = q.eq("role", "driver");
  const { data: users } = await q;
  const userIds = (users ?? []).map((u: any) => u.id);

  // 3. Save in-app notification for each user
  if (userIds.length > 0) {
    const rows = userIds.map((userId: string) => ({
      id: uid("notif"), user_id: userId, type, title, body: message,
      read: false, metadata: url ? { url } : null,
    }));
    await supabase.from("ippoo_triip_notifications").insert(rows);
  }

  // 4. Broadcast realtime
  // NB: `target` DOIT être inclus — le client (<PushNotificationHost/>) filtre
  // les notifications par audience (all / clients / drivers). Sans lui, rien
  // ne s'affiche.
  await broadcastAll("notification", { type, title, body: message, url, target });

  // 5. Send FCM push to all target devices
  const tokens = await dbGetAllFcmTokens(target as any);
  await sendFcmPush(tokens, title, message, url ? { url } : undefined);

  return c.json({ ok: true, sent: tokens.length, users: userIds.length });
});

/* ================================================================
   REFERRALS
   ================================================================ */

app.get("/referrals/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { data: refs } = await supabase.from("ippoo_triip_referrals")
    .select("*").eq("referrer_id", userId).order("created_at", { ascending: false });
  const list = (refs ?? []).map((r: any) => ({
    id: r.id, referrerId: r.referrer_id, code: r.code,
    inviteePhone: r.invitee_phone, inviteeName: r.invitee_name,
    status: r.status, rewardXOF: r.reward_xof, createdAt: r.created_at,
  }));
  const code = `IPPOO-${userId.slice(-6).toUpperCase()}`;
  return c.json({
    code, link: `https://ippoo.bj/ref/${code}`,
    invited: list.length,
    registered: list.filter((r) => r.status !== "pending").length,
    totalEarnedXOF: list.filter((r) => r.status === "rewarded").reduce((s, r) => s + r.rewardXOF, 0),
    referrals: list,
  });
});

app.post("/referrals/invite", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const code = `IPPOO-${userId.slice(-6).toUpperCase()}`;
  const { data, error } = await supabase.from("ippoo_triip_referrals").insert({
    id: uid("ref"), referrer_id: userId, code,
    invitee_phone: body.phone ?? null, status: "pending", reward_xof: 1000,
  }).select().single();
  if (error) return c.json({ code: "ERROR", message: error.message }, 500);
  return c.json(data);
});

/* ================================================================
   GROUP ORDERS
   ================================================================ */

app.get("/group-orders", requireAuth, async (c) => {
  const { data } = await supabase.from("ippoo_triip_group_orders").select("*").order("created_at", { ascending: false });
  return c.json(data ?? []);
});

app.get("/group-orders/:id", requireAuth, async (c) => {
  const { data } = await supabase.from("ippoo_triip_group_orders").select("*, ippoo_triip_group_order_participants(*)")
    .eq("id", c.req.param("id")).maybeSingle();
  if (!data) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(data);
});

app.post("/group-orders", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  if (!body.title || !body.vendor) return c.json({ code: "MISSING_FIELDS" }, 400);
  const user = await dbUserById(userId);
  const id = uid("go");
  await supabase.from("ippoo_triip_group_orders").insert({
    id, host_id: userId, title: body.title, vendor: body.vendor,
    delivery_fee_xof: body.deliveryFeeXOF ?? 1000, total_xof: 0,
    deadline: body.deadline ?? isoIn(7200_000),
  });
  await supabase.from("ippoo_triip_group_order_participants").insert({
    group_order_id: id, user_id: userId, name: user?.fullName ?? "", items: 1, amount_xof: 0,
  });
  const { data } = await supabase.from("ippoo_triip_group_orders").select("*").eq("id", id).single();
  return c.json(data, 201);
});

app.post("/group-orders/:id/join", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const { data: go } = await supabase.from("ippoo_triip_group_orders").select("*")
    .eq("id", c.req.param("id")).maybeSingle();
  if (!go) return c.json({ code: "NOT_FOUND" }, 404);
  if (go.status !== "open") return c.json({ code: "LOCKED" }, 409);

  const user = await dbUserById(userId);
  const amount = Number(body.amountXOF ?? 0);
  await supabase.from("ippoo_triip_group_order_participants").upsert({
    group_order_id: go.id, user_id: userId,
    name: user?.fullName ?? "", items: body.items ?? 1, amount_xof: amount,
  });
  await supabase.from("ippoo_triip_group_orders").update({ total_xof: go.total_xof + amount }).eq("id", go.id);
  const { data: updated } = await supabase.from("ippoo_triip_group_orders").select("*").eq("id", go.id).single();
  return c.json(updated);
});

/* ================================================================
   CARPOOL
   ================================================================ */

app.get("/carpools", async (c) => {
  const { data } = await supabase.from("ippoo_triip_carpool_trips")
    .select("*").gt("seats_left", 0).order("depart_at", { ascending: true });
  return c.json((data ?? []).map(mapCarpool));
});

app.post("/carpools", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  if (!body.origin || !body.destination || !body.departAt) return c.json({ code: "MISSING_FIELDS" }, 400);
  const user = await dbUserById(userId);
  const id = uid("cp");
  await supabase.from("ippoo_triip_carpool_trips").insert({
    id, driver_id: userId, driver_name: user?.fullName ?? "",
    origin_lat: body.origin.lat, origin_lng: body.origin.lng, origin_label: body.origin.label ?? null,
    destination_lat: body.destination.lat, destination_lng: body.destination.lng, destination_label: body.destination.label ?? null,
    depart_at: body.departAt, seats_total: body.seatsTotal ?? 4,
    seats_left: body.seatsTotal ?? 4, price_per_seat_xof: body.pricePerSeatXOF ?? 1000, vehicle: body.vehicle ?? "",
  });
  const { data } = await supabase.from("ippoo_triip_carpool_trips").select("*").eq("id", id).single();
  return c.json(mapCarpool(data), 201);
});

app.post("/carpools/:id/join", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { data: trip } = await supabase.from("ippoo_triip_carpool_trips").select("*")
    .eq("id", c.req.param("id")).maybeSingle();
  if (!trip) return c.json({ code: "NOT_FOUND" }, 404);
  if (trip.seats_left <= 0) return c.json({ code: "NO_SEATS" }, 409);
  const seats = Math.min(Number(body.seats ?? 1), trip.seats_left);
  await supabase.from("ippoo_triip_carpool_trips").update({ seats_left: trip.seats_left - seats }).eq("id", trip.id);
  return c.json({ ok: true, seatsBooked: seats });
});

/* ================================================================
   AIR FREIGHT
   ================================================================ */

app.get("/air-freight/shipments", requireAuth, async (c) => {
  const { data } = await supabase.from("ippoo_triip_air_freight")
    .select("*").eq("client_id", c.get("userId")).order("created_at", { ascending: false });
  return c.json((data ?? []).map(mapAF));
});

app.get("/air-freight/track/:code", async (c) => {
  const { data } = await supabase.from("ippoo_triip_air_freight")
    .select("*").eq("tracking_code", c.req.param("code").toUpperCase()).maybeSingle();
  if (!data) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(mapAF(data));
});

app.post("/air-freight/shipments", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  if (!body.fromAirport || !body.toAirport || !body.weightKg) return c.json({ code: "MISSING_FIELDS" }, 400);
  const id = uid("af");
  const trackingCode = `IPP-AF-${Date.now().toString(36).toUpperCase()}`;
  await supabase.from("ippoo_triip_air_freight").insert({
    id, client_id: userId, from_airport: String(body.fromAirport).slice(0, 100),
    to_airport: String(body.toAirport).slice(0, 100), weight_kg: Number(body.weightKg),
    category: body.category ?? "parcel",
    price_xof: Math.round(15000 + Number(body.weightKg) * 2500),
    status: "booked", tracking_code: trackingCode,
  });
  const { data } = await supabase.from("ippoo_triip_air_freight").select("*").eq("id", id).single();
  return c.json(mapAF(data), 201);
});

/* ================================================================
   PLATFORM CONFIG
   ================================================================ */

app.get("/platform/config", async (c) => {
  const { data } = await supabase.from("ippoo_triip_platform_config").select("*");
  const cfg: Record<string, any> = {};
  (data ?? []).forEach((r: any) => { cfg[r.key] = r.value; });
  return c.json(cfg);
});

app.put("/platform/config", requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  for (const [key, value] of Object.entries(body)) {
    await supabase.from("ippoo_triip_platform_config").upsert({ key, value, updated_at: now() });
  }
  await broadcastAll("platform:config_update", body);
  return c.json({ ok: true });
});

/* ================================================================
   PUSH NOTIFICATIONS
   ================================================================ */

app.get("/push-notifications/pending", async (c) => {
  const since = c.req.query("since") ?? new Date(0).toISOString();
  const { data } = await supabase.from("ippoo_triip_push_notifications")
    .select("*").gt("created_at", since).order("created_at", { ascending: false }).limit(50);
  return c.json(data ?? []);
});

app.post("/push-notifications", requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.title || !body.body) return c.json({ code: "MISSING_FIELDS" }, 400);
  const { data, error } = await supabase.from("ippoo_triip_push_notifications").insert({
    id: uid("pn"),
    title: String(body.title).slice(0, 100),
    body: String(body.body).slice(0, 500),
    target: body.target ?? "all",
  }).select().single();
  if (error) return c.json({ code: "ERROR", message: error.message }, 500);
  await broadcastAll("push:new", data);
  return c.json(data, 201);
});

/* ================================================================
   DRIVER PORTAL
   ================================================================ */

app.get("/driver/me", requireAuth, requireDriver, async (c) => {
  const d = await dbGetDriverFull(c.get("userId"));
  if (!d) return c.json({ code: "NOT_FOUND" }, 404);
  return c.json(d);
});

app.patch("/driver/me", requireAuth, requireDriver, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const driver = await dbGetDriverFull(userId) ?? {};
  const { id: _i, role: _r, phone: _p, ...safe } = body;
  const updated = { ...driver, ...safe, id: userId };
  await dbUpsertDriver(updated);
  await broadcast(userId, "driver:update", updated);
  return c.json(updated);
});

app.patch("/driver/status", requireAuth, requireDriver, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const update: any = { is_online: !!body.isOnline };
  if (body.location) {
    update.current_lat = body.location.lat;
    update.current_lng = body.location.lng;
    update.current_location_label = body.location.label ?? null;
  }
  await supabase.from("ippoo_triip_drivers").update(update).eq("id", userId);
  return c.json({ isOnline: !!body.isOnline });
});

app.get("/driver/earnings", requireAuth, requireDriver, async (c) => {
  const userId = c.get("userId");
  const { data: dr } = await supabase.from("ippoo_triip_drivers").select("*").eq("id", userId).maybeSingle();
  const todayRides = Math.min(dr?.total_rides ?? 8, 12);
  const grossToday = todayRides * 1500 + 2000;
  const comm = 0.15;
  return c.json({
    todayXOF: Math.round(grossToday * (1 - comm)), weekXOF: Math.round(87300 * (1 - comm)),
    monthXOF: Math.round(342000 * (1 - comm)), ridesToday: todayRides,
    acceptanceRate: 0.94, rating: dr?.rating ?? 4.9,
    grossToday, commissionToday: Math.round(grossToday * comm), netToday: Math.round(grossToday * (1 - comm)),
    grossWeek: 87300, commissionWeek: Math.round(87300 * comm), netWeek: Math.round(87300 * (1 - comm)),
    grossMonth: 342000, commissionMonth: Math.round(342000 * comm), netMonth: Math.round(342000 * (1 - comm)),
    totalBalance: 45600, pendingWithdrawals: 15000, availableBalance: 30600,
    bonusEarned: 3500, totalRides: dr?.total_rides ?? 0, avgPerRide: Math.round(grossToday / Math.max(1, todayRides)),
  });
});

app.get("/driver/missions", requireAuth, requireDriver, async (c) => {
  const userId = c.get("userId");
  const { data } = await supabase.from("ippoo_triip_rides")
    .select("*").eq("driver_id", userId).order("created_at", { ascending: false }).limit(20);
  return c.json((data ?? []).map(mapRide));
});

app.get("/driver/ratings", requireAuth, requireDriver, async (c) => {
  const { data: dr } = await supabase.from("ippoo_triip_drivers").select("*")
    .eq("id", c.get("userId")).maybeSingle();
  return c.json({
    average: dr?.rating ?? 5.0, total: dr?.total_rides ?? 0,
    distribution: { 5: 80, 4: 12, 3: 5, 2: 2, 1: 1 },
  });
});

/* ================================================================
   ADMIN
   ================================================================ */

app.use("/admin/*", requireAuth, requireAdmin);

app.get("/admin/stats", async (c) => {
  const [usersRes, driversRes, ridesRes, activeRes] = await Promise.all([
    supabase.from("ippoo_triip_users").select("*", { count: "exact", head: true }),
    supabase.from("ippoo_triip_drivers").select("*", { count: "exact", head: true }).eq("is_online", true),
    supabase.from("ippoo_triip_rides").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400_000).toISOString()),
    supabase.from("ippoo_triip_rides").select("*", { count: "exact", head: true }).in("status", ["requested", "accepted", "arriving", "in_progress"]),
  ]);
  const { count: kycCount } = await supabase.from("ippoo_triip_users").select("*", { count: "exact", head: true }).eq("kyc_status", "pending");
  const { data: txDay } = await supabase.from("ippoo_triip_transactions")
    .select("amount_xof").eq("status", "success").gte("created_at", new Date(Date.now() - 86400_000).toISOString());
  const revToday = (txDay ?? []).reduce((s: number, t: any) => s + t.amount_xof, 0);
  const { data: txMonth } = await supabase.from("ippoo_triip_transactions")
    .select("amount_xof").eq("status", "success").gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString());
  const revMonth = (txMonth ?? []).reduce((s: number, t: any) => s + t.amount_xof, 0);

  // Répartition réelle des courses par service (7 derniers jours)
  const since7d = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: rides7d } = await supabase.from("ippoo_triip_rides")
    .select("service_type").gte("created_at", since7d);
  const svcMap = new Map<string, number>();
  for (const r of rides7d ?? []) svcMap.set(r.service_type, (svcMap.get(r.service_type) ?? 0) + 1);
  const ridesByService = [...svcMap.entries()].map(([service, count]) => ({ service, count }));

  // Revenu réel par jour sur 7 jours (transactions success)
  const { data: tx7d } = await supabase.from("ippoo_triip_transactions")
    .select("amount_xof, created_at").eq("status", "success").gte("created_at", since7d);
  const dayMap = new Map<string, number>();
  for (const t of tx7d ?? []) {
    const day = new Date(t.created_at).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.amount_xof);
  }
  const revenue7d = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400_000).toISOString().slice(0, 10);
    return { day, amountXOF: dayMap.get(day) ?? 0 };
  });

  return c.json({
    usersTotal: usersRes.count ?? 0,
    driversOnline: driversRes.count ?? 0,
    ridesToday: ridesRes.count ?? 0,
    ridesActive: activeRes.count ?? 0,
    revenueTodayXOF: revToday,
    revenueMonthXOF: revMonth,
    kycPending: kycCount ?? 0,
    ridesByService,
    revenue7d,
  });
});

app.get("/admin/users", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const ps   = parseInt(c.req.query("pageSize") ?? "20");
  const { data, count } = await supabase.from("ippoo_triip_users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ps, page * ps - 1);
  return c.json({ items: (data ?? []).map(mapUser), total: count ?? 0, page, pageSize: ps });
});

app.get("/admin/drivers", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const ps   = parseInt(c.req.query("pageSize") ?? "20");
  const { data, count } = await supabase.from("ippoo_triip_drivers")
    .select("*, ippoo_triip_users!inner(*)", { count: "exact" })
    .range((page - 1) * ps, page * ps - 1);
  const drivers = (data ?? []).map((r: any) => mapDriver({ ...r.ippoo_triip_users, ...r }));
  return c.json({ items: drivers, total: count ?? 0, page, pageSize: ps });
});

app.patch("/admin/drivers/:id", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (body.isOnline !== undefined) {
    await supabase.from("ippoo_triip_drivers").update({ is_online: !!body.isOnline }).eq("id", c.req.param("id"));
  }
  if (body.kycStatus) {
    await supabase.from("ippoo_triip_users").update({ kyc_status: body.kycStatus }).eq("id", c.req.param("id"));
  }
  const d = await dbGetDriverFull(c.req.param("id"));
  return c.json(d);
});

app.get("/admin/rides", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const ps   = parseInt(c.req.query("pageSize") ?? "20");
  const { data, count } = await supabase.from("ippoo_triip_rides")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * ps, page * ps - 1);
  return c.json({ items: (data ?? []).map(mapRide), total: count ?? 0, page, pageSize: ps });
});

app.get("/admin/finances", async (c) => {
  const [txAll, txPending] = await Promise.all([
    supabase.from("ippoo_triip_transactions").select("amount_xof, type, method").eq("status", "success"),
    supabase.from("ippoo_triip_wallets").select("pending_xof"),
  ]);
  const gross = (txAll.data ?? []).reduce((s: number, t: any) => s + t.amount_xof, 0);
  const pending = (txPending.data ?? []).reduce((s: number, w: any) => s + w.pending_xof, 0);
  // Part réelle du revenu par moyen de paiement (en % du brut)
  const byMethodXof: Record<string, number> = {};
  for (const t of txAll.data ?? []) {
    const m = (t as any).method ?? "unknown";
    byMethodXof[m] = (byMethodXof[m] ?? 0) + t.amount_xof;
  }
  const revenueByMethod: Record<string, number> = {};
  for (const [m, amt] of Object.entries(byMethodXof)) {
    revenueByMethod[m] = gross > 0 ? Math.round((amt / gross) * 100) : 0;
  }
  return c.json({
    grossRevenue: gross, netRevenue: Math.round(gross * 0.15),
    pendingPayouts: pending, totalTransactions: txAll.data?.length ?? 0,
    revenueByMethod,
  });
});

app.post("/admin/kyc/:userId/:action", async (c) => {
  const action = c.req.param("action");
  if (action !== "approve" && action !== "reject") return c.json({ code: "INVALID_ACTION" }, 400);
  const kycStatus = action === "approve" ? "verified" : "rejected";
  await supabase.from("ippoo_triip_users")
    .update({ kyc_status: kycStatus, kyc_verified_at: action === "approve" ? now() : null })
    .eq("id", c.req.param("userId"));
  return c.json({ ok: true, status: kycStatus });
});

/* ================================================================
   SUBSCRIPTIONS
   ================================================================ */

app.get("/subscriptions/me", requireAuth, async (c) => {
  const { data } = await supabase.from("ippoo_triip_subscriptions")
    .select("*").eq("user_id", c.get("userId")).maybeSingle();
  return c.json(data ?? { plan: "free", status: "active", features: [] });
});

app.post("/subscriptions", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  await supabase.from("ippoo_triip_subscriptions").upsert({
    user_id: userId, plan: body.plan ?? "basic",
    status: "active", features: body.features ?? [],
  });
  const { data } = await supabase.from("ippoo_triip_subscriptions").select("*").eq("user_id", userId).single();
  return c.json(data, 201);
});

/* ================================================================
   ERROR HANDLERS
   ================================================================ */

app.notFound((c) => c.json({ code: "NOT_FOUND", message: "Route inconnue" }, 404));
app.onError((err, c) => { console.error("[ERROR]", err); return c.json({ code: "SERVER_ERROR" }, 500); });

/* ================================================================
   MONTAGE SOUS LE NOM DE LA FONCTION DÉPLOYÉE
   Supabase transmet le chemin complet à la fonction, nom compris :
   la requête arrive en /make-server-25867276/<route>. On monte donc toute
   l'app sous ce préfixe pour que /auth/otp/request devienne
   /make-server-25867276/auth/otp/request côté runtime.
   ================================================================ */
const rootApp = new Hono();
rootApp.route("/make-server-25867276", app);

Deno.serve(rootApp.fetch);
