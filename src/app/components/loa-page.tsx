import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Car, Wrench, FileText, Shield, Calendar, AlertTriangle,
  Check, Clock, ChevronRight, CreditCard, Eye, Phone, MapPin,
  Bell, Settings, TrendingUp, Fuel, CircleCheck, CircleAlert, Plus, Users
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

const LOA_IMG = "https://images.unsplash.com/photo-1625191824707-31f8bd5862d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdHJ1Y2slMjBmbGVldCUyMGxvZ2lzdGljcyUyMHZlaGljbGVzfGVufDF8fHx8MTc3NTkxNzQyOHww&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Types ─── */
interface Vehicle {
  id: number;
  type: string;
  plate: string;
  model: string;
  tenant: string;
  tenantInitials: string;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  buyoutPrice: number;
  paidMonths: number;
  totalMonths: number;
  insuranceStatus: "valid" | "expiring" | "expired";
  insuranceExpiry: string;
  nextMaintenance: string;
  status: "active" | "late" | "completed";
}

interface MaintenanceEntry {
  id: number;
  vehicleId: number;
  date: string;
  type: string;
  description: string;
  cost: number;
  status: "done" | "scheduled";
}

/* ─── Mock Data ─── */
const vehicles: Vehicle[] = [
  {
    id: 1, type: "Moto", plate: "AB-1234-RB", model: "TVS Apache 200",
    tenant: "Hounkpatin Akotchayé", tenantInitials: "HA",
    monthlyPayment: 45000, startDate: "01 Jan 2025", endDate: "01 Jan 2027",
    buyoutPrice: 350000, paidMonths: 15, totalMonths: 24,
    insuranceStatus: "valid", insuranceExpiry: "15 Déc 2026",
    nextMaintenance: "20 Avr 2026", status: "active"
  },
  {
    id: 2, type: "Moto", plate: "CD-5678-RB", model: "Bajaj Pulsar 150",
    tenant: "Gbètoho Bokossa", tenantInitials: "GB",
    monthlyPayment: 35000, startDate: "01 Mar 2025", endDate: "01 Mar 2027",
    buyoutPrice: 280000, paidMonths: 13, totalMonths: 24,
    insuranceStatus: "expiring", insuranceExpiry: "25 Avr 2026",
    nextMaintenance: "05 Mai 2026", status: "active"
  },
  {
    id: 3, type: "Tricycle", plate: "EF-9012-RB", model: "Piaggio Ape",
    tenant: "Sessinou Adéchian", tenantInitials: "SA",
    monthlyPayment: 65000, startDate: "01 Juil 2025", endDate: "01 Juil 2027",
    buyoutPrice: 650000, paidMonths: 9, totalMonths: 24,
    insuranceStatus: "valid", insuranceExpiry: "10 Oct 2026",
    nextMaintenance: "18 Avr 2026", status: "late"
  },
  {
    id: 4, type: "Voiture", plate: "GH-3456-RB", model: "Toyota Hiace",
    tenant: "Togbédji Montcho", tenantInitials: "TM",
    monthlyPayment: 120000, startDate: "01 Sep 2025", endDate: "01 Sep 2028",
    buyoutPrice: 2500000, paidMonths: 7, totalMonths: 36,
    insuranceStatus: "expired", insuranceExpiry: "01 Avr 2026",
    nextMaintenance: "12 Avr 2026", status: "late"
  },
];

const maintenanceLog: MaintenanceEntry[] = [
  { id: 1, vehicleId: 1, date: "15 Mar 2026", type: "Vidange", description: "Vidange huile moteur + filtre", cost: 8000, status: "done" },
  { id: 2, vehicleId: 1, date: "20 Avr 2026", type: "Pneus", description: "Remplacement pneu avant", cost: 15000, status: "scheduled" },
  { id: 3, vehicleId: 3, date: "18 Avr 2026", type: "Freins", description: "Plaquettes de frein + liquide", cost: 22000, status: "scheduled" },
  { id: 4, vehicleId: 2, date: "10 Fév 2026", type: "Chaîne", description: "Remplacement chaîne + pignons", cost: 12000, status: "done" },
  { id: 5, vehicleId: 4, date: "12 Avr 2026", type: "Révision", description: "Révision complète 10 000 km", cost: 45000, status: "scheduled" },
];

