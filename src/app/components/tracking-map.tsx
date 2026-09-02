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

export interface LatLng { lat: number; lng: number }

interface TrackingMapProps {
  /** Point de départ réel de la course (coordonnées du backend). */
  origin?: LatLng | null;
  /** Destination réelle de la course. */
  destination?: LatLng | null;
  /** Position réelle du chauffeur (currentLocation renvoyé par l'API). */
  driverPos?: LatLng | null;
  /** Position GPS réelle de l'utilisateur (watchPosition). */
  userPos?: LatLng | null;
  driverName?: string;
  /** Course active : anime le halo autour du marqueur chauffeur. */
  active?: boolean;
}

/* Centre de repli (Cotonou) uniquement si aucune coordonnée réelle n'est
   encore disponible — jamais utilisé pour simuler un déplacement. */
const FALLBACK_CENTER: [number, number] = [6.3654, 2.4183];

/* -- OSRM routing (OpenStreetMap, sans clé API) --
   OSRM attend lon,lat · Leaflet attend lat,lon */
function osrmUrl(from: LatLng, to: LatLng) {
  return (
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`
  );
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<[number, number][]> {
  try {
    const res = await fetch(osrmUrl(from, to));
    const json = await res.json();
    return (json.routes[0].geometry.coordinates as [number, number][]).map(
      ([lon, lat]) => [lat, lon] as [number, number],
    );
  } catch {
    /* Repli : ligne droite entre les deux vrais points */
    return [[from.lat, from.lng], [to.lat, to.lng]];
  }
}

/* -- Icônes épurées (aucun emoji) -- */
function makePinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="
          background:${color};color:white;
          font-size:10px;font-family:Inter,sans-serif;font-weight:600;
          padding:3px 9px;border-radius:8px;white-space:nowrap;
          box-shadow:0 2px 8px ${color}99;
        ">${label}</div>
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

function makeDriverIcon(moving: boolean) {
  const pulse = moving
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:#F77F00;opacity:0.22;animation:ippoo-ping 1.3s cubic-bezier(0,0,0.2,1) infinite;"></div>`
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

const userIcon = L.divIcon({
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="position:relative;width:30px;height:30px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#1E6091;opacity:0.2;animation:ippoo-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;inset:5px;border-radius:50%;background:#1E6091;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
  </div>`,
});

/* -- Composant principal — 100% piloté par des coordonnées réelles -- */
export function TrackingMap({
  origin, destination, driverPos, userPos, driverName = "Chauffeur", active = false,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originRef = useRef<L.Marker | null>(null);
  const destRef = useRef<L.Marker | null>(null);
  const driverRef = useRef<L.Marker | null>(null);
  const userRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const routeKeyRef = useRef<string>("");

  /* Initialisation (une seule fois) */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("tracking-map-style")) {
      const s = document.createElement("style");
      s.id = "tracking-map-style";
      s.textContent = `
        @keyframes ippoo-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
        .leaflet-container { font-family: 'Inter', system-ui, sans-serif !important; background: #e8edf2; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,.15) !important; }
        .leaflet-popup-tip { display: none; }
      `;
      document.head.appendChild(s);
    }

    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    routeRef.current = L.polyline([], { color: "#2A9D8F", weight: 5, opacity: 0.9 }).addTo(map);
    mapRef.current = map;

    const t = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
      originRef.current = destRef.current = driverRef.current = userRef.current = null;
      routeRef.current = null;
    };
  }, []);

  /* Marqueurs origine / destination + itinéraire réel (OSRM) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (origin) {
      if (!originRef.current) originRef.current = L.marker([origin.lat, origin.lng], { icon: makePinIcon("#2A9D8F", "Départ") }).addTo(map);
      else originRef.current.setLatLng([origin.lat, origin.lng]);
    }
    if (destination) {
      if (!destRef.current) destRef.current = L.marker([destination.lat, destination.lng], { icon: makePinIcon("#1E6091", "Arrivée") }).addTo(map);
      else destRef.current.setLatLng([destination.lat, destination.lng]);
    }

    // Itinéraire réel entre les deux vrais points (recalculé si les points changent)
    if (origin && destination) {
      const key = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;
      if (key !== routeKeyRef.current) {
        routeKeyRef.current = key;
        fetchRoute(origin, destination).then((coords) => {
          routeRef.current?.setLatLngs(coords);
        });
      }
    }
  }, [origin, destination]);

  /* Marqueur chauffeur — position réelle uniquement */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!driverPos) {
      driverRef.current?.remove();
      driverRef.current = null;
      return;
    }
    if (!driverRef.current) {
      driverRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: makeDriverIcon(active) })
        .addTo(map)
        .bindPopup(`<div style="text-align:center;padding:6px 8px;min-width:110px;"><p style="font-size:12px;color:#1e293b;margin:0;font-weight:600;">${driverName}</p></div>`);
    } else {
      driverRef.current.setLatLng([driverPos.lat, driverPos.lng]);
      driverRef.current.setIcon(makeDriverIcon(active));
    }
  }, [driverPos, active, driverName]);

  /* Marqueur position réelle de l'utilisateur */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;
    if (!userRef.current) userRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map);
    else userRef.current.setLatLng([userPos.lat, userPos.lng]);
  }, [userPos]);

  /* Recadrage automatique sur l'ensemble des points réels connus */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lat, origin.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    if (driverPos) pts.push([driverPos.lat, driverPos.lng]);
    if (userPos) pts.push([userPos.lat, userPos.lng]);
    if (pts.length === 1) map.setView(pts[0], 15, { animate: true });
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [44, 40], animate: true, maxZoom: 16 });
  }, [origin, destination, driverPos, userPos]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Légende — n'affiche que des points réels connus */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1" style={{ zIndex: 401 }}>
        {origin && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/96 px-2.5 py-1 text-[10px] text-slate-600 shadow-md">
            <span className="h-2 w-2 rounded-full bg-[#2A9D8F]" /> Départ
          </div>
        )}
        {destination && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/96 px-2.5 py-1 text-[10px] text-slate-600 shadow-md">
            <span className="h-2 w-2 rounded-full bg-[#1E6091]" /> Arrivée
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#F77F00] px-2.5 py-1.5 text-[10px] text-black shadow-sm" style={{ zIndex: 401 }}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> GPS actif
      </div>
    </div>
  );
}
