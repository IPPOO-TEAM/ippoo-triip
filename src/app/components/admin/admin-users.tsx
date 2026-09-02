import { useEffect, useState } from "react";
import {
  Search, MoreHorizontal, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Phone, Mail, MapPin, Calendar,
  Download, UserPlus, Users, Star, Loader2, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "../utils";
import { api } from "../../api/client";

/* --- Types --- */
type AdminUser = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  kycStatus: "pending" | "verified" | "rejected";
  createdAt: string;
};

type UsersResponse = { items: AdminUser[]; total: number; page: number; pageSize: number };

/* --- Config (statut KYC) --- */
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: "Vérifié", color: "#2A9D8F", bg: "bg-emerald-50" },
  pending: { label: "En attente", color: "#F77F00", bg: "bg-orange-50" },
  rejected: { label: "Rejeté", color: "#D62828", bg: "bg-red-50" },
};

const PAGE_SIZE = 20;

const initialsOf = (name: string) =>
  (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.get<UsersResponse>(`/admin/users?page=${page}&pageSize=${PAGE_SIZE}`);
        if (cancelled) return;
        setUsers(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!cancelled) { setUsers([]); setTotal(0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

  const exportCSV = () => {
    const header = "ID,Nom,Téléphone,Email,Ville,Statut KYC,Inscrit\n";
    const rows = users.map(u => [u.id, u.fullName, u.phone, u.email ?? "", u.city ?? "", u.kycStatus, fmtDate(u.createdAt)].join(","));
    downloadBlob(header + rows.join("\n"), `clients-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast.success(`${users.length} clients exportés`);
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.kycStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des Clients</h1>
          <p className="text-slate-500 text-xs mt-1">{total} client(s) enregistré(s) sur la plateforme</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={() => toast.info("Création de compte : invitez le client par SMS/Email", { description: "Module d'inscription en intégration" })} className="flex items-center gap-2 bg-[#1E6091] text-white px-4 py-2 rounded-xl text-xs shadow-sm shadow-blue-400/20">
            <UserPlus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total clients", value: String(total), icon: Users, color: "#1E6091" },
          { label: "KYC vérifiés", value: String(users.filter(u => u.kycStatus === "verified").length), icon: CheckCircle2, color: "#2A9D8F" },
          { label: "KYC en attente", value: String(users.filter(u => u.kycStatus === "pending").length), icon: UserPlus, color: "#F77F00" },
          { label: "KYC rejetés", value: String(users.filter(u => u.kycStatus === "rejected").length), icon: Star, color: "#D62828" },
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
            { key: "verified", label: "Vérifiés" },
            { key: "pending", label: "En attente" },
            { key: "rejected", label: "Rejetés" },
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
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-sm max-h-[80vh] overflow-y-auto">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-lg text-slate-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {initialsOf(selectedUser.fullName)}
              </div>
              <div>
                <h2 className="title-gradient">{selectedUser.fullName}</h2>
                <p className="text-slate-400 text-xs">{selectedUser.id}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${statusConfig[selectedUser.kycStatus]?.bg}`} style={{ color: statusConfig[selectedUser.kycStatus]?.color }}>
                  {statusConfig[selectedUser.kycStatus]?.label ?? selectedUser.kycStatus}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Phone, label: "Téléphone", value: selectedUser.phone || "—" },
                { icon: Mail, label: "Email", value: selectedUser.email || "—" },
                { icon: MapPin, label: "Ville", value: selectedUser.city || "—" },
                { icon: Calendar, label: "Inscrit le", value: fmtDate(selectedUser.createdAt) },
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
            <div className="flex gap-2">
              <button
                onClick={() => { toast.success(`Notification envoyée à ${selectedUser.fullName}`); setSelectedUser(null); }}
                className="flex-1 bg-[#2A9D8F] text-white py-2.5 rounded-xl text-xs"
              >
                Envoyer notification
              </button>
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
                {["Client", "Ville", "Statut KYC", "Inscrit le", ""].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map((u) => {
                const st = statusConfig[u.kycStatus];
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                          {initialsOf(u.fullName)}
                        </div>
                        <div>
                          <p className="text-slate-700 text-sm">{u.fullName}</p>
                          <p className="text-slate-400 text-[10px]">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st?.bg}`} style={{ color: st?.color }}>{st?.label ?? u.kycStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} aria-label="Voir le détail" className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-xs">Chargement des clients…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm text-slate-500">Aucun client pour le moment</p>
            <p className="text-xs mt-1">Les inscriptions apparaîtront ici automatiquement.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-slate-400 text-[10px]">{filtered.length} résultat(s)</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Page précédente" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 text-xs text-slate-500">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Page suivante" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