type DetailView = null | number;

export function LOAPage() {
  const navigate = useNavigate();
  const [parallaxY, setParallaxY] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<DetailView>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);

  useEffect(() => {
    const el = document.querySelector(".flex-1.min-h-0.overflow-y-auto");
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const vehicle = selectedVehicle !== null ? vehicles.find(v => v.id === selectedVehicle) : null;
  const vehicleMaintenance = vehicle ? maintenanceLog.filter(m => m.vehicleId === vehicle.id) : [];

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-50 text-emerald-600";
    if (s === "late") return "bg-red-50 text-red-500";
    return "bg-slate-100 text-slate-500";
  };

  const insuranceColor = (s: string) => {
    if (s === "valid") return "text-emerald-500";
    if (s === "expiring") return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <img src={LOA_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#D62828]/85 via-[#D62828]/70 to-[#F77F00]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { if (selectedVehicle !== null) { setSelectedVehicle(null); setShowMaintenance(false); } else navigate(-1); }} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1" />
            
          </div>
          <h1 className="text-white mb-1 drop-shadow-md">
            {selectedVehicle !== null ? vehicle?.model : "LOA, Location avec Option d'Achat"}
          </h1>
          <p className="text-white/80 text-xs">{selectedVehicle !== null ? vehicle?.plate : "4 véhicules en programme"}</p>
        </div>
      </div>

      {selectedVehicle === null ? (
        /* ── Vehicle List ── */
        <div className="px-5 mt-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Véhicules", value: "4", icon: Car, color: "text-[#1E6091]", bg: "bg-blue-50" },
              { label: "Paiements OK", value: "3", icon: Check, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "En retard", value: "1", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-slate-800 text-sm">{s.value}</p>
                <p className="text-slate-400 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Vehicles */}
          <h2 className="title-gradient flex items-center gap-2">
            <Car className="w-4 h-4 text-[#D62828]" />
            Véhicules en LOA
          </h2>

          {/* Rotation CTA */}
          <button
            onClick={() => navigate("/app/loa/rotation")}
            className="w-full bg-gradient-to-r from-[#1E6091] to-[#2A9D8F] rounded-2xl p-4 shadow-lg shadow-blue-400/20 text-left active:scale-[0.98] transition flex items-center gap-3"
          >
            <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-xs">LOA Rotation, 1 véhicule / 4 locataires</p>
              <p className="text-white/70 text-[10px]">Planning hebdomadaire, déclaration, passation</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>

          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicle(v.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar initials={v.tenantInitials} size={44} gradient="from-[#D62828] to-[#F77F00]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-800 text-xs">{v.model}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${statusColor(v.status)}`}>
                      {v.status === "active" ? "Actif" : v.status === "late" ? "Retard" : "Terminé"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{v.plate} · {v.tenant}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Paiements</span>
                    <span>{v.paidMonths}/{v.totalMonths}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D62828] to-[#F77F00] rounded-full" style={{ width: `${(v.paidMonths / v.totalMonths) * 100}%` }} />
                  </div>
                </div>
                <p className="text-slate-600 text-xs shrink-0">{v.monthlyPayment.toLocaleString()} F/m</p>
              </div>
            </button>
          ))}

          {/* Alertes */}
          <div>
            <h2 className="title-gradient mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Alertes
            </h2>
            <div className="space-y-2">
              {[
                { text: "Assurance expirée, Toyota Hiace (GH-3456-RB)", type: "error" },
                { text: "Assurance expire bientôt, Bajaj Pulsar (CD-5678-RB)", type: "warn" },
                { text: "Entretien prévu le 12 Avr, Toyota Hiace", type: "info" },
                { text: "Paiement en retard, Piaggio Ape (EF-9012-RB)", type: "error" },
              ].map((a, i) => (
                <div key={i} className={`rounded-xl p-3 flex items-start gap-2 ${a.type === "error" ? "bg-red-50" : a.type === "warn" ? "bg-amber-50" : "bg-blue-50"}`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${a.type === "error" ? "text-red-500" : a.type === "warn" ? "text-amber-500" : "text-blue-500"}`} />
                  <p className={`text-[11px] ${a.type === "error" ? "text-red-700" : a.type === "warn" ? "text-amber-700" : "text-blue-700"}`}>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : vehicle ? (
        /* ── Vehicle Detail ── */
        <div className="px-5 mt-5 space-y-4">
          {/* Contrat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="title-gradient flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#1E6091]" />
              Contrat LOA
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Locataire", value: vehicle.tenant },
                { label: "Véhicule", value: `${vehicle.type}, ${vehicle.model}` },
                { label: "Immatriculation", value: vehicle.plate },
                { label: "Début", value: vehicle.startDate },
                { label: "Fin", value: vehicle.endDate },
                { label: "Mensualité", value: `${vehicle.monthlyPayment.toLocaleString()} FCFA` },
                { label: "Option d'achat", value: `${vehicle.buyoutPrice.toLocaleString()} FCFA` },
                { label: "Mois payés", value: `${vehicle.paidMonths} / ${vehicle.totalMonths}` },
              ].map((item, i) => (
                <div key={i} className={`${i < 2 ? "col-span-2" : ""}`}>
                  <p className="text-slate-400 text-[10px]">{item.label}</p>
                  <p className="text-slate-700 text-xs">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Progression</span>
                <span>{Math.round((vehicle.paidMonths / vehicle.totalMonths) * 100)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D62828] to-[#F77F00] rounded-full transition-all" style={{ width: `${(vehicle.paidMonths / vehicle.totalMonths) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Assurance */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vehicle.insuranceStatus === "valid" ? "bg-emerald-50" : vehicle.insuranceStatus === "expiring" ? "bg-amber-50" : "bg-red-50"}`}>
              <Shield className={`w-5 h-5 ${insuranceColor(vehicle.insuranceStatus)}`} />
            </div>
            <div className="flex-1">
              <p className="text-slate-700 text-xs">Assurance</p>
              <p className={`text-[10px] ${insuranceColor(vehicle.insuranceStatus)}`}>
                {vehicle.insuranceStatus === "valid" ? "Valide" : vehicle.insuranceStatus === "expiring" ? "Expire bientôt" : "Expirée"}, {vehicle.insuranceExpiry}
              </p>
            </div>
            <span className="text-[10px] text-slate-400">À charge locataire</span>
          </div>

          {/* Carnet d'entretien */}
          <div>
            <button onClick={() => setShowMaintenance(!showMaintenance)} className="w-full flex items-center justify-between mb-3">
              <h3 className="title-gradient flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#2A9D8F]" />
                Carnet d'entretien
              </h3>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showMaintenance ? "rotate-90" : ""}`} />
            </button>
            {showMaintenance && (
              <div className="space-y-2">
                {vehicleMaintenance.map(m => (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.status === "done" ? "bg-emerald-50" : "bg-amber-50"}`}>
                      {m.status === "done" ? <CircleCheck className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 text-xs">{m.type}, {m.description}</p>
                      <p className="text-slate-400 text-[10px]">{m.date}</p>
                    </div>
                    <p className="text-slate-600 text-xs">{m.cost.toLocaleString()} F</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={() => toast.success("Paiement enregistré !")} className="w-full py-3.5 bg-gradient-to-r from-[#D62828] to-[#F77F00] text-white rounded-2xl shadow-lg shadow-red-400/25 flex items-center justify-center gap-2 active:scale-[0.98] transition">
              <CreditCard className="w-4 h-4" />
              <span>Payer la mensualité · {vehicle.monthlyPayment.toLocaleString()} FCFA</span>
            </button>
            <button onClick={() => toast("Dossier véhicule téléchargé")} className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition">
              <FileText className="w-4 h-4" />
              <span>Voir dossier complet</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}