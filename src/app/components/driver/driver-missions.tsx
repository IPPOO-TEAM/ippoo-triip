import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Filter, Bike, Package, Truck, Users,
  Calendar, Navigation, Route, Map
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* --- Types --- */
type MissionTab = "disponibles" | "actives" | "planifiees";
type MissionType = "course" | "livraison" | "transport" | "groupee" | "covoiturage";

interface Ride {
  id: string;
  serviceType: string;
  status: string;
  origin: { label?: string };
  destination: { label?: string };
  priceXOF: number;
  distanceKm: number;
  durationMin: number;
  scheduledAt: string | null;
  createdAt: string;
}

/* --- Config (constantes uniquement) --- */
const typeInfo: Record<MissionType, { icon: React.ElementType; color: string; label: string }> = {
  course: { icon: Bike, color: "#1E6091", label: "Course" },
  livraison: { icon: Package, color: "#F77F00", label: "Livraison" },
  transport: { icon: Truck, color: "#D62828", label: "Transport" },
  groupee: { icon: Users, color: "#8B5CF6", label: "Groupee" },
  covoiturage: { icon: Route, color: "#06B6D4", label: "Covoiturage" },
};

const RIDE_STATUS_UI: Record<string, { label: string; color: string }> = {
  accepted: { label: "Acceptee", color: "bg-blue-50 text-blue-600" },
  arriving: { label: "En approche", color: "bg-amber-50 text-amber-600" },
  in_progress: { label: "Course en cours", color: "bg-emerald-50 text-emerald-600" },
};

const ACTIVE_STATUSES = ["accepted", "arriving", "in_progress"];

function serviceToType(t: string): MissionType {
  if (t === "delivery") return "livraison";
  if (t === "heavy_transport") return "transport";
  if (t === "carpool") return "covoiturage";
  return "course";
}

