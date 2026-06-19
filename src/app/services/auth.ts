/**
 * Service d'authentification IPPOO — OTP par SMS (workflow Mobile Money Bénin).
 */
import { api, setTokens, loadTokens } from "../api/client";
import { PhoneBJSchema, UserSchema, type User } from "../types/domain";

export type AuthSession = { user: User; expiresAt: number };

const SESSION_KEY = "ippoo_session_v2";

export function loadSession(): AuthSession | null {
  loadTokens();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt < Date.now()) return null;
    return { user: UserSchema.parse(parsed.user), expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function persistSession(s: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export async function requestOtp(phoneRaw: string) {
  const phone = PhoneBJSchema.parse(phoneRaw.trim());
  await api.post("/auth/otp/request", { phone });
  return { phone };
}

export async function verifyOtp(phone: string, otp: string): Promise<AuthSession> {
  const data = await api.post<any>("/auth/otp/verify", { phone, otp });
  setTokens(data.accessToken, data.refreshToken);
  const user = UserSchema.parse(data.user);
  const session: AuthSession = { user, expiresAt: data.expiresAt };
  persistSession(session);
  return session;
}

export async function logout() {
  try { await api.post("/auth/logout"); } catch {}
  setTokens(null, null);
  sessionStorage.removeItem(SESSION_KEY);
}
