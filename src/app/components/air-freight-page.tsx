import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plane, Package, FileText, ShieldCheck, Weight,
  MapPin, User, Phone, Clock, Zap, ChevronRight, Camera, Check, X,
  Calendar, AlertTriangle, Info, Landmark, CreditCard,
  Users, Share2, QrCode, Copy, Link, Truck, Briefcase,
  ArrowRight, Star, CircleCheck, Hash,
  Building2, TriangleAlert, Shield, BadgeCheck, Gift
} from "lucide-react";
import { toast } from "sonner";
import { getAvatar } from "./avatars";
import { api } from "../api/client";
import { usePlatformConfig, findOffer } from "../store/platform-config";
import { M3Page, M3Card, M3Button, SectionHeader } from "./m3";

/** Base de référence (passager national) servant à mettre les tarifs aériens à l'échelle. */
const AIR_REF_BASE = 25000;
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

/* --- Types --- */
type ServiceTab = "passagers" | "colis" | "fret";
type FormStep = "form" | "confirm" | "tracking" | "share";

/* --- Data --- */
const serviceTabsMeta: { key: ServiceTab; label: string; icon: typeof Plane }[] = [
  { key: "passagers", label: "Passagers", icon: Users },
  { key: "colis", label: "Colis & Docs", icon: Package },
  { key: "fret", label: "Fret Cargo", icon: Truck },
];

const colisTypes = [
  { id: "document", icon: FileText, label: "Document", weight: "< 1 kg" },
  { id: "colis", icon: Package, label: "Colis", weight: "1-30 kg" },
  { id: "fragile", icon: AlertTriangle, label: "Fragile", weight: "1-20 kg" },
  { id: "perissable", icon: Clock, label: "Périssable", weight: "1-15 kg" },
  { id: "valeur", icon: ShieldCheck, label: "Valeur", weight: "< 5 kg" },
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

interface FreightAgent { name: string; initials: string; role: string; rating: number; trips: number; }
const agents: FreightAgent[] = [];

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

/* --- Helpers --- */
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

/* --- Sub Components --- */
function InputField({ icon: Icon, ...props }: {
  icon: typeof User; iconColor?: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
      <Icon className="h-4 w-4 shrink-0 text-[var(--m3-primary)]" />
      <input placeholder={props.placeholder} value={props.value} onChange={props.onChange} type={props.type} className="flex-1 bg-transparent text-sm outline-none" />
    </div>
  );
}

function AirportSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--m3-primary)]"
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
              <div
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all"
                style={done ? { background: "var(--m3-primary)" } : active ? { background: "var(--m3-accent)" } : { background: "#f1f5f9" }}
              >
                {done ? <Check className="h-3.5 w-3.5 text-white" /> : (
                  <span className={`text-[10px] ${active ? "text-white" : "text-slate-400"}`}>{i + 1}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="h-8 w-[2px]" style={{ background: done ? "var(--m3-primary)" : "#f1f5f9" }} />
              )}
            </div>
            <div className="pb-3 pt-1">
              <p className="text-xs" style={{ color: done ? "var(--m3-primary)" : active ? "var(--m3-accent)" : "#94a3b8" }}>
                {step}
              </p>
              {active && <p className="mt-0.5 text-[10px] text-slate-400">En cours...</p>}
              {done && <p className="mt-0.5 text-[10px] text-slate-300">Terminé</p>}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Partager le suivi</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <QrCode className="h-16 w-16 text-[var(--m3-primary)]" />
          </div>
          <p className="text-[10px] text-slate-400">Scannez pour suivre en temps réel</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <Link className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="flex-1 truncate text-xs text-slate-500">{shareUrl}</span>
          <button onClick={copyLink} className="shrink-0"><Copy className="h-4 w-4 text-[var(--m3-primary)]" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { toast.success("Partagé via WhatsApp !"); onClose(); }} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs text-white">
            <Share2 className="h-4 w-4" /> WhatsApp
          </button>
          <button onClick={() => { toast.success("Envoyé par SMS !"); onClose(); }} className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs text-white" style={{ background: "var(--m3-primary)" }}>
            <Share2 className="h-4 w-4" /> SMS
          </button>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-[10px] text-amber-700">Le lien expire dans 48h. Les infos sensibles sont partiellement masquées.</p>
        </div>
      </div>
    </div>
  );
}

