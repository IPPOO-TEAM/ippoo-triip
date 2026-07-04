import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Eye, EyeOff, Plus, QrCode, Smartphone, Lock,
  ArrowDownLeft, ArrowUpRight, X, Copy, Banknote, Filter,
  Download, Share2, Navigation, AlertTriangle, Check
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import walletHeroImg from "figma:asset/288963912b5fda944bb64f5351d84e719432a851.png";
import { usePayment } from "../hooks/use-payment";
import type { MomoOperator } from "../services/mobile-money";
import { api } from "../api/client";

/** Transactions backend (crédit/débit). */
const CREDIT_TYPES = ["topup", "refund", "referral_bonus", "promo_credit"];

/** Convertit une transaction backend en transaction UI. */
function mapTransaction(t: any, index: number): Transaction {
  const isCredit = CREDIT_TYPES.includes(t.type);
  const d = new Date(t.createdAt);
  return {
    id: index + 1,
    type: isCredit ? "credit" : "debit",
    label: t.description ?? (isCredit ? "Crédit" : "Débit"),
    amount: isCredit ? t.amountXOF : -t.amountXOF,
    date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    icon: isCredit ? ArrowDownLeft : ArrowUpRight,
    iconBg: isCredit ? "bg-emerald-50" : "bg-rose-50",
    iconColor: isCredit ? "text-emerald-500" : "text-rose-500",
  };
}

