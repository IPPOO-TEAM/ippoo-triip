/**
 * IPPOO TRIIP – Firebase Cloud Messaging
 * Gère : init app, demande de permission, token FCM, messages foreground.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { api } from "../api/client";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBg-X7DoimQ4yJUsHle-hiSXeGfK5SV2SE",
  authDomain: "ippoo-6e1de.firebaseapp.com",
  projectId: "ippoo-6e1de",
  storageBucket: "ippoo-6e1de.firebasestorage.app",
  messagingSenderId: "642876422031",
  appId: "1:642876422031:web:d9fc1313f5035ccf21fdfa",
  measurementId: "G-PJ038VLWKW",
};

/* VAPID key publique – Firebase Console > Cloud Messaging > Certificats push Web */
const VAPID_KEY = "BJEHwdYD_Pz02MkU1Sei0m9_JUJGqWdLLDuwv7aDqc2zIn4hP_SUSZlyMux4_GGpXXz-eWLPN4d6yMY74s_1Mss";

/* Scope DÉDIÉ pour le SW FCM — évite d'écraser le SW PWA (/sw.js) enregistré
   au scope "/". C'est aussi le scope par défaut historique de Firebase. */
const FCM_SW_SCOPE = "/firebase-cloud-messaging-push-scope";

let app: FirebaseApp;
let messaging: Messaging | null = null;

/* Dernière cause d'échec détaillée (pour un diagnostic précis côté UI). */
let lastFcmError: string | null = null;
export function getLastFcmError(): string | null {
  return lastFcmError;
}

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  }
  return app;
}

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    if (!messaging) messaging = getMessaging(getFirebaseApp());
    return messaging;
  } catch {
    return null;
  }
}

/* Vérifie que /firebase-messaging-sw.js est bien servi en JavaScript.
   Renvoie false si l'hôte renvoie du HTML (SPA fallback) → SW impossible. */
async function swScriptIsServedAsJs(): Promise<boolean> {
  try {
    const res = await fetch("/firebase-messaging-sw.js", { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    return ct.includes("javascript") || ct.includes("ecmascript") || ct.includes("text/js");
  } catch {
    return false;
  }
}

/** Le push système FCM est-il possible sur ce domaine ? (SW servi en JS) */
export async function isFcmPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  if (!window.isSecureContext) return false;
  return swScriptIsServedAsJs();
}

/* ----------------------------------------------------------------
   Enregistre le service worker FCM puis demande la permission
   et retourne le token FCM (ou null si refusé / non supporté).
---------------------------------------------------------------- */
export async function initFcm(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) {
    console.warn("[FCM] Notifications non supportées par ce navigateur");
    return null;
  }
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] Service Worker non supporté");
    return null;
  }
  // Push nécessite HTTPS (contexte sécurisé). Sur HTTP → impossible.
  if (!window.isSecureContext) {
    console.warn("[FCM] Contexte non sécurisé (HTTP) — push web indisponible");
    return null;
  }
  // NB : dans une iframe cross-origin (preview Figma intégrée), le navigateur
  // n'affiche pas le prompt. On ne bloque plus a priori : on tente, et si la
  // permission n'est pas accordée on retourne null proprement. Le prompt
  // s'affiche quand le site est ouvert en onglet plein (domaine publié).
  if (window.self !== window.top) {
    console.info("[FCM] Exécution en iframe — le prompt peut être bloqué ; ouvrez le site en plein onglet.");
  }

  lastFcmError = null;
  try {
    /* 1. Permission D'ABORD (dans le geste utilisateur) — garantit l'affichage
          du prompt indépendamment de l'enregistrement du Service Worker. */
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      lastFcmError = `Permission « ${permission} »`;
      console.info("[FCM] Permission non accordée:", permission);
      return null;
    }

    /* 1bis. PRÉ-VOL : le service worker ne peut être enregistré que si le
       fichier est servi en JavaScript. Certains hébergements SPA (ex :
       *.figma.site) renvoient le shell HTML (text/html) pour tous les
       chemins → l'enregistrement échoue avec une erreur MIME cryptique.
       On détecte le cas AVANT pour donner un message clair. */
    if (!(await swScriptIsServedAsJs())) {
      lastFcmError =
        "Le push système n'est pas disponible sur ce domaine : le service worker n'y est pas servi en JavaScript. Les notifications en temps réel dans l'app fonctionnent quand même.";
      console.warn("[FCM]", lastFcmError);
      return null;
    }

    /* 2. Enregistrer le SW FCM sur son scope DÉDIÉ (n'écrase pas /sw.js).
          On réutilise l'enregistrement existant s'il est déjà là. */
    let swReg: ServiceWorkerRegistration | undefined;
    try {
      swReg =
        (await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)) ??
        (await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: FCM_SW_SCOPE }));
      await navigator.serviceWorker.ready;
    } catch (e: any) {
      lastFcmError = `SW /firebase-messaging-sw.js non enregistrable (${e?.message ?? e}). Vérifiez qu'il est bien servi à la racine du domaine.`;
      console.warn("[FCM]", lastFcmError, e);
    }

    /* 3. Obtenir le token FCM */
    const msg = getFirebaseMessaging();
    if (!msg) {
      lastFcmError = "Messaging non initialisable (navigateur non supporté ?)";
      return null;
    }

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });

    /* 4. Envoyer le token au backend */
    if (token) {
      lastFcmError = null;
      await registerTokenWithBackend(token);
    } else {
      lastFcmError =
        "getToken() a renvoyé un token vide — clé VAPID invalide/non associée au projet Firebase, ou service worker inactif.";
      console.warn("[FCM]", lastFcmError);
    }

    return token ?? null;
  } catch (err: any) {
    const code = err?.code ?? err?.name ?? "unknown";
    const message = err?.message ?? String(err);
    // Erreurs FCM courantes : clé VAPID invalide, projet mal configuré…
    lastFcmError =
      code === "messaging/token-subscribe-failed" || /applicationServerKey|VAPID/i.test(message)
        ? `Clé VAPID invalide ou non associée au projet Firebase (${code}).`
        : `${code}: ${message}`;
    console.warn("[FCM] initFcm error:", code, message);
    return null;
  }
}

