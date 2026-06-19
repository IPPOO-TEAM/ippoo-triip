import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, MessageSquare, Phone,
  AlertTriangle, FileText, Send, HelpCircle, X,
  Plus, Clock, Check, CheckCheck, Star, ChevronDown, Search,
  Paperclip, ThumbsUp, ThumbsDown, Copy, Image, Mic, MicOff,
  Smile, Camera, MapPin, Volume2, Trash2, RotateCcw, Shield,
  User, Headphones, Bot, Zap, ArrowDown
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
interface ChatMessage {
  id: number;
  from: "user" | "bot" | "agent" | "system";
  text: string;
  time: string;
  status?: "sending" | "sent" | "delivered" | "read";
  helpful?: boolean | null;
  attachment?: { type: "image" | "location" | "voice"; url?: string; label?: string; duration?: number };
  replyTo?: { from: string; text: string };
  reactions?: string[];
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

/* ─── Data ─── */
const faqItems = [
  { q: "Comment commander une course ?", a: "Depuis l'accueil, appuyez sur 'Course', choisissez votre départ et arrivée, sélectionnez un véhicule et confirmez. Un chauffeur sera assigné automatiquement.", category: "course" },
  { q: "Comment recharger mon IPPOO Cash ?", a: "Allez dans IPPOO Cash > Recharger, choisissez votre opérateur (MTN, Moov, Celtiis), entrez le montant et confirmez. Le solde est crédité instantanément.", category: "paiement" },
  { q: "Comment suivre ma livraison ?", a: "Dans Historique, sélectionnez votre livraison en cours. Vous verrez la position du livreur en temps réel, l'ETA et pourrez le contacter.", category: "livraison" },
  { q: "Comment signaler un problème ?", a: "Utilisez le bouton 'Signaler un problème' ci-dessous ou le formulaire de création de ticket. Notre équipe répond sous 24h.", category: "support" },
  { q: "Comment annuler une course ?", a: "Pendant la recherche ou l'attente du chauffeur, appuyez sur 'Annuler'. Des frais de 200 F peuvent s'appliquer si le chauffeur est déjà en route.", category: "course" },
  { q: "Comment obtenir un remboursement ?", a: "Allez dans Historique > sélectionnez la course > Signaler un problème > Demande de remboursement. Notre équipe traitera votre demande sous 48h.", category: "paiement" },
  { q: "Comment modifier mes informations ?", a: "Allez dans Profil > Informations personnelles. Vous pouvez modifier votre nom, téléphone, email et photo de profil.", category: "compte" },
  { q: "Quels sont les modes de paiement ?", a: "IPPOO accepte : IPPOO Cash (portefeuille intégré), MTN Mobile Money, Moov Money, Celtiis Money, et paiement en espèces au chauffeur.", category: "paiement" },
];

const initialTickets: Ticket[] = [
  {
    id: 102, subject: "Facturation incorrecte", category: "Paiement", status: "resolved", statusLabel: "Résolu", statusColor: "bg-emerald-50 text-emerald-600", date: "08 Avr 2026",
    messages: [
      { from: "Vous", text: "J'ai été facturé 2x pour la course IPP-20260405.", date: "08 Avr 10:30" },
      { from: "Support", text: "Nous avons vérifié. Un remboursement de 1 200 F a été effectué sur votre IPPOO Cash.", date: "08 Avr 14:15" },
    ],
  },
  {
    id: 98, subject: "Chauffeur ne respecte pas le trajet", category: "Course", status: "in_progress", statusLabel: "En cours", statusColor: "bg-amber-50 text-amber-600", date: "05 Avr 2026",
    messages: [
      { from: "Vous", text: "Le chauffeur Sessinou K. a pris un trajet beaucoup plus long que prévu pour la course IPP-20260404.", date: "05 Avr 09:00" },
      { from: "Support", text: "Merci pour votre signalement. Nous examinons les données GPS du trajet. Réponse sous 24h.", date: "05 Avr 11:30" },
    ],
  },
];

const ticketCategories = ["Course", "Livraison", "Paiement", "Chauffeur", "Application", "Autre"];

/* ─── Enhanced Bot Intelligence ─── */
const botKnowledge: { keywords: string[]; response: string; followUp?: string[] }[] = [
  { keywords: ["bonjour", "salut", "hello", "bonsoir", "hey", "coucou"], response: "Bonjour ! Je suis l'assistant virtuel IPPOO. Comment puis-je vous aider aujourd'hui ?", followUp: ["Commander une course", "Problème de paiement", "Suivre ma livraison"] },
  { keywords: ["merci", "super", "parfait", "genial", "excellent"], response: "Je vous en prie ! Y a-t-il autre chose que je puisse faire pour vous ?", followUp: ["Non, c'est tout", "Oui, j'ai une question"] },
  { keywords: ["course", "commander", "réserver", "taxi", "moto", "voiture"], response: "Pour commander une course :\n\n1. Allez sur l'accueil\n2. Appuyez sur 'Taxi-Moto' ou 'Book Ride'\n3. Entrez votre point de départ et d'arrivée\n4. Choisissez le type de véhicule\n5. Confirmez et attendez votre chauffeur\n\nLe paiement se fait en fin de course.", followUp: ["Voir les tarifs", "Comment annuler ?"] },
  { keywords: ["prix", "tarif", "combien", "cout", "coût", "cher"], response: "Tarifs indicatifs :\n\n- Moto : 300 - 1 500 F\n- Voiture : 1 500 - 4 000 F\n- Minibus : 3 000 - 8 000 F\n\nLe prix exact dépend de la distance, l'heure et la demande. Un estimatif est toujours affiché avant confirmation.", followUp: ["Commander maintenant", "Promotions en cours"] },
  { keywords: ["paiement", "payer", "mobile money", "mtn", "moov", "celtiis", "argent"], response: "Modes de paiement acceptés :\n\n• IPPOO Cash (portefeuille intégré)\n• MTN Mobile Money\n• Moov Money\n• Celtiis Money\n• Espèces au chauffeur\n\nPour recharger votre IPPOO Cash : allez dans le portefeuille et sélectionnez 'Recharger'.", followUp: ["Recharger mon IPPOO Cash", "Problème de paiement"] },
  { keywords: ["remboursement", "rembourser", "rembourse"], response: "Pour un remboursement :\n\n1. Allez dans Historique\n2. Sélectionnez la course concernée\n3. Appuyez sur 'Signaler un problème'\n4. Choisissez 'Demande de remboursement'\n\nDélai de traitement : 24 à 48h.\nLe montant est crédité sur votre IPPOO Cash.", followUp: ["Créer un ticket", "Parler à un agent"] },
  { keywords: ["annuler", "annulation", "cancel"], response: "Pour annuler une course :\n\n• Pendant la recherche : gratuit\n• Chauffeur assigné mais pas encore en route : gratuit\n• Chauffeur en route : frais de 200 F\n• Après 5 min d'attente : 500 F\n\nAppuyez sur 'Annuler' dans l'écran de suivi.", followUp: ["Contester des frais", "Commander une course"] },
  { keywords: ["chauffeur", "conducteur", "driver", "pilote"], response: "Nos chauffeurs sont vérifiés et formés. Si vous avez un problème :\n\n- Notez le chauffeur après la course (1-5 étoiles)\n- Signalez un comportement depuis l'historique\n- Créez un ticket pour un problème grave\n\nToutes les plaintes sont traitées sous 24h.", followUp: ["Signaler un chauffeur", "Créer un ticket"] },
  { keywords: ["livraison", "colis", "paquet", "livrer", "delivery"], response: "Service de livraison IPPOO :\n\n• Documents : 500 - 1 000 F\n• Petit colis (< 5 kg) : 800 - 2 000 F\n• Colis moyen (5-15 kg) : 1 500 - 3 500 F\n• Gros colis : sur devis\n\nSuivi en temps réel disponible. Le livreur peut être contacté directement.", followUp: ["Envoyer un colis", "Suivre ma livraison"] },
  { keywords: ["suivi", "suivre", "tracker", "localiser", "position", "où est", "ou est"], response: "Pour suivre votre course ou livraison :\n\n1. Allez dans 'Historique'\n2. Sélectionnez la course/livraison en cours\n3. La carte s'affiche avec la position en temps réel\n\nVous recevez aussi des notifications à chaque étape.", followUp: ["Ouvrir l'historique", "Contacter le chauffeur"] },
  { keywords: ["compte", "profil", "modifier", "changer", "information"], response: "Pour modifier votre profil :\n\nAllez dans Profil > Informations personnelles\n\nVous pouvez modifier :\n• Nom et prénom\n• Numéro de téléphone\n• Email\n• Type de compte\n• Photo de profil", followUp: ["Supprimer mon compte", "Changer de numéro"] },
  { keywords: ["promo", "promotion", "code", "réduction", "coupon", "offre"], response: "Promotions actuelles :\n\n• 1ère course gratuite (max 2 000 F)\n• -50% étudiants sur les trajets campus\n• CANAL+ x IPPOO : 10 courses = 1 mois offert\n• MTN MoMo : 10% cashback\n\nConsultez la section 'Coupons' pour plus de détails.", followUp: ["Voir les coupons", "Appliquer un code promo"] },
  { keywords: ["urgence", "accident", "danger", "police", "secours", "aide urgente"], response: "En cas d'urgence :\n\nAppelez le +229 21 00 00 00 (Support IPPOO)\nPolice : 117\nPompiers : 118\nSAMU : 115\n\nVotre sécurité est notre priorité. Le bouton SOS est disponible pendant chaque course.", followUp: ["Appeler le support", "Signaler un incident"] },
  { keywords: ["agent", "humain", "personne", "conseiller", "parler"], response: "Je vais vous mettre en relation avec un agent du support IPPOO. Veuillez patienter un instant...", followUp: [] },
  { keywords: ["non", "c'est tout", "rien", "au revoir", "bye", "à bientôt"], response: "Merci d'avoir utilisé l'assistant IPPOO ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !" },
  { keywords: ["covoiturage", "partager", "trajet partagé"], response: "Covoiturage IPPOO :\n\n• Économisez jusqu'à 60% sur vos trajets\n• Trajets inter-villes disponibles\n• Proposez ou rejoignez un trajet\n\nAllez dans 'Covoiturage' depuis l'accueil pour commencer.", followUp: ["Proposer un trajet", "Rechercher un covoiturage"] },
  { keywords: ["groupé", "commande groupée", "groupe"], response: "Commandes groupées :\n\nIdéal pour les entreprises et associations :\n• Planifiez plusieurs courses à l'avance\n• Tarifs dégressifs (-15% à partir de 5 courses)\n• Facturation centralisée\n\nAccédez via 'Commandes groupées' sur l'accueil.", followUp: ["En savoir plus", "Contacter le commercial"] },
];

const EMOJIS: string[] = [];

/* ─── Component ─── */
export function SupportPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"main" | "chat" | "tickets" | "newTicket" | "ticketDetail" | "faq">("main");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");

