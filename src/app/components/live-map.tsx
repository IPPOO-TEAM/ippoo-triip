import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Filter } from "lucide-react";

const COTONOU_CENTER: [number, number] = [6.3654, 2.4183];

const drivers = [
  { id: 1, name: "Hounkpatin A.", type: "Moto", pos: [6.3680, 2.4220] as [number, number], color: "#3B82F6", rating: 4.8, eta: "2 min" },
  { id: 2, name: "Aїdatou D.", type: "Voiture", pos: [6.3620, 2.4140] as [number, number], color: "#10B981", rating: 4.9, eta: "5 min" },
  { id: 3, name: "Gbètoho B.", type: "Tricycle", pos: [6.3590, 2.4230] as [number, number], color: "#F59E0B", rating: 4.7, eta: "3 min" },
  { id: 4, name: "Sènan K.", type: "Moto", pos: [6.3710, 2.4160] as [number, number], color: "#3B82F6", rating: 4.6, eta: "4 min" },
  { id: 5, name: "Dossou F.", type: "Voiture", pos: [6.3640, 2.4260] as [number, number], color: "#10B981", rating: 4.8, eta: "6 min" },
];

const vehicleTypes = ["Tous", "Moto", "Voiture", "Tricycle"];
const typeColors: Record<string, string> = { Moto: "#3B82F6", Voiture: "#10B981", Tricycle: "#F59E0B" };

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
    <div style="position:absolute;inset:0;border-radius:50%;background:#3B82F6;opacity:0.2;animation:ippoo-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;inset:6px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 10px #3B82F688;"></div>
  </div>`,
});

export function LiveMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ id: number; type: string; marker: L.Marker }[]>([]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Tous");

  // Filter markers when filter changes
  useEffect(() => {
    markersRef.current.forEach(({ type, marker }) => {
      const el = (marker as any)._icon as HTMLElement | null;
      if (!el) return;
      if (filter === "Tous" || type === filter) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }, [filter]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inject ping animation
    if (!document.getElementById("ippoo-ping-style")) {
      const style = document.createElement("style");
      style.id = "ippoo-ping-style";
      style.textContent = `@keyframes ippoo-ping{75%,100%{transform:scale(2);opacity:0}} .leaflet-container{font-family:'Inter',system-ui,sans-serif!important;}`;
      document.head.appendChild(style);
    }

    const map = L.map(containerRef.current, {
      center: COTONOU_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // User marker
    L.marker(COTONOU_CENTER, { icon: userIcon })
      .addTo(map)
      .bindPopup(`<div style="text-align:center;padding:4px;"><p style="font-size:12px;color:#1e293b;margin:0;">Vous êtes ici</p><p style="font-size:10px;color:#94a3b8;margin:2px 0 0;">Ganhi, Cotonou</p></div>`);

    // Radius circle
    L.circle(COTONOU_CENTER, {
      radius: 500,
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.06,
      weight: 1,
      dashArray: "6 4",
    }).addTo(map);

    // Driver markers
    const markersList: { id: number; type: string; marker: L.Marker }[] = [];
    drivers.forEach((d) => {
      const marker = L.marker(d.pos, { icon: makeDriverIcon(d.color) })
        .addTo(map)
        .bindPopup(`<div style="text-align:center;padding:6px;min-width:140px;">
          <p style="font-size:13px;color:#1e293b;margin:0;font-weight:600;">${d.name}</p>
          <p style="font-size:11px;color:#64748b;margin:3px 0;">${d.type} · ${d.rating}/5</p>
          <p style="font-size:11px;color:#2563eb;margin:0 0 8px;">Arrivée : ${d.eta}</p>
          <button data-driver-id="${d.id}" style="width:100%;padding:7px 0;border:none;border-radius:10px;background:#F77F00;color:white;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px #F77F0044;">Réserver</button>
        </div>`);
      marker.on("popupopen", () => {
        const btn = document.querySelector(`button[data-driver-id="${d.id}"]`);
        btn?.addEventListener("click", () => {
          navigate(`/book-ride?driver=${d.id}&driverName=${encodeURIComponent(d.name)}&driverRating=${d.rating}&type=${encodeURIComponent(d.type)}`);
        });
      });
      markersList.push({ id: d.id, type: d.type, marker });
    });
    markersRef.current = markersList;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  const filteredDrivers = filter === "Tous" ? drivers : drivers.filter(d => d.type === filter);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md shadow-blue-100/50 border border-blue-50" style={{ height: 260, isolation: "isolate" }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Filter bar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5" style={{ zIndex: 401 }}>
        {vehicleTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] shadow-md backdrop-blur-sm transition-all ${
              filter === t
                ? "bg-[#F77F00] text-black shadow-orange-400/30"
                : "bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            {t === "Tous" && <Filter className="w-2.5 h-2.5" />}
            {t !== "Tous" && <div className="w-2 h-2 rounded-full" style={{ background: typeColors[t] }} />}
            {t}
          </button>
        ))}
      </div>

      {/* Overlay UI */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between" style={{ zIndex: 401 }}>
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] shadow-sm text-gray-700">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {filteredDrivers.length} chauffeur{filteredDrivers.length > 1 ? "s" : ""} {filter !== "Tous" ? filter : ""} à proximité
        </div>
        <div className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1.5 rounded-full shadow-md shadow-blue-500/30">
          <Navigation className="w-3 h-3" />
          GPS actif
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-12 right-3 flex flex-col gap-1" style={{ zIndex: 401 }}>
        {filteredDrivers.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full pl-1.5 pr-2.5 py-1 text-[9px] shadow-md"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="text-slate-400">· {d.eta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}