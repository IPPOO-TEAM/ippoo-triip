import { useState } from "react";
import {
  Bell, Send, Users, Car, Globe, Megaphone, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Trash2, Eye, Filter, Search, Plus
} from "lucide-react";
import { toast } from "sonner";
import { broadcastPush } from "../../store/push-notifications";

/* ─── Mock Data ─── */
const SENT_NOTIFICATIONS = [
  { id: 1, title: "Maintenance prévue ce soir", body: "L'application sera indisponible entre 23h et 1h pour maintenance. Merci de votre patience.", target: "Tous", sent: "11 Avr 2026, 10:00", read: 89420, total: 152847, status: "delivered" },
  { id: 2, title: "Nouveau service IPPOO AIR disponible !", body: "Découvrez notre service de fret aérien. Envoyez vos colis par avion à travers le Bénin.", target: "Clients", sent: "10 Avr 2026, 09:00", read: 72340, total: 148500, status: "delivered" },
  { id: 3, title: "Bonus x2 ce week-end", body: "Doublez vos gains ce samedi et dimanche. Toutes les commissions sont multipliées par 2.", target: "Chauffeurs", sent: "09 Avr 2026, 18:00", read: 2890, total: 3847, status: "delivered" },
  { id: 4, title: "Alerte météo · Pluies fortes attendues", body: "Des pluies intenses sont prévues à Cotonou et alentours. Conduisez prudemment.", target: "Tous", sent: "08 Avr 2026, 14:00", read: 105000, total: 152847, status: "delivered" },
  { id: 5, title: "Mise à jour v2.5 disponible", body: "Nouvelle version avec suivi amélioré, paiement plus rapide et corrections de bugs.", target: "Tous", sent: "07 Avr 2026, 08:00", read: 98200, total: 152847, status: "delivered" },
];

const SYSTEM_ALERTS = [
  { id: 1, type: "sos" as const, message: "Alerte SOS déclenchée · Course IP-8842 à Fidjrossè", time: "Il y a 15 min", handled: false },
  { id: 2, type: "fraud" as const, message: "Activité suspecte détectée · Utilisateur USR-042 (3 comptes liés)", time: "Il y a 45 min", handled: false },
  { id: 3, type: "system" as const, message: "Pic de charge serveur · 95% de capacité atteinte", time: "Il y a 1h", handled: true },
  { id: 4, type: "driver" as const, message: "5 chauffeurs n'ont pas mis à jour leurs documents depuis 30 jours", time: "Il y a 2h", handled: false },
  { id: 5, type: "sos" as const, message: "Alerte SOS annulée · Course IP-8835 (fausse alerte)", time: "Il y a 3h", handled: true },
];

const alertTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  sos: { label: "SOS", color: "#D62828", icon: AlertTriangle },
  fraud: { label: "Fraude", color: "#8B5CF6", icon: AlertTriangle },
  system: { label: "Système", color: "#F77F00", icon: AlertTriangle },
  driver: { label: "Chauffeur", color: "#1E6091", icon: Car },
};

export function AdminNotificationsPage() {
  const [tab, setTab] = useState<"send" | "history" | "alerts">("alerts");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h1>
          <p className="text-slate-500 text-xs mt-1">Envoyer et gérer les notifications push et alertes système</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {[
          { key: "alerts" as const, label: "Alertes système", icon: AlertTriangle, count: SYSTEM_ALERTS.filter(a => !a.handled).length },
          { key: "send" as const, label: "Envoyer", icon: Send },
          { key: "history" as const, label: "Historique", icon: Clock },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-xs border-b-2 transition ${
              tab === t.key ? "border-[#1E6091] text-[#1E6091]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count && <span className="w-5 h-5 bg-[#D62828] rounded-full text-[9px] text-white flex items-center justify-center">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Alerts tab */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {SYSTEM_ALERTS.map(a => {
            const ac = alertTypeConfig[a.type];
            return (
              <div key={a.id} className={`bg-white rounded-xl p-4 border flex items-center gap-3 ${a.handled ? "border-slate-100 opacity-60" : "border-l-4"}`} style={!a.handled ? { borderLeftColor: ac.color } : undefined}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ac.color}15` }}>
                  <ac.icon className="w-5 h-5" style={{ color: ac.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${ac.color}15`, color: ac.color }}>{ac.label}</span>
                    <span className="text-[10px] text-slate-400">{a.time}</span>
                  </div>
                  <p className="text-xs text-slate-700">{a.message}</p>
                </div>
                {!a.handled ? (
                  <button
                    onClick={() => { a.handled = true; toast.success("Alerte marquée comme traitée"); }}
                    className="shrink-0 px-3 py-2 bg-[#1E6091] text-white rounded-xl text-xs"
                  >
                    Traiter
                  </button>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-[#2A9D8F]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Traité
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Send tab */}
      {tab === "send" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl">
          <h3 className="title-gradient mb-5">Nouvelle notification push</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Destinataires</label>
              <div className="flex gap-2">
                {[
                  { key: "all", label: "Tous", icon: Globe },
                  { key: "clients", label: "Clients", icon: Users },
                  { key: "drivers", label: "Chauffeurs", icon: Car },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setNotifTarget(t.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition ${
                      notifTarget === t.key ? "bg-[#1E6091] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {notifTarget === "all" ? "152,847 destinataires" : notifTarget === "clients" ? "148,500 clients" : "3,847 chauffeurs"}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Titre</label>
              <input
                type="text"
                placeholder="Ex: Nouvelle fonctionnalité disponible"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091] transition"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Message</label>
              <textarea
                placeholder="Écrivez votre message ici..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1E6091] transition resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!notifTitle.trim() || !notifBody.trim()) return toast.error("Titre et message requis");
                  broadcastPush({
                    title: notifTitle.trim(),
                    body: notifBody.trim(),
                    target: notifTarget === "clients" ? "clients" : notifTarget === "drivers" ? "drivers" : "all",
                  });
                  toast.success(`Notification diffusée à ${notifTarget === "all" ? "tous" : notifTarget}`);
                  setNotifTitle(""); setNotifBody("");
                }}
                className="flex items-center gap-2 bg-[#1E6091] text-white px-6 py-3 rounded-xl text-xs shadow-sm shadow-blue-400/20"
              >
                <Send className="w-4 h-4" /> Envoyer maintenant
              </button>
              <button
                onClick={() => {
                  if (!notifTitle.trim() || !notifBody.trim()) return toast.error("Titre et message requis");
                  toast.info("Notification programmée pour demain 9h");
                }}
                className="flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-xl text-xs"
              >
                <Clock className="w-4 h-4" /> Programmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="space-y-3">
          {SENT_NOTIFICATIONS.map(n => (
            <div key={n.id} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#1E6091]" />
                </div>
                <div className="flex-1">
                  <h4 className="title-gradient text-sm">{n.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{n.target}</span>
                    <span className="text-[10px] text-slate-400">{n.sent}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#2A9D8F]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{Math.round(n.read / n.total * 100)}% lu</p>
                  <p className="text-[10px] text-slate-400">{n.read.toLocaleString()} / {n.total.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500" style={{ lineHeight: 1.7 }}>{n.body}</p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#2A9D8F] rounded-full transition-all" style={{ width: `${Math.round(n.read / n.total * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
