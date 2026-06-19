import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Copy, Share2, Gift, Users, TrendingUp, Check,
  ChevronRight, Clock, Star, Link, MessageCircle, Shield,
  Eye, EyeOff, Timer, ExternalLink, Zap, Award
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api/client";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

const REFERRAL_IMG = "https://images.unsplash.com/photo-1768830444423-5e5c98640c4c98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcmVmZXJyYWwlMjBmcmllbmRzJTIwc2hhcmluZyUyMG1vYmlsZSUyMHBob25lfGVufDF8fHx8MTc3NTkxNzQyOXww&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Types ─── */
interface Referral {
  id: number;
  name: string;
  initials: string;
  date: string;
  status: "pending" | "completed" | "expired";
  reward: number;
  firstRide: boolean;
}

type Tab = "parrainage" | "partage";
type ShareType = "course" | "livraison";

/* ─── Mock Data ─── */
const referralCode = "DOSSOU-IPP2026";
const referralLink = "https://ippoo.bj/ref/DOSSOU-IPP2026";

const DEFAULT_REFERRALS: Referral[] = [
  { id: 1, name: "Aïdatou Tokpanou", initials: "AT", date: "08 Avr 2026", status: "completed", reward: 1000, firstRide: true },
  { id: 2, name: "Fifamè Dossou", initials: "FD", date: "05 Avr 2026", status: "completed", reward: 1000, firstRide: true },
  { id: 3, name: "Gbètoho Bokossa", initials: "GB", date: "02 Avr 2026", status: "pending", reward: 0, firstRide: false },
  { id: 4, name: "Aïdatou Bokossa", initials: "AB", date: "28 Mar 2026", status: "completed", reward: 1000, firstRide: true },
  { id: 5, name: "Sessinou Adéchian", initials: "SA", date: "15 Mar 2026", status: "expired", reward: 0, firstRide: false },
];

/** Initiales à partir d'un nom complet. */
function initialsOf(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "IP";
}

