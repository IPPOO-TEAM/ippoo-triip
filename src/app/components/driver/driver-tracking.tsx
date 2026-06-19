import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Phone, MessageSquare, Share2, Star, Navigation, MapPin,
  X, Send, Shield, AlertTriangle, Clock, Check, ChevronRight,
  Wallet, Camera, Flag, Copy, CheckCircle2, Route, Bike,
  PhoneOff, CornerDownRight, Package, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import { getAvatar } from "../avatars";
import { TrackingMap } from "../tracking-map";
import { generateOTP } from "../utils";

type RideState = "en_route_pickup" | "at_pickup" | "waiting_otp" | "in_progress" | "near_dest" | "completed";

interface ChatMsg {
  id: number;
  from: "driver" | "client";
  text: string;
  time: string;
}

const clientReplies = [
  "D'accord, je suis devant l'entree",
  "OK je descends tout de suite",
  "Merci, a quelle distance etes-vous ?",
  "Je suis en chemise bleue",
  "C'est bien note, merci !",
  "Parfait j'arrive",
];

function StatusBadge({ color, text, pulse = false }: { color: string; text: string; pulse?: boolean }) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
  };
  return (
    <div className={`px-3 py-1.5 rounded-full text-[10px] tracking-wide border shadow-sm flex items-center gap-1.5 ${styles[color]}`}>
      {pulse && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      {text}
    </div>
  );
}

