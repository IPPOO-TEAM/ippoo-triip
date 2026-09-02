import { useEffect, useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal, Download,
  CheckCircle2, XCircle, Clock, Star, Car,
  FileText, Phone, MapPin, Calendar, AlertTriangle, UserCheck,
  TrendingUp, Ban, Loader2, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "../utils";
import { api } from "../../api/client";

/* --- Types --- */
type AdminDriver = {
  id: string;
  fullName: string;
  phone: string;
  city?: string;
  kycStatus: "pending" | "verified" | "rejected";
  vehicleType?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  rating?: number;
  totalRides?: number;
  isOnline?: boolean;
  createdAt: string;
};

type DriversResponse = { items: AdminDriver[]; total: number; page: number; pageSize: number };

/* --- Config --- */
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  online: { label: "En ligne", color: "#2A9D8F", bg: "bg-emerald-50" },
  offline: { label: "Hors ligne", color: "#94a3b8", bg: "bg-slate-100" },
};

const docsConfig: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: "Vérifié", color: "#2A9D8F", bg: "bg-emerald-50" },
  pending: { label: "En attente", color: "#F77F00", bg: "bg-orange-50" },
  rejected: { label: "Rejeté", color: "#D62828", bg: "bg-red-50" },
};

const vehicleLabel: Record<string, string> = {
  moto: "Moto", tricycle: "Tricycle", car: "Voiture", van: "Van", truck: "Camion",
};

const PAGE_SIZE = 20;

const initialsOf = (name: string) =>
  (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const statusOf = (d: AdminDriver) => (d.isOnline ? "online" : "offline");

export function AdminDriversPage() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.get<DriversResponse>(`/admin/drivers?page=${page}&pageSize=${PAGE_SIZE}`);
        if (cancelled) return;
        setDrivers(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!cancelled) { setDrivers([]); setTotal(0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

  const exportCSV = () => {
    const h = "ID,Nom,Téléphone,Ville,Véhicule,Plaque,Courses,Note,En ligne,KYC\n";
    const r = drivers.map(d => [d.id, d.fullName, d.phone, d.city ?? "", vehicleLabel[d.vehicleType ?? ""] ?? d.vehicleType ?? "", d.vehiclePlate ?? "", d.totalRides ?? 0, d.rating ?? "", d.isOnline ? "oui" : "non", d.kycStatus].join(","));
    downloadBlob(h + r.join("\n"), `chauffeurs-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast.success(`${drivers.length} chauffeurs exportés`);
  };

  const filtered = drivers.filter((d) => {
    const matchSearch = d.fullName.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && d.isOnline) ||
      (statusFilter === "pending" && d.kycStatus === "pending");
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des Chauffeurs / Agents</h1>
          <p className="text-slate-500 text-xs mt-1">{total} chauffeur(s) enregistré(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total chauffeurs", value: String(total), icon: Car, color: "#1E6091" },
          { label: "En ligne", value: String(drivers.filter(d => d.isOnline).length), icon: CheckCircle2, color: "#2A9D8F" },
          { label: "KYC en attente", value: String(drivers.filter(d => d.kycStatus === "pending").length), icon: Clock, color: "#F77F00" },
          { label: "KYC rejetés", value: String(drivers.filter(d => d.kycStatus === "rejected").length), icon: AlertTriangle, color: "#D62828" },
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
            { key: "pending", label: "KYC en attente" },
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
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-sm max-h-[85vh] overflow-y-auto">
            <button onClick={() => setSelectedDriver(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-lg text-slate-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                {initialsOf(selectedDriver.fullName)}
              </div>
              <div>
                <h2 className="title-gradient">{selectedDriver.fullName}</h2>
                <p className="text-slate-400 text-xs">{selectedDriver.id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[statusOf(selectedDriver)].bg}`} style={{ color: statusConfig[statusOf(selectedDriver)].color }}>
                    {statusConfig[statusOf(selectedDriver)].label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${docsConfig[selectedDriver.kycStatus]?.bg}`} style={{ color: docsConfig[selectedDriver.kycStatus]?.color }}>
                    Docs: {docsConfig[selectedDriver.kycStatus]?.label ?? selectedDriver.kycStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Phone, label: "Téléphone", value: selectedDriver.phone || "—" },
                { icon: MapPin, label: "Ville", value: selectedDriver.city || "—" },
                { icon: Car, label: "Véhicule", value: `${vehicleLabel[selectedDriver.vehicleType ?? ""] ?? selectedDriver.vehicleType ?? "—"}${selectedDriver.vehiclePlate ? ` · ${selectedDriver.vehiclePlate}` : ""}` },
                { icon: Calendar, label: "Inscrit le", value: fmtDate(selectedDriver.createdAt) },
                { icon: Star, label: "Note", value: selectedDriver.rating != null ? `${selectedDriver.rating} / 5` : "—" },
                { icon: TrendingUp, label: "Courses", value: String(selectedDriver.totalRides ?? 0) },
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
                <p className="text-2xl text-[#2A9D8F]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedDriver.totalRides ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Courses effectuées</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-lg text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedDriver.rating != null ? `${selectedDriver.rating} / 5` : "—"}</p>
                <p className="text-[10px] text-slate-500 mt-1">Note moyenne</p>
              </div>
            </div>

            {/* Documents / KYC */}
            <div className="mb-5">
              <h4 className="text-slate-700 text-sm mb-3">Vérification KYC</h4>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600">Statut des documents</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${docsConfig[selectedDriver.kycStatus]?.bg}`} style={{ color: docsConfig[selectedDriver.kycStatus]?.color }}>
                  {docsConfig[selectedDriver.kycStatus]?.label ?? selectedDriver.kycStatus}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedDriver.kycStatus === "pending" && (
                <button
                  onClick={() => { toast.success(`Documents de ${selectedDriver.fullName} approuvés`); setSelectedDriver(null); }}
                  className="flex-1 bg-[#2A9D8F] text-white py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" /> Approuver
                </button>
              )}
              <button
                onClick={() => { toast.warning(`${selectedDriver.fullName} a été suspendu`); setSelectedDriver(null); }}
                className="flex-1 bg-red-50 text-[#D62828] py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Ban className="w-4 h-4" /> Suspendre
              </button>
              <a href={`tel:${(selectedDriver.phone || "").replace(/\s/g, "")}`} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs flex items-center justify-center">
                Contacter
              </a>
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
                {["Chauffeur", "Véhicule", "Courses", "Note", "Docs", "Statut", ""].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map((d) => {
                const st = statusConfig[statusOf(d)];
                const dc = docsConfig[d.kycStatus];
                return (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedDriver(d)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                            {initialsOf(d.fullName)}
                          </div>
                          {d.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2A9D8F] rounded-full border-2 border-white" />}
                        </div>
                        <div>
                          <p className="text-slate-700 text-sm">{d.fullName}</p>
                          <p className="text-slate-400 text-[10px]">{d.city || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{vehicleLabel[d.vehicleType ?? ""] ?? d.vehicleType ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{d.totalRides ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                        <span className="text-xs text-slate-600">{d.rating ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${dc?.bg}`} style={{ color: dc?.color }}>{dc?.label ?? d.kycStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedDriver(d); }} aria-label="Voir le détail" className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-xs">Chargement des chauffeurs…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm text-slate-500">Aucun chauffeur pour le moment</p>
            <p className="text-xs mt-1">Les inscriptions chauffeurs apparaîtront ici.</p>
          </div>
        )}

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