/* --- Compliance Banner --- */
function ComplianceBanner({ onAccept, accepted }: { onAccept: () => void; accepted: boolean }) {
  if (accepted) return null;
  return (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="text-xs font-semibold text-red-800">Déclaration obligatoire</p>
          <p className="mt-1 text-[10px] text-red-600/80">
            Je confirme que mon envoi ne contient aucun produit interdit (explosifs, stupéfiants, produits chimiques).
            J'accepte les CGU et les contrôles de conformité.
          </p>
        </div>
      </div>
      <button onClick={onAccept} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs text-white">
        <Check className="h-4 w-4" /> J'accepte les conditions
      </button>
    </div>
  );
}

/* ---------------------------------- MAIN COMPONENT ------------------------------ */
export function AirFreightPage() {
  const navigate = useNavigate();
  const config = usePlatformConfig();
  const [activeTab, setActiveTab] = useState<ServiceTab>("passagers");
  const [formStep, setFormStep] = useState<FormStep>("form");
  const [showShare, setShowShare] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo">("cash");
  const [complianceAccepted, setComplianceAccepted] = useState(false);

  // -- Passenger state --
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

  // -- Colis state --
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

  // -- Fret state --
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

  const tabLabel = serviceTabsMeta.find(t => t.key === activeTab)?.label;

  // Pricing - base pilotée par le back office (offre « IPPOO AIR »)
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
  const zoneLabel = zone === "national" ? "National" : zone === "regional" ? "Régional" : "International";

  const logoTrailing = <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-sm" />;

  /* -- Submit handlers -- */
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

  /* -------------- TRACKING VIEW -------------- */
  if (formStep === "tracking") {
    const steps = activeTab === "passagers" ? trackingStepsPassenger : activeTab === "colis" ? trackingStepsColis : trackingStepsFret;
    const currentStep = activeTab === "passagers" ? paxTrackingStep : activeTab === "colis" ? colisTrackingStep : fretTrackingStep;
    const isDone = currentStep >= steps.length;
    const fromName = airports.find(a => a.code === (activeTab === "passagers" ? paxFrom : activeTab === "colis" ? colisFrom : fretFrom))?.name || "";
    const toName = airports.find(a => a.code === (activeTab === "passagers" ? paxTo : activeTab === "colis" ? colisTo : fretTo))?.name || "";
    return (
      <>
        {showShare && <SharePanel trackingId={trackingId} onClose={() => setShowShare(false)} />}
        <M3Page title="Suivi IPPOO AIR" subtitle={tabLabel} icon={Plane} back={false} trailing={logoTrailing}>
          {/* Carte N° de suivi */}
          <M3Card tonal>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] opacity-60">N° de suivi</span>
              <button onClick={() => setShowShare(true)} className="flex items-center gap-1 text-[10px] opacity-80">
                <Share2 className="h-3 w-3" /> Partager
              </button>
            </div>
            <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace" }}>{trackingId}</p>
            <div className="mt-2 flex items-center gap-3 text-[10px] opacity-70">
              <span>{fromName}</span>
              <ArrowRight className="h-3 w-3" />
              <span>{toName}</span>
            </div>
          </M3Card>

          {/* Statut */}
          <SectionHeader title="Progression" icon={Clock} />
          <M3Card>
            <div className="mb-4 flex items-center gap-3">
              {isDone ? <CircleCheck className="h-6 w-6 text-[var(--m3-primary)]" /> : <Clock className="h-6 w-6 text-[var(--m3-accent)]" />}
              <div>
                <p className="text-sm font-semibold text-slate-800">{isDone ? "Terminé" : steps[currentStep]}</p>
                <p className="text-[10px] text-slate-400">{isDone ? "Votre service a été complété" : `Étape ${currentStep + 1}/${steps.length}`}</p>
              </div>
            </div>
            <TrackingTimeline steps={steps} currentStep={currentStep} />
          </M3Card>

          {/* Agent */}
          <SectionHeader title="Agent assigné" icon={User} />
          <M3Card>
            {agents[0] ? (
              <div className="flex items-center gap-3">
                <img src={getAvatar(agents[0].initials) || ""} alt={agents[0].name} className="h-11 w-11 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{agents[0].name}</p>
                  <p className="text-[10px] text-slate-400">{agents[0].role}</p>
                </div>
                <a
                  href="tel:+22997000000"
                  aria-label={`Appeler ${agents[0].name}`}
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Un agent vous sera assigné dès la prise en charge de votre envoi.</p>
            )}
          </M3Card>

          {/* Prix */}
          <M3Card tonal className="mt-3 flex items-center justify-between">
            <span className="text-sm opacity-70">Total payé</span>
            <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace" }}>{totalPrice.toLocaleString()} FCFA</span>
          </M3Card>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <M3Button variant="tonal" onClick={() => setShowShare(true)} icon={Share2}>Partager</M3Button>
            <M3Button variant="outlined" onClick={() => navigate("/app")}>Accueil</M3Button>
          </div>
        </M3Page>
      </>
    );
  }

  /* -------------- CONFIRM VIEW -------------- */
  if (formStep === "confirm") {
    const fromAP = airports.find(a => a.code === (activeTab === "passagers" ? paxFrom : activeTab === "colis" ? colisFrom : fretFrom));
    const toAP = airports.find(a => a.code === (activeTab === "passagers" ? paxTo : activeTab === "colis" ? colisTo : fretTo));
    return (
      <M3Page title="Confirmer" subtitle="Vérifiez les détails de votre réservation" icon={BadgeCheck} back={false} trailing={logoTrailing}>
        <M3Button variant="text" full={false} onClick={() => setFormStep("form")}>← Modifier</M3Button>

        <M3Card className="mt-3 space-y-3">
          <div className="mb-1 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{tabLabel}</p>
              <p className="text-xs text-slate-400">IPPOO AIR · {zoneLabel}</p>
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
          <div className="mt-1 flex justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{totalPrice.toLocaleString()} FCFA</span>
          </div>
        </M3Card>

        {/* Paiement */}
        <SectionHeader title="Mode de paiement" icon={CreditCard} />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "cash" as const, icon: CreditCard, label: "IPPOO Cash", sub: "Solde: 45 000 FCFA" },
            { id: "momo" as const, icon: Landmark, label: "Mobile Money", sub: "MTN / Moov" },
          ].map((m) => {
            const sel = paymentMethod === m.id;
            return (
              <M3Card
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className="flex items-center gap-3"
                style={sel ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={sel ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-[10px] text-slate-400">{m.sub}</p>
                </div>
              </M3Card>
            );
          })}
        </div>

        <div className="mt-5">
          <M3Button onClick={handleConfirm} disabled={ordering} icon={ordering ? undefined : ChevronRight}>
            {ordering ? "Confirmation en cours..." : "Confirmer et payer"}
          </M3Button>
        </div>
      </M3Page>
    );
  }

  /* -------------------------- MAIN FORM VIEW ---------------------------- */
  const tabsBar = (
    <div className="flex rounded-2xl bg-white/15 p-1 backdrop-blur-sm">
      {serviceTabsMeta.map(t => (
        <button
          key={t.key}
          onClick={() => { setActiveTab(t.key); setFormStep("form"); setComplianceAccepted(false); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold transition-all"
          style={activeTab === t.key ? { background: "#fff", color: "var(--m3-primary)" } : { color: "var(--m3-on-primary)" }}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <M3Page title="IPPOO AIR" subtitle="Transport par avion · Passagers, Colis, Fret" icon={Plane} trailing={logoTrailing} hero={tabsBar}>

      {/* -------------- PASSAGERS TAB -------------- */}
      {activeTab === "passagers" && (
        <>
          <SectionHeader title="Recherche de vol" icon={Plane} />
          <M3Card className="space-y-3">
            <AirportSelect label="Aéroport de départ" value={paxFrom} onChange={setPaxFrom} />
            <AirportSelect label="Aéroport d'arrivée" value={paxTo} onChange={setPaxTo} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Date</label>
                <input type="date" value={paxDate} onChange={e => setPaxDate(e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Heure</label>
                <input type="time" value={paxTime} onChange={e => setPaxTime(e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <InputField icon={Hash} placeholder="N° de vol (ex: UA2024)" value={paxFlightNo} onChange={e => setPaxFlightNo(e.target.value)} />
          </M3Card>

          <SectionHeader title="Informations passager" icon={User} />
          <M3Card className="space-y-3">
            <InputField icon={User} placeholder="Nom complet" value={paxName} onChange={e => setPaxName(e.target.value)} />
            <InputField icon={Phone} placeholder="Téléphone" value={paxPhone} onChange={e => setPaxPhone(e.target.value)} type="tel" />
          </M3Card>

          <SectionHeader title="Transfert domicile → aéroport" icon={Truck} />
          <div className="grid grid-cols-4 gap-2">
            {transferOptions.map(o => {
              const sel = paxTransferDepart === o.id;
              return (
                <M3Card key={o.id} onClick={() => setPaxTransferDepart(o.id)} className="!p-3 flex flex-col items-center gap-1" style={sel ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
                  <o.icon className={`h-4 w-4 ${sel ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
                  <span className="text-[10px]">{o.label}</span>
                  <span className="text-[9px] text-slate-400">{o.price}</span>
                </M3Card>
              );
            })}
          </div>

          <SectionHeader title="Transfert aéroport → domicile" icon={Truck} />
          <div className="grid grid-cols-4 gap-2">
            {transferOptions.map(o => {
              const sel = paxTransferArrivee === o.id;
              return (
                <M3Card key={o.id} onClick={() => setPaxTransferArrivee(o.id)} className="!p-3 flex flex-col items-center gap-1" style={sel ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
                  <o.icon className={`h-4 w-4 ${sel ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
                  <span className="text-[10px]">{o.label}</span>
                  <span className="text-[9px] text-slate-400">{o.price}</span>
                </M3Card>
              );
            })}
          </div>

          <M3Card
            onClick={() => setPaxAssistance(!paxAssistance)}
            className="mt-3 flex items-center gap-4"
            style={paxAssistance ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={paxAssistance ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Assistance aéroport</p>
              <p className="text-[10px] text-slate-400">Accompagnement check-in, bagages, embarquement · +15 000 FCFA</p>
            </div>
            <div className="grid h-5 w-5 place-items-center rounded-full border-2" style={paxAssistance ? { background: "var(--m3-primary)", borderColor: "var(--m3-primary)" } : { borderColor: "#cbd5e1" }}>
              {paxAssistance && <Check className="h-3 w-3 text-white" />}
            </div>
          </M3Card>
        </>
      )}

      {/* -------------- COLIS TAB -------------- */}
      {activeTab === "colis" && (
        <>
          <SectionHeader title="Type d'envoi" icon={Package} />
          <div className="grid grid-cols-5 gap-1.5">
            {colisTypes.map(t => {
              const sel = colisType === t.id;
              return (
                <M3Card key={t.id} onClick={() => setColisType(t.id)} className="!p-2.5 flex flex-col items-center gap-1" style={sel ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
                  <div className="grid h-8 w-8 place-items-center rounded-lg" style={sel ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                    <t.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[9px]">{t.label}</span>
                </M3Card>
              );
            })}
          </div>

          <SectionHeader title="Itinéraire aérien" icon={Plane} />
          <M3Card className="space-y-3">
            <AirportSelect label="Aéroport de départ" value={colisFrom} onChange={setColisFrom} />
            <AirportSelect label="Aéroport d'arrivée" value={colisTo} onChange={setColisTo} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Date du vol</label>
                <input type="date" value={colisDate} onChange={e => setColisDate(e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none" />
              </div>
              <InputField icon={Hash} placeholder="N° vol (optionnel)" value={colisFlightNo} onChange={e => setColisFlightNo(e.target.value)} />
            </div>
          </M3Card>

          <SectionHeader title="Détails du colis" icon={Weight} />
          <M3Card className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <InputField icon={Weight} placeholder="Poids (kg)" value={colisWeight} onChange={e => setColisWeight(e.target.value)} type="number" />
              <InputField icon={Package} placeholder="L×l×h (cm)" value={colisDimensions} onChange={e => setColisDimensions(e.target.value)} />
            </div>
            <button
              onClick={() => { setColisPhotos(p => Math.min(p + 1, 4)); toast.success("Photo ajoutée !"); }}
              className={`flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed py-4 transition ${colisPhotos > 0 ? "border-emerald-300 bg-emerald-50/30" : "border-[var(--m3-primary)]/40"}`}
            >
              <Camera className={`h-5 w-5 ${colisPhotos > 0 ? "text-emerald-500" : "text-[var(--m3-primary)]"}`} />
              <span className="text-xs text-slate-500">{colisPhotos > 0 ? `${colisPhotos} photo(s) · Appuyez pour ajouter` : "Photos du colis (obligatoire)"}</span>
            </button>
          </M3Card>

          <SectionHeader title="Expéditeur" icon={User} />
          <M3Card className="space-y-2.5">
            <InputField icon={User} placeholder="Nom" value={colisSenderName} onChange={e => setColisSenderName(e.target.value)} />
            <InputField icon={Phone} placeholder="Téléphone" value={colisSenderPhone} onChange={e => setColisSenderPhone(e.target.value)} type="tel" />
            <InputField icon={MapPin} placeholder="Adresse de collecte (optionnel)" value={colisCollectAddr} onChange={e => setColisCollectAddr(e.target.value)} />
          </M3Card>

          <SectionHeader title="Destinataire" icon={User} />
          <M3Card className="space-y-2.5">
            <InputField icon={User} placeholder="Nom" value={colisReceiverName} onChange={e => setColisReceiverName(e.target.value)} />
            <InputField icon={Phone} placeholder="Téléphone" value={colisReceiverPhone} onChange={e => setColisReceiverPhone(e.target.value)} type="tel" />
            <InputField icon={MapPin} placeholder="Adresse de livraison finale" value={colisDelivAddr} onChange={e => setColisDelivAddr(e.target.value)} />
          </M3Card>

          <SectionHeader title="Vitesse" icon={Zap} />
          <div className="grid grid-cols-2 gap-2.5">
            <M3Card onClick={() => setColisSpeed("express")} className="flex items-center gap-3" style={colisSpeed === "express" ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <div className="grid h-9 w-9 place-items-center rounded-xl" style={colisSpeed === "express" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-left"><p className="text-sm font-semibold">Express</p><p className="text-[10px] text-slate-400">Prioritaire ×1.8</p></div>
            </M3Card>
            <M3Card onClick={() => setColisSpeed("standard")} className="flex items-center gap-3" style={colisSpeed === "standard" ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <div className="grid h-9 w-9 place-items-center rounded-xl" style={colisSpeed === "standard" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-left"><p className="text-sm font-semibold">Standard</p><p className="text-[10px] text-slate-400">Délai normal</p></div>
            </M3Card>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <M3Card onClick={() => setColisInsurance(!colisInsurance)} className="flex items-center gap-3" style={colisInsurance ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <ShieldCheck className={`h-5 w-5 ${colisInsurance ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
              <div className="text-left"><p className="text-xs font-semibold">Assurance</p><p className="text-[9px] text-slate-400">+10%</p></div>
            </M3Card>
            <M3Card onClick={() => setColisPayerSender(!colisPayerSender)} className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[var(--m3-primary)]" />
              <div className="text-left"><p className="text-xs font-semibold">Payeur</p><p className="text-[9px] text-slate-400">{colisPayerSender ? "Expéditeur" : "Destinataire"}</p></div>
            </M3Card>
          </div>

          <div className="mt-2.5">
            <ComplianceBanner accepted={complianceAccepted} onAccept={() => setComplianceAccepted(true)} />
          </div>
        </>
      )}

      {/* -------------- FRET TAB -------------- */}
      {activeTab === "fret" && (
        <>
          <SectionHeader title="Nature du bien" icon={Truck} />
          <div className="grid grid-cols-2 gap-2">
            {fretCategories.map(c => {
              const sel = fretCategory === c.id;
              return (
                <M3Card key={c.id} onClick={() => setFretCategory(c.id)} className="!p-3.5 flex items-center gap-3" style={sel ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
                  <c.icon className={`h-5 w-5 ${sel ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
                  <span className="text-xs">{c.label}</span>
                </M3Card>
              );
            })}
          </div>

          <SectionHeader title="Itinéraire cargo" icon={Plane} />
          <M3Card className="space-y-3">
            <AirportSelect label="Aéroport cargo départ" value={fretFrom} onChange={setFretFrom} />
            <AirportSelect label="Aéroport cargo arrivée" value={fretTo} onChange={setFretTo} />
          </M3Card>

          <SectionHeader title="Poids & Volume" icon={Weight} />
          <M3Card className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <InputField icon={Weight} placeholder="Poids (kg)" value={fretWeight} onChange={e => setFretWeight(e.target.value)} type="number" />
              <InputField icon={Package} placeholder="Volume (m³)" value={fretVolume} onChange={e => setFretVolume(e.target.value)} />
            </div>
            <textarea
              placeholder="Description du bien, factures, autorisations..."
              value={fretDescription}
              onChange={e => setFretDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none"
            />
            <button
              onClick={() => { setFretPhotos(p => Math.min(p + 1, 6)); toast.success("Photo/document ajouté !"); }}
              className={`flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed py-4 transition ${fretPhotos > 0 ? "border-emerald-300 bg-emerald-50/30" : "border-[var(--m3-primary)]/40"}`}
            >
              <Camera className={`h-5 w-5 ${fretPhotos > 0 ? "text-emerald-500" : "text-[var(--m3-primary)]"}`} />
              <span className="text-xs text-slate-500">{fretPhotos > 0 ? `${fretPhotos} fichier(s) · Photos + Documents` : "Photos & documents (facture, autorisation)"}</span>
            </button>
          </M3Card>

          <SectionHeader title="Options" icon={Shield} />
          <div className="grid grid-cols-3 gap-2">
            <M3Card onClick={() => setFretManutention(!fretManutention)} className="!p-3 flex flex-col items-center gap-1.5" style={fretManutention ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <Users className={`h-5 w-5 ${fretManutention ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
              <span className="text-[10px]">Manutention</span>
              <span className="text-[9px] text-slate-400">+15 000 F</span>
            </M3Card>
            <M3Card onClick={() => setFretPalette(!fretPalette)} className="!p-3 flex flex-col items-center gap-1.5" style={fretPalette ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <Package className={`h-5 w-5 ${fretPalette ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
              <span className="text-[10px]">Palette</span>
              <span className="text-[9px] text-slate-400">+10 000 F</span>
            </M3Card>
            <M3Card onClick={() => setFretInsurance(!fretInsurance)} className="!p-3 flex flex-col items-center gap-1.5" style={fretInsurance ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}>
              <ShieldCheck className={`h-5 w-5 ${fretInsurance ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
              <span className="text-[10px]">Assurance</span>
              <span className="text-[9px] text-slate-400">+12%</span>
            </M3Card>
          </div>

          <div className="mt-2.5">
            <ComplianceBanner accepted={complianceAccepted} onAccept={() => setComplianceAccepted(true)} />
          </div>
        </>
      )}

      {/* -- Agents (vide par défaut) -- */}
      {agents.length > 0 && (
        <>
          <SectionHeader title="Agents IPPOO AIR disponibles" icon={Users} />
          <div className="space-y-2.5">
            {agents.map((a, i) => (
              <M3Card key={i} className="flex items-center gap-3">
                <img src={getAvatar(a.initials) || ""} alt={a.name} className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <p className="text-[10px] text-slate-400">{a.role}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-slate-600">{a.rating}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">{a.trips} ops</p>
                </div>
              </M3Card>
            ))}
          </div>
        </>
      )}

      {/* -- Prix -- */}
      <M3Card tonal className="mt-4 flex items-center justify-between">
        <span className="text-sm opacity-70">
          {activeTab === "passagers" ? "Voyage" : activeTab === "colis" ? "Envoi" : "Fret"} · {zoneLabel}
        </span>
        <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace" }}>
          {totalPrice.toLocaleString()} FCFA
        </span>
      </M3Card>

      {/* -- Info -- */}
      <div className="mt-3 flex items-start gap-3 rounded-2xl p-4" style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--m3-primary)]" />
        <p className="text-xs">
          {activeTab === "passagers"
            ? "Les informations de vol (heure, statut) seront mises à jour automatiquement si disponibles. Sinon, saisie manuelle par l'agent."
            : "Les envois internationaux nécessitent une pièce d'identité valide. Contenu soumis à contrôle de conformité."}
        </p>
      </div>

      {/* -- Parrainage -- */}
      <M3Card onClick={() => navigate("/app/referral")} className="mt-3 flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--m3-accent)", color: "#fff" }}>
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">Parrainage IPPOO AIR</p>
          <p className="text-[10px] text-slate-500">Invitez un ami, gagnez des bonus après sa 1ère réservation</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </M3Card>

      <div className="mt-5">
        <M3Button onClick={handleSubmit} icon={ChevronRight}>Continuer</M3Button>
      </div>
    </M3Page>
  );
}
