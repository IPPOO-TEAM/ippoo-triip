import { useState } from "react";
import {
  Search, MessageSquare, Clock, CheckCircle2, AlertTriangle, XCircle,
  ChevronLeft, ChevronRight, Send, Paperclip, Phone, Flag,
  MoreHorizontal, Filter, ArrowUpRight, User, Car, Shield
} from "lucide-react";
import { getAvatar } from "../avatars";
import { toast } from "sonner";

/* ─── Mock Data ─── */
const TICKETS = [
  { id: "TK-1247", subject: "Chauffeur impoli · Course IP-8842", from: "Dossou Akotchédjé", fromInit: "DA", fromType: "client" as const, priority: "high" as const, status: "open" as const, category: "Plainte chauffeur", created: "11 Avr 14:20", lastMessage: "Le chauffeur a refusé de mettre le casque et roulait trop vite...", messages: 3 },
  { id: "TK-1246", subject: "Paiement non reçu pour course terminée", from: "Hounkpatin Akotchaye", fromInit: "HA", fromType: "driver" as const, priority: "medium" as const, status: "in_progress" as const, category: "Problème paiement", created: "11 Avr 13:45", lastMessage: "Ma course IP-9001 est terminée depuis 2h mais le montant n'apparaît pas...", messages: 5 },
  { id: "TK-1245", subject: "Colis endommagé à la livraison", from: "Fifamè Dossou-Yovo", fromInit: "FD", fromType: "client" as const, priority: "high" as const, status: "open" as const, category: "Livraison", created: "11 Avr 12:30", lastMessage: "Le colis est arrivé avec l'emballage déchiré et le contenu cassé...", messages: 2 },
  { id: "TK-1244", subject: "Demande de remboursement · course annulée", from: "Aïdatou Bello", fromInit: "AB", fromType: "client" as const, priority: "low" as const, status: "resolved" as const, category: "Remboursement", created: "11 Avr 10:00", lastMessage: "Merci pour le remboursement rapide !", messages: 4 },
  { id: "TK-1243", subject: "Problème GPS sur l'application", from: "Togbédji Mensah", fromInit: "TM", fromType: "driver" as const, priority: "medium" as const, status: "in_progress" as const, category: "Bug technique", created: "10 Avr 22:15", lastMessage: "Le GPS ne se met plus à jour depuis la dernière mise à jour...", messages: 6 },
  { id: "TK-1242", subject: "Alerte SOS déclenchée par erreur", from: "Gbètoho Bocco", fromInit: "GB", fromType: "client" as const, priority: "high" as const, status: "resolved" as const, category: "Sécurité", created: "10 Avr 20:00", lastMessage: "Désolé, c'était une fausse manipulation.", messages: 3 },
  { id: "TK-1241", subject: "Document expiré · renouvellement en cours", from: "Fifamè Agbodjèlou", fromInit: "FD", fromType: "driver" as const, priority: "low" as const, status: "open" as const, category: "Documents", created: "10 Avr 18:30", lastMessage: "J'ai téléchargé mon nouveau permis, pouvez-vous le valider ?", messages: 2 },
];

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "Urgent", color: "#D62828", bg: "bg-red-50" },
  medium: { label: "Normal", color: "#F77F00", bg: "bg-orange-50" },
  low: { label: "Faible", color: "#2A9D8F", bg: "bg-emerald-50" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Ouvert", color: "#D62828", bg: "bg-red-50" },
  in_progress: { label: "En cours", color: "#F77F00", bg: "bg-orange-50" },
  resolved: { label: "Résolu", color: "#2A9D8F", bg: "bg-emerald-50" },
};

const MESSAGES = [
  { id: 1, sender: "client", text: "Bonjour, le chauffeur a refusé de mettre le casque et roulait très vite. Je ne me sentais pas en sécurité.", time: "14:20" },
  { id: 2, sender: "admin", text: "Bonjour M. Akotchédjé, nous prenons votre signalement très au sérieux. Pouvez-vous nous confirmer le numéro de la course ?", time: "14:25" },
  { id: 3, sender: "client", text: "C'est la course IP-8842, aujourd'hui à 13h50.", time: "14:28" },
];

