import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type TrackingState =
  | "searching"
  | "accepted"
  | "enroute"
  | "arrived"
  | "inprogress"
  | "completed";

interface TrackingMapProps {
  rideState: TrackingState;
  /** 0-100 : avancement global de la course */
  progress: number;
  driverName?: string;
}

/* ── Coordonnées Cotonou / Bénin ── */
const DEPARTURE: [number, number]    = [6.4195, 2.3325]; // Campus Abomey-Calavi
const DESTINATION: [number, number]  = [6.3666, 2.4383]; // Cotonou Centre
const DRIVER_START: [number, number] = [6.4380, 2.3560]; // Position initiale chauffeur

/* ── OSRM routing (OpenStreetMap, sans clé API) ──
   OSRM attend lon,lat — Leaflet attend lat,lon */
function osrmUrl(from: [number, number], to: [number, number]) {
  return (
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson`
  );
}

async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<[number, number][]> {
  try {
    const res  = await fetch(osrmUrl(from, to));
    const json = await res.json();
    /* Convertit [lon, lat] → [lat, lon] pour Leaflet */
    return (json.routes[0].geometry.coordinates as [number, number][]).map(
      ([lon, lat]) => [lat, lon]
    );
  } catch {
    /* Fallback : ligne droite */
    return [from, to];
  }
}

/* Renvoie la position à t ∈ [0,1] le long d'un tableau de coords */
function posAlongRoute(
  coords: [number, number][],
  t: number,
  fallbackA: [number, number],
  fallbackB: [number, number]
): [number, number] {
  if (!coords.length) {
    const c = Math.max(0, Math.min(1, t));
    return [fallbackA[0] + (fallbackB[0] - fallbackA[0]) * c,
            fallbackA[1] + (fallbackB[1] - fallbackA[1]) * c];
  }
  const clamped = Math.max(0, Math.min(1, t));
  const idx     = clamped * (coords.length - 1);
  const floor   = Math.floor(idx);
  const frac    = idx - floor;
  if (floor >= coords.length - 1) return coords[coords.length - 1];
  const a = coords[floor], b = coords[floor + 1];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

/* Renvoie les coords de 0 à t (pour la ligne de progression) */
function sliceRoute(
  coords: [number, number][],
  t: number
): [number, number][] {
  if (!coords.length) return [];
  const clamped = Math.max(0, Math.min(1, t));
  const idx     = clamped * (coords.length - 1);
  const floor   = Math.floor(idx);
  const partial = posAlongRoute(coords, t, DEPARTURE, DESTINATION);
  return [...coords.slice(0, floor + 1), partial];
}

/* ── Icônes ── */
function makePinIcon(color: string, emoji: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="
          background:${color};color:white;
          font-size:10px;font-family:Inter,sans-serif;font-weight:600;
          padding:3px 8px;border-radius:8px;white-space:nowrap;
          box-shadow:0 2px 8px ${color}99;
        ">${emoji} ${label}</div>
        <div style="
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${color};
          margin-top:-1px;
        "></div>
      </div>`,
  });
}

