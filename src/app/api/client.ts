/**
 * Client API IPPOO — wrapper fetch avec :
 *  - Injection automatique du token JWT
 *  - Refresh transparent sur 401
 *  - Validation Zod des réponses
 *  - Timeout & retries
 *  - Mode mock activable (VITE_API_MOCK=true)
 */
import { z } from "zod";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "https://api.ippoo.bj/v1";
const API_MOCK = (import.meta as any).env?.VITE_API_MOCK === "true" || true;
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

/* ──── Token storage (en mémoire + sessionStorage) ──── */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(at: string | null, rt: string | null) {
  accessToken = at;
  refreshToken = rt;
  if (at) sessionStorage.setItem("ippoo_access", at);
  else sessionStorage.removeItem("ippoo_access");
  if (rt) sessionStorage.setItem("ippoo_refresh", rt);
  else sessionStorage.removeItem("ippoo_refresh");
}

export function loadTokens() {
  accessToken = sessionStorage.getItem("ippoo_access");
  refreshToken = sessionStorage.getItem("ippoo_refresh");
}

export function getAccessToken() {
  return accessToken;
}

/* ──── Refresh ──── */
let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

/* ──── Mock registry ──── */
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

/* ──── Requête principale ──── */
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
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token && !skipAuth) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}${path}`, {
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
        payload.message ?? res.statusText,
        payload,
      );
    }

    const json = res.status === 204 ? null : await res.json();
    return schema ? schema.parse(json) : (json as T);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as any)?.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "La requête a expiré");
    }
    throw new ApiError(0, "NETWORK", "Connexion réseau indisponible");
  } finally {
    clearTimeout(timer);
  }
}

/* ──── Helpers méthodes ──── */
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
