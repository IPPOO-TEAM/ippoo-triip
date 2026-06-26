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
import { BrandLogo } from "./brand-logo";
import { ServicesCatalog } from "./services-catalog";
import { usePlatformConfig } from "../store/platform-config";

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

/* ─── Logos partenaires (sourcés depuis Wikimedia Commons) ─── */
import logoMtn from "../../imports/partner-mtn.png";
import logoMoov from "../../imports/partner-moov.png";
import logoSobebra from "../../imports/partner-sobebra.png";
import logoGlo from "../../imports/partner-glo.png";
import logoEcobank from "../../imports/partner-ecobank.png";
import logoUba from "../../imports/partner-uba.png";

/* ─── Images ─── */
const IMG_HERO = "https://images.unsplash.com/photo-1765475467677-579353b25ce0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0JTIwYWZyaWNhJTIwYWVyaWFsJTIwY2l0eSUyMHZpZXd8ZW58MXx8fHwxNzc1OTI2OTkxfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_MOTO = "https://images.unsplash.com/photo-1766087124181-0677409b73eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2l0eSUyMG1vdG9yY3ljbGUlMjB0YXhpJTIwdHJhbnNwb3J0fGVufDF8fHx8MTc3NTkyNjk4OXww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_DELIVERY = "https://images.unsplash.com/photo-1579240593479-de65b968a01a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGNvdXJpZXIlMjBwYWNrYWdlJTIwYWZyaWNhbiUyMHN0cmVldHxlbnwxfHx8fDE3NzU5MjY5OTB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_APP = "https://images.unsplash.com/photo-1553448056-b6146f67f31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBzbWFydHBob25lJTIwbW9iaWxlJTIwYXBwfGVufDF8fHx8MTc3NTkyNjk5MHww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_CARPOOL = "https://images.unsplash.com/photo-1708347456816-f4d28505c855?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJwb29sJTIwcGFzc2VuZ2VycyUyMGhhcHB5JTIwYWZyaWNhbnxlbnwxfHx8fDE3NzU5MjY5OTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TRUCK = "https://images.unsplash.com/photo-1738507869660-b44ea20ab037?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVjayUyMGxvZ2lzdGljcyUyMGNhcmdvJTIwYWZyaWNhbiUyMHJvYWR8ZW58MXx8fHwxNzc1OTI2OTkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Data ─── */
const stats = [
  { value: "150K+", label: "Utilisateurs actifs", icon: Users },
  { value: "2M+", label: "Courses effectuées", icon: Bike },
  { value: "95%", label: "Taux de satisfaction", icon: Heart },
  { value: "45+", label: "Villes couvertes", icon: MapPin },
];

const features = [
  { icon: Smartphone, title: "Application intuitive", desc: "Interface simple et moderne, conçue pour tous les utilisateurs à travers l'Afrique" },
  { icon: Shield, title: "Sécurité maximale", desc: "Chauffeurs vérifiés, géolocalisation en temps réel, bouton SOS, partage de trajet" },
  { icon: CreditCard, title: "Paiement flexible", desc: "IPPOO Cash, Mobile Money (MTN, Moov), paiement à l'arrivée" },
  { icon: Clock, title: "Disponible 24h/24", desc: "Service continu jour et nuit, 7 jours sur 7, dans les villes d'Afrique" },
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
  { name: "MTN", logo: logoMtn },
  { name: "Moov Africa", logo: logoMoov },
  { name: "SOBEBRA", logo: logoSobebra },
  { name: "Glo", logo: logoGlo },
  { name: "Ecobank", logo: logoEcobank },
  { name: "UBA", logo: logoUba },
];

