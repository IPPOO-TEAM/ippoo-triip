import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Home, Clock, Wallet, User, Bell } from "lucide-react";
import { PWAInstallPrompt } from "./pwa-install-prompt";

const UNREAD_NOTIF_KEY = "ippoo_unread_notifs";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem(UNREAD_NOTIF_KEY);
    return stored !== null ? parseInt(stored, 10) : 3;
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

  return (
    <div
      className="flex flex-col max-w-md mx-auto bg-white"
      style={{ height: "100dvh" }}
    >
      {/* Proposition d'installation PWA — uniquement dans l'app, pas la vitrine */}
      <PWAInstallPrompt />

      {/* Zone de contenu scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom nav — figé en bas, sans effets de survol */}
      <nav
        className="shrink-0 flex justify-around items-center bg-white border-t border-slate-100 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
        style={{ height: 64 }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Indicateur actif — barre en haut */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#1E6091]"
                />
              )}

              <tab.icon
                className={`w-[22px] h-[22px] ${
                  active ? "text-[#1E6091]" : "text-gray-400"
                }`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] ${
                  active ? "text-[#1E6091]" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>

              {/* Badge notifications */}
              {tab.path === "/notifications" && unreadCount > 0 && (
                <span className="absolute top-2 right-[18%] min-w-[16px] h-[16px] bg-[#F77F00] rounded-full text-[9px] text-white flex items-center justify-center border border-white px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}