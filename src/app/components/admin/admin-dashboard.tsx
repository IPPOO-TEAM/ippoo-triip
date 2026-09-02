import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Users, Car, Route, Wallet, ArrowUpRight,
  Clock, MapPin, Activity, MoreHorizontal, Inbox, Loader2
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { api } from "../../api/client";
import type { AdminStats } from "../../types/domain";

/* --- Métadonnées de service (label + couleur de la charte) — config uniquement --- */
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

type KpiCard = { label: string; value: string; icon: any; color: string; bg: string };

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois">("semaine");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const s = await api.get<AdminStats>("/admin/stats");
        if (!cancelled) setStats(s);
      } catch (e: any) {
        if (!cancelled) {
          setStats(null);
          toast.error("Impossible de charger les statistiques", {
            description: e?.message ?? "Vérifiez votre connexion ou vos droits admin.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const kpis: KpiCard[] = [
    { label: "Utilisateurs total", value: stats ? nf.format(stats.usersTotal) : "—", icon: Users, color: "#1E6091", bg: "bg-blue-50" },
    { label: "Chauffeurs en ligne", value: stats ? nf.format(stats.driversOnline) : "—", icon: Car, color: "#2A9D8F", bg: "bg-emerald-50" },
    { label: "Courses aujourd'hui", value: stats ? nf.format(stats.ridesToday) : "—", icon: Route, color: "#F77F00", bg: "bg-orange-50" },
    { label: "Revenus (jour)", value: stats ? fmtM(stats.revenueTodayXOF) : "—", icon: Wallet, color: "#D62828", bg: "bg-red-50" },
  ];

  const revenueData = (stats?.revenue7d ?? []).map((d) => ({
    name: d.day,
    revenue: d.amountXOF,
    courses: Math.round(d.amountXOF / 500),
  }));

  const totalSvc = (stats?.ridesByService ?? []).reduce((sum, r) => sum + r.count, 0) || 1;
  const serviceBreakdown = (stats?.ridesByService ?? []).map((r) => ({
    name: SERVICE_META[r.service]?.name ?? r.service,
    value: Math.round((r.count / totalSvc) * 100),
    color: SERVICE_META[r.service]?.color ?? "#94a3b8",
  }));

  const liveMetrics = [
    { label: "Courses en cours", value: stats ? nf.format(stats.ridesActive) : "—", icon: Activity, color: "#2A9D8F" },
    { label: "Temps attente moyen", value: "—", icon: Clock, color: "#F77F00" },
    { label: "Zones actives", value: "—", icon: MapPin, color: "#1E6091" },
  ];

  const pendingActions = stats && stats.kycPending > 0
    ? [{ label: "Vérifications KYC en attente", count: stats.kycPending, color: "#F77F00", path: "/admin/drivers" }]
    : [];

  const EmptyBlock = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <Inbox className="w-7 h-7 mb-2" />
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tableau de bord
          </h1>
          <p className="text-slate-500 text-xs mt-1">Vue d'ensemble de la plateforme IPPOO</p>
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
            </div>
            <p className="text-2xl text-slate-900" style={{ fontFamily: "'Space Grotesk', monospace" }}>{loading ? "…" : kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Pending actions */}
      {pendingActions.length > 0 ? (
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
      ) : (
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-slate-400 text-xs text-center">Aucune action en attente pour le moment</p>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-gradient">Revenus & Courses</h3>
            <button onClick={() => toast.info("Filtres avancés bientôt disponibles")} className="text-slate-400 hover:text-slate-600" aria-label="Options"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[260px] text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : revenueData.every((d) => d.revenue === 0) ? (
            <EmptyBlock label="Aucune donnée pour le moment" />
          ) : (
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
          )}
        </div>

        {/* Service breakdown pie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Répartition par service</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[180px] text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : serviceBreakdown.length === 0 ? (
            <EmptyBlock label="Aucune donnée pour le moment" />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Second row: Cities + Top drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cities bar chart — pas de donnée backend disponible */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Courses par ville</h3>
          <EmptyBlock label="Aucune donnée pour le moment" />
        </div>

        {/* Top drivers — pas de donnée backend disponible */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-gradient">Top Chauffeurs du jour</h3>
            <button onClick={() => navigate("/admin/drivers")} className="text-[#1E6091] text-xs flex items-center gap-1 hover:underline">
              Voir tous <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <EmptyBlock label="Aucune donnée pour le moment" />
        </div>
      </div>

      {/* Recent Activity — pas de donnée backend disponible */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-gradient">Activité récente</h3>
          <button onClick={() => navigate("/admin/rides")} className="text-slate-400 text-xs hover:text-slate-600">Tout voir</button>
        </div>
        <EmptyBlock label="Aucune activité pour le moment" />
      </div>
    </div>
  );
}
