import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, User, MapPin, FileText, LogOut,
  Camera, Star, Settings, Key, Fingerprint, Car,
  Shield, Phone, Mail, Lock, Upload, TrendingUp, Gift, Copy
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import { api } from "../../api/client";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* --- Types --- */
type PanelId = null | "personal" | "vehicle" | "documents" | "pin" | "biometric" | "settings" | "logout" | "stats" | "referral";

interface DocItem {
  id: string;
  name: string;
  status: "verified" | "pending" | "expired";
  date: string;
  expiry?: string;
}

interface DriverMe {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  avatarUrl?: string;
  referralCode?: string;
  rating: number;
  totalRides: number;
  vehicleType?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  createdAt?: string;
}

interface Earnings {
  netMonth: number;
  acceptanceRate: number;
  rating: number;
  totalRides: number;
}

/* --- Config --- */
const VEHICLE_LABEL: Record<string, string> = {
  moto: "Moto", tricycle: "Tricycle", car: "Voiture", van: "Mini-bus", truck: "Camion",
};
const COMMISSION_RATE = 15; // constante métier IPPOO

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}
function monthYear(iso?: string) {
  if (!iso) return "—";
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* --- Slide Panel --- */
function SlidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "visible" : "invisible"}`}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-sm transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <p className="text-slate-800 flex-1">{title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* --- Toggle --- */
function Toggle({ on, onToggle, label, desc }: { on: boolean; onToggle: () => void; label: string; desc: string }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-4 border-b border-slate-50">
      <div className="text-left">
        <p className="text-sm text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <div className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${on ? "bg-[#2A9D8F]" : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

export function DriverProfilePage() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelId>(null);
  const [me, setMe] = useState<DriverMe | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [notifSound, setNotifSound] = useState(true);
  const [notifMissions, setNotifMissions] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, e] = await Promise.all([
        api.get<DriverMe>("/driver/me").catch(() => null),
        api.get<Earnings>("/driver/earnings").catch(() => null),
      ]);
      if (cancelled) return;
      if (p) {
        setMe(p);
        setEditName(p.fullName ?? "");
        setEditPhone(p.phone ?? "");
        setEditEmail(p.email ?? "");
        setEditAddress(p.city ?? "");
      }
      if (e) setEarnings(e);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const name = me?.fullName ?? "";
  const initials = initialsOf(name);
  const vehicleTypeLabel = me?.vehicleType ? (VEHICLE_LABEL[me.vehicleType] ?? me.vehicleType) : "—";

  // Aucun endpoint documents : liste vide (jamais de faux justificatifs).
  const documents: DocItem[] = [];

  const menuSections = [
    {
      title: "Compte",
      items: [
        { icon: User, label: "Informations personnelles", panel: "personal" as PanelId, badge: null as number | null },
        { icon: Car, label: "Mon vehicule", panel: "vehicle" as PanelId, badge: null },
        { icon: FileText, label: "Documents & justificatifs", panel: "documents" as PanelId, badge: documents.filter(d => d.status !== "verified").length || null },
        { icon: TrendingUp, label: "Statistiques & performances", panel: "stats" as PanelId, badge: null },
        { icon: Gift, label: "Parrainage chauffeurs", panel: "referral" as PanelId, badge: null },
      ],
    },
    {
      title: "Securite",
      items: [
        { icon: Key, label: "Code PIN", panel: "pin" as PanelId, badge: null },
        { icon: Fingerprint, label: "Biometrie / WebAuthn", panel: "biometric" as PanelId, badge: null },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Settings, label: "Parametres", panel: "settings" as PanelId, badge: null },
      ],
    },
    {
      title: "",
      items: [
        { icon: LogOut, label: "Deconnexion", panel: "logout" as PanelId, badge: null },
      ],
    },
  ];

  const statusColor = (s: string) => s === "verified" ? "bg-emerald-50 text-emerald-600" : s === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600";
  const statusLabel = (s: string) => s === "verified" ? "Verifie" : s === "pending" ? "En attente" : "Expire";

  const statCards = [
    { label: "Courses totales", value: me ? me.totalRides.toLocaleString() : "—", color: "#1E6091" },
    { label: "Gains du mois", value: earnings ? `${(earnings.netMonth / 1000).toFixed(0)}K F` : "—", color: "#2A9D8F" },
    { label: "Note moyenne", value: me ? me.rating.toFixed(2) : "—", color: "#E9C46A" },
    { label: "Taux acceptation", value: earnings ? `${Math.round(earnings.acceptanceRate * 100)}%` : "—", color: "#2A9D8F" },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* Header */}
      <div className="bg-[#2A9D8F] pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-8 bottom-0 w-32 h-32 bg-[#E9C46A]/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <p className="text-white text-sm flex-1">Mon profil chauffeur</p>
          <img src={logoImg} alt="IPPOO" className="h-6 object-contain" />
        </div>

        {/* Avatar + info */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative">
            <ProfileAvatar initials={initials} photoUrl={me?.avatarUrl} size={72} />
            <button
              onClick={() => toast.info("Sélectionnez une nouvelle photo de profil")}
              aria-label="Changer la photo de profil"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#F77F00] rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-white text-base">{name || (loading ? "Chargement..." : "Chauffeur")}</p>
            <p className="text-white/60 text-[10px]">Chauffeur depuis {monthYear(me?.createdAt)}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                <span className="text-white/80 text-[10px]">{me ? `${me.rating.toFixed(2)} (${me.totalRides} courses)` : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle badge */}
        <div className="relative z-10 mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-3">
          <Car className="w-5 h-5 text-[#E9C46A]" />
          <div className="flex-1">
            <p className="text-white text-[11px]">{vehicleTypeLabel}</p>
            <p className="text-white/50 text-[9px]">{me?.vehiclePlate ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-5 -mt-3 relative z-10">
        {menuSections.map((section, si) => (
          <div key={si} className="mb-4">
            {section.title && <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 px-1">{section.title}</p>}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {section.items.map((item, ii) => (
                <button
                  key={ii}
                  onClick={() => {
                    if (item.panel === "logout") setShowConfirmLogout(true);
                    else setPanel(item.panel);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition text-left"
                >
                  <item.icon className={`w-5 h-5 ${item.panel === "logout" ? "text-red-400" : "text-slate-400"}`} />
                  <span className={`flex-1 text-xs ${item.panel === "logout" ? "text-red-500" : "text-slate-700"}`}>{item.label}</span>
                  {item.badge && (
                    <span className="min-w-[20px] h-[20px] bg-[#F77F00] rounded-full text-[9px] text-black flex items-center justify-center">{item.badge}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- PERSONAL INFO PANEL --- */}
      <SlidePanel open={panel === "personal"} onClose={() => setPanel(null)} title="Informations personnelles">
        <div className="space-y-4">
          {[
            { label: "Nom complet", value: editName, onChange: setEditName, icon: User },
            { label: "Telephone", value: editPhone, onChange: setEditPhone, icon: Phone },
            { label: "Email", value: editEmail, onChange: setEditEmail, icon: Mail },
            { label: "Ville", value: editAddress, onChange: setEditAddress, icon: MapPin },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={f.value} onChange={e => f.onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700" />
              </div>
            </div>
          ))}
          <button
            onClick={async () => {
              try {
                await api.patch("/driver/me", { fullName: editName, email: editEmail, city: editAddress });
                toast.success("Informations mises a jour");
              } catch { toast.error("Echec de la mise a jour"); }
              setPanel(null);
            }}
            className="w-full py-3.5 rounded-xl bg-[#2A9D8F] text-white text-xs shadow-sm shadow-emerald-500/15"
          >
            Sauvegarder
          </button>
        </div>
      </SlidePanel>

      {/* --- VEHICLE PANEL --- */}
      <SlidePanel open={panel === "vehicle"} onClose={() => setPanel(null)} title="Mon vehicule">
        <div className="space-y-4">
          {Object.entries({
            "Type": vehicleTypeLabel,
            "Immatriculation": me?.vehiclePlate ?? "—",
            "Numero de permis": me?.licenseNumber ?? "—",
          }).map(([label, value], i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-400 text-[10px]">{label}</span>
              <span className="text-slate-700 text-xs">{value}</span>
            </div>
          ))}
          <button onClick={() => toast.info("Demande de modification envoyee")} className="w-full py-3 rounded-xl border border-[#2A9D8F] text-[#2A9D8F] text-xs">
            Modifier mon vehicule
          </button>
        </div>
      </SlidePanel>

      {/* --- DOCUMENTS PANEL --- */}
      <SlidePanel open={panel === "documents"} onClose={() => setPanel(null)} title="Documents & justificatifs">
        <div className="space-y-3">
          {documents.length === 0 && (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Aucun document</p>
              <p className="text-slate-300 text-[10px]">Ajoutez vos justificatifs pour verification</p>
            </div>
          )}
          {documents.map(doc => (
            <div key={doc.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-slate-700 text-xs">{doc.name}</p>
                <p className="text-slate-400 text-[9px]">Ajoute le {doc.date}{doc.expiry ? ` - Expire: ${doc.expiry}` : ""}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${statusColor(doc.status)}`}>
                {statusLabel(doc.status)}
              </span>
            </div>
          ))}
          <button onClick={() => toast.info("Upload en cours...")} className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> Ajouter un document
          </button>
        </div>
      </SlidePanel>

      {/* --- STATS PANEL --- */}
      <SlidePanel open={panel === "stats"} onClose={() => setPanel(null)} title="Statistiques & performances">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-slate-800 text-sm" style={{ fontFamily: "'Space Grotesk', monospace", color: s.color }}>{s.value}</p>
                <p className="text-slate-400 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#1E6091]" />
            <p className="text-[#1E6091] text-[11px]">Commission IPPOO : {COMMISSION_RATE}%</p>
          </div>
        </div>
      </SlidePanel>

      {/* --- REFERRAL PANEL --- */}
      <SlidePanel open={panel === "referral"} onClose={() => setPanel(null)} title="Parrainage chauffeurs">
        <div className="text-center mb-6">
          <Gift className="w-12 h-12 text-[#F77F00] mx-auto mb-3" />
          <p className="text-slate-800 text-sm mb-1">Parrainez un chauffeur</p>
          <p className="text-slate-400 text-[10px]">Partagez votre code de parrainage avec d'autres chauffeurs</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center mb-4">
          <p className="text-slate-400 text-[10px] mb-1">Votre code parrain</p>
          <p className="text-[#1E6091] text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{me?.referralCode ?? "—"}</p>
          {me?.referralCode && (
            <button onClick={() => { navigator.clipboard.writeText(me.referralCode!); toast.success("Code copie"); }} className="mt-2 text-[#2A9D8F] text-[10px] flex items-center gap-1 mx-auto">
              <Copy className="w-3 h-3" /> Copier
            </button>
          )}
        </div>
      </SlidePanel>

      {/* --- PIN PANEL --- */}
      <SlidePanel open={panel === "pin"} onClose={() => setPanel(null)} title="Code PIN">
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-xs mb-4">Changez votre code PIN a 4 chiffres</p>
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 border-2 border-slate-200 rounded-xl flex items-center justify-center">
                <span className="text-slate-400 text-lg">-</span>
              </div>
            ))}
          </div>
          <button onClick={() => { toast.success("Code PIN mis a jour"); setPanel(null); }} className="px-8 py-3 rounded-xl bg-[#2A9D8F] text-white text-xs">
            Confirmer
          </button>
        </div>
      </SlidePanel>

      {/* --- BIOMETRIC PANEL --- */}
      <SlidePanel open={panel === "biometric"} onClose={() => setPanel(null)} title="Biometrie">
        <Toggle on={biometric} onToggle={() => { setBiometric(!biometric); toast.success(biometric ? "Biometrie desactivee" : "Biometrie activee"); }} label="Empreinte digitale / Face ID" desc="Connexion rapide avec biometrie" />
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <Shield className="w-6 h-6 text-[#1E6091] mb-2" />
          <p className="text-[#1E6091] text-xs mb-1">WebAuthn active</p>
          <p className="text-blue-400 text-[10px]">Votre compte est protege par l'authentification biometrique WebAuthn.</p>
        </div>
      </SlidePanel>

      {/* --- SETTINGS PANEL --- */}
      <SlidePanel open={panel === "settings"} onClose={() => setPanel(null)} title="Parametres">
        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Notifications</p>
        <Toggle on={notifSound} onToggle={() => setNotifSound(!notifSound)} label="Sons des notifications" desc="Jouer un son pour les nouvelles missions" />
        <Toggle on={notifMissions} onToggle={() => setNotifMissions(!notifMissions)} label="Notifications missions" desc="Recevoir des alertes pour les nouvelles missions" />
        <Toggle on={notifEarnings} onToggle={() => setNotifEarnings(!notifEarnings)} label="Notifications gains" desc="Alertes pour les gains et retraits" />

        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 mt-6">Conduite</p>
        <Toggle on={autoAccept} onToggle={() => setAutoAccept(!autoAccept)} label="Acceptation automatique" desc="Accepter automatiquement les missions proches" />

        <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 mt-6">Apparence</p>
        <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} label="Mode sombre" desc="Activer le theme sombre" />
      </SlidePanel>

      {/* --- LOGOUT CONFIRM --- */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-sm">
            <LogOut className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-800 text-sm text-center mb-1">Se deconnecter ?</p>
            <p className="text-slate-400 text-[10px] text-center mb-5">Vous ne recevrez plus de missions jusqu'a votre prochaine connexion.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowConfirmLogout(false)} className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs">Annuler</button>
              <button onClick={() => navigate("/login")} className="py-3 rounded-xl bg-red-500 text-white text-xs">Se deconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