export function ReferralPage() {
  const navigate = useNavigate();
  const [parallaxY, setParallaxY] = useState(0);
  const [tab, setTab] = useState<Tab>("parrainage");
  const [showQR, setShowQR] = useState(false);

  const [referrals, setReferrals] = useState<Referral[]>(DEFAULT_REFERRALS);

  // Charge le parrainage depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any>("/referrals/me");
        if (cancelled || !res?.referrals?.length) return;
        setReferrals(res.referrals.map((r: any, i: number) => {
          const name = r.inviteeName ?? r.inviteePhone ?? "Invité";
          const status: Referral["status"] = r.status === "rewarded" ? "completed" : "pending";
          return {
            id: i + 1,
            name,
            initials: initialsOf(name),
            date: new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
            status,
            reward: r.status === "rewarded" ? r.rewardXOF : 0,
            firstRide: r.status === "rewarded",
          };
        }));
      } catch {
        /* repli silencieux sur DEFAULT_REFERRALS */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Share state
  const [shareType, setShareType] = useState<ShareType>("course");
  const [shareActive, setShareActive] = useState(false);
  const [shareExpiry, setShareExpiry] = useState("30");
  const [hidePhone, setHidePhone] = useState(true);
  const [hideAddress, setHideAddress] = useState(false);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    const el = document.querySelector(".flex-1.min-h-0.overflow-y-auto");
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const totalEarned = referrals.filter(r => r.status === "completed").reduce((a, r) => a + r.reward, 0);
  const completedCount = referrals.filter(r => r.status === "completed").length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => toast.success("Code copié !")).catch(() => toast.success("Code copié !"));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => toast.success("Lien copié !")).catch(() => toast.success("Lien copié !"));
  };

  const handleShareWhatsApp = () => {
    const text = `Rejoins IPPOO TRIIP avec mon code ${referralCode} et gagne 1 000 FCFA de bonus ! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareSMS = () => {
    const text = `Utilise mon code ${referralCode} sur IPPOO et gagne 1000 FCFA ! ${referralLink}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "IPPOO TRIIP", text: `Code parrain : ${referralCode}`, url: referralLink });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleStartShare = () => {
    const link = `https://ippoo.bj/track/${Date.now().toString(36)}?exp=${shareExpiry}m${hidePhone ? "&hp=1" : ""}${hideAddress ? "&ha=1" : ""}`;
    setShareLink(link);
    setShareActive(true);
    toast.success("Lien de suivi créé !", { description: `Expire dans ${shareExpiry} min` });
  };

  const handleShareTrackingLink = () => {
    if (navigator.share) {
      navigator.share({ title: "Suivez mon trajet IPPOO", url: shareLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareLink);
      toast.success("Lien copié !");
    }
  };

  const statusBadge = (s: string) => {
    if (s === "completed") return { label: "Validé", color: "bg-emerald-50 text-emerald-600" };
    if (s === "pending") return { label: "En attente", color: "bg-amber-50 text-amber-600" };
    return { label: "Expiré", color: "bg-slate-100 text-slate-400" };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F77F00]/90 via-[#E9C46A]/75 to-[#2A9D8F]/85" />
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
          <h1 className="text-white mb-1 drop-shadow-md">Parrainage & Partage</h1>
          <p className="text-white/80 text-xs">Invitez vos proches, gagnez des bonus</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 -mt-5 relative z-20">
        <div className="bg-white rounded-2xl p-1 shadow-md flex gap-1">
          {([
            { key: "parrainage" as Tab, icon: Gift, label: "Parrainage" },
            { key: "partage" as Tab, icon: Share2, label: "Partage trajet" },
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

      {tab === "parrainage" ? (
        <div className="px-5 mt-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Filleuls", value: referrals.length.toString(), icon: Users, color: "text-[#1E6091]", bg: "bg-blue-50" },
              { label: "Validés", value: completedCount.toString(), icon: Check, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Gains", value: `${(totalEarned / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-[#F77F00]", bg: "bg-orange-50" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-slate-800 text-sm">{s.value}</p>
                <p className="text-slate-400 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Code & Link */}
          <div className="bg-white rounded-3xl p-5 shadow-md">
            <h3 className="text-slate-800 mb-3 text-center">Votre code parrain</h3>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-3">
              <p className="text-[#1E6091] tracking-widest text-sm">{referralCode}</p>
              <button onClick={handleCopyCode} className="w-9 h-9 bg-[#1E6091]/10 rounded-xl flex items-center justify-center">
                <Copy className="w-4 h-4 text-[#1E6091]" />
              </button>
            </div>

            {/* QR toggle */}
            <button onClick={() => setShowQR(!showQR)} className="w-full text-center text-[11px] text-[#2A9D8F] mb-3">
              {showQR ? "Masquer le QR code" : "Afficher le QR code"}
            </button>
            {showQR && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <QRCodeSVG value={referralLink} size={140} fgColor="#1E6091" />
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleShareWhatsApp} className="py-3 bg-emerald-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-[9px] text-emerald-700">WhatsApp</span>
              </button>
              <button onClick={handleShareSMS} className="py-3 bg-blue-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-[9px] text-blue-700">SMS</span>
              </button>
              <button onClick={handleNativeShare} className="py-3 bg-violet-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
                <Share2 className="w-5 h-5 text-violet-600" />
                <span className="text-[9px] text-violet-700">Partager</span>
              </button>
            </div>
          </div>

          {/* Reward info */}
          <div className="bg-gradient-to-r from-[#F77F00]/10 to-[#E9C46A]/10 rounded-2xl p-4 border border-[#F77F00]/20">
            <h3 className="text-slate-800 text-xs mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F77F00]" />
              Comment ça marche
            </h3>
            {[
              "Partagez votre code avec un ami",
              "Il s'inscrit avec votre code parrain",
              "Après sa 1ère course payée, vous recevez 1 000 FCFA",
              "Votre filleul reçoit aussi 500 FCFA de bonus !",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5">
                <div className="w-5 h-5 rounded-full bg-[#F77F00] text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-slate-600 text-[11px]">{step}</p>
              </div>
            ))}
          </div>

          {/* Referral list */}
          <div>
            <h2 className="text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1E6091]" />
              Mes filleuls
            </h2>
            {referrals.map(r => {
              const badge = statusBadge(r.status);
              return (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm mb-2 flex items-center gap-3">
                  <ProfileAvatar initials={r.initials} size={40} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{r.name}</p>
                    <p className="text-slate-400 text-[10px]">{r.date} {r.firstRide && "· 1ère course ✓"}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] ${badge.color}`}>{badge.label}</span>
                    {r.reward > 0 && <p className="text-emerald-500 text-[10px] mt-0.5">+{r.reward.toLocaleString()} F</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <p className="text-slate-600 text-xs">Gains cumulés</p>
            <p className="text-[#F77F00] text-sm">{totalEarned.toLocaleString()} FCFA</p>
          </div>
        </div>
      ) : (
        /* ─── PARTAGE TRAJET ─── */
        <div className="px-5 mt-5 space-y-5">
          {/* Current share */}
          {shareActive && (
            <div className="bg-gradient-to-br from-[#2A9D8F] to-[#1E6091] rounded-3xl p-5 shadow-lg text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs">Partage actif</span>
              </div>
              <p className="text-white/70 text-[10px] mb-2">Lien de suivi en cours :</p>
              <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2 mb-3">
                <p className="text-white text-[10px] flex-1 truncate">{shareLink}</p>
                <button onClick={handleShareTrackingLink} className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex gap-4 text-[10px]">
                <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Expire dans {shareExpiry} min</span>
                {hidePhone && <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> N° masqué</span>}
              </div>
              <button onClick={() => { setShareActive(false); setShareLink(""); toast("Partage arrêté"); }} className="mt-3 w-full py-2.5 bg-white/15 rounded-xl text-xs active:scale-[0.98] transition">
                Arrêter le partage
              </button>
            </div>
          )}

          {/* Share type */}
          <div>
            <h3 className="text-slate-800 mb-2">Type de partage</h3>
            <div className="flex gap-2">
              {([
                { key: "course" as ShareType, label: "Course en cours" },
                { key: "livraison" as ShareType, label: "Livraison en cours" },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setShareType(s.key)}
                  className={`flex-1 py-3 rounded-xl text-xs transition ${shareType === s.key ? "bg-[#1E6091] text-white shadow-md" : "bg-white text-slate-500 shadow-sm"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy options */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1E6091]" />
              Confidentialité
            </h3>

            <div>
              <p className="text-slate-600 text-[11px] mb-2">Durée d'expiration du lien</p>
              <div className="flex gap-2">
                {["15", "30", "60", "120"].map(d => (
                  <button
                    key={d}
                    onClick={() => setShareExpiry(d)}
                    className={`flex-1 py-2 rounded-lg text-[11px] transition ${shareExpiry === d ? "bg-[#2A9D8F] text-white" : "bg-slate-50 text-slate-500"}`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setHidePhone(!hidePhone)} className="w-full flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {hidePhone ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-[#2A9D8F]" />}
                <span className="text-slate-700 text-xs">Masquer mon numéro</span>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition ${hidePhone ? "bg-[#2A9D8F]" : "bg-slate-200"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${hidePhone ? "translate-x-4" : ""}`} />
              </div>
            </button>

            <button onClick={() => setHideAddress(!hideAddress)} className="w-full flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {hideAddress ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-[#2A9D8F]" />}
                <span className="text-slate-700 text-xs">Masquer adresse complète</span>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition ${hideAddress ? "bg-[#2A9D8F]" : "bg-slate-200"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${hideAddress ? "translate-x-4" : ""}`} />
              </div>
            </button>
          </div>

          {/* Create share button */}
          {!shareActive && (
            <button
              onClick={handleStartShare}
              className="w-full py-4 bg-gradient-to-r from-[#2A9D8F] to-[#1E6091] text-white rounded-2xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Link className="w-4 h-4" />
              <span>Créer un lien de suivi</span>
            </button>
          )}

          {/* Info */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <h3 className="text-blue-800 text-xs mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Partage sécurisé
            </h3>
            {[
              "Le lien expire automatiquement après la durée choisie",
              "Partageable via WhatsApp, SMS ou tout autre canal",
              "Votre proche voit la position en temps réel sur une carte",
              "Vous pouvez arrêter le partage à tout moment",
            ].map((r, i) => (
              <p key={i} className="text-blue-700 text-[10px] py-1 flex items-start gap-1.5">
                <Check className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                {r}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}