interface Transaction {
  id: number;
  type: "debit" | "credit";
  label: string;
  amount: number;
  date: string;
  time: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const initialTransactions: Transaction[] = [
  { id: 1, type: "debit", label: "Course moto, Dantokpa vers Calavi", amount: -1200, date: "10 Avr 2026", time: "14:32", icon: ArrowUpRight, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
  { id: 2, type: "credit", label: "Recharge MTN MoMo", amount: 5000, date: "09 Avr 2026", time: "11:15", icon: ArrowDownLeft, iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
  { id: 3, type: "debit", label: "Livraison colis", amount: -1500, date: "08 Avr 2026", time: "16:45", icon: ArrowUpRight, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
  { id: 4, type: "credit", label: "Recharge Moov Money", amount: 3000, date: "07 Avr 2026", time: "13:10", icon: ArrowDownLeft, iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
  { id: 5, type: "debit", label: "Covoiturage, Cotonou vers Porto-Novo", amount: -500, date: "06 Avr 2026", time: "07:30", icon: ArrowUpRight, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
  { id: 6, type: "debit", label: "Course moto, Gbégamey vers Akpakpa", amount: -800, date: "05 Avr 2026", time: "09:00", icon: ArrowUpRight, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
];

type ModalType = null | "recharge" | "qr" | "payRide" | "transactionDetail";

export function WalletPage() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState(12300);
  const [modal, setModal] = useState<ModalType>(null);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [txFilter, setTxFilter] = useState<"all" | "credit" | "debit">("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Recharge state
  const [selectedOp, setSelectedOp] = useState("MTN");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Pay ride state
  const [rideCode, setRideCode] = useState("");
  const [rideAmount, setRideAmount] = useState("");
  const [rideLoading, setRideLoading] = useState(false);

  // QR state
  const [qrAmount, setQrAmount] = useState("");

  const quickAmounts = [500, 1000, 2000, 5000];
  const rechargeQuickAmounts = [1000, 2000, 5000, 10000];
  const operators = [
    { name: "MTN", color: "from-yellow-400 to-amber-500", shadow: "shadow-amber-400/30" },
    { name: "Moov", color: "from-blue-400 to-blue-500", shadow: "shadow-blue-400/30" },
    { name: "Celtiis", color: "from-green-400 to-emerald-500", shadow: "shadow-green-400/30" },
  ];

  const filteredTx = txFilter === "all" ? transactions : transactions.filter(t => t.type === txFilter);

  // Synchronise solde + transactions depuis le backend mock (repli sur les données locales)
  const refresh = useCallback(async () => {
    try {
      const [wallet, txs] = await Promise.all([
        api.get<{ balanceXOF: number }>("/wallet/me"),
        api.get<any[]>("/wallet/transactions"),
      ]);
      if (wallet?.balanceXOF != null) setBalance(wallet.balanceXOF);
      if (Array.isArray(txs) && txs.length) setTransactions(txs.map(mapTransaction));
    } catch {
      /* repli silencieux */
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const payment = usePayment();
  const handleRecharge = async () => {
    const amount = parseInt(rechargeAmount);
    if (!amount || amount < 100) { toast.error("Montant minimum: 100 FCFA"); return; }
    if (amount > 500000) { toast.error("Montant maximum: 500 000 FCFA"); return; }

    const operatorMap: Record<string, MomoOperator> = {
      MTN: "mtn_momo", Moov: "moov_money", Celtiis: "celtiis_cash",
    };
    const operator = operatorMap[selectedOp] ?? "mtn_momo";
    const phoneFromProfile = localStorage.getItem("ippoo_user_phone") || "+22997000000";

    setRechargeLoading(true);
    const ok = await payment.pay({
      phone: phoneFromProfile,
      amountXOF: amount,
      operator,
      description: `Recharge IPPOO Cash via ${selectedOp}`,
    });
    setRechargeLoading(false);

    if (ok) {
      // Le backend a déjà crédité le wallet via /payments/momo — on resynchronise
      await refresh();
      setModal(null);
      setRechargeAmount("");
    }
  };

  const handlePayRide = async () => {
    if (!rideCode.trim()) { toast.error("Entrez le code de la course"); return; }
    const amount = parseInt(rideAmount);
    if (!amount || amount < 100) { toast.error("Montant minimum: 100 FCFA"); return; }
    if (amount > balance) { toast.error("Solde insuffisant", { description: `Votre solde est de ${balance.toLocaleString()} FCFA` }); return; }
    setRideLoading(true);
    try {
      await api.post("/wallet/pay", { amountXOF: amount, rideCode });
      await refresh();
      toast.success("Course réglée !", { description: `${amount.toLocaleString()} FCFA, Course #${rideCode}` });
    } catch (e: any) {
      toast.error(e?.code === "INSUFFICIENT_FUNDS" ? "Solde insuffisant" : "Échec du paiement");
    } finally {
      setRideLoading(false);
      setModal(null);
      setRideCode("");
      setRideAmount("");
    }
  };

  const closeModal = () => {
    setModal(null);
    setSelectedTx(null);
    setRechargeAmount("");
    setRideCode("");
    setRideAmount("");
    setQrAmount("");
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="relative bg-[#1E6091] px-5 pt-14 pb-32 overflow-hidden">
        <img
          src={walletHeroImg}
          alt=""
          aria-hidden
          className="absolute right-0 bottom-0 h-[92%] w-auto object-contain object-right-bottom pointer-events-none select-none"
          style={{
            maskImage: "linear-gradient(to left, rgba(0,0,0,0.55) 30%, transparent 80%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,0.55) 30%, transparent 80%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
            zIndex: 0,
          }}
        />
        {/* Halos lumineux */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#E9C46A]/20 rounded-full -mr-20 -mt-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#2A9D8F]/30 rounded-full -ml-10 blur-3xl pointer-events-none" />

        <div className="relative" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/25 active:scale-90 transition">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-white">IPPOO Cash</h2>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/25 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-green-100 text-sm">Solde disponible</p>
              <button onClick={() => setShowBalance(!showBalance)} className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center active:scale-90 transition">
                {showBalance ? <Eye className="w-4 h-4 text-white/80" /> : <EyeOff className="w-4 h-4 text-white/80" />}
              </button>
            </div>
            <p className="text-4xl text-white tracking-tight mb-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>
              {showBalance ? balance.toLocaleString() : "••••••"} <span className="text-lg text-green-100">FCFA</span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-white/80 text-xs bg-white/15 px-3 py-1.5 rounded-full border border-white/15">
                <Lock className="w-3 h-3" /> Sécurisé
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-xs bg-white/15 px-3 py-1.5 rounded-full border border-white/15">
                <Smartphone className="w-3 h-3" /> Mobile Money
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-20 relative z-10">
        {/* Quick actions — 3 boutons uniquement */}
        <div className="bg-white rounded-2xl shadow-sm shadow-emerald-100/60 p-6 border border-emerald-50">
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Plus, label: "Recharger", gradient: "from-emerald-400 to-green-500", shadow: "shadow-emerald-400/30", action: () => setModal("recharge") },
              { icon: QrCode, label: "QR Code", gradient: "from-violet-400 to-purple-500", shadow: "shadow-violet-400/30", action: () => setModal("qr") },
              { icon: Navigation, label: "Régler course", gradient: "from-[#F77F00] to-[#D62828]", shadow: "shadow-orange-400/30", action: () => setModal("payRide") },
            ].map((a) => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2 active:scale-90 transition">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${a.gradient} shadow-sm ${a.shadow}`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] text-gray-500">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="title-gradient">Transactions</h3>
            <div className="flex gap-1.5">
              {([["all", "Tout"], ["credit", "Entrées"], ["debit", "Sorties"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTxFilter(key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${txFilter === key ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-400 border-slate-100"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredTx.length === 0 && (
              <div className="text-center py-8">
                <Filter className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune transaction</p>
              </div>
            )}
            {filteredTx.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTx(t); setModal("transactionDetail"); }}
                className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3.5 border border-gray-100 shadow-sm shadow-gray-100/40 active:bg-slate-50 transition text-left">
                <div className={`w-10 h-10 ${t.iconBg} rounded-full flex items-center justify-center shrink-0`}>
                  <t.icon className={`w-4 h-4 ${t.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{t.label}</p>
                  <p className="text-[10px] text-gray-400">{t.date} · {t.time}</p>
                </div>
                <span className={`text-sm shrink-0 ${t.amount > 0 ? "text-emerald-500" : "text-gray-800"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()} F
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}

      {/* Recharge */}
      {modal === "recharge" && (
        <ModalOverlay onClose={closeModal} title="Recharger IPPOO Cash">
          <p className="text-xs text-slate-400 mb-4">Choisissez un opérateur et un montant</p>
          <div className="flex gap-2 mb-4">
            {operators.map(op => (
              <button key={op.name} onClick={() => setSelectedOp(op.name)}
                className={`flex-1 py-3 rounded-2xl text-sm transition-all ${selectedOp === op.name ? `bg-gradient-to-br ${op.color} text-white shadow-sm ${op.shadow}` : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
                {op.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {rechargeQuickAmounts.map(amt => (
              <button key={amt} onClick={() => setRechargeAmount(amt.toString())}
                className={`py-2.5 rounded-xl text-xs border-2 transition ${rechargeAmount === amt.toString() ? "border-emerald-400 bg-emerald-50 text-emerald-600" : "border-slate-100 text-slate-600"}`}
                style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100 focus-within:border-emerald-400 transition mb-4">
            <Banknote className="w-4 h-4 text-slate-400" />
            <input type="number" placeholder="Autre montant" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }} />
            <span className="text-xs text-slate-400">FCFA</span>
          </div>
          {rechargeAmount && parseInt(rechargeAmount) > 0 && (
            <div className="bg-emerald-50 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-emerald-700">Nouveau solde</span>
              <span className="text-sm text-emerald-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {(balance + parseInt(rechargeAmount || "0")).toLocaleString()} FCFA
              </span>
            </div>
          )}
          <button onClick={handleRecharge} disabled={rechargeLoading}
            className="w-full bg-emerald-400 text-white py-3.5 rounded-2xl text-sm shadow-sm shadow-emerald-400/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
            {rechargeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {rechargeLoading ? "Traitement..." : "Confirmer la recharge"}
          </button>
        </ModalOverlay>
      )}

      {/* QR Code */}
      {modal === "qr" && (
        <ModalOverlay onClose={closeModal} title="QR Code de paiement">
          <div className="text-center mb-4">
            <div className="w-52 h-52 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center mx-auto mb-4 p-3 shadow-sm">
              <QRCodeSVG
                value={`ippoo://pay?user=IPPOO-USR-DA&name=Dossou+Adjovi${qrAmount ? `&amount=${qrAmount}` : ""}`}
                size={184}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-slate-700 mb-1">Dossou Adjovi</p>
            <p className="text-xs text-slate-400">IPPOO-2024-USR-DA</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 mb-4">
            <Banknote className="w-4 h-4 text-slate-400" />
            <input type="number" placeholder="Montant (optionnel)" value={qrAmount} onChange={(e) => setQrAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }} />
            <span className="text-xs text-slate-400">FCFA</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(`ippoo://pay?user=IPPOO-USR-DA${qrAmount ? `&amount=${qrAmount}` : ""}`); toast.success("Lien de paiement copié !"); }}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm active:scale-[0.98] transition">
              <Copy className="w-4 h-4" /> Copier
            </button>
            <button onClick={async () => {
              const shareData = { title: "Payer Dossou Adjovi", text: `Payez ${qrAmount ? qrAmount + " FCFA" : ""} via IPPOO`, url: `https://ippoo.app/pay/IPPOO-USR-DA${qrAmount ? `?amount=${qrAmount}` : ""}` };
              if (navigator.share) { try { await navigator.share(shareData); } catch (_) {} }
              else { navigator.clipboard?.writeText(shareData.url); toast.success("Lien copié !"); }
              closeModal();
            }}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-500 text-white py-3 rounded-xl text-sm shadow-sm shadow-violet-500/20 active:scale-[0.98] transition">
              <Share2 className="w-4 h-4" /> Partager
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Régler une course */}
      {modal === "payRide" && (
        <ModalOverlay onClose={closeModal} title="Régler une course">
          <p className="text-xs text-slate-400 mb-4">Entrez le code de course communiqué par votre conducteur</p>
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100 focus-within:border-[#F77F00] transition mb-4">
            <Navigation className="w-4 h-4 text-[#F77F00]" />
            <input type="text" placeholder="Code de la course (ex: MTX-4521)" value={rideCode} onChange={(e) => setRideCode(e.target.value.toUpperCase())}
              className="flex-1 bg-transparent outline-none text-sm tracking-wider" style={{ fontFamily: "'Space Grotesk', monospace" }} />
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quickAmounts.map(amt => (
              <button key={amt} onClick={() => setRideAmount(amt.toString())}
                className={`py-2.5 rounded-xl text-xs border-2 transition ${rideAmount === amt.toString() ? "border-[#F77F00] bg-orange-50 text-[#F77F00]" : "border-slate-100 text-slate-600"}`}
                style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100 focus-within:border-[#F77F00] transition mb-3">
            <Banknote className="w-4 h-4 text-slate-400" />
            <input type="number" placeholder="Montant de la course" value={rideAmount} onChange={(e) => setRideAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }} />
            <span className="text-xs text-slate-400">FCFA</span>
          </div>
          {rideAmount && parseInt(rideAmount) > balance && (
            <div className="bg-red-50 rounded-xl p-3 mb-3 flex items-center gap-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-[#D62828]" />
              <span className="text-xs text-[#D62828]">Solde insuffisant ({balance.toLocaleString()} F disponible)</span>
            </div>
          )}
          {rideAmount && parseInt(rideAmount) > 0 && parseInt(rideAmount) <= balance && (
            <div className="bg-orange-50 rounded-xl p-3 mb-3 flex items-center justify-between border border-orange-200">
              <span className="text-xs text-orange-700">Solde après paiement</span>
              <span className="text-sm text-orange-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {(balance - parseInt(rideAmount)).toLocaleString()} FCFA
              </span>
            </div>
          )}
          <button onClick={handlePayRide} disabled={rideLoading}
            className="w-full bg-[#F77F00] text-black py-3.5 rounded-2xl text-sm shadow-sm shadow-orange-400/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
            {rideLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {rideLoading ? "Paiement en cours..." : "Régler la course"}
          </button>
        </ModalOverlay>
      )}

      {/* Transaction Detail */}
      {modal === "transactionDetail" && selectedTx && (
        <ModalOverlay onClose={closeModal} title="Détail de la transaction">
          <div className="text-center mb-5">
            <div className={`w-14 h-14 ${selectedTx.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              <selectedTx.icon className={`w-6 h-6 ${selectedTx.iconColor}`} />
            </div>
            <p className={`text-2xl ${selectedTx.amount > 0 ? "text-emerald-500" : "text-slate-800"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>
              {selectedTx.amount > 0 ? "+" : ""}{selectedTx.amount.toLocaleString()} FCFA
            </p>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full mt-2 inline-block ${selectedTx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
              {selectedTx.amount > 0 ? "Entrée" : "Sortie"}
            </span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-4">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Description</span><span className="text-slate-800">{selectedTx.label}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Date</span><span className="text-slate-800">{selectedTx.date}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Heure</span><span className="text-slate-800">{selectedTx.time}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">ID</span><span className="text-slate-800 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>TX-{selectedTx.id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Méthode</span><span className="text-slate-800">IPPOO Cash</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(`Transaction IPPOO TX-${selectedTx.id}: ${selectedTx.amount} FCFA`); toast.success("Reçu copié"); }}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm active:scale-[0.98] transition">
              <Copy className="w-4 h-4" /> Copier le reçu
            </button>
            <button onClick={() => { toast.success("Reçu téléchargé"); closeModal(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-sm active:scale-[0.98] transition">
              <Download className="w-4 h-4" /> Télécharger
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 pb-8 shadow-sm max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-800">{title}</p>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}