import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Users, Car, Route, Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  Bike, Package, Truck, Globe, Plane, ShoppingBag, AlertTriangle,
  CheckCircle2, Clock, MapPin, Activity, Eye, MoreHorizontal
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { getAvatar } from "../avatars";
import { api } from "../../api/client";
import type { AdminStats } from "../../types/domain";

/* ─── Données par défaut (repli si le backend mock est indisponible) ─── */
const DEFAULT_KPIS = [
  { label: "Utilisateurs actifs", value: "152,847", change: "+12.3%", up: true, icon: Users, color: "#1E6091", bg: "bg-blue-50" },
  { label: "Chauffeurs en ligne", value: "3,204", change: "+5.7%", up: true, icon: Car, color: "#2A9D8F", bg: "bg-emerald-50" },
  { label: "Courses aujourd'hui", value: "8,421", change: "+18.2%", up: true, icon: Route, color: "#F77F00", bg: "bg-orange-50" },
  { label: "Revenus (jour)", value: "4.2M FCFA", change: "-2.1%", up: false, icon: Wallet, color: "#D62828", bg: "bg-red-50" },
];

const DEFAULT_REVENUE = [
  { name: "Lun", revenue: 3200000, courses: 6800 },
  { name: "Mar", revenue: 3800000, courses: 7200 },
  { name: "Mer", revenue: 4100000, courses: 7800 },
  { name: "Jeu", revenue: 3600000, courses: 7100 },
  { name: "Ven", revenue: 4500000, courses: 8500 },
  { name: "Sam", revenue: 5200000, courses: 9200 },
  { name: "Dim", revenue: 4200000, courses: 8400 },
];

const DEFAULT_SERVICES = [
  { name: "Taxi-Moto", value: 42, color: "#F77F00" },
  { name: "Livraison", value: 28, color: "#2A9D8F" },
  { name: "Transport lourd", value: 12, color: "#D62828" },
  { name: "Covoiturage", value: 10, color: "#1E6091" },
  { name: "Groupée", value: 5, color: "#8B5CF6" },
  { name: "IPPOO AIR", value: 3, color: "#E9C46A" },
];

/* ─── Métadonnées de service (label + couleur de la charte) ─── */
const SERVICE_META: Record<string, { name: string; color: string }> = {
  taxi_moto:       { name: "Taxi-Moto",       color: "#F77F00" },
  delivery:        { name: "Livraison",       color: "#2A9D8F" },
  heavy_transport: { name: "Transport lourd", color: "#D62828" },
  carpool:         { name: "Covoiturage",     color: "#1E6091" },
  group_order:     { name: "Groupée",         color: "#8B5CF6" },
  air_freight:     { name: "IPPOO AIR",       color: "#E9C46A" },
};

const nf = new Intl.NumberFormat("fr-FR");
const fmtM = (xof: number) => `${(xof / 1_000_000).toFixed(1)}M FCFA`;

const cityData = [
  { name: "Cotonou", courses: 4200 },
  { name: "Porto-Novo", courses: 1800 },
  { name: "Parakou", courses: 980 },
  { name: "Abomey-Calavi", courses: 760 },
  { name: "Bohicon", courses: 420 },
  { name: "Natitingou", courses: 261 },
];

const recentActivity = [
  { id: 1, type: "new_user", text: "Nouvel utilisateur : Adjovi Ganfon", time: "Il y a 2 min", icon: Users, color: "#1E6091" },
  { id: 2, type: "driver_approved", text: "Chauffeur approuvé : Koffi Adjibadé", time: "Il y a 8 min", icon: CheckCircle2, color: "#2A9D8F" },
  { id: 3, type: "alert", text: "Alerte SOS déclenchée · Course #IP-8842", time: "Il y a 15 min", icon: AlertTriangle, color: "#D62828" },
  { id: 4, type: "payout", text: "Retrait validé : 125,000 FCFA · Togbédji M.", time: "Il y a 22 min", icon: Wallet, color: "#F77F00" },
  { id: 5, type: "new_driver", text: "Demande chauffeur : Sèdégan Houéfa", time: "Il y a 30 min", icon: Car, color: "#8B5CF6" },
  { id: 6, type: "support", text: "Ticket support #1247 résolu", time: "Il y a 45 min", icon: CheckCircle2, color: "#2A9D8F" },
];

const topDrivers = [
  { name: "Hounkpatin Akotchaye", initials: "HA", rides: 47, rating: 4.87, revenue: "142,500 FCFA" },
  { name: "Koffi Adjibadé", initials: "GB", rides: 42, rating: 4.92, revenue: "128,000 FCFA" },
  { name: "Aïdatou Bello", initials: "AB", rides: 38, rating: 4.95, revenue: "115,200 FCFA" },
  { name: "Togbédji Mensah", initials: "TM", rides: 35, rating: 4.78, revenue: "108,000 FCFA" },
];

const pendingActions = [
  { label: "Documents chauffeurs à vérifier", count: 23, color: "#F77F00", path: "/admin/drivers" },
  { label: "Tickets support ouverts", count: 18, color: "#D62828", path: "/admin/support" },
  { label: "Retraits en attente", count: 12, color: "#1E6091", path: "/admin/finances" },
  { label: "Signalements à traiter", count: 5, color: "#8B5CF6", path: "/admin/support" },
];

