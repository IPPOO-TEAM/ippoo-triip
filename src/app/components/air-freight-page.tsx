import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Plane, Package, FileText, ShieldCheck, Weight,
  MapPin, User, Phone, Clock, Zap, ChevronRight, Camera, Check, X,
  Globe, Calendar, AlertTriangle, Info, Landmark, CreditCard, Flag,
  Users, Share2, QrCode, Copy, Link, Eye, Truck, Briefcase,
  ArrowRight, Star, CircleCheck, CircleAlert, Luggage, Hash,
  Building2, TriangleAlert, Shield, BadgeCheck, Gift, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { getAvatar } from "./avatars";
import { api } from "../api/client";
import { usePlatformConfig, findOffer } from "../store/platform-config";
import { ImageWithFallback } from "./figma/ImageWithFallback";

/** Base de référence (passager national) servant à mettre les tarifs aériens à l'échelle. */
const AIR_REF_BASE = 25000;
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Images ─── */
const IMG_PASSENGERS = "https://images.unsplash.com/photo-1621498239270-4538771364e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb3J0JTIwcGFzc2VuZ2VyJTIwdGVybWluYWwlMjBhZnJpY2FufGVufDF8fHx8MTc3NTkyNjM2Mnww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_CARGO = "https://images.unsplash.com/photo-1774698078446-59299e016718?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMGFpcmNyYWZ0JTIwbG9hZGluZyUyMGZyZWlnaHR8ZW58MXx8fHwxNzc1OTI2MzYyfDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_PLANE = "https://images.unsplash.com/photo-1651443849721-94ba567853bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMGZseWluZyUyMHNreSUyMGNsZWFyfGVufDF8fHx8MTc3NTkyNjM2Mnww&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Types ─── */
type ServiceTab = "passagers" | "colis" | "fret";
type FormStep = "form" | "confirm" | "tracking" | "share";

/* ─── Data ─── */
const serviceTabsMeta: { key: ServiceTab; label: string; icon: typeof Plane; color: string; bg: string }[] = [
  { key: "passagers", label: "Passagers", icon: Users, color: "text-white", bg: "bg-[#1E6091]" },
  { key: "colis", label: "Colis & Docs", icon: Package, color: "text-white", bg: "bg-[#2A9D8F]" },
  { key: "fret", label: "Fret Cargo", icon: Truck, color: "text-white", bg: "bg-[#F77F00]" },
];

const colisTypes = [
  { id: "document", icon: FileText, label: "Document", weight: "< 1 kg", gradient: "from-blue-500 to-indigo-600", lightBg: "bg-blue-50", lightColor: "text-blue-600" },
  { id: "colis", icon: Package, label: "Colis", weight: "1-30 kg", gradient: "from-orange-400 to-orange-600", lightBg: "bg-orange-50", lightColor: "text-orange-600" },
  { id: "fragile", icon: AlertTriangle, label: "Fragile", weight: "1-20 kg", gradient: "from-amber-400 to-amber-600", lightBg: "bg-amber-50", lightColor: "text-amber-600" },
  { id: "perissable", icon: Clock, label: "Périssable", weight: "1-15 kg", gradient: "from-green-400 to-emerald-600", lightBg: "bg-emerald-50", lightColor: "text-emerald-600" },
  { id: "valeur", icon: ShieldCheck, label: "Valeur", weight: "< 5 kg", gradient: "from-violet-400 to-purple-600", lightBg: "bg-violet-50", lightColor: "text-violet-600" },
];

const fretCategories = [
  { id: "marchandise", label: "Marchandise générale", icon: Package },
  { id: "equipement", label: "Équipement industriel", icon: Building2 },
  { id: "demenagement", label: "Déménagement", icon: Truck },
  { id: "vehicule", label: "Pièces véhicule", icon: Briefcase },
];

const airports = [
  { code: "CKO", name: "Cotonou (Cadjehoun)", country: "Bénin" },
  { code: "LFW", name: "Lomé (Gnassingbé)", country: "Togo" },
  { code: "ABJ", name: "Abidjan (F. Houphouët)", country: "Côte d'Ivoire" },
  { code: "LOS", name: "Lagos (Murtala)", country: "Nigeria" },
  { code: "ACC", name: "Accra (Kotoka)", country: "Ghana" },
  { code: "CDG", name: "Paris (Charles de Gaulle)", country: "France" },
  { code: "BKO", name: "Bamako (Modibo Keïta)", country: "Mali" },
  { code: "OUA", name: "Ouagadougou", country: "Burkina Faso" },
];

const transferOptions = [
  { id: "moto", label: "Taxi-Moto", price: "500 F", icon: Zap },
  { id: "voiture", label: "Voiture", price: "2 500 F", icon: Briefcase },
  { id: "minibus", label: "Minibus", price: "4 000 F", icon: Users },
  { id: "none", label: "Aucun", price: "", icon: X },
];

const trackingStepsPassenger = [
  "Chauffeur en route",
  "Client récupéré",
  "Arrivé à l'aéroport",
  "Vol confirmé",
  "Arrivé à destination",
  "Transfert final en cours",
  "Terminé",
];

const trackingStepsColis = [
  "Demande créée",
  "Collecte en cours",
  "Colis récupéré",
  "Déposé à l'aéroport",
  "En transit (vol)",
  "Arrivé aéroport destination",
  "En cours de livraison finale",
  "Livré",
];

