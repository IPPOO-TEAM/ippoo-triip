import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Bike, Package, Truck, Users, Plane, MapPin, Shield, Clock,
  ChevronRight, Star, Phone, Mail, ArrowRight, Menu, X,
  Zap, Eye, Download, Globe, Heart, BadgeCheck, Award,
  Smartphone, CreditCard, Headphones, Lock, CheckCircle2
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getAvatar } from "./avatars";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique_1-1.png";
import logoNewImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Local Images ─── */
import imgCovoiturage from "../../imports/Covoiturage-Côte-d-Ivoire-770x460.jpg";
import imgLivreur from "../../imports/sourire-male-africain-courrier-livreur-messager-devant-voiture-livraison-colis_73622-995-1280x720-1.jpg";
import imgCamion from "../../imports/camion-decharge-fourgon-transporte-boites-demenage-maison_265022-109728.jpg";
import imgFamille from "../../imports/55165803-famille-approuvant-nouveau-auto-content-africain-americain-pere-et-fille-faire-des-gestes-les-pouces-en-haut-seance-dans-voiture-souriant-a-camera-route-voyage-transport-nous-comme-notre-auto-selectif-conc.jpg";
import imgWarehouse from "../../imports/68b80553772293aeca0e6de9_01,1.jpg";
import imgLivreurPro from "../../imports/livreur-professionnel-qui-transporte-colis-verifie-adresse_308072-7052.jpg";
import imgHandoff from "../../imports/images_-_2026-04-10T164424.655.jpeg";
import imgDelivery from "../../imports/images_-_2026-04-10T164336.787.jpeg";
import imgArticle from "../../imports/article3-1.jpg";

/* ─── Images ─── */
const IMG_HERO = "https://images.unsplash.com/photo-1765475467677-579353b25ce0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0JTIwYWZyaWNhJTIwYWVyaWFsJTIwY2l0eSUyMHZpZXd8ZW58MXx8fHwxNzc1OTI2OTkxfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_MOTO = "https://images.unsplash.com/photo-1766087124181-0677409b73eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2l0eSUyMG1vdG9yY3ljbGUlMjB0YXhpJTIwdHJhbnNwb3J0fGVufDF8fHx8MTc3NTkyNjk4OXww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_DELIVERY = "https://images.unsplash.com/photo-1579240593479-de65b968a01a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGNvdXJpZXIlMjBwYWNrYWdlJTIwYWZyaWNhbiUyMHN0cmVldHxlbnwxfHx8fDE3NzU5MjY5OTB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_APP = "https://images.unsplash.com/photo-1553448056-b6146f67f31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBzbWFydHBob25lJTIwbW9iaWxlJTIwYXBwfGVufDF8fHx8MTc3NTkyNjk5MHww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_CARPOOL = "https://images.unsplash.com/photo-1708347456816-f4d28505c855?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwb29sJTIwcGFzc2VuZ2VycyUyMGhhcHB5JTIwYWZyaWNhbnxlbnwxfHx8fDE3NzU5MjY5OTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TRUCK = "https://images.unsplash.com/photo-1738507869660-b44ea20ab037?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVjayUyMGxvZ2lzdGljcyUyMGNhcmdvJTIwYWZyaWNhbiUyMHJvYWR8ZW58MXx8fHwxNzc1OTI2OTkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Data ─── */
const services = [
  {
    icon: Bike, title: "Taxi-Moto", description: "Déplacez-vous rapidement à travers la ville sur nos motos sécurisées. Chauffeurs vérifiés, casques fournis, tarifs transparents.",
    color: "#F77F00", bg: "bg-orange-50", img: imgCovoiturage, stats: "2 min de temps d'attente moyen"
  },
  {
    icon: Package, title: "Livraison de colis", description: "Envoyez vos colis, documents et paquets partout en ville. Suivi en temps réel, photo de preuve à la livraison, confirmation OTP.",
    color: "#2A9D8F", bg: "bg-emerald-50", img: imgLivreur, stats: "30 min de livraison moyenne"
  },
  {
    icon: Truck, title: "Transport de biens lourds", description: "Déménagements, meubles, équipements. Camionnettes, pickups et camions avec manutentionnaires qualifiés.",
    color: "#D62828", bg: "bg-red-50", img: imgCamion, stats: "Jusqu'à 5 tonnes"
  },
  {
    icon: Users, title: "Commandes groupées", description: "Regroupez vos commandes entre voisins, collègues ou amis. Partagez les frais de livraison et économisez ensemble.",
    color: "#8B5CF6", bg: "bg-violet-50", img: imgHandoff, stats: "Jusqu'à 60% d'économie"
  },
  {
    icon: Globe, title: "Covoiturage", description: "Partagez vos trajets longue distance entre Cotonou, Porto-Novo, Parakou et au-delà. Confortable, économique, écologique.",
    color: "#06B6D4", bg: "bg-cyan-50", img: imgFamille, stats: "12 villes desservies"
  },
  {
    icon: Plane, title: "IPPOO AIR", description: "Transport aérien complet : passagers, colis & documents, fret cargo. Du domicile à l'aéroport et retour, avec suivi intégral.",
    color: "#1E6091", bg: "bg-blue-50", img: imgWarehouse, stats: "8 aéroports connectés"
  },
];

