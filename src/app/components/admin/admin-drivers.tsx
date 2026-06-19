import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Download,
  CheckCircle2, XCircle, Clock, Star, Car, Bike, Truck, Package,
  FileText, Shield, Phone, MapPin, Calendar, AlertTriangle, UserCheck,
  TrendingUp, Filter, Ban
} from "lucide-react";
import { getAvatar } from "../avatars";

/* ─── Mock Data ─── */
const DRIVERS = [
  { id: "DRV-001", name: "Hounkpatin Akotchaye", initials: "HA", phone: "+229 97 45 67 89", city: "Cotonou", vehicle: "Moto TVS", type: "Taxi-Moto", rides: 1247, rating: 4.87, revenue: "2,450,000 FCFA", status: "online" as const, docs: "verified" as const, joined: "15 Jun 2025", acceptance: 96, cancellation: 2.1 },
  { id: "DRV-002", name: "Koffi Adjibadé", initials: "GB", phone: "+229 96 33 44 55", city: "Cotonou", vehicle: "Bajaj Boxer", type: "Taxi-Moto", rides: 984, rating: 4.92, revenue: "1,870,000 FCFA", status: "online" as const, docs: "verified" as const, joined: "22 Aug 2025", acceptance: 98, cancellation: 1.3 },
  { id: "DRV-003", name: "Aïdatou Bello", initials: "AB", phone: "+229 91 66 77 88", city: "Abomey-Calavi", vehicle: "Toyota Yaris", type: "Covoiturage", rides: 542, rating: 4.95, revenue: "1,120,000 FCFA", status: "offline" as const, docs: "verified" as const, joined: "10 Oct 2025", acceptance: 94, cancellation: 0.8 },
  { id: "DRV-004", name: "Togbédji Mensah", initials: "TM", phone: "+229 95 11 22 33", city: "Parakou", vehicle: "Pickup Hilux", type: "Transport lourd", rides: 312, rating: 4.78, revenue: "980,000 FCFA", status: "online" as const, docs: "pending" as const, joined: "05 Jan 2026", acceptance: 89, cancellation: 3.5 },
  { id: "DRV-005", name: "Sèdégan Houéfa", initials: "AD", phone: "+229 97 99 88 77", city: "Porto-Novo", vehicle: "Honda ACE", type: "Livraison", rides: 678, rating: 4.65, revenue: "1,350,000 FCFA", status: "suspended" as const, docs: "verified" as const, joined: "18 Sep 2025", acceptance: 85, cancellation: 5.2 },
  { id: "DRV-006", name: "Adjagba Cocou", initials: "SA", phone: "+229 96 55 44 33", city: "Cotonou", vehicle: "Moto Haojue", type: "Taxi-Moto", rides: 89, rating: 4.3, revenue: "145,000 FCFA", status: "pending" as const, docs: "pending" as const, joined: "02 Avr 2026", acceptance: 0, cancellation: 0 },
  { id: "DRV-007", name: "Fifamè Agbodjèlou", initials: "FD", phone: "+229 91 22 33 44", city: "Bohicon", vehicle: "Suzuki GN125", type: "Livraison", rides: 423, rating: 4.71, revenue: "820,000 FCFA", status: "offline" as const, docs: "expired" as const, joined: "12 Dec 2025", acceptance: 91, cancellation: 2.8 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  online: { label: "En ligne", color: "#2A9D8F", bg: "bg-emerald-50" },
  offline: { label: "Hors ligne", color: "#94a3b8", bg: "bg-slate-100" },
  suspended: { label: "Suspendu", color: "#D62828", bg: "bg-red-50" },
  pending: { label: "En attente", color: "#F77F00", bg: "bg-orange-50" },
};

const docsConfig: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: "Vérifié", color: "#2A9D8F", bg: "bg-emerald-50" },
  pending: { label: "En attente", color: "#F77F00", bg: "bg-orange-50" },
  expired: { label: "Expiré", color: "#D62828", bg: "bg-red-50" },
};

