import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, Filter, Bike, Package, Truck, Users,
  Clock, MapPin, Calendar, Star, Navigation, Phone, MessageSquare,
  Check, X, Plus, Route, Target, Zap, AlertTriangle, Eye,
  ArrowRight, ArrowUpRight, Layers, CircleDot, Timer, Map
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import { getGPSPosition } from "../utils";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
type MissionTab = "disponibles" | "actives" | "planifiees" | "historique";
type MissionType = "course" | "livraison" | "transport" | "groupee" | "covoiturage";

interface AvailableMission {
  id: number;
  type: MissionType;
  clientName: string;
  clientInitials: string;
  clientRating: number;
  from: string;
  to: string;
  distance: string;
  duration: string;
  earning: number;
  bonus: number;
  vehicle: string;
  scheduledTime?: string;
  urgent: boolean;
  surge: boolean;
  stops?: number;
  weight?: string;
  passengers?: number;
}

interface ActiveMission {
  id: string;
  type: MissionType;
  clientName: string;
  clientInitials: string;
  clientPhone: string;
  from: string;
  to: string;
  status: "en_route_pickup" | "at_pickup" | "in_progress" | "near_dest";
  statusLabel: string;
  earning: number;
  startTime: string;
  otp?: string;
  parcels?: { desc: string; weight: string }[];
  stops?: { address: string; status: "pending" | "done" }[];
}

interface ScheduledMission {
  id: number;
  type: MissionType;
  date: string;
  timeSlot: string;
  from: string;
  to: string;
  clientName: string;
  clientInitials: string;
  earning: number;
  status: "confirmed" | "pending";
}

/* ─── Mock Data ─── */
const availableMissions: AvailableMission[] = [
  { id: 1, type: "course", clientName: "Fifame Dossou", clientInitials: "FD", clientRating: 4.9, from: "Marche Dantokpa", to: "Campus UAC", distance: "5.2 km", duration: "15 min", earning: 1200, bonus: 200, vehicle: "Moto", urgent: false, surge: false },
  { id: 2, type: "livraison", clientName: "Aidatou Tokpanou", clientInitials: "AT", clientRating: 4.7, from: "Boulevard St-Michel", to: "Godomey, rue 312", distance: "6.8 km", duration: "22 min", earning: 1800, bonus: 0, vehicle: "Moto cargo", urgent: true, surge: false, weight: "3.5 kg" },
  { id: 3, type: "course", clientName: "Sessinou Adechian", clientInitials: "SA", clientRating: 4.5, from: "Aeroport Cadjehoun", to: "Hotel du Lac", distance: "8.1 km", duration: "20 min", earning: 3500, bonus: 500, vehicle: "Voiture", urgent: false, surge: true },
  { id: 4, type: "groupee", clientName: "Gbètoho Bokossa", clientInitials: "GB", clientRating: 4.8, from: "Marche Dantokpa", to: "Campus UAC (3 arrêts)", distance: "7.5 km", duration: "35 min", earning: 2400, bonus: 300, vehicle: "Tricycle", urgent: false, surge: false, stops: 3 },
  { id: 5, type: "transport", clientName: "Aidatou Bokossa", clientInitials: "AB", clientRating: 4.6, from: "Cotonou Centre", to: "Abomey-Calavi", distance: "14 km", duration: "40 min", earning: 7500, bonus: 0, vehicle: "Camionnette", urgent: false, surge: false, weight: "120 kg" },
  { id: 6, type: "covoiturage", clientName: "Fifame Dossou", clientInitials: "FD", clientRating: 4.9, from: "Cotonou", to: "Porto-Novo", distance: "35 km", duration: "45 min", earning: 2000, bonus: 0, vehicle: "Voiture", urgent: false, surge: false, passengers: 3 },
];

const activeMissions: ActiveMission[] = [
  {
    id: "IPP-M-20260411-001", type: "course", clientName: "Gbètoho Bokossa", clientInitials: "GB",
    clientPhone: "+229 97 12 34 56", from: "Carrefour Cadjehoun", to: "Hopital CNHU",
    status: "in_progress", statusLabel: "En cours", earning: 950, startTime: "12:05",
  },
];

