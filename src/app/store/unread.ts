/**
 * Compteur global de notifications NON LUES, réactif et temps réel.
 *
 * Source de vérité unique partagée par la cloche d'accueil et le badge de la
 * barre de navigation (client + chauffeur). Alimenté par :
 *  - un fetch initial de GET /notifications/unread-count (via RealtimeBridge) ;
 *  - un incrément à chaque notification reçue en temps réel (bumpUnread) ;
 *  - remis à zéro en visitant la page Notifications (resetUnread) ;
 *  - décrémenté au marquage lu d'une notification (decUnread).
 */
import { useSyncExternalStore } from "react";

let count = 0;
const counted = new Set<string>(); // ids déjà comptés (anti-doublon temps réel)
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Définit le compteur (fetch backend). */
export function setUnread(n: number) {
  count = Math.max(0, n | 0);
  emit();
}

/** Incrémente pour une notification reçue en temps réel (dédupliqué par id). */
export function bumpUnread(id?: string) {
  if (id) {
    if (counted.has(id)) return;
    counted.add(id);
  }
  count += 1;
  emit();
}

/** Décrémente d'une unité (marquage lu unitaire). */
export function decUnread() {
  count = Math.max(0, count - 1);
  emit();
}

/** Remet à zéro (page Notifications ouverte / tout lire). */
export function resetUnread() {
  count = 0;
  counted.clear();
  emit();
}

export function getUnread(): number {
  return count;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Hook React : le nombre de notifications non lues, réactif. */
export function useUnread(): number {
  return useSyncExternalStore(subscribe, getUnread, getUnread);
}
