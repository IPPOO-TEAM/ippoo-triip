import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Bell, ChevronRight, Star, MapPin, Zap, TrendingUp, Clock,
  Navigation, Phone, MessageSquare, Bike, Package, Truck, Users,
  Wallet, Eye, EyeOff, Shield, Award, Target, Power, Route,
  ArrowUpRight, CheckCircle2, AlertTriangle, Calendar, Flame
} from "lucide-react";
import { ProfileAvatar } from "../profile-avatar";
import { getAvatar } from "../avatars";
import { getGPSPosition } from "../utils";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
interface IncomingRequest {
  id: number;
  type: "course" | "livraison" | "transport" | "groupee";
  clientName: string;
  clientInitials: string;
  clientRating: number;
  from: string;
  to: string;
  distance: string;
  estimatedEarning: number;
  vehicle: string;
  countdown: number;
  urgent: boolean;
}

interface ActiveMission {
  id: string;
  type: string;
  from: string;
  to: string;
  clientName: string;
  clientInitials: string;
  status: "en_route_pickup" | "at_pickup" | "in_progress" | "near_dest";
  estimatedArrival: string;
  earning: number;
}

/* ─── Mock ─── */
const driverProfile = {
  name: "Hounkpatin Akotchaye",
  initials: "HA",
  level: "Gold",
  rating: 4.87,
  totalRides: 1247,
  acceptance: 96,
  cancellation: 2.1,
  todayEarnings: 18500,
  weekEarnings: 87300,
  monthEarnings: 342000,
  balance: 45600,
  online: true,
  vehicle: "Honda CB125 - AB 1234 BJ",
};

const incomingRequests: IncomingRequest[] = [
  {
    id: 1, type: "course", clientName: "Fifame Dossou", clientInitials: "FD",
    clientRating: 4.9, from: "Marche Dantokpa", to: "Campus UAC",
    distance: "5.2 km", estimatedEarning: 1200, vehicle: "Moto", countdown: 25, urgent: false
  },
  {
    id: 2, type: "livraison", clientName: "Aidatou Tokpanou", clientInitials: "AT",
    clientRating: 4.7, from: "Boulevard St-Michel", to: "Godomey, rue 312",
    distance: "6.8 km", estimatedEarning: 1800, vehicle: "Moto cargo", countdown: 30, urgent: true
  },
];

const activeMission: ActiveMission | null = {
  id: "IPP-M-20260411",
  type: "Course moto",
  from: "Carrefour Cadjehoun",
  to: "Hopital CNHU",
  clientName: "Gbètoho Bokossa",
  clientInitials: "GB",
  status: "in_progress",
  estimatedArrival: "5 min",
  earning: 950,
};

const todayMissions = [
  { id: 1, type: "Course", from: "Campus UAC", to: "Dantokpa", time: "07:32", earning: 1200, status: "completed" },
  { id: 2, type: "Livraison", from: "St-Michel", to: "Godomey", time: "09:15", earning: 1500, status: "completed" },
  { id: 3, type: "Course", from: "Akpakpa", to: "Gbegamey", time: "10:48", earning: 800, status: "completed" },
  { id: 4, type: "Course", from: "Cadjehoun", to: "CNHU", time: "12:05", earning: 950, status: "active" },
];

const weeklyChart = [
  { day: "Lun", amount: 14200 },
  { day: "Mar", amount: 18600 },
  { day: "Mer", amount: 12300 },
  { day: "Jeu", amount: 21500 },
  { day: "Ven", amount: 19800 },
  { day: "Sam", amount: 24100 },
  { day: "Dim", amount: 0 },
];

const achievements = [
  { icon: Flame, label: "7 jours consecutifs", color: "#F77F00", progress: 85 },
  { icon: Star, label: "50 avis 5 etoiles", color: "#E9C46A", progress: 72 },
  { icon: Target, label: "100 courses ce mois", color: "#2A9D8F", progress: 63 },
];

