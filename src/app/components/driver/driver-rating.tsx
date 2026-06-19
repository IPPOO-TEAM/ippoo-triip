import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Star, ThumbsUp, ThumbsDown, Clock, MapPin,
  ChevronRight, Check, X, Flag, Award, TrendingUp, User,
  MessageCircle, AlertTriangle, Eye
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
type Tab = "recus" | "donnes" | "en_attente";

interface ReceivedRating {
  id: number;
  clientName: string;
  clientInitials: string;
  date: string;
  rideType: string;
  route: string;
  overall: number;
  punctuality: number;
  driving: number;
  courtesy: number;
  comment: string;
}

interface GivenRating {
  id: number;
  clientName: string;
  clientInitials: string;
  date: string;
  rideType: string;
  overall: number;
  comment: string;
}

interface PendingRating {
  id: number;
  clientName: string;
  clientInitials: string;
  rideType: string;
  route: string;
  date: string;
}

/* ─── Mock ─── */
const receivedRatings: ReceivedRating[] = [
  { id: 1, clientName: "Gbètoho Bokossa", clientInitials: "GB", date: "11 Avr 2026", rideType: "Course moto", route: "Cadjehoun → CNHU", overall: 5, punctuality: 5, driving: 5, courtesy: 5, comment: "Excellent chauffeur, très ponctuel et courtois. Je recommande !" },
  { id: 2, clientName: "Fifamè Dossou", clientInitials: "FD", date: "11 Avr 2026", rideType: "Course moto", route: "UAC → Dantokpa", overall: 5, punctuality: 5, driving: 4, courtesy: 5, comment: "Très bon service, conduite prudente. Merci Hounkpatin !" },
  { id: 3, clientName: "Aidatou Tokpanou", clientInitials: "AT", date: "11 Avr 2026", rideType: "Livraison colis", route: "St-Michel → Godomey", overall: 4, punctuality: 4, driving: 5, courtesy: 4, comment: "Colis livre en bon etat, bon timing." },
  { id: 4, clientName: "Aidatou Bokossa", clientInitials: "AB", date: "10 Avr 2026", rideType: "Course moto", route: "Akpakpa → Gbègamey", overall: 5, punctuality: 5, driving: 5, courtesy: 5, comment: "Parfait comme toujours !" },
  { id: 5, clientName: "Sessinou Adechian", clientInitials: "SA", date: "10 Avr 2026", rideType: "Course voiture", route: "Aeroport → Hotel du Lac", overall: 4, punctuality: 3, driving: 4, courtesy: 5, comment: "Bon service, mais un peu en retard au point de prise en charge." },
  { id: 6, clientName: "Fifamè Dossou", clientInitials: "FD", date: "10 Avr 2026", rideType: "Covoiturage", route: "Cotonou → Porto-Novo", overall: 5, punctuality: 5, driving: 5, courtesy: 5, comment: "Trajet agreable, voiture propre et chauffeur sympathique." },
];

const givenRatings: GivenRating[] = [
  { id: 1, clientName: "Gbètoho Bokossa", clientInitials: "GB", date: "11 Avr 2026", rideType: "Course moto", overall: 5, comment: "Client ponctuel et poli" },
  { id: 2, clientName: "Fifamè Dossou", clientInitials: "FD", date: "11 Avr 2026", rideType: "Course moto", overall: 5, comment: "Excellente cliente" },
  { id: 3, clientName: "Aidatou Tokpanou", clientInitials: "AT", date: "11 Avr 2026", rideType: "Livraison colis", overall: 5, comment: "Disponible rapidement" },
  { id: 4, clientName: "Aidatou Bokossa", clientInitials: "AB", date: "10 Avr 2026", rideType: "Course moto", overall: 4, comment: "Bon client" },
];

const pendingRatings: PendingRating[] = [
  { id: 1, clientName: "Sessinou Adechian", clientInitials: "SA", rideType: "Course voiture", route: "Aeroport → Hotel du Lac", date: "10 Avr 2026" },
];

