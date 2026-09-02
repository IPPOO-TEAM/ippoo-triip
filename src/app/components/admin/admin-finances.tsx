import { useEffect, useState } from "react";
import {
  Wallet, TrendingUp, Download, Clock,
  Banknote, PiggyBank, Loader2, Inbox
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { downloadBlob } from "../utils";
import { api } from "../../api/client";

/* --- Types --- */
type Finances = {
  grossRevenue: number;
  netRevenue: number;
  pendingPayouts: number;
  totalTransactions: number;
  revenueByMethod: Record<string, number>;
};

/* --- Config (libellés moyens de paiement) --- */
const methodLabel: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  moov_money: "Moov Money",
  celtiis_cash: "Celtiis Cash",
  card: "Carte bancaire",
  cash: "Espèces",
  wallet: "IPPOO Cash",
  unknown: "Autre",
};

const nf = new Intl.NumberFormat("fr-FR");
const fmtXof = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M FCFA`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K FCFA`;
  return `${nf.format(v)} FCFA`;
};

export function AdminFinancesPage() {
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois">("semaine");
  const [data, setData] = useState<Finances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const d = await api.get<Finances>("/admin/finances");
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const methodChart = data
    ? Object.entries(data.revenueByMethod ?? {}).map(([m, pct]) => ({ name: methodLabel[m] ?? m, value: pct }))
    : [];

  const exportCSV = () => {
    if (!data) return;
    const h = "Indicateur,Valeur\n";
    const rows = [
      ["Revenus bruts", data.grossRevenue],
      ["Revenus nets", data.netRevenue],
      ["Retraits en attente", data.pendingPayouts],
      ["Transactions", data.totalTransactions],
    ].map(r => r.join(","));
    downloadBlob(h + rows.join("\n"), `finances-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast.success("Rapport financier exporté");
  };

  const kpis = [
    { label: "Revenus bruts", value: data ? fmtXof(data.grossRevenue) : "—", icon: Wallet, color: "#1E6091" },
    { label: "Revenus nets (commissions)", value: data ? fmtXof(data.netRevenue) : "—", icon: PiggyBank, color: "#2A9D8F" },
    { label: "Retraits en attente", value: data ? fmtXof(data.pendingPayouts) : "—", icon: Clock, color: "#D62828" },
    { label: "Transactions", value: data ? nf.format(data.totalTransactions) : "—", icon: Banknote, color: "#F77F00" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Finances</h1>
          <p className="text-slate-500 text-xs mt-1">Revenus, commissions et retraits de la plateforme</p>
        </div>
        <div className="flex gap-2">
          {(["jour", "semaine", "mois"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs transition ${period === p ? "bg-[#1E6091] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            >{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl text-slate-900" style={{ fontFamily: "'Space Grotesk', monospace" }}>{loading ? "…" : kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue by method */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="title-gradient mb-4">Répartition des revenus par moyen de paiement</h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-xs">Chargement…</p>
          </div>
        ) : methodChart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm text-slate-500">Aucune donnée pour le moment</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={methodChart}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip key="tooltip" contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
              <Bar key="bar" dataKey="value" fill="#F77F00" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-gradient">Retraits en attente de validation</h3>
          <span className="text-xs px-3 py-1 bg-orange-50 text-[#F77F00] rounded-full">
            {data ? fmtXof(data.pendingPayouts) : "—"}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Inbox className="w-8 h-8 mb-3" />
          <p className="text-sm text-slate-500">Aucun retrait individuel à afficher</p>
          <p className="text-xs mt-1">Le détail des demandes de retrait apparaîtra ici.</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="title-gradient">Dernières transactions</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Inbox className="w-8 h-8 mb-3" />
          <p className="text-sm text-slate-500">Aucune transaction pour le moment</p>
          <p className="text-xs mt-1">Les transactions apparaîtront ici automatiquement.</p>
        </div>
      </div>
    </div>
  );
}
