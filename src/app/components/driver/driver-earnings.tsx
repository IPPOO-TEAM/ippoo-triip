import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Eye, EyeOff, ArrowDownLeft, ArrowUpRight, X,
  Wallet, Filter, TrendingUp, TrendingDown, Calendar, Clock,
  Smartphone, Banknote, Copy, Check, ChevronRight, Download,
  CreditCard, AlertTriangle, Zap, Star, Target, PiggyBank
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
interface Transaction {
  id: number;
  type: "earning" | "withdrawal" | "bonus" | "penalty" | "commission";
  label: string;
  amount: number;
  date: string;
  time: string;
  method?: string;
  status: "completed" | "pending" | "failed";
}

type ModalType = null | "withdraw" | "detail" | "qr";
type TxFilter = "all" | "earning" | "withdrawal" | "bonus";
type PeriodFilter = "today" | "week" | "month" | "all";

/* ─── Mock ─── */
const transactions: Transaction[] = [
  { id: 1, type: "earning", label: "Course moto - Dantokpa vers UAC", amount: 1200, date: "11 Avr 2026", time: "12:05", status: "completed" },
  { id: 2, type: "earning", label: "Livraison colis - St-Michel vers Godomey", amount: 1800, date: "11 Avr 2026", time: "09:15", status: "completed" },
  { id: 3, type: "earning", label: "Course moto - Akpakpa vers Gbègamey", amount: 800, date: "11 Avr 2026", time: "07:32", status: "completed" },
  { id: 4, type: "bonus", label: "Bonus heure de pointe (07h-09h)", amount: 500, date: "11 Avr 2026", time: "09:00", status: "completed" },
  { id: 5, type: "commission", label: "Commission IPPOO (15%)", amount: -570, date: "11 Avr 2026", time: "00:00", status: "completed" },
  { id: 6, type: "withdrawal", label: "Retrait MTN MoMo", amount: -10000, date: "10 Avr 2026", time: "18:30", method: "MTN MoMo", status: "completed" },
  { id: 7, type: "earning", label: "Course voiture - Aeroport vers Hotel", amount: 3500, date: "10 Avr 2026", time: "16:45", status: "completed" },
  { id: 8, type: "earning", label: "Covoiturage Cotonou-Porto-Novo", amount: 2000, date: "10 Avr 2026", time: "14:00", status: "completed" },
  { id: 9, type: "bonus", label: "Bonus 10 courses consecutives", amount: 1000, date: "10 Avr 2026", time: "12:00", status: "completed" },
  { id: 10, type: "withdrawal", label: "Retrait Moov Money", amount: -15000, date: "09 Avr 2026", time: "20:00", method: "Moov Money", status: "pending" },
  { id: 11, type: "penalty", label: "Penalite annulation tardive", amount: -200, date: "09 Avr 2026", time: "08:00", status: "completed" },
];

const DEFAULT_BREAKDOWN = {
  grossToday: 18500,
  commissionToday: 2775,
  netToday: 15725,
  grossWeek: 87300,
  commissionWeek: 13095,
  netWeek: 74205,
  grossMonth: 342000,
  commissionMonth: 51300,
  netMonth: 290700,
  totalBalance: 45600,
  pendingWithdrawals: 15000,
  availableBalance: 30600,
  bonusEarned: 3500,
  totalRides: 28,
  avgPerRide: 661,
};

const operators = [
  { name: "MTN MoMo", color: "from-yellow-400 to-amber-500", min: 500, max: 500000 },
  { name: "Moov Money", color: "from-blue-500 to-blue-600", min: 500, max: 500000 },
  { name: "Celtiis Cash", color: "from-green-500 to-emerald-600", min: 1000, max: 200000 },
];

