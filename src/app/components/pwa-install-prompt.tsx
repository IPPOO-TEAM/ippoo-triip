/**
 * <PWAInstallPrompt/> — Notification push flottante d'installation IPPOO TRIIP.
 *
 * Comportement : à l'ouverture, on prépare l'installabilité (manifest + service
 * worker), on capture l'événement natif `beforeinstallprompt`, puis après
 * quelques secondes on fait apparaître une notification flottante proposant
 * l'installation. Le bouton « Installer » déclenche la VRAIE installation native.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Share, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  initPWAInstall,
  isPWAInstalled,
  isIOS,
  isInstallPromptReady,
  ensureWebManifest,
  ensureServiceWorker,
  triggerPWAInstall,
} from "./utils";
import { haptic } from "./ui-extras";
import triipLogo from "../../imports/TRIIP.png";

const DISMISS_KEY = "ippoo:pwa-dismissed";
const SHOW_DELAY_MS = 4000; // quelques secondes avant la proposition
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 3; // re-proposer après 3 jours

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || "0");
    return ts > 0 && Date.now() - ts < SNOOZE_MS;
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isPWAInstalled() || recentlyDismissed()) return;

    // Prépare les critères d'installabilité (best-effort)
    const logoUrl = typeof triipLogo === "string" ? triipLogo : (triipLogo as any)?.default ?? "";
    ensureWebManifest(logoUrl);
    ensureServiceWorker();
    initPWAInstall(() => {
      // L'événement natif est arrivé — la proposition aura tout son sens
    });

    // Affiche la notification flottante après quelques secondes
    const timer = setTimeout(() => {
      if (isPWAInstalled() || recentlyDismissed()) return;
      // On propose si l'install native est prête, ou sur iOS (install manuelle)
      if (isInstallPromptReady() || ios) {
        setVisible(true);
        haptic([12, 40, 12]);
      } else {
        // Sinon on laisse une chance supplémentaire au navigateur d'armer la prompt
        const retry = setTimeout(() => {
          if (!isPWAInstalled() && !recentlyDismissed()) {
            setVisible(true);
            haptic([12, 40, 12]);
          }
        }, 3000);
        return () => clearTimeout(retry);
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function handleInstall() {
    haptic(15);
    if (ios) {
      // iOS ne supporte pas l'installation programmatique : on guide l'utilisateur
      toast("Installer IPPOO TRIIP", {
        description: "Appuyez sur Partager, puis « Sur l'écran d'accueil ».",
        icon: <Share className="w-4 h-4" />,
        duration: 8000,
      });
      return;
    }

    setInstalling(true);
    const outcome = await triggerPWAInstall();
    setInstalling(false);

    if (outcome === "accepted") {
      toast.success("IPPOO TRIIP installée", {
        description: "Retrouvez l'application sur votre écran d'accueil.",
      });
      setVisible(false);
    } else if (outcome === "dismissed") {
      dismiss();
    } else {
      // Prompt native indisponible dans ce contexte → instructions manuelles
      toast("Installer IPPOO TRIIP", {
        description: "Ouvrez le menu du navigateur, puis « Installer l'application ».",
        icon: <Download className="w-4 h-4" />,
        duration: 8000,
      });
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Installer l'application IPPOO TRIIP"
          initial={{ y: -120, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed top-3 inset-x-3 z-[60] mx-auto max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur shadow-[0_12px_40px_-8px_rgba(30,96,145,0.45)] ring-1 ring-black/5">
            {/* Halo lumineux (charte : pas de motifs) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full blur-3xl opacity-40"
              style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full blur-3xl opacity-30"
              style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
            />

            <div className="relative flex items-start gap-3 p-3.5">
              {/* Logo TRIIP */}
              <div className="shrink-0 grid place-items-center h-12 w-12 rounded-xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
                <img src={triipLogo} alt="IPPOO TRIIP" className="h-10 w-10 object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[var(--foreground)]">Installer IPPOO TRIIP</p>
                  <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-[var(--ippoo-orange)]">
                    Gratuit
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {ios
                    ? "Ajoutez l'app à votre écran d'accueil pour un accès rapide, hors-ligne."
                    : "Accès rapide, notifications et mode hors-ligne, comme une vraie app."}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={installing}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ippoo-orange)] px-3.5 py-2 text-sm text-white shadow-sm transition active:scale-95 disabled:opacity-60"
                  >
                    {ios ? <Plus className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    {installing ? "Installation…" : ios ? "Sur l'écran d'accueil" : "Installer"}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-black/5 active:scale-95"
                  >
                    Plus tard
                  </button>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={dismiss}
                className="shrink-0 -mr-1 -mt-1 rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-black/5 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
