import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, CheckCircle, Share2, Clock, Sparkles, Users, Copy } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AfricanPattern } from "./icons";
import { promoSlides } from "./home-page";
import type { PromoSlide } from "./home-page";
import { toast } from "sonner";

export function PromoDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const promo = promoSlides.find((s) => s.id === Number(id));

  if (!promo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5">
        <p className="text-gray-500 mb-4">Promotion introuvable</p>
        <button
          onClick={() => navigate("/app")}
          className="bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white px-6 py-3 rounded-xl"
        >
          Retour a l'accueil
        </button>
      </div>
    );
  }

  const isPartner = promo.type === "partner";
  const title = isPartner ? promo.label : promo.title;
  const gradient = isPartner ? "from-gray-800 to-gray-900" : (promo.gradient ?? "from-[#F77F00] to-[#E9C46A]");

  const badgeConfig: Record<string, { bg: string }> = {
    Nouveau: { bg: "bg-gradient-to-r from-[#2A9D8F] to-emerald-500" },
    Limité: { bg: "bg-gradient-to-r from-[#D62828] to-rose-500" },
  };

  const handleShare = async () => {
    const shareData = {
      title: `IPPOO : ${title}`,
      text: promo.description,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) { /* user cancelled */ }
    } else {
      await navigator.clipboard?.writeText(`${title}\n${promo.description}\n${window.location.href}`);
      toast.success("Offre copiée dans le presse-papier !");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <ImageWithFallback
          src={promo.image}
          alt={title ?? ""}
          className="w-full h-full object-cover"
        />
        {!isPartner && (
          <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-60`} />
        )}
        {isPartner && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={1.8} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition"
          >
            <Share2 className="w-5 h-5 text-white" strokeWidth={1.8} />
          </button>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            {isPartner && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full border border-white/15">
                Partenaire
              </span>
            )}
            {promo.profileTarget && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1">
                <Users className="w-3 h-3" /> {promo.profileTarget}
              </span>
            )}
            {promo.badge && (
              <span className={`${badgeConfig[promo.badge].bg} text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg`}>
                {promo.badge}
              </span>
            )}
          </div>
          <h2 className="text-white drop-shadow-lg">{title}</h2>
          {!isPartner && promo.subtitle && (
            <p className="text-white/80 text-sm mt-1">{promo.subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-5 border border-gray-100">
          {/* Validity */}
          <div className="flex items-center gap-3 mb-5 bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-400/30">
              <Calendar className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-amber-600">Valable jusqu'au</p>
              <p className="text-sm text-gray-800">{promo.validUntil}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#F77F00]" strokeWidth={1.8} />
              <h3 className="title-gradient">Description</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{promo.description}</p>
          </div>

          {/* Conditions */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-[#2A9D8F]" strokeWidth={1.8} />
              <h3 className="title-gradient">Conditions</h3>
            </div>
            <div className="space-y-2.5">
              {promo.conditions?.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-xl">
                  <div className="w-5 h-5 bg-[#2A9D8F]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-[#2A9D8F]" strokeWidth={2} />
                  </div>
                  <p className="text-sm text-gray-600">{c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            if (!isPartner && promo.cta) {
              // Navigate to the relevant service
              const serviceMap: Record<string, string> = {
                "Profiter": "/book-ride",
                "Commander": "/delivery",
                "Découvrir": "/carpool",
                "Recharger": "/wallet",
                "S'inscrire": "/book-ride",
                "Activer": "/delivery",
                "Souscrire": "/book-ride",
                "Rejoindre": "/support",
                "Vérifier": "/profile",
                "Essayer": "/book-ride",
                "Réserver": "/carpool",
              };
              navigate(serviceMap[promo.cta] || "/");
            } else {
              navigate("/app");
            }
          }}
          className="w-full mt-5 mb-8 bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white py-4 rounded-2xl shadow-lg shadow-orange-400/30 active:scale-[0.98] transition-transform"
        >
          {isPartner ? "En savoir plus" : promo.cta ?? "Profiter de l'offre"}
        </button>
      </div>
    </div>
  );
}