export function DriverEarningsPage() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [withdrawOp, setWithdrawOp] = useState("MTN MoMo");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("+229 97 12 34 56");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [earningsBreakdown, setEarningsBreakdown] = useState(DEFAULT_BREAKDOWN);

  // Charge la ventilation des gains depuis le backend mock (repli sur les valeurs par défaut)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await api.get<any>("/driver/earnings");
        if (cancelled || !e) return;
        setEarningsBreakdown((prev) => ({ ...prev, ...e }));
      } catch {
        /* repli silencieux */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const quickWithdrawAmounts = [5000, 10000, 20000, 50000];

  const filteredTx = transactions.filter(t => {
    if (txFilter === "earning") return t.type === "earning";
    if (txFilter === "withdrawal") return t.type === "withdrawal";
    if (txFilter === "bonus") return t.type === "bonus" || t.type === "penalty";
    return true;
  });

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 500) { toast.error("Montant minimum: 500 FCFA"); return; }
    if (amt > earningsBreakdown.availableBalance) { toast.error("Solde insuffisant"); return; }
    setWithdrawLoading(true);
    setTimeout(() => {
      setWithdrawLoading(false);
      setModal(null);
      setWithdrawAmount("");
      toast.success(`Retrait de ${amt.toLocaleString()} FCFA initie via ${withdrawOp}`);
    }, 2000);
  };

  const txIcon = (type: string) => {
    if (type === "earning") return ArrowDownLeft;
    if (type === "withdrawal") return ArrowUpRight;
    if (type === "bonus") return Star;
    if (type === "penalty") return AlertTriangle;
    return CreditCard;
  };

  const txColors = (type: string) => {
    if (type === "earning") return { bg: "bg-emerald-50", color: "text-emerald-500" };
    if (type === "withdrawal") return { bg: "bg-blue-50", color: "text-blue-500" };
    if (type === "bonus") return { bg: "bg-amber-50", color: "text-amber-500" };
    if (type === "penalty") return { bg: "bg-red-50", color: "text-red-500" };
    return { bg: "bg-slate-50", color: "text-slate-500" };
  };

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#2A9D8F] pt-12 pb-6 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <p className="text-white text-sm flex-1">Mes gains</p>
          <button onClick={() => setShowBalance(!showBalance)} className="text-white/50">
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Balance card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
          <p className="text-white/50 text-[10px] mb-1">Solde disponible</p>
          <p className="text-white text-3xl mb-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>
            {showBalance ? `${earningsBreakdown.availableBalance.toLocaleString()} F` : "*** ***"}
          </p>
          {earningsBreakdown.pendingWithdrawals > 0 && (
            <p className="text-amber-300/70 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {earningsBreakdown.pendingWithdrawals.toLocaleString()} F en attente de retrait
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-white/40 text-[8px]">Aujourd'hui (net)</p>
              <p className="text-white text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {showBalance ? `${earningsBreakdown.netToday.toLocaleString()}` : "***"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-white/40 text-[8px]">Semaine (net)</p>
              <p className="text-white text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {showBalance ? `${(earningsBreakdown.netWeek / 1000).toFixed(0)}K` : "***"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-white/40 text-[8px]">Mois (net)</p>
              <p className="text-white text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {showBalance ? `${(earningsBreakdown.netMonth / 1000).toFixed(0)}K` : "***"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setModal("withdraw")}
              className="py-3 rounded-xl bg-[#F77F00] text-black text-xs flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20"
            >
              <ArrowUpRight className="w-4 h-4" /> Retirer
            </button>
            <button
              onClick={() => setModal("qr")}
              className="py-3 rounded-xl bg-white/15 text-white text-xs flex items-center justify-center gap-2 border border-white/10"
            >
              <QRCodeSVG value="x" size={0} className="hidden" />
              <Download className="w-4 h-4" /> Releve
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 -mt-2 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Target, label: "Courses", value: earningsBreakdown.totalRides.toString(), color: "#1E6091" },
            { icon: TrendingUp, label: "Moy/course", value: `${earningsBreakdown.avgPerRide} F`, color: "#2A9D8F" },
            { icon: Zap, label: "Bonus", value: `${earningsBreakdown.bonusEarned} F`, color: "#F77F00" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-slate-800 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{s.value}</p>
              <p className="text-slate-400 text-[8px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission info */}
      <div className="px-5 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-[#1E6091]" />
          <div className="flex-1">
            <p className="text-[#1E6091] text-[11px]">Commission IPPOO: 15%</p>
            <p className="text-blue-400 text-[9px]">Aujourd'hui: -{earningsBreakdown.commissionToday.toLocaleString()} F sur {earningsBreakdown.grossToday.toLocaleString()} F brut</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-5 mb-3 flex gap-2 overflow-x-auto">
        {([
          { id: "all" as TxFilter, label: "Tout" },
          { id: "earning" as TxFilter, label: "Gains" },
          { id: "withdrawal" as TxFilter, label: "Retraits" },
          { id: "bonus" as TxFilter, label: "Bonus" },
        ]).map(f => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap border transition ${txFilter === f.id ? "bg-[#2A9D8F] text-white border-[#2A9D8F]" : "bg-white text-slate-600 border-slate-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="px-5">
        <p className="text-slate-400 text-[10px] mb-2">Transactions recentes</p>
        <div className="space-y-2">
          {filteredTx.map(t => {
            const Icon = txIcon(t.type);
            const colors = txColors(t.type);
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedTx(t); setModal("detail"); }}
                className="w-full bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 text-left active:bg-slate-50 transition"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-[11px] truncate">{t.label}</p>
                  <p className="text-slate-400 text-[9px]">{t.date} - {t.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs ${t.amount >= 0 ? "text-emerald-500" : "text-slate-600"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>
                    {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString()} F
                  </p>
                  {t.status === "pending" && <span className="text-amber-500 text-[8px]">En attente</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ WITHDRAW MODAL ═══ */}
      {modal === "withdraw" && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <p className="text-slate-800 text-sm">Retirer des fonds</p>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-slate-400 text-[10px] mb-2">Operateur</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {operators.map(op => (
                <button
                  key={op.name}
                  onClick={() => setWithdrawOp(op.name)}
                  className={`p-3 rounded-xl border text-center text-[10px] transition ${withdrawOp === op.name ? "border-[#2A9D8F] bg-[#2A9D8F]/5 text-[#2A9D8F]" : "border-slate-200 text-slate-600"}`}
                >
                  {op.name}
                </button>
              ))}
            </div>

            <p className="text-slate-400 text-[10px] mb-2">Numero de retrait</p>
            <input
              value={withdrawPhone}
              onChange={e => setWithdrawPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-4"
              placeholder="+229 97 00 00 00"
            />

            <p className="text-slate-400 text-[10px] mb-2">Montant</p>
            <input
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg text-center mb-3"
              placeholder="0"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            />
            <div className="flex gap-2 mb-4">
              {quickWithdrawAmounts.map(a => (
                <button
                  key={a}
                  onClick={() => setWithdrawAmount(a.toString())}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] active:bg-slate-50"
                >
                  {a.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-5 flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Solde disponible</span>
              <span className="text-slate-800 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {earningsBreakdown.availableBalance.toLocaleString()} F
              </span>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading}
              className="w-full py-4 rounded-2xl bg-[#2A9D8F] text-white text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              {withdrawLoading ? "Traitement..." : "Confirmer le retrait"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TX DETAIL MODAL ═══ */}
      {modal === "detail" && selectedTx && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <p className="text-slate-800 text-sm">Detail transaction</p>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className={`text-2xl mb-1 ${selectedTx.amount >= 0 ? "text-emerald-500" : "text-slate-700"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {selectedTx.amount >= 0 ? "+" : ""}{selectedTx.amount.toLocaleString()} F
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${selectedTx.status === "completed" ? "bg-emerald-50 text-emerald-600" : selectedTx.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                {selectedTx.status === "completed" ? "Terminee" : selectedTx.status === "pending" ? "En attente" : "Echouee"}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: "Description", value: selectedTx.label },
                { label: "Date", value: `${selectedTx.date} à ${selectedTx.time}` },
                { label: "Type", value: selectedTx.type === "earning" ? "Gain course" : selectedTx.type === "withdrawal" ? "Retrait" : selectedTx.type === "bonus" ? "Bonus" : selectedTx.type === "penalty" ? "Pénalité" : "Commission" },
                ...(selectedTx.method ? [{ label: "Methode", value: selectedTx.method }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-400 text-[10px]">{item.label}</span>
                  <span className="text-slate-700 text-[11px] text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
