import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

import { AppStoreProvider } from "./store/app-store";
import { ErrorBoundary } from "./components/error-boundary";
import { RealtimeBridge } from "./components/realtime-bridge";
import { OfflineBanner, SkipToContent } from "./components/ui-extras";
import { installOfflineSync } from "./services/offline";
import "./api/mocks";
import "./services/logger";

function injectPWAMeta() {
  if (typeof document === "undefined") return;

  // Favicon (multi-format)
  const setLink = (rel: string, href: string, type?: string, sizes?: string) => {
    let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    if (type) el.type = type;
    if (sizes) el.setAttribute("sizes", sizes);
    el.href = href;
  };

  setLink("icon", "/icons/icon-192.png", "image/png", "192x192");
  setLink("shortcut icon", "/icons/icon-48.png", "image/png");
  setLink("apple-touch-icon", "/icons/icon-180.png", "image/png", "180x180");

  // Manifest statique
  if (!document.querySelector('link[rel="manifest"]')) {
    const m = document.createElement("link");
    m.rel = "manifest";
    m.href = "/manifest.json";
    document.head.appendChild(m);
  }

  // Meta PWA
  const setMeta = (name: string, content: string) => {
    let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  };

  setMeta("theme-color", "#F77F00");
  setMeta("mobile-web-app-capable", "yes");
  setMeta("apple-mobile-web-app-capable", "yes");
  setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  setMeta("apple-mobile-web-app-title", "TRIIP");
  setMeta("application-name", "IPPOO TRIIP");
  setMeta("description", "Taxi-moto, livraison, transport lourd, covoiturage et fret aérien en Afrique de l'Ouest.");
  setMeta("msapplication-TileImage", "/icons/icon-144.png");
  setMeta("msapplication-TileColor", "#F77F00");

  // Titre
  if (document.title === "" || document.title === "Vite App") {
    document.title = "IPPOO TRIIP";
  }
}

async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Les aperçus en iframe (Figma preview, sandbox) ne servent pas /sw.js en
  // tant que script : l'enregistrement échoue avec une MIME type text/html.
  // On saute donc l'enregistrement hors contexte de déploiement réel.
  const isPreviewSandbox =
    (typeof window !== "undefined" && window.top !== window.self) ||
    /figma\.site$|figmaiframepreview/.test(window.location.hostname);
  if (isPreviewSandbox) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    reg.addEventListener("updatefound", () => {
      const newSW = reg.installing;
      newSW?.addEventListener("statechange", () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          // Nouveau SW disponible — activation silencieuse sans rechargement forcé
          newSW.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  } catch (err) {
    console.warn("[PWA] SW registration failed:", err);
  }
}

export default function App() {
  useEffect(() => {
    injectPWAMeta();
    registerServiceWorker();
    installOfflineSync();
  }, []);

  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <SkipToContent />
        <OfflineBanner />
        <RealtimeBridge />
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </AppStoreProvider>
    </ErrorBoundary>
  );
}
