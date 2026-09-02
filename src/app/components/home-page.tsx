import { useNavigate } from "react-router";
import { Search, MapPin, Bell, ChevronRight, Star, Ticket, Home, Briefcase, Store, GraduationCap, Megaphone, Wallet, Sun, Moon, CloudSun, Zap, CreditCard, Car, Users, Gift, Package, ShoppingBag, Truck, Plane, Clock, LifeBuoy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProfileAvatar } from "./profile-avatar";
import { BrandLogo } from "./brand-logo";
import { usePlatformConfig } from "../store/platform-config";
import { useAppStore } from "../store/app-store";
import { useUnread } from "../store/unread";
import { activeCouponsForHome } from "./coupons-data";
import { CouponTicket } from "./coupon-ticket";
import { LiveMap } from "./live-map";
import { api } from "../api/client";
import { Car as CarIcon } from "lucide-react";
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

/* Services — icônes lucide épurées, une couleur vive par service (cohérente
   avec les schémas M3 de chaque page). Aucune icône 3D, aucun emoji. */
const services = [
  { Icon: Car, label: "Course", path: "/book-ride", offerId: "taxi", color: "#2563eb" },
  { Icon: Package, label: "Livraison", path: "/delivery", offerId: "delivery", color: "#f77f00" },
  { Icon: ShoppingBag, label: "Groupée", path: "/group-orders", offerId: "group", color: "#8b5cf6" },
  { Icon: Users, label: "Covoiturage", path: "/carpool", offerId: "carpool", color: "#06b6d4" },
  { Icon: Truck, label: "Gros colis", path: "/heavy-transport", offerId: "heavy", color: "#e11d64" },
  { Icon: Plane, label: "IPPOO AIR", path: "/air-freight", offerId: "air", color: "#0284f0" },
  { Icon: Wallet, label: "IPPOO Cash", path: "/wallet", color: "#059669" },
  { Icon: Clock, label: "Historique", path: "/history", color: "#0f766e" },
  { Icon: LifeBuoy, label: "Support", path: "/support", color: "#0d9488" },
];

/* Courbe expressive partagée + petit wrapper d'apparition au scroll. */
const EASE = [0.22, 1, 0.36, 1] as const;
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

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

const VEHICLE_LABEL: Record<string, string> = { moto: "Moto", car: "Voiture", truck: "Camion" };
const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-emerald-400 to-emerald-500",
  "from-cyan-400 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-amber-400 to-orange-500",
];

interface HomeDriver {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  eta: string;
  initials: string;
  gradient: string;
}

