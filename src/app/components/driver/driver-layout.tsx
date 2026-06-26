import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Home, Clock, Wallet, User, Bell, Navigation } from "lucide-react";
import { PWAInstallPrompt } from "../pwa-install-prompt";
import { useScrollRestoration } from "../../hooks/use-scroll-restoration";

const UNREAD_NOTIF_KEY = "ippoo_driver_unread_notifs";

export function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem(UNREAD_NOTIF_KEY);
    return stored !== null ? parseInt(stored, 10) : 5;
  });

  useEffect(() => {
    if (location.pathname === "/driver/notifications") {
      setUnreadCount(0);
      localStorage.setItem(UNREAD_NOTIF_KEY, "0");
    }
  }, [location.pathname]);

  const tabs = [
    { path: "/driver", icon: Home, label: "Tableau" },
    { path: "/driver/missions", icon: Navigation, label: "Missions" },
    { path: "/driver/earnings", icon: Wallet, label: "Gains" },
    { path: "/driver/notifications", icon: Bell, label: "Alertes" },
    { path: "/driver/profile", icon: User, label: "Profil" },
  ];

  const isActive = (path: string) => {
    if (path === "/driver") return location.pathname === "/driver";
    return location.pathname.startsWith(path);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollRestoration(scrollRef);

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white" style={{ height: "100dvh" }}>
      <PWAInstallPrompt />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </div>
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
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#2A9D8F]" />
              )}
              <tab.icon
                className={`w-[22px] h-[22px] ${active ? "text-[#2A9D8F]" : "text-gray-400"}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={`text-[10px] ${active ? "text-[#2A9D8F]" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {tab.path === "/driver/notifications" && unreadCount > 0 && (
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