const trackingStepsFret = [
  "Demande validée",
  "Collecte camionnette",
  "Chargement cargo",
  "Déposé aéroport",
  "En transit aérien",
  "Arrivé destination",
  "Retrait cargo",
  "Livraison finale",
];

const agents = [
  { name: "Koffi Adjibadé", initials: "GB", role: "Agent · Aéroport Cotonou", rating: 4.9, trips: 342 },
  { name: "Sèna Hounkpatin", initials: "HA", role: "Agent · Aéroport Lomé", rating: 4.8, trips: 215 },
  { name: "Dossou Gbétoho", initials: "DG", role: "Agent fret · Cargo CKO", rating: 4.7, trips: 178 },
];

const pricingPassenger: Record<string, number> = {
  national: 25000, regional: 85000, international: 250000,
};

const pricingColis: Record<string, Record<string, number>> = {
  document: { national: 5000, regional: 15000, international: 35000 },
  colis: { national: 12000, regional: 35000, international: 75000 },
  fragile: { national: 18000, regional: 45000, international: 95000 },
  perissable: { national: 20000, regional: 50000, international: 110000 },
  valeur: { national: 25000, regional: 60000, international: 130000 },
};

const pricingFret: Record<string, number> = {
  national: 45000, regional: 120000, international: 280000,
};

/* ─── Helpers ─── */
function getZone(from: string, to: string): "national" | "regional" | "international" {
  const fromAP = airports.find(a => a.code === from);
  const toAP = airports.find(a => a.code === to);
  if (!fromAP || !toAP) return "regional";
  if (fromAP.country === toAP.country) return "national";
  const westAfrica = ["Bénin", "Togo", "Côte d'Ivoire", "Nigeria", "Ghana", "Mali", "Burkina Faso"];
  if (westAfrica.includes(fromAP.country) && westAfrica.includes(toAP.country)) return "regional";
  return "international";
}

