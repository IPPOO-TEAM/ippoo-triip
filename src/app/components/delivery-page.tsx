import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Camera, User, Phone, Zap, Clock, ChevronRight,
  FileText, Box, AlertTriangle, Weight, MapPin, Navigation, Check, X
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import deliveryHeaderImg from "figma:asset/c3680b506d82e1e5ee8aa062c6524415e9f21293.png";

const parcelTypes = [
  { id: "document", icon: FileText, label: "Document", weight: "< 1 kg", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/25", lightBg: "bg-blue-50", lightColor: "text-blue-600", accent: "border-blue-400" },
  { id: "paquet", icon: Box, label: "Paquet", weight: "1-5 kg", gradient: "from-orange-400 to-orange-600", shadow: "shadow-orange-500/25", lightBg: "bg-orange-50", lightColor: "text-orange-600", accent: "border-orange-400" },
  { id: "fragile", icon: AlertTriangle, label: "Fragile", weight: "1-10 kg", gradient: "from-amber-400 to-amber-600", shadow: "shadow-amber-500/25", lightBg: "bg-amber-50", lightColor: "text-amber-600", accent: "border-amber-400" },
  { id: "lourd", icon: Weight, label: "Lourd", weight: "10-30 kg", gradient: "from-rose-400 to-red-500", shadow: "shadow-red-500/25", lightBg: "bg-red-50", lightColor: "text-red-600", accent: "border-red-400" },
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
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setParallaxY(window.scrollY * 0.4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const price = pricingMap[parcelType]?.[deliveryType] ?? 1500;
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
    setTimeout(() => navigate("/tracking"), 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <img src={deliveryHeaderImg} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F77F00]/85 via-[#F77F00]/70 to-[#E9C46A]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D62828]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-white">Livraison / Colis</h2>
            <p className="text-orange-100 text-xs">Envoyez vos colis en toute securite</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Parcel type */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-3 block">Type de colis</label>
          <div className="grid grid-cols-4 gap-2.5">
            {parcelTypes.map((t) => {
              const isSelected = parcelType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setParcelType(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    isSelected ? `${t.accent} ${t.lightBg}` : "border-transparent bg-slate-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? `bg-gradient-to-br ${t.gradient} shadow-lg ${t.shadow}` : "bg-slate-100"}`}>
                    <t.icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  </div>
                  <span className="text-[11px]">{t.label}</span>
                  <span className="text-[9px] text-slate-400">{t.weight}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo */}
        {/* Hidden camera input */}
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
          className={`w-full border-2 border-dashed rounded-3xl p-6 flex flex-col items-center gap-2 transition ${
            photoTaken
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-orange-200 bg-white hover:bg-orange-50/30"
          }`}
        >
          {photoTaken ? (
            <>
              {photoPreview && (
                <img src={photoPreview} alt="Colis" className="w-24 h-24 object-cover rounded-2xl mb-1 shadow-md" />
              )}
              {!photoPreview && (
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Check className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="text-sm text-emerald-600">Photo du colis prise ✓</span>
              <span className="text-[10px] text-slate-400">Appuyez pour changer</span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-slate-500">Prendre une photo du colis</span>
              <span className="text-[10px] text-orange-500">Obligatoire</span>
            </>
          )}
        </button>

        {/* Description */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-2 block">Description du colis (optionnel)</label>
          <textarea
            placeholder="Ex: Carton contenant des vetements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none focus:border-orange-300 resize-none"
          />
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-3 block">Itineraire</label>
          <div className="relative pl-8">
            <div className="absolute left-3 top-5 bottom-5 w-[2px] bg-gradient-to-b from-emerald-400 to-orange-500 rounded-full" />
            <div className="absolute left-[6px] top-3.5 w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/40 border-2 border-white" />
            <div className="absolute left-[6px] bottom-3.5 w-3 h-3 rounded-full bg-orange-500 shadow-md shadow-orange-500/40 border-2 border-white" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-emerald-300 transition">
                <input
                  placeholder="Adresse de recuperation"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {pickupAddress ? (
                  <button onClick={() => setPickupAddress("")}><X className="w-4 h-4 text-slate-300" /></button>
                ) : (
                  <button
                    onClick={handleGPS}
                    disabled={gpsLoading}
                    className="shrink-0"
                  >
                    {gpsLoading
                      ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-500 rounded-full animate-spin" />
                      : <Navigation className="w-4 h-4 text-emerald-500" />
                    }
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-orange-300 transition">
                <input
                  placeholder="Adresse de livraison"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {deliveryAddress ? (
                  <button onClick={() => setDeliveryAddress("")}><X className="w-4 h-4 text-slate-300" /></button>
                ) : (
                  <MapPin className="w-4 h-4 text-orange-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2.5">
          <label className="text-sm text-slate-500">Destinataire</label>
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-violet-300 transition">
            <User className="w-4 h-4 text-violet-500" />
            <input placeholder="Nom du destinataire" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-violet-300 transition">
            <Phone className="w-4 h-4 text-violet-500" />
            <input placeholder="Telephone du destinataire" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
          </div>
        </div>

        {/* Delivery type */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-3 block">Type de livraison</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setDeliveryType("express")}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                deliveryType === "express" ? "border-orange-400 bg-orange-50" : "border-transparent bg-slate-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deliveryType === "express" ? "bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-500/25" : "bg-slate-100"}`}>
                <Zap className={`w-5 h-5 ${deliveryType === "express" ? "text-white" : "text-slate-400"}`} />
              </div>
              <div className="text-left">
                <p className="text-sm">Express</p>
                <p className="text-[10px] text-slate-400">30-60 min</p>
              </div>
            </button>
            <button
              onClick={() => setDeliveryType("standard")}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                deliveryType === "standard" ? "border-blue-400 bg-blue-50" : "border-transparent bg-slate-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deliveryType === "standard" ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25" : "bg-slate-100"}`}>
                <Clock className={`w-5 h-5 ${deliveryType === "standard" ? "text-white" : "text-slate-400"}`} />
              </div>
              <div className="text-left">
                <p className="text-sm">Standard</p>
                <p className="text-[10px] text-slate-400">2-4 heures</p>
              </div>
            </button>
          </div>
        </div>

        {/* Who pays */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setPayer("me")}
            className={`flex-1 py-3.5 rounded-2xl text-sm transition-all ${
              payer === "me" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : "bg-white text-slate-600 border border-slate-100"
            }`}
          >
            Moi (expediteur)
          </button>
          <button
            onClick={() => setPayer("dest")}
            className={`flex-1 py-3.5 rounded-2xl text-sm transition-all ${
              payer === "dest" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : "bg-white text-slate-600 border border-slate-100"
            }`}
          >
            Destinataire
          </button>
        </div>

        {/* Price summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Type: {selectedType.label}</span>
            <span className="text-slate-600">{selectedType.weight}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Livraison {deliveryType === "express" ? "Express" : "Standard"}</span>
            <span className="text-slate-600">{deliveryType === "express" ? "30-60 min" : "2-4h"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Paiement par</span>
            <span className="text-slate-600">{payer === "me" ? "Expediteur" : "Destinataire"}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 mt-2">
            <span className="text-slate-800">Prix estime</span>
            <span className="text-emerald-500 text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{price.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={ordering}
          className={`w-full bg-gradient-to-r from-orange-400 to-rose-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-transform ${ordering ? "opacity-70 scale-[0.98]" : "active:scale-[0.98]"}`}
        >
          {ordering ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours...</>
          ) : (
            <>Envoyer le colis <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}