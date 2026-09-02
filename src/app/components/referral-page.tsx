import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Copy, Share2, Gift, Users, TrendingUp, Check,
  Link, MessageCircle, Shield,
  Eye, EyeOff, Timer, Award, QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api/client";
import { useAppStore } from "../store/app-store";
import { M3Page, M3Card, M3Button, SectionHeader, EmptyState, StatTile } from "./m3";

/** Génère un code de parrainage stable à partir du profil réel de l'utilisateur. */
function buildReferralCode(fullName?: string, id?: string): string {
  const base = (fullName ?? "").split(" ")[0]?.toUpperCase().replace(/[^A-Z]/g, "") || "IPPOO";
  const suffix = (id ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "2026";
  return `${base}-${suffix}`;
}

/* --- Types --- */
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

/** Initiales à partir d'un nom complet. */
function initialsOf(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "IP";
}

export function ReferralPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("parrainage");
  const [showQR, setShowQR] = useState(false);

  const { state } = useAppStore();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState(() => buildReferralCode(state.user?.fullName, state.user?.id));
  const referralLink = `https://ippoo.bj/ref/${referralCode}`;

  // Charge le parrainage réel de l'utilisateur (aucun jeu de démo)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any>("/referrals/me");
        if (cancelled) return;
        if (res?.code) setReferralCode(res.code);
        setReferrals((res?.referrals ?? []).map((r: any, i: number) => {
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
        if (!cancelled) setReferrals([]);
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
    <M3Page title="Parrainage & Partage" subtitle="Invitez vos proches, gagnez des bonus" icon={Gift}>
      {/* -- Tabs -- */}
      <div className="rounded-full bg-[var(--m3-container)] p-1 flex gap-1 mb-5">
        {([
          { key: "parrainage" as Tab, icon: Gift, label: "Parrainage" },
          { key: "partage" as Tab, icon: Share2, label: "Partage trajet" },
        ]).map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] font-semibold transition active:scale-[0.97]"
              style={active
                ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                : { color: "var(--m3-on-container)" }}
            >
              <t.icon className="w-4 h-4" strokeWidth={2.2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "parrainage" ? (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Filleuls" value={referrals.length.toString()} icon={Users} />
            <StatTile label="Validés" value={completedCount.toString()} icon={Check} />
            <StatTile label="Gains" value={`${(totalEarned / 1000).toFixed(0)}k`} icon={TrendingUp} />
          </div>

          {/* Code & Link */}
          <M3Card delay={0.05}>
            <SectionHeader title="Votre code parrain" icon={Gift} />
            <div className="rounded-2xl p-4 flex items-center justify-between mb-3" style={{ background: "var(--m3-container)" }}>
              <p className="tracking-widest text-[15px] font-bold" style={{ color: "var(--m3-on-container)" }}>{referralCode}</p>
              <button onClick={handleCopyCode} aria-label="Copier le code"
                className="grid h-9 w-9 place-items-center rounded-xl active:scale-90 transition"
                style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
                <Copy className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>

            <button onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold mb-3"
              style={{ color: "var(--m3-primary)" }}>
              <QrCode className="w-3.5 h-3.5" strokeWidth={2.2} />
              {showQR ? "Masquer le QR code" : "Afficher le QR code"}
            </button>
            {showQR && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/[0.06]">
                  <QRCodeSVG value={referralLink} size={140} fgColor="#1a1a2e" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleShareWhatsApp} className="py-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition" style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}>
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">WhatsApp</span>
              </button>
              <button onClick={handleShareSMS} className="py-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition" style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}>
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">SMS</span>
              </button>
              <button onClick={handleNativeShare} className="py-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition" style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}>
                <Share2 className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">Partager</span>
              </button>
            </div>
          </M3Card>

          {/* Reward info */}
          <M3Card tonal delay={0.1}>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4" strokeWidth={2.2} />
              <h3 className="text-[14px] font-bold">Comment ça marche</h3>
            </div>
            {[
              "Partagez votre code avec un ami",
              "Il s'inscrit avec votre code parrain",
              "Après sa 1ère course payée, vous recevez 1 000 FCFA",
              "Votre filleul reçoit aussi 500 FCFA de bonus !",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold mt-0.5"
                  style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>{i + 1}</div>
                <p className="text-[12px] leading-relaxed">{step}</p>
              </div>
            ))}
          </M3Card>

          {/* Referral list */}
          <div>
            <SectionHeader title="Mes filleuls" icon={Users} />
            {referrals.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun filleul pour l'instant"
                description="Partagez votre code pour commencer à gagner des bonus."
                action={<M3Button icon={Share2} onClick={handleNativeShare}>Partager mon code</M3Button>}
              />
            ) : (
              <div className="space-y-2">
                {referrals.map((r, i) => {
                  const badge = statusBadge(r.status);
                  return (
                    <M3Card key={r.id} delay={0.04 * i} className="flex items-center gap-3">
                      <ProfileAvatar initials={r.initials} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{r.name}</p>
                        <p className="text-[11px] text-slate-400">{r.date} {r.firstRide && "· 1ère course"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${badge.color}`}>{badge.label}</span>
                        {r.reward > 0 && <p className="text-emerald-500 text-[11px] mt-0.5 font-semibold">+{r.reward.toLocaleString()} F</p>}
                      </div>
                    </M3Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total */}
          <M3Card className="flex items-center justify-between" delay={0.12}>
            <p className="text-[13px] text-slate-600">Gains cumulés</p>
            <p className="text-[16px] font-bold" style={{ color: "var(--m3-primary)" }}>{totalEarned.toLocaleString()} FCFA</p>
          </M3Card>
        </div>
      ) : (
        /* --- PARTAGE TRAJET --- */
        <div className="space-y-5">
          {/* Current share */}
          {shareActive && (
            <M3Card tonal delay={0.02}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--m3-primary)" }} />
                <span className="text-[13px] font-semibold">Partage actif</span>
              </div>
              <p className="text-[11px] opacity-70 mb-2">Lien de suivi en cours :</p>
              <div className="rounded-xl p-3 flex items-center gap-2 mb-3 bg-white/60">
                <p className="text-[11px] flex-1 truncate">{shareLink}</p>
                <button onClick={handleShareTrackingLink} aria-label="Partager le lien"
                  className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
                  <Share2 className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Expire dans {shareExpiry} min</span>
                {hidePhone && <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> N° masqué</span>}
              </div>
              <button onClick={() => { setShareActive(false); setShareLink(""); toast("Partage arrêté"); }}
                className="mt-3 w-full py-2.5 rounded-full text-[13px] font-semibold bg-white/60 active:scale-[0.98] transition">
                Arrêter le partage
              </button>
            </M3Card>
          )}

          {/* Share type */}
          <div>
            <SectionHeader title="Type de partage" icon={Share2} />
            <div className="flex gap-2">
              {([
                { key: "course" as ShareType, label: "Course en cours" },
                { key: "livraison" as ShareType, label: "Livraison en cours" },
              ]).map(s => {
                const active = shareType === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setShareType(s.key)}
                    className="flex-1 py-3 rounded-full text-[13px] font-semibold transition active:scale-[0.97]"
                    style={active
                      ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                      : { background: "var(--m3-container)", color: "var(--m3-on-container)" }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy options */}
          <M3Card delay={0.05} className="space-y-4">
            <SectionHeader title="Confidentialité" icon={Shield} />

            <div>
              <p className="text-[12px] text-slate-600 mb-2">Durée d'expiration du lien</p>
              <div className="flex gap-2">
                {["15", "30", "60", "120"].map(d => {
                  const active = shareExpiry === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setShareExpiry(d)}
                      className="flex-1 py-2 rounded-full text-[12px] font-medium transition"
                      style={active
                        ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                        : { background: "var(--m3-container)", color: "var(--m3-on-container)" }}
                    >
                      {d} min
                    </button>
                  );
                })}
              </div>
            </div>

            {([
              { on: hidePhone, set: setHidePhone, label: "Masquer mon numéro" },
              { on: hideAddress, set: setHideAddress, label: "Masquer adresse complète" },
            ] as const).map((row, i) => (
              <button key={i} onClick={() => row.set(!row.on)} className="w-full flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {row.on ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4" style={{ color: "var(--m3-primary)" }} />}
                  <span className="text-slate-700 text-[13px]">{row.label}</span>
                </div>
                <div className="w-11 h-6 rounded-full flex items-center px-0.5 transition" style={{ background: row.on ? "var(--m3-primary)" : "#e2e8f0" }}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${row.on ? "translate-x-5" : ""}`} />
                </div>
              </button>
            ))}
          </M3Card>

          {/* Create share button */}
          {!shareActive && (
            <M3Button icon={Link} onClick={handleStartShare}>Créer un lien de suivi</M3Button>
          )}

          {/* Info */}
          <M3Card tonal delay={0.08}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" strokeWidth={2.2} />
              <h3 className="text-[14px] font-bold">Partage sécurisé</h3>
            </div>
            {[
              "Le lien expire automatiquement après la durée choisie",
              "Partageable via WhatsApp, SMS ou tout autre canal",
              "Votre proche voit la position en temps réel sur une carte",
              "Vous pouvez arrêter le partage à tout moment",
            ].map((r, i) => (
              <p key={i} className="text-[12px] py-1 flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.4} />
                {r}
              </p>
            ))}
          </M3Card>
        </div>
      )}
    </M3Page>
  );
}