export function AdminDriversPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<typeof DRIVERS[0] | null>(null);

  const filtered = DRIVERS.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des Chauffeurs / Agents</h1>
          <p className="text-slate-500 text-xs mt-1">{DRIVERS.length} chauffeurs enregistrés</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total chauffeurs", value: "3,847", icon: Car, color: "#1E6091" },
          { label: "En ligne", value: "1,204", icon: CheckCircle2, color: "#2A9D8F" },
          { label: "En attente d'approbation", value: "23", icon: Clock, color: "#F77F00" },
          { label: "Documents expirés", value: "8", icon: AlertTriangle, color: "#D62828" },
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher un chauffeur..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none flex-1" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            { key: "online", label: "En ligne" },
            { key: "pending", label: "En attente" },
            { key: "suspended", label: "Suspendus" },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs transition ${statusFilter === f.key ? "bg-[#1E6091] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDriver(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setSelectedDriver(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <img src={getAvatar(selectedDriver.initials) || ""} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h2 className="text-slate-900">{selectedDriver.name}</h2>
                <p className="text-slate-400 text-xs">{selectedDriver.id} · {selectedDriver.type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[selectedDriver.status].bg}`} style={{ color: statusConfig[selectedDriver.status].color }}>
                    {statusConfig[selectedDriver.status].label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${docsConfig[selectedDriver.docs].bg}`} style={{ color: docsConfig[selectedDriver.docs].color }}>
                    Docs: {docsConfig[selectedDriver.docs].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Phone, label: "Téléphone", value: selectedDriver.phone },
                { icon: MapPin, label: "Ville", value: selectedDriver.city },
                { icon: Car, label: "Véhicule", value: selectedDriver.vehicle },
                { icon: Calendar, label: "Inscrit le", value: selectedDriver.joined },
                { icon: Star, label: "Note", value: `${selectedDriver.rating} / 5` },
                { icon: TrendingUp, label: "Taux acceptation", value: `${selectedDriver.acceptance}%` },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400">{item.label}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl text-[#2A9D8F]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedDriver.rides}</p>
                <p className="text-[10px] text-slate-500 mt-1">Courses effectuées</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-lg text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedDriver.revenue}</p>
                <p className="text-[10px] text-slate-500 mt-1">Revenus totaux</p>
              </div>
            </div>

            {/* Documents section */}
            <div className="mb-5">
              <h4 className="text-slate-700 text-sm mb-3">Documents</h4>
              <div className="space-y-2">
                {[
                  { name: "Permis de conduire", status: selectedDriver.docs === "verified" ? "Vérifié" : "En attente" },
                  { name: "Carte d'identité", status: "Vérifié" },
                  { name: "Assurance véhicule", status: selectedDriver.docs === "expired" ? "Expiré" : "Vérifié" },
                  { name: "Carte grise", status: selectedDriver.docs === "pending" ? "En attente" : "Vérifié" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-600">{doc.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      doc.status === "Vérifié" ? "bg-emerald-50 text-[#2A9D8F]" :
                      doc.status === "Expiré" ? "bg-red-50 text-[#D62828]" :
                      "bg-orange-50 text-[#F77F00]"
                    }`}>{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {selectedDriver.docs === "pending" && (
                <button className="flex-1 bg-[#2A9D8F] text-white py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Approuver
                </button>
              )}
              {selectedDriver.status !== "suspended" ? (
                <button className="flex-1 bg-red-50 text-[#D62828] py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <Ban className="w-4 h-4" /> Suspendre
                </button>
              ) : (
                <button className="flex-1 bg-emerald-50 text-[#2A9D8F] py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Réactiver
                </button>
              )}
              <button className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs">Contacter</button>
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
                {["Chauffeur", "Type", "Véhicule", "Courses", "Note", "Revenus", "Docs", "Statut", ""].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const st = statusConfig[d.status];
                const dc = docsConfig[d.docs];
                return (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedDriver(d)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={getAvatar(d.initials) || ""} alt="" className="w-8 h-8 rounded-full object-cover" />
                          {d.status === "online" && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2A9D8F] rounded-full border-2 border-white" />}
                        </div>
                        <div>
                          <p className="text-slate-700 text-sm">{d.name}</p>
                          <p className="text-slate-400 text-[10px]">{d.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{d.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{d.vehicle}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{d.rides}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                        <span className="text-xs text-slate-600">{d.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{d.revenue}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${dc.bg}`} style={{ color: dc.color }}>{dc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
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
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1E6091] text-white text-xs">1</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
