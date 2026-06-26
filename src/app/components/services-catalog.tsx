/**
 * Catalogue complet des offres & formules IPPOO TRIIP.
 * Tous les textes sont repris VERBATIM de la fiche services fournie (aucun résumé).
 * Hiérarchisé en grandes catégories. Chaque service possède :
 *   - une icône lucide (jamais d'emoji / d'icône 3D),
 *   - une image africaine UNIQUE, cadrée à son contexte, affichée en entier (non rognée),
 *   - l'intégralité de sa fiche descriptive (texte 100% opaque).
 * Titres de catégories en couleurs variées (dégradés & monochromes).
 * Fonds de sections variés (blanc, dégradés légers, gris, effets de transparence).
 */
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AfricanPattern } from "./icons";

/* ─── Photos africaines réelles (fournies) ─── */
import photoMoto from "../../imports/photo_4_2026-06-26_14-18-37.jpg";
import photoDriver from "../../imports/photo_5_2026-06-26_14-18-37.jpg";
import photoTravel from "../../imports/photo_14_2026-06-26_14-18-38.jpg";
import photoFamily from "../../imports/photo_6_2026-06-26_14-18-38.jpg";
import photoCargo from "../../imports/photo_3_2026-06-26_14-18-37.jpg";
import photoDelivery from "../../imports/photo_11_2026-06-26_14-18-38.jpg";
import photoMarket from "../../imports/photo_13_2026-06-26_14-18-38.jpg";
import photoMerchant from "../../imports/photo_9_2026-06-26_14-18-38.jpg";
import photoAirport from "../../imports/photo_15_2026-06-26_14-18-38.jpg";
import photoWarehouse from "../../imports/photo_8_2026-06-26_14-18-38.jpg";

/* ─── Photos nouvelles (voyages & gestion d'objets) ─── */
import photoTripStudents from "../../imports/photo_12_2026-06-26_14-29-33.jpg";
import photoTripFamily from "../../imports/photo_4_2026-06-26_14-29-33.jpg";
import photoTripBusiness from "../../imports/photo_8_2026-06-26_14-29-33.jpg";
import photoTripWedding from "../../imports/photo_1_2026-06-26_14-29-33.jpg";
import photoTripHoneymoon from "../../imports/photo_13_2026-06-26_14-29-33.jpg";
import photoTripCounter from "../../imports/photo_16_2026-06-26_14-29-33.jpg";
import photoBagsCheck from "../../imports/photo_14_2026-06-26_14-29-33.jpg";
import photoBagsLuggage from "../../imports/photo_15_2026-06-26_14-29-33.jpg";
import photoBagsTraveller from "../../imports/photo_14_2026-06-26_14-18-38-1.jpg";

/* ─── Marketplace & boutique mode ─── */
import photoMarketplace from "../../imports/photo_2_2026-06-26_14-45-04.jpg";
import photoLuxe from "../../imports/photo_8_2026-06-26_14-45-04.jpg";
import {
  Sparkles, Car, Users, GraduationCap, KeyRound, PartyPopper, Map,
  Truck, ShoppingBag, Ship, Boxes, Globe, Store, Gem, ReceiptText,
  Luggage, Baby, HeartHandshake, Ambulance, ConciergeBell, Building2,
  Award, Ticket, Megaphone, ArrowRight, CheckCircle2, type LucideIcon,
  Plane, Briefcase, Heart, Church, Search, ShieldCheck, QrCode, Wallet,
  PackageSearch, ScanLine,
} from "lucide-react";

