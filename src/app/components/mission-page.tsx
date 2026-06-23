import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, MapPin, Plus, Trash2, Package, Users, Clock,
  Navigation, Check, X, ChevronRight, Calendar, Zap, Phone,
  ArrowRight, Layers, Route, CircleDot, Target
} from "lucide-react";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
type MissionType = "course" | "livraison" | "commande";

interface Stop {
  id: number;
  address: string;
  contact: string;
  phone: string;
  note: string;
}

interface Parcel {
  id: number;
  description: string;
  weight: string;
}

/* ─── Mock scheduled missions ─── */
const scheduledMissions = [
  { id: 1, type: "course" as MissionType, date: "12 Avr 2026", time: "08:00–09:00", stops: 2, status: "confirmed" },
  { id: 2, type: "livraison" as MissionType, date: "12 Avr 2026", time: "14:00–16:00", stops: 3, status: "pending" },
  { id: 3, type: "commande" as MissionType, date: "13 Avr 2026", time: "10:00–12:00", stops: 1, status: "confirmed" },
];

export function MissionPage() {
  const navigate = useNavigate();
  const [parallaxY, setParallaxY] = useState(0);
  const [missionType, setMissionType] = useState<MissionType>("course");
  const [stops, setStops] = useState<Stop[]>([
    { id: 1, address: "", contact: "", phone: "", note: "" },
    { id: 2, address: "", contact: "", phone: "", note: "" },
  ]);
  const [parcels, setParcels] = useState<Parcel[]>([{ id: 1, description: "", weight: "" }]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("Aujourd'hui");
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState<number | null>(null);

  useEffect(() => {
    const el = document.querySelector(".flex-1.min-h-0.overflow-y-auto");
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const timeSlots = [
    "06:00–08:00", "08:00–10:00", "10:00–12:00",
    "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"
  ];

  const dates = ["Aujourd'hui", "Demain", "13 Avr", "14 Avr", "15 Avr"];

  const missionTypes: { key: MissionType; icon: typeof MapPin; label: string; color: string }[] = [
    { key: "course", icon: Navigation, label: "Course", color: "from-[#1E6091] to-[#2A9D8F]" },
    { key: "livraison", icon: Package, label: "Livraison", color: "from-[#F77F00] to-[#E9C46A]" },
    { key: "commande", icon: Layers, label: "Commande groupée", color: "from-[#8B5CF6] to-[#A78BFA]" },
  ];

  const addStop = () => setStops(prev => [...prev, { id: Date.now(), address: "", contact: "", phone: "", note: "" }]);
  const removeStop = (id: number) => stops.length > 2 && setStops(prev => prev.filter(s => s.id !== id));
  const updateStop = (id: number, field: keyof Stop, value: string) => setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addParcel = () => setParcels(prev => [...prev, { id: Date.now(), description: "", weight: "" }]);
  const removeParcel = (id: number) => parcels.length > 1 && setParcels(prev => prev.filter(p => p.id !== id));

  const handleGPS = (stopId: number) => {
    setGpsLoading(stopId);
    getGPSPosition(
      (label) => { updateStop(stopId, "address", label); setGpsLoading(null); toast.success("Position détectée"); },
      (fallback) => { updateStop(stopId, "address", fallback); setGpsLoading(null); }
    );
  };

  const handleSubmit = () => {
    const filledStops = stops.filter(s => s.address.trim());
    if (filledStops.length < 2) { toast.error("Ajoutez au moins 2 arrêts"); return; }
    if (!selectedSlot) { toast.error("Choisissez un créneau horaire"); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Mission créée !", { description: `${missionType === "course" ? "Course" : missionType === "livraison" ? "Livraison" : "Commande"} · ${filledStops.length} arrêts · ${selectedDate} ${selectedSlot}` });
      navigate("/app/tracking");
    }, 1500);
  };

  const statusColor = (s: string) => s === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E6091] via-[#2A9D8F] to-[#1E6091]" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1" />
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-white mb-1 drop-shadow-md">Réservation par Mission</h1>
          <p className="text-white/80 text-xs">Créez une mission multi-arrêts</p>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Mission Type */}
        <div className="flex gap-2">
          {missionTypes.map(mt => (
            <button
              key={mt.key}
              onClick={() => setMissionType(mt.key)}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${missionType === mt.key
                ? `bg-gradient-to-br ${mt.color} text-white shadow-md`
                : "bg-white text-slate-500 shadow-sm"}`}
            >
              <mt.icon className="w-5 h-5" />
              <span className="text-[10px]">{mt.label}</span>
            </button>
          ))}
        </div>

        {/* Date selection */}
        <div>
          <h3 className="title-gradient mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E6091]" />
            Date
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {dates.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs transition ${selectedDate === d
                  ? "bg-[#1E6091] text-white shadow-md"
                  : "bg-white text-slate-500 shadow-sm"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <h3 className="title-gradient mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2A9D8F]" />
            Créneau horaire
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2.5 rounded-xl text-[11px] transition ${selectedSlot === slot
                  ? "bg-gradient-to-r from-[#2A9D8F] to-[#1E6091] text-white shadow-md"
                  : "bg-white text-slate-500 shadow-sm"}`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="title-gradient flex items-center gap-2">
              <Route className="w-4 h-4 text-[#F77F00]" />
              Arrêts ({stops.length})
            </h3>
            <button onClick={addStop} className="w-8 h-8 bg-[#F77F00]/10 rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#F77F00]" />
            </button>
          </div>
          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={stop.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] ${idx === 0 ? "bg-[#2A9D8F]" : idx === stops.length - 1 ? "bg-[#D62828]" : "bg-[#1E6091]"}`}>
                    {idx === 0 ? <CircleDot className="w-3.5 h-3.5" /> : idx === stops.length - 1 ? <Target className="w-3.5 h-3.5" /> : (idx + 1)}
                  </div>
                  <p className="text-slate-700 text-xs flex-1">
                    {idx === 0 ? "Départ" : idx === stops.length - 1 ? "Destination" : `Arrêt ${idx}`}
                  </p>
                  {stops.length > 2 && idx > 0 && idx < stops.length - 1 && (
                    <button onClick={() => removeStop(stop.id)} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
                <div className="relative mb-2">
                  <input
                    value={stop.address}
                    onChange={e => updateStop(stop.id, "address", e.target.value)}
                    placeholder="Adresse..."
                    className="w-full bg-slate-50 rounded-xl py-2.5 pl-3 pr-10 text-xs text-slate-700 border border-slate-100 focus:outline-none focus:border-[#2A9D8F]"
                  />
                  <button
                    onClick={() => handleGPS(stop.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={gpsLoading === stop.id}
                  >
                    <Navigation className={`w-4 h-4 ${gpsLoading === stop.id ? "text-slate-300 animate-pulse" : "text-[#2A9D8F]"}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={stop.contact}
                    onChange={e => updateStop(stop.id, "contact", e.target.value)}
                    placeholder="Contact"
                    className="bg-slate-50 rounded-xl py-2 px-3 text-[11px] text-slate-700 border border-slate-100 focus:outline-none focus:border-[#2A9D8F]"
                  />
                  <input
                    value={stop.phone}
                    onChange={e => updateStop(stop.id, "phone", e.target.value)}
                    placeholder="Téléphone"
                    className="bg-slate-50 rounded-xl py-2 px-3 text-[11px] text-slate-700 border border-slate-100 focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parcels (for livraison) */}
        {missionType === "livraison" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="title-gradient flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F77F00]" />
                Colis ({parcels.length})
              </h3>
              <button onClick={addParcel} className="w-8 h-8 bg-[#F77F00]/10 rounded-xl flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#F77F00]" />
              </button>
            </div>
            {parcels.map((p, i) => (
              <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm mb-2 flex gap-2 items-center">
                <span className="text-[10px] text-slate-400 w-4">#{i + 1}</span>
                <input
                  value={p.description}
                  onChange={e => setParcels(prev => prev.map(x => x.id === p.id ? { ...x, description: e.target.value } : x))}
                  placeholder="Description"
                  className="flex-1 bg-slate-50 rounded-lg py-2 px-2.5 text-[11px] text-slate-700 border border-slate-100 focus:outline-none"
                />
                <input
                  value={p.weight}
                  onChange={e => setParcels(prev => prev.map(x => x.id === p.id ? { ...x, weight: e.target.value } : x))}
                  placeholder="Poids"
                  className="w-16 bg-slate-50 rounded-lg py-2 px-2.5 text-[11px] text-slate-700 border border-slate-100 focus:outline-none"
                />
                {parcels.length > 1 && (
                  <button onClick={() => removeParcel(p.id)} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-[#1E6091] to-[#2A9D8F] text-white rounded-2xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Créer la mission</span>
            </>
          )}
        </button>

        {/* Scheduled Missions */}
        <div>
          <h2 className="title-gradient mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E6091]" />
            Missions planifiées
          </h2>
          {scheduledMissions.map(m => (
            <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm mb-2 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === "course" ? "bg-blue-50" : m.type === "livraison" ? "bg-orange-50" : "bg-violet-50"}`}>
                {m.type === "course" ? <Navigation className="w-5 h-5 text-[#1E6091]" /> : m.type === "livraison" ? <Package className="w-5 h-5 text-[#F77F00]" /> : <Layers className="w-5 h-5 text-violet-500" />}
              </div>
              <div className="flex-1">
                <p className="text-slate-700 text-xs capitalize">{m.type} · {m.stops} arrêt{m.stops > 1 ? "s" : ""}</p>
                <p className="text-slate-400 text-[10px]">{m.date} · {m.time}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${statusColor(m.status)}`}>
                {m.status === "confirmed" ? "Confirmé" : "En attente"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}