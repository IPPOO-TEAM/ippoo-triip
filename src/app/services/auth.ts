/**
 * Service d'authentification IPPOO TRIIP
 * OTP envoyé par notification push FCM sur l'appareil demandeur.
 */
import { api, setTokens, loadTokens, getAccessToken } from "../api/client";
import { UserSchema, type User } from "../types/domain";

export type AuthSession = { user: User; expiresAt: number; accessToken?: string };

const SESSION_KEY = "ippoo_triip_session_v2";

export function loadSession(): AuthSession | null {
  loadTokens();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      // Pas de session valide → purge tout token résiduel qui provoquerait
      // un « Invalid JWT » sur les prochains appels (dont l'inscription).
      if (getAccessToken()) setTokens(null, null);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt < Date.now()) {
      setTokens(null, null);
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { user: UserSchema.parse(parsed.user), expiresAt: parsed.expiresAt };
  } catch {
    setTokens(null, null);
    return null;
  }
}

function persistSession(s: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

/* Validation souple du numéro — accepte tous les pays */
export function validatePhone(raw: string): { ok: boolean; normalized: string; error?: string } {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned) return { ok: false, normalized: "", error: "Numéro requis" };
  // Déjà en format international
  if (cleaned.startsWith("+")) {
    if (!/^\+\d{7,15}$/.test(cleaned)) return { ok: false, normalized: "", error: "Numéro invalide" };
    return { ok: true, normalized: cleaned };
  }
  // Indicatif sans +
  if (cleaned.startsWith("00")) {
    const n = `+${cleaned.slice(2)}`;
    if (!/^\+\d{7,15}$/.test(n)) return { ok: false, normalized: "", error: "Numéro invalide" };
    return { ok: true, normalized: n };
  }
  // Numéro béninois court (8 chiffres)
  if (/^\d{8}$/.test(cleaned)) return { ok: true, normalized: `+229${cleaned}` };
  // Numéro avec indicatif sans 00/+
  if (/^\d{10,15}$/.test(cleaned)) return { ok: true, normalized: `+${cleaned}` };
  return { ok: false, normalized: "", error: "Numéro invalide" };
}

/**
 * Demande un OTP via push FCM sur l'appareil.
 * Le fcmToken doit être obtenu avant l'appel (initFcm dans firebase.ts).
 */
export type OtpPushResult = { configured: boolean; attempted: number; sent: number; failed: number; reason?: string };

export async function requestOtp(phoneRaw: string, fcmToken?: string | null): Promise<{ phone: string; push?: OtpPushResult }> {
  const { ok, normalized, error } = validatePhone(phoneRaw.trim());
  if (!ok) throw new Error(error ?? "Numéro invalide");
  const res = await api.post<any>("/auth/otp/request", {
    phone: normalized,
    fcmToken: fcmToken ?? undefined,
    userAgent: navigator.userAgent,
    platform: "web",
  }, { skipAuth: true });
  return { phone: normalized, push: res?.push };
}

export type RegisterExtra = {
  fcmToken?: string | null;
  fullName?: string;
  role?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  city?: string;
  email?: string;
  country?: string;
  department?: string;
  commune?: string;
  quartier?: string;
  referralCodeUsed?: string;
  invitationKey?: string;
};

/**
 * Vérifie l'OTP et ouvre la session.
 * Transmet aussi le fcmToken et toutes les données d'inscription pour le lier au compte.
 */
export async function verifyOtp(
  phone: string,
  otp: string,
  extra?: RegisterExtra,
): Promise<AuthSession> {
  const data = await api.post<any>("/auth/otp/verify", {
    phone,
    otp: otp.trim().replace(/\D/g, ""),
    fcmToken: extra?.fcmToken ?? undefined,
    userAgent: navigator.userAgent,
    platform: "web",
    fullName: extra?.fullName,
    role: extra?.role,
    vehicleType: extra?.vehicleType,
    vehiclePlate: extra?.vehiclePlate,
    city: extra?.city ?? extra?.commune,
    email: extra?.email,
    country: extra?.country,
    department: extra?.department,
    commune: extra?.commune,
    quartier: extra?.quartier,
    referralCodeUsed: extra?.referralCodeUsed,
    invitationKey: extra?.invitationKey,
  }, { skipAuth: true });
  setTokens(data.accessToken, data.refreshToken);
  const user = UserSchema.parse(data.user);
  const session: AuthSession = { user, expiresAt: data.expiresAt, accessToken: data.accessToken };
  persistSession(session);
  return session;
}

/**
 * Connexion administrateur par email + mot de passe.
 * Les identifiants sont vérifiés côté serveur contre les secrets
 * ADMIN_EMAIL / ADMIN_PASSWORD. Aucun OTP.
 */
export async function adminLogin(email: string, password: string): Promise<AuthSession> {
  const data = await api.post<any>("/auth/admin/login", {
    email: email.trim().toLowerCase(),
    password,
    userAgent: navigator.userAgent,
    platform: "web",
  }, { skipAuth: true });
  setTokens(data.accessToken, data.refreshToken);
  const user = UserSchema.parse(data.user);
  const session: AuthSession = { user, expiresAt: data.expiresAt, accessToken: data.accessToken };
  persistSession(session);
  return session;
}

export async function logout() {
  try { await api.post("/auth/logout"); } catch {}
  setTokens(null, null);
  sessionStorage.removeItem(SESSION_KEY);
}