export function DriverHomePage() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(driverProfile.online);
  const [showBalance, setShowBalance] = useState(true);
  const [requests, setRequests] = useState(incomingRequests);
  const [countdowns, setCountdowns] = useState<Record<number, number>>({});
  const [currentPosition, setCurrentPosition] = useState("Localisation...");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Bonjour");
    else if (h < 18) setGreeting("Bon apres-midi");
    else setGreeting("Bonsoir");
  }, []);

  useEffect(() => {
    getGPSPosition(
      (label) => setCurrentPosition(label),
      (fallback) => setCurrentPosition(fallback)
    );
  }, []);

  // Countdown timers for incoming requests
  useEffect(() => {
    const init: Record<number, number> = {};
    requests.forEach(r => { init[r.id] = r.countdown; });
    setCountdowns(init);
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          const id = Number(k);
          if (next[id] > 0) next[id]--;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [requests]);

  // Auto-remove expired requests
  useEffect(() => {
    const expired = Object.entries(countdowns).filter(([, v]) => v <= 0).map(([k]) => Number(k));
    if (expired.length > 0) {
      setRequests(prev => prev.filter(r => !expired.includes(r.id)));
    }
  }, [countdowns]);

  const acceptRequest = (id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    navigate("/driver/tracking");
  };

  const rejectRequest = (id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const maxWeekly = Math.max(...weeklyChart.map(d => d.amount));
  const todayCompleted = todayMissions.filter(m => m.status === "completed").length;

  const typeIcon = (type: string) => {
    if (type.includes("Livraison") || type === "livraison") return Package;
    if (type.includes("transport") || type === "transport") return Truck;
    if (type.includes("groupee") || type === "groupee") return Users;
    return Bike;
  };

  const typeColor = (type: string) => {
    if (type.includes("Livraison") || type === "livraison") return "#F77F00";
    if (type.includes("transport")) return "#D62828";
    if (type.includes("groupee")) return "#8B5CF6";
    return "#1E6091";
  };

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* ═══ HEADER ═══ */}
      <div className="relative bg-gradient-to-br from-[#2A9D8F] to-[#1E6091] pt-12 pb-6 px-5 overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-8 bottom-0 w-32 h-32 bg-[#E9C46A]/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain" />
            <div className="flex items-center gap-2">
              {/* Online toggle */}
              <button
                onClick={() => { const next = !isOnline; setIsOnline(next); api.patch("/driver/status", { isOnline: next }).catch(() => {}); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] border transition-all ${isOnline
                    ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                    : "bg-red-500/20 border-red-400/30 text-red-200"
                  }`}
              >
                <Power className="w-3 h-3" />
                {isOnline ? "En ligne" : "Hors ligne"}
              </button>
              <button
                onClick={() => navigate("/driver/notifications")}
                className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-white/80" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#F77F00] rounded-full border border-white/20" />
              </button>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3 mb-5">
            <ProfileAvatar initials="HA" size={52} />
            <div className="flex-1">
              <p className="text-white/60 text-[10px]">{greeting},</p>
              <p className="text-white text-sm">{driverProfile.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 bg-[#E9C46A]/20 rounded-full px-2 py-0.5">
                  <Award className="w-3 h-3 text-[#E9C46A]" />
                  <span className="text-[#E9C46A] text-[9px]">{driverProfile.level}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                  <span className="text-white/80 text-[10px]">{driverProfile.rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4">
            <MapPin className="w-4 h-4 text-[#E9C46A]" />
            <span className="text-white/70 text-[10px] truncate flex-1">{currentPosition}</span>
            <span className="text-[#E9C46A] text-[10px]">{driverProfile.vehicle}</span>
          </div>

          {/* Earning card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-[10px]">Gains d'aujourd'hui</p>
              <button onClick={() => setShowBalance(!showBalance)} className="text-white/40">
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white text-2xl mb-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>
              {showBalance ? `${driverProfile.todayEarnings.toLocaleString()} F` : "*** ***"}
            </p>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% vs hier
              </span>
              <span className="text-white/50">{todayCompleted} courses</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Cette semaine", value: driverProfile.weekEarnings },
                { label: "Ce mois", value: driverProfile.monthEarnings },
                { label: "Solde IPPOO", value: driverProfile.balance },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-white/40 text-[8px]">{s.label}</p>
                  <p className="text-white text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                    {showBalance ? `${(s.value / 1000).toFixed(0)}K` : "***"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ INCOMING REQUESTS ═══ */}
      {isOnline && requests.length > 0 && (
        <div className="px-5 -mt-2 mb-4">
          {requests.map(req => {
            const Icon = typeIcon(req.type);
            const remaining = countdowns[req.id] ?? 0;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/60 p-4 mb-3 relative overflow-hidden">
                {req.urgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D62828] to-[#F77F00]" />
                )}
                {/* Timer */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${typeColor(req.type)}15` }}>
                      <Icon className="w-4 h-4" style={{ color: typeColor(req.type) }} />
                    </div>
                    <div>
                      <p className="text-slate-800 text-xs">{req.type === "course" ? "Course" : req.type === "livraison" ? "Livraison" : "Transport"}</p>
                      <p className="text-slate-400 text-[9px]">{req.vehicle} - {req.distance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 rounded-full px-2.5 py-1">
                    <Clock className="w-3 h-3 text-[#F77F00]" />
                    <span className="text-[#F77F00] text-xs tabular-nums" style={{ fontFamily: "'Space Grotesk', monospace" }}>{remaining}s</span>
                  </div>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 mb-3 bg-slate-50 rounded-xl p-2.5">
                  <ProfileAvatar initials={req.clientInitials} size={36} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{req.clientName}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                      <span className="text-slate-500 text-[10px]">{req.clientRating}</span>
                    </div>
                  </div>
                  <p className="text-[#2A9D8F] text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                    +{req.estimatedEarning} F
                  </p>
                </div>

                {/* Route */}
                <div className="flex items-start gap-2 mb-4 px-1">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]" />
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F77F00]" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-slate-600 text-[11px]">{req.from}</p>
                    <p className="text-slate-600 text-[11px]">{req.to}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs active:bg-slate-50 transition"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="py-3 rounded-xl bg-[#2A9D8F] text-white text-xs shadow-lg shadow-emerald-500/20 active:bg-[#238B7F] transition"
                  >
                    Accepter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ACTIVE MISSION CARD ═══ */}
      {activeMission && (
        <div className="px-5 mb-4">
          <button
            onClick={() => navigate("/driver/tracking")}
            className="w-full bg-gradient-to-r from-[#1E6091] to-[#2A9D8F] rounded-2xl p-4 text-left shadow-lg shadow-blue-500/15"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/80 text-[10px]">Mission en cours</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-white text-sm mb-1">{activeMission.type} - {activeMission.id}</p>
            <div className="flex items-center gap-2 text-white/60 text-[10px]">
              <ProfileAvatar initials={activeMission.clientInitials} size={20} />
              <span>{activeMission.clientName}</span>
              <span className="mx-1">-</span>
              <span>Arrivee dans ~{activeMission.estimatedArrival}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-white/50 text-[10px]">
                  <Route className="w-3 h-3" />
                  {activeMission.from}
                </div>
                <ArrowUpRight className="w-3 h-3 text-white/30" />
                <div className="flex items-center gap-1 text-white/50 text-[10px]">
                  <MapPin className="w-3 h-3" />
                  {activeMission.to}
                </div>
              </div>
              <span className="text-[#E9C46A] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                +{activeMission.earning} F
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ═══ QUICK STATS ═══ */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CheckCircle2, label: "Acceptation", value: `${driverProfile.acceptance}%`, color: "#2A9D8F" },
            { icon: AlertTriangle, label: "Annulation", value: `${driverProfile.cancellation}%`, color: "#D62828" },
            { icon: Bike, label: "Total courses", value: driverProfile.totalRides.toLocaleString(), color: "#1E6091" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-slate-800 text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>{s.value}</p>
              <p className="text-slate-400 text-[9px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ WEEKLY CHART ═══ */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-800 text-xs">Gains cette semaine</p>
            <span className="text-[#2A9D8F] text-[10px]">{(driverProfile.weekEarnings / 1000).toFixed(0)}K FCFA</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weeklyChart.map((d, i) => {
              const height = maxWeekly > 0 ? (d.amount / maxWeekly) * 100 : 0;
              const isToday = i === new Date().getDay() - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full max-w-[24px] rounded-lg transition-all ${isToday ? "bg-gradient-to-t from-[#2A9D8F] to-[#1E6091]" : "bg-slate-100"}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] ${isToday ? "text-[#2A9D8F]" : "text-slate-400"}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ ACHIEVEMENTS ═══ */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-800 text-xs">Objectifs en cours</p>
          <button onClick={() => navigate("/driver/missions")} className="text-[#2A9D8F] text-[10px] flex items-center gap-0.5">
            Tout voir <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {achievements.map((a, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${a.color}15` }}>
                <a.icon className="w-4 h-4" style={{ color: a.color }} />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 text-[11px]">{a.label}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.progress}%`, background: a.color }} />
                </div>
              </div>
              <span className="text-slate-400 text-[10px]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{a.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TODAY'S MISSIONS ═══ */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-800 text-xs">Missions du jour</p>
          <button onClick={() => navigate("/driver/history")} className="text-[#2A9D8F] text-[10px] flex items-center gap-0.5">
            Historique <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {todayMissions.map(m => {
            const Icon = typeIcon(m.type);
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${typeColor(m.type)}10` }}>
                  <Icon className="w-4 h-4" style={{ color: typeColor(m.type) }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-[11px]">{m.type}</p>
                  <p className="text-slate-400 text-[9px]">{m.from} → {m.to}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.earning} F</p>
                  <p className="text-slate-400 text-[9px]">{m.time}</p>
                </div>
                {m.status === "active" && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Wallet, label: "Retrait", path: "/driver/earnings", color: "#2A9D8F" },
            { icon: Calendar, label: "Planning", path: "/driver/missions", color: "#1E6091" },
            { icon: Star, label: "Avis", path: "/driver/rating", color: "#E9C46A" },
            { icon: Shield, label: "Support", path: "/driver/support", color: "#F77F00" },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col items-center gap-1.5 active:bg-slate-50 transition">
              <a.icon className="w-5 h-5" style={{ color: a.color }} />
              <span className="text-slate-600 text-[9px]">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
