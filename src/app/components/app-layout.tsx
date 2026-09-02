import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Home, Clock, Wallet, User, Bell } from "lucide-react";
import { PWAInstallPrompt } from "./pwa-install-prompt";
import { PushNotificationHost } from "./push-host";
import { useScrollRestoration } from "../hooks/use-scroll-restoration";
import { haptic } from "./ui-extras";
import { schemeForPath } from "./m3/scheme";
import { RequireAuth } from "./require-auth";
import { useUnread, resetUnread } from "../store/unread";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnread();

  useEffect(() => {
    if (location.pathname === "/app/notifications") resetUnread();
  }, [location.pathname]);

  const tabs = [
    { path: "/app", icon: Home, label: "Accueil" },
    { path: "/app/history", icon: Clock, label: "Historique" },
    { path: "/app/wallet", icon: Wallet, label: "Cash" },
    { path: "/app/notifications", icon: Bell, label: "Alertes" },
    { path: "/app/profile", icon: User, label: "Profil" },
  ];

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollRestoration(scrollRef);

  // Couleur active de la barre = couleur de la page courante (M3 Expressive)
  const activeColor = schemeForPath(location.pathname).primary;

  return (
    <RequireAuth role="client">
    <div
      className="flex flex-col max-w-md mx-auto bg-[#fbfbff]"
      style={{ height: "100dvh" }}
    >
      {/* Proposition d'installation PWA - uniquement dans l'app, pas la vitrine */}
      <PWAInstallPrompt />

      {/* Notifications push flottantes (diffusées depuis l'admin) */}
      <PushNotificationHost audience="clients" />

      {/* Zone de contenu scrollable - momentum natif + pas de rebond parasite */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        {/* Transition de page native - entrée fluide à chaque navigation */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Bottom tab bar - M3 Expressive : pastille active colorée par page */}
      <nav
        className="shrink-0 flex justify-around items-stretch bg-white/85 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-1px_20px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const showBadge = tab.path === "/app/notifications" && unreadCount > 0;
          return (
            <button
              key={tab.path}
              onClick={() => { haptic(12); navigate(tab.path); }}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 pt-2.5 pb-1.5 active:scale-90 transition-transform duration-150"
              style={{ WebkitTapHighlightColor: "transparent", height: 62 }}
            >
              <span className="relative flex items-center justify-center">
                {/* Pastille active M3 (pill) qui adopte la couleur de la page */}
                <motion.span
                  className="absolute inset-0 -mx-4 -my-1 rounded-full"
                  initial={false}
                  animate={{ opacity: active ? 0.14 : 0, scale: active ? 1 : 0.7 }}
                  transition={{ duration: 0.25, ease: [0.38, 1.21, 0.22, 1] }}
                  style={{ background: activeColor }}
                />
                <tab.icon
                  className="relative w-[23px] h-[23px] transition-colors"
                  style={{ color: active ? activeColor : "#94a3b8" }}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full text-[9px] text-white flex items-center justify-center border-2 border-white px-1 leading-none"
                    style={{ background: "#f77f00" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span
                className="text-[10px] leading-none transition-colors"
                style={{ color: active ? activeColor : "#94a3b8", fontWeight: active ? 600 : 500 }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
    </RequireAuth>
  );
}