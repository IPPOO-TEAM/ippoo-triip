import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Car, Calendar, Users, Camera, FileCheck, AlertTriangle,
  Check, Clock, ChevronRight, Shield, Fuel, Gauge, Eye, Bell,
  Upload, CircleCheck, CircleAlert, RotateCcw, Star, Ban, MapPin,
  CheckCircle2, XCircle, ChevronDown, Image as ImageIcon, Info
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import logoImg from "../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Images ─── */
const ROTATION_IMG = "https://images.unsplash.com/photo-1623930376524-ead3734be423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwcGFya2VkJTIwYWZyaWNhbiUyMHN0cmVldHxlbnwxfHx8fDE3NzU5MjM1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080";

/* ─── Avatars locataires ─── */
const TENANT_AVATARS: Record<string, string> = {
  "AK": "https://images.unsplash.com/photo-1690564971527-b21f5b939dff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMG1hbiUyMG1vdG9yY3ljbGUlMjByaWRlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTkxNTExNXww&ixlib=rb-4.1.0&q=80&w=400",
  "KD": "https://images.unsplash.com/photo-1668752600261-e56e7f3780b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXQlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NzU5MjM1OTl8MA&ixlib=rb-4.1.0&q=80&w=400",
  "FN": "https://images.unsplash.com/photo-1698650427325-d9c575dd6109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHNtaWxpbmd8ZW58MXx8fHwxNzc1OTIzNTk5fDA&ixlib=rb-4.1.0&q=80&w=400",
  "YG": "https://images.unsplash.com/photo-1597384708133-af8b03bb1287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMG1hbiUyMHBvcnRyYWl0JTIwY2FzdWFsJTIweY9uclMgYXZyaWNhufGVufDF8fHx8MTc3NTkxNTExM3ww&ixlib=rb-4.1.0&q=80&w=400",
};

/* ─── Types ─── */
interface Tenant {
  id: string;
  initials: string;
  name: string;
  phone: string;
  score: number; // 0-100
  retards: number;
  incidents: number;
  declarationsIncompletes: number;
  insuranceValid: boolean;
  blocked: boolean;
}

interface RotationWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  tenantId: string;
  status: "current" | "upcoming" | "completed" | "maintenance";
}

type DeclarationStatus = "none" | "pending" | "validated" | "rejected";

interface Declaration {
  tenantId: string;
  weekNumber: number;
  type: "entry" | "exit";
  status: DeclarationStatus;
  acceptedWeek: boolean;
  insuranceProof: boolean;
  photos: { exterior: number; interior: number; dashboard: number };
  km: number;
  fuel: number; // 0-100%
  checklist: { pneus: boolean; feux: boolean; retros: boolean; documents: boolean };
  anomalies: string;
  timestamp?: string;
}

/* ─── Mock Data ─── */
const VEHICLE = {
  model: "TVS Apache 200",
  plate: "AB-1234-RB",
  type: "Moto",
  kmLimit: 500,
  zone: "Cotonou & périphérie",
};

const tenants: Tenant[] = [
  { id: "t1", initials: "AK", name: "Akotchayé Hounkpatin", phone: "+229 97 12 34 56", score: 92, retards: 0, incidents: 0, declarationsIncompletes: 0, insuranceValid: true, blocked: false },
  { id: "t2", initials: "KD", name: "Koudjo Dossou", phone: "+229 96 78 90 12", score: 78, retards: 1, incidents: 0, declarationsIncompletes: 1, insuranceValid: true, blocked: false },
  { id: "t3", initials: "FN", name: "Fifamè Noukpo", phone: "+229 95 45 67 89", score: 85, retards: 0, incidents: 1, declarationsIncompletes: 0, insuranceValid: true, blocked: false },
  { id: "t4", initials: "YG", name: "Yaovi Gnansounou", phone: "+229 91 23 45 67", score: 45, retards: 3, incidents: 2, declarationsIncompletes: 2, insuranceValid: false, blocked: true },
];

