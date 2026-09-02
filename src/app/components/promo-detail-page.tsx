import { useNavigate, useParams } from "react-router";
import { Calendar, CheckCircle, Share2, Clock, Sparkles, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { promoSlides } from "./home-page";
import type { PromoSlide } from "./home-page";
import { toast } from "sonner";
import { M3Page, SectionHeader, M3Card, M3Button } from "./m3";

export function PromoDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const promo = promoSlides.find((s) => s.id === Number(id));

  if (!promo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5">
        <p className="mb-4 text-slate-500">Promotion introuvable</p>
        <div className="w-full max-w-xs">
          <M3Button onClick={() => navigate("/app")}>Retour a l'accueil</M3Button>
        </div>
      </div>
    );
  }

  const isPartner = promo.type === "partner";
  const title = isPartner ? promo.label : promo.title;

  const badgeConfig: Record<string, { bg: string }> = {
    Nouveau: { bg: "bg-emerald-500" },
    Limité: { bg: "bg-rose-600" },
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

  const Hero = (
    <div className="relative overflow-hidden rounded-3xl">
      <ImageWithFallback src={promo.image} alt={title ?? ""} className="h-40 w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {isPartner && (
            <span className="rounded-full border border-white/15 bg-white/20 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">Partenaire</span>
          )}
          {promo.profileTarget && (
            <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/20 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
              <Users className="h-3 w-3" /> {promo.profileTarget}
            </span>
          )}
          {promo.badge && (
            <span className={`${badgeConfig[promo.badge]?.bg ?? "bg-slate-600"} rounded-full px-2.5 py-1 text-[10px] text-white shadow-sm`}>{promo.badge}</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-white drop-shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
        {!isPartner && promo.subtitle && <p className="mt-0.5 text-sm text-white/80">{promo.subtitle}</p>}
      </div>
    </div>
  );

  const serviceMap: Record<string, string> = {
    "Profiter": "/book-ride", "Commander": "/delivery", "Découvrir": "/carpool",
    "Recharger": "/wallet", "S'inscrire": "/book-ride", "Activer": "/delivery",
    "Souscrire": "/book-ride", "Rejoindre": "/support", "Vérifier": "/profile",
    "Essayer": "/book-ride", "Réserver": "/carpool",
  };

  return (
    <M3Page
      title="Offre"
      subtitle="Details de la promotion"
      icon={Sparkles}
      hero={Hero}
      trailing={
        <button
          onClick={handleShare}
          aria-label="Partager"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/15 text-[var(--m3-on-primary)] backdrop-blur-md transition active:scale-90"
        >
          <Share2 className="h-5 w-5" strokeWidth={2} />
        </button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        <M3Card tonal>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl text-[var(--m3-on-primary)]" style={{ background: "var(--m3-primary)" }}>
              <Calendar className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs opacity-70">Valable jusqu'au</p>
              <p className="text-sm font-semibold">{promo.validUntil}</p>
            </div>
          </div>
        </M3Card>

        <M3Card delay={0.05}>
          <SectionHeader title="Description" icon={Sparkles} />
          <p className="text-sm leading-relaxed text-slate-600">{promo.description}</p>
        </M3Card>

        {promo.conditions && promo.conditions.length > 0 && (
          <M3Card delay={0.1}>
            <SectionHeader title="Conditions" icon={CheckCircle} />
            <div className="space-y-2.5">
              {promo.conditions.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                  <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                    <Clock className="h-3 w-3" strokeWidth={2} />
                  </div>
                  <p className="text-sm text-slate-600">{c}</p>
                </div>
              ))}
            </div>
          </M3Card>
        )}

        <M3Button
          icon={Sparkles}
          onClick={() => {
            if (!isPartner && promo.cta) navigate(serviceMap[promo.cta] || "/");
            else navigate("/app");
          }}
        >
          {isPartner ? "En savoir plus" : promo.cta ?? "Profiter de l'offre"}
        </M3Button>
      </div>
    </M3Page>
  );
}

export default PromoDetailPage;
