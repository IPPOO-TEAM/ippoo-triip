import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, CreditCard, Star, Shield, Zap, Crown, Check, X,
  Calendar, Clock, Bell, ChevronRight, Gift, TrendingUp, AlertTriangle,
  Bike, Car, RotateCcw, Gauge, Sparkles, Award
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

const MEMBER_IMG = "https://images.unsplash.com/photo-1639133694967-640f255f10fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWVtYmVyc2hpcCUyMGNhcmQlMjBnb2xkJTIwcHJlbWl1bXxlbnwxfHx8fDE3NzU5MTc0Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Types ─── */
interface PaymentHistory {
  id: number;
  date: string;
  amount: number;
  status: "paid" | "failed";
  method: string;
}

type Tab = "carte" | "forfait";
type ForfaitType = "moto" | "voiture";

/* ─── Mock Data ─── */
const paymentHistory: PaymentHistory[] = [
  { id: 1, date: "11 Avr 2026", amount: 1500, status: "paid", method: "MTN MoMo" },
  { id: 2, date: "11 Mar 2026", amount: 1500, status: "paid", method: "Moov Money" },
  { id: 3, date: "11 Fév 2026", amount: 1500, status: "paid", method: "MTN MoMo" },
  { id: 4, date: "11 Jan 2026", amount: 1500, status: "failed", method: "MTN MoMo" },
];