const stats = [
  { value: "150K+", label: "Utilisateurs actifs", icon: Users },
  { value: "2M+", label: "Courses effectuées", icon: Bike },
  { value: "95%", label: "Taux de satisfaction", icon: Heart },
  { value: "45+", label: "Villes couvertes", icon: MapPin },
];

const features = [
  { icon: Smartphone, title: "Application intuitive", desc: "Interface simple et moderne, conçue pour tous les utilisateurs d'Afrique de l'Ouest" },
  { icon: Shield, title: "Sécurité maximale", desc: "Chauffeurs vérifiés, géolocalisation en temps réel, bouton SOS, partage de trajet" },
  { icon: CreditCard, title: "Paiement flexible", desc: "IPPOO Cash, Mobile Money (MTN, Moov), paiement à l'arrivée" },
  { icon: Clock, title: "Disponible 24h/24", desc: "Service continu jour et nuit, 7 jours sur 7, partout au Bénin et bientôt au-delà" },
  { icon: Headphones, title: "Support réactif", desc: "Chat en direct avec nos agents, assistance vocale, FAQ complète intégrée" },
  { icon: Lock, title: "Données protégées", desc: "Chiffrement de bout en bout, biométrie WebAuthn, aucune donnée partagée à des tiers" },
];

const testimonials = [
  {
    name: "Fifamè Dossou-Yovo", initials: "FD", role: "Commerçante, Marché Dantokpa",
    text: "Depuis que j'utilise IPPOO, mes livraisons arrivent toujours à l'heure. Mes clients sont satisfaits et mon chiffre d'affaires a augmenté de 30%. Le suivi en temps réel me rassure vraiment.",
    rating: 5,
  },
  {
    name: "Koffi Adjibadé", initials: "GB", role: "Chauffeur partenaire IPPOO",
    text: "IPPOO m'a donné une vraie opportunité. Je gère mon temps, je choisis mes courses, et le paiement est toujours rapide. L'application est facile même pour ceux qui ne sont pas très tech.",
    rating: 5,
  },
  {
    name: "Aïdatou Bello", initials: "AB", role: "Étudiante, Université d'Abomey-Calavi",
    text: "Le covoiturage IPPOO entre Calavi et Cotonou me fait économiser énormément. Les chauffeurs sont ponctuels et le trajet est agréable. Je recommande à tous mes camarades !",
    rating: 5,
  },
  {
    name: "Sessinou Akotègnon", initials: "SA", role: "Entrepreneur, Import-Export",
    text: "Pour mon activité de fret, IPPOO AIR est devenu indispensable. Le suivi du cargo, les agents à l'aéroport, tout est professionnel. C'est du sérieux.",
    rating: 5,
  },
];

const howItWorks = [
  { step: 1, title: "Téléchargez l'application", desc: "Disponible sur Android et iOS. Inscription rapide avec votre numéro de téléphone." },
  { step: 2, title: "Choisissez votre service", desc: "Taxi-moto, livraison, transport lourd, covoiturage ou fret aérien selon votre besoin." },
  { step: 3, title: "Confirmez et suivez", desc: "Validez votre commande, suivez en temps réel et payez facilement à l'arrivée." },
];

const partners = [
  "MTN Bénin", "Moov Africa", "SOBEBRA", "Glo Mobile", "Ecobank", "UBA",
];