function fmtDate(iso: string) {
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function DriverMissionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MissionTab>("disponibles");
  const [typeFilter, setTypeFilter] = useState<MissionType | "all">("all");
  const [expandedActive, setExpandedActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<Ride[]>("/driver/missions");
        if (!cancelled) setRides(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRides([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Partition par statut
  const available = rides.filter((r) => r.status === "requested" && !r.scheduledAt);
  const active = rides.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const scheduled = rides.filter((r) => r.scheduledAt && !["completed", "cancelled"].includes(r.status));

  const filteredAvailable = typeFilter === "all"
    ? available
    : available.filter((m) => serviceToType(m.serviceType) === typeFilter);

  const acceptMission = (id: string) => {
    const mission = rides.find((m) => m.id === id);
    if (mission) {
      toast.success(`Mission ${typeInfo[serviceToType(mission.serviceType)].label} acceptee !`);
      navigate("/driver/tracking");
    }
  };

  const tabs: { id: MissionTab; label: string; count: number }[] = [
    { id: "disponibles", label: "Disponibles", count: available.length },
    { id: "actives", label: "Actives", count: active.length },
    { id: "planifiees", label: "Planifiees", count: scheduled.length },
  ];

  const Spinner = () => (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2A9D8F] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#2A9D8F] pt-12 pb-5 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white text-sm">Mes missions</p>
            <p className="text-white/50 text-[10px]">Gestion de vos courses et livraisons</p>
          </div>
          <img src={logoImg} alt="IPPOO" className="h-6 object-contain" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition ${tab === t.id ? "bg-white text-[#1E6091]" : "bg-white/10 text-white/70"}`}
            >
              {t.label}
              <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] ${tab === t.id ? "bg-[#1E6091] text-white" : "bg-white/15 text-white/60"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      {tab === "disponibles" && (
        <div className="px-5 py-3 flex gap-2 overflow-x-auto">
          {[{ id: "all" as const, label: "Tout", icon: Filter }, ...Object.entries(typeInfo).map(([id, info]) => ({ id: id as MissionType, label: info.label, icon: info.icon }))].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap border transition ${typeFilter === f.id ? "bg-[#2A9D8F] text-white border-[#2A9D8F]" : "bg-white text-slate-600 border-slate-200"}`}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 mt-2">
        {/* --- DISPONIBLES --- */}
        {tab === "disponibles" && (
          loading ? <Spinner /> : (
            <div className="space-y-3">
              {filteredAvailable.length === 0 && (
                <div className="text-center py-16">
                  <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Aucune mission disponible</p>
                  <p className="text-slate-300 text-[10px]">Restez en ligne, les demandes arrivent</p>
                </div>
              )}
              {filteredAvailable.map(m => {
                const type = serviceToType(m.serviceType);
                const info = typeInfo[type];
                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${info.color}15` }}>
                            <info.icon className="w-4 h-4" style={{ color: info.color }} />
                          </div>
                          <div>
                            <p className="text-slate-800 text-xs">{info.label}</p>
                            <p className="text-slate-400 text-[9px]">{m.distanceKm ? `${m.distanceKm} km` : "—"} - {m.durationMin ? `${m.durationMin} min` : "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#2A9D8F] text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.priceXOF} F</p>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-start gap-2 mb-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                          <div className="w-px h-4 bg-slate-200" />
                          <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-slate-600 text-[10px]">{m.origin?.label ?? "—"}</p>
                          <p className="text-slate-600 text-[10px]">{m.destination?.label ?? "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => toast.info("Mission ignorée")} className="py-2.5 rounded-xl border border-slate-200 text-slate-500 text-[11px]">Ignorer</button>
                        <button onClick={() => acceptMission(m.id)} className="py-2.5 rounded-xl bg-[#2A9D8F] text-white text-[11px] shadow-md shadow-emerald-500/15">Accepter</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* --- ACTIVES --- */}
        {tab === "actives" && (
          loading ? <Spinner /> : (
            <div className="space-y-3">
              {active.length === 0 && (
                <div className="text-center py-16">
                  <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Aucune mission active</p>
                </div>
              )}
              {active.map(m => {
                const type = serviceToType(m.serviceType);
                const info = typeInfo[type];
                const expanded = expandedActive === m.id;
                const st = RIDE_STATUS_UI[m.status] ?? { label: m.status, color: "bg-slate-50 text-slate-600" };
                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <button onClick={() => setExpandedActive(expanded ? null : m.id)} className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-slate-800 text-xs">{info.label} - {m.id}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                          <div className="w-px h-4 bg-slate-200" />
                          <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                        </div>
                        <div className="flex-1 space-y-2 text-left">
                          <p className="text-slate-600 text-[10px]">{m.origin?.label ?? "—"}</p>
                          <p className="text-slate-600 text-[10px]">{m.destination?.label ?? "—"}</p>
                        </div>
                        <span className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.priceXOF} F</span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={() => navigate("/driver/tracking")}
                          className="w-full py-3 rounded-xl bg-[#2A9D8F] text-white text-xs shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4" /> Ouvrir navigation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* --- PLANIFIEES --- */}
        {tab === "planifiees" && (
          loading ? <Spinner /> : (
            <div className="space-y-3">
              {scheduled.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Aucune mission planifiee</p>
                </div>
              )}
              {scheduled.map(m => {
                const type = serviceToType(m.serviceType);
                const info = typeInfo[type];
                const when = m.scheduledAt ?? m.createdAt;
                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${info.color}15` }}>
                          <info.icon className="w-4 h-4" style={{ color: info.color }} />
                        </div>
                        <div>
                          <p className="text-slate-800 text-xs">{info.label}</p>
                          <p className="text-slate-400 text-[9px]">{fmtDate(when)} - {fmtTime(when)}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-50 text-amber-600">
                        Planifiee
                      </span>
                    </div>

                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-slate-500 text-[10px]">{m.origin?.label ?? "—"}</p>
                        <p className="text-slate-500 text-[10px]">{m.destination?.label ?? "—"}</p>
                      </div>
                      <span className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.priceXOF} F</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          try { await api.post(`/rides/${m.id}/cancel`); } catch { /* ignore */ }
                          setRides(prev => prev.filter(s => s.id !== m.id));
                          toast.success("Mission annulee");
                        }}
                        className="py-2 rounded-xl border border-slate-200 text-slate-500 text-[10px]"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => navigate("/driver/tracking")}
                        className="py-2 rounded-xl bg-[#1E6091] text-white text-[10px]"
                      >
                        Voir details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
