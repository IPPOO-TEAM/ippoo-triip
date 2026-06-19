import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Download,
  Bike, Package, Truck, Users, Globe, Plane, MapPin, Clock,
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, Filter, RotateCcw
} from "lucide-react";
import { getAvatar } from "../avatars";

/* ─── Mock Data ─── */
const RIDES = [
  { id: "IP-9001", type: "course" as const, service: "Taxi-Moto", client: "Dossou Akotchédjé", clientInit: "DA", driver: "Hounkpatin Akotchaye", driverInit: "HA", from: "Marché Dantokpa", to: "Cadjéhoun", distance: "4.2 km", fare: "800 FCFA", commission: "160 FCFA", status: "completed" as const, time: "14:32", date: "11 Avr 2026", duration: "12 min" },
  { id: "IP-9002", type: "livraison" as const, service: "Livraison", client: "Fifamè Dossou-Yovo", clientInit: "FD", driver: "Sèdégan Houéfa", driverInit: "AD", from: "Tokpa Hoho", to: "Akpakpa", distance: "6.8 km", fare: "1,500 FCFA", commission: "300 FCFA", status: "in_progress" as const, time: "14:15", date: "11 Avr 2026", duration: "En cours" },
  { id: "IP-9003", type: "transport" as const, service: "Transport lourd", client: "Sessinou Akotègnon", clientInit: "SA", driver: "Togbédji Mensah", driverInit: "TM", from: "Zone Industrielle", to: "Ganhi", distance: "8.5 km", fare: "15,000 FCFA", commission: "3,000 FCFA", status: "completed" as const, time: "13:45", date: "11 Avr 2026", duration: "35 min" },
  { id: "IP-9004", type: "course" as const, service: "Covoiturage", client: "Aïdatou Bello", clientInit: "AB", driver: "Aïdatou Bello", driverInit: "AB", from: "Abomey-Calavi", to: "Cotonou Centre", distance: "15.2 km", fare: "2,500 FCFA", commission: "500 FCFA", status: "in_progress" as const, time: "14:00", date: "11 Avr 2026", duration: "En cours" },
  { id: "IP-9005", type: "livraison" as const, service: "Livraison", client: "Gbètoho Bocco", clientInit: "GB", driver: "Koffi Adjibadé", driverInit: "GB", from: "Fidjrossè", to: "Haie Vive", distance: "3.1 km", fare: "1,000 FCFA", commission: "200 FCFA", status: "cancelled" as const, time: "13:20", date: "11 Avr 2026", duration: "—" },
  { id: "IP-9006", type: "course" as const, service: "Taxi-Moto", client: "Togbédji Mensah", clientInit: "TM", driver: "Hounkpatin Akotchaye", driverInit: "HA", from: "Stade de l'Amitié", to: "Étoile Rouge", distance: "2.8 km", fare: "600 FCFA", commission: "120 FCFA", status: "completed" as const, time: "12:50", date: "11 Avr 2026", duration: "9 min" },
  { id: "IP-9007", type: "groupee" as const, service: "Commande groupée", client: "Adjovi Ganfon", clientInit: "AD", driver: "Fifamè Agbodjèlou", driverInit: "FD", from: "Marché Ganhi", to: "Zogbohouè", distance: "5.4 km", fare: "3,200 FCFA", commission: "640 FCFA", status: "pending" as const, time: "14:40", date: "11 Avr 2026", duration: "—" },
  { id: "IP-9008", type: "course" as const, service: "IPPOO AIR", client: "Sessinou Akotègnon", clientInit: "SA", driver: "—", driverInit: "SA", from: "Aéroport Cadjéhoun", to: "Hôtel du Lac", distance: "7.2 km", fare: "25,000 FCFA", commission: "5,000 FCFA", status: "pending" as const, time: "15:00", date: "11 Avr 2026", duration: "—" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: "Terminée", color: "#2A9D8F", bg: "bg-emerald-50", icon: CheckCircle2 },
  in_progress: { label: "En cours", color: "#1E6091", bg: "bg-blue-50", icon: Clock },
  cancelled: { label: "Annulée", color: "#D62828", bg: "bg-red-50", icon: XCircle },
  pending: { label: "En attente", color: "#F77F00", bg: "bg-orange-50", icon: Clock },
};

