/**
 * Système de notifications push flottantes IPPOO TRIIP.
 *
 * Un store léger persisté (localStorage) et synchronisé en temps réel entre
 * tous les espaces / onglets (événement `storage`). L'administrateur diffuse
 * une notification depuis le back office, et elle apparaît automatiquement,
 * sous forme de bandeau flottant, partout dans l'application (client, chauffeur).
 */
import { useSyncExternalStore } from "react";

export type PushType = "info" | "promo" | "success" | "alert" | "system" | "ride" | "payment" | "sos";
export type PushTarget = "all" | "clients" | "drivers";

export interface PushNotif {
  id: string;
  title: string;
  body: string;
  type: PushType;
  target: PushTarget;
  createdAt: number;
}

const FEED_KEY = "ippoo_triip_push_feed";
const SEEN_KEY = "ippoo_triip_push_seen";
const MAX = 30;

function load(): PushNotif[] {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

let feed: PushNotif[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, MAX)));
  } catch {
    /* ignoré */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** Diffuse une notification push à tous les espaces concernés. */
export function broadcastPush(p: {
  title: string;
  body: string;
  type?: PushType;
  target?: PushTarget;
}): PushNotif {
  const notif: PushNotif = {
    id: newId(),
    title: p.title,
    body: p.body,
    type: p.type ?? "info",
    target: p.target ?? "all",
    createdAt: Date.now(),
  };
  feed = [notif, ...feed].slice(0, MAX);
  persist();
  emit();
  return notif;
}

/**
 * Injecte une notification reçue en TEMPS RÉEL (Realtime broadcast) dans le
 * flux, SANS persister en localStorage. Le broadcast Supabase atteint déjà
 * chaque onglet/appareil indépendamment : persister ici déclencherait un
 * doublon via l'événement `storage` sur les autres onglets du même appareil.
 * Déduplique par id si fourni.
 */
export function ingestPush(p: {
  id?: string;
  title: string;
  body: string;
  type?: PushType;
  target?: PushTarget;
}): PushNotif {
  const id = p.id ?? newId();
  if (feed.some((n) => n.id === id)) return feed[0];
  const notif: PushNotif = {
    id,
    title: p.title,
    body: p.body,
    type: p.type ?? "info",
    target: p.target ?? "all",
    createdAt: Date.now(),
  };
  feed = [notif, ...feed].slice(0, MAX);
  emit();
  return notif;
}

export function getPushFeed(): PushNotif[] {
  return feed;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Hook React : le flux de notifications, réactif à toute diffusion (tous espaces). */
export function usePushFeed(): PushNotif[] {
  return useSyncExternalStore(subscribe, getPushFeed, getPushFeed);
}

/* -- Suivi des notifications déjà affichées (pour ne pas les rejouer) -- */
export function getSeenIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function markSeen(id: string) {
  const s = getSeenIds();
  s.add(id);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-200)));
  } catch {
    /* ignoré */
  }
}

/* -- Synchronisation inter-onglets / inter-espaces -- */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === FEED_KEY) {
      feed = load();
      emit();
    }
  });
}
