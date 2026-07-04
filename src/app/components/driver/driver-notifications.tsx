import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Bike, Package, Wallet, Bell, MessageCircle,
  Check, Trash2, X, ChevronRight, AlertTriangle, Star,
  Gift, Shield, Navigation, Clock, Zap, TrendingUp, Award,
  Calendar, Phone, Users, BellOff
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
interface Notification {
  id: number;
  Icon: React.ElementType;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  accent: string;
  iconBg: string;
  iconColor: string;
  link: string | null;
  category: "mission" | "earning" | "bonus" | "system" | "message" | "rating" | "document";
}

type FilterType = "all" | "unread" | "mission" | "earning" | "bonus";

const initialNotifications: Notification[] = [
  { id: 1, Icon: Navigation, title: "Nouvelle demande de course", desc: "Fifamè D. demande une course moto de Dantokpa vers Campus UAC. Distance: 5.2 km - Gain: +1 200 F", time: "Il y a 30s", read: false, accent: "border-l-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-500", link: "/driver/missions", category: "mission" },
  { id: 2, Icon: Package, title: "Livraison urgente disponible", desc: "Colis 3.5 kg de Boulevard St-Michel vers Godomey. Gain: +1 800 F (urgent)", time: "Il y a 2 min", read: false, accent: "border-l-orange-500", iconBg: "bg-orange-50", iconColor: "text-orange-500", link: "/driver/missions", category: "mission" },
  { id: 3, Icon: Wallet, title: "Retrait effectue", desc: "10 000 FCFA retires via MTN MoMo. Nouveau solde disponible: 30 600 FCFA.", time: "Il y a 1h", read: false, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", link: "/driver/earnings", category: "earning" },
  { id: 4, Icon: Star, title: "Nouvel avis client", desc: "Gbètoho B. vous a attribue 5 etoiles: 'Excellent chauffeur, très ponctuel et courtois'", time: "Il y a 2h", read: false, accent: "border-l-amber-500", iconBg: "bg-amber-50", iconColor: "text-amber-500", link: "/driver/rating", category: "rating" },
  { id: 5, Icon: Zap, title: "Bonus heure de pointe!", desc: "Gagnez +30% de bonus sur toutes les courses entre 17h et 20h ce soir.", time: "Il y a 3h", read: false, accent: "border-l-violet-500", iconBg: "bg-violet-50", iconColor: "text-violet-500", link: "/driver/missions", category: "bonus" },
  { id: 6, Icon: TrendingUp, title: "Objectif atteint!", desc: "Felicitations! Vous avez atteint 25 courses cette semaine. Bonus de 2 000 F credite.", time: "Il y a 5h", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/driver/earnings", category: "bonus" },
  { id: 7, Icon: Shield, title: "Documents a renouveler", desc: "Votre carte grise expire dans 15 jours. Mettez-la a jour pour continuer a recevoir des missions.", time: "Hier", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/driver/profile", category: "document" },
  { id: 8, Icon: Calendar, title: "Mission planifiee demain", desc: "Rappel: Course vers l'Aeroport demain à 08h00. Client: Sessinou A.", time: "Hier", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/driver/missions", category: "mission" },
  { id: 9, Icon: MessageCircle, title: "Message du support", desc: "Support: Votre ticket #205 'Contestation tarif course' a ete resolu en votre faveur.", time: "Il y a 2 jours", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/driver/support", category: "message" },
  { id: 10, Icon: Award, title: "Niveau Gold atteint!", desc: "Bravo! Vous etes maintenant chauffeur Gold. Priorite sur les courses premium.", time: "Il y a 3 jours", read: true, accent: "border-l-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-400", link: "/driver/profile", category: "bonus" },
];

export function DriverNotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialNotifications);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = items.filter(n => {
    if (filterType === "unread") return !n.read;
    if (filterType === "mission") return n.category === "mission";
    if (filterType === "earning") return n.category === "earning" || n.category === "rating";
    if (filterType === "bonus") return n.category === "bonus";
    return true;
  });

  const markAllRead = () => {
    setItems(items.map(n => ({ ...n, read: true })));
    toast.success("Toutes les notifications marquees comme lues");
  };
  const markRead = (id: number) => setItems(items.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id: number) => {
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
    { id: "mission" as FilterType, label: "Missions", count: items.filter(n => n.category === "mission").length },
    { id: "earning" as FilterType, label: "Gains", count: items.filter(n => n.category === "earning" || n.category === "rating").length },
    { id: "bonus" as FilterType, label: "Bonus", count: items.filter(n => n.category === "bonus").length },
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
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune notification</p>
          </div>
        )}
        {filtered.map(n => (
          <button
            key={n.id}
            onClick={() => {
              markRead(n.id);
              if (n.link) navigate(n.link);
            }}
            className={`w-full bg-white rounded-xl border-l-4 ${n.read ? "border-l-slate-200" : n.accent} border border-slate-100 p-3 flex items-start gap-3 text-left active:bg-slate-50 transition ${!n.read ? "shadow-sm" : ""}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.iconBg}`}>
              <n.Icon className={`w-4 h-4 ${n.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs ${!n.read ? "text-slate-800" : "text-slate-500"}`}>{n.title}</p>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#F77F00] shrink-0 mt-1" />}
              </div>
              <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-2" style={{ lineHeight: 1.5 }}>{n.desc}</p>
              <p className="text-slate-300 text-[9px] mt-1">{n.time}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
              className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </button>
        ))}
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