/** Construit une URL Unsplash plein cadre (fit=max → image entière, non rognée). */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080`;

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  paragraphs: string[];
  img: string;
}

interface Category {
  id: string;
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  /** 'gradient' = titre dégradé, 'mono' = titre monochrome */
  mode: "gradient" | "mono";
  from: string;
  to: string;
  accent: string;
  bg: string;
  glow?: string;
  services: ServiceItem[];
}

const CATEGORIES: Category[] = [
  {
    id: "services",
    badge: "Transport & mobilité",
    badgeIcon: Car,
    title: "Vous déplacer, simplement",
    mode: "gradient",
    from: "#1E6091",
    to: "#06B6D4",
    accent: "#1E6091",
    bg: "bg-gradient-to-b from-sky-50 via-white to-blue-50/50",
    glow: "#1E6091",
    services: [
      {
        icon: Car,
        title: "Transport de personnes",
        img: photoMoto,
        paragraphs: [
          "Voyagez en toute simplicité grâce à nos différentes solutions de mobilité adaptées à chaque situation.",
          "Notre service VTC vous permet de réserver un véhicule avec chauffeur pour vos déplacements privés, professionnels ou événementiels. Pour les trajets urbains, notre service Taxi Moto constitue une alternative rapide, économique et particulièrement efficace.",
          "Grâce à notre technologie d'interconnexion, plusieurs réseaux de chauffeurs travaillent ensemble afin de réduire les temps d'attente et d'améliorer la disponibilité des véhicules.",
          "Vous choisissez librement entre des trajets individuels ou partagés selon votre budget, vos préférences et votre niveau de confort.",
          "Parce que chaque déplacement mérite d'être simple, rapide et sécurisé.",
        ],
      },
      {
        icon: Users,
        title: "Covoiturage & Transport partagé",
        img: photoDriver,
        paragraphs: [
          "Réduisez vos dépenses tout en voyageant de manière plus responsable.",
          "Notre plateforme permet aux utilisateurs partageant un même itinéraire de mutualiser leurs trajets afin de diminuer les coûts de transport, d'optimiser l'utilisation des véhicules et de limiter l'empreinte environnementale.",
          "Salariés, étudiants, commerçants ou voyageurs peuvent créer ou rejoindre des trajets réguliers ou occasionnels en quelques clics.",
          "Voyager ensemble devient plus économique… et plus intelligent.",
        ],
      },
      {
        icon: Map,
        title: "Voyages organisés",
        img: photoTravel,
        paragraphs: [
          "Voyagez en toute tranquillité grâce à nos offres complètes.",
          "Nos formules peuvent inclure le transport, les transferts, l'hébergement, les repas, les petits-déjeuners, les déplacements professionnels ainsi que de nombreux services complémentaires.",
          "Grâce à notre réseau de partenaires, vous bénéficiez de tarifs négociés et de solutions adaptées à votre budget.",
        ],
      },
      {
        icon: GraduationCap,
        title: "Transport scolaire & Assistance aux familles",
        img: photoFamily,
        paragraphs: [
          "Parce que la sécurité de vos enfants est une priorité.",
          "Lorsque les parents sont indisponibles, IPPOO TRIIP peut assurer les trajets entre le domicile, l'école, les activités extrascolaires ou tout autre lieu autorisé.",
          "Des solutions de suivi peuvent être proposées afin de permettre aux familles de suivre chaque déplacement avec sérénité.",
        ],
      },
      {
        icon: KeyRound,
        title: "Location & Leasing",
        img: U("photo-1533558701576-23c65e0272fb"),
        paragraphs: [
          "Besoin d'un véhicule pour quelques heures, quelques jours ou plusieurs années ?",
          "IPPOO TRIIP propose des solutions de location courte durée, longue durée, leasing et location avec option d'achat adaptées aussi bien aux particuliers qu'aux professionnels.",
        ],
      },
      {
        icon: PartyPopper,
        title: "Événements & Cérémonies",
        img: U("photo-1592514313074-794923c98162"),
        paragraphs: [
          "Mariages, anniversaires, cérémonies, conférences, séminaires ou événements d'entreprise…",
          "Nous mettons à votre disposition des véhicules adaptés à chaque occasion avec ou sans chauffeur selon vos besoins.",
          "Parce que chaque événement mérite un service irréprochable.",
        ],
      },
    ],
  },
  {
    id: "logistique",
    badge: "Logistique & livraison",
    badgeIcon: Truck,
    title: "Transporter & livrer",
    mode: "mono",
    from: "#F77F00",
    to: "#F77F00",
    accent: "#F77F00",
    bg: "bg-gradient-to-b from-orange-50 via-amber-50/50 to-orange-50/30",
    glow: "#F77F00",
    services: [
      {
        icon: Truck,
        title: "Transport de marchandises & Logistique",
        img: photoDelivery,
        paragraphs: [
          "IPPOO TRIIP accompagne les particuliers comme les entreprises dans le transport de leurs marchandises.",
          "Nous assurons les livraisons locales, interurbaines et nationales ainsi que le convoyage de colis, d'équipements, de produits agricoles, de marchandises commerciales et de biens divers.",
          "Nos solutions permettent également d'organiser des approvisionnements réguliers, des réassorts rapides ou des tournées logistiques adaptées aux besoins des commerces, producteurs et entreprises.",
          "Votre logistique devient plus simple, plus rapide et mieux organisée.",
        ],
      },
      {
        icon: ShoppingBag,
        title: "Courses & Livraisons du quotidien",
        img: photoMarket,
        paragraphs: [
          "Gagnez du temps en nous confiant vos tâches du quotidien.",
          "Nos équipes peuvent effectuer vos achats alimentaires, récupérer vos colis, livrer vos documents, acheter des produits spécifiques ou accomplir diverses missions selon vos instructions.",
          "Commandez également vos repas et faites-vous livrer où vous le souhaitez : à domicile, au bureau ou sur votre lieu de rendez-vous.",
          "Vous profitez de votre temps… nous nous occupons du reste.",
        ],
      },
      {
        icon: Ship,
        title: "Fret aérien & Maritime",
        img: photoCargo,
        paragraphs: [
          "Nous organisons l'expédition internationale de vos marchandises par voie aérienne ou maritime.",
          "Que vous recherchiez une livraison express ou une solution économique, nos équipes vous accompagnent jusqu'à la livraison finale avec un suivi permanent de vos expéditions.",
        ],
      },
      {
        icon: Boxes,
        title: "Commandes Groupées",
        img: photoMerchant,
        paragraphs: [
          "Plus vous êtes nombreux… plus vous économisez.",
          "Notre système de commandes et de transports groupés permet aux utilisateurs de mutualiser leurs achats afin d'obtenir des tarifs préférentiels, de réduire les frais logistiques et d'optimiser les délais de livraison.",
        ],
      },
    ],
  },
  {
    id: "achats",
    badge: "Achats internationaux",
    badgeIcon: Globe,
    title: "Acheter partout dans le monde",
    mode: "gradient",
    from: "#2A9D8F",
    to: "#10B981",
    accent: "#2A9D8F",
    bg: "bg-gradient-to-b from-emerald-50/70 via-slate-50 to-teal-50/40",
    glow: "#2A9D8F",
    services: [
      {
        icon: Globe,
        title: "Achats & Commandes depuis l'étranger",
        img: U("photo-1566576721346-d4a3b4eaeb55"),
        paragraphs: [
          "Achetez partout dans le monde… recevez facilement chez vous.",
          "IPPOO TRIIP facilite les commandes internationales provenant d'Europe, d'Amérique, d'Asie, du Moyen-Orient ou d'Afrique.",
          "Nous prenons en charge l'ensemble du processus : achats, regroupement des commandes, contrôle, stockage, transport aérien ou maritime, formalités logistiques et livraison finale.",
          "Notre plateforme fonctionne également dans les deux sens.",
          "Les membres de la diaspora africaine, notamment d'Afrique de l'Ouest et d'Afrique Centrale, peuvent commander des produits pour leurs proches restés au pays ou faire expédier des marchandises vers l'étranger.",
          "Grâce au système de groupage, plusieurs commandes sont regroupées afin de réduire considérablement les frais de transport et les coûts d'expédition.",
          "Selon vos besoins, plusieurs délais et niveaux de service sont proposés afin de concilier rapidité et économies.",
        ],
      },
      {
        icon: Store,
        title: "Marketplace Internationale",
        img: photoMarketplace,
        paragraphs: [
          "Accédez aux plus grandes enseignes mondiales directement depuis notre plateforme.",
          "Vous pourrez retrouver des fournisseurs internationaux sélectionnés par catégories de produits : prêt-à-porter, sport, alimentation, électroménager, décoration, équipements professionnels et bien d'autres.",
          "Notre catalogue intégrera progressivement les plus grandes marques internationales ainsi que de nombreuses enseignes et centrales d'achats afin de vous garantir un large choix, des prix compétitifs et des produits authentiques.",
          "Vous commandez où que vous soyez… nous nous chargeons du reste.",
        ],
      },
      {
        icon: Gem,
        title: "Espace Luxe & Grandes Marques",
        img: photoLuxe,
        paragraphs: [
          "Pour une clientèle exigeante, IPPOO TRIIP proposera un univers entièrement dédié au luxe.",
          "Montres prestigieuses, maroquinerie, chaussures, prêt-à-porter, accessoires, bijoux et créations des plus grandes maisons internationales seront accessibles avec des garanties renforcées d'authenticité, de confidentialité et de traçabilité.",
          "Nous négocions les meilleures conditions d'achat afin d'offrir à nos clients une expérience haut de gamme en toute sérénité.",
        ],
      },
      {
        icon: ReceiptText,
        title: "Export & Avantages fiscaux",
        img: U("photo-1554224155-6726b3ff858f"),
        paragraphs: [
          "Lorsque la réglementation le permet, certaines commandes destinées à l'export pourront bénéficier d'une facturation hors taxes (HT).",
          "Cette optimisation permet de réduire davantage le coût d'acquisition de nombreux produits tout en respectant les exigences légales applicables.",
        ],
      },
    ],
  },
  {
    id: "assistance",
    badge: "Assistance & services à la personne",
    badgeIcon: HeartHandshake,
    title: "Prendre soin de votre quotidien",
    mode: "mono",
    from: "#D62828",
    to: "#D62828",
    accent: "#D62828",
    bg: "bg-gradient-to-b from-rose-50 via-pink-50/50 to-rose-50/30",
    glow: "#D62828",
    services: [
      {
        icon: Luggage,
        title: "Assistance Aéroportuaire",
        img: photoAirport,
        paragraphs: [
          "Un objet refusé lors de votre passage en aéroport ne doit plus être définitivement perdu.",
          "IPPOO TRIIP pourra récupérer, sur mandat, les articles rejetés pour diverses raisons : dépassement des limites de poids, liquides supérieurs aux volumes autorisés, objets momentanément non conformes ou autres situations similaires.",
          "Selon votre choix, vos effets pourront être conservés, réexpédiés après votre départ ou livrés à l'adresse de votre choix.",
        ],
      },
      {
        icon: Baby,
        title: "Nounou & Crèche Active",
        img: U("photo-1487546331507-fcf8a5d27ab3"),
        paragraphs: [
          "Nous accompagnons les familles grâce à des solutions de garde flexibles.",
          "Que ce soit pour quelques heures, une journée complète ou un accompagnement régulier, notre réseau de professionnels répond à vos besoins.",
          "Notre concept de Crèche Active offre davantage de souplesse pour les familles modernes.",
        ],
      },
      {
        icon: HeartHandshake,
        title: "Assistance Mobilité",
        img: U("photo-1762955911431-4c44c7c3f408"),
        paragraphs: [
          "Certaines situations nécessitent simplement une présence.",
          "Nous pouvons accompagner une personne âgée, assister un enfant, aller chercher un proche, organiser un déplacement médical ou effectuer un trajet à votre place lorsque vous êtes indisponible.",
          "Nous facilitons votre quotidien en prenant soin de ceux qui comptent pour vous.",
        ],
      },
      {
        icon: Ambulance,
        title: "Urgences sanitaires",
        img: U("photo-1554734867-bf3c00a49371"),
        paragraphs: [
          "Face à une urgence, chaque minute compte.",
          "Nous organisons rapidement le transport vers un centre de santé adapté et pouvons également assurer l'achat ainsi que la récupération de médicaments lorsque cela est nécessaire.",
        ],
      },
      {
        icon: ConciergeBell,
        title: "Conciergerie",
        img: U("photo-1558959357-685f9c7ace7b"),
        paragraphs: [
          "Confiez-nous les tâches qui vous prennent du temps.",
          "Démarches administratives, réservations, achats, récupération de documents, courses diverses ou missions personnalisées : notre service de conciergerie est conçu pour simplifier votre quotidien.",
        ],
      },
    ],
  },
  {
    id: "voyages",
    badge: "Voyages & bagages",
    badgeIcon: Plane,
    title: "Voyager l'esprit libre",
    mode: "gradient",
    from: "#2A9D8F",
    to: "#1E6091",
    accent: "#2A9D8F",
    bg: "bg-gradient-to-b from-teal-50 via-white to-sky-50/40",
    glow: "#2A9D8F",
    services: [
      {
        icon: Map,
        title: "Voyages Organisés & Déplacements sur Mesure",
        img: photoTripCounter,
        paragraphs: [
          "Parce que chaque voyage mérite une organisation parfaite.",
          "IPPOO TRIIP vous accompagne dans l'organisation de tous vos déplacements, qu'ils soient personnels, familiaux, professionnels ou événementiels. Notre équipe coordonne chaque étape afin de vous offrir une expérience fluide, sécurisée et sans stress.",
          "Nous concevons des solutions adaptées à chaque situation, avec des prestations personnalisées selon vos besoins, votre budget et le nombre de voyageurs.",
        ],
      },
      {
        icon: GraduationCap,
        title: "Voyages étudiants",
        img: photoTripStudents,
        paragraphs: [
          "Transport collectif, accompagnement, gestion des inscriptions, réservation d'hébergement, transferts et coordination logistique pour les établissements scolaires, universités, associations étudiantes et groupes académiques.",
        ],
      },
      {
        icon: Users,
        title: "Voyages familiaux",
        img: photoTripFamily,
        paragraphs: [
          "Déplacements en famille, vacances, retrouvailles, visites privées ou événements familiaux avec des solutions adaptées à tous les âges.",
        ],
      },
      {
        icon: Briefcase,
        title: "Séminaires & Voyages d'entreprise",
        img: photoTripBusiness,
        paragraphs: [
          "Organisation complète des déplacements professionnels, séminaires, conférences, congrès, formations et voyages de motivation avec transport, hébergement, restauration et assistance sur place.",
        ],
      },
      {
        icon: Church,
        title: "Mariages & Grandes Réceptions",
        img: photoTripWedding,
        paragraphs: [
          "Location de véhicules, transport des invités, transferts des mariés, coordination des déplacements et logistique événementielle pour faire de chaque cérémonie un moment inoubliable.",
        ],
      },
      {
        icon: Heart,
        title: "Voyages de noces",
        img: photoTripHoneymoon,
        paragraphs: [
          "Offrez-vous une lune de miel exceptionnelle grâce à nos formules personnalisées comprenant transport, hébergement, excursions, transferts et services exclusifs.",
        ],
      },
      {
        icon: PartyPopper,
        title: "Déplacements circonstanciels",
        img: photoTripCounter,
        paragraphs: [
          "Nous organisons également les déplacements liés aux événements particuliers de la vie : cérémonies religieuses, célébrations, réunions familiales, événements culturels ou toute autre occasion nécessitant une organisation spécifique.",
        ],
      },
      {
        icon: HeartHandshake,
        title: "Assistance en cas de décès",
        img: photoTripFamily,
        paragraphs: [
          "Dans les moments les plus difficiles, IPPOO TRIIP accompagne les familles en organisant les déplacements des proches, les transferts vers les lieux de cérémonie, les convois funéraires ainsi que toute la logistique de transport nécessaire, avec professionnalisme, discrétion et respect.",
        ],
      },
    ],
  },
  {
    id: "objets",
    badge: "Agence de gestion & traçabilité",
    badgeIcon: ShieldCheck,
    title: "Vos effets personnels, protégés à chaque étape",
    mode: "mono",
    from: "#1E6091",
    to: "#1E6091",
    accent: "#1E6091",
    bg: "bg-gradient-to-b from-sky-50/60 via-white to-blue-50/40",
    glow: "#1E6091",
    services: [
      {
        icon: ShieldCheck,
        title: "Agence de Gestion, de Recherche & de Collecte des Objets",
        img: photoBagsLuggage,
        paragraphs: [
          "Ne perdez plus jamais l'essentiel.",
          "IPPOO TRIIP met à votre disposition une agence spécialisée dans la protection, la gestion et la récupération de vos effets personnels avant, pendant et après vos déplacements.",
          "Notre mission est d'offrir aux voyageurs une tranquillité d'esprit totale grâce à des services de prévention, de sécurisation, de traçabilité et d'assistance en cas de perte.",
        ],
      },
      {
        icon: ScanLine,
        title: "Vérification & Préparation des bagages",
        img: photoBagsCheck,
        paragraphs: [
          "Voyagez en toute sérénité.",
          "Avant votre départ, nos équipes peuvent contrôler vos bagages afin de vérifier leur conformité avec les exigences des compagnies aériennes, ferroviaires et des autres transporteurs.",
          "Nous vous accompagnons pour : vérifier le poids et les dimensions autorisés ; contrôler le contenu selon les réglementations en vigueur ; optimiser le rangement de vos effets personnels ; protéger les objets fragiles et de valeur ; préparer vos bagages pour éviter tout refus ou supplément lors de l'enregistrement.",
          "Un simple contrôle peut vous éviter de nombreux désagréments.",
        ],
      },
      {
        icon: Gem,
        title: "Assurance des effets personnels",
        img: photoBagsLuggage,
        paragraphs: [
          "Parce que certains objets n'ont pas de prix.",
          "Nous proposons des solutions de protection couvrant vos effets personnels, notamment : valises ; colis ; documents importants ; équipements professionnels ; bijoux ; objets de valeur ; effets personnels spécifiques.",
          "Nos équipes vous accompagnent également dans les démarches auprès des compagnies de transport afin d'optimiser les conditions de prise en charge en cas de perte ou de dommage.",
        ],
      },
      {
        icon: QrCode,
        title: "Recherche & Traçabilité des objets perdus",
        img: photoBagsTraveller,
        paragraphs: [
          "Retrouver un objet perdu devient plus simple.",
          "Grâce à notre système de traçabilité intelligent, vos biens peuvent être identifiés, enregistrés et suivis tout au long de leur parcours.",
          "Nos solutions incluent notamment : identification numérique ; QR Codes sécurisés ; enregistrement des objets ; dispositifs de verrouillage intelligents ; suivi des déclarations de perte ; accompagnement dans les recherches auprès des compagnies de transport, des aéroports, gares et autres organismes concernés.",
          "Notre objectif est d'augmenter considérablement les chances de retrouver rapidement vos effets personnels.",
        ],
      },
      {
        icon: PackageSearch,
        title: "Récupération d'objets refusés en aéroport",
        img: photoBagsLuggage,
        paragraphs: [
          "Un objet refusé n'est pas forcément perdu.",
          "Lorsqu'un bagage ou un article est refusé lors des contrôles de sécurité (liquides dépassant les volumes autorisés, excédents de poids, objets non conformes ou autres restrictions), IPPOO TRIIP peut intervenir sur mandat pour récupérer vos effets.",
          "Nous pouvons ensuite : conserver vos biens en sécurité ; les expédier à votre domicile ; les réexpédier après votre départ ; les remettre à un proche ou à un représentant autorisé.",
          "Vous voyagez sans stress, même en cas d'imprévu.",
        ],
      },
      {
        icon: Wallet,
        title: "Assistance financière au voyage",
        img: photoBagsTraveller,
        paragraphs: [
          "Voyager doit rester accessible à tous.",
          "Pour les personnes rencontrant momentanément des difficultés financières, IPPOO TRIIP développe des solutions d'accompagnement permettant de faciliter certains déplacements essentiels.",
          "Selon les conditions d'éligibilité, nous pouvons proposer : des facilités de paiement ; des avances sur certains frais de voyage ; des solutions de financement adaptées ; des dispositifs d'accompagnement en partenariat avec nos partenaires.",
          "Notre ambition est de rendre la mobilité plus inclusive et accessible au plus grand nombre.",
        ],
      },
    ],
  },
  {
    id: "entreprises",
    badge: "Entreprises & avantages",
    badgeIcon: Building2,
    title: "Développer & récompenser",
    mode: "gradient",
    from: "#8B5CF6",
    to: "#6366F1",
    accent: "#8B5CF6",
    bg: "bg-gradient-to-b from-violet-50 via-indigo-50/50 to-violet-50/30",
    glow: "#8B5CF6",
    services: [
      {
        icon: Building2,
        title: "Solutions Entreprises",
        img: photoWarehouse,
        paragraphs: [
          "Optimisez les déplacements de vos collaborateurs.",
          "Nos solutions permettent aux entreprises, administrations et organisations de gérer les transports professionnels, le covoiturage des salariés, les courses groupées, les livraisons et les déplacements réguliers tout en maîtrisant leurs coûts.",
        ],
      },
      {
        icon: Award,
        title: "Programme Fidélité",
        img: U("photo-1762504351153-58a41cd486dd"),
        paragraphs: [
          "Chaque utilisation de la plateforme vous récompense.",
          "Vos déplacements, commandes, missions, réservations et achats vous permettent d'accumuler des points de fidélité.",
          "Ces points peuvent être transformés en réductions, surclassements, bons de paiement, cadeaux, services premium ou avantages exclusifs selon vos préférences.",
          "Votre fidélité mérite d'être récompensée.",
        ],
      },
      {
        icon: Ticket,
        title: "Coupons & Bons d'achat",
        img: U("photo-1607083206968-13611e3d76db"),
        paragraphs: [
          "Profitez régulièrement d'offres exclusives.",
          "En fonction de votre activité sur la plateforme, vous pourrez recevoir des coupons de réduction, des bons d'achat et de nombreux avantages utilisables auprès de nos partenaires.",
          "Chaque interaction peut devenir une nouvelle opportunité d'économiser.",
        ],
      },
      {
        icon: Megaphone,
        title: "Publicité & Partenaires",
        img: U("photo-1708674282655-3637d492dc74"),
        paragraphs: [
          "IPPOO TRIIP ouvre également ses espaces aux entreprises, commerçants, producteurs et marques souhaitant promouvoir leurs produits et services.",
          "Nos utilisateurs découvrent ainsi des offres exclusives, des promotions et des opportunités sélectionnées avec soin.",
          "Ensemble, nous construisons un écosystème où chacun trouve de nouvelles opportunités de développement.",
        ],
      },
    ],
  },
];

const WHY = [
  "Une plateforme tout-en-un",
  "Des services disponibles à la demande ou sur réservation",
  "Une couverture locale, nationale et internationale",
  "Des solutions pour les particuliers comme pour les entreprises",
  "Une logistique intelligente et collaborative",
  "Des économies grâce au transport partagé et au groupage",
  "Un programme de fidélité réellement avantageux",
  "Un réseau de partenaires de confiance",
];

function CategoryTitle({ cat }: { cat: Category }) {
  const base = "text-2xl md:text-4xl";
  const font = { fontFamily: "'Plus Jakarta Sans', sans-serif" } as const;
  if (cat.mode === "gradient") {
    return (
      <h2
        className={base}
        style={{
          ...font,
          backgroundImage: `linear-gradient(90deg, ${cat.from}, ${cat.to})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: cat.from,
        }}
      >
        {cat.title}
      </h2>
    );
  }
  return (
    <h2 className={base} style={{ ...font, color: cat.accent }}>
      {cat.title}
    </h2>
  );
}