export function DriverRatingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("recus");
  const [selectedReceived, setSelectedReceived] = useState<ReceivedRating | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingPending, setRatingPending] = useState<PendingRating | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [pendingList, setPendingList] = useState(pendingRatings);

  const avgRating = receivedRatings.reduce((s, r) => s + r.overall, 0) / receivedRatings.length;
  const fiveStarCount = receivedRatings.filter(r => r.overall === 5).length;
  const fiveStarPct = Math.round((fiveStarCount / receivedRatings.length) * 100);
  const ratingDistribution = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: receivedRatings.filter(r => r.overall === s).length,
    pct: Math.round((receivedRatings.filter(r => r.overall === s).length / receivedRatings.length) * 100),
  }));

  const submitRating = () => {
    if (ratingStars === 0) { toast.error("Selectionnez une note"); return; }
    setSubmittingRating(true);
    setTimeout(() => {
      setSubmittingRating(false);
      setPendingList(prev => prev.filter(p => p.id !== ratingPending?.id));
      setRatingPending(null);
      setRatingStars(0);
      setRatingComment("");
      toast.success("Avis envoye !");
    }, 1500);
  };

  const tabs = [
    { id: "recus" as Tab, label: "Recus", count: receivedRatings.length },
    { id: "donnes" as Tab, label: "Donnes", count: givenRatings.length },
    { id: "en_attente" as Tab, label: "A noter", count: pendingList.length },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#E9C46A] to-[#F77F00] pt-12 pb-6 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <p className="text-white text-sm flex-1">Mes avis & notes</p>
          <img src={logoImg} alt="IPPOO" className="h-6 object-contain" />
        </div>

        {/* Rating summary */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl border border-white/10 p-4 flex items-center gap-5">
          <div className="text-center">
            <p className="text-white text-3xl" style={{ fontFamily: "'Space Grotesk', monospace" }}>{avgRating.toFixed(2)}</p>
            <div className="flex gap-0.5 justify-center mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className="w-3.5 h-3.5" fill={s <= Math.round(avgRating) ? "white" : "none"} stroke="white" strokeWidth={1.5} />
              ))}
            </div>
            <p className="text-white/60 text-[9px] mt-1">{receivedRatings.length} avis</p>
          </div>
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-white/60 text-[9px] w-3">{d.stars}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-white/40 text-[8px] w-5">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition ${tab === t.id ? "bg-white text-[#F77F00]" : "bg-white/15 text-white/80"}`}
            >
              {t.label}
              <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] ${tab === t.id ? "bg-[#F77F00] text-white" : "bg-white/15 text-white/60"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {/* ═══ RECUS ═══ */}
        {tab === "recus" && (
          <div className="space-y-2">
            {receivedRatings.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReceived(r)}
                className="w-full bg-white rounded-xl border border-slate-100 p-3 text-left active:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ProfileAvatar initials={r.clientInitials} size={36} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{r.clientName}</p>
                    <p className="text-slate-400 text-[9px]">{r.rideType} - {r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.overall }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                    ))}
                    {Array.from({ length: 5 - r.overall }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-slate-200" />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-slate-500 text-[10px] line-clamp-2" style={{ lineHeight: 1.5 }}>"{r.comment}"</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ═══ DONNES ═══ */}
        {tab === "donnes" && (
          <div className="space-y-2">
            {givenRatings.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3 mb-1">
                  <ProfileAvatar initials={r.clientInitials} size={32} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{r.clientName}</p>
                    <p className="text-slate-400 text-[9px]">{r.rideType} - {r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.overall }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-[#2A9D8F] fill-[#2A9D8F]" />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-slate-400 text-[10px]">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        )}

        {/* ═══ EN ATTENTE ═══ */}
        {tab === "en_attente" && (
          <div className="space-y-2">
            {pendingList.length === 0 && (
              <div className="text-center py-16">
                <Check className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun avis en attente</p>
              </div>
            )}
            {pendingList.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ProfileAvatar initials={p.clientInitials} size={40} />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs">{p.clientName}</p>
                    <p className="text-slate-400 text-[9px]">{p.rideType} - {p.route}</p>
                    <p className="text-slate-300 text-[8px]">{p.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRatingPending(p)}
                  className="w-full py-2.5 rounded-xl bg-[#F77F00] text-white text-xs shadow-md shadow-orange-500/15"
                >
                  Noter ce client
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ RECEIVED DETAIL ═══ */}
      {selectedReceived && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReceived(null)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800 text-sm">Avis client</p>
              <button onClick={() => setSelectedReceived(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <ProfileAvatar initials={selectedReceived.clientInitials} size={48} />
              <div>
                <p className="text-slate-700 text-sm">{selectedReceived.clientName}</p>
                <p className="text-slate-400 text-[10px]">{selectedReceived.rideType} - {selectedReceived.route}</p>
                <p className="text-slate-300 text-[9px]">{selectedReceived.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Ponctualite", value: selectedReceived.punctuality },
                { label: "Conduite", value: selectedReceived.driving },
                { label: "Courtoisie", value: selectedReceived.courtesy },
              ].map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center gap-0.5 mb-1">
                    {Array.from({ length: c.value }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                    ))}
                  </div>
                  <p className="text-slate-400 text-[9px]">{c.label}</p>
                </div>
              ))}
            </div>
            {selectedReceived.comment && (
              <div className="bg-amber-50 rounded-xl p-4">
                <MessageCircle className="w-4 h-4 text-amber-500 mb-2" />
                <p className="text-slate-600 text-xs" style={{ lineHeight: 1.7 }}>"{selectedReceived.comment}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ RATING MODAL ═══ */}
      {ratingPending && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRatingPending(null)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800 text-sm">Noter le client</p>
              <button onClick={() => setRatingPending(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="text-center mb-6">
              <ProfileAvatar initials={ratingPending.clientInitials} size={56} className="mx-auto mb-2" />
              <p className="text-slate-700 text-sm">{ratingPending.clientName}</p>
              <p className="text-slate-400 text-[10px]">{ratingPending.rideType}</p>
            </div>

            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRatingStars(s)} className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center active:scale-95 transition">
                  <Star className="w-7 h-7" fill={s <= ratingStars ? "#E9C46A" : "none"} stroke={s <= ratingStars ? "#E9C46A" : "#CBD5E1"} strokeWidth={1.5} />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-4 resize-none"
              rows={3}
              placeholder="Commentaire optionnel..."
            />

            <button
              onClick={submitRating}
              disabled={submittingRating || ratingStars === 0}
              className="w-full py-4 rounded-2xl bg-[#2A9D8F] text-white text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submittingRating ? "Envoi..." : "Envoyer l'avis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
