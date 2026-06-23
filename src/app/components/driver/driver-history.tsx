import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Bike, Package, Truck, Users, Route, Filter, Search,
  Star, MapPin, Clock, Download, Calendar, ChevronRight, Eye, X,
  Phone, MessageSquare, Flag, Copy, Check, Navigation, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import { downloadBlob } from "../utils";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
type Category = "all" | "courses" | "livraisons" | "groupees" | "transport" | "covoiturage";

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
  status: "completed" | "cancelled" | "dispute";
  statusLabel: string;
  statusColor: string;
  Icon: React.ElementType;
  color: string;
  clientName: string;
  clientInitials: string;
  clientRating: number;
  myRatingOfClient: number | null;
  vehicle: string;
  distance: string;
  duration: string;
  paymentMethod: string;
  otp?: string;
  tip?: number;
}

/* ─── Mock ─── */
const historyItems: HistoryItem[] = [
  { id: "IPP-D-20260411-004", cat: "courses", type: "Course moto", from: "Cadjehoun", to: "CNHU", date: "11 Avr 2026", time: "12:05", earning: 950, commission: 143, net: 807, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Bike, color: "#1E6091", clientName: "Gbètoho Bokossa", clientInitials: "GB", clientRating: 4.8, myRatingOfClient: 5, vehicle: "Honda CB125", distance: "3.1 km", duration: "10 min", paymentMethod: "IPPOO Cash" },
  { id: "IPP-D-20260411-003", cat: "courses", type: "Course moto", from: "Akpakpa", to: "Gbègamey", date: "11 Avr 2026", time: "10:48", earning: 800, commission: 120, net: 680, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Bike, color: "#1E6091", clientName: "Aidatou Bokossa", clientInitials: "AB", clientRating: 4.6, myRatingOfClient: 4, vehicle: "Honda CB125", distance: "4.8 km", duration: "14 min", paymentMethod: "IPPOO Cash" },
  { id: "IPP-D-20260411-002", cat: "livraisons", type: "Livraison colis", from: "St-Michel", to: "Godomey", date: "11 Avr 2026", time: "09:15", earning: 1800, commission: 270, net: 1530, status: "completed", statusLabel: "Livree", statusColor: "bg-emerald-50 text-emerald-600", Icon: Package, color: "#F77F00", clientName: "Aidatou Tokpanou", clientInitials: "AT", clientRating: 4.7, myRatingOfClient: 5, vehicle: "Moto cargo", distance: "6.8 km", duration: "25 min", paymentMethod: "IPPOO Cash", otp: "847291" },
  { id: "IPP-D-20260411-001", cat: "courses", type: "Course moto", from: "UAC", to: "Dantokpa", date: "11 Avr 2026", time: "07:32", earning: 1200, commission: 180, net: 1020, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Bike, color: "#1E6091", clientName: "Fifamè Dossou", clientInitials: "FD", clientRating: 4.9, myRatingOfClient: 5, vehicle: "Honda CB125", distance: "5.2 km", duration: "15 min", paymentMethod: "IPPOO Cash", tip: 200 },
  { id: "IPP-D-20260410-005", cat: "courses", type: "Course voiture", from: "Aeroport", to: "Hotel du Lac", date: "10 Avr 2026", time: "16:45", earning: 3500, commission: 525, net: 2975, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Bike, color: "#1E6091", clientName: "Sessinou Adechian", clientInitials: "SA", clientRating: 4.5, myRatingOfClient: null, vehicle: "Toyota Yaris", distance: "8.1 km", duration: "18 min", paymentMethod: "IPPOO Cash" },
  { id: "IPP-D-20260410-004", cat: "covoiturage", type: "Covoiturage", from: "Cotonou", to: "Porto-Novo", date: "10 Avr 2026", time: "14:00", earning: 2000, commission: 300, net: 1700, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Route, color: "#06B6D4", clientName: "Fifamè Dossou", clientInitials: "FD", clientRating: 4.9, myRatingOfClient: 5, vehicle: "Toyota Yaris", distance: "35 km", duration: "45 min", paymentMethod: "IPPOO Cash" },
  { id: "IPP-D-20260410-003", cat: "courses", type: "Course moto", from: "Zongo", to: "CNHU", date: "10 Avr 2026", time: "11:20", earning: 600, commission: 0, net: 0, status: "cancelled", statusLabel: "Annulee", statusColor: "bg-red-50 text-red-500", Icon: Bike, color: "#1E6091", clientName: "", clientInitials: "XX", clientRating: 0, myRatingOfClient: null, vehicle: "Honda CB125", distance: "", duration: "", paymentMethod: "Annulee" },
  { id: "IPP-D-20260409-002", cat: "transport", type: "Demenagement", from: "Cotonou Centre", to: "Abomey-Calavi", date: "09 Avr 2026", time: "10:00", earning: 7500, commission: 1125, net: 6375, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", Icon: Truck, color: "#D62828", clientName: "Aidatou Bokossa", clientInitials: "AB", clientRating: 4.6, myRatingOfClient: 4, vehicle: "Camionnette", distance: "12.4 km", duration: "35 min", paymentMethod: "IPPOO Cash" },
  { id: "IPP-D-20260409-001", cat: "groupees", type: "Commande campus", from: "Dantokpa", to: "Campus UAC", date: "09 Avr 2026", time: "08:15", earning: 2400, commission: 360, net: 2040, status: "completed", statusLabel: "Livree", statusColor: "bg-emerald-50 text-emerald-600", Icon: Users, color: "#8B5CF6", clientName: "Gbètoho Bokossa", clientInitials: "GB", clientRating: 4.8, myRatingOfClient: 5, vehicle: "Tricycle", distance: "7.5 km", duration: "30 min", paymentMethod: "IPPOO Cash" },
];

const filters: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tout", icon: Filter },
  { id: "courses", label: "Courses", icon: Bike },
  { id: "livraisons", label: "Livraisons", icon: Package },
  { id: "groupees", label: "Groupees", icon: Users },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "covoiturage", label: "Covoiturage", icon: Route },
];

