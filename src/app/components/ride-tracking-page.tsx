import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../api/client";
import {
  ChevronLeft, Phone, MessageSquare, Share2, Star, Navigation, MapPin,
  X, Send, Shield, AlertTriangle, Clock, Copy, Check, ChevronRight,
  PhoneOff, Wallet, Heart, Flag, Ban, Info, ChevronDown, Receipt,
  Banknote, ThumbsUp, AlertOctagon
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { getAvatar } from "./avatars";
import { TrackingMap } from "./tracking-map";
import { SosButton } from "./sos-button";

type RideState = "searching" | "accepted" | "enroute" | "arrived" | "inprogress" | "completed";

interface ChatMsg {
  id: number;
  from: "user" | "driver";
  text: string;
  time: string;
}

/* ─── StatusPill ─── */
function StatusPill({ color, text, pulse = false }: { color: string; text: string; pulse?: boolean }) {
  const styles: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
  };
  return (
    <div className={`px-3 py-1.5 rounded-full text-[10px] tracking-wide border shadow-sm backdrop-blur-sm flex items-center gap-1.5 ${styles[color]}`}>
      {pulse && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      {text}
    </div>
  );
}

/* ─── Auto-reply messages ─── */
const driverReplies = [
  "D'accord, j'arrive bientot !",
  "Je suis a environ 2 minutes",
  "OK compris, pas de souci",
  "Je suis en route, patientez",
  "Bien recu !",
  "J'arrive au point de rendez-vous",
];

export function RideTrackingPage() {
  const navigate = useNavigate();

  /* ─── Core state ─── */
  const [rideState, setRideState] = useState<RideState>("searching");
  const [eta, setEta] = useState(5);
  const [distance, setDistance] = useState(2.4);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  /* ─── UI state ─── */
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTip, setShowTip] = useState(false);

  /* ─── Chat state ─── */
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 1, from: "driver", text: "Bonjour ! Je suis en route vers vous.", time: "14:30" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Rating state ─── */
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  /* ─── Tip state ─── */
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");

  /* ─── Cancel state ─── */
  const [cancelReason, setCancelReason] = useState("");

  /* ─── Call state ─── */
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [searchParams] = useSearchParams();
  const rideId = searchParams.get("ride");

  const [driver, setDriver] = useState({
    name: "Hounkpatin Adjovi",
    vehicle: "Honda CB125 - Noire",
    plate: "AB 1234 BJ",
    rating: 4.8,
    trips: 342,
    phone: "+229 96 XX XX XX",
    initials: "HA",
    gradient: "from-blue-500 to-blue-600",
  });

  const [ridePrice, setRidePrice] = useState(1200);
  const [departure, setDeparture] = useState("Campus Abomey-Calavi");
  const [destination, setDestination] = useState("Cotonou Centre");

  // Hydrate le suivi avec la vraie course réservée (repli sur les valeurs par défaut)
  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get<any>(`/rides/${rideId}`);
        if (cancelled || !r) return;
        if (r.driverName && r.driverName !== "") {
          const parts = r.driverName.trim().split(" ").filter(Boolean);
          setDriver((prev) => ({
            ...prev,
            name: r.driverName,
            plate: r.driverPlate ?? prev.plate,
            rating: r.driverRating || prev.rating,
            trips: r.driverTrips || prev.trips,
            vehicle: r.driverVehicle ?? prev.vehicle,
            initials: ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || prev.initials,
          }));
        }
        if (typeof r.priceXOF === "number") setRidePrice(r.priceXOF);
        if (r.origin?.label) setDeparture(r.origin.label);
        if (r.destination?.label) setDestination(r.destination.label);
      } catch {
        /* repli silencieux */
      }
    })();
    return () => { cancelled = true; };
  }, [rideId]);

  /* ─── Auto-progression timer ─── */
  useEffect(() => {
    if (rideState === "searching") {
      const t = setTimeout(() => {
        setRideState("accepted");
        toast.success("Chauffeur trouve !", { description: `${driver.name} accepte votre course` });
      }, 3000);
      return () => clearTimeout(t);
    }
    if (rideState === "accepted") {
      const t = setTimeout(() => {
        setRideState("enroute");
        setEta(4);
        setDistance(1.8);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [rideState]);

  /* ─── ETA countdown ─── */
  useEffect(() => {
    if (rideState !== "enroute" && rideState !== "inprogress") return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      if (rideState === "enroute") {
        setEta(prev => Math.max(0, prev - 0.05));
        setDistance(prev => Math.max(0, prev - 0.015));
        setProgress(prev => Math.min(prev + 0.8, 45));
      }
      if (rideState === "inprogress") {
        setProgress(prev => Math.min(prev + 0.6, 100));
        setDistance(prev => Math.max(0, prev - 0.01));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rideState]);

  /* ─── Auto arrive ─── */
  useEffect(() => {
    if (rideState === "enroute" && eta <= 0.1) {
      setRideState("arrived");
      setEta(0);
      setProgress(50);
      toast.success("Votre chauffeur est arrive !", { description: "Rejoignez-le au point de rendez-vous" });
      setChatMessages(prev => [...prev, { id: Date.now(), from: "driver", text: "Je suis arrive au point de rendez-vous ! Je vous attends.", time: formatTime() }]);
    }
  }, [eta, rideState]);

  /* ─── Chat scroll ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChat]);

  /* ─── Helpers ─── */
  const formatTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  const formatCallDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = { id: Date.now(), from: "user", text: chatInput, time: formatTime() };
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
    // Driver auto-reply
    setTimeout(() => {
      const reply = driverReplies[Math.floor(Math.random() * driverReplies.length)];
      setChatMessages(prev => [...prev, { id: Date.now() + 1, from: "driver", text: reply, time: formatTime() }]);
    }, 1500 + Math.random() * 2000);
  };

  const startCall = () => {
    setShowCall(true);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
  };

  const endCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setShowCall(false);
    toast("Appel termine", { description: formatCallDuration(callDuration) });
  };

  const handleCancel = () => {
    if (!cancelReason) { toast.error("Selectionnez un motif d'annulation"); return; }
    if (rideId) api.post(`/rides/${rideId}/cancel`, { reason: cancelReason }).catch(() => {});
    toast("Course annulee", { description: cancelReason });
    setShowCancel(false);
    setTimeout(() => navigate("/app"), 800);
  };

  const handleShare = (method: string) => {
    const shareText = `Je suis en course IPPOO ! Chauffeur: ${driver.name} (${driver.plate}). ${departure} → ${destination}. Suivez-moi en direct.`;
    if (method === "copy") {
      navigator.clipboard?.writeText(shareText);
      toast.success("Lien de suivi copie !");
    } else {
      toast.success(`Partage par ${method}`, { description: "Lien de suivi envoye" });
    }
    setShowShare(false);
  };

  const handleSOS = () => {
    toast.error("Alerte SOS envoyee", { description: "L'equipe securite IPPOO et les contacts d'urgence ont ete prevenus." });
    setShowSOS(false);
  };

  const startRide = () => {
    setRideState("inprogress");
    setEta(12);
    setDistance(4.2);
    setProgress(50);
    toast("Course en cours", { description: `${departure} → ${destination}` });
    setChatMessages(prev => [...prev, { id: Date.now(), from: "driver", text: "C'est parti ! On est en route vers votre destination.", time: formatTime() }]);
  };

  const completeRide = useCallback(() => {
    setRideState("completed");
    setProgress(100);
    toast.success("Vous êtes arrive !", { description: destination });
  }, [destination]);

  /* ─── Auto complete in-progress ─── */
  useEffect(() => {
    if (rideState === "inprogress" && progress >= 99) {
      completeRide();
    }
  }, [progress, rideState, completeRide]);

  const submitRating = () => {
    if (rating === 0) { toast.error("Selectionnez une note"); return; }
    setRatingSubmitted(true);
    if (rideId) api.post(`/rides/${rideId}/rate`, { rating, comment: ratingComment }).catch(() => {});
    toast.success(`Merci pour votre note de ${rating}/5 !`, {
      description: ratingComment ? `"${ratingComment}"` : "Votre avis aide a ameliorer le service",
    });
  };

  const submitTip = () => {
    const amount = customTip ? parseInt(customTip) : tipAmount;
    if (!amount || amount <= 0) { toast.error("Entrez un montant valide"); return; }
    toast.success(`Pourboire de ${amount} F envoye a ${driver.name}`, { description: "Debite de votre IPPOO Cash" });
    setShowTip(false);
  };

  /* ─── Status config ─── */
  const statusMap: Record<RideState, { color: string; text: string }> = {
    searching: { color: "amber", text: "RECHERCHE EN COURS" },
    accepted: { color: "blue", text: "CHAUFFEUR ACCEPTE" },
    enroute: { color: "blue", text: "CHAUFFEUR EN ROUTE" },
    arrived: { color: "green", text: "CHAUFFEUR ARRIVE" },
    inprogress: { color: "cyan", text: "COURSE EN COURS" },
    completed: { color: "green", text: "COURSE TERMINEE" },
  };

  const canCancel = ["searching", "accepted", "enroute", "arrived"].includes(rideState);
  const showDriverInfo = !["searching"].includes(rideState);

  return (
    <div className="min-h-screen bg-white">
      <SosButton />
      {/* ═══ MAP AREA ═══ */}
      <div className="relative h-[38vh] overflow-hidden">
        {/* Vraie carte Leaflet / OpenStreetMap */}
        <TrackingMap
          rideState={rideState}
          progress={progress}
          driverName={driver.name}
        />

        <button onClick={() => navigate(-1)} className="absolute top-14 left-5 w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition" style={{ zIndex: 500 }}>
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>

        <div className="absolute top-14 right-5 flex items-center gap-2" style={{ zIndex: 500 }}>
          <StatusPill {...statusMap[rideState]} pulse={["searching", "enroute", "inprogress"].includes(rideState)} />
        </div>

        {/* SOS button */}
        {rideState !== "completed" && rideState !== "searching" && (
          <button onClick={() => setShowSOS(true)} className="absolute bottom-5 right-5 w-12 h-12 bg-[#D62828] rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30 active:scale-90 transition" style={{ zIndex: 500 }}>
            <AlertOctagon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* ═══ BOTTOM SHEET ═══ */}
      <div className="bg-white rounded-t-[2rem] -mt-6 relative z-10 min-h-[62vh] shadow-[0_-4px_40px_rgba(0,0,0,0.08)]">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-8">

          {/* ─── SEARCHING ─── */}
          {rideState === "searching" && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-40" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Navigation className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="title-gradient">Recherche d'un chauffeur...</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">Veuillez patienter quelques instants</p>

              {/* Animated dots */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>

              {/* Route info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left mb-6">
                <div className="relative pl-7">
                  <div className="absolute left-2 top-1.5 bottom-1.5 w-[2px] bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full" />
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  <div className="absolute left-0.5 bottom-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Depart</p>
                      <p className="text-sm text-slate-700">{departure}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Destination</p>
                      <p className="text-sm text-slate-700">{destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowCancel(true)} className="text-sm text-slate-400 underline">Annuler la recherche</button>
            </div>
          )}

          {/* ─── DRIVER FOUND / EN ROUTE / ARRIVED / IN PROGRESS ─── */}
          {showDriverInfo && rideState !== "completed" && (
            <div>
              {/* Driver card */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20">
                    {getAvatar(driver.initials) ? (
                      <img src={getAvatar(driver.initials)!} alt={driver.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${driver.gradient} flex items-center justify-center`}>
                        <span className="text-white">{driver.initials}</span>
                      </div>
                    )}
                  </div>
                  {rideState !== "arrived" && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-800">{driver.name}</p>
                  <p className="text-xs text-slate-400">{driver.vehicle}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{driver.plate}</span>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] text-amber-700">{driver.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{driver.trips} courses</span>
                  </div>
                </div>
              </div>

              {/* ETA / Progress */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                    <span className="text-xs text-slate-500">{departure}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Depart</span>
                </div>
                {/* Progress bar */}
                <div className="relative h-2.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                  {rideState !== "arrived" && progress > 5 && progress < 95 && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-[#F77F00] shadow-md transition-all duration-1000"
                      style={{ left: `calc(${Math.min(progress, 95)}% - 8px)` }} />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    <span className="text-xs text-slate-500">{destination}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Destination</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">ETA</p>
                  <p className="text-blue-600 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                    {rideState === "arrived" ? "Arrive !" : rideState === "completed" ? "" : `${Math.ceil(eta)} min`}
                  </p>
                </div>
                <div className="bg-cyan-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Distance</p>
                  <p className="text-cyan-600 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>{distance.toFixed(1)} km</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Prix</p>
                  <p className="text-emerald-600 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>{ridePrice.toLocaleString()} F</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <button onClick={startCall} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-2xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition">
                  <Phone className="w-4 h-4" /> Appeler
                </button>
                <button onClick={() => setShowChat(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3.5 rounded-2xl active:scale-[0.98] transition relative">
                  <MessageSquare className="w-4 h-4" /> Message
                  {chatMessages.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F77F00] rounded-full text-white text-[10px] flex items-center justify-center">{chatMessages.length}</span>
                  )}
                </button>
                <button onClick={() => setShowShare(true)} className="w-14 flex items-center justify-center bg-slate-100 text-slate-700 py-3.5 rounded-2xl active:scale-[0.98] transition">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* State-specific CTA */}
              {rideState === "arrived" && (
                <button onClick={startRide} className="w-full bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white py-4 rounded-2xl shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2 active:scale-[0.98] transition mb-3">
                  <Check className="w-4 h-4" /> Je suis monte, demarrer la course
                </button>
              )}

              {rideState === "inprogress" && (
                <div className="bg-cyan-50 rounded-2xl p-3 mb-3 flex items-center gap-3 border border-cyan-200">
                  <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-cyan-700">Course en cours</p>
                    <p className="text-[10px] text-cyan-500">Temps ecoule: {formatCallDuration(elapsedSeconds)}</p>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {canCancel && (
                <button onClick={() => setShowCancel(true)} className="w-full text-sm text-slate-400 py-2 flex items-center justify-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Annuler la course
                </button>
              )}
            </div>
          )}

          {/* ─── COMPLETED ─── */}
          {rideState === "completed" && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/30">
                  <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="title-gradient">Course terminee !</h3>
                <p className="text-2xl text-emerald-500 mt-1" style={{ fontFamily: "'Space Grotesk', monospace" }}>{ridePrice.toLocaleString()} FCFA</p>
                <p className="text-xs text-slate-400 mt-1">Paye via IPPOO Cash</p>
              </div>

              {/* Trip summary */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">Recapitulatif</span>
                  <button onClick={() => setShowReceipt(true)} className="text-xs text-[#1E6091] flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" /> Voir le recu
                  </button>
                </div>
                <div className="relative pl-7 mb-3">
                  <div className="absolute left-2 top-1 bottom-1 w-[2px] bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full" />
                  <div className="absolute left-0.5 top-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  <div className="absolute left-0.5 bottom-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700">{departure}</p>
                    <p className="text-sm text-slate-700">{destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-200 pt-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil(elapsedSeconds / 60)} min</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 4.2 km</span>
                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {driver.name}</span>
                </div>
              </div>

              {/* Rating */}
              {!ratingSubmitted ? (
                <div className="bg-white rounded-2xl p-5 mb-5 border border-slate-100 shadow-sm">
                  <p className="text-sm mb-1 text-slate-700 text-center">Comment etait votre course ?</p>
                  <p className="text-[10px] text-slate-400 text-center mb-4">Notez {driver.name}</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setRating(s)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm border transition active:scale-90 ${s <= rating ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}>
                        <Star className={`w-5 h-5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-xs text-slate-500 mb-3">
                      {rating <= 2 ? "Nous sommes desoles. Dites-nous plus." : rating <= 3 ? "Correct. Comment ameliorer ?" : rating === 4 ? "Bonne course !" : "Excellent !"}
                    </p>
                  )}
                  <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Un commentaire ? (optionnel)"
                    rows={2}
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 outline-none focus:border-[#F77F00] resize-none mb-3"
                  />
                  {/* Quick tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Conduite prudente", "Ponctuel", "Aimable", "Propre", "Bonne route"].map(tag => (
                      <button key={tag} onClick={() => setRatingComment(prev => prev ? `${prev}, ${tag}` : tag)}
                        className="text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200 active:bg-slate-100">
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button onClick={submitRating}
                    className={`w-full py-3.5 rounded-xl text-sm transition ${rating > 0 ? "bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white shadow-lg shadow-orange-200/50 active:scale-[0.98]" : "bg-slate-100 text-slate-400"}`}>
                    Envoyer ma note
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-4 mb-5 border border-emerald-200 text-center">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-sm text-emerald-700">Merci pour votre avis !</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              {!showTip ? (
                <button onClick={() => setShowTip(true)} className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3.5 rounded-2xl border border-violet-200 text-sm mb-4 active:scale-[0.98] transition">
                  <Heart className="w-4 h-4" /> Laisser un pourboire a {driver.name}
                </button>
              ) : (
                <div className="bg-violet-50 rounded-2xl p-4 mb-4 border border-violet-200">
                  <p className="text-sm text-violet-700 text-center mb-3">Pourboire pour {driver.name}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[100, 200, 500].map(amt => (
                      <button key={amt} onClick={() => { setTipAmount(amt); setCustomTip(""); }}
                        className={`py-3 rounded-xl text-sm border-2 transition ${tipAmount === amt && !customTip ? "border-violet-400 bg-white text-violet-600" : "border-transparent bg-white text-slate-600"}`}
                        style={{ fontFamily: "'Space Grotesk', monospace" }}>
                        {amt} F
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-slate-200 mb-3">
                    <Banknote className="w-4 h-4 text-violet-400" />
                    <input type="number" placeholder="Autre montant" value={customTip} onChange={e => { setCustomTip(e.target.value); setTipAmount(0); }}
                      className="flex-1 bg-transparent outline-none text-sm" style={{ fontFamily: "'Space Grotesk', monospace" }} />
                    <span className="text-xs text-slate-400">FCFA</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitTip} className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl text-sm shadow-lg shadow-violet-500/20">
                      Envoyer
                    </button>
                    <button onClick={() => setShowTip(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm">Annuler</button>
                  </div>
                </div>
              )}

              {/* Final actions */}
              <div className="flex gap-3">
                <button onClick={() => navigate("/app/book-ride")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition">
                  Reprendre ce trajet
                </button>
                <button onClick={() => navigate("/app")}
                  className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-2xl text-sm active:scale-[0.98] transition">
                  Accueil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ OVERLAYS ═══════════════ */}

      {/* ─── CALL OVERLAY ─── */}
      {showCall && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl mb-6 border-4 border-white/10">
            {getAvatar(driver.initials) ? (
              <img src={getAvatar(driver.initials)!} alt={driver.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${driver.gradient} flex items-center justify-center`}>
                <span className="text-white text-2xl">{driver.initials}</span>
              </div>
            )}
          </div>
          <p className="text-white text-xl mb-1">{driver.name}</p>
          <p className="text-slate-400 text-sm mb-2">{driver.phone}</p>
          <p className="text-emerald-400 text-sm mb-12" style={{ fontFamily: "'Space Grotesk', monospace" }}>
            {callDuration > 0 ? formatCallDuration(callDuration) : "Appel en cours..."}
          </p>
          <div className="flex gap-6">
            <button className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-[#D62828] flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CHAT OVERLAY ─── */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-3 px-5 pt-14 pb-3 border-b border-slate-100 shrink-0">
            <button onClick={() => setShowChat(false)} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              {getAvatar(driver.initials) ? (
                <img src={getAvatar(driver.initials)!} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${driver.gradient} flex items-center justify-center`}>
                  <span className="text-white text-xs">{driver.initials}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800">{driver.name}</p>
              <p className="text-[10px] text-emerald-500">En ligne</p>
            </div>
            <button onClick={startCall} className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.from === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md" : "bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${msg.from === "user" ? "text-blue-200" : "text-slate-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-5 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-slate-100 bg-white">
            {["J'arrive !", "Ou etes-vous ?", "5 minutes", "Merci"].map(q => (
              <button key={q} onClick={() => { setChatInput(q); }}
                className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                {q}
              </button>
            ))}
          </div>

          <div className="px-5 py-3 flex gap-2 shrink-0 bg-white border-t border-slate-100">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Ecrire un message..."
              className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none border border-slate-200 focus:border-blue-400"
            />
            <button onClick={sendChat} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${chatInput.trim() ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20" : "bg-slate-100"}`}>
              <Send className={`w-4 h-4 ${chatInput.trim() ? "text-white" : "text-slate-400"}`} />
            </button>
          </div>
        </div>
      )}

      {/* ─── SHARE MODAL ─── */}
      {showShare && (
        <ModalOverlay onClose={() => setShowShare(false)} title="Partager ma course">
          <p className="text-xs text-slate-400 mb-4">Partagez votre position en temps reel avec un proche pour plus de securite.</p>
          <div className="space-y-2">
            {[
              { method: "sms", label: "Envoyer par SMS", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
              { method: "whatsapp", label: "Partager sur WhatsApp", icon: Share2, color: "text-emerald-600 bg-emerald-50" },
              { method: "copy", label: "Copier le lien de suivi", icon: Copy, color: "text-slate-600 bg-slate-50" },
            ].map(s => (
              <button key={s.method} onClick={() => handleShare(s.method)}
                className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-slate-100 active:bg-slate-50 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-700">{s.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
            ))}
          </div>
        </ModalOverlay>
      )}

      {/* ─── CANCEL MODAL ─── */}
      {showCancel && (
        <ModalOverlay onClose={() => setShowCancel(false)} title="Annuler la course">
          {rideState !== "searching" && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4 flex items-start gap-2 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Des frais d'annulation de <strong>200 F</strong> peuvent s'appliquer si le chauffeur est deja en route.</p>
            </div>
          )}
          <p className="text-xs text-slate-400 mb-3">Motif d'annulation :</p>
          <div className="space-y-2 mb-4">
            {["Temps d'attente trop long", "J'ai change d'avis", "Le chauffeur ne repond pas", "Erreur de destination", "Autre raison"].map(reason => (
              <button key={reason} onClick={() => setCancelReason(reason)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition ${cancelReason === reason ? "border-[#D62828] bg-red-50 text-[#D62828]" : "border-slate-100 text-slate-600"}`}>
                {reason}
              </button>
            ))}
          </div>
          <button onClick={handleCancel}
            className={`w-full py-3.5 rounded-xl text-sm transition ${cancelReason ? "bg-[#D62828] text-white active:scale-[0.98]" : "bg-slate-100 text-slate-400"}`}>
            Confirmer l'annulation
          </button>
        </ModalOverlay>
      )}

      {/* ─── SOS MODAL ─── */}
      {showSOS && (
        <ModalOverlay onClose={() => setShowSOS(false)} title="Alerte securite">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertOctagon className="w-8 h-8 text-[#D62828]" />
          </div>
          <p className="text-sm text-slate-700 text-center mb-2">Vous etes en danger ?</p>
          <p className="text-xs text-slate-400 text-center mb-6">
            L'equipe securite IPPOO sera immediatement alertee. Vos contacts d'urgence recevront votre position GPS en temps reel.
          </p>
          <button onClick={handleSOS}
            className="w-full bg-[#D62828] text-white py-4 rounded-xl text-sm active:scale-[0.98] transition mb-3">
            Envoyer l'alerte SOS
          </button>
          <button onClick={() => { toast("Appel d'urgence", { description: "Composition du 166..." }); setShowSOS(false); }}
            className="w-full bg-red-50 text-[#D62828] py-3.5 rounded-xl text-sm border border-red-200 mb-3">
            Appeler la police (166)
          </button>
          <button onClick={() => setShowSOS(false)} className="w-full text-slate-400 text-sm py-2">
            Annuler
          </button>
        </ModalOverlay>
      )}

      {/* ─── RECEIPT MODAL ─── */}
      {showReceipt && (
        <ModalOverlay onClose={() => setShowReceipt(false)} title="Recu de course">
          <div className="text-center mb-4">
            <p className="text-[10px] text-slate-400">IPPOO TRIIP</p>
            <p className="text-[10px] text-slate-400">Recu #{Date.now().toString().slice(-6)}</p>
          </div>
          <div className="border-t border-dashed border-slate-200 py-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Chauffeur</span><span className="text-slate-800">{driver.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Vehicule</span><span className="text-slate-800">{driver.plate}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Depart</span><span className="text-slate-800 text-right max-w-[55%]">{departure}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Destination</span><span className="text-slate-800 text-right max-w-[55%]">{destination}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Distance</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>4.2 km</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Duree</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>{Math.ceil(elapsedSeconds / 60)} min</span></div>
          </div>
          <div className="border-t border-dashed border-slate-200 py-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Course de base</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>800 F</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Distance (4.2 km)</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>350 F</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Supplement heure</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>50 F</span></div>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between">
            <span className="text-slate-800">Total</span>
            <span className="text-emerald-500 text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{ridePrice.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Wallet className="w-3.5 h-3.5" /> Paye via IPPOO Cash
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(`Recu IPPOO #${Date.now().toString().slice(-6)} - ${ridePrice} FCFA`); toast.success("Recu copie !"); }}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm">
            <Copy className="w-4 h-4" /> Copier le recu
          </button>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ─── Modal overlay wrapper ─── */
function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-800">{title}</p>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}