export function DriverTrackingPage() {
  const navigate = useNavigate();
  const [rideState, setRideState] = useState<RideState>("en_route_pickup");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 1, from: "client", text: "Bonjour, je suis devant la pharmacie", time: "12:06" },
  ]);
  const [msgInput, setMsgInput] = useState("");
  const [eta, setEta] = useState(4);
  const [earning, setEarning] = useState(950);
  const [otp] = useState(generateOTP());
  const [otpInput, setOtpInput] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const client = {
    name: "Gbètoho Bokossa",
    initials: "GB",
    rating: 4.8,
    phone: "+229 97 65 43 21",
    ridesWithYou: 3,
  };

  const rideInfo = {
    id: "IPP-M-20260411-001",
    type: "Course moto",
    from: "Carrefour Cadjehoun",
    to: "Hopital CNHU",
    distance: "3.1 km",
  };

  useEffect(() => {
    if (rideState === "completed") return;
    const timer = setInterval(() => {
      setEta(prev => (prev > 0 ? prev - 1 : 0));
    }, 15000);
    return () => clearInterval(timer);
  }, [rideState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setChatMessages(prev => [...prev, { id: prev.length + 1, from: "driver", text: msgInput, time }]);
    setMsgInput("");
    setTimeout(() => {
      const reply = clientReplies[Math.floor(Math.random() * clientReplies.length)];
      const t = new Date();
      setChatMessages(prev => [...prev, { id: prev.length + 1, from: "client", text: reply, time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` }]);
    }, 2000 + Math.random() * 3000);
  };

  const advanceState = () => {
    const flow: RideState[] = ["en_route_pickup", "at_pickup", "waiting_otp", "in_progress", "near_dest", "completed"];
    const idx = flow.indexOf(rideState);
    if (idx < flow.length - 1) {
      const next = flow[idx + 1];
      if (next === "waiting_otp") {
        // skip if no OTP needed
      }
      setRideState(next);
      if (next === "completed") setShowComplete(true);
    }
  };

  const validateOtp = () => {
    if (otpInput === otp || otpInput.length === 6) {
      toast.success("Code OTP valide !");
      setRideState("in_progress");
    } else {
      toast.error("Code incorrect");
    }
  };

  const stateConfig: Record<RideState, { color: string; label: string; action: string; actionColor: string }> = {
    en_route_pickup: { color: "blue", label: "En route vers le client", action: "Je suis arrive", actionColor: "bg-[#1E6091]" },
    at_pickup: { color: "amber", label: "Au point de prise en charge", action: "Verifier OTP", actionColor: "bg-[#F77F00]" },
    waiting_otp: { color: "amber", label: "En attente du code OTP", action: "Valider OTP", actionColor: "bg-[#F77F00]" },
    in_progress: { color: "green", label: "Course en cours", action: "Proche destination", actionColor: "bg-[#2A9D8F]" },
    near_dest: { color: "orange", label: "Proche de la destination", action: "Terminer la course", actionColor: "bg-[#2A9D8F]" },
    completed: { color: "green", label: "Course terminee", action: "", actionColor: "" },
  };

  const config = stateConfig[rideState];

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh" }}>
      {/* Map */}
      <div className="flex-1 relative">
        <TrackingMap />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 pt-12 px-5 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <StatusBadge color={config.color} text={config.label} pulse={rideState !== "completed"} />
            <button onClick={() => setShowEmergency(true)} className="w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* ETA bubble */}
        {rideState !== "completed" && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E6091]" />
            <span className="text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>~{eta} min</span>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-white rounded-t-3xl shadow-2xl -mt-6 relative z-20 p-5 pb-8 max-h-[55vh] overflow-y-auto">
        {/* Ride info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-800 text-xs">{rideInfo.type}</p>
            <p className="text-slate-400 text-[9px]">{rideInfo.id}</p>
          </div>
          <span className="text-[#2A9D8F] text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{earning} F</span>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 mb-4 px-1">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3 h-3 rounded-full bg-[#2A9D8F]" />
            <div className="w-px h-6 bg-slate-200" />
            <div className="w-3 h-3 rounded-full bg-[#F77F00]" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-slate-400 text-[8px]">PRISE EN CHARGE</p>
              <p className="text-slate-700 text-[11px]">{rideInfo.from}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[8px]">DESTINATION</p>
              <p className="text-slate-700 text-[11px]">{rideInfo.to}</p>
            </div>
          </div>
          <span className="text-slate-400 text-[10px]">{rideInfo.distance}</span>
        </div>

        {/* Client card */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 mb-4">
          <ProfileAvatar initials={client.initials} size={44} />
          <div className="flex-1">
            <p className="text-slate-700 text-xs">{client.name}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                <span className="text-slate-500">{client.rating}</span>
              </div>
              <span className="text-slate-300">-</span>
              <span className="text-slate-400">{client.ridesWithYou} courses ensemble</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`tel:${client.phone}`)}
              className="w-10 h-10 rounded-xl bg-[#1E6091]/10 flex items-center justify-center"
            >
              <Phone className="w-4 h-4 text-[#1E6091]" />
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 flex items-center justify-center"
            >
              <MessageSquare className="w-4 h-4 text-[#2A9D8F]" />
            </button>
          </div>
        </div>

        {/* OTP Section */}
        {(rideState === "at_pickup" || rideState === "waiting_otp") && (
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-amber-700 text-xs mb-2">Demandez le code OTP au client</p>
            <div className="flex gap-2">
              <input
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="flex-1 bg-white rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] border border-amber-200"
                placeholder="- - - - - -"
                maxLength={6}
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              />
              <button
                onClick={validateOtp}
                disabled={otpInput.length < 6}
                className="px-4 rounded-xl bg-[#F77F00] text-white text-xs disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
            <p className="text-amber-500 text-[9px] mt-2 text-center">Code attendu du client pour demarrer la course</p>
          </div>
        )}

        {/* Action button */}
        {rideState !== "completed" && rideState !== "waiting_otp" && (
          <button
            onClick={() => {
              if (rideState === "at_pickup") setRideState("waiting_otp");
              else advanceState();
            }}
            className={`w-full py-4 rounded-2xl text-white text-sm shadow-lg flex items-center justify-center gap-2 ${config.actionColor}`}
          >
            <Navigation className="w-5 h-5" />
            {config.action}
          </button>
        )}

        {/* Photo proof for delivery */}
        {rideState === "near_dest" && (
          <button
            onClick={() => toast.success("Photo de preuve capturee")}
            className="w-full mt-3 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Prendre photo de preuve
          </button>
        )}
      </div>

      {/* ═══ CHAT SHEET ═══ */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowChat(false)} />
          <div className="mt-auto relative bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <ProfileAvatar initials={client.initials} size={36} />
              <div className="flex-1">
                <p className="text-slate-700 text-xs">{client.name}</p>
                <p className="text-slate-400 text-[9px]">Client</p>
              </div>
              <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === "driver" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${msg.from === "driver" ? "bg-[#2A9D8F] text-white rounded-br-md" : "bg-slate-100 text-slate-700 rounded-bl-md"}`}>
                    <p className="text-xs" style={{ lineHeight: 1.5 }}>{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${msg.from === "driver" ? "text-white/50" : "text-slate-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 shrink-0">
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs"
                placeholder="Votre message..."
              />
              <button onClick={sendMessage} className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMERGENCY ═══ */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmergency(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-slate-800 text-sm text-center mb-1">Urgence</p>
            <p className="text-slate-400 text-[10px] text-center mb-5">Selectionnez le type d'urgence</p>
            <div className="space-y-2">
              {[
                { label: "Appeler les secours (117)", action: () => window.open("tel:117") },
                { label: "Signaler un incident", action: () => { toast.info("Signalement envoye au support IPPOO"); setShowEmergency(false); } },
                { label: "Probleme avec le client", action: () => { toast.info("Un agent va vous contacter"); setShowEmergency(false); } },
                { label: "Panne vehicule", action: () => { toast.info("Assistance technique en route"); setShowEmergency(false); } },
              ].map((opt, i) => (
                <button key={i} onClick={opt.action} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-xs active:bg-slate-50">
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowEmergency(false)} className="w-full mt-3 py-2 text-slate-400 text-[10px]">Fermer</button>
          </div>
        </div>
      )}

      {/* ═══ COMPLETION ═══ */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-800 text-base mb-1">Course terminee !</p>
            <p className="text-[#2A9D8F] text-2xl mb-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>+{earning} FCFA</p>
            <p className="text-slate-400 text-[10px] mb-5">Commission 15%: -{Math.round(earning * 0.15)} F - Net: {Math.round(earning * 0.85)} F</p>

            {/* Rate client */}
            <p className="text-slate-500 text-[10px] mb-2">Notez votre client</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#E9C46A]" fill={s <= 4 ? "#E9C46A" : "none"} />
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowComplete(false); navigate("/driver"); }}
              className="w-full py-4 rounded-2xl bg-[#2A9D8F] text-white text-sm shadow-lg shadow-emerald-500/20"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