const serviceIcons: Record<string, any> = {
  "Taxi-Moto": Bike,
  "Livraison": Package,
  "Transport lourd": Truck,
  "Covoiturage": Globe,
  "Commande groupée": Users,
  "IPPOO AIR": Plane,
};

export function AdminRidesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState<typeof RIDES[0] | null>(null);

  const filtered = RIDES.filter((r) => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase()) || r.driver.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchService = serviceFilter === "all" || r.service === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Courses & Missions</h1>
          <p className="text-slate-500 text-xs mt-1">Suivi en temps réel de toutes les courses et livraisons</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "En cours", value: "847", color: "#1E6091", icon: Clock },
          { label: "Terminées (jour)", value: "6,234", color: "#2A9D8F", icon: CheckCircle2 },
          { label: "Annulées (jour)", value: "142", color: "#D62828", icon: XCircle },
          { label: "En attente", value: "35", color: "#F77F00", icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-slate-400 text-[10px]">{s.label}</span>
            </div>
            <p className="text-xl text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher par ID, client ou chauffeur..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none flex-1" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "in_progress", "completed", "cancelled", "pending"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs transition ${statusFilter === s ? "bg-[#1E6091] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            >{s === "all" ? "Tous" : statusConfig[s]?.label}</button>
          ))}
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none"
        >
          <option value="all">Tous services</option>
          {["Taxi-Moto", "Livraison", "Transport lourd", "Covoiturage", "Commande groupée", "IPPOO AIR"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Detail modal */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedRide(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setSelectedRide(null)} className="absolute top-4 right-4 text-slate-400"><XCircle className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${statusConfig[selectedRide.status].color}15` }}>
                {(() => { const Icon = serviceIcons[selectedRide.service] || Bike; return <Icon className="w-6 h-6" style={{ color: statusConfig[selectedRide.status].color }} />; })()}
              </div>
              <div>
                <h2 className="text-slate-900">{selectedRide.id}</h2>
                <p className="text-slate-400 text-xs">{selectedRide.service} · {selectedRide.date} à {selectedRide.time}</p>
              </div>
            </div>

            {/* Route */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
                  <div className="w-px h-6 bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-[#D62828]" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-sm">{selectedRide.from}</p>
                  <div className="h-4" />
                  <p className="text-slate-700 text-sm">{selectedRide.to}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">Client</p>
                <div className="flex items-center gap-2">
                  <img src={getAvatar(selectedRide.clientInit) || ""} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <p className="text-slate-700 text-xs">{selectedRide.client}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">Chauffeur</p>
                <div className="flex items-center gap-2">
                  <img src={getAvatar(selectedRide.driverInit) || ""} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <p className="text-slate-700 text-xs">{selectedRide.driver}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Distance", value: selectedRide.distance },
                { label: "Tarif", value: selectedRide.fare },
                { label: "Commission", value: selectedRide.commission },
                { label: "Durée", value: selectedRide.duration },
                { label: "Statut", value: statusConfig[selectedRide.status].label },
                { label: "Date", value: selectedRide.date },
              ].map((m, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400">{m.label}</p>
                  <p className="text-xs text-slate-700 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {selectedRide.status === "in_progress" && (
                <button className="flex-1 bg-red-50 text-[#D62828] py-2.5 rounded-xl text-xs">Annuler la course</button>
              )}
              <button className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs">Contacter client</button>
              <button className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs">Contacter chauffeur</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["ID", "Service", "Client", "Chauffeur", "Trajet", "Tarif", "Statut", "Heure", ""].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = statusConfig[r.status];
                const SvcIcon = serviceIcons[r.service] || Bike;
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedRide(r)}>
                    <td className="px-4 py-3 text-xs text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SvcIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600">{r.service}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={getAvatar(r.clientInit) || ""} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs text-slate-600">{r.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={getAvatar(r.driverInit) || ""} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs text-slate-600">{r.driver}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span className="truncate max-w-[80px]">{r.from}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[80px]">{r.to}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700" style={{ fontFamily: "'Space Grotesk', monospace" }}>{r.fare}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">{r.time}</td>
                    <td className="px-4 py-3">
                      <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-slate-400 text-[10px]">{filtered.length} résultat(s)</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg bg-[#1E6091] text-white text-xs">1</button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
