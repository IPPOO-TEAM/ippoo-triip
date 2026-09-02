import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Bike, Package, Truck, Users, Route, Filter, Search,
  Clock, Download, X, Copy, Flag
} from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "../utils";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* --- Types --- */
type Category = "all" | "courses" | "livraisons" | "groupees" | "transport" | "covoiturage";

interface Ride {
  id: string;
  serviceType: string;
  status: string;
  origin: { label?: string };
  destination: { label?: string };
  priceXOF: number;
  distanceKm: number;
  durationMin: number;
  createdAt: string;
  completedAt: string | null;
  vehicle?: string;
}

interface HistoryItem {
  id: string;
  cat: string;
  type: string;
  from: string;
  to: string;
  date: string;
  time: string;
  earning: number;
  commission: number;
  net: number;
  status: "completed" | "cancelled" | "other";
  statusLabel: string;
  statusColor: string;
  Icon: React.ElementType;
  color: string;
  vehicle: string;
  distance: string;
  duration: string;
}

/* --- Config --- */
const filters: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tout", icon: Filter },
  { id: "courses", label: "Courses", icon: Bike },
  { id: "livraisons", label: "Livraisons", icon: Package },
  { id: "groupees", label: "Groupees", icon: Users },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "covoiturage", label: "Covoiturage", icon: Route },
];

const TYPE_MAP: Record<string, { cat: Category; label: string; Icon: React.ElementType; color: string }> = {
  taxi_moto: { cat: "courses", label: "Course moto", Icon: Bike, color: "#1E6091" },
  delivery: { cat: "livraisons", label: "Livraison", Icon: Package, color: "#F77F00" },
  heavy_transport: { cat: "transport", label: "Transport", Icon: Truck, color: "#D62828" },
  carpool: { cat: "covoiturage", label: "Covoiturage", Icon: Route, color: "#06B6D4" },
};

function mapRideToHistory(r: Ride): HistoryItem {
  const info = TYPE_MAP[r.serviceType] ?? { cat: "courses" as Category, label: "Course", Icon: Bike, color: "#1E6091" };
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(r.completedAt ?? r.createdAt);
  const isCompleted = r.status === "completed";
  const earning = r.priceXOF ?? 0;
  const commission = isCompleted ? Math.round(earning * 0.15) : 0;
  const net = isCompleted ? earning - commission : 0;
  const status: HistoryItem["status"] = r.status === "completed" ? "completed" : r.status === "cancelled" ? "cancelled" : "other";
  return {
    id: r.id,
    cat: info.cat,
    type: info.label,
    from: r.origin?.label ?? "—",
    to: r.destination?.label ?? "—",
    date: `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`,
    time: `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
    earning,
    commission,
    net,
    status,
    statusLabel: status === "completed" ? "Terminee" : status === "cancelled" ? "Annulee" : r.status,
    statusColor: status === "completed" ? "bg-emerald-50 text-emerald-600" : status === "cancelled" ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500",
    Icon: info.Icon,
    color: info.color,
    vehicle: r.vehicle || "—",
    distance: r.distanceKm ? `${r.distanceKm} km` : "—",
    duration: r.durationMin ? `${r.durationMin} min` : "—",
  };
}

export function DriverHistoryPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ items: Ride[] }>("/rides?page=1&pageSize=50");
        if (!cancelled) setHistoryItems(Array.isArray(res?.items) ? res.items.map(mapRideToHistory) : []);
      } catch {
        if (!cancelled) setHistoryItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = historyItems
    .filter(i => active === "all" || i.cat === active)
    .filter(i => !searchQuery || i.type.toLowerCase().includes(searchQuery.toLowerCase()) || i.from.toLowerCase().includes(searchQuery.toLowerCase()) || i.to.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalNet = historyItems.filter(i => i.status === "completed").reduce((s, i) => s + i.net, 0);

  const exportHistory = () => {
    const csv = "ID;Type;Date;Heure;De;Vers;Brut;Commission;Net;Statut\n" +
      historyItems.map(i => `${i.id};${i.type};${i.date};${i.time};${i.from};${i.to};${i.earning};${i.commission};${i.net};${i.statusLabel}`).join("\n");
    downloadBlob(csv, "ippoo_driver_historique.csv", "text/csv;charset=utf-8");
    toast.success("Historique exporte");
  };

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#1E6091] pt-12 pb-5 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white text-sm">Historique missions</p>
            <p className="text-white/50 text-[10px]">{historyItems.length} missions - Net: {totalNet.toLocaleString()} F</p>
          </div>
          <button onClick={exportHistory} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-white/30"
            placeholder="Rechercher une mission..."
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap border transition ${active === f.id ? "bg-[#1E6091] text-white border-[#1E6091]" : "bg-white text-slate-600 border-slate-200"}`}
          >
            <f.icon className="w-3 h-3" />
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#1E6091] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune mission trouvee</p>
          </div>
        ) : filtered.map(item => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-full bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 text-left active:bg-slate-50 transition"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}10` }}>
              <item.Icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-slate-700 text-xs truncate">{item.type}</p>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${item.statusColor}`}>{item.statusLabel}</span>
              </div>
              <p className="text-slate-400 text-[9px] truncate">{item.from} → {item.to}</p>
              <p className="text-slate-300 text-[8px]">{item.date} - {item.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs ${item.status === "completed" ? "text-emerald-500" : "text-slate-400"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {item.status === "completed" ? `+${item.net} F` : "0 F"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800 text-sm">{selectedItem.type}</p>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="text-center mb-5">
              <span className={`px-3 py-1 rounded-full text-[10px] ${selectedItem.statusColor}`}>{selectedItem.statusLabel}</span>
            </div>

            {/* Route */}
            <div className="flex items-start gap-3 mb-4 px-1">
              <div className="flex flex-col items-center mt-1">
                <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
                <div className="w-px h-8 bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-[#F77F00]" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-slate-400 text-[9px]">Depart</p>
                  <p className="text-slate-700 text-xs">{selectedItem.from}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px]">Destination</p>
                  <p className="text-slate-700 text-xs">{selectedItem.to}</p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Distance", value: selectedItem.distance },
                { label: "Duree", value: selectedItem.duration },
                { label: "Vehicule", value: selectedItem.vehicle },
                { label: "Date", value: `${selectedItem.date} - ${selectedItem.time}` },
              ].map((d, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-[9px]">{d.label}</p>
                  <p className="text-slate-700 text-xs">{d.value}</p>
                </div>
              ))}
            </div>

            {/* Earnings breakdown */}
            {selectedItem.status === "completed" && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                <p className="text-emerald-700 text-[10px] mb-2">Detail des gains</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Tarif brut</span>
                    <span className="text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedItem.earning.toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Commission IPPOO (15%)</span>
                    <span className="text-red-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>-{selectedItem.commission.toLocaleString()} F</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-1.5 flex justify-between text-xs">
                    <span className="text-emerald-700">Gain net</span>
                    <span className="text-emerald-700" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                      {selectedItem.net.toLocaleString()} F
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(selectedItem.id); toast.success("ID copie"); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-[10px] flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> {selectedItem.id}
              </button>
              <button
                onClick={() => { toast.info("Signalement envoye"); setSelectedItem(null); }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-500 text-[10px] flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" /> Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
