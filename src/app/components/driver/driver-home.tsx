import { useState, useEffect } from "react";
import { useUnread } from "../../store/unread";
import { useNavigate } from "react-router";
import {
  Bell, ChevronRight, Star, MapPin, TrendingUp,
  Bike, Package, Truck, Wallet, Eye, EyeOff, Shield, Power, Route,
  ArrowUpRight, CheckCircle2, Calendar
} from "lucide-react";
import { ProfileAvatar } from "../profile-avatar";
import { getGPSPosition } from "../utils";
import { api } from "../../api/client";

/* --- Types (données réelles du backend) --- */
interface DriverProfile {
  id: string;
  fullName: string;
  rating: number;
  totalRides: number;
  isOnline: boolean;
  vehicleType?: string;
  vehiclePlate?: string;
}

interface Earnings {
  netToday: number;
  netWeek: number;
  netMonth: number;
  availableBalance: number;
  ridesToday: number;
  acceptanceRate: number;
  avgPerRide: number;
}

interface Ride {
  id: string;
  serviceType: string;
  status: string;
  origin: { label?: string };
  destination: { label?: string };
  priceXOF: number;
  createdAt: string;
  completedAt: string | null;
}

/* --- Config --- */
const ACTIVE_STATUSES = ["accepted", "arriving", "in_progress"];
const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function serviceLabel(t: string) {
  if (t === "delivery") return "Livraison";
  if (t === "heavy_transport") return "Transport";
  if (t === "carpool") return "Covoiturage";
  return "Course";
}

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export function DriverHomePage() {
  const navigate = useNavigate();
  const unreadNotifs = useUnread();
  const [isOnline, setIsOnline] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [currentPosition, setCurrentPosition] = useState("Localisation...");
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [missions, setMissions] = useState<Ride[]>([]);

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

  // Chargement des données réelles du chauffeur
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, e, m] = await Promise.all([
        api.get<DriverProfile>("/driver/me").catch(() => null),
        api.get<Earnings>("/driver/earnings").catch(() => null),
        api.get<Ride[]>("/driver/missions").catch(() => [] as Ride[]),
      ]);
      if (cancelled) return;
      if (p) { setProfile(p); setIsOnline(!!p.isOnline); }
      if (e) setEarnings(e);
      setMissions(Array.isArray(m) ? m : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const name = profile?.fullName ?? "";
  const initials = initialsOf(name);
  const vehicle = profile ? [profile.vehicleType, profile.vehiclePlate].filter(Boolean).join(" - ") : "";

  const todayEarnings = earnings?.netToday ?? 0;
  const weekEarnings = earnings?.netWeek ?? 0;
  const monthEarnings = earnings?.netMonth ?? 0;
  const balance = earnings?.availableBalance ?? 0;

  // Missions du jour (réelles) + mission active
  const now = new Date();
  const todayMissions = missions.filter((m) => isSameDay(m.createdAt, now));
  const activeMission = missions.find((m) => ACTIVE_STATUSES.includes(m.status)) ?? null;
  const todayCompleted = todayMissions.filter((m) => m.status === "completed").length;

  // Graphe hebdo dérivé des courses terminées cette semaine
  const weeklyChart = (() => {
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // lundi
    const buckets = [0, 0, 0, 0, 0, 0, 0]; // Lun..Dim
    missions.forEach((m) => {
      if (m.status !== "completed") return;
      const d = new Date(m.completedAt ?? m.createdAt);
      if (d < startOfWeek) return;
      const idx = (d.getDay() + 6) % 7;
      buckets[idx] += m.priceXOF ?? 0;
    });
    const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    return labels.map((day, i) => ({ day, amount: buckets[i] }));
  })();
  const maxWeekly = Math.max(0, ...weeklyChart.map((d) => d.amount));

  const typeIcon = (type: string) => {
    if (type === "delivery") return Package;
    if (type === "heavy_transport") return Truck;
    if (type === "carpool") return Route;
    return Bike;
  };

  const typeColor = (type: string) => {
    if (type === "delivery") return "#F77F00";
    if (type === "heavy_transport") return "#D62828";
    if (type === "carpool") return "#06B6D4";
    return "#1E6091";
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* --- HEADER --- */}
      <div className="relative bg-[#2A9D8F] pt-12 pb-6 px-5 overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-8 bottom-0 w-32 h-32 bg-[#E9C46A]/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-xs leading-none" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>I</span>
              </div>
              <span className="text-white font-extrabold text-sm tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>TRIIP</span>
            </div>
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
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F77F00] text-[10px] font-bold text-black flex items-center justify-center border border-white/20 leading-none">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3 mb-5">
            <ProfileAvatar initials={initials} photoUrl={profile?.avatarUrl} size={52} />
            <div className="flex-1">
              <p className="text-white/60 text-[10px]">{greeting},</p>
              <p className="text-white text-sm">{name || (loading ? "Chargement..." : "Chauffeur")}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                  <span className="text-white/80 text-[10px]">{profile ? profile.rating.toFixed(2) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4">
            <MapPin className="w-4 h-4 text-[#E9C46A]" />
            <span className="text-white/70 text-[10px] truncate flex-1">{currentPosition}</span>
            {vehicle && <span className="text-[#E9C46A] text-[10px]">{vehicle}</span>}
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
              {showBalance ? `${todayEarnings.toLocaleString()} F` : "*** ***"}
            </p>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-white/50">{todayCompleted} courses</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Cette semaine", value: weekEarnings },
                { label: "Ce mois", value: monthEarnings },
                { label: "Solde IPPOO", value: balance },
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

      {/* --- ACTIVE MISSION CARD --- */}
      {activeMission && (
        <div className="px-5 mb-4 mt-4">
          <button
            onClick={() => navigate("/driver/tracking")}
            className="w-full bg-[#1E6091] rounded-2xl p-4 text-left shadow-sm shadow-blue-500/15"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/80 text-[10px]">Mission en cours</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-white text-sm mb-1">{serviceLabel(activeMission.serviceType)} - {activeMission.id}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-white/50 text-[10px]">
                  <Route className="w-3 h-3" />
                  {activeMission.origin?.label ?? "—"}
                </div>
                <ArrowUpRight className="w-3 h-3 text-white/30" />
                <div className="flex items-center gap-1 text-white/50 text-[10px]">
                  <MapPin className="w-3 h-3" />
                  {activeMission.destination?.label ?? "—"}
                </div>
              </div>
              <span className="text-[#E9C46A] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                +{activeMission.priceXOF} F
              </span>
            </div>
          </button>
        </div>
      )}

      {/* --- QUICK STATS --- */}
      <div className="px-5 mb-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CheckCircle2, label: "Acceptation", value: earnings ? `${Math.round(earnings.acceptanceRate * 100)}%` : "—", color: "#2A9D8F" },
            { icon: TrendingUp, label: "Moy/course", value: earnings ? `${earnings.avgPerRide} F` : "—", color: "#F77F00" },
            { icon: Bike, label: "Total courses", value: profile ? profile.totalRides.toLocaleString() : "—", color: "#1E6091" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-slate-800 text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>{s.value}</p>
              <p className="text-slate-400 text-[9px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- WEEKLY CHART --- */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-800 text-xs">Gains cette semaine</p>
            <span className="text-[#2A9D8F] text-[10px]">{(weekEarnings / 1000).toFixed(0)}K FCFA</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weeklyChart.map((d, i) => {
              const height = maxWeekly > 0 ? (d.amount / maxWeekly) * 100 : 0;
              const isToday = i === (new Date().getDay() + 6) % 7;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full max-w-[24px] rounded-lg transition-all ${isToday ? "bg-[#2A9D8F]" : "bg-slate-100"}`}
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

      {/* --- TODAY'S MISSIONS --- */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-800 text-xs">Missions du jour</p>
          <button onClick={() => navigate("/driver/history")} className="text-[#2A9D8F] text-[10px] flex items-center gap-0.5">
            Historique <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2A9D8F] rounded-full animate-spin" />
          </div>
        ) : todayMissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 py-8 text-center">
            <Route className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Aucune mission aujourd'hui</p>
            <p className="text-slate-300 text-[10px]">Passez en ligne pour recevoir des demandes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMissions.map((m) => {
              const Icon = typeIcon(m.serviceType);
              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${typeColor(m.serviceType)}10` }}>
                    <Icon className="w-4 h-4" style={{ color: typeColor(m.serviceType) }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 text-[11px]">{serviceLabel(m.serviceType)}</p>
                    <p className="text-slate-400 text-[9px]">{m.origin?.label ?? "—"} → {m.destination?.label ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.priceXOF} F</p>
                    <p className="text-slate-400 text-[9px]">{fmtTime(m.createdAt)}</p>
                  </div>
                  {ACTIVE_STATUSES.includes(m.status) && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- QUICK ACTIONS --- */}
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
