import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Star, Check, MessageCircle } from "lucide-react";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* --- Types --- */
type Tab = "recus" | "donnes" | "en_attente";

interface RatingsSummary {
  average: number;
  total: number;
  distribution: Record<string, number>;
}

export function DriverRatingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("recus");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RatingsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<RatingsSummary>("/driver/ratings");
        if (!cancelled) setSummary(data ?? null);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const avgRating = summary?.average ?? 0;
  const totalReviews = summary?.total ?? 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    pct: Math.max(0, Math.min(100, Number(summary?.distribution?.[String(s)] ?? 0))),
  }));

  // Aucun endpoint ne renvoie le détail des avis individuels : listes vides.
  const receivedRatings: never[] = [];
  const givenRatings: never[] = [];
  const pendingList: never[] = [];

  const tabs = [
    { id: "recus" as Tab, label: "Recus", count: receivedRatings.length },
    { id: "donnes" as Tab, label: "Donnes", count: givenRatings.length },
    { id: "en_attente" as Tab, label: "A noter", count: pendingList.length },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#E9C46A] pt-12 pb-6 px-5 relative overflow-hidden">
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
            <p className="text-white/60 text-[9px] mt-1">{totalReviews} avis</p>
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
              <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] ${tab === t.id ? "bg-[#F77F00] text-black" : "bg-white/15 text-white/60"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#E9C46A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* --- RECUS --- */}
            {tab === "recus" && (
              <div className="text-center py-16">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun avis recu pour le moment</p>
                <p className="text-slate-300 text-[10px]">Les avis de vos clients apparaitront ici</p>
              </div>
            )}

            {/* --- DONNES --- */}
            {tab === "donnes" && (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun avis donne</p>
              </div>
            )}

            {/* --- EN ATTENTE --- */}
            {tab === "en_attente" && (
              <div className="text-center py-16">
                <Check className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun avis en attente</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
