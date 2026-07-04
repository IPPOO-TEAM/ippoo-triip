import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, MessageSquare, Phone,
  AlertTriangle, FileText, Send, HelpCircle, X,
  Plus, Clock, Check, CheckCheck, Star, ChevronDown, Search,
  Paperclip, ThumbsUp, ThumbsDown, Copy, Mic,
  User, Headphones, Bot, Zap, ArrowDown, Shield, Car,
  Wallet, CreditCard, Navigation, Award
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "../../../imports/IPPOO_Transport_&_Logistique-1.png";

/* ─── Types ─── */
interface ChatMessage {
  id: number;
  from: "driver" | "bot" | "agent" | "system";
  text: string;
  time: string;
  status?: "sending" | "sent" | "delivered" | "read";
  helpful?: boolean | null;
}

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  statusLabel: string;
  statusColor: string;
  date: string;
  messages: { from: string; text: string; date: string }[];
}

type View = "main" | "chat" | "tickets" | "ticketDetail" | "faq" | "emergency";

/* ─── Data ─── */
const faqItems = [
  { q: "Comment recevoir plus de missions ?", a: "Restez en ligne aux heures de pointe (7h-9h, 12h-14h, 17h-20h), maintenez une note superieure à 4.5, et acceptez au moins 85% des missions proposees.", category: "missions" },
  { q: "Comment retirer mes gains ?", a: "Allez dans Gains > Retirer, choisissez votre operateur (MTN, Moov, Celtiis), entrez le montant et confirmez. Le retrait est traite en 1 à 5 minutes.", category: "paiement" },
  { q: "Que faire en cas de panne ?", a: "Appuyez sur le bouton SOS dans la navigation, selectionnez 'Panne vehicule'. Notre equipe d'assistance technique sera alertee et un agent vous contactera.", category: "urgence" },
  { q: "Comment contester une commission ?", a: "Depuis Historique > Detail de la mission, appuyez sur 'Signaler'. Decrivez le probleme et notre equipe examinera votre demande sous 24h.", category: "paiement" },
  { q: "Comment mettre a jour mes documents ?", a: "Allez dans Profil > Documents & justificatifs. Appuyez sur 'Ajouter un document' pour uploader la nouvelle version. La verification prend 24 à 48h.", category: "documents" },
  { q: "Comment augmenter mon niveau ?", a: "Completez plus de courses, maintenez une note elevee, reduisez les annulations et soyez ponctuel. Les niveaux sont: Bronze, Silver, Gold, Platine.", category: "general" },
  { q: "Comment signaler un client problematique ?", a: "Apres la course, dans le detail de l'historique, appuyez sur 'Signaler'. Vous pouvez aussi contacter le support via le chat.", category: "securite" },
  { q: "Quels sont les bonus disponibles ?", a: "Bonus heure de pointe (+30%), bonus courses consecutives (10 courses = 1000 F), bonus weekend, et bonus zone eloignee.", category: "bonus" },
];

const initialTickets: Ticket[] = [
  {
    id: 205, subject: "Contestation tarif course #IPP-D-20260410-003", category: "Paiement",
    status: "resolved", statusLabel: "Resolu", statusColor: "bg-emerald-50 text-emerald-600",
    date: "09 Avr 2026",
    messages: [
      { from: "driver", text: "La course #IPP-D-20260410-003 a ete annulee mais j'avais deja commence le trajet. Je demande une compensation.", date: "09 Avr 14:20" },
      { from: "support", text: "Nous avons examine votre demande. Effectivement, vous aviez parcouru 1.2 km avant l'annulation. Un credit de 400 FCFA a ete ajoute a votre solde.", date: "09 Avr 16:45" },
    ],
  },
  {
    id: 198, subject: "Probleme GPS pendant course", category: "Technique",
    status: "closed", statusLabel: "Ferme", statusColor: "bg-slate-100 text-slate-500",
    date: "05 Avr 2026",
    messages: [
      { from: "driver", text: "Le GPS perd le signal regulierement pendant les courses dans la zone de Gbegamey.", date: "05 Avr 10:00" },
      { from: "support", text: "Merci pour le signalement. Nous avons ameliore la couverture GPS dans cette zone. N'hesitez pas a nous contacter si le probleme persiste.", date: "06 Avr 09:30" },
    ],
  },
];

