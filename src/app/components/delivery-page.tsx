import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Camera, User, Phone, Zap, Clock, ChevronRight,
  FileText, Box, AlertTriangle, Weight, MapPin, Navigation, Check, X, PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { usePlatformConfig, findOffer } from "../store/platform-config";
import deliveryHeaderImg from "figma:asset/c3680b506d82e1e5ee8aa062c6524415e9f21293.png";
import { M3Page, M3Card, M3Button, SectionHeader } from "./m3";

/** Base de référence (prix « paquet standard ») servant à mettre la grille à l'échelle. */
const DELIVERY_REF_BASE = 1500;

const parcelTypes = [
  { id: "document", icon: FileText, label: "Document", weight: "< 1 kg" },
  { id: "paquet", icon: Box, label: "Paquet", weight: "1-5 kg" },
  { id: "fragile", icon: AlertTriangle, label: "Fragile", weight: "1-10 kg" },
  { id: "lourd", icon: Weight, label: "Lourd", weight: "10-30 kg" },
];

const pricingMap: Record<string, Record<string, number>> = {
  document: { express: 1000, standard: 500 },
  paquet: { express: 2000, standard: 1200 },
  fragile: { express: 2500, standard: 1500 },
  lourd: { express: 4000, standard: 2500 },
};