const memberBenefits = [
  { icon: Zap, label: "Courses prioritaires", desc: "Attribution rapide d'un chauffeur" },
  { icon: Gift, label: "Bonus IPPOO CASH", desc: "+500 FCFA offerts chaque mois" },
  { icon: TrendingUp, label: "Réductions exclusives", desc: "-10% sur toutes les livraisons" },
  { icon: Shield, label: "Support premium", desc: "Assistance prioritaire 24/7" },
  { icon: Star, label: "Accès promotions VIP", desc: "Offres réservées aux membres" },
];

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("carte");
  const [parallaxY, setParallaxY] = useState(0);
  const [memberActive, setMemberActive] = useState(true);
  const [showPayments, setShowPayments] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Forfait state
  const [forfaitType, setForfaitType] = useState<ForfaitType>("moto");
  const [forfaitActive, setForfaitActive] = useState(true);
  const [weekdayUsed, setWeekdayUsed] = useState(1);
  const [weekendUsed, setWeekendUsed] = useState(0);
  const [subscribingForfait, setSubscribingForfait] = useState(false);

  useEffect(() => {
    const el = document.querySelector(".flex-1.min-h-0.overflow-y-auto");
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const memberExpiry = "11 Mai 2026";
  const daysLeft = 30;

  const handleRenew = () => {
    setRenewing(true);
    setTimeout(() => {
      setRenewing(false);
      setMemberActive(true);
      toast.success("Carte Membre renouvelée !", { description: "Valide jusqu'au 11 Juin 2026" });
    }, 1500);
  };

  const handleSubscribeForfait = () => {
    setSubscribingForfait(true);
    setTimeout(() => {
      setSubscribingForfait(false);
      setForfaitActive(true);
      toast.success(`Forfait ${forfaitType === "moto" ? "Moto" : "Voiture"} activé !`, {
        description: `${forfaitType === "moto" ? "12 000" : "20 000"} FCFA / mois`
      });
    }, 1500);
  };

  const forfaitPrice = forfaitType === "moto" ? 12000 : 20000;
  const dailyLimit = 2;

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* ── Header Parallax ── */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <img
          src={MEMBER_IMG} alt=""
          className="absolute inset-0 w-full h-[130%] object-cover will-change-transform"
          style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#E9C46A]/85 via-[#F77F00]/70 to-[#D62828]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D62828]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1" />
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-white mb-1 drop-shadow-md">Abonnements</h1>
          <p className="text-white/80 text-xs">Carte Membre & Forfaits Courses</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 -mt-5 relative z-20">
        <div className="bg-white rounded-2xl p-1 shadow-md flex gap-1">
          {([
            { key: "carte" as Tab, icon: CreditCard, label: "Carte Membre" },
            { key: "forfait" as Tab, icon: Gauge, label: "Forfait Courses" },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${tab === t.key ? "bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white shadow-md" : "text-slate-500"}`}
            >
              <t.icon className="w-4 h-4" />
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "carte" ? (
        /* ─────── CARTE MEMBRE ─────── */
        <div className="px-5 mt-5 space-y-5">
          {/* Carte visuelle */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E6091] via-[#2A9D8F] to-[#1E6091] p-5 shadow-xl">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E9C46A]/15 rounded-full -ml-10 -mb-10 blur-2xl" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-[#E9C46A]" />
                  <span className="text-[#E9C46A] text-xs tracking-wider uppercase">Membre IPPOO</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <ProfileAvatar initials="DA" size={48} />
                  <div>
                    <p className="text-white text-sm">Dossou Ahouandjinou</p>
                    <p className="text-white/60 text-[10px]">N° IPP-2026-04-1102</p>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] ${memberActive ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"}`}>
                {memberActive ? "Actif" : "Expiré"}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 relative z-10">
              <div>
                <p className="text-white/50 text-[10px]">Valide jusqu'au</p>
                <p className="text-white text-xs">{memberExpiry}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px]">Tarif mensuel</p>
                <p className="text-[#E9C46A] text-sm">1 500 FCFA</p>
              </div>
            </div>
          </div>

          {/* Expiration warning */}
          {daysLeft <= 7 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-xs">Votre carte expire dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}</p>
                <p className="text-amber-600 text-[10px] mt-0.5">Renouvelez pour garder vos avantages</p>
              </div>
            </div>
          )}

          {/* Renew button */}
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="w-full py-4 bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white rounded-2xl shadow-lg shadow-orange-400/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
          >
            {renewing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{memberActive ? "Renouveler" : "Activer"} · 1 500 FCFA</span>
              </>
            )}
          </button>

          {/* Avantages membres */}
          <div>
            <h2 className="title-gradient mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F77F00]" />
              Avantages Membre
            </h2>
            <div className="space-y-2.5">
              {memberBenefits.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E9C46A]/20 to-[#F77F00]/20 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-[#F77F00]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 text-xs">{b.label}</p>
                    <p className="text-slate-400 text-[10px]">{b.desc}</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Historique paiements */}
          <div>
            <button onClick={() => setShowPayments(!showPayments)} className="w-full flex items-center justify-between mb-3">
              <h2 className="title-gradient flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E6091]" />
                Historique des paiements
              </h2>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showPayments ? "rotate-90" : ""}`} />
            </button>
            {showPayments && (
              <div className="space-y-2">
                {paymentHistory.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.status === "paid" ? "bg-emerald-50" : "bg-red-50"}`}>
                      {p.status === "paid" ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 text-xs">{p.date}</p>
                      <p className="text-slate-400 text-[10px]">{p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${p.status === "paid" ? "text-emerald-600" : "text-red-500"}`}>
                        {p.amount.toLocaleString()} FCFA
                      </p>
                      <p className={`text-[9px] ${p.status === "paid" ? "text-emerald-400" : "text-red-400"}`}>
                        {p.status === "paid" ? "Payé" : "Échoué"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────── FORFAIT COURSES ─────── */
        <div className="px-5 mt-5 space-y-5">
          {/* Forfait Type Selector */}
          <div className="bg-white rounded-2xl p-1 shadow-sm flex gap-1">
            {([
              { key: "moto" as ForfaitType, icon: Bike, label: "Moto", price: "12 000 FCFA/mois" },
              { key: "voiture" as ForfaitType, icon: Car, label: "Voiture", price: "20 000 FCFA/mois" },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setForfaitType(f.key)}
                className={`flex-1 py-3.5 rounded-xl transition-all flex flex-col items-center gap-1 ${forfaitType === f.key
                  ? "bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] text-white shadow-md"
                  : "text-slate-500"}`}
              >
                <f.icon className="w-5 h-5" />
                <span className="text-xs">{f.label}</span>
                <span className={`text-[10px] ${forfaitType === f.key ? "text-white/70" : "text-slate-400"}`}>{f.price}</span>
              </button>
            ))}
          </div>

          {/* Quota Card */}
          <div className="bg-white rounded-3xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="title-gradient flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#2A9D8F]" />
                Consommation du jour
              </h3>
              <div className={`px-2.5 py-1 rounded-full text-[10px] ${forfaitActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {forfaitActive ? "Actif" : "Inactif"}
              </div>
            </div>

            {/* Weekday */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                <span>Semaine (Lun–Ven)</span>
                <span>{weekdayUsed} / {dailyLimit} courses</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2A9D8F] to-[#1E6091] rounded-full transition-all"
                  style={{ width: `${(weekdayUsed / dailyLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* Weekend */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                <span>Week-end (Sam–Dim)</span>
                <span>{weekendUsed} / {dailyLimit} courses</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F77F00] to-[#E9C46A] rounded-full transition-all"
                  style={{ width: `${(weekendUsed / dailyLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Ce mois", value: "18", sub: "courses" },
                { label: "Restantes", value: `${60 - 18}`, sub: "ce mois" },
                { label: "Économies", value: "4 200", sub: "FCFA" },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-slate-800 text-sm">{s.value}</p>
                  <p className="text-slate-400 text-[9px]">{s.label}</p>
                  <p className="text-[#2A9D8F] text-[9px]">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="title-gradient flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1E6091]" />
              Règles du forfait
            </h3>
            {[
              "2 courses incluses par jour (semaine & week-end)",
              "Réinitialisation automatique chaque mois",
              "Hors forfait : tarif préférentiel membre (-10%)",
              "Zone couverte : Grand Cotonou & environs",
              "Trajet max : 15 km par course incluse",
              "Supplément au-delà : 50 FCFA / km",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0 mt-0.5" />
                <p className="text-slate-600 text-[11px]">{rule}</p>
              </div>
            ))}
          </div>

          {/* Subscribe button */}
          <button
            onClick={handleSubscribeForfait}
            disabled={subscribingForfait}
            className="w-full py-4 bg-gradient-to-r from-[#1E6091] to-[#2A9D8F] text-white rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
          >
            {subscribingForfait ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>{forfaitActive ? "Renouveler" : "S'abonner"} · {forfaitPrice.toLocaleString()} FCFA</span>
              </>
            )}
          </button>

          {/* Historique mensuel */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="title-gradient text-xs mb-3">Historique mensuel</h3>
            {[
              { month: "Avril 2026", used: 18, total: 60, saved: 4200 },
              { month: "Mars 2026", used: 56, total: 60, saved: 12600 },
              { month: "Février 2026", used: 48, total: 56, saved: 9800 },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-xs">{m.month}</p>
                  <p className="text-slate-400 text-[10px]">{m.used}/{m.total} courses utilisées</p>
                </div>
                <p className="text-emerald-500 text-xs">-{m.saved.toLocaleString()} FCFA</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}