const rotationCycle: RotationWeek[] = [
  { weekNumber: 14, startDate: "31 Mar", endDate: "06 Avr", tenantId: "t1", status: "completed" },
  { weekNumber: 15, startDate: "07 Avr", endDate: "13 Avr", tenantId: "t2", status: "current" },
  { weekNumber: 16, startDate: "14 Avr", endDate: "20 Avr", tenantId: "t3", status: "upcoming" },
  { weekNumber: 17, startDate: "21 Avr", endDate: "27 Avr", tenantId: "t4", status: "upcoming" },
  { weekNumber: 18, startDate: "28 Avr", endDate: "04 Mai", tenantId: "t1", status: "upcoming" },
  { weekNumber: 19, startDate: "05 Mai", endDate: "11 Mai", tenantId: "t2", status: "upcoming" },
  { weekNumber: 20, startDate: "12 Mai", endDate: "18 Mai", tenantId: "t3", status: "upcoming" },
  { weekNumber: 21, startDate: "19 Mai", endDate: "25 Mai", tenantId: "t4", status: "upcoming" },
];

type TabType = "planning" | "declaration" | "restitution" | "scores";

/* ─── Avatar Helper ─── */
function TenantAvatar({ initials, size = 40 }: { initials: string; size?: number }) {
  const src = TENANT_AVATARS[initials];
  return (
    <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={initials} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#F77F00] to-amber-400 flex items-center justify-center">
          <span className="text-white text-xs">{initials}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Score Badge ─── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const bg = score >= 80 ? "bg-emerald-50" : score >= 60 ? "bg-amber-50" : "bg-red-50";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${bg} ${color}`}>
      <Star className="w-3 h-3" /> {score}/100
    </span>
  );
}

/* ─── Checklist Item ─── */
function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-[#2A9D8F]" : "bg-slate-100"}`}>
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-xs ${checked ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
    </button>
  );
}

