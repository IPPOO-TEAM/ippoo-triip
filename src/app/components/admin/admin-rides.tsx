import { useEffect, useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal, Download,
  Bike, Package, Truck, Users, Globe, Plane, Clock,
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, Loader2, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "../utils";
import { api } from "../../api/client";

/* --- Types --- */
type AdminRide = {
  id: string;
  clientId: string;
  driverId?: string;
  serviceType: string;
  status: string;
  origin: { label?: string };
  destination: { label?: string };
  priceXOF: number;
  distanceKm?: number;
  durationMin?: number;
  createdAt: string;
  completedAt?: string;
};

type RidesResponse = { items: AdminRide[]; total: number; page: number; pageSize: number };

/* --- Config --- */
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  requested: { label: "Demandée", color: "#F77F00", bg: "bg-orange-50", icon: Clock },
  accepted: { label: "Acceptée", color: "#1E6091", bg: "bg-blue-50", icon: Clock },
  arriving: { label: "En approche", color: "#1E6091", bg: "bg-blue-50", icon: Clock },
  in_progress: { label: "En cours", color: "#1E6091", bg: "bg-blue-50", icon: Clock },
  completed: { label: "Terminée", color: "#2A9D8F", bg: "bg-emerald-50", icon: CheckCircle2 },
  cancelled: { label: "Annulée", color: "#D62828", bg: "bg-red-50", icon: XCircle },
};

const serviceMeta: Record<string, { label: string; icon: any }> = {
  taxi_moto: { label: "Taxi-Moto", icon: Bike },
  delivery: { label: "Livraison", icon: Package },
  heavy_transport: { label: "Transport lourd", icon: Truck },
  carpool: { label: "Covoiturage", icon: Globe },
  group_order: { label: "Commande groupée", icon: Users },
  air_freight: { label: "IPPOO AIR", icon: Plane },
};

const PAGE_SIZE = 20;
const nf = new Intl.NumberFormat("fr-FR");

const fmtDateTime = (iso?: string) => {
  if (!iso) return { date: "—", time: "—" };
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch { return { date: "—", time: "—" }; }
};

export function AdminRidesPage() {
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState<AdminRide | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.get<RidesResponse>(`/admin/rides?page=${page}&pageSize=${PAGE_SIZE}`);
        if (cancelled) return;
        setRides(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!cancelled) { setRides([]); setTotal(0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

  const exportCSV = () => {
    const h = "ID,Service,Client,Chauffeur,Départ,Arrivée,Distance(km),Tarif(XOF),Statut,Date\n";
    const r = rides.map(x => [x.id, serviceMeta[x.serviceType]?.label ?? x.serviceType, x.clientId, x.driverId ?? "", x.origin?.label ?? "", x.destination?.label ?? "", x.distanceKm ?? "", x.priceXOF, x.status, x.createdAt].join(","));
    downloadBlob(h + r.join("\n"), `courses-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast.success(`${rides.length} courses exportées`);
  };

  const filtered = rides.filter((r) => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) || (r.clientId ?? "").toLowerCase().includes(search.toLowerCase()) || (r.driverId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchService = serviceFilter === "all" || r.serviceType === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Courses & Missions</h1>
          <p className="text-slate-500 text-xs mt-1">Suivi de toutes les courses et livraisons</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs hover:border-[#1E6091] transition">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "En cours", value: String(rides.filter(r => ["requested","accepted","arriving","in_progress"].includes(r.status)).length), color: "#1E6091", icon: Clock },
          { label: "Terminées", value: String(rides.filter(r => r.status === "completed").length), color: "#2A9D8F", icon: CheckCircle2 },
          { label: "Annulées", value: String(rides.filter(r => r.status === "cancelled").length), color: "#D62828", icon: XCircle },
          { label: "Total (page)", value: String(rides.length), color: "#F77F00", icon: AlertTriangle },
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
          {["all", "in_progress", "completed", "cancelled", "requested"].map((s) => (
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
          {Object.entries(serviceMeta).map(([key, m]) => (
            <option key={key} value={key}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Detail modal */}
      {selectedRide && (() => {
        const dt = fmtDateTime(selectedRide.createdAt);
        const svc = serviceMeta[selectedRide.serviceType];
        const st = statusConfig[selectedRide.status] ?? statusConfig.requested;
        const Icon = svc?.icon ?? Bike;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedRide(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-sm max-h-[85vh] overflow-y-auto">
            <button onClick={() => setSelectedRide(null)} className="absolute top-4 right-4 text-slate-400"><XCircle className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${st.color}15` }}>
                <Icon className="w-6 h-6" style={{ color: st.color }} />
              </div>
              <div>
                <h2 className="title-gradient">{selectedRide.id}</h2>
                <p className="text-slate-400 text-xs">{svc?.label ?? selectedRide.serviceType} · {dt.date} à {dt.time}</p>
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
                  <p className="text-slate-700 text-sm">{selectedRide.origin?.label || "—"}</p>
                  <div className="h-4" />
                  <p className="text-slate-700 text-sm">{selectedRide.destination?.label || "—"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">Client</p>
                <p className="text-slate-700 text-xs truncate">{selectedRide.clientId || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">Chauffeur</p>
                <p className="text-slate-700 text-xs truncate">{selectedRide.driverId || "Non assigné"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Distance", value: selectedRide.distanceKm != null ? `${selectedRide.distanceKm} km` : "—" },
                { label: "Tarif", value: `${nf.format(selectedRide.priceXOF)} FCFA` },
                { label: "Durée", value: selectedRide.durationMin != null ? `${selectedRide.durationMin} min` : "—" },
                { label: "Statut", value: st.label },
                { label: "Date", value: dt.date },
                { label: "Heure", value: dt.time },
              ].map((m, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400">{m.label}</p>
                  <p className="text-xs text-slate-700 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {["requested","accepted","arriving","in_progress"].includes(selectedRide.status) && (
                <button
                  onClick={() => { toast.warning(`Course ${selectedRide.id} annulée`); setSelectedRide(null); }}
                  className="flex-1 bg-red-50 text-[#D62828] py-2.5 rounded-xl text-xs"
                >
                  Annuler la course
                </button>
              )}
              <button
                onClick={() => { toast.success(`Notification envoyée au client`); }}
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs"
              >
                Contacter client
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
              {!loading && filtered.map((r) => {
                const st = statusConfig[r.status] ?? statusConfig.requested;
                const svc = serviceMeta[r.serviceType];
                const SvcIcon = svc?.icon ?? Bike;
                const dt = fmtDateTime(r.createdAt);
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedRide(r)}>
                    <td className="px-4 py-3 text-xs text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SvcIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600">{svc?.label ?? r.serviceType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-[120px]">{r.clientId || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-[120px]">{r.driverId || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span className="truncate max-w-[80px]">{r.origin?.label || "—"}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[80px]">{r.destination?.label || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700" style={{ fontFamily: "'Space Grotesk', monospace" }}>{nf.format(r.priceXOF)} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">{dt.time}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedRide(r); }} aria-label="Voir le détail" className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="w-4 h-4" /></button>
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
            <p className="text-xs">Chargement des courses…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm text-slate-500">Aucune course pour le moment</p>
            <p className="text-xs mt-1">Les courses apparaîtront ici dès la première demande.</p>
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