export function DriverHistoryPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const filtered = historyItems
    .filter(i => active === "all" || i.cat === active)
    .filter(i => !searchQuery || i.type.toLowerCase().includes(searchQuery.toLowerCase()) || i.from.toLowerCase().includes(searchQuery.toLowerCase()) || i.to.toLowerCase().includes(searchQuery.toLowerCase()) || i.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalNet = historyItems.filter(i => i.status === "completed").reduce((s, i) => s + i.net, 0);
  const totalCommission = historyItems.filter(i => i.status === "completed").reduce((s, i) => s + i.commission, 0);

  const exportHistory = () => {
    const csv = "ID;Type;Date;Heure;Client;De;Vers;Brut;Commission;Net;Statut\n" +
      historyItems.map(i => `${i.id};${i.type};${i.date};${i.time};${i.clientName};${i.from};${i.to};${i.earning};${i.commission};${i.net};${i.statusLabel}`).join("\n");
    downloadBlob(csv, "ippoo_driver_historique.csv", "text/csv;charset=utf-8");
    toast.success("Historique exporte");
  };

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E6091] to-[#2A9D8F] pt-12 pb-5 px-5 relative overflow-hidden">
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
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune mission trouvee</p>
          </div>
        )}
        {filtered.map(item => (
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
              {item.tip && item.tip > 0 && <p className="text-[#F77F00] text-[8px]">+{item.tip} F pourboire</p>}
              <div className="flex items-center gap-0.5 justify-end mt-0.5">
                <ProfileAvatar initials={item.clientInitials} size={14} />
                <span className="text-slate-400 text-[8px]">{item.clientName.split(" ")[0]}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
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

            {/* Client */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 mb-4">
              <ProfileAvatar initials={selectedItem.clientInitials} size={40} />
              <div className="flex-1">
                <p className="text-slate-700 text-xs">{selectedItem.clientName}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                  <span className="text-slate-500 text-[10px]">{selectedItem.clientRating}</span>
                </div>
              </div>
              {selectedItem.myRatingOfClient && (
                <div className="text-right">
                  <p className="text-slate-400 text-[8px]">Ma note client</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: selectedItem.myRatingOfClient }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-[#2A9D8F] fill-[#2A9D8F]" />
                    ))}
                  </div>
                </div>
              )}
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
                { label: "Paiement", value: selectedItem.paymentMethod },
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
                  {selectedItem.tip && selectedItem.tip > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">Pourboire</span>
                      <span className="text-[#F77F00]" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{selectedItem.tip.toLocaleString()} F</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-200 pt-1.5 flex justify-between text-xs">
                    <span className="text-emerald-700">Gain net</span>
                    <span className="text-emerald-700" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                      {(selectedItem.net + (selectedItem.tip || 0)).toLocaleString()} F
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