export function DeliveryPage() {
  const navigate = useNavigate();
  const [parcelType, setParcelType] = useState("paquet");
  const [deliveryType, setDeliveryType] = useState("standard");
  const [payer, setPayer] = useState("me");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Tarifs pilotés par le back office : la grille est mise à l'échelle selon le
  // prix de départ de l'offre « Livraison » défini par l'admin.
  const config = usePlatformConfig();
  const deliveryOffer = findOffer(config, "delivery");
  const priceRatio = (deliveryOffer?.priceFrom ?? DELIVERY_REF_BASE) / DELIVERY_REF_BASE;
  const price = Math.round((pricingMap[parcelType]?.[deliveryType] ?? DELIVERY_REF_BASE) * priceRatio);
  const selectedType = parcelTypes.find(t => t.id === parcelType)!;

  const handleTakePhoto = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setPhotoTaken(true);
      toast.success("Photo du colis ajoutée !", { description: file.name });
    }
  };

  const handleGPS = () => {
    setGpsLoading(true);
    toast("Localisation GPS en cours...");
    getGPSPosition(
      (label) => { setPickupAddress(label); setGpsLoading(false); toast.success("Position GPS détectée !"); },
      (fallback) => { setPickupAddress(fallback); setGpsLoading(false); toast("Position approximative utilisée"); }
    );
  };

  const handleOrder = () => {
    if (!pickupAddress.trim()) { toast.error("Indiquez l'adresse de recuperation"); return; }
    if (!deliveryAddress.trim()) { toast.error("Indiquez l'adresse de livraison"); return; }
    if (!recipientName.trim()) { toast.error("Indiquez le nom du destinataire"); return; }
    if (!recipientPhone.trim()) { toast.error("Indiquez le telephone du destinataire"); return; }
    if (!photoTaken) { toast.error("Prenez une photo du colis avant d'envoyer"); return; }

    setOrdering(true);
    toast.success("Commande envoyee !", {
      description: `${selectedType.label} ${deliveryType === "express" ? "Express" : "Standard"} · ${pickupAddress} → ${deliveryAddress} · ${price.toLocaleString()} FCFA`,
    });
    setTimeout(() => navigate("/app/tracking"), 1500);
  };

  const hero = (
    <div className="relative h-24 overflow-hidden rounded-3xl">
      <img src={deliveryHeaderImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, var(--m3-primary), transparent)" }} />
    </div>
  );

  return (
    <M3Page title="Livraison / Colis" subtitle="Envoyez vos colis en toute securite" icon={PackageCheck} hero={hero}>
      {/* Type de colis */}
      <SectionHeader title="Type de colis" icon={Box} />
      <div className="grid grid-cols-4 gap-2.5">
        {parcelTypes.map((t, i) => {
          const isSelected = parcelType === t.id;
          return (
            <M3Card
              key={t.id}
              delay={0.04 * i}
              onClick={() => setParcelType(t.id)}
              className="!p-3 flex flex-col items-center gap-2"
              style={isSelected ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={isSelected ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}
              >
                <t.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">{t.label}</span>
              <span className="text-[9px] text-slate-400">{t.weight}</span>
            </M3Card>
          );
        })}
      </div>

      {/* Photo */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <button
        onClick={handleTakePhoto}
        className={`mt-4 flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-6 transition ${
          photoTaken ? "border-emerald-300 bg-emerald-50/40" : "border-[var(--m3-primary)]/40 bg-white hover:bg-[var(--m3-container)]/30"
        }`}
      >
        {photoTaken ? (
          <>
            {photoPreview && (
              <img src={photoPreview} alt="Colis" className="mb-1 h-24 w-24 rounded-2xl object-cover shadow-md" />
            )}
            {!photoPreview && (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400 text-white shadow-sm">
                <Check className="h-6 w-6" />
              </div>
            )}
            <span className="text-sm font-semibold text-emerald-600">Photo du colis prise</span>
            <span className="text-[10px] text-slate-400">Appuyez pour changer</span>
          </>
        ) : (
          <>
            <div className="grid h-14 w-14 place-items-center rounded-2xl shadow-sm" style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
              <Camera className="h-6 w-6" />
            </div>
            <span className="text-sm text-slate-500">Prendre une photo du colis</span>
            <span className="text-[10px] font-semibold text-[var(--m3-primary)]">Obligatoire</span>
          </>
        )}
      </button>

      {/* Description */}
      <SectionHeader title="Description (optionnel)" icon={FileText} />
      <M3Card>
        <textarea
          placeholder="Ex: Carton contenant des vetements..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--m3-primary)]"
        />
      </M3Card>

      {/* Itineraire */}
      <SectionHeader title="Itineraire" icon={MapPin} />
      <M3Card>
        <div className="relative pl-8">
          <div className="absolute left-3 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "var(--m3-primary)" }} />
          <div className="absolute left-[6px] top-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-accent)" }} />
          <div className="absolute left-[6px] bottom-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-primary)" }} />
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
              <input
                placeholder="Adresse de recuperation"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {pickupAddress ? (
                <button onClick={() => setPickupAddress("")}><X className="h-4 w-4 text-slate-300" /></button>
              ) : (
                <button onClick={handleGPS} disabled={gpsLoading} className="shrink-0">
                  {gpsLoading
                    ? <div className="h-4 w-4 rounded-full border-2 border-[var(--m3-primary)]/30 border-t-[var(--m3-primary)] animate-spin" />
                    : <Navigation className="h-4 w-4 text-[var(--m3-primary)]" />
                  }
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
              <input
                placeholder="Adresse de livraison"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {deliveryAddress ? (
                <button onClick={() => setDeliveryAddress("")}><X className="h-4 w-4 text-slate-300" /></button>
              ) : (
                <MapPin className="h-4 w-4 text-[var(--m3-primary)]" />
              )}
            </div>
          </div>
        </div>
      </M3Card>

      {/* Destinataire */}
      <SectionHeader title="Destinataire" icon={User} />
      <M3Card className="space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
          <User className="h-4 w-4 text-[var(--m3-primary)]" />
          <input placeholder="Nom du destinataire" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
          <Phone className="h-4 w-4 text-[var(--m3-primary)]" />
          <input placeholder="Telephone du destinataire" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </M3Card>

      {/* Type de livraison */}
      <SectionHeader title="Type de livraison" icon={Zap} />
      <div className="grid grid-cols-2 gap-2.5">
        <M3Card
          onClick={() => setDeliveryType("express")}
          className="flex items-center gap-3"
          style={deliveryType === "express" ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={deliveryType === "express" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
            <Zap className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Express</p>
            <p className="text-[10px] text-slate-400">30-60 min</p>
          </div>
        </M3Card>
        <M3Card
          onClick={() => setDeliveryType("standard")}
          className="flex items-center gap-3"
          style={deliveryType === "standard" ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={deliveryType === "standard" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Standard</p>
            <p className="text-[10px] text-slate-400">2-4 heures</p>
          </div>
        </M3Card>
      </div>

      {/* Payeur */}
      <div className="mt-4 flex gap-2.5">
        <button
          onClick={() => setPayer("me")}
          className="flex-1 rounded-full py-3.5 text-sm font-semibold transition"
          style={payer === "me" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}
        >
          Moi (expediteur)
        </button>
        <button
          onClick={() => setPayer("dest")}
          className="flex-1 rounded-full py-3.5 text-sm font-semibold transition"
          style={payer === "dest" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}
        >
          Destinataire
        </button>
      </div>

      {/* Récap */}
      <M3Card tonal className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Type: {selectedType.label}</span>
          <span>{selectedType.weight}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Livraison {deliveryType === "express" ? "Express" : "Standard"}</span>
          <span>{deliveryType === "express" ? "30-60 min" : "2-4h"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Paiement par</span>
          <span>{payer === "me" ? "Expediteur" : "Destinataire"}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-current/10 pt-3">
          <span className="font-semibold">Prix estime</span>
          <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace" }}>{price.toLocaleString()} FCFA</span>
        </div>
      </M3Card>

      <div className="mt-5">
        <M3Button onClick={handleOrder} disabled={ordering} icon={ordering ? undefined : ChevronRight}>
          {ordering ? "Envoi en cours..." : "Envoyer le colis"}
        </M3Button>
      </div>
    </M3Page>
  );
}
