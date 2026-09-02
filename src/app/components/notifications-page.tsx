import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Car, Percent, Bell, Wallet,
  Check, Trash2, ChevronRight, BellOff, AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useEffect } from "react";
import { api } from "../api/client";
import { usePushFeed, type PushNotif } from "../store/push-notifications";
import { resetUnread, decUnread } from "../store/unread";
import { M3Page, EmptyState } from "./m3";

interface Notification {
  id: number;
  backendId?: string;
  Icon: React.ElementType;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  accent: string;
  iconBg: string;
  iconColor: string;
  link: string | null;
  category: "course" | "livraison" | "promo" | "system" | "message" | "wallet";
}

/* --- Présentation par type de notification (backend → UI) --- */
const NOTIF_PRESENTATION: Record<string, Pick<Notification, "Icon" | "accent" | "iconBg" | "iconColor" | "link" | "category">> = {
  ride:    { Icon: Car,           accent: "border-l-blue-500",    iconBg: "bg-blue-50",    iconColor: "text-blue-500",    link: "/history", category: "course" },
  payment: { Icon: Wallet,        accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", link: "/wallet",  category: "wallet" },
  promo:   { Icon: Percent,       accent: "border-l-orange-500",  iconBg: "bg-orange-50",  iconColor: "text-orange-500",  link: "/coupons", category: "promo" },
  system:  { Icon: Bell,          accent: "border-l-gray-200",    iconBg: "bg-gray-50",    iconColor: "text-gray-400",    link: null,       category: "system" },
  sos:     { Icon: AlertTriangle, accent: "border-l-red-500",     iconBg: "bg-red-50",     iconColor: "text-red-500",     link: null,       category: "system" },
};

/** Temps relatif court en français. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const j = Math.round(h / 24);
  return j === 1 ? "Hier" : `Il y a ${j} jours`;
}

/** Construit une Notification d'affichage à partir des champs backend/feed. */
function toNotification(
  type: string, title: string, body: string, createdAtIso: string,
  read: boolean, backendId: string, id: number,
): Notification {
  const p = NOTIF_PRESENTATION[type] ?? NOTIF_PRESENTATION.system;
  return {
    id, backendId, Icon: p.Icon, title, desc: body,
    time: relativeTime(createdAtIso), read,
    accent: read ? "border-l-gray-200" : p.accent,
    iconBg: read ? "bg-gray-50" : p.iconBg,
    iconColor: read ? "text-gray-400" : p.iconColor,
    link: p.link, category: p.category,
  };
}

const initialNotifications: Notification[] = [];

type FilterType = "all" | "unread" | "course" | "promo" | "wallet";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialNotifications);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charge les notifications depuis le backend.
  // NB: /notifications renvoie un objet paginé { items, total, ... }.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any>("/notifications?page=1&pageSize=50");
        if (cancelled) return;
        const rows: any[] = Array.isArray(res) ? res : (res?.items ?? []);
        const backendIds = new Set(rows.map((n) => n.id));
        setItems((prev) => {
          // Conserve les notifs temps réel arrivées pendant le fetch (pas encore en base).
          const extra = prev.filter((p) => p.backendId && !backendIds.has(p.backendId));
          const base = rows.map((n, i) => toNotification(n.type, n.title, n.body, n.createdAt, n.read, n.id, i + 1));
          const offset = base.length;
          return [...extra.map((e, i) => ({ ...e, id: offset + i + 1 })), ...base];
        });
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Temps réel : préfixe UNIQUEMENT les notifications diffusées APRÈS le montage.
  // L'historique est déjà chargé par le fetch backend ci-dessus ; réinjecter le
  // feed en mémoire créait une course (préfixe puis écrasé par le fetch) →
  // blocs qui « disparaissent et réapparaissent ».
  const mountedAt = useRef(Date.now());
  const feed = usePushFeed();
  useEffect(() => {
    const relevant = feed.filter(
      (n) => n.createdAt > mountedAt.current && (n.target === "all" || n.target === "clients"),
    );
    if (relevant.length === 0) return;
    setItems((prev) => {
      const known = new Set(prev.map((p) => p.backendId).filter(Boolean));
      const fresh = relevant.filter((n) => !known.has(n.id));
      if (fresh.length === 0) return prev;
      const nextId = prev.reduce((m, p) => Math.max(m, p.id), 0) + 1;
      const mapped = fresh.map((n: PushNotif, i) =>
        toNotification(n.type, n.title, n.body, new Date(n.createdAt).toISOString(), false, n.id, nextId + i),
      );
      return [...mapped, ...prev];
    });
  }, [feed]);

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = items.filter(n => {
    if (filterType === "unread") return !n.read;
    if (filterType === "course") return n.category === "course" || n.category === "livraison";
    if (filterType === "promo") return n.category === "promo";
    if (filterType === "wallet") return n.category === "wallet";
    return true;
  });

  const markAllRead = () => {
    setItems(items.map(n => ({ ...n, read: true })));
    api.post("/notifications/read-all").catch(() => {});
    resetUnread();
    toast.success("Toutes les notifications marquees comme lues");
  };

  const markRead = (id: number) => {
    setItems(prev => prev.map(n => {
      if (n.id !== id) return n;
      if (n.read) return n;                     // déjà lue : ne pas décrémenter
      if (n.backendId) api.post(`/notifications/${n.backendId}/read`).catch(() => {});
      decUnread();
      return { ...n, read: true };
    }));
  };

  const deleteNotif = (id: number) => {
    setItems(prev => prev.filter(n => n.id !== id));
    setSwipedId(null);
    toast("Notification supprimee");
  };

  const clearAll = () => {
    setItems([]);
    setShowClearConfirm(false);
    toast.success("Toutes les notifications supprimees");
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    setSwipedId(null);
    if (n.link) navigate(n.link);
    else if (n.category === "promo") {
      toast("Code promo: WEEKEND20", { description: "Copie dans le presse-papier" });
      navigator.clipboard?.writeText("WEEKEND20");
    } else {
      toast(n.title, { description: n.desc });
    }
  };

  const handleLongPressStart = (id: number) => {
    longPressTimer.current = setTimeout(() => {
      setSwipedId(prev => (prev === id ? null : id));
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const notifHero = (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {([
        { id: "all" as const, label: "Tout" },
        { id: "unread" as const, label: `Non lues (${unreadCount})` },
        { id: "course" as const, label: "Courses" },
        { id: "promo" as const, label: "Promos" },
        { id: "wallet" as const, label: "Cash" },
      ]).map(f => (
        <button key={f.id} onClick={() => setFilterType(f.id)}
          className="px-3.5 py-2 rounded-full text-xs whitespace-nowrap transition"
          style={filterType === f.id
            ? { background: "#ffffff", color: "var(--m3-primary)" }
            : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
          {f.label}
        </button>
      ))}
    </div>
  );

  const notifActions = (
    <div className="flex items-center gap-2">
      {unreadCount > 0 && (
        <button onClick={markAllRead}
          className="text-xs px-3 py-1.5 rounded-full bg-white/15 text-[var(--m3-on-primary)] active:scale-95 transition">
          <Check className="w-3 h-3 inline mr-1" />Tout lire
        </button>
      )}
      {items.length > 0 && (
        <button onClick={() => setShowClearConfirm(true)} aria-label="Tout supprimer"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-[var(--m3-on-primary)] active:scale-95 transition">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <M3Page
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
      icon={Bell}
      back={false}
      trailing={notifActions}
      hero={notifHero}
    >
      <div className="mx-auto max-w-md space-y-2.5">
        {/* Clear confirm */}
        {showClearConfirm && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D62828]" />
              <span className="text-sm text-[#D62828]">Tout supprimer ?</span>
            </div>
            <div className="flex gap-2">
              <button onClick={clearAll} className="text-xs bg-[#D62828] text-white px-3 py-1.5 rounded-lg">Oui</button>
              <button onClick={() => setShowClearConfirm(false)} className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">Non</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <EmptyState
            icon={BellOff}
            title={items.length === 0 ? "Aucune notification" : "Aucune notification dans ce filtre"}
            description={items.length === 0 ? "Vous êtes à jour !" : "Changez de filtre pour voir d'autres notifications."}
          />
        )}

        {filtered.map((n, i) => (
          <motion.div key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.38, 1.21, 0.22, 1] }}
            className="relative overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            {/* Delete button behind */}
            {swipedId === n.id && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 z-0">
                <button onClick={() => { markRead(n.id); setSwipedId(null); }}
                  className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Check className="w-4 h-4 text-blue-500" />
                </button>
                <button onClick={() => deleteNotif(n.id)}
                  className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}

            <div
              onClick={() => handleClick(n)}
              onContextMenu={(e) => { e.preventDefault(); setSwipedId(swipedId === n.id ? null : n.id); }}
              onTouchStart={() => handleLongPressStart(n.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              className={`relative z-10 bg-white p-4 flex items-start gap-3.5 border-l-4 transition shadow-sm cursor-pointer active:bg-slate-50 ${
                !n.read ? n.accent : "border-l-transparent"
              } ${swipedId === n.id ? "-translate-x-24" : ""}`}
              style={{ transition: "transform 0.2s ease-out" }}
            >
              <div className={`w-11 h-11 ${!n.read ? n.iconBg : "bg-gray-50"} rounded-2xl flex items-center justify-center flex-shrink-0 ${!n.read ? "shadow-sm" : ""}`}>
                <n.Icon className={`w-5 h-5 ${!n.read ? n.iconColor : "text-gray-400"}`} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${!n.read ? "text-gray-800" : "text-gray-500"}`}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "var(--m3-primary)" }} />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.desc}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-gray-300">{n.time}</p>
                  {n.link && (
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--m3-primary)" }}>
                      Voir <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Tip */}
        {items.length > 0 && (
          <p className="text-[10px] text-slate-300 text-center pt-4">
            Maintenez appuye sur une notification pour la gerer
          </p>
        )}
      </div>
    </M3Page>
  );
}