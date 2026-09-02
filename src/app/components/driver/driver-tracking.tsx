import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Phone, MessageSquare, Star, Navigation, MapPin,
  X, Send, Shield, AlertTriangle, Clock, Check, CheckCircle2, Route, Camera
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "../profile-avatar";
import { TrackingMap } from "../tracking-map";
import { api } from "../../api/client";

type RideState = "en_route_pickup" | "at_pickup" | "waiting_otp" | "in_progress" | "near_dest" | "completed";

interface ChatMsg {
  id: number;
  from: "driver" | "client";
  text: string;
  time: string;
}

interface LatLng { lat: number; lng: number }

interface Ride {
  id: string;
  serviceType: string;
  status: string;
  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };
  priceXOF: number;
  distanceKm: number;
  durationMin: number;
  otp?: string;
  driverName?: string;
  driverPlate?: string;
  driverRating?: number;
}

const ACTIVE_STATUSES = ["requested", "accepted", "arriving", "in_progress"];

function serviceLabel(t: string) {
  if (t === "delivery") return "Livraison";
  if (t === "heavy_transport") return "Transport";
  if (t === "carpool") return "Covoiturage";
  return "Course moto";
}

function statusToState(s: string): RideState {
  switch (s) {
    case "requested":
    case "accepted": return "en_route_pickup";
    case "arriving": return "at_pickup";
    case "in_progress": return "in_progress";
    case "completed": return "completed";
    default: return "en_route_pickup";
  }
}