/* ─── Réseaux sociaux (icônes de marque SVG officielles) ─── */
const socials = [
  {
    name: "WhatsApp",
    url: "https://wa.me/22997000000",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  },
  {
    name: "Facebook",
    url: "https://facebook.com/ippootriip",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z",
  },
  {
    name: "TikTok",
    url: "https://tiktok.com/@ippootriip",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z",
  },
  {
    name: "Instagram",
    url: "https://instagram.com/ippootriip",
    path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0Zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03Zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162ZM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439Z",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/company/ippootriip",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    name: "X",
    url: "https://x.com/ippootriip",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
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

  // Coordonnées (adresse, téléphone, email) éditables depuis le back office admin
  const config = usePlatformConfig();

  return (
    <div ref={scrollRef} className="min-h-screen bg-white overflow-y-auto" style={{ height: "100vh" }}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16">
          <BrandLogo height={28} plain />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Services", "Fonctionnalités", "Témoignages", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm transition text-slate-600 hover:text-[#1E6091]">
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
              ? <X className="w-6 h-6 text-slate-700" />
              : <Menu className="w-6 h-6 text-slate-700" />
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
              Bien plus qu'une app de transport : taxi-moto et VTC, livraison de colis, transport de marchandises et de biens lourds, covoiturage longue distance, commandes groupées, fret aérien & maritime, voyages organisés, location, conciergerie et traçabilité de vos bagages — IPPOO TRIIP réunit tous vos déplacements et toute votre logistique en une seule plateforme, partout en Afrique.
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

      {/* ═══════════ À PROPOS ═══════════ */}
      <section id="apropos" data-animate className="py-16 md:py-24 bg-slate-50">
        <div className={`max-w-4xl mx-auto px-5 md:px-8 text-center transition-all duration-700 ${isVisible("apropos") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 bg-[#1E6091]/10 rounded-full px-4 py-2 mb-4">
            <BadgeCheck className="w-4 h-4 text-[#1E6091]" />
            <span className="text-[#1E6091] text-xs">À propos</span>
          </div>
          <h2 className="text-2xl md:text-4xl title-gradient mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Qu'est-ce qu'IPPOO TRIIP ?
          </h2>
          <p className="text-slate-500 text-sm md:text-base mb-4" style={{ lineHeight: 1.8 }}>
            <span className="text-slate-700">IPPOO TRIIP</span> est la super-app africaine de mobilité et de logistique. Sur une seule plateforme, elle réunit le taxi-moto, la livraison de colis, le transport de biens lourds, les commandes groupées, le covoiturage longue distance et le fret aérien · pour les particuliers comme pour les professionnels.
          </p>
          <p className="text-slate-500 text-sm md:text-base mb-10" style={{ lineHeight: 1.8 }}>
            IPPOO TRIIP connecte passagers, commerçants et transporteurs à travers l'Afrique, du trajet quotidien à l'expédition professionnelle. Notre mission : rendre chaque déplacement et chaque livraison simple, sûr et accessible, partout sur le continent.
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: Globe, value: "6 services", label: "réunis en une app" },
              { icon: Shield, value: "100% vérifiés", label: "chauffeurs & partenaires" },
              { icon: Heart, value: "Made for Africa", label: "pensé pour le continent" },
            ].map((item) => (
              <div key={item.value} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center gap-2">
                <div className="w-11 h-11 bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] rounded-xl flex items-center justify-center shadow-sm">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-slate-700 text-sm">{item.value}</p>
                <p className="text-slate-400 text-[10px] md:text-xs text-center">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES — CATALOGUE COMPLET ═══════════ */}
      <ServicesCatalog onCta={() => navigate("/login")} />

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="comment" data-animate className="py-16 md:py-24 bg-slate-50">
        <div className={`max-w-6xl mx-auto px-5 md:px-8 transition-all duration-700 ${isVisible("comment") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12 md:mb-16">
            
            <h2 className="text-2xl md:text-4xl title-gradient mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                <h3 className="title-gradient mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h.title}</h3>
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
            
            <h2 className="text-2xl md:text-4xl title-gradient mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                <h3 className="title-gradient text-sm mb-2">{f.title}</h3>
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
            <h2 className="text-2xl md:text-4xl title-gradient mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-center h-16 w-28 md:w-36 px-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <ImageWithFallback
                  src={p.logo}
                  alt={p.name}
                  className="max-h-9 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition duration-300"
                />
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
          <div className="flex justify-center mb-6">
            <BrandLogo height={52} />
          </div>
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
      <footer id="contact" className="bg-slate-900 text-white">
        {/* Bande blanche avec le logo centré */}
        <div className="bg-white py-6 flex justify-center">
          <BrandLogo height={36} plain />
        </div>

        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <p className="text-slate-400 text-xs mb-4" style={{ lineHeight: 1.7 }}>
                IPPOO TRIIP, la super-app africaine de mobilité et de logistique : taxi-moto, livraison, transport de biens, commandes groupées, covoiturage et fret aérien, réunis en une seule plateforme à travers l'Afrique.
              </p>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#F77F00] hover:text-white transition"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Services</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Taxi-Moto", path: "/app/book-ride" },
                  { label: "Livraison de colis", path: "/app/delivery" },
                  { label: "Transport lourd", path: "/app/heavy-transport" },
                  { label: "Commandes groupées", path: "/app/group-orders" },
                  { label: "Covoiturage", path: "/app/carpool" },
                  { label: "IPPOO AIR", path: "/app/air-freight" },
                ].map((s) => (
                  <button key={s.label} onClick={() => navigate(s.path)} className="block text-left text-slate-500 text-xs hover:text-white cursor-pointer transition">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Entreprise</h4>
              <div className="space-y-2.5">
                {[
                  { label: "À propos", href: "#apropos" },
                  { label: "Carrières", href: "#cta" },
                  { label: "Partenaires", href: "#partenaires" },
                  { label: "Presse", href: "#partenaires" },
                  { label: "Blog", href: "#services" },
                  { label: "CGU & Confidentialité", href: `mailto:${config.contact.email}?subject=CGU%20%26%20Confidentialit%C3%A9` },
                ].map((s) => (
                  <a key={s.label} href={s.href} className="block text-slate-500 text-xs hover:text-white cursor-pointer transition">{s.label}</a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-slate-300 text-xs mb-4">Contact</h4>
              <div className="space-y-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.contact.mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <MapPin className="w-4 h-4 text-[#F77F00] shrink-0" />
                  <span className="text-slate-400 text-xs group-hover:text-white transition">{config.contact.address}</span>
                </a>
                <a href={`tel:${config.contact.phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 group">
                  <Phone className="w-4 h-4 text-[#2A9D8F] shrink-0" />
                  <span className="text-slate-400 text-xs group-hover:text-white transition">{config.contact.phone}</span>
                </a>
                <a href={`mailto:${config.contact.email}`} className="flex items-center gap-3 group">
                  <Mail className="w-4 h-4 text-[#1E6091] shrink-0" />
                  <span className="text-slate-400 text-xs group-hover:text-white transition break-all">{config.contact.email}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-[10px]">&copy; 2026 IPPOO TRIIP. Tous droits réservés.</p>
            <div className="flex gap-4">
              {[
                { label: "Politique de confidentialité", href: `mailto:${config.contact.email}?subject=Politique%20de%20confidentialit%C3%A9` },
                { label: "Conditions d'utilisation", href: `mailto:${config.contact.email}?subject=Conditions%20d%27utilisation` },
                { label: "Mentions légales", href: `mailto:${config.contact.email}?subject=Mentions%20l%C3%A9gales` },
              ].map((l) => (
                <a key={l.label} href={l.href} className="text-slate-500 text-[10px] hover:text-white cursor-pointer transition">{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}