const DEFAULT_LIVE = [
  { label: "Courses en cours", value: "847", icon: Activity, color: "#2A9D8F" },
  { label: "Temps attente moyen", value: "2.4 min", icon: Clock, color: "#F77F00" },
  { label: "Zones actives", value: "32", icon: MapPin, color: "#1E6091" },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois">("semaine");

  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [revenueData, setRevenueData] = useState(DEFAULT_REVENUE);
  const [serviceBreakdown, setServiceBreakdown] = useState(DEFAULT_SERVICES);
  const [liveMetrics, setLiveMetrics] = useState(DEFAULT_LIVE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.get<AdminStats>("/admin/stats");
        if (cancelled) return;

        setKpis([
          { ...DEFAULT_KPIS[0], value: nf.format(s.usersTotal) },
          { ...DEFAULT_KPIS[1], value: nf.format(s.driversOnline) },
          { ...DEFAULT_KPIS[2], value: nf.format(s.ridesToday) },
          { ...DEFAULT_KPIS[3], value: fmtM(s.revenueTodayXOF) },
        ]);

        setRevenueData(s.revenue7d.map((d) => ({
          name: d.day,
          revenue: d.amountXOF,
          courses: Math.round(d.amountXOF / 500),
        })));

        const total = s.ridesByService.reduce((sum, r) => sum + r.count, 0) || 1;
        setServiceBreakdown(s.ridesByService.map((r) => ({
          name: SERVICE_META[r.service]?.name ?? r.service,
          value: Math.round((r.count / total) * 100),
          color: SERVICE_META[r.service]?.color ?? "#94a3b8",
        })));

        setLiveMetrics([
          { ...DEFAULT_LIVE[0], value: nf.format(s.ridesActive) },
          DEFAULT_LIVE[1],
          DEFAULT_LIVE[2],
        ]);
      } catch {
        /* repli silencieux sur les données par défaut */
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tableau de bord
          </h1>
          <p className="text-slate-500 text-xs mt-1">Vue d'ensemble de la plateforme IPPOO · Samedi 11 Avril 2026</p>
        </div>
        <div className="flex items-center gap-2">
          {(["jour", "semaine", "mois"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs transition ${
                period === p ? "bg-[#1E6091] text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:border-[#1E6091]"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Live metrics bar */}
      <div className="bg-[#1E6091] rounded-2xl p-4 flex flex-wrap gap-4 md:gap-8 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs">En direct</span>
        </div>
        {liveMetrics.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <m.icon className="w-4 h-4 text-white/60" />
            <span className="text-white text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.value}</span>
            <span className="text-white/50 text-[10px]">{m.label}</span>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${kpi.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl text-slate-900" style={{ fontFamily: "'Space Grotesk', monospace" }}>{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Pending actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pendingActions.map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(a.path)}
            className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl" style={{ fontFamily: "'Space Grotesk', monospace", color: a.color }}>{a.count}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
            </div>
            <p className="text-slate-500 text-[11px]">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-gradient">Revenus & Courses</h3>
            <button onClick={() => toast.info("Filtres avancés bientôt disponibles")} className="text-slate-400 hover:text-slate-600" aria-label="Options"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                key="tooltip"
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? `${(value / 1000000).toFixed(2)}M FCFA` : value,
                  name === "revenue" ? "Revenus" : "Courses"
                ]}
              />
              <Area key="area-revenue" type="monotone" dataKey="revenue" stroke="#1E6091" strokeWidth={2} fill="#1E6091" fillOpacity={0.1} />
              <Area key="area-courses" type="monotone" dataKey="courses" stroke="#F77F00" strokeWidth={2} fill="#F77F00" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service breakdown pie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Répartition par service</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie key="pie" data={serviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {serviceBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="tooltip" formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {serviceBreakdown.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[10px] text-slate-500 truncate">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row: Cities + Top drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cities bar chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Courses par ville</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityData} layout="vertical">
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis key="xaxis" type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip key="tooltip" contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar key="bar" dataKey="courses" fill="#2A9D8F" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top drivers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-gradient">Top Chauffeurs du jour</h3>
            <button onClick={() => navigate("/admin/drivers")} className="text-[#1E6091] text-xs flex items-center gap-1 hover:underline">
              Voir tous <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topDrivers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                <span className="text-slate-300 text-xs w-5" style={{ fontFamily: "'Space Grotesk', monospace" }}>#{i + 1}</span>
                <img src={getAvatar(d.initials) || ""} alt={d.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm truncate">{d.name}</p>
                  <p className="text-slate-400 text-[10px]">{d.rides} courses · ⭐ {d.rating}</p>
                </div>
                <span className="text-xs text-[#2A9D8F]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{d.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-gradient">Activité récente</h3>
          <button onClick={() => navigate("/admin/rides")} className="text-slate-400 text-xs hover:text-slate-600">Tout voir</button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                <a.icon className="w-4 h-4" style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-600 text-xs truncate">{a.text}</p>
              </div>
              <span className="text-slate-400 text-[10px] shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}