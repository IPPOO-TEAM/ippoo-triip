/* IPPOO TRIIP - Firebase Cloud Messaging Service Worker
   Gère les notifications push en arrière-plan (app fermée ou en background).
   Ce fichier DOIT rester à la racine du site (servi par Vite depuis /public). */

/* Clic sur la notification → ouvre/focus l'app.
   ⚠️ Doit être enregistré AVANT l'import des librairies FCM : sinon FCM peut
   écraser le comportement de clic personnalisé (doc officielle FCM Web). */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "FCM_CLICK", url });
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBg-X7DoimQ4yJUsHle-hiSXeGfK5SV2SE",
  authDomain: "ippoo-6e1de.firebaseapp.com",
  projectId: "ippoo-6e1de",
  storageBucket: "ippoo-6e1de.firebasestorage.app",
  messagingSenderId: "642876422031",
  appId: "1:642876422031:web:d9fc1313f5035ccf21fdfa",
});

const messaging = firebase.messaging();

/* Notification en arrière-plan.
   Le serveur envoie des messages DATA-ONLY : titre / corps / type / url / code
   sont tous dans payload.data (pas de bloc notification, pour éviter les
   doublons d'affichage). Le SW est donc le seul point de rendu. */
messaging.onBackgroundMessage((payload) => {
  const data = payload.data ?? {};

  // Auto-remplissage OTP : relayer le code aux onglets ouverts même en arrière-plan
  if (data.type === "otp" && data.code) {
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((cs) => cs.forEach((c) => c.postMessage({ type: "FCM_OTP", code: data.code })));
  }

  const notifTitle = data.title || "IPPOO TRIIP";
  const notifOptions = {
    body: data.body || "",
    // Icône inline SVG encodée en data URI — aucun fichier externe requis
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='32' fill='%23F77F00'/%3E%3Ctext x='96' y='130' text-anchor='middle' font-size='100' font-family='sans-serif' fill='white'%3EI%3C/text%3E%3C/svg%3E",
    badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Ccircle cx='36' cy='36' r='36' fill='%23F77F00'/%3E%3C/svg%3E",
    data: { url: data.url || "/" },
    // Regroupe les notifs OTP successives au lieu d'empiler
    tag: data.type === "otp" ? "ippoo-otp" : undefined,
    renotify: data.type === "otp" ? true : undefined,
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };
  self.registration.showNotification(notifTitle, notifOptions);
});
