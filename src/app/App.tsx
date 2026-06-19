import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

import { AppStoreProvider } from "./store/app-store";
import { ErrorBoundary } from "./components/error-boundary";
import { OfflineBanner, SkipToContent } from "./components/ui-extras";
import { installOfflineSync } from "./services/offline";
import "./api/mocks";
import "./services/logger";

export default function App() {
  useEffect(() => {
    installOfflineSync();
    const done = localStorage.getItem("ippoo_onboarding_done");
    if (!done) {
      const path = window.location.pathname;
      if (path === "/" || path === "") {
        router.navigate("/onboarding", { replace: true });
      }
    }
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
