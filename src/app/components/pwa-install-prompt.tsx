/**
 * Bannière d'installation PWA — affiche uniquement "Installer l'application"
 * et déclenche directement le téléchargement/installation native sans démarche
 * supplémentaire de la part de l'utilisateur.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "./ui-extras";

const DISMISS_KEY = "ippoo:pwa-dismissed";
const SNOOZE_MS   = 1000 * 60 * 60 * 24 * 3; // 3 jours
const SHOW_DELAY  = 5000;

let deferredPrompt: any = null;

function captureInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    try { localStorage.setItem("ippoo:pwa-installed", "1"); } catch {}
  });
}

captureInstallPrompt();

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || "0");
    return ts > 0 && Date.now() - ts < SNOOZE_MS;
  } catch { return false; }
}

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
  );
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isInstalled() || recentlyDismissed()) return;

    const show = () => {
      if (!isInstalled() && !recentlyDismissed()) {
        setVisible(true);
        haptic([10, 30, 10]);
      }
    };

    // Show after delay if prompt is ready, or wait for the event
    const timer = setTimeout(() => {
      if (deferredPrompt || ios) {
        show();
      } else {
        // Give a bit more time for Chrome to arm the prompt
        const retry = setTimeout(() => {
          if (deferredPrompt || ios) show();
        }, 3000);
        return () => clearTimeout(retry);
      }
    }, SHOW_DELAY);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function handleInstall() {
    haptic(15);

    if (ios) {
      // iOS : on ne peut pas déclencher programmatiquement — guider l'utilisateur
      toast("Pour installer IPPOO TRIIP :", {
        description: "Appuyez sur le bouton Partager puis « Sur l'écran d'accueil ».",
        duration: 10000,
      });
      dismiss();
      return;
    }

    if (!deferredPrompt) {
      // Chrome/Edge : menu ⋮ → « Installer l'application »
      toast("Pour installer IPPOO TRIIP :", {
        description: "Ouvrez le menu du navigateur (⋮) puis « Installer l'application ».",
        duration: 10000,
      });
      dismiss();
      return;
    }

    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === "accepted") {
        toast.success("Application installée !", {
          description: "Retrouvez IPPOO TRIIP sur votre écran d'accueil.",
        });
        setVisible(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setInstalling(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Installer l'application"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-3 inset-x-3 z-[60] mx-auto max-w-md"
        >
          <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-xl ring-1 ring-black/5"
            style={{ background: "rgba(30, 30, 30, 0.96)", backdropFilter: "blur(20px)" }}>
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-[#F77F00] flex items-center justify-center">
              <img src="/icons/icon-192.png" alt="" className="w-10 h-10 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>

            {/* Install button — full width, single label */}
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 flex items-center gap-2 text-sm font-semibold text-white transition active:opacity-75 disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-[#F77F00] shrink-0" />
              {installing ? "Installation…" : "Installer l'application"}
            </button>

            {/* Dismiss */}
            <button
              type="button"
              aria-label="Fermer"
              onClick={dismiss}
              className="shrink-0 p-1.5 rounded-full text-white/40 transition hover:text-white/70 active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