const botResponses: Record<string, string> = {
  "retrait": "Pour retirer vos gains, allez dans l'onglet Gains > Retirer. Choisissez votre operateur, entrez le montant et confirmez. Les retraits sont traites en 1 à 5 min.",
  "mission": "Pour voir les missions disponibles, assurez-vous d'etre en ligne depuis le tableau de bord. Les missions apparaissent automatiquement dans l'onglet Missions.",
  "bonus": "Les bonus incluent: heure de pointe (+30%), 10 courses consecutives (1000 F), weekend, et zone eloignee. Consultez Missions pour les details.",
  "document": "Pour mettre a jour un document: Profil > Documents > Ajouter. Formats acceptes: PDF, JPG, PNG. La verification prend 24-48h.",
  "commission": "La commission IPPOO est de 15% sur chaque course. Pour contester, allez dans Historique > Detail > Signaler.",
  "panne": "En cas de panne: Navigation > SOS > Panne vehicule. Notre equipe technique sera alertee immediatement.",
};

export function DriverSupportPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("main");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, from: "system", text: "Bienvenue sur le support chauffeur IPPOO. Notre assistant IA va vous aider.", time: "Maintenant" },
    { id: 2, from: "bot", text: "Bonjour Hounkpatin ! Comment puis-je vous aider ? Posez votre question ou choisissez un sujet.", time: "Maintenant" },
  ]);
  const [msgInput, setMsgInput] = useState("");
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChatMsg = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    setChatMessages(prev => [...prev, { id: prev.length + 1, from: "driver", text: msgInput, time, status: "sent" }]);
    const userMsg = msgInput.toLowerCase();
    setMsgInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const t = new Date();
      const replyTime = `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;

      // Find matching bot response
      let reply = "Je n'ai pas compris votre demande. Pourriez-vous reformuler ? Vous pouvez aussi creer un ticket pour une assistance humaine.";
      for (const [key, val] of Object.entries(botResponses)) {
        if (userMsg.includes(key)) { reply = val; break; }
      }

      setChatMessages(prev => [...prev, {
        id: prev.length + 1, from: "bot", text: reply, time: replyTime, helpful: null
      }]);
    }, 1500 + Math.random() * 2000);
  };

  const quickTopics = [
    { label: "Retrait", keyword: "retrait" },
    { label: "Missions", keyword: "mission" },
    { label: "Bonus", keyword: "bonus" },
    { label: "Documents", keyword: "document" },
    { label: "Commission", keyword: "commission" },
    { label: "Panne", keyword: "panne" },
  ];

  const filteredFaq = faqItems.filter(f =>
    !faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 pb-4">
      {/* ═══ MAIN VIEW ═══ */}
      {view === "main" && (
        <>
          <div className="bg-[#F77F00] pt-12 pb-6 px-5 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <p className="text-white text-sm flex-1">Support chauffeur</p>
              <img src={logoImg} alt="IPPOO" className="h-6 object-contain" />
            </div>
            <p className="text-white/80 text-xs">Besoin d'aide ? Notre equipe et notre assistant IA sont disponibles 24/7.</p>
          </div>

          <div className="px-5 mt-4 space-y-3">
            {[
              { icon: Bot, label: "Chat avec l'assistant IA", desc: "Reponse instantanee a vos questions", color: "#2A9D8F", view: "chat" as View },
              { icon: FileText, label: "Mes tickets de support", desc: `${tickets.length} ticket(s)`, color: "#1E6091", view: "tickets" as View },
              { icon: HelpCircle, label: "FAQ Chauffeurs", desc: `${faqItems.length} questions frequentes`, color: "#F77F00", view: "faq" as View },
              { icon: Shield, label: "Urgence & Securite", desc: "SOS, incident, probleme client", color: "#D62828", view: "emergency" as View },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => setView(item.view)}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 text-left active:bg-slate-50 transition"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-xs">{item.label}</p>
                  <p className="text-slate-400 text-[10px]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}

            {/* Direct call */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#2A9D8F]" />
              <div className="flex-1">
                <p className="text-slate-600 text-xs">Ligne chauffeurs</p>
                <p className="text-slate-400 text-[10px]">+229 97 00 00 01</p>
              </div>
              <button onClick={() => window.open("tel:+22997000001")} className="px-4 py-2 rounded-xl bg-[#2A9D8F] text-white text-[10px]">
                Appeler
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ CHAT VIEW ═══ */}
      {view === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
          {/* Header */}
          <div className="shrink-0 bg-white border-b border-slate-100 pt-12 pb-3 px-5 flex items-center gap-3">
            <button onClick={() => setView("main")} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#2A9D8F] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-slate-700 text-xs">Assistant IPPOO Chauffeur</p>
              <p className="text-emerald-500 text-[9px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En ligne</p>
            </div>
          </div>

          {/* Quick topics */}
          <div className="shrink-0 px-5 py-2 flex gap-2 overflow-x-auto border-b border-slate-50">
            {quickTopics.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  setMsgInput(t.keyword);
                  setTimeout(() => {
                    const now = new Date();
                    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                    setChatMessages(prev => [...prev, { id: prev.length + 1, from: "driver", text: t.keyword, time, status: "sent" }]);
                    setMsgInput("");
                    setIsTyping(true);
                    setTimeout(() => {
                      setIsTyping(false);
                      const reply = botResponses[t.keyword] || "Pouvez-vous preciser votre question ?";
                      const rt = new Date();
                      setChatMessages(prev => [...prev, { id: prev.length + 1, from: "bot", text: reply, time: `${rt.getHours().toString().padStart(2, "0")}:${rt.getMinutes().toString().padStart(2, "0")}`, helpful: null }]);
                    }, 1500);
                  }, 100);
                }}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 text-[10px] whitespace-nowrap"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === "driver" ? "justify-end" : "justify-start"}`}>
                {msg.from === "system" ? (
                  <div className="bg-slate-100 rounded-full px-3 py-1 mx-auto">
                    <p className="text-slate-400 text-[9px] text-center">{msg.text}</p>
                  </div>
                ) : (
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${msg.from === "driver" ? "bg-[#2A9D8F] text-white rounded-br-md" : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"}`}>
                    <p className="text-xs" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className={`text-[9px] ${msg.from === "driver" ? "text-white/50" : "text-slate-400"}`}>{msg.time}</p>
                      {msg.helpful !== undefined && msg.from === "bot" && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { toast.success("Merci !"); }} className="text-slate-300 hover:text-emerald-400"><ThumbsUp className="w-3 h-3" /></button>
                          <button onClick={() => { toast.info("Merci, nous ameliorons nos reponses"); }} className="text-slate-300 hover:text-red-400"><ThumbsDown className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-t border-slate-100 bg-white">
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChatMsg()}
              className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs"
              placeholder="Votre question..."
            />
            <button onClick={sendChatMsg} className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ TICKETS VIEW ═══ */}
      {view === "tickets" && (
        <>
          <div className="bg-white pt-12 pb-4 px-5 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setView("main")} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <p className="text-slate-800 text-sm flex-1">Mes tickets</p>
              <button
                onClick={() => toast.info("Creer un nouveau ticket")}
                className="w-10 h-10 rounded-2xl bg-[#2A9D8F]/10 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 text-[#2A9D8F]" />
              </button>
            </div>
          </div>
          <div className="px-5 mt-3 space-y-2">
            {tickets.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTicket(t); setView("ticketDetail"); }}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 text-left active:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[9px]">#{t.id} - {t.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${t.statusColor}`}>{t.statusLabel}</span>
                </div>
                <p className="text-slate-700 text-xs">{t.subject}</p>
                <p className="text-slate-300 text-[9px] mt-1">{t.date}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ TICKET DETAIL ═══ */}
      {view === "ticketDetail" && selectedTicket && (
        <>
          <div className="bg-white pt-12 pb-4 px-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("tickets")} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <p className="text-slate-800 text-xs">Ticket #{selectedTicket.id}</p>
                <p className="text-slate-400 text-[9px]">{selectedTicket.category}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${selectedTicket.statusColor}`}>{selectedTicket.statusLabel}</span>
            </div>
          </div>
          <div className="px-5 mt-4">
            <p className="text-slate-700 text-sm mb-4">{selectedTicket.subject}</p>
            <div className="space-y-3">
              {selectedTicket.messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl ${m.from === "driver" ? "bg-[#2A9D8F]/5 border border-[#2A9D8F]/10" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] ${m.from === "driver" ? "text-[#2A9D8F]" : "text-[#1E6091]"}`}>
                      {m.from === "driver" ? "Vous" : "Support IPPOO"}
                    </span>
                    <span className="text-slate-300 text-[9px]">{m.date}</span>
                  </div>
                  <p className="text-slate-600 text-xs" style={{ lineHeight: 1.6 }}>{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ FAQ VIEW ═══ */}
      {view === "faq" && (
        <>
          <div className="bg-white pt-12 pb-4 px-5 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setView("main")} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <p className="text-slate-800 text-sm flex-1">FAQ Chauffeurs</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs"
                placeholder="Rechercher..."
              />
            </div>
          </div>
          <div className="px-5 mt-3 space-y-2">
            {filteredFaq.map((f, i) => (
              <button
                key={i}
                onClick={() => setFaqExpanded(faqExpanded === i ? null : i)}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-700 text-xs flex-1">{f.q}</p>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${faqExpanded === i ? "rotate-180" : ""}`} />
                </div>
                {faqExpanded === i && (
                  <p className="text-slate-500 text-[10px] mt-3 pt-3 border-t border-slate-50" style={{ lineHeight: 1.7 }}>{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ EMERGENCY VIEW ═══ */}
      {view === "emergency" && (
        <>
          <div className="bg-[#D62828] pt-12 pb-6 px-5 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView("main")} className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <p className="text-white text-sm flex-1">Urgence & Securite</p>
              <Shield className="w-6 h-6 text-white/60" />
            </div>
            <p className="text-white/80 text-xs">En cas d'urgence, contactez immediatement les services ci-dessous.</p>
          </div>
          <div className="px-5 mt-4 space-y-3">
            {[
              { icon: Phone, label: "Appeler les secours (117)", desc: "Police nationale", color: "#D62828", action: () => window.open("tel:117") },
              { icon: AlertTriangle, label: "Signaler un incident", desc: "Accident, agression, vol", color: "#F77F00", action: () => toast.info("Formulaire d'incident envoye au support") },
              { icon: User, label: "Probleme avec un client", desc: "Comportement inapproprie, refus de paiement", color: "#1E6091", action: () => toast.info("Un agent va vous contacter") },
              { icon: Car, label: "Panne vehicule", desc: "Assistance technique mecanique", color: "#2A9D8F", action: () => toast.info("Assistance technique en route") },
              { icon: Wallet, label: "Fraude ou tentative de scam", desc: "Signaler une activite suspecte", color: "#8B5CF6", action: () => toast.info("Signalement transmis a l'equipe securite") },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 text-left active:bg-slate-50 transition"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-xs">{item.label}</p>
                  <p className="text-slate-400 text-[10px]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