function StatusBadge({ color, text, pulse = false }: { color: string; text: string; pulse?: boolean }) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
    slate: "bg-slate-50 text-slate-500 border-slate-200",
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
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);
  const [clientRating, setClientRating] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Récupère la course active réelle du chauffeur, puis suit sa progression.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadRide = async (id: string) => {
      try {
        const r = await api.get<Ride>(`/rides/${id}`);
        if (!cancelled && r) {
          setRide(r);
          if (r.status === "completed") setShowComplete(true);
        }
      } catch { /* ignore */ }
    };

    (async () => {
      setLoading(true);
      try {
        const missions = await api.get<Ride[]>("/driver/missions");
        const active = (Array.isArray(missions) ? missions : []).find((m) => ACTIVE_STATUSES.includes(m.status));
        if (!cancelled && active) {
          await loadRide(active.id);
          interval = setInterval(() => loadRide(active.id), 8000);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const rideState: RideState = ride ? statusToState(ride.status) : "en_route_pickup";
  const earning = ride?.priceXOF ?? 0;
  const eta = ride?.durationMin ?? null;

  const origin: LatLng | null = ride && ride.origin?.lat ? { lat: ride.origin.lat, lng: ride.origin.lng } : null;
  const destination: LatLng | null = ride && ride.destination?.lat ? { lat: ride.destination.lat, lng: ride.destination.lng } : null;

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setChatMessages(prev => [...prev, { id: prev.length + 1, from: "driver", text: msgInput, time }]);
    setMsgInput("");
  };

  const validateOtp = () => {
    if (ride?.otp) {
      if (otpInput === ride.otp) toast.success("Code OTP valide !");
      else { toast.error("Code incorrect"); return; }
    } else if (otpInput.length === 6) {
      toast.success("Code OTP transmis !");
    } else {
      toast.error("Code incomplet");
      return;
    }
  };

  const stateConfig: Record<RideState, { color: string; label: string; action: string; actionColor: string }> = {
    en_route_pickup: { color: "blue", label: "En route vers le client", action: "Actualiser", actionColor: "bg-[#1E6091]" },
    at_pickup: { color: "amber", label: "Au point de prise en charge", action: "Actualiser", actionColor: "bg-[#F77F00]" },
    waiting_otp: { color: "amber", label: "En attente du code OTP", action: "Valider OTP", actionColor: "bg-[#F77F00]" },
    in_progress: { color: "green", label: "Course en cours", action: "Actualiser", actionColor: "bg-[#2A9D8F]" },
    near_dest: { color: "orange", label: "Proche de la destination", action: "Terminer la course", actionColor: "bg-[#2A9D8F]" },
    completed: { color: "green", label: "Course terminee", action: "", actionColor: "" },
  };

  const config = stateConfig[rideState];

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2A9D8F] rounded-full animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="relative flex flex-col" style={{ height: "100dvh" }}>
        <div className="absolute top-0 left-0 right-0 pt-12 px-5 z-10">
          <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Navigation className="w-14 h-14 text-slate-300 mb-4" />
          <p className="text-slate-500 text-sm">Aucune course active</p>
          <p className="text-slate-400 text-[11px] mt-1">Acceptez une mission pour demarrer la navigation</p>
          <button onClick={() => navigate("/driver/missions")} className="mt-6 px-6 py-3 rounded-2xl bg-[#2A9D8F] text-white text-xs">
            Voir les missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh" }}>
      {/* Map */}
      <div className="flex-1 relative">
        <TrackingMap origin={origin} destination={destination} active={rideState !== "completed"} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 pt-12 px-5 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/driver")} className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <StatusBadge color={config.color} text={config.label} pulse={rideState !== "completed"} />
            <button onClick={() => setShowEmergency(true)} className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* ETA bubble */}
        {rideState !== "completed" && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full px-4 py-2 shadow-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E6091]" />
            <span className="text-slate-700 text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{eta != null ? `~${eta} min` : "—"}</span>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-white rounded-t-3xl shadow-sm -mt-6 relative z-20 p-5 pb-8 max-h-[55vh] overflow-y-auto">
        {/* Ride info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-800 text-xs">{serviceLabel(ride.serviceType)}</p>
            <p className="text-slate-400 text-[9px]">{ride.id}</p>
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
              <p className="text-slate-700 text-[11px]">{ride.origin?.label ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[8px]">DESTINATION</p>
              <p className="text-slate-700 text-[11px]">{ride.destination?.label ?? "—"}</p>
            </div>
          </div>
          <span className="text-slate-400 text-[10px]">{ride.distanceKm ? `${ride.distanceKm} km` : "—"}</span>
        </div>

        {/* Client card */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 mb-4">
          <ProfileAvatar initials="?" size={44} />
          <div className="flex-1">
            <p className="text-slate-700 text-xs">Client</p>
            <div className="flex items-center gap-2 text-[10px]">
              <Route className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">{serviceLabel(ride.serviceType)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.info("Coordonnees client indisponibles")}
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
        {rideState === "at_pickup" && (
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
                className="px-4 rounded-xl bg-[#F77F00] text-black text-xs disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
            <p className="text-amber-500 text-[9px] mt-2 text-center">Code attendu du client pour demarrer la course</p>
          </div>
        )}

        {/* Action button */}
        {rideState !== "completed" && (
          <button
            onClick={async () => {
              try {
                const r = await api.get<Ride>(`/rides/${ride.id}`);
                if (r) { setRide(r); if (r.status === "completed") setShowComplete(true); }
              } catch { /* ignore */ }
            }}
            className={`w-full py-4 rounded-2xl text-white text-sm shadow-sm flex items-center justify-center gap-2 ${config.actionColor}`}
          >
            <Navigation className="w-5 h-5" />
            {config.action}
          </button>
        )}

        {/* Photo proof */}
        {rideState === "in_progress" && ride.serviceType === "delivery" && (
          <button
            onClick={() => toast.success("Photo de preuve capturee")}
            className="w-full mt-3 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Prendre photo de preuve
          </button>
        )}
      </div>

      {/* --- CHAT SHEET --- */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowChat(false)} />
          <div className="mt-auto relative bg-white rounded-t-3xl shadow-sm flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <ProfileAvatar initials="?" size={36} />
              <div className="flex-1">
                <p className="text-slate-700 text-xs">Client</p>
                <p className="text-slate-400 text-[9px]">Messagerie course</p>
              </div>
              <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Aucun message</p>
                </div>
              )}
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
              <button onClick={sendMessage} className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EMERGENCY --- */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmergency(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-sm">
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

      {/* --- COMPLETION --- */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-sm text-center">
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
                <button
                  key={s}
                  onClick={() => setClientRating(s)}
                  aria-label={`Note ${s} étoile${s > 1 ? "s" : ""}`}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"
                >
                  <Star className="w-5 h-5 text-[#E9C46A]" fill={s <= clientRating ? "#E9C46A" : "none"} />
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowComplete(false); navigate("/driver"); }}
              className="w-full py-4 rounded-2xl bg-[#2A9D8F] text-white text-sm shadow-sm shadow-emerald-500/20"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