/* ────────────────────────────────────── MAIN ─────────────────────────────────── */
export function LOARotationPage() {
  const navigate = useNavigate();
  const [parallaxY, setParallaxY] = useState(0);
  const [tab, setTab] = useState<TabType>("planning");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Declaration state
  const [declAccepted, setDeclAccepted] = useState(false);
  const [declInsurance, setDeclInsurance] = useState(false);
  const [declPhotos, setDeclPhotos] = useState({ exterior: 0, interior: 0, dashboard: 0 });
  const [declKm, setDeclKm] = useState("23456");
  const [declFuel, setDeclFuel] = useState(75);
  const [declChecklist, setDeclChecklist] = useState({ pneus: false, feux: false, retros: false, documents: false });
  const [declAnomalies, setDeclAnomalies] = useState("");
  const [declStatus, setDeclStatus] = useState<DeclarationStatus>("none");

  // Restitution state
  const [restPhotos, setRestPhotos] = useState({ exterior: 0, interior: 0, dashboard: 0 });
  const [restKm, setRestKm] = useState("23890");
  const [restFuel, setRestFuel] = useState(60);
  const [restIncidents, setRestIncidents] = useState("");
  const [restSubmitted, setRestSubmitted] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Rappel : Votre semaine commence le 07 Avr", type: "info", read: false },
    { id: 2, text: "Véhicule prêt, consignes de prise en charge envoyées", type: "success", read: false },
    { id: 3, text: "Yaovi Gnansounou : assurance non fournie, rotation bloquée", type: "error", read: true },
  ]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setParallaxY(el.scrollTop * 0.4);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const currentWeek = rotationCycle.find(w => w.status === "current")!;
  const currentTenant = tenants.find(t => t.id === currentWeek.tenantId)!;

  const tabs: { key: TabType; label: string; icon: typeof Calendar }[] = [
    { key: "planning", label: "Planning", icon: Calendar },
    { key: "declaration", label: "Déclaration", icon: FileCheck },
    { key: "restitution", label: "Restitution", icon: RotateCcw },
    { key: "scores", label: "Scores", icon: Star },
  ];

  const allChecklistDone = Object.values(declChecklist).every(Boolean);
  const totalDeclPhotos = declPhotos.exterior + declPhotos.interior + declPhotos.dashboard;
  const canSubmitDeclaration = declAccepted && declInsurance && totalDeclPhotos >= 6 && allChecklistDone;

  const totalRestPhotos = restPhotos.exterior + restPhotos.interior + restPhotos.dashboard;

  function simulatePhotoCapture(setter: Function, key: string, current: number) {
    toast.success("Photo capturée !");
    setter((prev: any) => ({ ...prev, [key]: Math.min(current + 1, 4) }));
  }

  function submitDeclaration() {
    setDeclStatus("pending");
    toast.success("Déclaration soumise ! En attente de validation agence.");
    setTimeout(() => {
      setDeclStatus("validated");
      toast.success("Déclaration validée, véhicule prêt pour prise en charge !");
    }, 3000);
  }

  function submitRestitution() {
    setRestSubmitted(true);
    toast.success("Restitution enregistrée ! Rapport de passation généré.");
  }

  return (
    <div ref={scrollRef} className="min-h-screen bg-slate-50 pb-6 overflow-y-auto" style={{ height: "100vh" }}>
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <img src={ROTATION_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E6091]/85 via-[#1E6091]/70 to-[#2A9D8F]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#E9C46A]/15 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate("/app/loa")} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1" />
            <img src={logoImg} alt="IPPOO" className="h-7 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-white mb-1 drop-shadow-md">LOA Rotation</h1>
          <p className="text-white/80 text-xs">{VEHICLE.model} · {VEHICLE.plate}, 4 locataires</p>

          {/* Current Week Banner */}
          <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15 flex items-center gap-3">
            <TenantAvatar initials={currentTenant.initials} size={38} />
            <div className="flex-1">
              <p className="text-white text-xs">Semaine {currentWeek.weekNumber} — en cours</p>
              <p className="text-white/70 text-[10px]">{currentTenant.name} · {currentWeek.startDate} → {currentWeek.endDate}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-400/30 rounded-xl flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] transition-all ${tab === t.key ? "bg-[#1E6091] text-white shadow-md" : "text-slate-400"}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications ── */}
      {notifications.filter(n => !n.read).length > 0 && tab === "planning" && (
        <div className="px-5 mt-4 space-y-2">
          {notifications.filter(n => !n.read).map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3 flex items-start gap-2 ${n.type === "error" ? "bg-red-50" : n.type === "success" ? "bg-emerald-50" : "bg-blue-50"}`}
            >
              <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${n.type === "error" ? "text-red-500" : n.type === "success" ? "text-emerald-500" : "text-blue-500"}`} />
              <p className={`text-[11px] flex-1 ${n.type === "error" ? "text-red-700" : n.type === "success" ? "text-emerald-700" : "text-blue-700"}`}>{n.text}</p>
              <button onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} className="text-slate-300">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Tab Content ── */}
      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          {tab === "planning" && (
            <motion.div key="planning" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Vehicle Info */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5 text-[#1E6091]" />
                  </div>
                  <div>
                    <p className="text-slate-800 text-xs">{VEHICLE.model}</p>
                    <p className="text-slate-400 text-[10px]">{VEHICLE.plate} · {VEHICLE.type}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-slate-400">Limite hebdo</p>
                    <p className="text-xs text-[#1E6091]">{VEHICLE.kmLimit} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>Zone autorisée : {VEHICLE.zone}</span>
                </div>
              </div>

              {/* Locataires */}
              <div>
                <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#2A9D8F]" />
                  Locataires du cycle
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {tenants.map((t, i) => (
                    <div key={t.id} className={`bg-white rounded-2xl p-3 shadow-sm ${t.blocked ? "border border-red-200" : ""}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TenantAvatar initials={t.initials} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-[11px] truncate">{t.name}</p>
                          <p className="text-slate-400 text-[9px]">Slot {String.fromCharCode(65 + i)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <ScoreBadge score={t.score} />
                        {t.blocked && (
                          <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                            <Ban className="w-3 h-3" /> Bloqué
                          </span>
                        )}
                        {!t.blocked && t.insuranceValid && (
                          <span className="text-[9px] text-emerald-500 flex items-center gap-0.5">
                            <Shield className="w-3 h-3" /> Assuré
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation Calendar */}
              <div>
                <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#F77F00]" />
                  Cycle de rotation (8 semaines)
                </h3>
                <div className="space-y-2">
                  {rotationCycle.map(w => {
                    const t = tenants.find(x => x.id === w.tenantId)!;
                    const isCurrent = w.status === "current";
                    const isCompleted = w.status === "completed";
                    const isBlocked = t.blocked && w.status === "upcoming";
                    return (
                      <div
                        key={w.weekNumber}
                        className={`rounded-2xl p-3 flex items-center gap-3 transition ${
                          isCurrent ? "bg-[#1E6091] shadow-lg shadow-blue-400/20" :
                          isCompleted ? "bg-slate-50 border border-slate-100" :
                          isBlocked ? "bg-red-50 border border-red-100" :
                          "bg-white shadow-sm"
                        }`}
                      >
                        <div className={`w-10 text-center ${isCurrent ? "text-white" : "text-slate-400"}`}>
                          <p className="text-[9px]">S{w.weekNumber}</p>
                        </div>
                        <TenantAvatar initials={t.initials} size={32} />
                        <div className="flex-1">
                          <p className={`text-xs ${isCurrent ? "text-white" : isCompleted ? "text-slate-400" : "text-slate-700"}`}>{t.name}</p>
                          <p className={`text-[10px] ${isCurrent ? "text-white/70" : "text-slate-400"}`}>{w.startDate} — {w.endDate}</p>
                        </div>
                        {isCurrent && <span className="text-[9px] bg-white/20 px-2 py-1 rounded-full text-white">En cours</span>}
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isBlocked && <Ban className="w-4 h-4 text-red-400" />}
                        {!isCurrent && !isCompleted && !isBlocked && w.status === "upcoming" && <Clock className="w-4 h-4 text-slate-300" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Status */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#E9C46A]" />
                  Statut du véhicule
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "État", value: "Prêt", icon: CircleCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Kilométrage", value: "23 456 km", icon: Gauge, color: "text-[#1E6091]", bg: "bg-blue-50" },
                    { label: "Carburant", value: "75%", icon: Fuel, color: "text-[#F77F00]", bg: "bg-orange-50" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-1.5`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <p className="text-slate-700 text-[11px]">{s.value}</p>
                      <p className="text-slate-400 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "declaration" && (
            <motion.div key="declaration" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Status Banner */}
              {declStatus !== "none" && (
                <div className={`rounded-2xl p-4 flex items-center gap-3 ${
                  declStatus === "pending" ? "bg-amber-50 border border-amber-200" :
                  declStatus === "validated" ? "bg-emerald-50 border border-emerald-200" :
                  "bg-red-50 border border-red-200"
                }`}>
                  {declStatus === "pending" && <Clock className="w-5 h-5 text-amber-500" />}
                  {declStatus === "validated" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {declStatus === "rejected" && <XCircle className="w-5 h-5 text-red-500" />}
                  <div>
                    <p className={`text-xs ${declStatus === "pending" ? "text-amber-700" : declStatus === "validated" ? "text-emerald-700" : "text-red-700"}`}>
                      {declStatus === "pending" ? "Déclaration en attente de validation" :
                       declStatus === "validated" ? "Déclaration validée — Prise en charge autorisée !" :
                       "Déclaration rejetée — corrigez et re-soumettez"}
                    </p>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#1E6091] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#1E6091] text-xs">Déclaration préalable obligatoire</p>
                  <p className="text-blue-600/70 text-[10px] mt-1">Avant de prendre le véhicule, vous devez soumettre cette déclaration. Sans validation, la prise en charge est bloquée.</p>
                </div>
              </div>

              {/* Step 1: Accept week */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1E6091] rounded-lg flex items-center justify-center text-white text-[10px]">1</span>
                  Confirmation de semaine
                </h3>
                <CheckItem
                  label={`J'accepte ma semaine S${currentWeek.weekNumber} (${currentWeek.startDate} → ${currentWeek.endDate})`}
                  checked={declAccepted}
                  onToggle={() => setDeclAccepted(!declAccepted)}
                />
              </div>

              {/* Step 2: Insurance */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1E6091] rounded-lg flex items-center justify-center text-white text-[10px]">2</span>
                  Preuve d'assurance
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className={`w-5 h-5 ${declInsurance ? "text-emerald-500" : "text-slate-300"}`} />
                  <p className="text-xs text-slate-600 flex-1">Assurance valide pour la période</p>
                  {declInsurance && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <button
                  onClick={() => { setDeclInsurance(true); toast.success("Document d'assurance téléchargé"); }}
                  className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs transition ${
                    declInsurance ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-400"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {declInsurance ? "Attestation téléchargée ✓" : "Télécharger attestation d'assurance"}
                </button>
              </div>

              {/* Step 3: État des lieux */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1E6091] rounded-lg flex items-center justify-center text-white text-[10px]">3</span>
                  État des lieux d'entrée
                </h3>

                {/* Photos */}
                <p className="text-slate-500 text-[10px] mb-2">Photos obligatoires (min. 6)</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { key: "exterior", label: "Extérieur (4)", count: declPhotos.exterior, max: 4 },
                    { key: "interior", label: "Intérieur", count: declPhotos.interior, max: 1 },
                    { key: "dashboard", label: "Tableau bord", count: declPhotos.dashboard, max: 1 },
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => simulatePhotoCapture(setDeclPhotos, p.key, p.count)}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
                        p.count >= p.max ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                      }`}
                    >
                      <Camera className={`w-5 h-5 ${p.count >= p.max ? "text-emerald-500" : "text-slate-300"}`} />
                      <span className="text-[9px] text-slate-500">{p.label}</span>
                      <span className={`text-[9px] ${p.count >= p.max ? "text-emerald-500" : "text-slate-400"}`}>{p.count}/{p.max}</span>
                    </button>
                  ))}
                </div>

                {/* Km + Fuel */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Kilométrage</label>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                      <Gauge className="w-4 h-4 text-slate-400" />
                      <input type="text" value={declKm} onChange={e => setDeclKm(e.target.value)} className="bg-transparent text-xs text-slate-700 flex-1 outline-none" />
                      <span className="text-[10px] text-slate-400">km</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Carburant</label>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                      <Fuel className="w-4 h-4 text-slate-400" />
                      <input type="range" min={0} max={100} value={declFuel} onChange={e => setDeclFuel(+e.target.value)} className="flex-1 accent-[#1E6091]" />
                      <span className="text-[10px] text-slate-700">{declFuel}%</span>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <p className="text-slate-500 text-[10px] mb-1">Checklist véhicule</p>
                <CheckItem label="Pneus en bon état" checked={declChecklist.pneus} onToggle={() => setDeclChecklist(p => ({ ...p, pneus: !p.pneus }))} />
                <CheckItem label="Feux fonctionnels" checked={declChecklist.feux} onToggle={() => setDeclChecklist(p => ({ ...p, feux: !p.feux }))} />
                <CheckItem label="Rétroviseurs intacts" checked={declChecklist.retros} onToggle={() => setDeclChecklist(p => ({ ...p, retros: !p.retros }))} />
                <CheckItem label="Documents du véhicule présents" checked={declChecklist.documents} onToggle={() => setDeclChecklist(p => ({ ...p, documents: !p.documents }))} />

                {/* Anomalies */}
                <div className="mt-3">
                  <label className="text-[10px] text-slate-400 mb-1 block">Anomalies existantes</label>
                  <textarea
                    value={declAnomalies}
                    onChange={e => setDeclAnomalies(e.target.value)}
                    placeholder="Décrivez les anomalies constatées..."
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none resize-none h-16"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={submitDeclaration}
                disabled={!canSubmitDeclaration || declStatus === "validated"}
                className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.98] ${
                  canSubmitDeclaration && declStatus !== "validated"
                    ? "bg-gradient-to-r from-[#1E6091] to-[#2A9D8F] text-white shadow-lg shadow-blue-400/25"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <FileCheck className="w-4 h-4" />
                {declStatus === "validated" ? "Déclaration validée ✓" :
                 declStatus === "pending" ? "En attente de validation..." :
                 "Soumettre la déclaration préalable"}
              </button>
            </motion.div>
          )}

          {tab === "restitution" && (
            <motion.div key="restitution" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {restSubmitted ? (
                <>
                  {/* Passation Report */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="text-emerald-700 text-xs">Restitution enregistrée</p>
                      <p className="text-emerald-600/70 text-[10px]">Rapport de passation disponible</p>
                    </div>
                  </div>

                  {/* Comparatif */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-4">
                      <Eye className="w-4 h-4 text-[#1E6091]" />
                      Rapport de passation — Comparatif
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Kilométrage", entry: "23 456 km", exit: restKm + " km", diff: `+${parseInt(restKm) - 23456} km` },
                        { label: "Carburant", entry: "75%", exit: restFuel + "%", diff: `${restFuel - 75 > 0 ? "+" : ""}${restFuel - 75}%` },
                        { label: "Photos entrée", entry: `${totalDeclPhotos}`, exit: `${totalRestPhotos}`, diff: "—" },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                          <p className="text-slate-400 text-[10px] w-20">{r.label}</p>
                          <p className="text-slate-600 text-[11px] flex-1 text-center">{r.entry}</p>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <p className="text-slate-600 text-[11px] flex-1 text-center">{r.exit}</p>
                          <p className="text-[10px] text-[#1E6091] w-14 text-right">{r.diff}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                      <p className="text-emerald-700 text-[11px] flex items-center gap-2">
                        <CircleCheck className="w-4 h-4" />
                        Véhicule prêt pour rotation suivante — Fifamè Noukpo (S16)
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-700 text-xs">Restitution obligatoire</p>
                      <p className="text-amber-600/70 text-[10px] mt-1">Fin de semaine S{currentWeek.weekNumber} — Soumettez votre déclaration de restitution avant la passation au locataire suivant.</p>
                    </div>
                  </div>

                  {/* Exit photos */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-slate-800 text-xs mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#D62828]" />
                      Photos de sortie
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { key: "exterior", label: "Extérieur (4)", count: restPhotos.exterior, max: 4 },
                        { key: "interior", label: "Intérieur", count: restPhotos.interior, max: 1 },
                        { key: "dashboard", label: "Tableau bord", count: restPhotos.dashboard, max: 1 },
                      ].map(p => (
                        <button
                          key={p.key}
                          onClick={() => simulatePhotoCapture(setRestPhotos, p.key, p.count)}
                          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
                            p.count >= p.max ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                          }`}
                        >
                          <Camera className={`w-5 h-5 ${p.count >= p.max ? "text-emerald-500" : "text-slate-300"}`} />
                          <span className="text-[9px] text-slate-500">{p.label}</span>
                          <span className={`text-[9px] ${p.count >= p.max ? "text-emerald-500" : "text-slate-400"}`}>{p.count}/{p.max}</span>
                        </button>
                      ))}
                    </div>

                    {/* Km + Fuel */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Kilométrage sortie</label>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                          <Gauge className="w-4 h-4 text-slate-400" />
                          <input type="text" value={restKm} onChange={e => setRestKm(e.target.value)} className="bg-transparent text-xs text-slate-700 flex-1 outline-none" />
                          <span className="text-[10px] text-slate-400">km</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Carburant</label>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                          <Fuel className="w-4 h-4 text-slate-400" />
                          <input type="range" min={0} max={100} value={restFuel} onChange={e => setRestFuel(+e.target.value)} className="flex-1 accent-[#D62828]" />
                          <span className="text-[10px] text-slate-700">{restFuel}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Incidents */}
                    <label className="text-[10px] text-slate-400 mb-1 block">Incidents / Pannes / Amendes</label>
                    <textarea
                      value={restIncidents}
                      onChange={e => setRestIncidents(e.target.value)}
                      placeholder="Décrivez tout incident survenu pendant votre semaine..."
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none resize-none h-20"
                    />
                  </div>

                  <button
                    onClick={submitRestitution}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D62828] to-[#F77F00] text-white rounded-2xl shadow-lg shadow-red-400/25 flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Soumettre la restitution
                  </button>
                </>
              )}
            </motion.div>
          )}

          {tab === "scores" && (
            <motion.div key="scores" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-[#E9C46A]" />
                  Score de fiabilité locataire
                </h3>
                <p className="text-slate-400 text-[10px] mb-4">Impacte l'accès à la rotation : retards, incidents, déclarations</p>

                <div className="space-y-3">
                  {tenants.map(t => {
                    const barColor = t.score >= 80 ? "from-emerald-400 to-emerald-500" : t.score >= 60 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
                    return (
                      <div key={t.id} className={`rounded-2xl p-4 border ${t.blocked ? "border-red-200 bg-red-50/50" : "border-slate-100"}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <TenantAvatar initials={t.initials} size={38} />
                          <div className="flex-1">
                            <p className="text-slate-700 text-xs">{t.name}</p>
                            <p className="text-slate-400 text-[10px]">{t.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg ${t.score >= 80 ? "text-emerald-500" : t.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{t.score}</p>
                            <p className="text-[9px] text-slate-400">/100</p>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`} style={{ width: `${t.score}%` }} />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className={`text-xs ${t.retards > 0 ? "text-red-500" : "text-emerald-500"}`}>{t.retards}</p>
                            <p className="text-[9px] text-slate-400">Retards</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${t.incidents > 0 ? "text-amber-500" : "text-emerald-500"}`}>{t.incidents}</p>
                            <p className="text-[9px] text-slate-400">Incidents</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${t.declarationsIncompletes > 0 ? "text-amber-500" : "text-emerald-500"}`}>{t.declarationsIncompletes}</p>
                            <p className="text-[9px] text-slate-400">Décl. incompl.</p>
                          </div>
                        </div>

                        {t.blocked && (
                          <div className="mt-3 p-2 bg-red-100 rounded-xl flex items-center gap-2">
                            <Ban className="w-4 h-4 text-red-500" />
                            <p className="text-red-600 text-[10px]">Rotation bloquée — assurance non fournie + score &lt; 50</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Règles de pénalités */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-slate-800 text-xs flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#D62828]" />
                  Règles de pénalité
                </h3>
                <div className="space-y-2">
                  {[
                    { rule: "Retard de restitution", penalty: "-10 pts + 2 000 FCFA/h", color: "text-red-500" },
                    { rule: "Incident non déclaré", penalty: "-15 pts + franchise majorée", color: "text-red-500" },
                    { rule: "Déclaration incomplète", penalty: "-5 pts", color: "text-amber-500" },
                    { rule: "Assurance non fournie", penalty: "Rotation bloquée", color: "text-red-500" },
                    { rule: "Score < 50", penalty: "Blocage rotation + revue agence", color: "text-red-500" },
                    { rule: "Dépassement km hebdo", penalty: "100 FCFA/km excédentaire", color: "text-amber-500" },
                    { rule: "Hors zone autorisée", penalty: "-10 pts + avertissement", color: "text-amber-500" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
                      <CircleAlert className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${r.color}`} />
                      <div className="flex-1">
                        <p className="text-slate-700 text-[11px]">{r.rule}</p>
                        <p className={`text-[10px] ${r.color}`}>{r.penalty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}