function generateTrackingId(prefix: string) {
  return `IPP-${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

/* ─── Sub Components ─── */
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}

function InputField({ icon: Icon, iconColor = "text-[#1E6091]", ...props }: {
  icon: typeof User; iconColor?: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-[#1E6091]/30 transition">
      <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
      <input {...props} className="flex-1 bg-transparent outline-none text-sm" />
    </div>
  );
}

function AirportSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none focus:border-[#1E6091]/30 appearance-none"
      >
        <option value="">Sélectionner un aéroport</option>
        {airports.map(a => (
          <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
        ))}
      </select>
    </div>
  );
}

function TrackingTimeline({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                done ? "bg-[#2A9D8F]" : active ? "bg-[#F77F00] ring-4 ring-orange-100" : "bg-slate-100"
              }`}>
                {done ? <Check className="w-3.5 h-3.5 text-white" /> : (
                  <span className={`text-[10px] ${active ? "text-white" : "text-slate-400"}`}>{i + 1}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-[2px] h-8 ${done ? "bg-[#2A9D8F]" : "bg-slate-100"}`} />
              )}
            </div>
            <div className="pt-1 pb-3">
              <p className={`text-xs ${done ? "text-[#2A9D8F]" : active ? "text-[#F77F00]" : "text-slate-400"}`}>
                {step}
              </p>
              {active && <p className="text-[10px] text-slate-400 mt-0.5">En cours...</p>}
              {done && <p className="text-[10px] text-slate-300 mt-0.5">Terminé</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SharePanel({ trackingId, onClose }: { trackingId: string; onClose: () => void }) {
  const shareUrl = `https://ippoo.app/track/${trackingId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Lien copié !"));
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm">Partager le suivi</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center flex-col gap-3">
          <div className="w-32 h-32 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
            <QrCode className="w-16 h-16 text-[#1E6091]" />
          </div>
          <p className="text-[10px] text-slate-400">Scannez pour suivre en temps réel</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <Link className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 flex-1 truncate">{shareUrl}</span>
          <button onClick={copyLink} className="shrink-0"><Copy className="w-4 h-4 text-[#1E6091]" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { toast.success("Partagé via WhatsApp !"); onClose(); }} className="py-3 bg-emerald-500 text-white rounded-xl text-xs flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={() => { toast.success("Envoyé par SMS !"); onClose(); }} className="py-3 bg-[#1E6091] text-white rounded-xl text-xs flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> SMS
          </button>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
          <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700">Le lien expire dans 48h. Les infos sensibles sont partiellement masquées.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Compliance Banner ─── */
function ComplianceBanner({ onAccept, accepted }: { onAccept: () => void; accepted: boolean }) {
  if (accepted) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <TriangleAlert className="w-5 h-5 text-[#D62828] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-red-800">Déclaration obligatoire</p>
          <p className="text-[10px] text-red-600/80 mt-1">
            Je confirme que mon envoi ne contient aucun produit interdit (explosifs, stupéfiants, produits chimiques).
            J'accepte les CGU et les contrôles de conformité.
          </p>
        </div>
      </div>
      <button onClick={onAccept} className="w-full py-2.5 bg-[#D62828] text-white rounded-xl text-xs flex items-center justify-center gap-2">
        <Check className="w-4 h-4" /> J'accepte les conditions
      </button>
    </div>
  );
}

/* ────────────────────────────────── MAIN COMPONENT ────────────────────────────── */
export function AirFreightPage() {
  const navigate = useNavigate();
  const config = usePlatformConfig();
  const [activeTab, setActiveTab] = useState<ServiceTab>("passagers");
  const [formStep, setFormStep] = useState<FormStep>("form");
  const [parallaxY, setParallaxY] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo">("cash");
  const [complianceAccepted, setComplianceAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Passenger state ──
  const [paxFrom, setPaxFrom] = useState("");
  const [paxTo, setPaxTo] = useState("");
  const [paxDate, setPaxDate] = useState("");
  const [paxTime, setPaxTime] = useState("");
  const [paxFlightNo, setPaxFlightNo] = useState("");
  const [paxName, setPaxName] = useState("");
  const [paxPhone, setPaxPhone] = useState("");
  const [paxTransferDepart, setPaxTransferDepart] = useState("voiture");
  const [paxTransferArrivee, setPaxTransferArrivee] = useState("voiture");
  const [paxAssistance, setPaxAssistance] = useState(false);
  const [paxTrackingStep, setPaxTrackingStep] = useState(2);

  // ── Colis state ──
  const [colisType, setColisType] = useState("colis");
  const [colisFrom, setColisFrom] = useState("CKO");
  const [colisTo, setColisTo] = useState("");
  const [colisDate, setColisDate] = useState("");
  const [colisFlightNo, setColisFlightNo] = useState("");
  const [colisSenderName, setColisSenderName] = useState("");
  const [colisSenderPhone, setColisSenderPhone] = useState("");
  const [colisReceiverName, setColisReceiverName] = useState("");
  const [colisReceiverPhone, setColisReceiverPhone] = useState("");
  const [colisWeight, setColisWeight] = useState("");
  const [colisDimensions, setColisDimensions] = useState("");
  const [colisSpeed, setColisSpeed] = useState<"standard" | "express">("standard");
  const [colisInsurance, setColisInsurance] = useState(false);
  const [colisPayerSender, setColisPayerSender] = useState(true);
  const [colisCollectAddr, setColisCollectAddr] = useState("");
  const [colisDelivAddr, setColisDelivAddr] = useState("");
  const [colisPhotos, setColisPhotos] = useState(0);
  const [colisTrackingStep, setColisTrackingStep] = useState(3);

  // ── Fret state ──
  const [fretCategory, setFretCategory] = useState("marchandise");
  const [fretFrom, setFretFrom] = useState("CKO");
  const [fretTo, setFretTo] = useState("");
  const [fretWeight, setFretWeight] = useState("");
  const [fretVolume, setFretVolume] = useState("");
  const [fretDescription, setFretDescription] = useState("");
  const [fretManutention, setFretManutention] = useState(false);
  const [fretPalette, setFretPalette] = useState(false);
  const [fretInsurance, setFretInsurance] = useState(false);
  const [fretPhotos, setFretPhotos] = useState(0);
  const [fretTrackingStep, setFretTrackingStep] = useState(1);

  const [ordering, setOrdering] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setParallaxY(el.scrollTop * 0.35);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, []);

  // Reset form step when tab changes
  useEffect(() => { setFormStep("form"); setComplianceAccepted(false); }, [activeTab]);

  const headerImg = activeTab === "passagers" ? IMG_PASSENGERS : activeTab === "colis" ? IMG_PLANE : IMG_CARGO;
  const tabColor = activeTab === "passagers" ? "#1E6091" : activeTab === "colis" ? "#2A9D8F" : "#F77F00";

  // Pricing — base pilotée par le back office (offre « IPPOO AIR »)
  const airOffer = findOffer(config, "air");
  const priceRatio = (airOffer?.priceFrom ?? AIR_REF_BASE) / AIR_REF_BASE;
  const zone = activeTab === "colis" ? getZone(colisFrom, colisTo) : activeTab === "fret" ? getZone(fretFrom, fretTo) : getZone(paxFrom, paxTo);
  const getPrice = () => {
    if (activeTab === "passagers") {
      let p = Math.round((pricingPassenger[zone] || 85000) * priceRatio);
      if (paxAssistance) p += 15000;
      const td = paxTransferDepart !== "none" ? 2500 : 0;
      const ta = paxTransferArrivee !== "none" ? 2500 : 0;
      return p + td + ta;
    }
    if (activeTab === "colis") {
      let p = Math.round((pricingColis[colisType]?.[zone] || 35000) * priceRatio);
      if (colisSpeed === "express") p = Math.round(p * 1.8);
      if (colisInsurance) p += Math.round(p * 0.1);
      return p;
    }
    let p = Math.round((pricingFret[zone] || 120000) * priceRatio);
    if (fretManutention) p += 15000;
    if (fretPalette) p += 10000;
    if (fretInsurance) p += Math.round(p * 0.12);
    return p;
  };
  const totalPrice = getPrice();

  /* ── Submit handlers ── */
  const handleSubmit = () => {
    if (activeTab === "passagers") {
      if (!paxFrom || !paxTo) { toast.error("Sélectionnez les aéroports"); return; }
      if (!paxName.trim()) { toast.error("Indiquez le nom du passager"); return; }
      if (!paxDate) { toast.error("Choisissez une date"); return; }
    } else if (activeTab === "colis") {
      if (!colisFrom || !colisTo) { toast.error("Sélectionnez les aéroports"); return; }
      if (!colisSenderName.trim()) { toast.error("Nom de l'expéditeur requis"); return; }
      if (!colisReceiverName.trim()) { toast.error("Nom du destinataire requis"); return; }
      if (!complianceAccepted) { toast.error("Acceptez la déclaration de conformité"); return; }
    } else {
      if (!fretFrom || !fretTo) { toast.error("Sélectionnez les aéroports"); return; }
      if (!fretWeight.trim()) { toast.error("Poids obligatoire"); return; }
      if (!complianceAccepted) { toast.error("Acceptez la déclaration de conformité"); return; }
    }
    setFormStep("confirm");
  };

  const handleConfirm = () => {
    setOrdering(true);
    const prefix = activeTab === "passagers" ? "PAX" : activeTab === "colis" ? "COL" : "FRT";
    let tid = generateTrackingId(prefix);

    // Persiste l'expédition dans le backend mock (repli silencieux si indisponible)
    const category = activeTab === "passagers" ? "documents" : activeTab === "colis" ? "parcel" : "cargo";
    const weightKg = activeTab === "colis"
      ? parseFloat(colisWeight) || 1
      : activeTab === "fret" ? parseFloat(fretWeight) || 1 : 1;
    api.post<{ trackingCode?: string }>("/air-freight", {
      fromAirport: activeTab === "passagers" ? paxFrom : activeTab === "colis" ? colisFrom : fretFrom,
      toAirport: activeTab === "passagers" ? paxTo : activeTab === "colis" ? colisTo : fretTo,
      weightKg,
      category,
      priceXOF: totalPrice,
    }).then((res) => { if (res?.trackingCode) tid = res.trackingCode; }).catch(() => {});

    setTimeout(() => {
      setOrdering(false);
      setTrackingId(tid);
      setFormStep("tracking");
      toast.success("Réservation IPPOO AIR confirmée !", { description: `N° ${tid} · ${totalPrice.toLocaleString()} FCFA` });
    }, 2000);
  };

  /* ── Advance tracking for demo ── */
  const advanceTracking = () => {
    if (activeTab === "passagers") setPaxTrackingStep(s => Math.min(s + 1, trackingStepsPassenger.length));
    else if (activeTab === "colis") setColisTrackingStep(s => Math.min(s + 1, trackingStepsColis.length));
    else setFretTrackingStep(s => Math.min(s + 1, trackingStepsFret.length));
    toast.success("Étape suivante !");
  };

  /* ────────────── TRACKING VIEW ────────────── */
  if (formStep === "tracking") {
    const steps = activeTab === "passagers" ? trackingStepsPassenger : activeTab === "colis" ? trackingStepsColis : trackingStepsFret;
    const currentStep = activeTab === "passagers" ? paxTrackingStep : activeTab === "colis" ? colisTrackingStep : fretTrackingStep;
    const isDone = currentStep >= steps.length;
    return (
      <div ref={scrollRef} className="min-h-screen bg-slate-50 pb-8 overflow-y-auto" style={{ height: "100vh" }}>
        {showShare && <SharePanel trackingId={trackingId} onClose={() => setShowShare(false)} />}
        {/* Header */}
        <div className="relative overflow-hidden rounded-b-[2rem] shadow-sm">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${tabColor}ee, ${tabColor}cc)` }} />
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
          <div className="relative z-10 px-5 pt-14 pb-6">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setFormStep("form")} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1">
                <h2 className="text-white flex items-center gap-2"><Plane className="w-5 h-5" /> Suivi IPPOO AIR</h2>
                <p className="text-white/70 text-xs">{serviceTabsMeta.find(t => t.key === activeTab)?.label}</p>
              </div>
              <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-sm" />
            </div>
            {/* Tracking ID card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-[10px]">N° de suivi</span>
                <button onClick={() => setShowShare(true)} className="flex items-center gap-1 text-white/70 text-[10px]">
                  <Share2 className="w-3 h-3" /> Partager
                </button>
              </div>
              <p className="text-white text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{trackingId}</p>
              <div className="flex items-center gap-3 mt-2 text-white/60 text-[10px]">
                <span>{airports.find(a => a.code === (activeTab === "passagers" ? paxFrom : activeTab === "colis" ? colisFrom : fretFrom))?.name || ""}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{airports.find(a => a.code === (activeTab === "passagers" ? paxTo : activeTab === "colis" ? colisTo : fretTo))?.name || ""}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Status */}
          <SectionCard>
            <div className="flex items-center gap-3 mb-4">
              {isDone ? <CircleCheck className="w-6 h-6 text-[#2A9D8F]" /> : <Clock className="w-6 h-6 text-[#F77F00]" />}
              <div>
                <p className="text-sm text-slate-800">{isDone ? "Terminé" : steps[currentStep]}</p>
                <p className="text-[10px] text-slate-400">{isDone ? "Votre service a été complété" : `Étape ${currentStep + 1}/${steps.length}`}</p>
              </div>
            </div>
            <TrackingTimeline steps={steps} currentStep={currentStep} />
          </SectionCard>

          {/* Agent */}
          <SectionCard>
            <label className="text-sm text-slate-500 mb-3 block">Agent assigné</label>
            <div className="flex items-center gap-3">
              <img src={getAvatar(agents[0].initials) || ""} alt={agents[0].name} className="w-11 h-11 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm">{agents[0].name}</p>
                <p className="text-[10px] text-slate-400">{agents[0].role}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href="tel:+22997000000"
                  aria-label={`Appeler ${agents[0].name}`}
                  className="w-9 h-9 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center"
                >
                  <Phone className="w-4 h-4 text-[#2A9D8F]" />
                </a>
              </div>
            </div>
          </SectionCard>

          {/* Price */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex justify-between items-center">
            <span className="text-slate-400 text-sm">Total payé</span>
            <span className="text-[#2A9D8F] text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{totalPrice.toLocaleString()} FCFA</span>
          </div>

          {/* Demo advance button */}
          {!isDone && (
            <button onClick={advanceTracking} className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs flex items-center justify-center gap-2">
              <ChevronRight className="w-4 h-4" /> Simuler étape suivante
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowShare(true)} className="py-3 bg-[#1E6091] text-white rounded-2xl text-xs flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Partager le suivi
            </button>
            <button onClick={() => navigate("/app")} className="py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs flex items-center justify-center gap-2">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────── CONFIRM VIEW ────────────── */
  if (formStep === "confirm") {
    const fromAP = airports.find(a => a.code === (activeTab === "passagers" ? paxFrom : activeTab === "colis" ? colisFrom : fretFrom));
    const toAP = airports.find(a => a.code === (activeTab === "passagers" ? paxTo : activeTab === "colis" ? colisTo : fretTo));
    return (
      <div ref={scrollRef} className="min-h-screen bg-white pb-8 overflow-y-auto" style={{ height: "100vh" }}>
        <div className="relative overflow-hidden rounded-b-[2rem] shadow-sm">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${tabColor}ee, ${tabColor}cc)` }} />
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 px-5 pt-14 pb-8 flex items-center gap-3">
            <button onClick={() => setFormStep("form")} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-white">Confirmer</h2>
              <p className="text-white/70 text-xs">Vérifiez les détails de votre réservation</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <SectionCard className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tabColor}22` }}>
                <Plane className="w-5 h-5" style={{ color: tabColor }} />
              </div>
              <div>
                <p className="text-sm">{serviceTabsMeta.find(t => t.key === activeTab)?.label}</p>
                <p className="text-xs text-slate-400">IPPOO AIR · {zone === "national" ? "National" : zone === "regional" ? "Régional" : "International"}</p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between text-sm"><span className="text-slate-400">De</span><span>{fromAP?.name || ""}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Vers</span><span>{toAP?.name || ""}</span></div>
            {activeTab === "passagers" && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Passager</span><span>{paxName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Date</span><span>{paxDate}</span></div>
                {paxFlightNo && <div className="flex justify-between text-sm"><span className="text-slate-400">Vol</span><span>{paxFlightNo}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-400">Transfert départ</span><span>{transferOptions.find(o => o.id === paxTransferDepart)?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Transfert arrivée</span><span>{transferOptions.find(o => o.id === paxTransferArrivee)?.label}</span></div>
                {paxAssistance && <div className="flex justify-between text-sm"><span className="text-slate-400">Assistance aéroport</span><span className="text-emerald-500">Incluse</span></div>}
              </>
            )}
            {activeTab === "colis" && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Type</span><span>{colisTypes.find(t => t.id === colisType)?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Expéditeur</span><span>{colisSenderName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Destinataire</span><span>{colisReceiverName}</span></div>
                {colisWeight && <div className="flex justify-between text-sm"><span className="text-slate-400">Poids</span><span>{colisWeight} kg</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-400">Vitesse</span><span>{colisSpeed === "express" ? "Express" : "Standard"}</span></div>
                {colisInsurance && <div className="flex justify-between text-sm"><span className="text-slate-400">Assurance</span><span className="text-emerald-500">Incluse</span></div>}
              </>
            )}
            {activeTab === "fret" && (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Catégorie</span><span>{fretCategories.find(c => c.id === fretCategory)?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Poids</span><span>{fretWeight} kg</span></div>
                {fretVolume && <div className="flex justify-between text-sm"><span className="text-slate-400">Volume</span><span>{fretVolume} m³</span></div>}
                {fretManutention && <div className="flex justify-between text-sm"><span className="text-slate-400">Manutention</span><span className="text-emerald-500">Incluse</span></div>}
                {fretPalette && <div className="flex justify-between text-sm"><span className="text-slate-400">Palette/emballage</span><span className="text-emerald-500">Inclus</span></div>}
                {fretInsurance && <div className="flex justify-between text-sm"><span className="text-slate-400">Assurance fret</span><span className="text-emerald-500">Incluse</span></div>}
              </>
            )}
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span>Total</span>
              <span className="text-lg" style={{ color: tabColor, fontFamily: "'Space Grotesk', monospace" }}>{totalPrice.toLocaleString()} FCFA</span>
            </div>
          </SectionCard>

          {/* Payment */}
          <SectionCard>
            <label className="text-sm text-slate-500 mb-3 block">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "cash" as const, icon: CreditCard, label: "IPPOO Cash", sub: "Solde: 45 000 FCFA" },
                { id: "momo" as const, icon: Landmark, label: "Mobile Money", sub: "MTN / Moov" },
              ].map((m) => {
                const sel = paymentMethod === m.id;
                return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  aria-pressed={sel}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${sel ? "border-[#2A9D8F] bg-emerald-50" : "border-transparent bg-slate-50"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel ? "bg-emerald-400 shadow-sm shadow-emerald-500/25" : "bg-slate-100"}`}>
                    <m.icon className={`w-5 h-5 ${sel ? "text-white" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm">{m.label}</p>
                    <p className="text-[10px] text-slate-400">{m.sub}</p>
                  </div>
                </button>
                );
              })}
            </div>
          </SectionCard>

          <button
            onClick={handleConfirm}
            disabled={ordering}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm transition-transform ${ordering ? "opacity-70 scale-[0.98]" : "active:scale-[0.98]"}`}
            style={{ background: `linear-gradient(135deg, ${tabColor}, ${tabColor}cc)`, color: "white" }}
          >
            {ordering ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmation en cours...</>
            ) : (
              <>Confirmer et payer <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ────────────────────────── MAIN FORM VIEW ──────────────────────────── */
  return (
    <div ref={scrollRef} className="min-h-screen bg-white pb-8 overflow-y-auto" style={{ height: "100vh" }}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-sm">
        <ImageWithFallback
          src={headerImg}
          alt=""
          className="absolute inset-0 w-full h-[130%] object-cover will-change-transform"
          style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${tabColor}dd, ${tabColor}bb, ${tabColor}99)` }} />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h2 className="text-white flex items-center gap-2"><Plane className="w-5 h-5" /> IPPOO AIR</h2>
              <p className="text-white/70 text-xs">Transport par avion · Passagers, Colis, Fret</p>
            </div>
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-sm" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          {serviceTabsMeta.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] transition-all ${activeTab === t.key ? `${t.bg} text-white shadow-md` : "text-slate-400"}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">

        {/* ══════════════ PASSAGERS TAB ══════════════ */}
        {activeTab === "passagers" && (
          <>
            {/* Route */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Plane className="w-4 h-4 text-[#1E6091]" /> Recherche de vol</label>
              <AirportSelect label="Aéroport de départ" value={paxFrom} onChange={setPaxFrom} />
              <AirportSelect label="Aéroport d'arrivée" value={paxTo} onChange={setPaxTo} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Date</label>
                  <input type="date" value={paxDate} onChange={e => setPaxDate(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Heure</label>
                  <input type="time" value={paxTime} onChange={e => setPaxTime(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none" />
                </div>
              </div>
              <InputField icon={Hash} placeholder="N° de vol (ex: UA2024)" value={paxFlightNo} onChange={e => setPaxFlightNo(e.target.value)} />
            </SectionCard>

            {/* Passenger info */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><User className="w-4 h-4 text-[#1E6091]" /> Informations passager</label>
              <InputField icon={User} placeholder="Nom complet" value={paxName} onChange={e => setPaxName(e.target.value)} />
              <InputField icon={Phone} placeholder="Téléphone" value={paxPhone} onChange={e => setPaxPhone(e.target.value)} type="tel" />
            </SectionCard>

            {/* Transfer options */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Truck className="w-4 h-4 text-[#2A9D8F]" /> Transfert domicile → aéroport</label>
              <div className="grid grid-cols-4 gap-2">
                {transferOptions.map(o => (
                  <button key={o.id} onClick={() => setPaxTransferDepart(o.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${paxTransferDepart === o.id ? "border-[#2A9D8F] bg-emerald-50" : "border-transparent bg-slate-50"}`}>
                    <o.icon className={`w-4 h-4 ${paxTransferDepart === o.id ? "text-[#2A9D8F]" : "text-slate-400"}`} />
                    <span className="text-[10px]">{o.label}</span>
                    <span className="text-[9px] text-slate-400">{o.price}</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Truck className="w-4 h-4 text-[#1E6091]" /> Transfert aéroport arrivée → domicile</label>
              <div className="grid grid-cols-4 gap-2">
                {transferOptions.map(o => (
                  <button key={o.id} onClick={() => setPaxTransferArrivee(o.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${paxTransferArrivee === o.id ? "border-[#1E6091] bg-blue-50" : "border-transparent bg-slate-50"}`}>
                    <o.icon className={`w-4 h-4 ${paxTransferArrivee === o.id ? "text-[#1E6091]" : "text-slate-400"}`} />
                    <span className="text-[10px]">{o.label}</span>
                    <span className="text-[9px] text-slate-400">{o.price}</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Assistance */}
            <button
              onClick={() => setPaxAssistance(!paxAssistance)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${paxAssistance ? "border-[#E9C46A] bg-amber-50" : "border-slate-100 bg-white"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paxAssistance ? "bg-[#E9C46A] shadow-sm shadow-amber-400/25" : "bg-slate-100"}`}>
                <BadgeCheck className={`w-5 h-5 ${paxAssistance ? "text-white" : "text-slate-400"}`} />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm">Assistance aéroport</p>
                <p className="text-[10px] text-slate-400">Accompagnement check-in, bagages, embarquement · +15 000 FCFA</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${paxAssistance ? "border-[#E9C46A] bg-[#E9C46A]" : "border-slate-300"}`}>
                {paxAssistance && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          </>
        )}

        {/* ══════════════ COLIS TAB ══════════════ */}
        {activeTab === "colis" && (
          <>
            {/* Type */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500">Type d'envoi</label>
              <div className="grid grid-cols-5 gap-1.5">
                {colisTypes.map(t => {
                  const sel = colisType === t.id;
                  return (
                    <button key={t.id} onClick={() => setColisType(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${sel ? `border-[#2A9D8F] ${t.lightBg}` : "border-transparent bg-slate-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel ? `bg-gradient-to-br ${t.gradient} shadow-md` : "bg-slate-100"}`}>
                        <t.icon className={`w-3.5 h-3.5 ${sel ? "text-white" : "text-slate-400"}`} />
                      </div>
                      <span className="text-[9px]">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Route */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Plane className="w-4 h-4 text-[#2A9D8F]" /> Itinéraire aérien</label>
              <AirportSelect label="Aéroport de départ" value={colisFrom} onChange={setColisFrom} />
              <AirportSelect label="Aéroport d'arrivée" value={colisTo} onChange={setColisTo} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Date du vol</label>
                  <input type="date" value={colisDate} onChange={e => setColisDate(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none" />
                </div>
                <InputField icon={Hash} placeholder="N° vol (optionnel)" value={colisFlightNo} onChange={e => setColisFlightNo(e.target.value)} />
              </div>
            </SectionCard>

            {/* Weight / Dimensions / Photos */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Weight className="w-4 h-4 text-[#F77F00]" /> Détails du colis</label>
              <div className="grid grid-cols-2 gap-2">
                <InputField icon={Weight} placeholder="Poids (kg)" value={colisWeight} onChange={e => setColisWeight(e.target.value)} type="number" />
                <InputField icon={Package} placeholder="L×l×h (cm)" value={colisDimensions} onChange={e => setColisDimensions(e.target.value)} />
              </div>
              <button
                onClick={() => { setColisPhotos(p => Math.min(p + 1, 4)); toast.success("Photo ajoutée !"); }}
                className={`w-full border-2 border-dashed rounded-2xl py-4 flex flex-col items-center gap-1 transition ${colisPhotos > 0 ? "border-emerald-300 bg-emerald-50/30" : "border-blue-200"}`}
              >
                <Camera className={`w-5 h-5 ${colisPhotos > 0 ? "text-emerald-500" : "text-[#1E6091]"}`} />
                <span className="text-xs text-slate-500">{colisPhotos > 0 ? `${colisPhotos} photo(s) · Appuyez pour ajouter` : "Photos du colis (obligatoire)"}</span>
              </button>
            </SectionCard>

            {/* Sender / Receiver */}
            <SectionCard className="space-y-2.5">
              <label className="text-sm text-slate-500">Expéditeur</label>
              <InputField icon={User} iconColor="text-[#1E6091]" placeholder="Nom" value={colisSenderName} onChange={e => setColisSenderName(e.target.value)} />
              <InputField icon={Phone} iconColor="text-[#1E6091]" placeholder="Téléphone" value={colisSenderPhone} onChange={e => setColisSenderPhone(e.target.value)} type="tel" />
              {colisCollectAddr !== null && <InputField icon={MapPin} iconColor="text-[#1E6091]" placeholder="Adresse de collecte (optionnel)" value={colisCollectAddr} onChange={e => setColisCollectAddr(e.target.value)} />}
            </SectionCard>

            <SectionCard className="space-y-2.5">
              <label className="text-sm text-slate-500">Destinataire</label>
              <InputField icon={User} iconColor="text-[#2A9D8F]" placeholder="Nom" value={colisReceiverName} onChange={e => setColisReceiverName(e.target.value)} />
              <InputField icon={Phone} iconColor="text-[#2A9D8F]" placeholder="Téléphone" value={colisReceiverPhone} onChange={e => setColisReceiverPhone(e.target.value)} type="tel" />
              <InputField icon={MapPin} iconColor="text-[#2A9D8F]" placeholder="Adresse de livraison finale" value={colisDelivAddr} onChange={e => setColisDelivAddr(e.target.value)} />
            </SectionCard>

            {/* Speed */}
            <SectionCard>
              <label className="text-sm text-slate-500 mb-3 block">Vitesse</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => setColisSpeed("express")} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${colisSpeed === "express" ? "border-[#F77F00] bg-orange-50" : "border-transparent bg-slate-50"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colisSpeed === "express" ? "bg-[#F77F00] shadow-md" : "bg-slate-100"}`}>
                    <Zap className={`w-4 h-4 ${colisSpeed === "express" ? "text-white" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left"><p className="text-sm">Express</p><p className="text-[10px] text-slate-400">Prioritaire ×1.8</p></div>
                </button>
                <button onClick={() => setColisSpeed("standard")} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${colisSpeed === "standard" ? "border-[#1E6091] bg-blue-50" : "border-transparent bg-slate-50"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colisSpeed === "standard" ? "bg-[#1E6091] shadow-md" : "bg-slate-100"}`}>
                    <Clock className={`w-4 h-4 ${colisSpeed === "standard" ? "text-white" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left"><p className="text-sm">Standard</p><p className="text-[10px] text-slate-400">Délai normal</p></div>
                </button>
              </div>
            </SectionCard>

            {/* Options row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setColisInsurance(!colisInsurance)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${colisInsurance ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white"}`}
              >
                <ShieldCheck className={`w-5 h-5 ${colisInsurance ? "text-emerald-500" : "text-slate-400"}`} />
                <div className="text-left"><p className="text-xs">Assurance</p><p className="text-[9px] text-slate-400">+10%</p></div>
              </button>
              <button
                onClick={() => setColisPayerSender(!colisPayerSender)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${colisPayerSender ? "border-[#1E6091] bg-blue-50" : "border-[#2A9D8F] bg-emerald-50"}`}
              >
                <CreditCard className={`w-5 h-5 ${colisPayerSender ? "text-[#1E6091]" : "text-[#2A9D8F]"}`} />
                <div className="text-left"><p className="text-xs">Payeur</p><p className="text-[9px] text-slate-400">{colisPayerSender ? "Expéditeur" : "Destinataire"}</p></div>
              </button>
            </div>

            {/* Compliance */}
            <ComplianceBanner accepted={complianceAccepted} onAccept={() => setComplianceAccepted(true)} />
          </>
        )}

        {/* ══════════════ FRET TAB ══════════════ */}
        {activeTab === "fret" && (
          <>
            {/* Category */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Truck className="w-4 h-4 text-[#F77F00]" /> Nature du bien</label>
              <div className="grid grid-cols-2 gap-2">
                {fretCategories.map(c => {
                  const sel = fretCategory === c.id;
                  return (
                    <button key={c.id} onClick={() => setFretCategory(c.id)} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition ${sel ? "border-[#F77F00] bg-orange-50" : "border-transparent bg-slate-50"}`}>
                      <c.icon className={`w-5 h-5 ${sel ? "text-[#F77F00]" : "text-slate-400"}`} />
                      <span className="text-xs">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Route */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Plane className="w-4 h-4 text-[#F77F00]" /> Itinéraire cargo</label>
              <AirportSelect label="Aéroport cargo départ" value={fretFrom} onChange={setFretFrom} />
              <AirportSelect label="Aéroport cargo arrivée" value={fretTo} onChange={setFretTo} />
            </SectionCard>

            {/* Details */}
            <SectionCard className="space-y-3">
              <label className="text-sm text-slate-500 flex items-center gap-2"><Weight className="w-4 h-4 text-[#D62828]" /> Poids & Volume</label>
              <div className="grid grid-cols-2 gap-2">
                <InputField icon={Weight} placeholder="Poids (kg)" value={fretWeight} onChange={e => setFretWeight(e.target.value)} type="number" />
                <InputField icon={Package} placeholder="Volume (m³)" value={fretVolume} onChange={e => setFretVolume(e.target.value)} />
              </div>
              <textarea
                placeholder="Description du bien, factures, autorisations..."
                value={fretDescription}
                onChange={e => setFretDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none resize-none"
              />
              <button
                onClick={() => { setFretPhotos(p => Math.min(p + 1, 6)); toast.success("Photo/document ajouté !"); }}
                className={`w-full border-2 border-dashed rounded-2xl py-4 flex flex-col items-center gap-1 transition ${fretPhotos > 0 ? "border-emerald-300 bg-emerald-50/30" : "border-orange-200"}`}
              >
                <Camera className={`w-5 h-5 ${fretPhotos > 0 ? "text-emerald-500" : "text-[#F77F00]"}`} />
                <span className="text-xs text-slate-500">{fretPhotos > 0 ? `${fretPhotos} fichier(s) · Photos + Documents` : "Photos & documents (facture, autorisation)"}</span>
              </button>
            </SectionCard>

            {/* Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFretManutention(!fretManutention)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition ${fretManutention ? "border-[#F77F00] bg-orange-50" : "border-slate-100 bg-white"}`}
              >
                <Users className={`w-5 h-5 ${fretManutention ? "text-[#F77F00]" : "text-slate-400"}`} />
                <span className="text-[10px]">Manutention</span>
                <span className="text-[9px] text-slate-400">+15 000 F</span>
              </button>
              <button
                onClick={() => setFretPalette(!fretPalette)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition ${fretPalette ? "border-[#E9C46A] bg-amber-50" : "border-slate-100 bg-white"}`}
              >
                <Package className={`w-5 h-5 ${fretPalette ? "text-[#E9C46A]" : "text-slate-400"}`} />
                <span className="text-[10px]">Palette</span>
                <span className="text-[9px] text-slate-400">+10 000 F</span>
              </button>
              <button
                onClick={() => setFretInsurance(!fretInsurance)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition ${fretInsurance ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white"}`}
              >
                <ShieldCheck className={`w-5 h-5 ${fretInsurance ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="text-[10px]">Assurance</span>
                <span className="text-[9px] text-slate-400">+12%</span>
              </button>
            </div>

            {/* Compliance */}
            <ComplianceBanner accepted={complianceAccepted} onAccept={() => setComplianceAccepted(true)} />
          </>
        )}

        {/* ── Agents ── */}
        <div>
          <label className="text-sm text-slate-500 mb-3 block">Agents IPPOO AIR disponibles</label>
          <div className="space-y-2.5">
            {agents.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <img src={getAvatar(a.initials) || ""} alt={a.name} className="w-11 h-11 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.name}</p>
                  <p className="text-[10px] text-slate-400">{a.role}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-600">{a.rating}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">{a.trips} ops</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Price summary ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">
              {activeTab === "passagers" ? "Voyage" : activeTab === "colis" ? "Envoi" : "Fret"} · {zone === "national" ? "National" : zone === "regional" ? "Régional" : "International"}
            </span>
            <span className="text-lg" style={{ color: tabColor, fontFamily: "'Space Grotesk', monospace" }}>
              {totalPrice.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
          <Info className="w-4 h-4 text-[#1E6091] mt-0.5 shrink-0" />
          <p className="text-xs text-[#1E6091]/80">
            {activeTab === "passagers"
              ? "Les informations de vol (heure, statut) seront mises à jour automatiquement si disponibles. Sinon, saisie manuelle par l'agent."
              : "Les envois internationaux nécessitent une pièce d'identité valide. Contenu soumis à contrôle de conformité."}
          </p>
        </div>

        {/* ── Referral Banner ── */}
        <button
          onClick={() => navigate("/app/referral")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#E9C46A]/15 to-[#F77F00]/15 border border-[#E9C46A]/30"
        >
          <div className="w-10 h-10 bg-[#E9C46A] rounded-xl flex items-center justify-center shadow-md shadow-amber-400/25">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm text-slate-800">Parrainage IPPOO AIR</p>
            <p className="text-[10px] text-slate-500">Invitez un ami, gagnez des bonus après sa 1ère réservation</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm active:scale-[0.98] transition-transform"
          style={{ background: `linear-gradient(135deg, ${tabColor}, ${tabColor}cc)`, color: "white" }}
        >
          Continuer <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
