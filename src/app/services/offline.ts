/**
 * Mode hors-ligne IPPOO — file de synchronisation persistée dans IndexedDB.
 * Critique pour le marché béninois (réseau 2G/3G instable).
 *
 * Usage :
 *   await enqueueOffline({ kind: "ride.create", payload: {...} })
 *   // sera rejoué automatiquement quand "online"
 */
import { logger } from "./logger";
import { api } from "../api/client";

const DB_NAME = "ippoo_offline";
const DB_VERSION = 1;
const STORE = "queue";

type QueueItem = {
  id: string;
  kind: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  payload?: unknown;
  createdAt: number;
  attempts: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | Promise<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store) as IDBRequest;
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOffline(item: {
  kind: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  payload?: unknown;
}): Promise<QueueItem> {
  const full: QueueItem = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
    ...item,
  };
  await tx("readwrite", (s) => s.put(full));
  logger.info("offline.enqueued", { kind: item.kind, id: full.id });
  return full;
}

export async function listQueue(): Promise<QueueItem[]> {
  return tx<QueueItem[]>("readonly", (s) => s.getAll() as any);
}

export async function removeFromQueue(id: string) {
  await tx("readwrite", (s) => s.delete(id));
}

let syncing = false;
export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  if (syncing || !navigator.onLine) return { ok: 0, failed: 0 };
  syncing = true;
  let ok = 0, failed = 0;
  try {
    const items = await listQueue();
    for (const it of items) {
      try {
        if (it.method === "POST") await api.post(it.path, it.payload);
        else if (it.method === "PATCH") await api.patch(it.path, it.payload);
        else await api.delete(it.path);
        await removeFromQueue(it.id);
        ok++;
      } catch (e) {
        failed++;
        it.attempts++;
        await tx("readwrite", (s) => s.put(it));
        logger.warn("offline.replay.fail", { id: it.id, attempts: it.attempts });
        if (it.attempts >= 5) await removeFromQueue(it.id);
      }
    }
  } finally {
    syncing = false;
  }
  if (ok > 0) logger.info("offline.flushed", { ok, failed });
  return { ok, failed };
}

/** Branchement automatique sur l'événement online */
export function installOfflineSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => { flushQueue(); });
  // Tentative initiale
  setTimeout(() => flushQueue(), 2000);
}

/* ──── Cache générique (lecture seule) ──── */
const CACHE_STORE = "cache";

async function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME + "_cache", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve) => {
      const t = db.transaction(CACHE_STORE, "readonly").objectStore(CACHE_STORE).get(key);
      t.onsuccess = () => resolve((t.result as any)?.value ?? null);
      t.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlMs = 24 * 3600_000) {
  try {
    const db = await openCacheDb();
    db.transaction(CACHE_STORE, "readwrite")
      .objectStore(CACHE_STORE)
      .put({ key, value, expiresAt: Date.now() + ttlMs });
  } catch {}
}
