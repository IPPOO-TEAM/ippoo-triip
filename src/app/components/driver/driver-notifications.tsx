import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Wallet, Bell, MessageCircle, Trash2, X,
  Navigation, Star, Shield, AlertTriangle, Loader2, BellOff
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { usePushFeed } from "../../store/push-notifications";
import { resetUnread, decUnread } from "../../store/unread";

/* --- Types --- */
type NotifType = "ride" | "payment" | "promo" | "system" | "sos";

interface ApiNotif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata?: { url?: string } | null;
}

type FilterType = "all" | "unread" | "ride" | "payment" | "promo";

/* Type -> présentation épurée (icône + couleurs + lien par défaut) */
const TYPE_META: Record<NotifType, { Icon: React.ElementType; accent: string; iconBg: string; iconColor: string; link: string | null }> = {
  ride:    { Icon: Navigation,    accent: "border-l-blue-500",    iconBg: "bg-blue-50",    iconColor: "text-blue-500",    link: "/driver/missions" },
  payment: { Icon: Wallet,        accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", link: "/driver/earnings" },
  promo:   { Icon: Star,          accent: "border-l-violet-500",  iconBg: "bg-violet-50",  iconColor: "text-violet-500",  link: null },
  system:  { Icon: Shield,        accent: "border-l-slate-400",   iconBg: "bg-slate-50",   iconColor: "text-slate-500",   link: null },
  sos:     { Icon: AlertTriangle, accent: "border-l-red-500",     iconBg: "bg-red-50",     iconColor: "text-red-500",     link: null },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  return `Il y a ${d} jours`;
}

export function DriverNotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ApiNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get<{ items: ApiNotif[] } | ApiNotif[]>("/notifications?page=1&pageSize=50");
        const list = Array.isArray(res) ? res : (res?.items ?? []);
        if (alive) {
          const ids = new Set(list.map((n) => n.id));
          // Conserve les notifs temps réel arrivées pendant le fetch (pas encore en base).
          setItems((prev) => [...prev.filter((p) => !ids.has(p.id)), ...list]);
        }
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Temps réel : préfixe UNIQUEMENT les notifications diffusées APRÈS le montage
  // (l'historique vient du fetch backend) — évite le clignotement des blocs.
  const mountedAt = useRef(Date.now());
  const feed = usePushFeed();
  useEffect(() => {
    const relevant = feed.filter(
      (n) => n.createdAt > mountedAt.current && (n.target === "all" || n.target === "drivers"),
    );
    if (relevant.length === 0) return;
    setItems((prev) => {
      const known = new Set(prev.map((p) => p.id));
      const fresh = relevant
        .filter((n) => !known.has(n.id))
        .map((n): ApiNotif => ({
          id: n.id,
          type: (["ride", "payment", "promo", "system", "sos"] as const).includes(n.type as NotifType)
            ? (n.type as NotifType) : "system",
          title: n.title,
          body: n.body,
          read: false,
          createdAt: new Date(n.createdAt).toISOString(),
        }));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [feed]);

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = items.filter(n => {
    if (filterType === "unread") return !n.read;
    if (filterType === "ride") return n.type === "ride";
    if (filterType === "payment") return n.type === "payment";
    if (filterType === "promo") return n.type === "promo";
    return true;
  });

  const markAllRead = async () => {
    setItems(items.map(n => ({ ...n, read: true })));
    resetUnread();
    try { await api.post("/notifications/read-all", {}); } catch { /* silencieux */ }
    toast.success("Toutes les notifications marquees comme lues");
  };
  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => {
      if (n.id === id && !n.read) decUnread();
      return n.id === id ? { ...n, read: true } : n;
    }));
    try { await api.post(`/notifications/${id}/read`, {}); } catch { /* silencieux */ }
  };
  const deleteNotif = (id: string) => {
    setItems(items.filter(n => n.id !== id));
    toast.success("Notification supprimee");
  };
  const clearAll = () => {
    setItems([]);
    toast.success("Toutes les notifications supprimees");
  };

  const filterTabs = [
    { id: "all" as FilterType, label: "Tout", count: items.length },
    { id: "unread" as FilterType, label: "Non lues", count: unreadCount },
    { id: "ride" as FilterType, label: "Courses", count: items.filter(n => n.type === "ride").length },
    { id: "payment" as FilterType, label: "Paiements", count: items.filter(n => n.type === "payment").length },
    { id: "promo" as FilterType, label: "Promos", count: items.filter(n => n.type === "promo").length },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#2A9D8F] pt-12 pb-5 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white text-sm">Notifications</p>
            <p className="text-white/50 text-[10px]">{unreadCount} non lue{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-[10px]">
              Tout lire
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {filterTabs.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap flex items-center gap-1 transition ${filterType === f.id ? "bg-white text-[#1E6091]" : "bg-white/10 text-white/70"}`}
            >
              {f.label}
              <span className={`min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] ${filterType === f.id ? "bg-[#1E6091] text-white" : "bg-white/15 text-white/50"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 mt-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {items.length === 0 ? (
              <>
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune notification pour le moment</p>
                <p className="text-slate-300 text-[11px] mt-1">Vos alertes de courses et paiements apparaitront ici.</p>
              </>
            ) : (
              <>
                <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune notification dans ce filtre</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(n => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const link = n.metadata?.url ?? meta.link;
            const Icon = meta.Icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (link) navigate(link.startsWith("/") ? link : `/${link}`);
                }}
                className={`w-full bg-white rounded-xl border-l-4 ${n.read ? "border-l-slate-200" : meta.accent} border border-slate-100 p-3 flex items-start gap-3 text-left active:bg-slate-50 transition ${!n.read ? "shadow-sm" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? "bg-slate-50" : meta.iconBg}`}>
                  <Icon className={`w-4 h-4 ${n.read ? "text-slate-400" : meta.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs ${!n.read ? "text-slate-800" : "text-slate-500"}`}>{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-[#F77F00] shrink-0 mt-1" />}
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-2" style={{ lineHeight: 1.5 }}>{n.body}</p>
                  <p className="text-slate-300 text-[9px] mt-1">{relativeTime(n.createdAt)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                  className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </button>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="px-5 mt-4">
          <button onClick={clearAll} className="w-full py-2.5 rounded-xl border border-red-200 text-red-400 text-[10px] flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Tout supprimer
          </button>
        </div>
      )}
    </div>
  );
}
