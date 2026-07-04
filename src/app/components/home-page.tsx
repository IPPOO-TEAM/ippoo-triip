import { useNavigate } from "react-router";
import { Search, MapPin, Bell, ChevronRight, Star, Ticket, Home, Briefcase, Store, GraduationCap, Megaphone, Wallet, Sun, Moon, CloudSun, Zap, ArrowRight, CreditCard, Car, Users, Route, Gift } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProfileAvatar } from "./profile-avatar";
import { BrandLogo } from "./brand-logo";
import { usePlatformConfig } from "../store/platform-config";
import { useAppStore } from "../store/app-store";
import {
  IconCourse, IconLivraison, IconGroupOrder, IconCovoiturage,
  IconGrosColis, IconFretAerien, IconWallet, IconHistorique, IconSupport,
  AfricanPattern, Badge
} from "./icons";
import { activeCouponsForHome } from "./coupons-data";
import { CouponTicket } from "./coupon-ticket";
import { LiveMap } from "./live-map";
import { useState, useEffect, useCallback, useRef } from "react";
import canalImg from "figma:asset/14935739fa73b965aaede2f60eb0bbdbd1c7e863.png";
import mtnImg from "figma:asset/620d19867cc6907921f09e7413841397c1739486.png";
import celtiisImg from "figma:asset/ed96e139e3ae0a79c594fcabe325e0ca246fcf01.png";
import headerHeroImg from "figma:asset/e9e60f38f18b288d039778aec014b51cd42bd5dd.png";
import deliveryHandoffImg from "figma:asset/a6aef9ebfa4a801e5a4ed3ea72a27e7742e004a2.png";
import shopperImg from "figma:asset/d3cf1865f70a1246aa24618348f3561eac469995.png";
import friendsShopImg from "figma:asset/9d0cf23d2d0e99e2bd749940c31f0b57927a27af.png";
import deliveryManImg from "figma:asset/f60d348c0496558dfd06f3bbc96393ca6894322e.png";
import africanFoodImg from "figma:asset/5ee19081331bf15de3e3fd0a234d99bd14535efb.png";
import moovAfricaImg from "figma:asset/49bbc2af7934a88ae90d8d0b94d2f7bf5816e590.png";
import mtnBusinessImg from "figma:asset/3f2d8a2ac15a62011777865c20df7623eb9a6c5a.png";

export interface PromoSlide {
  id: number;
  type: "promo" | "partner";
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  badge: "Nouveau" | "Limité" | null;
  image: string;
  label: string;
  path: string;
  description: string;
  conditions: string[];
  validUntil: string;
  profileTarget: string | null;
}

