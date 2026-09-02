import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Star, ThumbsUp, ThumbsDown, Clock, MapPin,
  Phone, AlertTriangle, Shield, MessageCircle, ChevronRight,
  Check, X, Flag, Award, TrendingUp, User
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import { useAppStore } from "../store/app-store";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

const RATING_IMG = "https://images.unsplash.com/photo-1661871853503-5246c7205e68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcGVvcGxlJTIwcmF0aW5nJTIwcmV2aWV3JTIwc3RhcnMlMjBtb2JpbGV8ZW58MXx8fHwxNzc1OTE3NDI5fDA&ixlib=rb-4.1.0&q=80&w=1080";

/* --- Types --- */
interface ClientRating {
  id: number;
  clientName: string;
  clientInitials: string;
  date: string;
  rideType: string;
  punctuality: number;
  behavior: number;
  infoAccuracy: number;
  overall: number;
  comment: string;
  driverName: string;
  driverInitials: string;
}

interface PendingRating {
  id: number;
  clientName: string;
  clientInitials: string;
  rideType: string;
  route: string;
  date: string;
}

/* Aucune donnée codée en dur : les évaluations réelles se remplissent au fil des courses. */
const clientRatings: ClientRating[] = [];

const pendingRatings: PendingRating[] = [];

const criteria = [
  { key: "punctuality", label: "Ponctualité", icon: Clock },
  { key: "behavior", label: "Respect / Comportement", icon: ThumbsUp },
  { key: "infoAccuracy", label: "Exactitude infos", icon: MapPin },
] as const;

