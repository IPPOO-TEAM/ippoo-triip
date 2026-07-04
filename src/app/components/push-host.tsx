/**
 * <PushNotificationHost/> — Affiche les notifications push flottantes.
 *
 * Monté dans les layouts (client, chauffeur, admin), il écoute le flux de
 * diffusion et fait apparaître automatiquement, en haut de l'écran, un bandeau
 * flottant animé pour chaque nouvelle notification destinée à son audience.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Megaphone, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  usePushFeed,
  getSeenIds,
  markSeen,
  type PushNotif,
  type PushTarget,
} from "../store/push-notifications";
import { haptic } from "./ui-extras";

const TYPE_STYLE: Record<
  PushNotif["type"],
  { icon: typeof Bell; color: string; bg: string }
> = {
  info: { icon: Bell, color: "#1E6091", bg: "#1E6091" },
  promo: { icon: Megaphone, color: "#F77F00", bg: "#F77F00" },
  success: { icon: CheckCircle2, color: "#2A9D8F", bg: "#2A9D8F" },
  alert: { icon: AlertTriangle, color: "#D62828", bg: "#D62828" },
};

const AUTO_DISMISS_MS = 6000;

export function PushNotificationHost({
  audience,
}: {
  /** "clients" (app client), "drivers" (app chauffeur) ou "admin" */
  audience: PushTarget | "admin";
}) {
  const feed = usePushFeed();
  const [seen, setSeen] = useState<Set<string>>(() => getSeenIds());
  const [active, setActive] = useState<PushNotif | null>(null);
  const mountRef = useRef(Date.now());

  const matches = (n: PushNotif) =>
    n.target === "all" || n.target === audience;

  // Sélectionne la prochaine notification non affichée destinée à cette audience
  useEffect(() => {
    if (active) return;
    const next = feed.find(
      (n) =>
        !seen.has(n.id) &&
        matches(n) &&
        n.createdAt > mountRef.current - 20000, // évite de rejouer l'historique ancien
    );
    if (next) {
      setActive(next);
      haptic([12, 45, 12]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, seen, active, audience]);

  // Auto-fermeture
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function dismiss() {
    setActive((cur) => {
      if (cur) {
        markSeen(cur.id);
        setSeen((prev) => new Set(prev).add(cur.id));
      }
      return null;
    });
  }

  const style = active ? TYPE_STYLE[active.type] : TYPE_STYLE.info;
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          role="alert"
          initial={{ y: -120, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed top-3 inset-x-3 z-[70] mx-auto max-w-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur shadow-[0_12px_40px_-8px_rgba(15,23,42,0.45)] ring-1 ring-black/5">
            {/* Halo lumineux discret (pas de motif) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full blur-3xl opacity-30"
              style={{ background: `radial-gradient(circle, ${style.bg} 0%, transparent 70%)` }}
            />
            {/* Liseré de couleur à gauche selon le type */}
            <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: style.bg }} />

            <div className="relative flex items-start gap-3 p-3.5 pl-4">
              <div
                className="shrink-0 grid place-items-center h-10 w-10 rounded-xl"
                style={{ background: `${style.color}1A` }}
              >
                <Icon className="h-5 w-5" style={{ color: style.color }} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[var(--foreground)]">{active.title}</p>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{active.body}</p>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={dismiss}
                className="shrink-0 -mr-1 -mt-1 rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-black/5 active:scale-90"
                style={{ WebkitTapHighlightColor: "transparent" }}
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