  // Chat
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, from: "bot", text: "Bonjour ! Je suis l'assistant virtuel IPPOO. Comment puis-je vous aider aujourd'hui ? Vous pouvez écrire votre question ou choisir un sujet rapide ci-dessous.", time: formatTime(), helpful: null },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const recordRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(["Commander une course", "Problème de paiement", "Suivre ma livraison", "Promotions en cours"]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatRated, setChatRated] = useState(false);
  const [onlineStatus] = useState<"online" | "away">("online");

  // Tickets
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReply, setTicketReply] = useState("");

  // New ticket
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");

  function formatTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }

  // Auto-scroll
  useEffect(() => {
    if (!showScrollBtn) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showScrollBtn]);

  // Scroll detection
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!atBottom);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // Message status progression
  const progressStatus = useCallback((msgId: number) => {
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "sent" } : m)), 400);
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "delivered" } : m)), 1200);
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "read" } : m)), 2500);
  }, []);

  // Bot reply engine
  const getBotReply = (msg: string): { response: string; followUp?: string[]; isAgentRequest: boolean } => {
    const lower = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const item of botKnowledge) {
      if (item.keywords.some(k => lower.includes(k))) {
        const isAgent = item.keywords.includes("agent");
        return { response: item.response, followUp: item.followUp, isAgentRequest: isAgent };
      }
    }
    return {
      response: "Je ne suis pas sûr de comprendre votre demande. 🤔 Pourriez-vous reformuler ou choisir un sujet ci-dessous ? Si besoin, je peux vous mettre en relation avec un agent humain.",
      followUp: ["Parler à un agent", "Questions fréquentes", "Commander une course"],
      isAgentRequest: false,
    };
  };

  // Send message
  const sendChat = (text?: string) => {
    const content = text || chatMsg.trim();
    if (!content) return;

    const msgId = Date.now();
    const userMsg: ChatMessage = {
      id: msgId, from: "user", text: content, time: formatTime(), status: "sending",
      ...(replyingTo ? { replyTo: { from: replyingTo.from === "bot" ? "Assistant" : replyingTo.from === "agent" ? "Ablawa" : "Vous", text: replyingTo.text.slice(0, 60) } } : {}),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatMsg("");
    setReplyingTo(null);
    setShowEmoji(false);
    setShowAttach(false);
    progressStatus(msgId);

    // Bot or agent reply
    setIsTyping(true);
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      if (agentConnected) {
        // Agent response
        const agentReplies = [
          "Je comprends votre situation. Laissez-moi vérifier cela dans notre système...",
          "D'accord, je vais vous aider avec ça. Un instant s'il vous plaît.",
          "Merci pour ces précisions. J'ai trouvé les informations nécessaires.",
          "Très bien, je transmets votre demande au service concerné. Vous recevrez une notification.",
          "Le problème a été identifié. Voici ce que nous pouvons faire pour vous :",
        ];
        const reply = agentReplies[Math.floor(Math.random() * agentReplies.length)];
        setMessages(prev => [...prev, { id: Date.now(), from: "agent", text: reply, time: formatTime() }]);
        setDynamicSuggestions(["Merci beaucoup", "J'ai une autre question", "C'est résolu"]);
      } else {
        const { response, followUp, isAgentRequest } = getBotReply(content);
        setMessages(prev => [...prev, { id: Date.now(), from: "bot", text: response, time: formatTime(), helpful: null }]);
        if (followUp && followUp.length > 0) setDynamicSuggestions(followUp);
        if (isAgentRequest) {
          setTimeout(() => requestAgent(), 1500);
        }
      }
      setIsTyping(false);
    }, delay);
  };

  // Agent connection
  const requestAgent = () => {
    if (agentConnected) return;
    setIsTyping(true);
    setMessages(prev => [...prev, { id: Date.now(), from: "system", text: "Connexion avec un agent en cours...", time: formatTime() }]);
    setTimeout(() => {
      setAgentConnected(true);
      setMessages(prev => [...prev, {
        id: Date.now(), from: "agent",
        text: "Bonjour, je suis Ablawa du support IPPOO ! 😊 J'ai lu votre conversation avec l'assistant. Comment puis-je vous aider ?",
        time: formatTime(),
      }]);
      setIsTyping(false);
      setDynamicSuggestions(["Expliquer mon problème", "Demander un remboursement", "Signaler un chauffeur"]);
      toast.success("Agent connecté", { description: "Ablawa du support est maintenant en ligne" });
    }, 2500);
  };

  // Voice recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordTime(0);
    recordRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    toast("🎙 Enregistrement en cours...", { description: "Maintenez et relâchez pour envoyer" });
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordRef.current) clearInterval(recordRef.current);
    if (recordTime < 1) { toast.error("Message trop court"); return; }
    const msgId = Date.now();
    const userMsg: ChatMessage = {
      id: msgId, from: "user", text: "🎤 Message vocal", time: formatTime(), status: "sending",
      attachment: { type: "voice", duration: recordTime },
    };
    setMessages(prev => [...prev, userMsg]);
    progressStatus(msgId);
    setRecordTime(0);

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(), from: agentConnected ? "agent" : "bot",
        text: agentConnected
          ? "J'ai bien reçu votre message vocal. Je l'écoute et vous réponds tout de suite."
          : "J'ai bien reçu votre message vocal. Malheureusement, je ne peux pas traiter l'audio. Pourriez-vous écrire votre question ? Ou je peux vous connecter à un agent.",
        time: formatTime(), helpful: null,
      }]);
      setIsTyping(false);
      if (!agentConnected) setDynamicSuggestions(["Écrire ma question", "Parler à un agent"]);
    }, 1500);
  };

  // Attachments
  const sendAttachment = (type: "image" | "location") => {
    const msgId = Date.now();
    const attach: ChatMessage["attachment"] = type === "image"
      ? { type: "image", label: "Photo envoyée" }
      : { type: "location", label: "Cotonou, Carrefour Cadjehoun" };
    const userMsg: ChatMessage = {
      id: msgId, from: "user",
      text: type === "image" ? "Photo jointe" : "Ma position actuelle",
      time: formatTime(), status: "sending", attachment: attach,
    };
    setMessages(prev => [...prev, userMsg]);
    setShowAttach(false);
    progressStatus(msgId);

    setIsTyping(true);
    setTimeout(() => {
      const reply = type === "image"
        ? "Merci pour la photo ! Je la transmets à notre équipe pour analyse. Un agent pourra vous répondre avec plus de détails."
        : "J'ai bien reçu votre position, Cotonou, Carrefour Cadjehoun. Comment puis-je vous aider dans cette zone ?";
      setMessages(prev => [...prev, { id: Date.now(), from: agentConnected ? "agent" : "bot", text: reply, time: formatTime(), helpful: null }]);
      setIsTyping(false);
    }, 1500);
  };

  // Reactions
  const addReaction = (msgId: number, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions || [];
      return { ...m, reactions: reactions.includes(emoji) ? reactions.filter(r => r !== emoji) : [...reactions, emoji] };
    }));
  };

  const markHelpful = (id: number, helpful: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, helpful } : m));
    toast.success(helpful ? "Merci pour votre retour ! 👍" : "Nous allons améliorer notre réponse");
  };

  // Delete message
  const deleteMessage = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    toast("Message supprimé");
  };

  // Ticket handlers
  const handleNewTicket = () => {
    if (!newTicketSubject.trim()) { toast.error("Entrez un sujet"); return; }
    if (!newTicketCategory) { toast.error("Sélectionnez une catégorie"); return; }
    if (!newTicketDesc.trim()) { toast.error("Décrivez votre problème"); return; }
    const ticket: Ticket = {
      id: Date.now() % 10000, subject: newTicketSubject, category: newTicketCategory,
      status: "open", statusLabel: "Ouvert", statusColor: "bg-blue-50 text-blue-600", date: "11 Avr 2026",
      messages: [{ from: "Vous", text: newTicketDesc, date: "11 Avr " + formatTime() }],
    };
    setTickets(prev => [ticket, ...prev]);
    setNewTicketSubject(""); setNewTicketCategory(""); setNewTicketDesc("");
    setView("tickets");
    toast.success("Ticket créé", { description: `#${ticket.id} - ${newTicketSubject}` });
  };

  const handleTicketReply = () => {
    if (!ticketReply.trim() || !selectedTicket) return;
    const updated = { ...selectedTicket, messages: [...selectedTicket.messages, { from: "Vous", text: ticketReply, date: "11 Avr " + formatTime() }] };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setTicketReply("");
    toast.success("Message envoyé");
    setTimeout(() => {
      const agentReplies = [
        "Merci pour ces informations complémentaires. Je traite votre demande en priorité.",
        "Bien reçu. Un spécialiste va examiner votre cas et vous revenir rapidement.",
        "Votre message a été transmis à l'équipe technique. Nous vous tiendrons informé(e).",
      ];
      const autoReply = { from: "Support", text: agentReplies[Math.floor(Math.random() * agentReplies.length)], date: "11 Avr " + formatTime() };
      const withReply = { ...updated, messages: [...updated.messages, autoReply] };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? withReply : t));
      setSelectedTicket(withReply);
    }, 3000);
  };

  const filteredFaq = faqSearch
    ? faqItems.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : faqItems;

  // Clear chat
  const clearChat = () => {
    setMessages([{ id: Date.now(), from: "bot", text: "Conversation réinitialisée. Comment puis-je vous aider ? 😊", time: formatTime(), helpful: null }]);
    setAgentConnected(false);
    setChatRated(false);
    setDynamicSuggestions(["Commander une course", "Problème de paiement", "Suivre ma livraison", "Promotions en cours"]);
    toast("Conversation réinitialisée");
  };

  /* ─── Status icon ─── */
  const StatusIcon = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "sending") return <Clock className="w-3 h-3 text-white/40" />;
    if (status === "sent") return <Check className="w-3 h-3 text-white/50" />;
    if (status === "delivered") return <CheckCheck className="w-3 h-3 text-white/50" />;
    if (status === "read") return <CheckCheck className="w-3 h-3 text-[#2A9D8F]" />;
    return null;
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="relative bg-amber-500 px-5 pt-14 pb-6 overflow-hidden rounded-b-[2rem] shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => view === "main" ? navigate(-1) : setView("main")} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15 active:scale-90 transition">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h2 className="text-white">
              {view === "main" && "Support & Aide"}
              {view === "chat" && (agentConnected ? "Ablawa · Support" : "Assistant IPPOO")}
              {view === "tickets" && "Mes tickets"}
              {view === "newTicket" && "Nouveau ticket"}
              {view === "ticketDetail" && `Ticket #${selectedTicket?.id}`}
              {view === "faq" && "Questions fréquentes"}
            </h2>
            <div className="flex items-center gap-1.5">
              {view === "chat" && (
                <span className={`w-2 h-2 rounded-full ${agentConnected ? "bg-emerald-400" : onlineStatus === "online" ? "bg-emerald-400" : "bg-amber-400"} shadow-sm`} />
              )}
              <p className="text-amber-100 text-xs">
                {view === "main" && "Nous sommes là pour vous aider"}
                {view === "chat" && (agentConnected ? "En ligne · Répond en ~2 min" : "En ligne · Réponse instantanée")}
                {view === "tickets" && `${tickets.length} ticket${tickets.length > 1 ? "s" : ""}`}
                {view === "newTicket" && "Décrivez votre problème"}
                {view === "ticketDetail" && selectedTicket?.statusLabel}
                {view === "faq" && `${faqItems.length} articles`}
              </p>
            </div>
          </div>
          {view === "chat" && (
            <div className="flex gap-2">
              <button onClick={clearChat} className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/15 active:scale-90 transition">
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
              {!agentConnected && (
                <button onClick={requestAgent} className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/15 active:scale-90 transition">
                  <Headphones className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN VIEW ═══ */}
      {view === "main" && (
        <div className="px-5 py-5 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageSquare, label: "Chat support", desc: "Réponse instantanée", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", action: () => setView("chat") },
              { icon: Phone, label: "Appel urgence", desc: "+229 21 00 00 00", gradient: "from-rose-400 to-red-500", shadow: "shadow-red-500/20", action: () => { window.location.href = "tel:+22921000000"; } },
              { icon: AlertTriangle, label: "Signaler", desc: "Créer un ticket", gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-500/20", action: () => setView("newTicket") },
              { icon: FileText, label: "Mes tickets", desc: `${tickets.length} tickets`, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20", action: () => setView("tickets") },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition text-left">
                <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg ${item.shadow} shrink-0`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* FAQ preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <h3 className="text-slate-800">Questions fréquentes</h3>
              </div>
              <button onClick={() => setView("faq")} className="text-xs text-blue-500 flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {faqItems.slice(0, 4).map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-slate-50 transition">
                    <span className="text-sm text-left text-slate-700">{item.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-600 leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tickets preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-800">Tickets récents</h3>
              <button onClick={() => setView("newTicket")} className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Plus className="w-3 h-3" /> Nouveau
              </button>
            </div>
            <div className="space-y-2.5">
              {tickets.slice(0, 2).map(t => (
                <button key={t.id} onClick={() => { setSelectedTicket(t); setView("ticketDetail"); }}
                  className="w-full bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between shadow-sm active:bg-slate-50 transition text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">#{t.id} - {t.subject}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.category} · {t.date}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 ml-2 ${t.statusColor}`}>{t.statusLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Horaires du support</p>
            <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Lun-Sam : 07h00 - 22h00</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
              <Phone className="w-4 h-4 text-slate-400" />
              <a href="tel:+22921000000" className="text-[#1E6091] underline">+229 21 00 00 00</a>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <a href="mailto:support@ippoo.app" className="text-[#1E6091] underline">support@ippoo.app</a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHAT VIEW ═══ */}
      {view === "chat" && (
        <div className="flex flex-col flex-1 relative">
          {/* Chat messages */}
          <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {/* Date separator */}
            <div className="flex items-center justify-center">
              <span className="text-[10px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Aujourd'hui</span>
            </div>

            {messages.map((m) => (
              <div key={m.id}>
                {/* System messages */}
                {m.from === "system" && (
                  <div className="flex justify-center">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{m.text}</span>
                  </div>
                )}

                {m.from !== "system" && (
                  <div className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
                    {/* Avatar for bot/agent */}
                    {m.from !== "user" && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                        m.from === "agent" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}>
                        {m.from === "agent" ? <Headphones className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                    )}

                    <div className="max-w-[75%]">
                      {/* Sender name */}
                      {m.from !== "user" && (
                        <p className="text-[10px] text-slate-400 mb-0.5 ml-1">
                          {m.from === "agent" ? "Ablawa · Support" : "Assistant IPPOO"}
                        </p>
                      )}

                      {/* Reply reference */}
                      {m.replyTo && (
                        <div className={`text-[10px] px-3 py-1.5 rounded-t-xl mb-0 border-l-2 ${
                          m.from === "user" ? "bg-white/10 border-white/30 text-white/60" : "bg-slate-100 border-slate-300 text-slate-400"
                        }`}>
                          ↩ {m.replyTo.from}: {m.replyTo.text}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-4 py-3 text-sm whitespace-pre-line ${
                          m.from === "user"
                            ? "bg-gradient-to-br from-[#1E6091] to-[#1E6091]/85 text-white rounded-2xl rounded-br-md shadow-lg shadow-[#1E6091]/20"
                            : m.from === "agent"
                            ? "bg-white border border-amber-200 text-slate-700 rounded-2xl rounded-bl-md shadow-sm"
                            : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-bl-md shadow-sm"
                        }`}
                        onDoubleClick={() => m.from !== "user" && addReaction(m.id, "❤️")}
                      >
                        {/* Voice attachment */}
                        {m.attachment?.type === "voice" && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.from === "user" ? "bg-white/20" : "bg-blue-50"}`}>
                              <Volume2 className={`w-4 h-4 ${m.from === "user" ? "text-white" : "text-blue-500"}`} />
                            </div>
                            <div className="flex-1">
                              <div className={`flex gap-0.5 items-center h-4 ${m.from === "user" ? "opacity-70" : ""}`}>
                                {Array.from({ length: 24 }).map((_, i) => (
                                  <div key={i} className={`w-1 rounded-full ${m.from === "user" ? "bg-white/60" : "bg-blue-400/50"}`}
                                    style={{ height: `${4 + Math.random() * 12}px` }} />
                                ))}
                              </div>
                            </div>
                            <span className={`text-[10px] ${m.from === "user" ? "text-white/60" : "text-slate-400"}`}>
                              {Math.floor((m.attachment.duration || 0) / 60)}:{((m.attachment.duration || 0) % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        )}

                        {/* Image attachment */}
                        {m.attachment?.type === "image" && (
                          <div className={`flex items-center gap-2 mb-1.5 px-3 py-2 rounded-xl ${m.from === "user" ? "bg-white/10" : "bg-blue-50"}`}>
                            <Image className={`w-5 h-5 ${m.from === "user" ? "text-white/70" : "text-blue-400"}`} />
                            <span className={`text-xs ${m.from === "user" ? "text-white/70" : "text-blue-500"}`}>Photo jointe</span>
                          </div>
                        )}

                        {/* Location attachment */}
                        {m.attachment?.type === "location" && (
                          <div className={`flex items-center gap-2 mb-1.5 px-3 py-2 rounded-xl ${m.from === "user" ? "bg-white/10" : "bg-blue-50"}`}>
                            <MapPin className={`w-5 h-5 ${m.from === "user" ? "text-white/70" : "text-blue-400"}`} />
                            <span className={`text-xs ${m.from === "user" ? "text-white/70" : "text-blue-500"}`}>{m.attachment.label}</span>
                          </div>
                        )}

                        {m.text}

                        {/* Time + status */}
                        <div className={`flex items-center gap-1 mt-1 ${m.from === "user" ? "justify-end" : ""}`}>
                          <p className={`text-[9px] ${m.from === "user" ? "text-white/50" : "text-slate-400"}`}>{m.time}</p>
                          {m.from === "user" && <StatusIcon status={m.status} />}
                        </div>
                      </div>

                      {/* Reactions */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className={`flex gap-1 mt-1 ${m.from === "user" ? "justify-end" : ""}`}>
                          {m.reactions.map((r, i) => (
                            <button key={i} onClick={() => addReaction(m.id, r)} className="text-sm bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm hover:scale-110 transition">
                              {r}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action buttons for bot messages */}
                      {m.from === "bot" && m.helpful === null && m.id !== 1 && (
                        <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                          <span className="text-[10px] text-slate-400">Utile ?</span>
                          <button onClick={() => markHelpful(m.id, true)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-slate-100 active:bg-emerald-50 transition hover:border-emerald-300">
                            <ThumbsUp className="w-3 h-3 text-slate-400" />
                          </button>
                          <button onClick={() => markHelpful(m.id, false)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-slate-100 active:bg-red-50 transition hover:border-red-300">
                            <ThumbsDown className="w-3 h-3 text-slate-400" />
                          </button>
                          <button onClick={() => setReplyingTo(m)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-slate-100 active:bg-blue-50 transition">
                            <RotateCcw className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      )}
                      {m.from === "bot" && m.helpful !== null && (
                        <p className="text-[10px] text-slate-300 mt-1 ml-1 flex items-center gap-1">
                          {m.helpful ? <span>Merci !</span> : <span>Nous allons améliorer</span>}
                        </p>
                      )}

                      {/* User message actions */}
                      {m.from === "user" && (
                        <div className="flex justify-end gap-1 mt-1">
                          <button onClick={() => deleteMessage(m.id)} className="opacity-0 hover:opacity-100 w-5 h-5 flex items-center justify-center transition">
                            <Trash2 className="w-3 h-3 text-slate-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  agentConnected ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}>
                  {agentConnected ? <Headphones className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button onClick={scrollToBottom} className="absolute bottom-44 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center active:scale-90 transition z-20">
              <ArrowDown className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* Dynamic suggestions */}
          <div className="px-3 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-slate-100 bg-white">
            {dynamicSuggestions.map(topic => (
              <button key={topic} onClick={() => sendChat(topic)}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap shrink-0 active:bg-slate-100 active:scale-95 transition">
                {topic}
              </button>
            ))}
            {!agentConnected && (
              <button onClick={requestAgent}
                className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap shrink-0 active:bg-amber-100 flex items-center gap-1">
                <Headphones className="w-3 h-3" /> Agent
              </button>
            )}
          </div>

          {/* Reply preview */}
          {replyingTo && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2 shrink-0">
              <div className="flex-1 min-w-0 border-l-2 border-blue-400 pl-2">
                <p className="text-[10px] text-blue-500">{replyingTo.from === "bot" ? "Assistant" : "Ablawa"}</p>
                <p className="text-[11px] text-slate-600 truncate">{replyingTo.text.slice(0, 60)}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="w-6 h-6 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Emoji picker */}
          {showEmoji && (
            <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => setChatMsg(prev => prev + emoji)}
                    className="w-9 h-9 text-lg flex items-center justify-center rounded-lg hover:bg-slate-50 active:scale-90 transition">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachment menu */}
          {showAttach && (
            <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-4 justify-center">
                {[
                  { icon: Camera, label: "Photo", color: "from-blue-500 to-indigo-600", action: () => sendAttachment("image") },
                  { icon: Image, label: "Galerie", color: "from-violet-500 to-purple-600", action: () => sendAttachment("image") },
                  { icon: MapPin, label: "Position", color: "from-emerald-500 to-green-600", action: () => sendAttachment("location") },
                  { icon: FileText, label: "Document", color: "from-orange-400 to-amber-500", action: () => { toast("📄 Sélection de document..."); setShowAttach(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1.5 active:scale-90 transition">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-500">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recording bar */}
          {isRecording && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-1 bg-red-400/60 rounded-full animate-pulse" style={{ height: `${4 + Math.random() * 16}px`, animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              </div>
              <span className="text-sm text-red-600 tabular-nums" style={{ fontFamily: "Space Grotesk, monospace" }}>
                {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, "0")}
              </span>
              <button onClick={() => { setIsRecording(false); if (recordRef.current) clearInterval(recordRef.current); setRecordTime(0); }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-red-200 active:scale-90">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <button onClick={stopRecording}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Input bar */}
          {!isRecording && (
            <div className="px-3 py-2.5 flex items-end gap-2 shrink-0 bg-white border-t border-slate-100">
              <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shrink-0 ${showAttach ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-400"}`}>
                <Plus className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-[#1E6091]/50 transition overflow-hidden">
                <input
                  ref={inputRef}
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  onFocus={() => { setShowEmoji(false); setShowAttach(false); }}
                  placeholder={agentConnected ? "Écrire à Ablawa..." : "Écrire un message..."}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none min-w-0"
                />
                <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }}
                  className={`px-2 py-2.5 transition ${showEmoji ? "text-amber-500" : "text-slate-400"}`}>
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              {chatMsg.trim() ? (
                <button onClick={() => sendChat()}
                  className="w-10 h-10 bg-gradient-to-br from-[#1E6091] to-[#1E6091]/85 rounded-2xl flex items-center justify-center shadow-lg shadow-[#1E6091]/25 active:scale-90 transition shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 active:bg-red-50 active:border-red-300 transition shrink-0">
                  <Mic className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          )}

          {/* Chat rating */}
          {!chatRated && messages.length > 5 && !isRecording && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-blue-700">Notez cette conversation</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => { setChatRated(true); toast.success(`Merci pour votre note de ${s}/5 !`); }}
                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-blue-200 active:scale-90 hover:bg-amber-50 transition">
                    <Star className="w-4 h-4 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ FAQ VIEW ═══ */}
      {view === "faq" && (
        <div className="px-5 py-5 flex-1 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100 focus-within:border-blue-400 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input placeholder="Rechercher dans la FAQ..." value={faqSearch} onChange={e => setFaqSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" />
            {faqSearch && <button onClick={() => setFaqSearch("")}><X className="w-4 h-4 text-slate-300" /></button>}
          </div>
          {filteredFaq.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucun résultat pour "{faqSearch}"</p>
              <button onClick={() => setView("chat")} className="text-xs text-blue-500 mt-2">Poser la question au chat</button>
            </div>
          )}
          <div className="space-y-2">
            {filteredFaq.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-slate-50 transition">
                  <span className="text-sm text-left text-slate-700 flex-1">{item.q}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full">{item.category}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 leading-relaxed">{item.a}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard?.writeText(`${item.q}\n${item.a}`); toast.success("Copié !"); }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 px-1">
                      <Copy className="w-3 h-3" /> Copier la réponse
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TICKETS LIST ═══ */}
      {view === "tickets" && (
        <div className="px-5 py-5 flex-1 space-y-4">
          <button onClick={() => setView("newTicket")}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3.5 rounded-2xl shadow-lg shadow-orange-400/25 active:scale-[0.98] transition">
            <Plus className="w-4 h-4" /> Créer un nouveau ticket
          </button>
          {tickets.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucun ticket</p>
            </div>
          )}
          <div className="space-y-2.5">
            {tickets.map(t => (
              <button key={t.id} onClick={() => { setSelectedTicket(t); setView("ticketDetail"); }}
                className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:bg-slate-50 transition text-left">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-800">#{t.id} - {t.subject}</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full ${t.statusColor}`}>{t.statusLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{t.category}</span>
                  <span>{t.date}</span>
                  <span>{t.messages.length} message{t.messages.length > 1 ? "s" : ""}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ NEW TICKET ═══ */}
      {view === "newTicket" && (
        <div className="px-5 py-5 flex-1 space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">Sujet</label>
            <input value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} placeholder="Décrivez brièvement le problème"
              className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-100 outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {ticketCategories.map(cat => (
                <button key={cat} onClick={() => setNewTicketCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs transition border-2 ${newTicketCategory === cat ? "border-orange-400 bg-orange-50 text-orange-600" : "border-slate-100 text-slate-500 bg-white"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={newTicketDesc} onChange={e => setNewTicketDesc(e.target.value)} placeholder="Donnez-nous le maximum de détails : numéro de course, date, montant..."
              rows={4} className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 text-sm border border-slate-100 outline-none focus:border-orange-400 resize-none" />
          </div>
          <button onClick={handleNewTicket}
            className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3.5 rounded-2xl shadow-lg shadow-orange-400/25 active:scale-[0.98] transition flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Envoyer le ticket
          </button>
        </div>
      )}

      {/* ═══ TICKET DETAIL ═══ */}
      {view === "ticketDetail" && selectedTicket && (
        <div className="flex flex-col flex-1">
          <div className="px-5 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-slate-800">{selectedTicket.subject}</p>
              <span className={`text-[10px] px-2.5 py-1 rounded-full ${selectedTicket.statusColor}`}>{selectedTicket.statusLabel}</span>
            </div>
            <p className="text-[10px] text-slate-400">{selectedTicket.category} · {selectedTicket.date} · #{selectedTicket.id}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
            {selectedTicket.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "Vous" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.from !== "Vous" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-1">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 text-sm rounded-2xl ${
                  msg.from === "Vous"
                    ? "bg-gradient-to-br from-[#1E6091] to-[#1E6091]/85 text-white rounded-br-md shadow-lg shadow-[#1E6091]/20"
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"
                }`}>
                  {msg.from !== "Vous" && <p className="text-[10px] text-slate-400 mb-1">{msg.from}</p>}
                  {msg.text}
                  <p className={`text-[9px] mt-1 ${msg.from === "Vous" ? "text-white/50" : "text-slate-400"}`}>{msg.date}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedTicket.status !== "closed" && (
            <div className="px-4 py-2.5 flex gap-2 shrink-0 bg-white border-t border-slate-100">
              <input value={ticketReply} onChange={e => setTicketReply(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTicketReply()}
                placeholder="Répondre..." className="flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 text-sm outline-none border border-slate-200 focus:border-[#1E6091]/50" />
              <button onClick={handleTicketReply}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${ticketReply.trim() ? "bg-gradient-to-br from-[#1E6091] to-[#1E6091]/85 shadow-lg shadow-[#1E6091]/20" : "bg-slate-100"}`}>
                <Send className={`w-4 h-4 ${ticketReply.trim() ? "text-white" : "text-slate-400"}`} />
              </button>
            </div>
          )}

          {selectedTicket.status === "resolved" && (
            <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700">Ticket résolu</span>
              </div>
              <button onClick={() => {
                const updated = { ...selectedTicket, status: "closed" as const, statusLabel: "Fermé", statusColor: "bg-slate-100 text-slate-500" };
                setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
                setSelectedTicket(updated);
                toast.success("Ticket fermé");
              }} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">
                Fermer le ticket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
