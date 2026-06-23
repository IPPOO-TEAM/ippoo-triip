import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

import { AppStoreProvider } from "./store/app-store";
import { ErrorBoundary } from "./components/error-boundary";
import { OfflineBanner, SkipToContent } from "./components/ui-extras";
import { installOfflineSync } from "./services/offline";
import faviconUrl from "../imports/TRIIP-1.png";
import "./api/mocks";
import "./services/logger";

/** Définit/maj le favicon (l'entrypoint HTML étant généré automatiquement) */
function setFavicon(href: string) {
  if (typeof document === "undefined") return;
  const rels = ["icon", "shortcut icon", "apple-touch-icon"];
  rels.forEach((rel) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = href;
  });
}

export default function App() {
  useEffect(() => {
    installOfflineSync();
    setFavicon(faviconUrl);
  }, []);

  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <SkipToContent />
        <OfflineBanner />
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </AppStoreProvider>
    </ErrorBoundary>
  );
}
