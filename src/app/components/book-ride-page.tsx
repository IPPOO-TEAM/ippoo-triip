import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Navigation, MessageSquare, Plus, ChevronRight, MapPin, Info, Zap, Calendar, X, Star, UserCheck, Car
} from "lucide-react";
import { IconMoto, IconTricycle, IconVoiture, IconMinibus } from "./icons";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { api } from "../api/client";
import { usePlatformConfig } from "../store/platform-config";
import { M3Page, M3Card, M3Button, SectionHeader, StatTile } from "./m3";

/** Coordonnée par défaut (centre Cotonou) pour seeder les points sans GPS. */
const COTONOU = { lat: 6.3654, lng: 2.4183 };

/* Visuel uniquement - les tarifs (basePrice/maxPrice/perKm) et le libellé
   proviennent du store central, éditables depuis le back office admin. */
const vehicleVisuals = [
  { id: "moto", Icon: IconMoto, label: "Moto", time: "5 min" },
  { id: "tricycle", Icon: IconTricycle, label: "Tricycle", time: "8 min" },
  { id: "voiture", Icon: IconVoiture, label: "Voiture", time: "7 min" },
  { id: "minibus", Icon: IconMinibus, label: "Mini-bus", time: "12 min" },
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

  // Stabilise les estimations avec useMemo - recalcule uniquement si la route ou le véhicule change
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
    <M3Page title="Commander une course" subtitle="Choisissez votre destination" icon={Car}>
      {/* Chauffeur pré-sélectionné */}
      {driverName && (
        <M3Card tonal className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}>
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--m3-on-container)] truncate">{decodeURIComponent(driverName)}</p>
            <div className="flex items-center gap-1 text-[var(--m3-on-container)]/70">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs">{driverRating} · {typeParam}</span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-[var(--m3-primary)]">Chauffeur choisi</span>
        </M3Card>
      )}

      {/* Itinéraire */}
      <M3Card className="!p-4">
        <div className="relative pl-8">
          <div className="absolute left-3 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "var(--m3-primary)" }} />
          <div className="absolute left-[6px] top-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-accent)" }} />
          <div className="absolute left-[6px] bottom-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-primary)" }} />

          <div className="space-y-2.5">
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border transition ${focusedField === "departure" ? "border-[var(--m3-primary)] bg-[var(--m3-container)]/40" : "border-black/10 bg-slate-50"}`}>
              <input
                placeholder="Point de depart (GPS auto)"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                onFocus={() => setFocusedField("departure")}
                onBlur={() => setTimeout(() => focusedField === "departure" && setFocusedField(null), 200)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {departure ? (
                <button onClick={() => setDeparture("")} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100">
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={handleGPS}
                  disabled={gpsLoading}
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: "var(--m3-container)" }}
                >
                  {gpsLoading
                    ? <div className="h-3.5 w-3.5 rounded-full border-2 border-[var(--m3-primary)]/30 border-t-[var(--m3-primary)] animate-spin" />
                    : <Navigation className="h-3.5 w-3.5 text-[var(--m3-primary)]" />
                  }
                </button>
              )}
            </div>
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border transition ${focusedField === "arrival" ? "border-[var(--m3-primary)] bg-[var(--m3-container)]/40" : "border-black/10 bg-slate-50"}`}>
              <input
                placeholder="Destination"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                onFocus={() => setFocusedField("arrival")}
                onBlur={() => setTimeout(() => focusedField === "arrival" && setFocusedField(null), 200)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {arrival ? (
                <button onClick={() => setArrival("")} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100">
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--m3-container)" }}>
                  <MapPin className="h-3.5 w-3.5 text-[var(--m3-primary)]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {focusedField && (
          <div className="ml-8 mt-2 max-h-48 overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {filteredPlaces(focusedField === "departure" ? departure : arrival).map((p, i) => (
              <button
                key={i}
                onMouseDown={() => selectPlace(p)}
                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 transition last:border-0 hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="text-left">
                  <p className="text-sm text-slate-700">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.address}</p>
                </div>
              </button>
            ))}
            {filteredPlaces(focusedField === "departure" ? departure : arrival).length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucune suggestion</p>
            )}
          </div>
        )}

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="ml-8 mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Options & arrets
        </button>

        {showOptions && (
          <div className="ml-8 mt-3 space-y-2 rounded-2xl border border-black/5 bg-slate-50/70 p-3">
            <button
              onClick={() => setScheduled(!scheduled)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${scheduled ? "border" : "bg-white"}`}
              style={scheduled ? { background: "var(--m3-container)", borderColor: "var(--m3-primary)", color: "var(--m3-on-container)" } : undefined}
            >
              <Calendar className={`h-4 w-4 ${scheduled ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
              <span className={`text-sm ${scheduled ? "text-[var(--m3-on-container)]" : "text-slate-400"}`}>
                {scheduled ? "Course programmee" : "Programmer (date & heure)"}
              </span>
            </button>
            {scheduled && (
              <div className="flex gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--m3-primary)]" />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--m3-primary)]" />
              </div>
            )}
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-[var(--m3-primary)]" />
              <input placeholder="Note au chauffeur" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>
        )}
      </M3Card>

      {/* Sélection de véhicule */}
      <SectionHeader title="Choisir le vehicule" icon={Car} />
      <div className="space-y-2.5">
        {vehicles.map((v, i) => {
          const isSelected = selected === v.id;
          return (
            <M3Card
              key={v.id}
              delay={0.04 * i}
              onClick={() => setSelected(v.id)}
              className="flex items-center gap-4"
              style={isSelected ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
            >
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={isSelected ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}
              >
                <v.Icon size={26} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{v.label}</p>
                  {v.id === "moto" && (
                    <span className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                      <Zap className="h-2.5 w-2.5" /> RAPIDE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Arrivee ~{v.time}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${isSelected ? "text-[var(--m3-primary)]" : "text-slate-800"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>{v.basePrice.toLocaleString()}-{v.maxPrice.toLocaleString()} F</p>
                <p className="text-[10px] text-slate-400">estimation</p>
              </div>
            </M3Card>
          );
        })}
      </div>

      {/* Estimation */}
      <SectionHeader title="Estimation du trajet" icon={Info} />
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile label="Distance" value={hasRoute ? `${estimatedDist} km` : "—"} />
        <StatTile label="Duree" value={hasRoute ? estimatedTime : "—"} />
        <StatTile label="Prix" value={hasRoute ? `${estimatedPrice.toLocaleString()} F` : "—"} />
      </div>

      <div className="mt-5">
        <M3Button onClick={handleOrder} disabled={ordering} icon={ordering ? undefined : ChevronRight}>
          {ordering ? "Recherche en cours..." : "Commander maintenant"}
        </M3Button>
      </div>
    </M3Page>
  );
}
