import { useState } from "react";
import {
  CreditCard, Star, Shield, Zap, Crown, Check, X,
  Calendar, Clock, ChevronRight, Gift, TrendingUp, AlertTriangle,
  Bike, Car, RotateCcw, Gauge, Sparkles, Award
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import { useAppStore } from "../store/app-store";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";
import { M3Page, SectionHeader, M3Card, M3Button, StatTile } from "./m3";

const MEMBER_IMG = "https://images.unsplash.com/photo-1639133694967-640f255f10fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWVtYmVyc2hpcCUyMGNhcmQlMjBnb2xkJTIwcHJlbWl1bXxlbnwxfHx8fDE3NzU5MTc0Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080";

/* --- Types --- */
interface PaymentHistory {
  id: number;
  date: string;
  amount: number;
  status: "paid" | "failed";
  method: string;
}

type Tab = "carte" | "forfait";
type ForfaitType = "moto" | "voiture";

/* --- Mock Data --- */
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
  const { state } = useAppStore();
  const userName = state.user?.fullName ?? "";
  const userInitials = (userName.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("") || "•").toUpperCase();
  const memberNo = state.user?.id ? `IPP-${state.user.id}` : "—";
  const [tab, setTab] = useState<Tab>("carte");
  const [memberActive, setMemberActive] = useState(true);
  const [showPayments, setShowPayments] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Forfait state
  const [forfaitType, setForfaitType] = useState<ForfaitType>("moto");
  const [forfaitActive, setForfaitActive] = useState(true);
  const [weekdayUsed] = useState(1);
  const [weekendUsed] = useState(0);
  const [subscribingForfait, setSubscribingForfait] = useState(false);

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

  const spinner = <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />;

  return (
    <M3Page
      title="Abonnements"
      subtitle="Carte Membre & Forfaits Courses"
      icon={CreditCard}
      trailing={<img src={logoImg} alt="IPPOO" className="h-6 object-contain drop-shadow-sm" />}
      hero={
        <div className="relative overflow-hidden rounded-2xl border border-white/20">
          <img src={MEMBER_IMG} alt="" className="h-24 w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
          <div className="absolute inset-0 flex items-center gap-2 px-4">
            <Crown className="h-5 w-5 text-white" strokeWidth={2} />
            <span className="text-[13px] font-semibold text-white">Programme Membre IPPOO</span>
          </div>
        </div>
      }
    >
      {/* -- Tabs -- */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-white p-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] border border-black/[0.05]">
        {([
          { key: "carte" as Tab, icon: CreditCard, label: "Carte Membre" },
          { key: "forfait" as Tab, icon: Gauge, label: "Forfait Courses" },
        ]).map(t => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 min-h-[40px] text-xs font-semibold transition active:scale-[0.97]"
              style={on
                ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                : { color: "#64748b" }}
            >
              <t.icon className="h-4 w-4" strokeWidth={2.2} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "carte" ? (
        /* ------- CARTE MEMBRE ------- */
        <div className="space-y-4">
          {/* Carte visuelle */}
          <M3Card className="relative overflow-hidden p-5" style={{ background: "linear-gradient(135deg, var(--m3-primary), var(--m3-accent))", borderColor: "transparent" }} delay={0.02}>
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-white" strokeWidth={2} />
                  <span className="text-[11px] uppercase tracking-wider text-white/90">Membre IPPOO</span>
                </div>
                <div className="mb-1 flex items-center gap-3">
                  <ProfileAvatar initials={userInitials} size={48} />
                  <div>
                    <p className="text-sm text-white">{userName || "Mon compte"}</p>
                    <p className="text-[10px] text-white/70">N° {memberNo}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] ${memberActive ? "bg-white/25 text-white" : "bg-black/25 text-white"}`}>
                {memberActive ? "Actif" : "Expiré"}
              </div>
            </div>
            <div className="relative z-10 mt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/70">Valide jusqu'au</p>
                <p className="text-xs text-white">{memberExpiry}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/70">Tarif mensuel</p>
                <p className="text-sm font-semibold text-white">1 500 FCFA</p>
              </div>
            </div>
          </M3Card>

          {/* Expiration warning */}
          {daysLeft <= 7 && (
            <M3Card tonal delay={0.04}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--m3-primary)]" />
                <div>
                  <p className="text-xs font-semibold">Votre carte expire dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">Renouvelez pour garder vos avantages</p>
                </div>
              </div>
            </M3Card>
          )}

          {/* Renew button */}
          <M3Button onClick={handleRenew} disabled={renewing} icon={renewing ? undefined : RotateCcw}>
            {renewing ? spinner : `${memberActive ? "Renouveler" : "Activer"} · 1 500 FCFA`}
          </M3Button>

          {/* Avantages membres */}
          <div>
            <SectionHeader title="Avantages Membre" icon={Sparkles} />
            <div className="space-y-2.5">
              {memberBenefits.map((b, i) => (
                <M3Card key={i} delay={0.03 * i}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                      <b.icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{b.label}</p>
                      <p className="text-[10px] text-slate-400">{b.desc}</p>
                    </div>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                </M3Card>
              ))}
            </div>
          </div>

          {/* Historique paiements */}
          <div>
            <SectionHeader
              title="Historique des paiements"
              icon={Clock}
              action={
                <button onClick={() => setShowPayments(!showPayments)} aria-label="Afficher l'historique" className="grid h-8 w-8 place-items-center">
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showPayments ? "rotate-90" : ""}`} />
                </button>
              }
            />
            {showPayments && (
              <div className="space-y-2">
                {paymentHistory.map((p, i) => (
                  <M3Card key={p.id} delay={0.03 * i}>
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-xl ${p.status === "paid" ? "bg-emerald-50" : "bg-red-50"}`}>
                        {p.status === "paid" ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-700">{p.date}</p>
                        <p className="text-[10px] text-slate-400">{p.method}</p>
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
                  </M3Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ------- FORFAIT COURSES ------- */
        <div className="space-y-4">
          {/* Forfait Type Selector */}
          <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] border border-black/[0.05]">
            {([
              { key: "moto" as ForfaitType, icon: Bike, label: "Moto", price: "12 000 FCFA/mois" },
              { key: "voiture" as ForfaitType, icon: Car, label: "Voiture", price: "20 000 FCFA/mois" },
            ]).map(f => {
              const on = forfaitType === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setForfaitType(f.key)}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl py-3.5 transition active:scale-[0.97]"
                  style={on
                    ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                    : { color: "#64748b" }}
                >
                  <f.icon className="h-5 w-5" strokeWidth={2} />
                  <span className="text-xs font-semibold">{f.label}</span>
                  <span className="text-[10px]" style={{ opacity: on ? 0.75 : 0.6 }}>{f.price}</span>
                </button>
              );
            })}
          </div>

          {/* Quota Card */}
          <M3Card className="p-5" delay={0.02}>
            <div className="mb-4 flex items-center justify-between">
              <SectionHeader title="Consommation du jour" icon={Gauge} />
              <div className={`rounded-full px-2.5 py-1 text-[10px] ${forfaitActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {forfaitActive ? "Actif" : "Inactif"}
              </div>
            </div>

            {/* Weekday */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                <span>Semaine (Lun-Ven)</span>
                <span>{weekdayUsed} / {dailyLimit} courses</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(weekdayUsed / dailyLimit) * 100}%`, background: "var(--m3-primary)" }} />
              </div>
            </div>

            {/* Weekend */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                <span>Week-end (Sam-Dim)</span>
                <span>{weekendUsed} / {dailyLimit} courses</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(weekendUsed / dailyLimit) * 100}%`, background: "var(--m3-accent)" }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Ce mois" value="18" />
              <StatTile label="Restantes" value={`${60 - 18}`} />
              <StatTile label="Économies" value="4 200" />
            </div>
          </M3Card>

          {/* Rules */}
          <M3Card delay={0.04}>
            <SectionHeader title="Règles du forfait" icon={Shield} />
            <div className="space-y-3">
              {[
                "2 courses incluses par jour (semaine & week-end)",
                "Réinitialisation automatique chaque mois",
                "Hors forfait : tarif préférentiel membre (-10%)",
                "Zone couverte : Grand Cotonou & environs",
                "Trajet max : 15 km par course incluse",
                "Supplément au-delà : 50 FCFA / km",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--m3-primary)]" />
                  <p className="text-[11px] text-slate-600">{rule}</p>
                </div>
              ))}
            </div>
          </M3Card>

          {/* Subscribe button */}
          <M3Button onClick={handleSubscribeForfait} disabled={subscribingForfait} icon={subscribingForfait ? undefined : Award}>
            {subscribingForfait ? spinner : `${forfaitActive ? "Renouveler" : "S'abonner"} · ${forfaitPrice.toLocaleString()} FCFA`}
          </M3Button>

          {/* Historique mensuel */}
          <M3Card delay={0.05}>
            <SectionHeader title="Historique mensuel" icon={Calendar} />
            {[
              { month: "Avril 2026", used: 18, total: 60, saved: 4200 },
              { month: "Mars 2026", used: 56, total: 60, saved: 12600 },
              { month: "Février 2026", used: 48, total: 56, saved: 9800 },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
                <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-700">{m.month}</p>
                  <p className="text-[10px] text-slate-400">{m.used}/{m.total} courses utilisées</p>
                </div>
                <p className="text-xs text-emerald-500">-{m.saved.toLocaleString()} FCFA</p>
              </div>
            ))}
          </M3Card>
        </div>
      )}
    </M3Page>
  );
}
