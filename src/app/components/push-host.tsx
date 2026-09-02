/**
 * <PushNotificationHost/> - Affiche les notifications push flottantes.
 *
 * Écoute deux sources :
 *  1. Messages FCM au premier plan (firebase.ts → onForegroundMessage)
 *  2. Flux de diffusion admin via localStorage (push-notifications.ts → usePushFeed)
 *
 * Aussi branché sur les clics de notifications background (SW → client) pour
 * la navigation in-app via listenSwMessages.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  usePushFeed,
  getSeenIds,
  markSeen,
  type PushNotif,
  type PushTarget,
} from "../store/push-notifications";
import { onForegroundMessage, listenSwMessages } from "../services/firebase";
import { haptic } from "./ui-extras";

/** Types de notification couvrant à la fois le feed localStorage et les messages FCM. */
type NotifType = PushNotif["type"] | "ride" | "payment" | "system" | "sos";

/** Notification normalisée prête à afficher, quelle que soit la source. */
interface DisplayNotif {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  /** URL de navigation pour les messages FCM avec data.url */
  url?: string;
}

/** Icône Material Symbols Rounded inline. */
function MsIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}

const TYPE_STYLE: Record<NotifType, { icon: string; color: string }> = {
  info:    { icon: "info",           color: "#006A6B" },
  promo:   { icon: "local_activity", color: "#BF360C" },
  success: { icon: "check_circle",   color: "#1B6B42" },
  alert:   { icon: "warning",        color: "#D62828" },
  ride:    { icon: "two_wheeler",    color: "#BF360C" },
  payment: { icon: "payments",       color: "#006A6B" },
  system:  { icon: "info",           color: "#6750A4" },
  sos:     { icon: "sos",            color: "#D62828" },
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
  const [active, setActive] = useState<DisplayNotif | null>(null);
  const mountRef = useRef(Date.now());
  const navigate = useNavigate();

  const matches = (n: PushNotif) =>
    n.target === "all" || n.target === audience;

  // --- Source 1 : messages FCM au premier plan ---
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      const { notification, data } = payload;
      // Messages data-only : titre/corps sont dans data ; repli sur notification
      // pour compat avec d'anciens émetteurs. Les OTP sont gérés ailleurs (login).
      if (data?.type === "otp") return;
      const title = data?.title ?? notification?.title ?? "";
      const body = data?.body ?? notification?.body ?? "";
      if (!title && !body) return;
      const notif: DisplayNotif = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        body,
        type: ((data?.type as NotifType) in TYPE_STYLE
          ? (data?.type as NotifType)
          : "info"),
        url: typeof data?.url === "string" ? data.url : undefined,
      };
      setActive(notif);
      haptic([12, 45, 12]);
    });
    return unsub;
  }, []);

  // --- Source 2 : navigation depuis les notifications background (SW → client) ---
  useEffect(() => {
    const unsub = listenSwMessages((url) => {
      try {
        const relative = url.startsWith(window.location.origin)
          ? url.slice(window.location.origin.length)
          : url;
        navigate(relative || "/");
      } catch {
        window.location.href = url;
      }
    });
    return unsub;
  }, [navigate]);

  // --- Source 3 : flux localStorage (diffusion admin) ---
  useEffect(() => {
    if (active) return;
    const next = feed.find(
      (n) =>
        !seen.has(n.id) &&
        matches(n) &&
        n.createdAt > mountRef.current - 20000, // évite de rejouer l'historique ancien
    );
    if (next) {
      setActive({ id: next.id, title: next.title, body: next.body, type: next.type });
      haptic([12, 45, 12]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, seen, active, audience]);

  // --- Auto-fermeture ---
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function dismiss() {
    setActive((cur) => {
      if (cur && !cur.id.startsWith("fcm-")) {
        // Marquer vu uniquement pour les notifs du feed localStorage
        markSeen(cur.id);
        setSeen((prev) => new Set(prev).add(cur.id));
      }
      return null;
    });
  }

  const style = active
    ? (TYPE_STYLE[active.type] ?? TYPE_STYLE.info)
    : TYPE_STYLE.info;

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
          <div
            className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5"
            style={{ borderLeft: `4px solid ${style.color}` }}
          >
            <div className="relative flex items-start gap-3 p-3.5 pl-4">
              {/* Icône dans une boîte teintée */}
              <div
                className="shrink-0 grid place-items-center h-10 w-10 rounded-xl"
                style={{ background: `${style.color}1A`, color: style.color }}
              >
                <MsIcon name={style.icon} size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--foreground)]">
                  {active.title}
                </p>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {active.body}
                </p>
              </div>

              {/* Bouton fermer */}
              <button
                type="button"
                aria-label="Fermer"
                onClick={dismiss}
                className="shrink-0 -mr-1 -mt-1 rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-black/5 active:scale-90"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: 16,
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                    lineHeight: 1,
                  }}
                >
                  close
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
