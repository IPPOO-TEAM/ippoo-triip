import { useState } from "react";
import {
  Car, Wrench, FileText, Shield, AlertTriangle,
  Check, Clock, ChevronRight, CreditCard,
  Bell, CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "./profile-avatar";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";
import { M3Page, SectionHeader, M3Card, M3Button, StatTile, EmptyState } from "./m3";

const LOA_IMG = "https://images.unsplash.com/photo-1625191824707-31f8bd5862d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdHJ1Y2slMjBmbGVldCUyMGxvZ2lzdGljcyUyMHZlaGljbGVzfGVufDF8fHx8MTc3NTkxNzQyOHww&ixlib=rb-4.1.0&q=80&w=1080";

/* --- Types --- */
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

/* --- Mock Data --- */
/* Aucun contrat LOA de démo : l'utilisateur voit ses propres véhicules une fois
   son dossier LOA validé. Tant qu'aucun n'existe, la page affiche un état vide. */
const vehicles: Vehicle[] = [];

const maintenanceLog: MaintenanceEntry[] = [];

type DetailView = null | number;

export function LOAPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<DetailView>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);

  const vehicle = selectedVehicle !== null ? vehicles.find(v => v.id === selectedVehicle) : null;
  const vehicleMaintenance = vehicle ? maintenanceLog.filter(m => m.vehicleId === vehicle.id) : [];

  const statusLabel = (s: string) =>
    s === "active" ? "Actif" : s === "late" ? "Retard" : "Terminé";
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

  const isDetail = selectedVehicle !== null && !!vehicle;

  // Alertes réelles dérivées de l'état des véhicules de l'utilisateur (jamais codées en dur)
  const vehicleAlerts = vehicles.flatMap<{ text: string; type: "error" | "warn" | "info" }>((v) => {
    const out: { text: string; type: "error" | "warn" | "info" }[] = [];
    if (v.insuranceStatus === "expired") out.push({ text: `Assurance expirée · ${v.model} (${v.plate})`, type: "error" });
    else if (v.insuranceStatus === "expiring") out.push({ text: `Assurance expire bientôt · ${v.model} (${v.plate})`, type: "warn" });
    if (v.status === "late") out.push({ text: `Paiement en retard · ${v.model} (${v.plate})`, type: "error" });
    if (v.nextMaintenance) out.push({ text: `Entretien prévu le ${v.nextMaintenance} · ${v.model}`, type: "info" });
    return out;
  });

  return (
    <M3Page
      title={isDetail ? (vehicle?.model ?? "LOA") : "LOA"}
      subtitle={isDetail ? vehicle?.plate : "Location avec Option d'Achat"}
      icon={Car}
      trailing={!isDetail ? <img src={logoImg} alt="IPPOO" className="h-6 object-contain drop-shadow-sm" /> : undefined}
      hero={!isDetail ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/20">
          <img src={LOA_IMG} alt="" className="h-24 w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
          <div className="absolute inset-0 flex items-center gap-2 px-4">
            <FileText className="h-5 w-5 text-white" strokeWidth={2} />
            <span className="text-[13px] font-semibold text-white">Votre flotte en location-achat</span>
          </div>
        </div>
      ) : undefined}
    >
      {selectedVehicle === null ? (
        /* -- Vehicle List -- */
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Véhicules" value={String(vehicles.length)} icon={Car} />
            <StatTile label="Paiements OK" value={String(vehicles.filter(v => v.status === "active").length)} icon={Check} />
            <StatTile label="En retard" value={String(vehicles.filter(v => v.status === "late").length)} icon={AlertTriangle} />
          </div>

          {/* Vehicles */}
          <SectionHeader title="Véhicules en LOA" icon={Car} />

          {vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Aucun véhicule en LOA"
              description="Déposez une demande pour démarrer votre location-achat."
            />
          ) : (
            vehicles.map((v, i) => (
              <M3Card key={v.id} onClick={() => setSelectedVehicle(v.id)} delay={0.03 * i}>
                <div className="flex items-center gap-3">
                  <ProfileAvatar initials={v.tenantInitials} size={44} gradient="from-[#D62828] to-[#F77F00]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-800">{v.model}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusColor(v.status)}`}>
                        {statusLabel(v.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{v.plate} · {v.tenant}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[9px] text-slate-400">
                      <span>Paiements</span>
                      <span>{v.paidMonths}/{v.totalMonths}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${(v.paidMonths / v.totalMonths) * 100}%`, background: "var(--m3-primary)" }} />
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-slate-600">{v.monthlyPayment.toLocaleString()} F/m</p>
                </div>
              </M3Card>
            ))
          )}

          {/* Alertes — dérivées des vrais contrats (aucune alerte tant qu'aucun véhicule) */}
          {vehicleAlerts.length > 0 && (
            <div>
              <SectionHeader title="Alertes" icon={Bell} />
              <div className="space-y-2">
                {vehicleAlerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-xl p-3 ${a.type === "error" ? "bg-red-50" : a.type === "warn" ? "bg-amber-50" : "bg-blue-50"}`}>
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.type === "error" ? "text-red-500" : a.type === "warn" ? "text-amber-500" : "text-blue-500"}`} />
                    <p className={`text-[11px] ${a.type === "error" ? "text-red-700" : a.type === "warn" ? "text-amber-700" : "text-blue-700"}`}>{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : vehicle ? (
        /* -- Vehicle Detail -- */
        <div className="space-y-4">
          {/* Contrat */}
          <M3Card className="p-5" delay={0.02}>
            <SectionHeader title="Contrat LOA" icon={FileText} />
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
                  <p className="text-[10px] text-slate-400">{item.label}</p>
                  <p className="text-xs text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                <span>Progression</span>
                <span>{Math.round((vehicle.paidMonths / vehicle.totalMonths) * 100)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(vehicle.paidMonths / vehicle.totalMonths) * 100}%`, background: "var(--m3-primary)" }} />
              </div>
            </div>
          </M3Card>

          {/* Assurance */}
          <M3Card delay={0.04}>
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${vehicle.insuranceStatus === "valid" ? "bg-emerald-50" : vehicle.insuranceStatus === "expiring" ? "bg-amber-50" : "bg-red-50"}`}>
                <Shield className={`h-5 w-5 ${insuranceColor(vehicle.insuranceStatus)}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700">Assurance</p>
                <p className={`text-[10px] ${insuranceColor(vehicle.insuranceStatus)}`}>
                  {vehicle.insuranceStatus === "valid" ? "Valide" : vehicle.insuranceStatus === "expiring" ? "Expire bientôt" : "Expirée"}, {vehicle.insuranceExpiry}
                </p>
              </div>
              <span className="text-[10px] text-slate-400">À charge locataire</span>
            </div>
          </M3Card>

          {/* Carnet d'entretien */}
          <div>
            <SectionHeader
              title="Carnet d'entretien"
              icon={Wrench}
              action={
                <button onClick={() => setShowMaintenance(!showMaintenance)} aria-label="Afficher le carnet" className="grid h-8 w-8 place-items-center">
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showMaintenance ? "rotate-90" : ""}`} />
                </button>
              }
            />
            {showMaintenance && (
              vehicleMaintenance.length === 0 ? (
                <EmptyState icon={Wrench} title="Aucun entretien enregistré" description="Les interventions apparaîtront ici." />
              ) : (
                <div className="space-y-2">
                  {vehicleMaintenance.map((m, i) => (
                    <M3Card key={m.id} delay={0.03 * i}>
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 place-items-center rounded-xl ${m.status === "done" ? "bg-emerald-50" : "bg-amber-50"}`}>
                          {m.status === "done" ? <CircleCheck className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-700">{m.type}, {m.description}</p>
                          <p className="text-[10px] text-slate-400">{m.date}</p>
                        </div>
                        <p className="text-xs text-slate-600">{m.cost.toLocaleString()} F</p>
                      </div>
                    </M3Card>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <M3Button onClick={() => toast.success("Paiement enregistré !")} icon={CreditCard}>
              Payer la mensualité · {vehicle.monthlyPayment.toLocaleString()} FCFA
            </M3Button>
            <M3Button onClick={() => toast("Dossier véhicule téléchargé")} variant="outlined" icon={FileText}>
              Voir dossier complet
            </M3Button>
          </div>
        </div>
      ) : null}
    </M3Page>
  );
}
