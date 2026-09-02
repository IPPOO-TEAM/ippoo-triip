import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Filter, Loader2, MapPinOff } from "lucide-react";
import { api } from "../api/client";

/* Centre de repli si la géolocalisation est refusée (Cotonou). */
const FALLBACK_CENTER: [number, number] = [6.3654, 2.4183];

/* Type de véhicule (valeurs backend) -> libellé + couleur épurée */
const VEHICLE_META: Record<string, { label: string; color: string }> = {
  moto: { label: "Moto", color: "#2563eb" },
  car: { label: "Voiture", color: "#059669" },
  truck: { label: "Camion", color: "#d97706" },
};

interface NearbyDriver {
  id: string;
  name: string;
  vehicleType: string;
  rating: number;
  etaMin: number;
  pos: [number, number];
}

function makeDriverIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px ${color}88;display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:white;border-radius:50%;"></div></div>`,
  });
}

const userIcon = L.divIcon({
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="position:relative;width:40px;height:40px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:var(--m3-primary,#4759e4);opacity:0.2;animation:m3-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;inset:6px;border-radius:50%;background:var(--m3-primary,#4759e4);border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.25);"></div>
  </div>`,
});

const FILTERS = ["Tous", "moto", "car", "truck"] as const;

export function LiveMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ id: string; type: string; marker: L.Marker }[]>([]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>(FALLBACK_CENTER);
  const [geoDenied, setGeoDenied] = useState(false);
  const [located, setLocated] = useState(false);

  /* 1. Position réelle de l'utilisateur — suivi en temps réel (watchPosition) */
  useEffect(() => {
    if (!("geolocation" in navigator)) { setGeoDenied(true); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setCenter([p.coords.latitude, p.coords.longitude]); setLocated(true); setGeoDenied(false); },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* Recentrage manuel sur la position réelle (bouton "me localiser") */
  const recenter = useCallback(() => {
    if (!("geolocation" in navigator)) { setGeoDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
        setCenter(pos); setLocated(true); setGeoDenied(false);
        mapRef.current?.setView(pos, 15, { animate: true });
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  /* 2. Chauffeurs réellement en ligne autour de la position */
  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>(`/drivers/nearby?lat=${center[0]}&lng=${center[1]}`);
      const mapped: NearbyDriver[] = (res ?? [])
        .filter((d) => d?.currentLocation?.lat != null && d?.currentLocation?.lng != null)
        .map((d) => ({
          id: String(d.id),
          name: d.fullName ?? d.name ?? "Chauffeur",
          vehicleType: d.vehicleType ?? "moto",
          rating: Number(d.rating ?? 0),
          etaMin: Number(d.etaMin ?? 0),
          pos: [d.currentLocation.lat, d.currentLocation.lng],
        }));
      setDrivers(mapped);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [center]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  /* 3. Carte Leaflet */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center, zoom: 14, zoomControl: false, attributionControl: false,
    });
    // OpenStreetMap standard
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    // Le conteneur peut être monté pendant une transition animée : on force
    // le recalcul de taille pour que les tuiles s'affichent correctement.
    const t = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []); // init une seule fois

  /* 4. Recentrage : on suit la position seulement au premier point GPS pour
     ne pas balader la carte à chaque mise à jour temps réel. */
  const centeredRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom() || 14, { animate: centeredRef.current });
    centeredRef.current = true;
  }, [center]);

  /* 5. Marqueurs (user + chauffeurs) synchronisés avec les données réelles */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    L.marker(center, { icon: userIcon }).addTo(map);
    L.circle(center, { radius: 600, color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.05, weight: 1, dashArray: "6 4" }).addTo(map);

    drivers.forEach((d) => {
      const color = VEHICLE_META[d.vehicleType]?.color ?? "#2563eb";
      const marker = L.marker(d.pos, { icon: makeDriverIcon(color) }).addTo(map)
        .bindPopup(`<div style="text-align:center;padding:6px;min-width:140px;">
          <p style="font-size:13px;color:#1e293b;margin:0;font-weight:600;">${d.name}</p>
          <p style="font-size:11px;color:#64748b;margin:3px 0;">${VEHICLE_META[d.vehicleType]?.label ?? d.vehicleType}${d.rating ? ` · ${d.rating}/5` : ""}</p>
          <p style="font-size:11px;color:#2563eb;margin:0 0 8px;">Arrivée : ${d.etaMin} min</p>
          <button data-driver-id="${d.id}" style="width:100%;padding:7px 0;border:none;border-radius:10px;background:#f77f00;color:white;font-size:12px;font-weight:600;cursor:pointer;">Réserver</button>
        </div>`);
      marker.on("popupopen", () => {
        const btn = document.querySelector(`button[data-driver-id="${d.id}"]`);
        btn?.addEventListener("click", () => navigate(`/app/book-ride?driver=${d.id}&driverName=${encodeURIComponent(d.name)}&driverRating=${d.rating}&type=${encodeURIComponent(d.vehicleType)}`));
      });
      markersRef.current.push({ id: d.id, type: d.vehicleType, marker });
    });
  }, [drivers, center, navigate]);

  /* 6. Filtre d'affichage */
  useEffect(() => {
    markersRef.current.forEach(({ type, marker }) => {
      const el = (marker as any)._icon as HTMLElement | null;
      if (!el) return;
      el.style.display = filter === "Tous" || type === filter ? "" : "none";
    });
  }, [filter, drivers]);

  const visible = filter === "Tous" ? drivers : drivers.filter((d) => d.vehicleType === filter);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(15,23,42,0.08)] border border-black/[0.05]" style={{ height: 260, isolation: "isolate" }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Filtres */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]" style={{ zIndex: 401 }}>
        {FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] shadow-md backdrop-blur-sm transition-all"
            style={filter === t
              ? { background: "var(--m3-primary,#4759e4)", color: "#fff" }
              : { background: "rgba(255,255,255,0.92)", color: "#475569" }}
          >
            {t === "Tous" ? <Filter className="w-2.5 h-2.5" /> : <span className="w-2 h-2 rounded-full" style={{ background: VEHICLE_META[t]?.color }} />}
            {t === "Tous" ? "Tous" : VEHICLE_META[t]?.label}
          </button>
        ))}
      </div>

      {/* Statut bas */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2" style={{ zIndex: 401 }}>
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] shadow-sm text-gray-700">
          {loading ? (
            <><Loader2 className="w-3 h-3 animate-spin text-slate-400" /> Recherche…</>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {visible.length > 0 ? `${visible.length} chauffeur${visible.length > 1 ? "s" : ""} à proximité` : "Aucun chauffeur en ligne"}</>
          )}
        </div>
        <button
          onClick={recenter}
          aria-label="Me localiser"
          className="flex items-center gap-1 text-white text-[10px] px-2.5 py-1.5 rounded-full shadow-md active:scale-95 transition"
          style={{ background: "var(--m3-primary,#4759e4)" }}
        >
          <Navigation className={`w-3 h-3 ${located ? "" : "animate-pulse"}`} /> {located ? "Recentrer" : "GPS"}
        </button>
      </div>

      {/* Autorisation GPS refusée : message clair (localisation réelle requise) */}
      {geoDenied && (
        <button
          onClick={recenter}
          className="absolute inset-x-3 top-12 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-left shadow-md backdrop-blur-sm"
          style={{ zIndex: 402 }}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-50">
            <MapPinOff className="h-4 w-4 text-rose-500" />
          </span>
          <span className="text-[11px] leading-tight text-slate-600">
            Localisation désactivée — <span className="font-semibold text-slate-800">activez le GPS</span> pour voir votre position réelle.
          </span>
        </button>
      )}

      {/* Overlay vide (aucun chauffeur réel) */}
      {!loading && visible.length === 0 && (
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 text-center" style={{ zIndex: 400 }}>
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-white/90 shadow-sm">
            <MapPinOff className="w-5 h-5 text-slate-400" />
          </span>
          <p className="text-[11px] text-slate-500 bg-white/85 rounded-full px-3 py-1">Aucun chauffeur en ligne pour le moment</p>
        </div>
      )}
    </div>
  );
}