/* ----------------------------------------------------------------
   Envoie le token FCM au backend pour le lier à l'utilisateur.
---------------------------------------------------------------- */
async function registerTokenWithBackend(token: string) {
  try {
    await api.post("/notifications/fcm-token", {
      token,
      platform: "web",
      userAgent: navigator.userAgent,
    });
  } catch {
    /* non bloquant */
  }
}

/* ----------------------------------------------------------------
   Supprime le token FCM du backend (déconnexion).
---------------------------------------------------------------- */
export async function unregisterFcmToken() {
  try {
    await api.post("/notifications/fcm-token/remove", {});
  } catch {
    /* non bloquant */
  }
}

/* ----------------------------------------------------------------
   Préférence utilisateur « notifications push » (post-connexion).
   Le navigateur ne permet pas de révoquer la permission par code ;
   « désactiver » = retirer le token du backend (plus aucun envoi).
---------------------------------------------------------------- */
const PUSH_PREF_KEY = "ippoo_triip_push_enabled";

/** État actuel de la permission navigateur. */
export function pushPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/** Les notifications sont-elles effectivement actives ? (permission + préférence) */
export function isPushEnabled(): boolean {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem(PUSH_PREF_KEY) !== "false";
}

/** Active les notifications : demande la permission (si besoin) + enregistre le token. */
export async function enablePush(): Promise<boolean> {
  const token = await initFcm();
  if (token) {
    localStorage.setItem(PUSH_PREF_KEY, "true");
    return true;
  }
  return false;
}

/** Désactive les notifications : retire le token du backend + mémorise la préférence. */
export async function disablePush(): Promise<void> {
  localStorage.setItem(PUSH_PREF_KEY, "false");
  await unregisterFcmToken();
}

/* ----------------------------------------------------------------
   Diagnostic : obtient un token (permission incluse) puis demande au
   backend d'envoyer une notification push de TEST. Retourne le résultat
   FCM détaillé pour comprendre un éventuel échec de livraison.
---------------------------------------------------------------- */
export type PushTestResult = {
  ok: boolean;
  tokenObtained: boolean;
  push?: { configured: boolean; attempted: number; sent: number; failed: number; reason?: string };
  error?: string;
};

export async function sendTestPush(): Promise<PushTestResult> {
  const token = await initFcm();
  if (!token) {
    return {
      ok: false,
      tokenObtained: false,
      error:
        typeof Notification !== "undefined" && Notification.permission !== "granted"
          ? "Permission notifications non accordée"
          : window.self !== window.top
            ? "Aperçu en iframe — ouvrez le site publié dans un onglet plein écran"
            : !window.isSecureContext
              ? "Contexte non sécurisé (HTTPS requis)"
              : getLastFcmError() ?? "Token FCM introuvable (VAPID key / service worker ?)",
    };
  }
  try {
    const res = await api.post<any>("/notifications/test", { fcmToken: token });
    return { ok: !!res?.ok, tokenObtained: true, push: res?.push };
  } catch (e: any) {
    return { ok: false, tokenObtained: true, error: String(e?.message ?? e) };
  }
}

/* ----------------------------------------------------------------
   Écoute les messages FCM quand l'app est au premier plan.
   Retourne une fonction de désinscription (cleanup).
---------------------------------------------------------------- */
export type FcmMessageHandler = (payload: MessagePayload) => void;

export function onForegroundMessage(handler: FcmMessageHandler): () => void {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};
  return onMessage(msg, handler);
}

/* ----------------------------------------------------------------
   Ouvre l'URL reçue dans un message FCM (foreground navigation).
---------------------------------------------------------------- */
export function handleFcmClick(url: string) {
  if (url && url !== window.location.href) {
    window.location.href = url;
  }
}

/* ----------------------------------------------------------------
   Écoute les clics sur notifications background (SW → client).
---------------------------------------------------------------- */
export function listenSwMessages(handler: (url: string) => void): () => void {
  if (!("serviceWorker" in navigator)) return () => {};
  const listener = (event: MessageEvent) => {
    if (event.data?.type === "FCM_CLICK" && event.data.url) {
      handler(event.data.url);
    }
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