const scheduledMissions: ScheduledMission[] = [
  { id: 1, type: "course", date: "12 Avr 2026", timeSlot: "08:00 - 09:00", from: "Hotel du Lac", to: "Aeroport Cadjehoun", clientName: "Sessinou Adechian", clientInitials: "SA", earning: 3000, status: "confirmed" },
  { id: 2, type: "livraison", date: "12 Avr 2026", timeSlot: "14:00 - 16:00", from: "Zone Industrielle", to: "3 adresses (multi-stop)", clientName: "Aidatou Tokpanou", clientInitials: "AT", earning: 4500, status: "confirmed" },
  { id: 3, type: "covoiturage", date: "13 Avr 2026", timeSlot: "06:30 - 08:00", from: "Cotonou", to: "Parakou", clientName: "Fifame Dossou", clientInitials: "FD", earning: 8000, status: "pending" },
  { id: 4, type: "transport", date: "14 Avr 2026", timeSlot: "09:00 - 12:00", from: "Port de Cotonou", to: "Entrepôt Calavi", clientName: "Gbètoho Bokossa", clientInitials: "GB", earning: 15000, status: "pending" },
];

const typeInfo: Record<MissionType, { icon: React.ElementType; color: string; label: string }> = {
  course: { icon: Bike, color: "#1E6091", label: "Course" },
  livraison: { icon: Package, color: "#F77F00", label: "Livraison" },
  transport: { icon: Truck, color: "#D62828", label: "Transport" },
  groupee: { icon: Users, color: "#8B5CF6", label: "Groupee" },
  covoiturage: { icon: Route, color: "#06B6D4", label: "Covoiturage" },
};

