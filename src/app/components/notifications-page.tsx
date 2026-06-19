import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Car, Package, Percent, Bell, MessageCircle, Wallet,
  Check, Trash2, X, ChevronRight, Filter, BellOff, AlertTriangle
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { useEffect } from "react";
import { api } from "../api/client";

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

/* ─── Présentation par type de notification (backend → UI) ─── */
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

const initialNotifications: Notification[] = [
  { id: 1, Icon: Car, title: "Course acceptee", desc: "Hounkpatin A. arrive dans 3 min, Honda CB125 (AB 1234 BJ)", time: "Il y a 2 min", read: false, accent: "border-l-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-500", link: "/tracking", category: "course" },
  { id: 2, Icon: Package, title: "Colis livre avec succes", desc: "Votre colis #IPP-20260409 a ete livre a Godomey. Destinataire: Aїdatou T.", time: "Il y a 30 min", read: false, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", link: "/history", category: "livraison" },
  { id: 3, Icon: Percent, title: "20% de reduction ce week-end !", desc: "Utilisez le code WEEKEND20 sur votre prochaine course. Valable samedi et dimanche.", time: "Il y a 1h", read: false, accent: "border-l-orange-500", iconBg: "bg-orange-50", iconColor: "text-orange-500", link: "/coupons", category: "promo" },
  { id: 4, Icon: Bell, title: "Mise a jour disponible", desc: "Nouvelle version IPPOO v2.1 avec amelioration des performances et correction de bugs.", time: "Il y a 3h", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: null, category: "system" },
  { id: 5, Icon: MessageCircle, title: "Nouveau message du support", desc: "Support : Votre ticket #102 'Facturation incorrecte' a ete resolu. Remboursement effectue.", time: "Hier", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/support", category: "message" },
  { id: 6, Icon: Wallet, title: "Recharge reussie", desc: "+5 000 FCFA via MTN Mobile Money. Nouveau solde: 12 300 FCFA.", time: "Hier", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/wallet", category: "wallet" },
  { id: 7, Icon: Car, title: "Course terminee", desc: "Course Campus → Cotonou Centre terminee. Prix: 1 200 FCFA. Notez votre chauffeur !", time: "Hier", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/history", category: "course" },
  { id: 8, Icon: AlertTriangle, title: "Verification requise", desc: "Votre justificatif de domicile est en attente de verification. Temps restant: 48h.", time: "Il y a 2 jours", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/profile", category: "system" },
];

type FilterType = "all" | "unread" | "course" | "promo" | "wallet";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialNotifications);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charge les notifications depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any[]>("/notifications");
        if (cancelled || !res?.length) return;
        setItems(res.map((n, i) => {
          const p = NOTIF_PRESENTATION[n.type] ?? NOTIF_PRESENTATION.system;
          return {
            id: i + 1,
            backendId: n.id,
            Icon: p.Icon,
            title: n.title,
            desc: n.body,
            time: relativeTime(n.createdAt),
            read: n.read,
            accent: n.read ? "border-l-gray-200" : p.accent,
            iconBg: n.read ? "bg-gray-50" : p.iconBg,
            iconColor: n.read ? "text-gray-400" : p.iconColor,
            link: p.link,
            category: p.category,
          };
        }));
      } catch {
        /* repli silencieux sur initialNotifications */
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    toast.success("Toutes les notifications marquees comme lues");
  };

  const markRead = (id: number) => {
    setItems(prev => prev.map(n => {
      if (n.id !== id) return n;
      if (n.backendId) api.post(`/notifications/${n.backendId}/read`).catch(() => {});
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

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-white px-5 pt-14 pb-4 rounded-b-[2rem] shadow-sm shadow-blue-100/30 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-gray-800">Notifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full active:bg-blue-100 transition">
                  <Check className="w-3 h-3 inline mr-1" />Tout lire
                </button>
              )}
              {items.length > 0 && (
                <button onClick={() => setShowClearConfirm(true)} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center active:bg-slate-100 transition">
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { id: "all" as const, label: "Tout" },
              { id: "unread" as const, label: `Non lues (${unreadCount})` },
              { id: "course" as const, label: "Courses" },
              { id: "promo" as const, label: "Promos" },
              { id: "wallet" as const, label: "Cash" },
            ]).map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-2 rounded-full text-xs whitespace-nowrap transition ${filterType === f.id ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-100 text-slate-500 active:bg-slate-200"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-2.5">
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
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm mb-1">
              {items.length === 0 ? "Aucune notification" : "Aucune notification dans ce filtre"}
            </p>
            <p className="text-slate-400 text-xs">
              {items.length === 0 ? "Vous etes a jour !" : "Changez de filtre pour voir d'autres notifications"}
            </p>
          </div>
        )}

        {filtered.map((n) => (
          <div key={n.id} className="relative overflow-hidden rounded-2xl">
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
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.desc}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-gray-300">{n.time}</p>
                  {n.link && (
                    <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                      Voir <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Tip */}
        {items.length > 0 && (
          <p className="text-[10px] text-slate-300 text-center pt-4">
            Maintenez appuye sur une notification pour la gerer
          </p>
        )}
      </div>
    </div>
  );
}