export function ServicesCatalog({ onCta }: { onCta: () => void }) {
  return (
    <>
      {/* En-tête général — texte intégral verbatim */}
      <section id="services" className="relative overflow-hidden bg-gradient-to-b from-[#1E6091]/8 via-white to-[#2A9D8F]/8 py-16 md:py-20">
        <div aria-hidden className="absolute inset-0 text-[#1E6091]"><AfricanPattern opacity={0.05} /></div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full blur-[120px] opacity-40"
          style={{ background: "#1E6091" }}
        />
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#F77F00]" />
            <span className="text-slate-700 text-xs">La mobilité intelligente au service de votre quotidien</span>
          </div>
          <h2
            className="text-2xl md:text-4xl mb-4"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundImage: "linear-gradient(90deg, #1E6091, #2A9D8F)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "#1E6091",
            }}
          >
            Une seule plateforme. Des centaines de solutions.
          </h2>
          <p className="text-slate-700 text-sm md:text-base mb-5" style={{ lineHeight: 1.8 }}>
            Déplacez-vous, transportez, commandez, voyagez… IPPOO TRIIP s'occupe de tout.
          </p>
          <div className="space-y-3 text-left">
            <p className="text-slate-600 text-sm md:text-base" style={{ lineHeight: 1.8 }}>
              Chez IPPOO TRIIP, nous réinventons la mobilité et les services du quotidien en proposant une plateforme unique qui connecte les particuliers, les familles, les professionnels, les commerçants et les entreprises à un large écosystème de solutions de transport, de logistique, d'assistance et de conciergerie.
            </p>
            <p className="text-slate-600 text-sm md:text-base" style={{ lineHeight: 1.8 }}>
              Que vous ayez besoin d'un véhicule avec chauffeur, d'une livraison urgente, d'un transport scolaire, d'une assistance pour un proche, d'un achat à l'étranger ou d'une solution logistique complète, IPPOO TRIIP met à votre disposition des services fiables, rapides et accessibles.
            </p>
            <p className="text-slate-600 text-sm md:text-base" style={{ lineHeight: 1.8 }}>
              Nos prestations sont disponibles immédiatement à la demande ou sur réservation, afin de répondre à tous vos besoins, qu'ils soient ponctuels ou réguliers.
            </p>
          </div>
        </div>
      </section>

      {/* Catégories */}
      {CATEGORIES.map((cat, idx) => (
        <section
          key={cat.id}
          id={idx === 0 ? undefined : cat.id}
          className={`relative overflow-hidden ${cat.bg} py-14 md:py-20`}
        >
          {/* Illustration kente en transparence */}
          <div aria-hidden className="absolute inset-0" style={{ color: cat.accent }}>
            <AfricanPattern opacity={0.05} />
          </div>
          {cat.glow && (
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 bottom-0 w-72 h-72 rounded-full blur-[120px] opacity-30"
              style={{ background: cat.glow }}
            />
          )}

          <div className="relative max-w-6xl mx-auto px-5 md:px-8">
            <header className="mb-9 md:mb-12 text-center max-w-2xl mx-auto">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
                style={{ background: `${cat.accent}15`, color: cat.accent }}
              >
                <cat.badgeIcon className="w-4 h-4" />
                <span className="text-xs">{cat.badge}</span>
              </div>
              <CategoryTitle cat={cat} />
            </header>

            {/* Blocs alternés — image à côté du texte, hiérarchie claire */}
            <div className="space-y-14 md:space-y-20">
              {cat.services.map((s, i) => {
                const imgRight = i % 2 === 1;
                const [slogan, ...rest] = s.paragraphs;
                return (
                  <article
                    key={s.title}
                    className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 items-center"
                  >
                    {/* Image — affichée en entier, non rognée */}
                    <div className={imgRight ? "md:order-2" : ""}>
                      {/* Pleine largeur sur mobile (full-bleed), encadrée sur desktop */}
                      <div className="overflow-hidden bg-white shadow-md -mx-5 md:mx-0 rounded-none md:rounded-3xl border-0 md:border md:border-slate-100">
                        <ImageWithFallback src={s.img} alt={s.title} className="block w-full h-auto" />
                      </div>
                    </div>

                    {/* Texte — badge › titre › slogan › paragraphes › CTA */}
                    <div className={imgRight ? "md:order-1" : ""}>
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4"
                        style={{ background: `${cat.accent}15`, color: cat.accent }}
                      >
                        <s.icon className="w-4 h-4" />
                        <span className="text-xs">{cat.badge}</span>
                      </div>

                      <h3
                        className="mb-3 text-2xl md:text-3xl"
                        style={{ color: cat.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {s.title}
                      </h3>

                      <p className="mb-4 text-base md:text-lg" style={{ color: cat.accent, lineHeight: 1.55 }}>
                        {slogan}
                      </p>

                      <div className="space-y-2.5 mb-6">
                        {rest.map((p, k) => (
                          <p key={k} className="text-sm" style={{ color: "#475569", lineHeight: 1.7 }}>
                            {p}
                          </p>
                        ))}
                      </div>

                      <button
                        onClick={onCta}
                        className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm transition active:scale-95"
                        style={{ background: cat.accent, boxShadow: `0 10px 22px -8px ${cat.accent}80` }}
                      >
                        En savoir plus <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Pourquoi choisir IPPOO TRIIP ? — verbatim */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] py-16 md:py-20">
        <div aria-hidden className="absolute inset-0 text-white"><AfricanPattern opacity={0.07} /></div>
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[110px] opacity-25" style={{ background: "#F77F00" }} />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8">
          <h2 className="text-white text-2xl md:text-4xl text-center mb-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Pourquoi choisir IPPOO TRIIP ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY.map((w) => (
              <div key={w} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5">
                <CheckCircle2 className="w-5 h-5 text-[#E9C46A] shrink-0 mt-0.5" />
                <span className="text-white text-sm" style={{ lineHeight: 1.6 }}>{w}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={onCta}
              className="inline-flex items-center gap-2 bg-[#F77F00] text-white px-8 py-4 rounded-2xl text-sm shadow-xl shadow-orange-500/30 transition active:scale-95"
            >
              Profiter de tous nos services <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
