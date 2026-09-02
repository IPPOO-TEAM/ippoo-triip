/* IPPOO TRIIP – Service Worker v2
   Stratégies de cache :
   - Shell statique (HTML/JS/CSS) : Cache-First avec fallback réseau
   - API & Supabase : Network-First avec fallback cache
   - Images & icônes : Stale-While-Revalidate
   - Page offline : précachée pour fallback universel
*/

const CACHE_VERSION = "ippoo-triip-v2";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

const ALL_CACHES = [STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE];

/* Ressources précachées au moment de l'install */
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
];

/* ─── INSTALL ─── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })))
        .catch(() => {/* best-effort : certaines URLs peuvent ne pas exister en dév */})
    ).then(() => self.skipWaiting())
  );
});

/* ─── ACTIVATE ─── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─── FETCH ─── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignore non-GET et requêtes extension/chrome-extension */
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  /* API Supabase & backend : Network-First */
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.io") ||
    url.pathname.startsWith("/functions/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rest/")
  ) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  /* Firebase : toujours réseau */
  if (url.hostname.includes("firebaseapp.com") ||
      url.hostname.includes("googleapis.com") ||
      url.hostname.includes("gstatic.com")) {
    return;
  }

  /* Images (jpeg/png/webp/svg depuis CDN ou local) : Stale-While-Revalidate */
  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  /* Navigation (HTML) : Network-First avec fallback offline */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match("/") ||
          caches.match("/offline") ||
          new Response("<h1>IPPOO TRIIP</h1><p>Vérifiez votre connexion.</p>", {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        )
    );
    return;
  }

  /* Assets statiques (JS/CSS/fonts) : Cache-First */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    /\.(js|css|woff2?|ttf|otf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  /* Tout le reste : Network-First */
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

/* ─── Stratégies ─── */

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Ressource non disponible hors-ligne", { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise || new Response("", { status: 204 });
}

/* ─── Messages (relais FCM OTP depuis firebase-messaging-sw.js) ─── */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