export function RatingPage() {
  const navigate = useNavigate();
  const { state } = useAppStore();
  const userName = state.user?.fullName ?? "";
  const userInitials = (userName.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("") || "•").toUpperCase();
  const [parallaxY, setParallaxY] = useState(0);
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({ punctuality: 0, behavior: 0, infoAccuracy: 0 });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showContestForm, setShowContestForm] = useState(false);
  const [contestReason, setContestReason] = useState("");

  useEffect(() => {
    const el = document.querySelector(".flex-1.min-h-0.overflow-y-auto");
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute user average
  const ratingCount = clientRatings.length || 0;
  const avgRating = ratingCount ? clientRatings.reduce((a, r) => a + r.overall, 0) / ratingCount : 0;
  const avgPunct = ratingCount ? clientRatings.reduce((a, r) => a + r.punctuality, 0) / ratingCount : 0;
  const avgBehav = ratingCount ? clientRatings.reduce((a, r) => a + r.behavior, 0) / ratingCount : 0;
  const avgInfo = ratingCount ? clientRatings.reduce((a, r) => a + r.infoAccuracy, 0) / ratingCount : 0;

  const handleSubmitRating = () => {
    if (Object.values(scores).some(s => s === 0)) { toast.error("Notez tous les critères"); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setActiveRating(null);
      setScores({ punctuality: 0, behavior: 0, infoAccuracy: 0 });
      setComment("");
      toast.success("Évaluation envoyée !");
    }, 1200);
  };

  const handleContest = () => {
    if (!contestReason.trim()) { toast.error("Indiquez la raison de la contestation"); return; }
    toast.success("Contestation envoyée au Support", { description: "Nous examinerons votre demande sous 48h" });
    setShowContestForm(false);
    setContestReason("");
  };

  const renderStars = (rating: number, onRate?: (v: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onClick={() => onRate?.(s)}
          className={onRate ? "active:scale-110 transition" : ""}
          disabled={!onRate}
        >
          <Star className={`w-5 h-5 ${s <= rating ? "text-[#E9C46A] fill-[#E9C46A]" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );

  const scoreBadge = (score: number) => {
    if (score >= 4.5) return { label: "Excellent", color: "bg-emerald-50 text-emerald-600" };
    if (score >= 3.5) return { label: "Bon", color: "bg-blue-50 text-blue-600" };
    if (score >= 2.5) return { label: "Moyen", color: "bg-amber-50 text-amber-600" };
    return { label: "À améliorer", color: "bg-red-50 text-red-500" };
  };

  const badge = scoreBadge(avgRating);

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* -- Header -- */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-sm">
        <img src={RATING_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A9D8F]/85 via-[#2A9D8F]/70 to-[#1E6091]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { if (activeRating) { setActiveRating(null); } else navigate(-1); }} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1" />
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-white mb-1 drop-shadow-md">Évaluation Client</h1>
          <p className="text-white/80 text-xs">Notation par les chauffeurs & livreurs</p>
        </div>
      </div>

      {activeRating !== null ? (
        /* -- Rating Form -- */
        (() => {
          const pending = pendingRatings.find(p => p.id === activeRating);
          if (!pending) return null;
          return (
            <div className="px-5 mt-5 space-y-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <ProfileAvatar initials={pending.clientInitials} size={48} />
                  <div>
                    <p className="text-slate-800 text-sm">{pending.clientName}</p>
                    <p className="text-slate-400 text-[10px]">{pending.rideType} · {pending.route}</p>
                  </div>
                </div>

                {criteria.map(c => (
                  <div key={c.key} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <c.icon className="w-4 h-4 text-[#2A9D8F]" />
                      <p className="text-slate-700 text-xs">{c.label}</p>
                    </div>
                    {renderStars(scores[c.key], (v) => setScores(prev => ({ ...prev, [c.key]: v })))}
                  </div>
                ))}

                <div className="mb-4">
                  <p className="text-slate-700 text-xs mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#2A9D8F]" />
                    Commentaire (obligatoire si note &lt; 3)
                  </p>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Décrivez votre expérience avec ce client..."
                    className="w-full bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100 resize-none h-20 focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmitRating}
                disabled={submitting}
                className="w-full py-4 bg-[#2A9D8F] text-white rounded-2xl shadow-sm shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Envoyer l'évaluation</span>
                  </>
                )}
              </button>
            </div>
          );
        })()
      ) : (
        <div className="px-5 mt-5 space-y-5">
          {/* Score global */}
          <div className="bg-white rounded-2xl p-5 shadow-md text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <ProfileAvatar initials={userInitials} size={56} />
              <div className="text-left">
                <p className="text-slate-800 text-sm">{userName || "Mon profil"}</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] mt-1 ${badge.color}`}>{badge.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-3xl text-slate-800">{avgRating.toFixed(1)}</p>
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "text-[#E9C46A] fill-[#E9C46A]" : "text-slate-200"}`} />)}</div>
            </div>
            <p className="text-slate-400 text-[10px]">{clientRatings.length} évaluations reçues</p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Ponctualité", value: avgPunct },
                { label: "Comportement", value: avgBehav },
                { label: "Infos exactes", value: avgInfo },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-slate-800 text-sm">{s.value.toFixed(1)}</p>
                  <p className="text-slate-400 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pending ratings (driver view) */}
          {pendingRatings.length > 0 && (
            <div>
              <h2 className="title-gradient mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F77F00]" />
                À évaluer
              </h2>
              {pendingRatings.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveRating(p.id)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm mb-2 flex items-center gap-3 text-left active:scale-[0.98] transition"
                >
                  <ProfileAvatar initials={p.clientInitials} size={40} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{p.clientName}</p>
                    <p className="text-slate-400 text-[10px]">{p.rideType} · {p.route} · {p.date}</p>
                  </div>
                  <div className="w-8 h-8 bg-[#F77F00]/10 rounded-xl flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#F77F00]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Historique évaluations */}
          <div>
            <h2 className="title-gradient mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1E6091]" />
              Historique des évaluations
            </h2>
            {clientRatings.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ProfileAvatar initials={r.driverInitials} size={32} gradient="from-[#2A9D8F] to-[#1E6091]" />
                    <div>
                      <p className="text-slate-700 text-[11px]">{r.driverName}</p>
                      <p className="text-slate-400 text-[9px]">{r.rideType} · {r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#E9C46A] fill-[#E9C46A]" />
                    <span className="text-slate-800 text-xs">{r.overall.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] italic">« {r.comment} »</p>
                <div className="flex gap-4 mt-2">
                  {[
                    { label: "Ponctualité", val: r.punctuality },
                    { label: "Respect", val: r.behavior },
                    { label: "Infos", val: r.infoAccuracy },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400">{c.label}</span>
                      <span className="text-[9px] text-slate-600">{c.val}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contest */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <button onClick={() => setShowContestForm(!showContestForm)} className="w-full flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#D62828]" />
              <span className="text-slate-700 text-xs flex-1 text-left">Contester une évaluation</span>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showContestForm ? "rotate-90" : ""}`} />
            </button>
            {showContestForm && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={contestReason}
                  onChange={e => setContestReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous contestez cette note..."
                  className="w-full bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100 resize-none h-20 focus:outline-none focus:border-[#D62828]"
                />
                <button onClick={handleContest} className="w-full py-3 bg-[#D62828] text-white rounded-xl text-xs active:scale-[0.98] transition">
                  Envoyer la contestation
                </button>
              </div>
            )}
          </div>

          {/* Impact info */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <h3 className="text-blue-800 text-xs mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Impact de votre score
            </h3>
            {[
              "≥ 4.5/5 : Priorité d'attribution & bonus IPPOO CASH",
              "3.0 - 4.4/5 : Service standard",
              "< 3.0/5 : Pré-paiement obligatoire, attribution retardée",
              "Annulations abusives : restrictions temporaires",
            ].map((r, i) => (
              <p key={i} className="text-blue-700 text-[10px] py-1">{r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}