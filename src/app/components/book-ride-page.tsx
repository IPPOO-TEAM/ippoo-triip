import { useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft, Navigation, Clock, MessageSquare, Plus, ChevronRight, MapPin, Info, Zap, Calendar, X, Star, UserCheck
} from "lucide-react";
import { IconMoto, IconTricycle, IconVoiture, IconMinibus, AfricanPattern, Badge } from "./icons";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { api } from "../api/client";
import { usePlatformConfig } from "../store/platform-config";

/** Coordonnée par défaut (centre Cotonou) pour seeder les points sans GPS. */
const COTONOU = { lat: 6.3654, lng: 2.4183 };

/* Visuel uniquement — les tarifs (basePrice/maxPrice/perKm) et le libellé
   proviennent du store central, éditables depuis le back office admin. */
const vehicleVisuals = [
  { id: "moto", Icon: IconMoto, label: "Moto", time: "5 min", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/25", lightBg: "bg-blue-50", lightColor: "text-blue-600", accent: "border-blue-500" },
  { id: "tricycle", Icon: IconTricycle, label: "Tricycle", time: "8 min", gradient: "from-cyan-500 to-teal-600", shadow: "shadow-cyan-500/25", lightBg: "bg-cyan-50", lightColor: "text-cyan-600", accent: "border-cyan-500" },
  { id: "voiture", Icon: IconVoiture, label: "Voiture", time: "7 min", gradient: "from-emerald-500 to-green-600", shadow: "shadow-green-500/25", lightBg: "bg-emerald-50", lightColor: "text-emerald-600", accent: "border-emerald-500" },
  { id: "minibus", Icon: IconMinibus, label: "Mini-bus", time: "12 min", gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25", lightBg: "bg-violet-50", lightColor: "text-violet-600", accent: "border-violet-500" },
];

const suggestedPlaces = [
  { name: "Marche Dantokpa", address: "Cotonou Centre" },
  { name: "Campus Abomey-Calavi", address: "UAC, Abomey-Calavi" },
  { name: "Aeroport Cotonou", address: "Cadjehoun" },
  { name: "Hopital CNHU", address: "Cotonou" },
  { name: "Stade de l'Amitie", address: "Kouhounou" },
  { name: "Gare routiere Jonquet", address: "Cotonou Centre" },
];

export function BookRidePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const config = usePlatformConfig();

  // Véhicules = visuels + tarifs édités depuis le back office admin (actifs uniquement)
  const vehicles = useMemo(
    () =>
      vehicleVisuals
        .map((v) => {
          const rc = config.rideVehicles.find((r) => r.id === v.id);
          return rc && rc.active
            ? { ...v, label: rc.label, basePrice: rc.basePrice, maxPrice: rc.maxPrice, perKm: rc.perKm }
            : null;
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [config.rideVehicles],
  );

  const typeParam = searchParams.get("type");
  const driverName = searchParams.get("driverName");
  const driverRating = searchParams.get("driverRating");
  const vehicleFromType = typeParam ? vehicles.find(v => v.label.toLowerCase() === typeParam.toLowerCase()) : null;
  const [selected, setSelected] = useState(vehicleFromType?.id || "moto");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState(searchParams.get("dest") || "");
  const [showOptions, setShowOptions] = useState(false);
  const [note, setNote] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [focusedField, setFocusedField] = useState<"departure" | "arrival" | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const selectedVehicle = vehicles.find(v => v.id === selected) ?? vehicles[0];
  const hasRoute = departure.trim().length > 2 && arrival.trim().length > 2;

  // Stabilise les estimations avec useMemo — recalcule uniquement si la route ou le véhicule change
  const { estimatedPrice, estimatedDist, estimatedTime } = useMemo(() => {
    if (!hasRoute) return { estimatedPrice: 0, estimatedDist: "", estimatedTime: "" };
    const v = vehicles.find(vv => vv.id === selected) ?? vehicles[0];
    if (!v) return { estimatedPrice: 0, estimatedDist: "", estimatedTime: "" };
    // Tarif réel : prix de base + (tarif au km × distance), plafonné au prix max
    const dist = Math.random() * 8 + 1.5;
    const raw = v.basePrice + Math.round(v.perKm * dist);
    return {
      estimatedPrice: Math.min(raw, v.maxPrice),
      estimatedDist: dist.toFixed(1),
      estimatedTime: `${Math.floor(Math.random() * 15 + 5)} min`,
    };
  }, [hasRoute, selected, vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPlaces = (query: string) =>
    suggestedPlaces.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
    );

  const handleOrder = async () => {
    if (!departure.trim()) { toast.error("Indiquez un point de depart"); return; }
    if (!arrival.trim()) { toast.error("Indiquez une destination"); return; }
    if (scheduled && (!scheduleDate || !scheduleTime)) { toast.error("Completez la date et l'heure de programmation"); return; }
    setOrdering(true);
    toast.success("Recherche d'un chauffeur...", {
      description: `${selectedVehicle.label} · ${departure} → ${arrival}${scheduled ? ` · Programme le ${scheduleDate} a ${scheduleTime}` : ""}`,
    });

    // Crée une vraie course dans le backend mock (alimente l'historique + wallet)
    let rideId: string | null = null;
    try {
      const ride = await api.post<{ id: string }>("/rides", {
        serviceType: "taxi_moto",
        origin: { ...COTONOU, label: departure },
        destination: { lat: COTONOU.lat + 0.05, lng: COTONOU.lng + 0.05, label: arrival },
        priceXOF: hasRoute ? estimatedPrice : selectedVehicle.basePrice,
        distanceKm: hasRoute ? parseFloat(estimatedDist) : undefined,
        notes: note || undefined,
        scheduledAt: scheduled && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined,
      });
      rideId = ride.id;
    } catch {
      /* repli : on continue vers le suivi même si la création échoue */
    }

    setTimeout(() => navigate(rideId ? `/tracking?ride=${rideId}` : "/tracking"), 1500);
  };

  const selectPlace = (place: typeof suggestedPlaces[0]) => {
    if (focusedField === "departure") setDeparture(place.name);
    else if (focusedField === "arrival") setArrival(place.name);
    setFocusedField(null);
  };

  const handleGPS = () => {
    setGpsLoading(true);
    toast("Localisation GPS en cours...");
    getGPSPosition(
      (label) => {
        setDeparture(label);
        setGpsLoading(false);
        toast.success("Position GPS détectée !");
      },
      (fallback) => {
        setDeparture(fallback);
        setGpsLoading(false);
        toast("Position approximative utilisée", { description: "Activez le GPS pour votre position exacte" });
      }
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 rounded-b-[2rem] shadow-sm shadow-blue-100/40">
        <div className="relative rounded-2xl overflow-hidden mb-5 h-28 bg-[#1E6091]">
          <div className="absolute inset-0 flex items-center px-5">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="text-white">Commander une course</h2>
                <p className="text-blue-100 text-xs">Choisissez votre destination</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver selected banner */}
        {driverName && (
          <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3 mb-4 border border-emerald-100">
            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/30">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{decodeURIComponent(driverName)}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-gray-500">{driverRating} · {typeParam}</span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Chauffeur choisi</span>
          </div>
        )}

        {/* Route inputs */}
        <div className="relative pl-8">
          <div className="absolute left-3 top-5 bottom-5 w-[2px] bg-emerald-400 rounded-full" />
          <div className="absolute left-[6px] top-3.5 w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50 border-2 border-white" />
          <div className="absolute left-[6px] bottom-3.5 w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 border-2 border-white" />

          <div className="space-y-2.5">
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border transition ${focusedField === "departure" ? "border-emerald-400 bg-emerald-50/30" : "border-gray-100 bg-gray-50"}`}>
              <input
                placeholder="Point de depart (GPS auto)"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                onFocus={() => setFocusedField("departure")}
                onBlur={() => setTimeout(() => focusedField === "departure" && setFocusedField(null), 200)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {departure ? (
                <button onClick={() => setDeparture("")} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={handleGPS}
                  disabled={gpsLoading}
                  className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center"
                >
                  {gpsLoading
                    ? <div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-500 rounded-full animate-spin" />
                    : <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  }
                </button>
              )}
            </div>
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border transition ${focusedField === "arrival" ? "border-blue-400 bg-blue-50/30" : "border-gray-100 bg-gray-50"}`}>
              <input
                placeholder="Destination"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                onFocus={() => setFocusedField("arrival")}
                onBlur={() => setTimeout(() => focusedField === "arrival" && setFocusedField(null), 200)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {arrival ? (
                <button onClick={() => setArrival("")} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {focusedField && (
          <div className="ml-8 mt-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-h-48 overflow-y-auto">
            {filteredPlaces(focusedField === "departure" ? departure : arrival).map((p, i) => (
              <button
                key={i}
                onMouseDown={() => selectPlace(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-slate-700">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.address}</p>
                </div>
              </button>
            ))}
            {filteredPlaces(focusedField === "departure" ? departure : arrival).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Aucune suggestion</p>
            )}
          </div>
        )}

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1.5 text-ippoo-blue text-xs mt-3 ml-8 bg-blue-50 px-3 py-1.5 rounded-full"
        >
          <Plus className="w-3.5 h-3.5" /> Options & arrets
        </button>

        {showOptions && (
          <div className="mt-3 ml-8 space-y-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <button
              onClick={() => setScheduled(!scheduled)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${scheduled ? "bg-orange-50 border border-orange-200" : "bg-white"}`}
            >
              <Calendar className={`w-4 h-4 ${scheduled ? "text-orange-500" : "text-slate-400"}`} />
              <span className={`text-sm ${scheduled ? "text-orange-600" : "text-slate-400"}`}>
                {scheduled ? "Course programmee" : "Programmer (date & heure)"}
              </span>
            </button>
            {scheduled && (
              <div className="flex gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 bg-white text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:border-orange-400" />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 bg-white text-sm rounded-xl px-3 py-2.5 border border-slate-200 outline-none focus:border-orange-400" />
              </div>
            )}
            <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5">
              <MessageSquare className="w-4 h-4 text-violet-500" />
              <input placeholder="Note au chauffeur" value={note} onChange={(e) => setNote(e.target.value)} className="text-sm bg-transparent outline-none flex-1" />
            </div>
          </div>
        )}
      </div>

      {/* Vehicle selection */}
      <div className="px-5 mt-5">
        <h3 className="mb-3 title-gradient">Choisir le vehicule</h3>
        <div className="space-y-2.5">
          {vehicles.map((v) => {
            const isSelected = selected === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isSelected
                    ? `bg-white border-2 ${v.accent} shadow-sm shadow-blue-100/60`
                    : "bg-white border-2 border-transparent hover:border-blue-100 hover:bg-blue-50/30"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? `bg-gradient-to-br ${v.gradient} shadow-sm ${v.shadow}` : "bg-slate-100"}`}>
                  <v.Icon className={isSelected ? "text-white" : "text-slate-400"} size={26} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-800">{v.label}</p>
                    {v.id === "moto" && (
                      <span className="flex items-center gap-0.5 bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-full">
                        <Zap className="w-2.5 h-2.5" /> RAPIDE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Arrivee ~{v.time}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${isSelected ? v.lightColor : "text-gray-800"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>{v.basePrice.toLocaleString()}-{v.maxPrice.toLocaleString()} F</p>
                  <p className="text-[10px] text-gray-400">estimation</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Estimation & CTA */}
      <div className="px-5 mt-5 mb-6">
        <div className={`bg-white rounded-2xl p-4 shadow-sm mb-4 border transition ${hasRoute ? "border-blue-100 shadow-blue-100/40" : "border-slate-100"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-400">Estimation du trajet</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-400">Distance</p>
              <p className="text-blue-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{estimatedDist} km</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xs text-gray-400">Duree</p>
              <p className="text-cyan-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{estimatedTime}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Prix</p>
              <p className="text-emerald-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{hasRoute ? `${estimatedPrice.toLocaleString()} F` : ""}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={ordering}
          className={`w-full bg-gradient-to-r ${selectedVehicle.gradient} text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm ${selectedVehicle.shadow} transition-transform ${ordering ? "opacity-70 scale-[0.98]" : "active:scale-[0.98]"}`}
        >
          {ordering ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recherche en cours...</>
          ) : (
            <>Commander maintenant <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}