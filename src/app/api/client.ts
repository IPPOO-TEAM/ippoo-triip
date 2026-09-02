/**
 * Client API IPPOO TRIIP
 * Backend reel : Supabase Edge Function (Hono + KV)
 * Fallback dev : VITE_API_MOCK=true active les mocks localStorage
 */
import { z } from "zod";

// Supabase Edge Function - project kirnmvptguicplaqiimi
// Le nom de la fonction déployée est "make-server-25867276" (visible dans
// Supabase Dashboard → Edge Functions). Supabase route /functions/v1/<nom>.
const SUPABASE_API = "https://kirnmvptguicplaqiimi.supabase.co/functions/v1/make-server-25867276";
// Clé anon publique — requise par Supabase pour les routes non authentifiées
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpcm5tdnB0Z3VpY3BsYXFpaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNzQwNzksImV4cCI6MjEwMjc1MDA3OX0.MkpoJk-xEHUqIcDcOuMMygPhVy-0WRW-ORT7wqNSKAc";
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? SUPABASE_API;
const API_MOCK = (import.meta as any).env?.VITE_API_MOCK === "true";
const DEFAULT_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  schema?: z.ZodType<T>;
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
};

/* ---- Token storage (en mémoire + sessionStorage) ---- */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(at: string | null, rt: string | null) {
  accessToken = at;
  refreshToken = rt;
  if (at) sessionStorage.setItem("ippoo_triip_access", at);
  else sessionStorage.removeItem("ippoo_triip_access");
  if (rt) sessionStorage.setItem("ippoo_triip_refresh", rt);
  else sessionStorage.removeItem("ippoo_triip_refresh");
}

export function loadTokens() {
  accessToken = sessionStorage.getItem("ippoo_triip_access");
  refreshToken = sessionStorage.getItem("ippoo_triip_refresh");
}

export function getAccessToken() {
  return accessToken;
}

/* ---- Refresh ---- */
let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh?apikey=${SUPABASE_ANON_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/* ---- Mock registry ---- */
type MockHandler = (req: { method: string; path: string; body?: any }) => any | Promise<any>;
const mockHandlers: Array<{ method: string; pattern: RegExp; handler: MockHandler }> = [];

export function registerMock(method: string, pathPattern: string | RegExp, handler: MockHandler) {
  const pattern = typeof pathPattern === "string"
    ? new RegExp("^" + pathPattern.replace(/:[^/]+/g, "([^/]+)") + "$")
    : pathPattern;
  mockHandlers.push({ method: method.toUpperCase(), pattern, handler });
}

async function runMock(method: string, path: string, body?: any) {
  const match = mockHandlers.find(
    (m) => m.method === method.toUpperCase() && m.pattern.test(path),
  );
  if (!match) {
    throw new ApiError(404, "MOCK_NOT_FOUND", `Aucun mock pour ${method} ${path}`);
  }
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  return match.handler({ method, path, body });
}

/* ---- Requête principale ---- */
export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions<T> = {},
): Promise<T> {
  const { method = "GET", body, schema, timeout = DEFAULT_TIMEOUT, signal, skipAuth } = opts;

  // Mode mock
  if (API_MOCK) {
    const data = await runMock(method, path, body);
    return schema ? schema.parse(data) : (data as T);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  signal?.addEventListener("abort", () => controller.abort());

  const doFetch = async (token: string | null): Promise<Response> => {
    const userToken = (token && !skipAuth) ? token : null;

    let url = `${API_BASE}${path}`;
    let headers: Record<string, string>;

    if (userToken) {
      // Requête authentifiée. La passerelle Supabase (« Verify JWT » activé)
      // valide le header Authorization comme un JWT Supabase : on y met donc la
      // clé anon (acceptée par la passerelle), + `apikey` obligatoire pour le
      // routage. Le VRAI token utilisateur (signé par notre fonction avec
      // JWT_SECRET, non reconnu par la passerelle) est transporté dans un header
      // dédié `x-ippoo-authorization`, lu par requireAuth côté fonction.
      url += (path.includes("?") ? "&" : "?") + `apikey=${SUPABASE_ANON_KEY}`;
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
        "x-ippoo-authorization": `Bearer ${userToken}`,
      };
    } else {
      // Requête non authentifiée (OTP request/verify).
      // La passerelle Supabase exige un header `Authorization` quand
      // "Enforce JWT Verification" est ON — on envoie donc la clé anon dans
      // Authorization ET apikey (ceinture + bretelles), l'apikey en query
      // servant de repli. Cela déclenche un preflight CORS, géré par le
      // middleware CORS de la fonction (allowHeaders inclut Authorization/apikey).
      // Content-Type text/plain : le serveur (parseBody) accepte JSON en texte.
      url += (path.includes("?") ? "&" : "?") + `apikey=${SUPABASE_ANON_KEY}`;
      headers = {
        "Content-Type": "text/plain",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      };
    }

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  };

  try {
    let res = await doFetch(accessToken);
    if (res.status === 401 && !skipAuth) {
      const newToken = await tryRefresh();
      if (newToken) res = await doFetch(newToken);
    }

    if (!res.ok) {
      let payload: any = {};
      try { payload = await res.json(); } catch {}
      throw new ApiError(
        res.status,
        payload.code ?? "HTTP_ERROR",
        payload.message ?? `HTTP ${res.status} — ${method} ${path}`,
        payload,
      );
    }

    const json = res.status === 204 ? null : await res.json();
    return schema ? schema.parse(json) : (json as T);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as any)?.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "La requête a expiré (15s)");
    }
    const msg = (e instanceof Error) ? e.message : String(e);
    console.error(`[API] NETWORK ERROR — ${method} ${API_BASE}${path}:`, e);
    throw new ApiError(0, "NETWORK", `Réseau indisponible — ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

/* ---- Helpers méthodes ---- */
export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions<T>, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions<T>, "method">) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions<T>, "method">) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions<T>, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};
