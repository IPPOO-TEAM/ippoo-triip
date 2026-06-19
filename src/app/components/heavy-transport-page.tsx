import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Shield, Users, ChevronRight, Navigation, MapPin, Truck, Check, Calendar, Clock, MessageSquare, Image as ImageIcon, Camera } from "lucide-react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const HEAVY_IMG = "https://images.unsplash.com/photo-1757454122792-147411c3c695?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdHJ1Y2slMjBjYXJnbyUyMG1vdmluZyUyMGxvZ2lzdGljc3xlbnwxfHx8fDE3NzU5MTY0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const vehicles = [
  { id: "pickup", Icon: Truck, label: "Pickup", desc: "Petits déménagements", basePrice: 5000, gradient: "from-blue-500 to-indigo-600", accent: "border-blue-400" },
  { id: "tricycle", Icon: Truck, label: "Tricycle cargo", desc: "Marchandises moyennes", basePrice: 3500, gradient: "from-cyan-500 to-teal-600", accent: "border-cyan-400" },
  { id: "camionnette", Icon: Truck, label: "Camionnette", desc: "Gros volumes", basePrice: 8000, gradient: "from-orange-400 to-rose-500", accent: "border-orange-400" },
];

export function HeavyTransportPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("pickup");
  const [labor, setLabor] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [payTime, setPayTime] = useState("before");
  const [pickupAddr, setPickupAddr] = useState("");
  const [deliveryAddr, setDeliveryAddr] = useState("");
  const [description, setDescription] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setParallaxY(window.scrollY * 0.4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedVehicle = vehicles.find(v => v.id === selected)!;
  const total = selectedVehicle.basePrice + (labor ? 2000 : 0) + (insurance ? 500 : 0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoTaken(true);
      toast.success("Photo ajoutée !", { description: file.name });
    }
  };

  const handleGPS = () => {
    setGpsLoading(true);
    toast("Localisation GPS en cours...");
    getGPSPosition(
      (label) => { setPickupAddr(label); setGpsLoading(false); toast.success("Position GPS détectée !"); },
      (fallback) => { setPickupAddr(fallback); setGpsLoading(false); toast("Position approximative utilisée"); }
    );
  };

  const handleOrder = () => {
    if (!pickupAddr.trim()) { toast.error("Indiquez l'adresse de chargement"); return; }
    if (!deliveryAddr.trim()) { toast.error("Indiquez l'adresse de livraison"); return; }
    if (scheduled && (!scheduleDate || !scheduleTime)) { toast.error("Completez la date et l'heure"); return; }

    setOrdering(true);
    toast.success("Commande confirmée !", {
      description: `${selectedVehicle.label} · ${pickupAddr} → ${deliveryAddr} · ${total.toLocaleString()} FCFA`,
    });
    setTimeout(() => navigate("/tracking"), 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <ImageWithFallback src={HEAVY_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#D62828]/85 via-[#D62828]/70 to-[#F77F00]/75" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E9C46A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D62828]/20 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-white">Transport de biens</h2>
            <p className="text-red-100 text-xs">Déménagement & gros colis</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Vehicle type */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-3 block">Type de véhicule</label>
          <div className="space-y-2.5">
            {vehicles.map((v) => {
              const isSelected = selected === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    isSelected ? `${v.accent} bg-slate-50` : "border-transparent bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? `bg-gradient-to-br ${v.gradient} shadow-lg` : "bg-gray-100"}`}>
                    {isSelected ? <Check className="w-5 h-5 text-white" strokeWidth={2.5} /> : <v.Icon className="w-5 h-5 text-gray-400" strokeWidth={1.8} />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm text-slate-800">{v.label}</p>
                    <p className="text-xs text-slate-400">{v.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{v.basePrice.toLocaleString()} F</p>
                    <p className="text-[10px] text-slate-400">base</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <label className="text-sm text-slate-500 mb-3 block">Itinéraire</label>
          <div className="relative pl-8">
            <div className="absolute left-3 top-5 bottom-5 w-[2px] bg-gradient-to-b from-emerald-400 to-red-500 rounded-full" />
            <div className="absolute left-[6px] top-3.5 w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/40 border-2 border-white" />
            <div className="absolute left-[6px] bottom-3.5 w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/40 border-2 border-white" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-emerald-300 transition">
                <input placeholder="Adresse de chargement" value={pickupAddr} onChange={(e) => setPickupAddr(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                <button onClick={handleGPS} disabled={gpsLoading} className="shrink-0">
                  {gpsLoading
                    ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-500 rounded-full animate-spin" />
                    : <Navigation className="w-4 h-4 text-emerald-500" />
                  }
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-red-300 transition">
                <input placeholder="Adresse de livraison" value={deliveryAddr} onChange={(e) => setDeliveryAddr(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Description & photo */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <label className="text-sm text-slate-500">Details du chargement</label>
          <textarea
            placeholder="Décrivez les biens à transporter (meubles, cartons, électroménager...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 text-sm outline-none focus:border-rose-300 resize-none"
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            onClick={() => photoTaken ? (setPhotoTaken(false), setPhotoPreview(null)) : photoInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm border-2 border-dashed transition ${photoTaken ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            {photoTaken ? (
              photoPreview
                ? <><img src={photoPreview} className="w-8 h-8 rounded-lg object-cover" alt="" /> Photo ajoutée, Changer</>
                : <><Check className="w-4 h-4" /> Photo ajoutée, Supprimer</>
            ) : (
              <><Camera className="w-4 h-4" /> Ajouter une photo (optionnel)</>
            )}
          </button>
        </div>

        {/* Schedule */}
        <button
          onClick={() => setScheduled(!scheduled)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition bg-white ${scheduled ? "border-amber-400 bg-amber-50" : "border-transparent"}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheduled ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg" : "bg-slate-100"}`}>
            <Calendar className={`w-5 h-5 ${scheduled ? "text-white" : "text-slate-400"}`} />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm text-slate-800">Programmer le transport</p>
            <p className="text-xs text-slate-400">{scheduled ? "Date et heure définies" : "Maintenant par défaut"}</p>
          </div>
          <ToggleCircle active={scheduled} />
        </button>
        {scheduled && (
          <div className="flex gap-2.5">
            <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 bg-white text-sm rounded-2xl px-4 py-3 border border-slate-200 outline-none focus:border-amber-400" />
            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 bg-white text-sm rounded-2xl px-4 py-3 border border-slate-200 outline-none focus:border-amber-400" />
          </div>
        )}

        {/* Options */}
        <div className="space-y-2.5">
          <button
            onClick={() => setLabor(!labor)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white ${
              labor ? "border-emerald-400" : "border-transparent"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${labor ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/25" : "bg-slate-100"}`}>
              <Users className={`w-5 h-5 ${labor ? "text-white" : "text-slate-400"}`} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-800">Main-d'œuvre</p>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">+2 000 F</span>
              </div>
              <p className="text-xs text-slate-400">Aide au chargement / déchargement</p>
            </div>
            <ToggleCircle active={labor} />
          </button>

          <button
            onClick={() => setInsurance(!insurance)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white ${
              insurance ? "border-violet-400" : "border-transparent"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${insurance ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25" : "bg-slate-100"}`}>
              <Shield className={`w-5 h-5 ${insurance ? "text-white" : "text-slate-400"}`} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-800">Assurance transport</p>
                <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">+500 F</span>
              </div>
              <p className="text-xs text-slate-400">Protection de vos biens</p>
            </div>
            <ToggleCircle active={insurance} />
          </button>
        </div>

        {/* Payment timing */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setPayTime("before")}
            className={`flex-1 py-3.5 rounded-2xl text-sm transition-all ${
              payTime === "before" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20" : "bg-white text-slate-600 border border-slate-100"
            }`}
          >
            Avant la course
          </button>
          <button
            onClick={() => setPayTime("after")}
            className={`flex-1 py-3.5 rounded-2xl text-sm transition-all ${
              payTime === "after" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20" : "bg-white text-slate-600 border border-slate-100"
            }`}
          >
            Après livraison
          </button>
        </div>

        {/* Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Transport ({selectedVehicle.label})</span>
            <span className="text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedVehicle.basePrice.toLocaleString()} F</span>
          </div>
          {labor && <div className="flex justify-between text-sm"><span className="text-slate-400">Main-d'œuvre</span><span className="text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>2 000 F</span></div>}
          {insurance && <div className="flex justify-between text-sm"><span className="text-slate-400">Assurance</span><span className="text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>500 F</span></div>}
          <div className="flex justify-between border-t border-slate-100 pt-3 mt-2">
            <span className="text-slate-800">Total</span>
            <span className="text-emerald-500 text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={ordering}
          className={`w-full bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-transform ${ordering ? "opacity-70 scale-[0.98]" : "active:scale-[0.98]"}`}
        >
          {ordering ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmation...</>
          ) : (
            <>Commander <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function ToggleCircle({ active }: { active: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-full border-2 transition-all ${active ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500" : "border-slate-300"}`}>
      {active && <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  );
}