/* ─── Component ─── */
export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(e.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);
  const headerOpaque = scrollY > 60;

  return (
    <div ref={scrollRef} className="min-h-screen bg-white overflow-y-auto" style={{ height: "100vh" }}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerOpaque ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16">
          <img src={logoNewImg} alt="IPPOO" className="h-8 md:h-9 object-contain" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Services", "Fonctionnalités", "Témoignages", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm transition ${headerOpaque ? "text-slate-600 hover:text-[#1E6091]" : "text-white/90 hover:text-white"}`}>
                {item}
              </a>
            ))}
            <button
              onClick={() => navigate("/login")}
              className="bg-[#F77F00] text-white px-5 py-2 rounded-xl text-sm shadow-lg shadow-orange-400/25 hover:shadow-orange-400/40 transition"
            >
              Commencer
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center">
            {mobileMenuOpen
              ? <X className={`w-6 h-6 ${headerOpaque ? "text-slate-700" : "text-white"}`} />
              : <Menu className={`w-6 h-6 ${headerOpaque ? "text-slate-700" : "text-white"}`} />
            }
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-5 py-4 space-y-3">
              {["Services", "Fonctionnalités", "Témoignages", "Contact"].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-600 py-2">
                  {item}
                </a>
              ))}
              <button onClick={() => navigate("/login")} className="w-full bg-[#F77F00] text-white py-3 rounded-xl text-sm">
                Commencer maintenant
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center overflow-hidden">
        <ImageWithFallback
          src={IMG_HERO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          style={{ transform: `scale(${1 + scrollY * 0.0003})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E6091]/80 via-[#1E6091]/60 to-[#2A9D8F]/70" />
        <div className="absolute -right-20 top-20 w-80 h-80 bg-[#F77F00]/15 rounded-full blur-[100px]" />
        <div className="absolute -left-20 bottom-20 w-60 h-60 bg-[#E9C46A]/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 py-32 md:py-0 w-full">
          <div className="max-w-2xl">
            

            <h1 className="text-white text-3xl md:text-5xl lg:text-6xl mb-5 drop-shadow-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.1 }}>
              Votre mobilité,{" "}
              <span className="text-[#E9C46A]">simplifiée</span>{" "}
              et sécurisée
            </h1>

            <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg" style={{ lineHeight: 1.7 }}>
              Taxi-moto, livraison de colis, transport lourd, covoiturage et fret aérien.
              Une seule application pour tous vos besoins de transport au Bénin et en Afrique de l'Ouest.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="bg-[#F77F00] text-white px-8 py-4 rounded-2xl text-sm shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition flex items-center justify-center gap-2"
              >
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#services"
                className="bg-white/15 backdrop-blur-sm text-white px-8 py-4 rounded-2xl text-sm border border-white/20 hover:bg-white/25 transition flex items-center justify-center gap-2"
              >
                Découvrir nos services <Eye className="w-4 h-4" />
              </a>
            </div>

            {/* Mini stats */}
            <div className="mt-12 flex flex-wrap gap-6 md:gap-10">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-white text-xl md:text-2xl" style={{ fontFamily: "'Space Grotesk', monospace" }}>{s.value}</p>
                  <p className="text-white/50 text-[10px] md:text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════ */}
      <section id="services" data-animate className="py-16 md:py-24 bg-white">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12 md:mb-16">
            
            <h2 className="text-2xl md:text-4xl text-slate-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Tout le transport en <span className="text-[#F77F00]">une seule app</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
              6 services complets pour répondre à tous vos besoins de mobilité et de logistique, du quotidien au professionnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className={`group relative bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <ImageWithFallback src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: s.color }}>
                      <s.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-white text-sm drop-shadow">{s.title}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-slate-500 text-xs mb-4" style={{ lineHeight: 1.7 }}>{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: `${s.color}15`, color: s.color }}>{s.stats}</span>
                    <button onClick={() => navigate("/login")} className="text-xs flex items-center gap-1 transition" style={{ color: s.color }}>
                      En savoir plus <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="comment" data-animate className="py-16 md:py-24 bg-slate-50">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("comment") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12 md:mb-16">
            
            <h2 className="text-2xl md:text-4xl text-slate-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              3 étapes, c'est <span className="text-[#2A9D8F]">tout</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-4xl mx-auto">
            {howItWorks.map((h, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-700 ${isVisible("comment") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-400/25">
                  <span className="text-white text-xl" style={{ fontFamily: "'Space Grotesk', monospace" }}>{h.step}</span>
                </div>
                <h3 className="text-slate-800 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h.title}</h3>
                <p className="text-slate-500 text-xs" style={{ lineHeight: 1.7 }}>{h.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* App mockup + CTA */}
          <div className="mt-16 bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-white text-xl md:text-2xl mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Prêt à transformer vos déplacements ?
                </h3>
                <p className="text-white/70 text-sm mb-8" style={{ lineHeight: 1.7 }}>
                  Rejoignez plus de 150 000 utilisateurs qui font confiance à IPPOO chaque jour pour se déplacer, livrer et transporter en toute sécurité.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => navigate("/login")} className="bg-[#F77F00] text-white px-6 py-3.5 rounded-xl text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Télécharger l'app
                  </button>
                  <button onClick={() => navigate("/login")} className="bg-white/15 text-white px-6 py-3.5 rounded-xl text-sm border border-white/20 flex items-center justify-center gap-2">
                    Ouvrir dans le navigateur
                  </button>
                </div>
              </div>
              <div className="relative h-64 md:h-auto overflow-hidden">
                <ImageWithFallback src={imgLivreurPro} alt="IPPOO App" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E6091]/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="fonctionnalités" data-animate className="py-16 md:py-24 bg-white">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("fonctionnalités") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12 md:mb-16">
            
            <h2 className="text-2xl md:text-4xl text-slate-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Conçu pour <span className="text-[#F77F00]">vous</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
              Une application pensée pour les réalités locales, avec des fonctionnalités adaptées à vos besoins quotidiens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`bg-slate-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:border-slate-100 border border-transparent transition-all duration-500 ${isVisible("fonctionnalités") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] rounded-xl flex items-center justify-center mb-4 shadow-md shadow-blue-400/15">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-slate-800 text-sm mb-2">{f.title}</h3>
                <p className="text-slate-500 text-xs" style={{ lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="témoignages" data-animate className="py-16 md:py-24 bg-slate-50">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("témoignages") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#E9C46A]/20 rounded-full px-4 py-2 mb-4">
              <Star className="w-4 h-4 text-[#E9C46A] fill-[#E9C46A]" />
              <span className="text-amber-700 text-xs">Témoignages</span>
            </div>
            <h2 className="text-2xl md:text-4xl text-slate-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ils nous font <span className="text-[#E9C46A]">confiance</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-500 ${isVisible("témoignages") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={getAvatar(t.initials) || ""} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-slate-800 text-sm">{t.name}</p>
                    <p className="text-slate-400 text-[10px]">{t.role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-[#E9C46A] fill-[#E9C46A]" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-500 text-xs" style={{ lineHeight: 1.8 }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PARTNERS ═══════════ */}
      <section data-animate id="partenaires" className="py-12 md:py-16 bg-white border-t border-slate-100">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("partenaires") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-center text-slate-400 text-xs mb-8">Nos partenaires de confiance</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {partners.map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-xl">
                <BadgeCheck className="w-4 h-4 text-[#2A9D8F]" />
                <span className="text-slate-500 text-xs">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section data-animate id="cta" className="py-16 md:py-24 bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#F77F00]/15 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-[#E9C46A]/15 rounded-full blur-[80px]" />
        <div className={`relative z-10 max-w-3xl mx-auto px-5 md:px-8 text-center transition-all duration-700 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <img src={logoNewImg} alt="IPPOO" className="h-12 md:h-14 object-contain mx-auto mb-6 drop-shadow-xl" />
          <h2 className="text-white text-2xl md:text-4xl mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Commencez dès maintenant
          </h2>
          <p className="text-white/70 text-sm mb-8 max-w-md mx-auto" style={{ lineHeight: 1.7 }}>
            Inscrivez-vous gratuitement et profitez de votre première course offerte. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/login")} className="bg-[#F77F00] text-white px-8 py-4 rounded-2xl text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/login")} className="bg-white/15 text-white px-8 py-4 rounded-2xl text-sm border border-white/20 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Télécharger l'app
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield, text: "Données sécurisées" },
              { icon: CheckCircle2, text: "Chauffeurs vérifiés" },
              { icon: Headphones, text: "Support 24/7" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <b.icon className="w-4 h-4 text-white/50" />
                <span className="text-white/50 text-xs">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="contact" className="bg-slate-900 text-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <img src={logoImg} alt="IPPOO" className="h-10 object-contain mb-4 brightness-0 invert" />
              <p className="text-slate-400 text-xs mb-4" style={{ lineHeight: 1.7 }}>
                La plateforme de transport et logistique de référence en Afrique de l'Ouest. Du taxi-moto au fret aérien.
              </p>
              <div className="flex gap-3">
                {["Facebook", "Twitter", "Instagram"].map((s, i) => (
                  <button key={i} className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F77F00] hover:text-white transition">
                    <Globe className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Services</h4>
              <div className="space-y-2.5">
                {["Taxi-Moto", "Livraison de colis", "Transport lourd", "Commandes groupées", "Covoiturage", "IPPOO AIR"].map((s, i) => (
                  <p key={i} className="text-slate-500 text-xs hover:text-white cursor-pointer transition">{s}</p>
                ))}
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Entreprise</h4>
              <div className="space-y-2.5">
                {["À propos", "Carrières", "Partenaires", "Presse", "Blog", "CGU & Confidentialité"].map((s, i) => (
                  <p key={i} className="text-slate-500 text-xs hover:text-white cursor-pointer transition">{s}</p>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#F77F00] shrink-0" />
                  <span className="text-slate-400 text-xs">Carrefour Cadjehoun, Cotonou, Bénin</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#2A9D8F] shrink-0" />
                  <span className="text-slate-400 text-xs">+229 97 00 00 00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#1E6091] shrink-0" />
                  <span className="text-slate-400 text-xs">contact@ippoo.app</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-[10px]">&copy; 2026 IPPOO TRIIP. Tous droits réservés.</p>
            <div className="flex gap-4">
              {["Politique de confidentialité", "Conditions d'utilisation", "Mentions légales"].map((l, i) => (
                <span key={i} className="text-slate-500 text-[10px] hover:text-white cursor-pointer transition">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}