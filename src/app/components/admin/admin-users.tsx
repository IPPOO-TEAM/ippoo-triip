import { useState } from "react";
import {
  Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight, Eye, Ban,
  CheckCircle2, XCircle, Phone, Mail, MapPin, Calendar, Bike, Package,
  Truck, Download, UserPlus, TrendingUp, Users, Star, Shield
} from "lucide-react";
import { getAvatar } from "../avatars";
import { toast } from "sonner";
import { downloadBlob } from "../utils";

/* ─── Mock Data ─── */
const USERS = [
  { id: "USR-001", name: "Dossou Akotchédjé", initials: "DA", phone: "+229 97 12 34 56", email: "dossou.a@mail.bj", city: "Cotonou", rides: 84, spent: "127,500 FCFA", rating: 4.8, status: "active" as const, joined: "12 Jan 2026", lastActive: "Il y a 2h" },
  { id: "USR-002", name: "Fifamè Dossou-Yovo", initials: "FD", phone: "+229 96 22 33 44", email: "fifame.d@mail.bj", city: "Cotonou", rides: 156, spent: "342,000 FCFA", rating: 4.9, status: "active" as const, joined: "03 Nov 2025", lastActive: "Il y a 15 min" },
  { id: "USR-003", name: "Aïdatou Bello", initials: "AB", phone: "+229 91 55 66 77", email: "aidatou.b@mail.bj", city: "Abomey-Calavi", rides: 62, spent: "95,000 FCFA", rating: 4.7, status: "active" as const, joined: "20 Fév 2026", lastActive: "Il y a 1h" },
  { id: "USR-004", name: "Gbètoho Bocco", initials: "GB", phone: "+229 95 44 55 66", email: "gbetoho.b@mail.bj", city: "Porto-Novo", rides: 28, spent: "42,300 FCFA", rating: 4.5, status: "suspended" as const, joined: "15 Mar 2026", lastActive: "Il y a 3 jours" },
  { id: "USR-005", name: "Sessinou Akotègnon", initials: "SA", phone: "+229 97 88 99 00", email: "sessinou.a@mail.bj", city: "Cotonou", rides: 210, spent: "890,000 FCFA", rating: 5.0, status: "active" as const, joined: "01 Sep 2025", lastActive: "En ligne" },
  { id: "USR-006", name: "Togbédji Mensah", initials: "TM", phone: "+229 96 11 22 33", email: "togbedji.m@mail.bj", city: "Parakou", rides: 45, spent: "68,200 FCFA", rating: 4.6, status: "active" as const, joined: "28 Déc 2025", lastActive: "Il y a 5h" },
  { id: "USR-007", name: "Adjovi Ganfon", initials: "AD", phone: "+229 91 77 88 99", email: "adjovi.g@mail.bj", city: "Bohicon", rides: 12, spent: "18,500 FCFA", rating: 4.3, status: "inactive" as const, joined: "05 Avr 2026", lastActive: "Il y a 2 sem" },
  { id: "USR-008", name: "Hounkanrin Toffa", initials: "HA", phone: "+229 95 33 44 55", email: "hounkanrin.t@mail.bj", city: "Natitingou", rides: 8, spent: "12,000 FCFA", rating: 4.2, status: "active" as const, joined: "08 Avr 2026", lastActive: "Il y a 30 min" },
];

