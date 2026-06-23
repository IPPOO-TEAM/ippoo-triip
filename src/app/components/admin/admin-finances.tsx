import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, Download, ArrowUpRight, Clock,
  CheckCircle2, XCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  CreditCard, Banknote, PiggyBank, ArrowDownLeft, ArrowUpLeft, Search
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getAvatar } from "../avatars";

/* ─── Mock Data ─── */
const revenueWeekly = [
  { name: "Sem 1", revenue: 28500000, commission: 5700000 },
  { name: "Sem 2", revenue: 31200000, commission: 6240000 },
  { name: "Sem 3", revenue: 29800000, commission: 5960000 },
  { name: "Sem 4", revenue: 34100000, commission: 6820000 },
];

const commissionByService = [
  { name: "Taxi-Moto", value: 2800000 },
  { name: "Livraison", value: 1900000 },
  { name: "Transport", value: 980000 },
  { name: "Covoiturage", value: 650000 },
  { name: "Groupée", value: 240000 },
  { name: "AIR", value: 150000 },
];

const TRANSACTIONS = [
  { id: "TRX-001", type: "commission" as const, description: "Commission course IP-9001", amount: "+160 FCFA", driver: "Hounkpatin Akotchaye", driverInit: "HA", date: "11 Avr 14:32", status: "completed" },
  { id: "TRX-002", type: "payout" as const, description: "Retrait vers MTN Money", amount: "-125,000 FCFA", driver: "Togbédji Mensah", driverInit: "TM", date: "11 Avr 14:15", status: "completed" },
  { id: "TRX-003", type: "commission" as const, description: "Commission livraison IP-9002", amount: "+300 FCFA", driver: "Sèdégan Houéfa", driverInit: "AD", date: "11 Avr 14:10", status: "pending" },
  { id: "TRX-004", type: "payout" as const, description: "Retrait vers Moov Money", amount: "-85,000 FCFA", driver: "Koffi Adjibadé", driverInit: "GB", date: "11 Avr 13:45", status: "pending" },
  { id: "TRX-005", type: "commission" as const, description: "Commission transport IP-9003", amount: "+3,000 FCFA", driver: "Togbédji Mensah", driverInit: "TM", date: "11 Avr 13:40", status: "completed" },
  { id: "TRX-006", type: "refund" as const, description: "Remboursement course annulée IP-9005", amount: "-1,000 FCFA", driver: "", driverInit: "GB", date: "11 Avr 13:20", status: "completed" },
  { id: "TRX-007", type: "payout" as const, description: "Retrait vers compte bancaire", amount: "-250,000 FCFA", driver: "Aïdatou Bello", driverInit: "AB", date: "11 Avr 12:00", status: "completed" },
  { id: "TRX-008", type: "commission" as const, description: "Commission IPPOO AIR IP-9008", amount: "+5,000 FCFA", driver: "", driverInit: "SA", date: "11 Avr 11:30", status: "pending" },
];

const PENDING_PAYOUTS = [
  { driver: "Togbédji Mensah", initials: "TM", amount: "125,000 FCFA", method: "MTN Money", requested: "11 Avr 14:15" },
  { driver: "Koffi Adjibadé", initials: "GB", amount: "85,000 FCFA", method: "Moov Money", requested: "11 Avr 13:45" },
  { driver: "Fifamè Agbodjèlou", initials: "FD", amount: "62,000 FCFA", method: "MTN Money", requested: "11 Avr 12:30" },
  { driver: "Adjagba Cocou", initials: "SA", amount: "45,000 FCFA", method: "Ecobank", requested: "11 Avr 11:00" },
];

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  commission: { label: "Commission", color: "#2A9D8F", icon: ArrowDownLeft },
  payout: { label: "Retrait", color: "#1E6091", icon: ArrowUpLeft },
  refund: { label: "Remboursement", color: "#D62828", icon: ArrowUpLeft },
};

export function AdminFinancesPage() {
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois">("semaine");
  const [txFilter, setTxFilter] = useState("all");

  const filteredTx = TRANSACTIONS.filter(t => txFilter === "all" || t.type === txFilter);

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
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Revenus bruts", value: "34.1M FCFA", change: "+9.3%", up: true, icon: Wallet, color: "#1E6091" },
          { label: "Commissions", value: "6.82M FCFA", change: "+9.3%", up: true, icon: PiggyBank, color: "#2A9D8F" },
          { label: "Retraits chauffeurs", value: "27.2M FCFA", change: "+7.8%", up: true, icon: Banknote, color: "#F77F00" },
          { label: "Retraits en attente", value: "317,000 FCFA", change: "12 demandes", up: false, icon: Clock, color: "#D62828" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${kpi.up ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#F77F00]"}`}>
                {kpi.up && <TrendingUp className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl text-slate-900" style={{ fontFamily: "'Space Grotesk', monospace" }}>{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Revenus & Commissions (par semaine)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueWeekly}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip key="tooltip" contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${(v / 1000000).toFixed(2)}M FCFA`]} />
              <Area key="area-revenue" type="monotone" dataKey="revenue" stroke="#1E6091" strokeWidth={2} fill="#1E6091" fillOpacity={0.1} name="Revenus" />
              <Area key="area-commission" type="monotone" dataKey="commission" stroke="#2A9D8F" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Commissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="title-gradient mb-4">Commissions par service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={commissionByService}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip key="tooltip" contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${(v / 1000).toFixed(0)}K FCFA`]} />
              <Bar key="bar" dataKey="value" fill="#F77F00" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-gradient">Retraits en attente de validation</h3>
          <span className="text-xs px-3 py-1 bg-orange-50 text-[#F77F00] rounded-full">{PENDING_PAYOUTS.length} en attente</span>
        </div>
        <div className="space-y-3">
          {PENDING_PAYOUTS.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={getAvatar(p.initials) || ""} alt="" className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-sm">{p.driver}</p>
                <p className="text-slate-400 text-[10px]">{p.method} · {p.requested}</p>
              </div>
              <span className="text-sm text-slate-800 shrink-0" style={{ fontFamily: "'Space Grotesk', monospace" }}>{p.amount}</span>
              <div className="flex gap-1.5 shrink-0">
                <button className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition">
                  <CheckCircle2 className="w-4 h-4 text-[#2A9D8F]" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition">
                  <XCircle className="w-4 h-4 text-[#D62828]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <h3 className="title-gradient flex-1">Dernières transactions</h3>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Toutes" },
              { key: "commission", label: "Commissions" },
              { key: "payout", label: "Retraits" },
              { key: "refund", label: "Remboursements" },
            ].map(f => (
              <button key={f.key} onClick={() => setTxFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${txFilter === f.key ? "bg-[#1E6091] text-white" : "bg-slate-100 text-slate-500"}`}
              >{f.label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["ID", "Type", "Description", "Chauffeur", "Montant", "Date", "Statut"].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((t) => {
                const tc = typeConfig[t.type];
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>{t.id}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${tc.color}15`, color: tc.color }}>{tc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={getAvatar(t.driverInit) || ""} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs text-slate-600">{t.driver}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs ${t.amount.startsWith("+") ? "text-[#2A9D8F]" : "text-[#D62828]"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>{t.amount}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${t.status === "completed" ? "bg-emerald-50 text-[#2A9D8F]" : "bg-orange-50 text-[#F77F00]"}`}>
                        {t.status === "completed" ? "Validé" : "En attente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}