export function AdminSupportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<typeof TICKETS[0] | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = TICKETS.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="title-gradient" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Support & Tickets</h1>
          <p className="text-slate-500 text-xs mt-1">Gestion des requêtes clients et chauffeurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tickets ouverts", value: "18", icon: MessageSquare, color: "#D62828" },
          { label: "En cours", value: "12", icon: Clock, color: "#F77F00" },
          { label: "Résolus (7j)", value: "156", icon: CheckCircle2, color: "#2A9D8F" },
          { label: "Temps réponse moyen", value: "8 min", icon: Clock, color: "#1E6091" },
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
          <input type="text" placeholder="Rechercher un ticket..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-600 outline-none flex-1" />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tous" },
            { key: "open", label: "Ouverts" },
            { key: "in_progress", label: "En cours" },
            { key: "resolved", label: "Résolus" },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-xs transition ${statusFilter === f.key ? "bg-[#1E6091] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedTicket(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 shrink-0">
              <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-slate-400"><XCircle className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedTicket.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityConfig[selectedTicket.priority].bg}`} style={{ color: priorityConfig[selectedTicket.priority].color }}>
                  {priorityConfig[selectedTicket.priority].label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[selectedTicket.status].bg}`} style={{ color: statusConfig[selectedTicket.status].color }}>
                  {statusConfig[selectedTicket.status].label}
                </span>
              </div>
              <h2 className="title-gradient">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-2">
                <img src={getAvatar(selectedTicket.fromInit) || ""} alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs text-slate-500">{selectedTicket.from}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedTicket.fromType === "client" ? "bg-blue-50 text-[#1E6091]" : "bg-emerald-50 text-[#2A9D8F]"}`}>
                  {selectedTicket.fromType === "client" ? "Client" : "Chauffeur"}
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">{selectedTicket.created}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {MESSAGES.map(m => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 ${m.sender === "admin" ? "bg-[#1E6091] text-white" : "bg-slate-100 text-slate-700"}`}>
                    <p className="text-xs" style={{ lineHeight: 1.7 }}>{m.text}</p>
                    <p className={`text-[10px] mt-2 ${m.sender === "admin" ? "text-white/50" : "text-slate-400"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <label className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-200 transition" aria-label="Joindre un fichier">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) toast.success(`Fichier joint : ${f.name}`);
                    }}
                  />
                </label>
                <input
                  type="text"
                  placeholder="Écrire une réponse..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && replyText.trim()) {
                      toast.success(`Réponse envoyée sur ${selectedTicket.id}`);
                      setReplyText("");
                    }
                  }}
                  className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-600 outline-none"
                />
                <button
                  onClick={() => {
                    if (!replyText.trim()) return toast.error("Saisissez une réponse");
                    toast.success(`Réponse envoyée sur ${selectedTicket.id}`);
                    setReplyText("");
                  }}
                  aria-label="Envoyer la réponse"
                  className="w-9 h-9 rounded-xl bg-[#1E6091] flex items-center justify-center text-white shadow-lg shadow-blue-400/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                {selectedTicket.status !== "resolved" && (
                  <button
                    onClick={() => { toast.success(`Ticket ${selectedTicket.id} marqué résolu`); setSelectedTicket(null); }}
                    className="flex-1 bg-emerald-50 text-[#2A9D8F] py-2 rounded-xl text-xs"
                  >
                    Marquer résolu
                  </button>
                )}
                <button
                  onClick={() => { toast.info(`Ticket ${selectedTicket.id} transféré à l'équipe spécialisée`); setSelectedTicket(null); }}
                  className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-xl text-xs"
                >
                  Transférer
                </button>
                <button
                  onClick={() => { toast.warning(`Ticket ${selectedTicket.id} escaladé en priorité`); }}
                  className="flex-1 bg-red-50 text-[#D62828] py-2 rounded-xl text-xs"
                >
                  Escalader
                </button>
              </div>
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
                {["ID", "Sujet", "De", "Type", "Catégorie", "Priorité", "Statut", "Messages", "Créé le"].map((h, i) => (
                  <th key={i} className="text-left text-[10px] text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const pr = priorityConfig[t.priority];
                const st = statusConfig[t.status];
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="px-4 py-3 text-xs text-[#1E6091]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{t.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={getAvatar(t.fromInit) || ""} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs text-slate-600 truncate max-w-[120px]">{t.from}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.fromType === "client" ? "bg-blue-50 text-[#1E6091]" : "bg-emerald-50 text-[#2A9D8F]"}`}>
                        {t.fromType === "client" ? "Client" : "Chauffeur"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${pr.bg}`} style={{ color: pr.color }}>{pr.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{t.messages}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">{t.created}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