const statusConfig = {
  active: { label: "Actif", color: "#2A9D8F", bg: "bg-emerald-50" },
  suspended: { label: "Suspendu", color: "#D62828", bg: "bg-red-50" },
  inactive: { label: "Inactif", color: "#94a3b8", bg: "bg-slate-50" },
};

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<typeof USERS[0] | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const exportCSV = () => {
    const header = "ID,Nom,Téléphone,Email,Ville,Courses,Dépenses,Note,Statut,Inscrit\n";
    const rows = USERS.map(u => [u.id, u.name, u.phone, u.email, u.city, u.rides, u.spent, u.rating, u.status, u.joined].join(","));
    downloadBlob(header + rows.join("\n"), `clients-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast.success(`${USERS.length} clients exportés`);
  };

  const filtered = USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des Clients</h1>
          <p className="text-slate-500 text-xs mt-1">{USERS.length} clients enregistrés sur la plateforme</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={() => toast.info("Création de compte : invitez le client par SMS/Email", { description: "Module d'inscription en intégration" })} className="flex items-center gap-2 bg-[#1E6091] text-white px-4 py-2 rounded-xl text-xs shadow-lg shadow-blue-400/20">
            <UserPlus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total clients", value: "152,847", icon: Users, color: "#1E6091" },
          { label: "Actifs (30j)", value: "89,420", icon: CheckCircle2, color: "#2A9D8F" },
          { label: "Nouveaux (7j)", value: "1,247", icon: UserPlus, color: "#F77F00" },
          { label: "Note moyenne", value: "4.72", icon: Star, color: "#E9C46A" },
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
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-600 outline-none flex-1"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tous" },
            { key: "active", label: "Actifs" },
            { key: "suspended", label: "Suspendus" },
            { key: "inactive", label: "Inactifs" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs transition ${
                statusFilter === f.key ? "bg-[#1E6091] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-[#1E6091]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <img src={getAvatar(selectedUser.initials) || ""} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h2 className="title-gradient">{selectedUser.name}</h2>
                <p className="text-slate-400 text-xs">{selectedUser.id}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${statusConfig[selectedUser.status].bg}`} style={{ color: statusConfig[selectedUser.status].color }}>
                  {statusConfig[selectedUser.status].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Phone, label: "Téléphone", value: selectedUser.phone },
                { icon: Mail, label: "Email", value: selectedUser.email },
                { icon: MapPin, label: "Ville", value: selectedUser.city },
                { icon: Calendar, label: "Inscrit le", value: selectedUser.joined },
                { icon: Bike, label: "Total courses", value: selectedUser.rides.toString() },
                { icon: Star, label: "Note", value: selectedUser.rating.toString() },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400">{item.label}</span>
                  </div>
                  <p className="text-slate-700 text-sm truncate">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <p className="text-slate-400 text-[10px] mb-1">Dépenses totales</p>
              <p className="text-xl text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedUser.spent}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { toast.success(`Notification envoyée à ${selectedUser.name}`); setSelectedUser(null); }}
                className="flex-1 bg-[#2A9D8F] text-white py-2.5 rounded-xl text-xs"
              >
                Envoyer notification
              </button>
              {selectedUser.status === "active" ? (
                <button
                  onClick={() => { toast.warning(`${selectedUser.name} a été suspendu`); setSelectedUser(null); }}
                  className="flex-1 bg-red-50 text-[#D62828] py-2.5 rounded-xl text-xs"
                >
                  Suspendre
                </button>
              ) : (
                <button
                  onClick={() => { toast.success(`${selectedUser.name} a été réactivé`); setSelectedUser(null); }}
                  className="flex-1 bg-emerald-50 text-[#2A9D8F] py-2.5 rounded-xl text-xs"
                >
                  Réactiver
                </button>
              )}
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
                {["Client", "Ville", "Courses", "Dépenses", "Note", "Statut", "Dernière activité", ""].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const st = statusConfig[u.status];
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={getAvatar(u.initials) || ""} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-slate-700 text-sm">{u.name}</p>
                          <p className="text-slate-400 text-[10px]">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.city}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{u.rides}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{u.spent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                        <span className="text-xs text-slate-600">{u.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">{u.lastActive}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} aria-label="Voir le détail" className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-slate-400 text-[10px]">{filtered.length} résultat(s)</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Page précédente" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${page === n ? "bg-[#1E6091] text-white" : "text-slate-400 hover:bg-slate-100"}`}
              >
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Page suivante" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