export function DriverMissionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MissionTab>("disponibles");
  const [typeFilter, setTypeFilter] = useState<MissionType | "all">("all");
  const [available, setAvailable] = useState(availableMissions);
  const [active, setActive] = useState(activeMissions);
  const [scheduled, setScheduled] = useState(scheduledMissions);
  const [expandedActive, setExpandedActive] = useState<string | null>(null);
  const [missionDetail, setMissionDetail] = useState<AvailableMission | null>(null);

  const filteredAvailable = typeFilter === "all" ? available : available.filter(m => m.type === typeFilter);

  const acceptMission = (id: number) => {
    const mission = available.find(m => m.id === id);
    if (mission) {
      setAvailable(prev => prev.filter(m => m.id !== id));
      toast.success(`Mission ${typeInfo[mission.type].label} acceptee !`);
      navigate("/driver/tracking");
    }
  };

  const statusColors: Record<string, string> = {
    en_route_pickup: "bg-blue-50 text-blue-600",
    at_pickup: "bg-amber-50 text-amber-600",
    in_progress: "bg-emerald-50 text-emerald-600",
    near_dest: "bg-orange-50 text-orange-600",
  };
  const statusLabels: Record<string, string> = {
    en_route_pickup: "En route vers client",
    at_pickup: "Au point de prise",
    in_progress: "Course en cours",
    near_dest: "Proche destination",
  };

  const tabs: { id: MissionTab; label: string; count: number }[] = [
    { id: "disponibles", label: "Disponibles", count: available.length },
    { id: "actives", label: "Actives", count: active.length },
    { id: "planifiees", label: "Planifiees", count: scheduled.length },
  ];

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
        {/* ═══ DISPONIBLES ═══ */}
        {tab === "disponibles" && (
          <div className="space-y-3">
            {filteredAvailable.length === 0 && (
              <div className="text-center py-16">
                <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune mission disponible</p>
                <p className="text-slate-300 text-[10px]">Restez en ligne, les demandes arrivent</p>
              </div>
            )}
            {filteredAvailable.map(m => {
              const info = typeInfo[m.type];
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {m.surge && (
                    <div className="bg-[#F77F00] px-3 py-1 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-white" />
                      <span className="text-white text-[9px]">Tarif majore (+{m.bonus} F bonus)</span>
                    </div>
                  )}
                  {m.urgent && !m.surge && (
                    <div className="bg-[#D62828] px-3 py-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-white" />
                      <span className="text-white text-[9px]">Urgent</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${info.color}15` }}>
                          <info.icon className="w-4 h-4" style={{ color: info.color }} />
                        </div>
                        <div>
                          <p className="text-slate-800 text-xs">{info.label}</p>
                          <p className="text-slate-400 text-[9px]">{m.vehicle} - {m.distance} - {m.duration}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#2A9D8F] text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.earning} F</p>
                        {m.bonus > 0 && <p className="text-[#F77F00] text-[9px]">+{m.bonus} F bonus</p>}
                      </div>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-2 mb-3">
                      <ProfileAvatar initials={m.clientInitials} size={28} />
                      <span className="text-slate-600 text-[11px]">{m.clientName}</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                        <span className="text-slate-500 text-[9px]">{m.clientRating}</span>
                      </div>
                      {m.stops && <span className="text-slate-400 text-[9px]">- {m.stops} arrêts</span>}
                      {m.weight && <span className="text-slate-400 text-[9px]">- {m.weight}</span>}
                      {m.passengers && <span className="text-slate-400 text-[9px]">- {m.passengers} passagers</span>}
                    </div>

                    {/* Route */}
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-slate-600 text-[10px]">{m.from}</p>
                        <p className="text-slate-600 text-[10px]">{m.to}</p>
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
        )}

        {/* ═══ ACTIVES ═══ */}
        {tab === "actives" && (
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="text-center py-16">
                <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune mission active</p>
              </div>
            )}
            {active.map(m => {
              const info = typeInfo[m.type];
              const expanded = expandedActive === m.id;
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <button onClick={() => setExpandedActive(expanded ? null : m.id)} className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-800 text-xs">{info.label} - {m.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${statusColors[m.status]}`}>
                        {statusLabels[m.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <ProfileAvatar initials={m.clientInitials} size={28} />
                      <span className="text-slate-600 text-[11px]">{m.clientName}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                      </div>
                      <div className="flex-1 space-y-2 text-left">
                        <p className="text-slate-600 text-[10px]">{m.from}</p>
                        <p className="text-slate-600 text-[10px]">{m.to}</p>
                      </div>
                      <span className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.earning} F</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => window.open(`tel:${m.clientPhone}`)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E6091]/10 text-[#1E6091] text-[11px]"
                        >
                          <Phone className="w-3.5 h-3.5" /> Appeler
                        </button>
                        <button
                          onClick={() => toast.success("Chat ouvert")}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2A9D8F]/10 text-[#2A9D8F] text-[11px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>
                      </div>
                      <button
                        onClick={() => navigate("/driver/tracking")}
                        className="w-full py-3 rounded-xl bg-[#2A9D8F] text-white text-xs shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" /> Ouvrir navigation
                      </button>
                      {m.otp && (
                        <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-amber-700 text-[10px]">Code OTP client :</span>
                          <span className="text-amber-800 text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.otp}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ PLANIFIEES ═══ */}
        {tab === "planifiees" && (
          <div className="space-y-3">
            {scheduled.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune mission planifiee</p>
              </div>
            )}
            {scheduled.map(m => {
              const info = typeInfo[m.type];
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${info.color}15` }}>
                        <info.icon className="w-4 h-4" style={{ color: info.color }} />
                      </div>
                      <div>
                        <p className="text-slate-800 text-xs">{info.label}</p>
                        <p className="text-slate-400 text-[9px]">{m.date} - {m.timeSlot}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${m.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {m.status === "confirmed" ? "Confirme" : "En attente"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <ProfileAvatar initials={m.clientInitials} size={24} />
                    <span className="text-slate-600 text-[10px]">{m.clientName}</span>
                  </div>

                  <div className="flex items-start gap-2 mb-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                      <div className="w-px h-4 bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-[#F77F00]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-slate-500 text-[10px]">{m.from}</p>
                      <p className="text-slate-500 text-[10px]">{m.to}</p>
                    </div>
                    <span className="text-[#2A9D8F] text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{m.earning} F</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setScheduled(prev => prev.filter(s => s.id !== m.id));
                        toast.success("Mission annulee");
                      }}
                      className="py-2 rounded-xl border border-slate-200 text-slate-500 text-[10px]"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => toast.info("Navigation demarree")}
                      className="py-2 rounded-xl bg-[#1E6091] text-white text-[10px]"
                    >
                      Voir details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