export function HomePage() {
  const navigate = useNavigate();
  // Toutes les routes clientes vivent sous /app : on préfixe les chemins relatifs.
  const go = (p: string) => navigate(p === "/" || p.startsWith("/app") ? p : `/app${p}`);
  const { state } = useAppStore();
  const userName = state.user?.fullName ?? "Bienvenue";
  const firstName = userName.split(" ")[0];
  const initials = (state.user?.fullName ?? "")
    .split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  const walletBalance = state.wallet?.balanceXOF ?? 0;
  const unreadNotifs = useUnread();
  // Masque les services dont l'offre a été désactivée depuis le back office admin
  const config = usePlatformConfig();
  const visibleServices = services.filter(
    (s) => !s.offerId || config.offers.find((o) => o.id === s.offerId)?.active !== false,
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchDest, setSearchDest] = useState("");
  const [nearbyDrivers, setNearbyDrivers] = useState<HomeDriver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const slideRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiping = useRef(false);

  // Chauffeurs réellement en ligne autour de la position de l'utilisateur
  useEffect(() => {
    let cancelled = false;
    const load = async (lat: number, lng: number) => {
      try {
        const res = await api.get<any[]>(`/drivers/nearby?lat=${lat}&lng=${lng}`);
        if (cancelled) return;
        setNearbyDrivers((res ?? []).slice(0, 5).map((d, i) => {
          const name = d.fullName ?? d.name ?? "Chauffeur";
          return {
            id: String(d.id ?? i),
            name,
            vehicle: VEHICLE_LABEL[d.vehicleType] ?? "Véhicule",
            rating: Number(d.rating ?? 0),
            eta: d.etaMin != null ? `${d.etaMin} min` : "",
            initials: name.split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? "").join("") || "?",
            gradient: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
          };
        }));
      } catch {
        if (!cancelled) setNearbyDrivers([]);
      } finally {
        if (!cancelled) setDriversLoading(false);
      }
    };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => load(p.coords.latitude, p.coords.longitude),
        () => load(6.3654, 2.4183),
        { timeout: 6000, maximumAge: 30000 },
      );
    } else {
      load(6.3654, 2.4183);
    }
    return () => { cancelled = true; };
  }, []);

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

  const quickDests = [
    { label: "Domicile", Icon: Home },
    { label: "Bureau", Icon: Briefcase },
    { label: "Marché", Icon: Store },
    { label: "Campus", Icon: GraduationCap },
  ];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f5f6fb] pb-6">
      {/* --------------- EN-TÊTE — hero immersif, arrondi M3 --------------- */}
      <div className="relative overflow-hidden rounded-b-[32px]">
        <img src={headerHeroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a2fd6]/85 via-[#3746d6]/78 to-[#1e2a8f]/96" />
        {/* Halos décoratifs subtils */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 top-16 h-32 w-32 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10 px-5 pt-12 pb-7">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-5 flex items-center"
          >
            <BrandLogo height={20} />
          </motion.div>

          {/* Salutation + wallet + notifs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
            className="mb-5 flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => navigate("/app/profile")} className="relative shrink-0 active:scale-95 transition">
                <ProfileAvatar initials={initials} photoUrl={state.user?.avatarUrl} size={52} className="rounded-2xl border-2 border-white/40 shadow-sm shadow-black/20" />
                <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <GreetingIcon className="h-3.5 w-3.5 text-amber-300" strokeWidth={2} />
                  <p className="text-xs text-white/70">{greeting}</p>
                </div>
                <p className="truncate text-[17px] font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{firstName}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/app/notifications")}
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md transition active:scale-90"
            >
              <Bell className="h-5 w-5 text-white" strokeWidth={1.8} />
              {unreadNotifs > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#2c3bd0] bg-amber-400 text-[10px] font-bold text-black">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>
              )}
            </button>
          </motion.div>

          {/* Carte solde — bloc moderne pleine largeur */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/app/wallet")}
            className="mb-4 flex w-full items-center justify-between rounded-3xl border border-white/20 bg-white/15 px-4 py-3.5 text-left backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
                <Wallet className="h-5 w-5 text-amber-300" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-white/55">Solde IPPOO Cash</p>
                <p className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>
                  {walletBalance.toLocaleString("fr-FR")} <span className="text-sm font-medium text-white/70">FCFA</span>
                </p>
              </div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
              <ChevronRight className="h-4 w-4 text-white" />
            </span>
          </motion.button>

          {/* Barre de recherche */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3 py-3 shadow-lg shadow-black/10 backdrop-blur-xl">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F77F00] shadow-md shadow-orange-400/30">
                <Search className="h-5 w-5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] leading-none text-gray-400">Destination</p>
                <input
                  placeholder="Où allez-vous aujourd'hui ?"
                  className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && searchDest.trim()) go(`/book-ride?dest=${encodeURIComponent(searchDest.trim())}`); }}
                />
              </div>
              <button
                onClick={() => { if (searchDest.trim()) go(`/book-ride?dest=${encodeURIComponent(searchDest.trim())}`); }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1E6091] shadow-md shadow-blue-500/30 transition active:scale-90"
              >
                <MapPin className="h-[18px] w-[18px] text-white" strokeWidth={2} />
              </button>
            </div>
          </motion.div>

          {/* Destinations rapides */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {quickDests.map((loc, i) => (
              <motion.button
                key={loc.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24 + i * 0.05, ease: EASE }}
                onClick={() => go(`/book-ride?dest=${encodeURIComponent(loc.label)}`)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-xs text-white backdrop-blur-md transition active:scale-95"
              >
                <loc.Icon className="h-3.5 w-3.5" strokeWidth={2} />
                <span>{loc.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* --------------- GRILLE SERVICES — carte flottante --------------- */}
      <div className="relative z-20 -mt-5 px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          className="rounded-[28px] border border-black/[0.05] bg-white p-4 pt-5 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.25)]"
        >
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F77F00]">
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
              <h3 className="title-gradient">Services</h3>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {visibleServices.map((s, i) => (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.16 + i * 0.045, ease: EASE }}
                whileTap={{ scale: 0.9 }}
                onClick={() => go(s.path)}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-[20px] transition"
                  style={{ background: `${s.color}16`, color: s.color }}
                >
                  <s.Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="text-center text-[11px] font-medium leading-tight text-slate-600">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Annonces — slider avec transition fondue */}
      <Reveal className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[#F77F00]" />
            <h3 className="title-gradient">Annonces</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">{activeSlide + 1}/{promoSlides.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentSlide.profileTarget && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-[#1E6091]">
                {currentSlide.profileTarget}
              </span>
            )}
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-[#F77F00]"
                animate={{ width: `${((activeSlide + 1) / promoSlides.length) * 100}%` }}
                transition={{ duration: 0.3 }}
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
            if (slide.path) go(slide.path);
          }}
          className="relative h-40 w-full cursor-pointer overflow-hidden rounded-3xl shadow-sm transition-transform active:scale-[0.98]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-0"
            >
              <ImageWithFallback
                src={currentSlide.image}
                alt={currentSlide.title ?? currentSlide.label ?? ""}
                className="h-full w-full object-cover"
              />
              {currentSlide.type === "partner" ? (
                <div className="absolute left-2.5 top-2.5">
                  <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">Sponsorisé</span>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <p className="mb-0.5 text-xs text-white/80">{currentSlide.subtitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-white drop-shadow-md">{currentSlide.title}</h3>
                      <span className="shrink-0 rounded-full border border-white/30 bg-white/25 px-3.5 py-1.5 text-xs text-white backdrop-blur-sm">
                        {currentSlide.cta} <ChevronRight className="inline h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          {currentSlide.badge && (
            <div className="absolute right-2.5 top-2.5 z-10">
              <span className={`${badgeConfig[currentSlide.badge].bg} ${badgeConfig[currentSlide.badge].text} rounded-full px-2.5 py-1 text-[10px] shadow-sm`}>
                {currentSlide.badge}
              </span>
            </div>
          )}
        </div>
      </Reveal>

      {/* Carte live */}
      <Reveal className="relative z-0 mt-6 px-5">
        <LiveMap />
      </Reveal>

      {/* Promotions */}
      <Reveal className="mt-7">
        <div className="mb-4 flex items-center justify-between px-5">
          <h3 className="title-gradient">Promotions</h3>
          <button onClick={() => navigate("/app/coupons")} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-500">
            <Ticket className="h-3 w-3" /> Voir tout
          </button>
        </div>
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {activeCouponsForHome.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} compact />
          ))}
        </div>
      </Reveal>

      {/* Espace Membre */}
      <Reveal className="mt-7 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="title-gradient">Espace Membre</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: CreditCard, label: "Abonnements", desc: "Carte & Forfaits", path: "/subscriptions", color: "#ea580c" },
            { icon: Car, label: "LOA Véhicules", desc: "Location-Achat", path: "/loa", color: "#dc2626" },
            { icon: Gift, label: "Parrainage", desc: "Inviter & gagner", path: "/referral", color: "#ca8a04" },
            { icon: Users, label: "Covoiturage", desc: "Trajets partagés", path: "/carpool", color: "#06b6d4" },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
              whileTap={{ scale: 0.97 }}
              onClick={() => go(item.path)}
              className="flex items-center gap-3 rounded-3xl border border-black/[0.05] bg-white p-3.5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${item.color}16`, color: item.color }}>
                <item.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800">{item.label}</p>
                <p className="truncate text-[10px] text-slate-400">{item.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </Reveal>

      {/* Chauffeurs proches */}
      <Reveal className="mt-7 px-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="title-gradient">Chauffeurs proches</h3>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> EN LIGNE
          </div>
        </div>
        {driversLoading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex w-full animate-pulse items-center gap-3.5 rounded-3xl border border-blue-50 bg-white p-3.5">
                <div className="h-11 w-11 rounded-2xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded-full bg-gray-100" />
                  <div className="h-2.5 w-20 rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : nearbyDrivers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-gray-100 bg-white p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
              <CarIcon className="h-6 w-6 text-gray-300" strokeWidth={1.6} />
            </span>
            <p className="text-sm text-gray-500">Aucun chauffeur en ligne pour le moment</p>
            <p className="text-[11px] text-gray-400">Réessayez dans quelques instants</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {nearbyDrivers.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/app/book-ride?driver=${d.id}`)}
                className="flex w-full items-center gap-3.5 rounded-3xl border border-blue-50 bg-white p-3.5 text-left shadow-sm shadow-blue-100/40 transition"
              >
                <ProfileAvatar initials={d.initials} size={44} className="rounded-2xl shadow-sm shadow-blue-500/20" gradient={d.gradient} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-800">{d.name}</p>
                  <p className="truncate text-xs text-gray-400">{d.vehicle}{d.eta ? ` · à ${d.eta}` : ""}</p>
                </div>
                {d.rating > 0 && (
                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-amber-600">{d.rating}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}