/* --- Utilitaires partagés IPPOO --- */

/** Géolocalisation réelle via navigator.geolocation */
export function getGPSPosition(
  onSuccess: (label: string, lat: number, lng: number) => void,
  onError: (fallback: string) => void
) {
  if (!navigator.geolocation) {
    onError("Cotonou, Bénin (GPS non disponible)");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const label = `Ma position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      onSuccess(label, latitude, longitude);
    },
    (err) => {
      const fallback =
        err.code === 1
          ? "GPS refusé · Cotonou, Bénin"
          : "Position non disponible · Cotonou, Bénin";
      onError(fallback);
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

/**
 * Optimise/compresse une image avant upload : redimensionne au plus grand côté
 * `maxSize` et ré-encode en JPEG à la qualité `quality`. Renvoie un dataURL
 * léger (idéal pour stocker un avatar sans saturer le stockage).
 */
export async function compressImage(
  file: File,
  { maxSize = 720, quality = 0.8 }: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier n'est pas une image");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Image illisible"));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // repli : pas de canvas
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Taille lisible (Ko/Mo) d'un fichier */
export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Télécharge un Blob sous forme de fichier */
export function downloadBlob(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Génère un OTP aléatoire à 6 chiffres */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Formate une date JS en "JJ Mmm AAAA à HH:MM" */
export function formatDateFr(date = new Date()): string {
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()} à ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

/* --- Installation PWA (Progressive Web App) --- */

/** Événement natif d'installation mis en cache dès qu'il est émis par le navigateur */
let deferredInstallPrompt: any = null;

/**
 * Capture l'événement `beforeinstallprompt` au plus tôt afin de pouvoir
 * déclencher plus tard la vraie boîte de dialogue d'installation native.
 */
export function initPWAInstall(onAvailable?: () => void) {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e: any) => {
    // Empêche la mini-infobar par défaut pour piloter nous-mêmes le flux
    e.preventDefault();
    deferredInstallPrompt = e;
    onAvailable?.();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    try { localStorage.setItem("ippoo:pwa-installed", "1"); } catch {}
  });
}

/** Vrai si la prompt d'installation native est prête à être déclenchée */
export function isInstallPromptReady(): boolean {
  return deferredInstallPrompt !== null;
}

/** Vrai si l'application tourne déjà en mode installé (standalone) */
export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(standalone || iosStandalone);
}

/** Détecte iOS, qui ne supporte pas `beforeinstallprompt` (installation manuelle) */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
  );
}

/**
 * Injecte dynamiquement un Web App Manifest (icône = logo TRIIP) pour rendre
 * l'application installable, l'entrypoint HTML étant généré automatiquement.
 */
export function ensureWebManifest(iconUrl: string) {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[rel="manifest"][data-ippoo]')) return;

  const manifest = {
    name: "IPPOO TRIIP",
    short_name: "TRIIP",
    description: "Taxi-moto, livraison, transport de biens, commandes groupées, covoiturage & fret aérien.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#1E6091",
    theme_color: "#F77F00",
    orientation: "portrait",
    icons: [
      { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const link = document.createElement("link");
  link.rel = "manifest";
  link.dataset.ippoo = "true";
  link.href = URL.createObjectURL(blob);
  document.head.appendChild(link);

  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#F77F00";
    document.head.appendChild(meta);
  }
  // Icône Apple touch (iOS « Sur l'écran d'accueil »)
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = iconUrl;
    document.head.appendChild(apple);
  }
}

/**
 * Enregistre un service worker minimal (best-effort) - critère requis par
 * Chrome/Android pour proposer l'installation native. Silencieux si l'env. le refuse.
 */
export async function ensureServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const swCode =
      'self.addEventListener("install",()=>self.skipWaiting());' +
      'self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));' +
      'self.addEventListener("fetch",()=>{});';
    const blob = new Blob([swCode], { type: "text/javascript" });
    await navigator.serviceWorker.register(URL.createObjectURL(blob));
  } catch {
    /* Environnement sans service worker - l'installation native peut rester indisponible */
  }
}

/**
 * Déclenche la VRAIE boîte de dialogue d'installation native du navigateur.
 * Retourne le résultat utilisateur, ou "unavailable" si non installable ici.
 */
export async function triggerPWAInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredInstallPrompt) return "unavailable";
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice?.outcome === "accepted" ? "accepted" : "dismissed";
  } catch {
    return "unavailable";
  }
}
