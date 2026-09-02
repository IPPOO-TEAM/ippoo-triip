import { useEffect, useState } from "react";
import {
  Settings, MapPin, CreditCard, Percent, Shield, Bell,
  Save, ToggleLeft, ToggleRight,
  Plus, Trash2, Edit3, Check, RotateCcw, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { resetDb } from "../../api/db";
import { api } from "../../api/client";

/* --- Types (config plateforme) --- */
type Zone = { id: number; name: string; active: boolean; baseFare: number; perKm: number; minFare: number };
type CommissionRate = { service: string; rate: number };

interface SettingSection {
  id: string;
  title: string;
  icon: any;
  color: string;
}

const SECTIONS: SettingSection[] = [
  { id: "general", title: "Général", icon: Settings, color: "#1E6091" },
  { id: "zones", title: "Zones & Tarification", icon: MapPin, color: "#2A9D8F" },
  { id: "commissions", title: "Commissions", icon: Percent, color: "#F77F00" },
  { id: "payments", title: "Paiements", icon: CreditCard, color: "#8B5CF6" },
  { id: "security", title: "Sécurité", icon: Shield, color: "#D62828" },
  { id: "notifications_settings", title: "Notifications", icon: Bell, color: "#E9C46A" },
];

export function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [zones, setZones] = useState<Zone[]>([]);
  const [commissions, setCommissions] = useState<CommissionRate[]>([]);
  const [saved, setSaved] = useState(false);

  /* -- Charge la config plateforme depuis le backend (repli : vide) -- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api.get<Record<string, any>>("/platform/config");
        if (cancelled) return;
        if (Array.isArray(cfg?.zones)) setZones(cfg.zones as Zone[]);
        const rates = cfg?.commissionRates ?? cfg?.commissions;
        if (Array.isArray(rates)) setCommissions(rates as CommissionRate[]);
      } catch {
        if (!cancelled) { setZones([]); setCommissions([]); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* -- États des toggles des sections paramètres -- */
  const [services, setServices] = useState(
    ["Taxi-Moto", "Livraison de colis", "Transport de biens lourds", "Commandes groupées", "Covoiturage", "IPPOO AIR"].map((n) => ({ name: n, active: true })),
  );
  const [payments, setPayments] = useState([
    { name: "IPPOO Cash (Wallet interne)", active: true },
    { name: "MTN Mobile Money", active: true },
    { name: "Moov Money", active: true },
    { name: "Carte bancaire (Visa/Mastercard)", active: true },
    { name: "Paiement à l'arrivée", active: true },
    { name: "Ecobank Pay", active: false },
  ]);
  const [security, setSecurity] = useState([
    { name: "Vérification OTP par SMS", desc: "Envoyer un code à 6 chiffres pour chaque connexion", active: true },
    { name: "Authentification biométrique (WebAuthn)", desc: "Empreinte digitale / Face ID pour les connexions rapides", active: true },
    { name: "Bouton SOS actif", desc: "Permettre aux clients de déclencher une alerte d'urgence", active: true },
    { name: "Partage de trajet", desc: "Permettre aux clients de partager leur trajet en temps réel", active: true },
    { name: "Vérification documents chauffeurs", desc: "Exiger une validation manuelle des documents des chauffeurs", active: true },
    { name: "Géolocalisation obligatoire", desc: "Exiger l'activation du GPS pour utiliser l'application", active: true },
    { name: "Double authentification admin", desc: "Exiger un code OTP pour les actions sensibles", active: false },
  ]);
  const [notifs, setNotifs] = useState([
    { name: "Nouvelle course attribuée", desc: "Notification push au chauffeur", active: true },
    { name: "Course terminée", desc: "Confirmation au client et chauffeur", active: true },
    { name: "Retrait validé", desc: "Notification au chauffeur après validation du retrait", active: true },
    { name: "Alerte SOS", desc: "Notification immédiate à l'équipe support et admin", active: true },
    { name: "Rappel de documents", desc: "Rappel automatique 7 jours avant expiration", active: true },
    { name: "Promotions et offres", desc: "Notifications marketing aux clients", active: false },
    { name: "Rapport quotidien admin", desc: "Email récapitulatif chaque matin à 8h", active: true },
  ]);

  const toggleAt = <T extends { active: boolean }>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number) =>
    setter((prev) => prev.map((x, idx) => (idx === i ? { ...x, active: !x.active } : x)));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleZone = (id: number) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, active: !z.active } : z));
  };

  const handleResetDemo = () => {
    resetDb();
    toast.success("Données de démonstration réinitialisées", {
      description: "L'application va se recharger…",
    });
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Paramètres</h1>
          <p className="text-slate-500 text-xs mt-1">Configuration de la plateforme IPPOO</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-sm transition ${
            saved ? "bg-[#2A9D8F] text-white" : "bg-[#1E6091] text-white shadow-blue-400/20"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="lg:w-[240px] shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 p-2 space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
                  activeSection === s.id ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <s.icon className="w-4 h-4" style={{ color: activeSection === s.id ? s.color : undefined }} />
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* General */}
          {activeSection === "general" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
              <h3 className="title-gradient">Paramètres généraux</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Nom de la plateforme</label>
                  <input defaultValue="IPPOO TRIIP" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Pays principal</label>
                  <input defaultValue="Bénin" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Devise</label>
                  <input defaultValue="FCFA (XOF)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Langue par défaut</label>
                  <input defaultValue="Français" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Email support</label>
                  <input defaultValue="contact@ippoo.app" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Téléphone support</label>
                  <input defaultValue="+229 97 00 00 00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                </div>
              </div>

              <h4 className="text-slate-700 text-sm mt-4">Services actifs</h4>
              <div className="space-y-3">
                {services.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-600">{s.name}</span>
                    <button
                      onClick={() => { toggleAt(setServices, i); toast.success(`${s.name} ${s.active ? "désactivé" : "activé"}`); }}
                      aria-label={`Basculer ${s.name}`}
                      className={s.active ? "text-[#2A9D8F]" : "text-slate-300"}
                    >
                      {s.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Données de démonstration */}
              <h4 className="text-slate-700 text-sm mt-4">Données de démonstration</h4>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[#D62828]/20 bg-[#D62828]/5">
                <div>
                  <p className="text-sm text-slate-700">Réinitialiser les données démo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Restaure la base mock (courses, wallet, notifications, parrainages…) à son état initial.
                  </p>
                </div>
                <button
                  onClick={handleResetDemo}
                  className="flex items-center justify-center gap-2 bg-[#D62828] text-white px-4 py-2.5 rounded-xl text-xs whitespace-nowrap active:scale-95 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Réinitialiser
                </button>
              </div>
            </div>
          )}

          {/* Zones & Pricing */}
          {activeSection === "zones" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="title-gradient">Zones & Tarification</h3>
                <button
                  onClick={() => {
                    const name = prompt("Nom de la nouvelle zone ?");
                    if (!name?.trim()) return;
                    setZones((prev) => [...prev, { id: Date.now(), name: name.trim(), active: true, baseFare: 300, perKm: 150, minFare: 500 }]);
                    toast.success(`Zone "${name.trim()}" créée`);
                  }}
                  className="flex items-center gap-2 bg-[#2A9D8F] text-white px-4 py-2 rounded-xl text-xs"
                >
                  <Plus className="w-4 h-4" /> Ajouter zone
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Zone", "Actif", "Prise en charge", "Par km", "Tarif minimum", "Actions"].map((h, i) => (
                        <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map(z => (
                      <tr key={z.id} className="border-b border-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-700">{z.name}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleZone(z.id)} className={z.active ? "text-[#2A9D8F]" : "text-slate-300"}>
                            {z.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{z.baseFare} FCFA</td>
                        <td className="px-4 py-3 text-xs text-slate-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{z.perKm} FCFA/km</td>
                        <td className="px-4 py-3 text-xs text-slate-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{z.minFare} FCFA</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const newName = prompt("Nouveau nom de la zone :", z.name);
                                if (!newName?.trim()) return;
                                setZones((prev) => prev.map((x) => (x.id === z.id ? { ...x, name: newName.trim() } : x)));
                                toast.success("Zone mise à jour");
                              }}
                              aria-label="Modifier"
                              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1E6091]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm(`Supprimer la zone "${z.name}" ?`)) return;
                                setZones((prev) => prev.filter((x) => x.id !== z.id));
                                toast.success("Zone supprimée");
                              }}
                              aria-label="Supprimer"
                              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#D62828]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {zones.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Inbox className="w-8 h-8 mb-3" />
                  <p className="text-sm text-slate-500">Aucune zone configurée</p>
                  <p className="text-xs mt-1">Ajoutez une zone pour définir sa tarification.</p>
                </div>
              )}
            </div>
          )}

          {/* Commissions */}
          {activeSection === "commissions" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="title-gradient">Taux de commission par service</h3>
              <p className="text-xs text-slate-400">Pourcentage prélevé par IPPOO sur chaque course ou livraison.</p>
              {commissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Inbox className="w-8 h-8 mb-3" />
                  <p className="text-sm text-slate-500">Aucun taux de commission configuré</p>
                  <p className="text-xs mt-1">Les taux définis dans la config plateforme apparaîtront ici.</p>
                </div>
              )}
              <div className="space-y-3">
                {commissions.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-700 flex-1">{c.service}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={c.rate}
                        onChange={(e) => {
                          const newRate = parseInt(e.target.value) || 0;
                          setCommissions(prev => prev.map((item, idx) => idx === i ? { ...item, rate: newRate } : item));
                        }}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-[#F77F00]"
                        style={{ fontFamily: "'Space Grotesk', monospace" }}
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {activeSection === "payments" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="title-gradient">Méthodes de paiement</h3>
              <div className="space-y-3">
                {payments.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700">{m.name}</span>
                    </div>
                    <button
                      onClick={() => { toggleAt(setPayments, i); toast.success(`${m.name} ${m.active ? "désactivé" : "activé"}`); }}
                      aria-label={`Basculer ${m.name}`}
                      className={m.active ? "text-[#2A9D8F]" : "text-slate-300"}
                    >
                      {m.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-slate-700 text-sm mb-3">Seuils de retrait</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Retrait minimum</label>
                    <input defaultValue="5,000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Retrait maximum / jour</label>
                    <input defaultValue="500,000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="title-gradient">Sécurité</h3>
              <div className="space-y-3">
                {security.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1 mr-4">
                      <p className="text-sm text-slate-700">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => { toggleAt(setSecurity, i); toast.success(`${item.name} ${item.active ? "désactivé" : "activé"}`); }}
                      aria-label={`Basculer ${item.name}`}
                      className={item.active ? "text-[#2A9D8F]" : "text-slate-300"}
                    >
                      {item.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications settings */}
          {activeSection === "notifications_settings" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="title-gradient">Paramètres de notifications</h3>
              <div className="space-y-3">
                {notifs.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1 mr-4">
                      <p className="text-sm text-slate-700">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => { toggleAt(setNotifs, i); toast.success(`${item.name} ${item.active ? "désactivé" : "activé"}`); }}
                      aria-label={`Basculer ${item.name}`}
                      className={item.active ? "text-[#2A9D8F]" : "text-slate-300"}
                    >
                      {item.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