function makeMotorcycleIcon(moving: boolean) {
  const pulse = moving
    ? `<div style="
        position:absolute;inset:-5px;border-radius:50%;
        background:#F77F00;opacity:0.22;
        animation:ippoo-ping 1.3s cubic-bezier(0,0,0.2,1) infinite;">
       </div>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `
      <div style="position:relative;width:38px;height:38px;">
        ${pulse}
        <div style="
          position:absolute;inset:0;
          background:linear-gradient(135deg,#F77F00,#D62828);
          border-radius:50%;border:3px solid white;
          box-shadow:0 3px 14px #F77F0099;
          display:flex;align-items:center;justify-content:center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5.5"  cy="17.5" r="3.5"/>
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <path d="M15 6h-5l-3 6h9l-1-6z"/>
            <path d="M12 6V3"/>
            <path d="M8.5 11 5.5 14"/>
          </svg>
        </div>
      </div>`,
  });
}

/* ── Composant principal ── */
export function TrackingMap({
  rideState,
  progress,
  driverName = "Hounkpatin A.",
}: TrackingMapProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const driverRef       = useRef<L.Marker | null>(null);

  /* Routes récupérées depuis OSRM */
  const approachCoordsRef = useRef<[number, number][]>([]); // driver → départ
  const rideCoordsRef     = useRef<[number, number][]>([]); // départ → destination

  /* Lignes Leaflet */
  const approachLineRef   = useRef<L.Polyline | null>(null); // itinéraire approche (pointillé)
  const routeBgRef        = useRef<L.Polyline | null>(null); // itinéraire course (fond gris)
  const progressLineRef   = useRef<L.Polyline | null>(null); // partie parcourue (colorée)

  /* ── Initialisation de la carte ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    /* Inject CSS animations */
    if (!document.getElementById("tracking-map-style")) {
      const s = document.createElement("style");
      s.id = "tracking-map-style";
      s.textContent = `
        @keyframes ippoo-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          font-family: 'Inter', system-ui, sans-serif !important;
          background: #e8edf2;
        }
        .leaflet-tile-pane {
          filter: saturate(0.78) brightness(1.04) contrast(0.97);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,.15) !important;
        }
        .leaflet-popup-tip { display: none; }
      `;
      document.head.appendChild(s);
    }

    const map = L.map(containerRef.current, {
      center: [6.393, 2.385],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    /* ── Lignes (vides au départ, remplies après fetch) ── */
    const approachLine = L.polyline([], {
      color: "#94a3b8",
      weight: 2.5,
      opacity: 0.5,
      dashArray: "5 6",
    }).addTo(map);
    approachLineRef.current = approachLine;

    const routeBg = L.polyline([], {
      color: "#cbd5e1",
      weight: 5,
      opacity: 0.6,
    }).addTo(map);
    routeBgRef.current = routeBg;

    /* Contour blanc pour lisibilité */
    L.polyline([], {
      color: "#ffffff",
      weight: 9,
      opacity: 0.55,
    }).addTo(map);

    const progressLine = L.polyline([], {
      color: "#2A9D8F",
      weight: 5,
      opacity: 0.95,
    }).addTo(map);
    progressLineRef.current = progressLine;

    /* ── Marqueurs départ / destination ── */
    L.marker(DEPARTURE,   { icon: makePinIcon("#2A9D8F", "●", "Campus") }).addTo(map);
    L.marker(DESTINATION, { icon: makePinIcon("#1E6091", "◎", "Cotonou") }).addTo(map);

    /* ── Marqueur chauffeur ── */
    const driverMarker = L.marker(DRIVER_START, { icon: makeMotorcycleIcon(false) })
      .addTo(map)
      .bindPopup(
        `<div style="text-align:center;padding:6px 8px;min-width:110px;">
          <p style="font-size:12px;color:#1e293b;margin:0;font-weight:600;">${driverName}</p>
          <p style="font-size:10px;color:#F77F00;margin:3px 0 0;">En route vers vous</p>
        </div>`
      );
    driverRef.current = driverMarker;

    mapRef.current = map;

    /* ── Chargement des deux itinéraires OSRM ── */
    Promise.all([
      fetchRoute(DRIVER_START, DEPARTURE),
      fetchRoute(DEPARTURE, DESTINATION),
    ]).then(([approachCoords, rideCoords]) => {
      approachCoordsRef.current = approachCoords;
      rideCoordsRef.current     = rideCoords;

      /* Dessiner les lignes maintenant que les données sont là */
      approachLineRef.current?.setLatLngs(approachCoords);
      routeBgRef.current?.setLatLngs(rideCoords);

      /* Ajuster le zoom pour voir tout le trajet */
      const allPoints = [...approachCoords, ...rideCoords];
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 36] });
      }
    });

    return () => {
      map.remove();
      mapRef.current          = null;
      driverRef.current       = null;
      approachLineRef.current = null;
      routeBgRef.current      = null;
      progressLineRef.current = null;
    };
  }, [driverName]);

  /* ── Mise à jour de la position du chauffeur et de la progression ── */
  useEffect(() => {
    const driver   = driverRef.current;
    const pLine    = progressLineRef.current;
    const appLine  = approachLineRef.current;
    if (!driver) return;

    const isMoving = ["enroute", "inprogress", "accepted"].includes(rideState);
    driver.setIcon(makeMotorcycleIcon(isMoving));

    const approach = approachCoordsRef.current;
    const ride     = rideCoordsRef.current;

    if (rideState === "searching" || rideState === "accepted") {
      driver.setLatLng(DRIVER_START);
      pLine?.setLatLngs([]);

    } else if (rideState === "enroute") {
      /* Chauffeur avance vers le point de départ (progress 0 → 50) */
      const t   = Math.min(progress / 50, 1);
      const pos = posAlongRoute(approach, t, DRIVER_START, DEPARTURE);
      driver.setLatLng(pos);
      /* On montre la partie déjà parcourue de l'approche */
      appLine?.setLatLngs(sliceRoute(approach, t));
      pLine?.setLatLngs([]);

    } else if (rideState === "arrived") {
      driver.setLatLng(DEPARTURE);
      appLine?.setLatLngs(approach);
      pLine?.setLatLngs([DEPARTURE]);

    } else if (rideState === "inprogress") {
      /* Chauffeur avance vers la destination (progress 50 → 100) */
      const t   = Math.min((progress - 50) / 50, 1);
      const pos = posAlongRoute(ride, t, DEPARTURE, DESTINATION);
      driver.setLatLng(pos);
      /* Ligne de progression colorée sur l'itinéraire réel */
      pLine?.setLatLngs(sliceRoute(ride, t));

    } else if (rideState === "completed") {
      driver.setLatLng(DESTINATION);
      pLine?.setLatLngs(ride.length ? ride : [DEPARTURE, DESTINATION]);
    }
  }, [rideState, progress]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Légende */}
      <div
        className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none"
        style={{ zIndex: 401 }}
      >
        <div className="flex items-center gap-1.5 bg-white/96 rounded-full px-2.5 py-1 text-[10px] shadow-md text-slate-600">
          <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
          Campus Abomey-Calavi
        </div>
        <div className="flex items-center gap-1.5 bg-white/96 rounded-full px-2.5 py-1 text-[10px] shadow-md text-slate-600">
          <div className="w-2 h-2 rounded-full bg-[#1E6091]" />
          Cotonou Centre
        </div>
      </div>

      {/* Badge GPS */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#F77F00] text-white text-[10px] px-2.5 py-1.5 rounded-full shadow-lg pointer-events-none"
        style={{ zIndex: 401 }}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        GPS actif
      </div>
    </div>
  );
}