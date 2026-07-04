import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Home, Clock, Wallet, User, Bell } from "lucide-react";
import { PWAInstallPrompt } from "./pwa-install-prompt";
import { PushNotificationHost } from "./push-host";
import { useScrollRestoration } from "../hooks/use-scroll-restoration";
import { haptic } from "./ui-extras";
import { broadcastPush } from "../store/push-notifications";

const UNREAD_NOTIF_KEY = "ippoo_unread_notifs";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem(UNREAD_NOTIF_KEY);
    return stored !== null ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    if (location.pathname === "/app/notifications") {
      setUnreadCount(0);
      localStorage.setItem(UNREAD_NOTIF_KEY, "0");
    }
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

  // Notification push automatique de bienvenue — une seule fois par session
  useEffect(() => {
    if (sessionStorage.getItem("ippoo_welcome_push")) return;
    sessionStorage.setItem("ippoo_welcome_push", "1");
    const t = setTimeout(() => {
      broadcastPush({
        type: "promo",
        target: "clients",
        title: "Bienvenue sur IPPOO TRIIP 🎉",
        body: "Votre première course est offerte jusqu'à 2 000 FCFA. Profitez-en dès maintenant !",
      });
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-col max-w-md mx-auto bg-white"
      style={{ height: "100dvh" }}
    >
      {/* Proposition d'installation PWA — uniquement dans l'app, pas la vitrine */}
      <PWAInstallPrompt />

      {/* Notifications push flottantes (diffusées depuis l'admin) */}
      <PushNotificationHost audience="clients" />

      {/* Zone de contenu scrollable — momentum natif + pas de rebond parasite */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        {/* Transition de page native — entrée fluide à chaque navigation */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Bottom tab bar — style natif : flou translucide + zone de sécurité */}
      <nav
        className="shrink-0 flex justify-around items-stretch bg-white/85 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-1px_16px_rgba(15,23,42,0.07)]"
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
              className="relative flex flex-col items-center justify-center gap-1 flex-1 pt-2 pb-1.5 active:scale-90 transition-transform duration-150"
              style={{ WebkitTapHighlightColor: "transparent", height: 60 }}
            >
              {/* Pastille active arrondie derrière l'icône (effet natif) */}
              <span className="relative flex items-center justify-center">
                <span
                  className={`absolute inset-0 -mx-3.5 -my-1 rounded-full transition-all duration-200 ${
                    active ? "bg-[#1E6091]/12 scale-100 opacity-100" : "scale-75 opacity-0"
                  }`}
                />
                <tab.icon
                  className={`relative w-[23px] h-[23px] transition-colors ${
                    active ? "text-[#1E6091]" : "text-slate-400"
                  }`}
                  strokeWidth={active ? 2.3 : 1.8}
                />
                {/* Badge notifications */}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] bg-[#F77F00] rounded-full text-[9px] text-black flex items-center justify-center border-2 border-white px-1 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] leading-none transition-colors ${
                  active ? "text-[#1E6091]" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}