const services = [
  { Icon: IconCourse, label: "Course", path: "/book-ride", offerId: "taxi", gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/30", bg: "bg-blue-50" },
  { Icon: IconLivraison, label: "Livraison", path: "/delivery", offerId: "delivery", gradient: "from-orange-400 to-orange-500", shadow: "shadow-orange-400/30", bg: "bg-orange-50" },
  { Icon: IconGroupOrder, label: "Groupee", path: "/group-orders", offerId: "group", gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/30", bg: "bg-violet-50" },
  { Icon: IconCovoiturage, label: "Covoiturage", path: "/carpool", offerId: "carpool", gradient: "from-cyan-400 to-cyan-500", shadow: "shadow-cyan-400/30", bg: "bg-cyan-50" },
  { Icon: IconGrosColis, label: "Gros colis", path: "/heavy-transport", offerId: "heavy", gradient: "from-rose-400 to-rose-500", shadow: "shadow-rose-400/30", bg: "bg-rose-50" },
  { Icon: IconFretAerien, label: "IPPOO AIR", path: "/air-freight", offerId: "air", gradient: "from-sky-400 to-blue-600", shadow: "shadow-sky-400/30", bg: "bg-sky-50" },
  { Icon: IconWallet, label: "IPPOO Cash", path: "/wallet", gradient: "from-emerald-400 to-emerald-500", shadow: "shadow-emerald-400/30", bg: "bg-emerald-50" },
  { Icon: IconHistorique, label: "Historique", path: "/history", gradient: "from-gray-400 to-gray-500", shadow: "shadow-gray-400/20", bg: "bg-gray-50" },
  { Icon: IconSupport, label: "Support", path: "/support", gradient: "from-amber-400 to-amber-500", shadow: "shadow-amber-400/30", bg: "bg-amber-50" },
];

const promoSlides: PromoSlide[] = [
  {
    id: 1,
    type: "promo",
    title: "1ère course gratuite !",
    subtitle: "Jusqu'à 2 000 FCFA offerts pour votre premier trajet",
    cta: "Profiter",
    gradient: "from-[#F77F00] to-[#E9C46A]",
    badge: "Nouveau",
    image: deliveryManImg,
    label: "1ère course gratuite",
    path: "/promo/1",
    description: "Bienvenue sur IPPOO ! Pour célébrer votre inscription, profitez d'une première course entièrement offerte jusqu'à 2 000 FCFA. Valable sur les courses moto et voiture dans toute la ville.",
    conditions: ["Valable 30 jours après inscription", "Course moto ou voiture uniquement", "Montant max : 2 000 FCFA", "Non cumulable avec d'autres promos"],
    validUntil: "30 avril 2026",
    profileTarget: null,
  },
  {
    id: 7,
    type: "partner",
    title: "CANAL+ x IPPOO",
    subtitle: "10 courses = 1 mois CANAL+ Access offert",
    cta: "En savoir plus",
    gradient: "from-gray-800 to-gray-900",
    image: canalImg,
    label: "CANAL+",
    badge: "Limité",
    path: "/promo/7",
    description: "Gagnez 1 mois d'abonnement CANAL+ Access en effectuant 10 courses IPPOO ce mois-ci ! Films, séries, sport, tout CANAL+ chez vous.",
    conditions: ["10 courses minimum en avril 2026", "Abonnement CANAL+ Access (1 mois)", "Code envoyé sous 48h", "1 gain par utilisateur"],
    validUntil: "30 avril 2026",
    profileTarget: null,
  },
  {
    id: 2,
    type: "promo",
    title: "Livraison express -30%",
    subtitle: "Envoyez vos colis partout en ville ce week-end",
    cta: "Commander",
    gradient: "from-[#1E6091] to-[#2A9D8F]",
    badge: "Limité",
    image: deliveryHandoffImg,
    label: "Livraison express",
    path: "/promo/2",
    description: "Ce week-end uniquement, profitez de -30% sur toutes vos livraisons express en ville. Envoyez documents, repas ou petits colis en moins de 45 minutes.",
    conditions: ["Samedi et dimanche uniquement", "Colis < 10 kg", "Rayon max : 15 km", "3 livraisons max par utilisateur"],
    validUntil: "13 avril 2026",
    profileTarget: null,
  },
  {
    id: 5,
    type: "partner",
    title: "MTN MoMo x IPPOO",
    subtitle: "10% cashback sur toutes vos courses",
    cta: "Activer",
    gradient: "from-yellow-500 to-amber-500",
    image: mtnImg,
    label: "MTN Mobile Money",
    badge: null,
    path: "/promo/5",
    description: "MTN MoMo et IPPOO s'associent ! Payez vos courses avec MTN MoMo et bénéficiez de 10% de cashback instantané. Rechargez votre wallet IPPOO Cash directement depuis votre compte MTN.",
    conditions: ["Cashback plafonné à 1 000 FCFA/jour", "Compte MTN MoMo actif requis", "Offre valable jusqu'au 30 mai 2026"],
    validUntil: "30 mai 2026",
    profileTarget: null,
  },
  {
    id: 11,
    type: "promo",
    title: "Commerçantes : livraison 0 FCFA",
    subtitle: "Livraison gratuite depuis le marché pour vos clients",
    cta: "Activer",
    gradient: "from-[#F77F00] to-rose-500",
    badge: "Limité",
    image: shopperImg,
    label: "Livraison commerçantes",
    path: "/promo/11",
    description: "Mamans commerçantes, IPPOO pense à vous ! Livrez gratuitement vos marchandises du marché vers vos clients dans un rayon de 10 km. 5 livraisons offertes par semaine pour booster votre activité.",
    conditions: ["Profil commerçant(e) vérifié", "5 livraisons gratuites/semaine", "Rayon max : 10 km depuis le marché", "Colis < 15 kg"],
    validUntil: "31 mai 2026",
    profileTarget: "Commerçantes",
  },
  {
    id: 6,
    type: "partner",
    title: "Celtiis x IPPOO",
    subtitle: "1 Go data offert à la 1ère course",
    cta: "Profiter",
    gradient: "from-green-500 to-emerald-600",
    image: celtiisImg,
    label: "Celtiis - Illiminet Boosté",
    badge: "Nouveau",
    path: "/promo/6",
    description: "Celtiis offre 1 Go de data gratuit à tous les nouveaux utilisateurs IPPOO ! Effectuez votre première course et recevez un code data par SMS.",
    conditions: ["1ère course requise pour activer", "Data valable 7 jours", "Réseau Celtiis uniquement", "Limité aux 5 000 premiers"],
    validUntil: "30 avril 2026",
    profileTarget: null,
  },
  {
    id: 10,
    type: "promo",
    title: "Étudiants : -50% campus",
    subtitle: "Vos trajets université-domicile à moitié prix",
    cta: "S'inscrire",
    gradient: "from-[#1E6091] to-indigo-500",
    badge: "Nouveau",
    image: friendsShopImg,
    label: "Promo étudiants",
    path: "/promo/10",
    description: "Programme IPPOO Campus : tous les étudiants bénéficient de -50% sur les trajets domicile-université. Inscrivez-vous avec votre carte étudiante et profitez de tarifs réduits toute l'année scolaire.",
    conditions: ["Carte étudiante valide requise", "Trajets campus-domicile uniquement", "Lundi à vendredi, 6h-20h", "Max 2 courses/jour à tarif réduit"],
    validUntil: "30 juin 2026",
    profileTarget: "Étudiants",
  },
  {
    id: 20,
    type: "partner",
    title: "Moov Africa x IPPOO",
    subtitle: "Course offerte à chaque recharge Illimix",
    cta: "Profiter",
    gradient: "from-blue-600 to-indigo-700",
    image: moovAfricaImg,
    label: "Moov Africa Illimix",
    badge: "Nouveau",
    path: "/promo/20",
    description: "Moov Africa et IPPOO s'associent ! En 2026, vivez sans limite. Appels + Internet en illimités vers tous les réseaux. Tapez *174# et profitez d'une course offerte à chaque recharge Illimix.",
    conditions: ["Recharge Illimix requise", "Course offerte max : 1 500 FCFA", "1 course/recharge", "Offre valable jusqu'au 30 juin 2026"],
    validUntil: "30 juin 2026",
    profileTarget: null,
  },
  {
    id: 18,
    type: "promo",
    title: "Familles : pack week-end",
    subtitle: "Sorties en famille à tarif groupé dès 1 500 FCFA",
    cta: "Réserver",
    gradient: "from-pink-500 to-rose-500",
    badge: "Limité",
    image: africanFoodImg,
    label: "Pack famille",
    path: "/promo/18",
    description: "Le week-end c'est en famille ! Réservez une voiture spacieuse pour toute la famille à tarif groupé. Jusqu'à 5 passagers, idéal pour les sorties marché, plage ou visites.",
    conditions: ["Samedi et dimanche uniquement", "Véhicule 5 places garanti", "Tarif fixe par zone (pas au km)", "Enfants < 5 ans gratuit"],
    validUntil: "Permanent",
    profileTarget: "Familles",
  },
  {
    id: 22,
    type: "partner",
    title: "MTN Mobile Advertising",
    subtitle: "Boostez la visibilité de votre commerce",
    cta: "Découvrir",
    gradient: "from-yellow-500 to-orange-500",
    image: mtnBusinessImg,
    label: "MTN Mobile Advertising",
    badge: null,
    path: "/promo/22",
    description: "Communiquez efficacement avec MTN Mobile Advertising ! Boostez la visibilité de votre commerce en diffusant vos offres à des milliers de clients IPPOO dans votre zone.",
    conditions: ["Pack publicité dès 5 000 FCFA", "Ciblage par zone géographique", "Statistiques en temps réel", "Assistance dédiée MTN Business"],
    validUntil: "31 mai 2026",
    profileTarget: null,
  },
];

export { promoSlides };

const nearbyDrivers = [
  { name: "Hounkpatin A.", vehicle: "Moto", rating: 4.8, distance: "2 min", initials: "HA", gradient: "from-blue-500 to-blue-600" },
  { name: "Aїdatou D.", vehicle: "Voiture", rating: 4.9, distance: "5 min", initials: "AD", gradient: "from-emerald-400 to-emerald-500" },
  { name: "Gbètoho B.", vehicle: "Tricycle", rating: 4.7, distance: "3 min", initials: "GB", gradient: "from-cyan-400 to-cyan-500" },
];

export function HomePage() {
  const navigate = useNavigate();
  const { state } = useAppStore();
  const userName = state.user?.fullName ?? "Bienvenue";
  const firstName = userName.split(" ")[0];
  const walletBalance = state.wallet?.balanceXOF ?? 0;
  const unreadNotifs = state.notifications.filter((n) => !n.read).length;
  // Masque les services dont l'offre a été désactivée depuis le back office admin
  const config = usePlatformConfig();
  const visibleServices = services.filter(
    (s) => !s.offerId || config.offers.find((o) => o.id === s.offerId)?.active !== false,
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchDest, setSearchDest] = useState("");
  const slideRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiping = useRef(false);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % promoSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 15) {
      swiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveSlide((prev) => (prev + 1) % promoSlides.length);
      } else {
        setActiveSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
      }
    }
  };

  const currentSlide = promoSlides[activeSlide];
  const badgeConfig: Record<string, { bg: string; text: string }> = {
    Nouveau: { bg: "bg-[#2A9D8F]", text: "text-white" },
    Limité: { bg: "bg-[#D62828]", text: "text-white" },
  };

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;

  return (
    <div className="pb-4 bg-gray-50">
      {/* ═══════════════ REDESIGNED HEADER ═══════════════ */}
      <div className="relative overflow-hidden">
        {/* Background image + gradient overlay */}
        <img src={headerHeroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0047AB]/85 via-[#0047AB]/70 to-[#0047AB]/95" />

        <div className="relative z-10 px-5 pt-12 pb-6">
          {/* Brand bar — logo officiel sur pastille blanche, compact mobile */}
          <div className="flex items-center mb-4">
            <BrandLogo height={20} />
          </div>

          {/* Top bar — Avatar + Greeting + Notifications */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/app/profile")} className="relative">
                <ProfileAvatar initials="DA" size={52} className="rounded-2xl border-2 border-white/40 shadow-sm shadow-black/20" />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#2A9D8F] rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <GreetingIcon className="w-3.5 h-3.5 text-[#E9C46A]" strokeWidth={2} />
                  <p className="text-white/70 text-xs">{greeting}</p>
                </div>
                <p className="text-white">{firstName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Wallet quick view */}
              <button
                onClick={() => navigate("/app/wallet")}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 hover:bg-white/20 transition"
              >
                <Wallet className="w-4 h-4 text-[#E9C46A]" strokeWidth={1.8} />
                <div className="text-left">
                  <p className="text-[9px] text-white/50 leading-none">IPPOO Cash</p>
                  <p className="text-white text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{walletBalance.toLocaleString("fr-FR")} F</p>
                </div>
              </button>
              {/* Notifications */}
              <button
                onClick={() => navigate("/app/notifications")}
                className="relative w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition"
              >
                <Bell className="w-5 h-5 text-white" strokeWidth={1.8} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F77F00] rounded-full text-[10px] text-black flex items-center justify-center border-2 border-white/30">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar — glassmorphism */}
          <div className="relative mb-4">
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-4 shadow-sm shadow-black/10 border border-white/80">
              <div className="w-10 h-10 bg-[#F77F00] rounded-xl flex items-center justify-center shadow-md shadow-orange-400/30 flex-shrink-0">
                <Search className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 leading-none mb-0.5">Destination</p>
                <input
                  placeholder="Où allez-vous aujourd'hui ?"
                  className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && searchDest.trim()) navigate(`/book-ride?dest=${encodeURIComponent(searchDest.trim())}`); }}
                />
              </div>
              <button
                onClick={() => { if (searchDest.trim()) navigate(`/book-ride?dest=${encodeURIComponent(searchDest.trim())}`); }}
                className="w-10 h-10 bg-[#1E6091] rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0 active:scale-90 transition-transform"
              >
                <MapPin className="w-[18px] h-[18px] text-white" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Quick destinations — horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[
              { label: "Domicile", Icon: Home },
              { label: "Bureau", Icon: Briefcase },
              { label: "Marché", Icon: Store },
              { label: "Campus", Icon: GraduationCap },
            ].map((loc) => (
              <button
                key={loc.label}
                onClick={() => navigate(`/book-ride?dest=${encodeURIComponent(loc.label)}`)}
                className="flex-shrink-0 bg-white/15 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-white/20 hover:border-white/40 transition-all active:scale-95"
              >
                <loc.Icon className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{loc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ SERVICES GRID — Premium floating card ═══════════════ */}
      <div className="px-4 -mt-1 relative z-20">
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/80 p-4 pt-5 border border-gray-100">
          {/* Section header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#F77F00] rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="title-gradient">Services</h3>
            </div>
            <button onClick={() => navigate("/")} className="text-[#1E6091] text-xs flex items-center gap-0.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition">
              Voir tout <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          {/* 2 rows × 4 cols grid */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {visibleServices.map((s) => (
              <button
                key={s.label}
                onClick={() => navigate(s.path)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shadow-sm ${s.shadow} transition-all group-active:scale-90 group-hover:shadow-sm group-hover:-translate-y-0.5`}>
                    <s.Icon className="text-white" size={22} />
                  </div>
                  {/* Subtle glow behind icon */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${s.gradient} opacity-20 blur-lg -z-10 scale-110`} />
                </div>
                <span className="text-[11px] text-gray-600 text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promo banner slider */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#F77F00]" />
            <h3 className="title-gradient">Annonces</h3>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activeSlide + 1}/{promoSlides.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentSlide.profileTarget && (
              <span className="text-[10px] text-[#1E6091] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {currentSlide.profileTarget}
              </span>
            )}
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F77F00] rounded-full transition-all duration-300"
                style={{ width: `${((activeSlide + 1) / promoSlides.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div
          ref={slideRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (swiping.current) return;
            const slide = promoSlides[activeSlide];
            if (slide.path) navigate(slide.path);
          }}
          className="relative w-full h-40 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          {promoSlides[activeSlide].type === "partner" ? (
            <>
              <ImageWithFallback
                src={promoSlides[activeSlide].image}
                alt={promoSlides[activeSlide].label ?? ""}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full border border-white/15">
                  Sponsorisé
                </span>
              </div>
            </>
          ) : (
            <>
              <ImageWithFallback
                src={promoSlides[activeSlide].image}
                alt={promoSlides[activeSlide].title ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dégradé neutre bas uniquement (lisibilité) — pas de teinte de couleur sur l'image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <p className="text-white text-xs opacity-80 mb-0.5">{promoSlides[activeSlide].subtitle}</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-white drop-shadow-md">{promoSlides[activeSlide].title}</h3>
                  <span className="bg-white/25 backdrop-blur-sm text-white text-xs px-3.5 py-1.5 rounded-full border border-white/30">
                    {promoSlides[activeSlide].cta} <ChevronRight className="w-3 h-3 inline" />
                  </span>
                </div>
              </div>
            </>
          )}
          {currentSlide.badge && (
            <div className="absolute top-2.5 right-2.5">
              <span
                className={`${badgeConfig[currentSlide.badge].bg} ${badgeConfig[currentSlide.badge].text} text-[10px] px-2.5 py-1 rounded-full shadow-sm`}
              >
                {currentSlide.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Map preview */}
      <div className="px-5 mt-5 relative z-0">
        <LiveMap />
      </div>

      {/* Promos carousel */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4 px-5">
          <h3 className="title-gradient">Promotions</h3>
          <button onClick={() => navigate("/app/coupons")} className="flex items-center gap-1.5 text-blue-500 text-xs bg-blue-50 px-3 py-1.5 rounded-full">
            <Ticket className="w-3 h-3" /> Voir tout
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 px-5 scrollbar-hide snap-x snap-mandatory">
          {activeCouponsForHome.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} compact />
          ))}
        </div>
      </div>

      {/* ═══════════════ ESPACE MEMBRE — Quick access ═══════════════ */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="title-gradient">Espace Membre</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: CreditCard, label: "Abonnements", desc: "Carte & Forfaits", path: "/subscriptions", gradient: "from-[#F77F00] to-[#E9C46A]", bg: "bg-orange-50" },
            { icon: Car, label: "LOA Véhicules", desc: "Location-Achat", path: "/loa", gradient: "from-[#D62828] to-[#F77F00]", bg: "bg-red-50" },
            { icon: Star, label: "Évaluations", desc: "Score client", path: "/rating", gradient: "from-[#2A9D8F] to-[#1E6091]", bg: "bg-teal-50" },
            { icon: Route, label: "Mission", desc: "Multi-arrêts", path: "/mission", gradient: "from-[#1E6091] to-[#2A9D8F]", bg: "bg-blue-50" },
            { icon: Gift, label: "Parrainage", desc: "Inviter & gagner", path: "/referral", gradient: "from-[#E9C46A] to-[#F77F00]", bg: "bg-amber-50" },
            { icon: Users, label: "Ma note", desc: "4.3/5", path: "/rating", gradient: "from-[#8B5CF6] to-[#A78BFA]", bg: "bg-violet-50" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-gray-50 active:scale-[0.97] transition text-left"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md shrink-0`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-800 text-xs">{item.label}</p>
                <p className="text-gray-400 text-[10px]">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby drivers */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-gradient">Chauffeurs proches</h3>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] text-emerald-600 border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> EN LIGNE
          </div>
        </div>
        <div className="space-y-2.5">
          {nearbyDrivers.map((d, i) => (
            <button
              key={i}
              onClick={() => navigate("/app/book-ride")}
              className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm shadow-blue-100/40 hover:shadow-md hover:shadow-blue-100/60 transition-all active:scale-[0.99] border border-blue-50"
            >
              <ProfileAvatar initials={d.initials} size={44} className="rounded-2xl shadow-sm shadow-blue-500/20" gradient={d.gradient} />
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-800">{d.name}</p>
                <p className="text-xs text-gray-400">{d.vehicle} · a {d.distance}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-amber-600">{d.rating}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}