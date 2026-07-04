import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, X, Navigation, MapPin, Calendar, Search, Star, Clock, Users, Check, Car, Plus } from "lucide-react";
import { ProfileAvatar } from "./profile-avatar";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../api/client";
import { usePlatformConfig, findOffer } from "../store/platform-config";

const CARPOOL_IMG = "https://images.unsplash.com/photo-1766330301316-9db45ccf9bb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2l0eSUyMGNhcnBvb2wlMjByaWRlJTIwc2hhcmluZ3xlbnwxfHx8fDE3NzU5MTYyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const TRIP_GRADIENTS = ["from-cyan-500 to-teal-600", "from-emerald-400 to-green-500", "from-blue-500 to-blue-600", "from-violet-400 to-purple-500"];

const DEFAULT_TRIPS = [
  { id: 1, backendId: "", driver: "Sessinou A.", from: "Campus Abomey-Calavi", to: "Cotonou Centre", time: "07:30", date: "Aujourd'hui", seats: 2, price: 500, rating: 4.8, vehicle: "Toyota Yaris", initials: "SA", gradient: "from-cyan-500 to-teal-600" },
  { id: 2, backendId: "", driver: "Fifamè D.", from: "Akpakpa", to: "Godomey", time: "08:00", date: "Aujourd'hui", seats: 3, price: 400, rating: 4.6, vehicle: "Kia Picanto", initials: "FD", gradient: "from-emerald-400 to-green-500" },
  { id: 3, backendId: "", driver: "Togbédji M.", from: "Fidjrosse", to: "Campus Abomey-Calavi", time: "17:00", date: "Aujourd'hui", seats: 1, price: 600, rating: 4.9, vehicle: "Honda Fit", initials: "TM", gradient: "from-blue-500 to-blue-600" },
  { id: 4, backendId: "", driver: "Aїdatou B.", from: "Cotonou Centre", to: "Porto-Novo", time: "09:00", date: "Demain", seats: 2, price: 1200, rating: 4.7, vehicle: "Renault Kwid", initials: "AB", gradient: "from-violet-400 to-purple-500" },
];

const initialsOf = (name: string) => {
  const p = name.trim().split(" ").filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "IP";
};

export function CarpoolPage() {
  const navigate = useNavigate();
  const config = usePlatformConfig();
  const carpoolPriceHint = String(findOffer(config, "carpool")?.priceFrom ?? 500);
  const [tab, setTab] = useState<"find" | "offer">("find");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [dateFilter, setDateFilter] = useState("Aujourd'hui");
  const [bookedTrips, setBookedTrips] = useState<number[]>([]);
  const [trips, setTrips] = useState(DEFAULT_TRIPS);

  // Offer ride state
  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerTime, setOfferTime] = useState("");
  const [offerSeats, setOfferSeats] = useState(2);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerVehicle, setOfferVehicle] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setParallaxY(window.scrollY * 0.4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Charge les trajets depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<any[]>("/carpools");
        if (cancelled || !list?.length) return;
        const today = new Date().toDateString();
        setTrips(list.map((c, i) => {
          const dep = new Date(c.departAt);
          return {
            id: i + 1,
            backendId: c.id,
            driver: c.driverName,
            from: c.origin?.label ?? "",
            to: c.destination?.label ?? "",
            time: dep.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            date: dep.toDateString() === today ? "Aujourd'hui" : "Demain",
            seats: c.seatsLeft,
            price: c.pricePerSeatXOF,
            rating: 4.8,
            vehicle: c.vehicle,
            initials: initialsOf(c.driverName),
            gradient: TRIP_GRADIENTS[i % TRIP_GRADIENTS.length],
          };
        }));
      } catch {
        /* repli silencieux */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredTrips = trips.filter(t => {
    const matchFrom = !searchFrom || t.from.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo || t.to.toLowerCase().includes(searchTo.toLowerCase());
    const matchDate = dateFilter === "Tous" || t.date === dateFilter;
    return matchFrom && matchTo && matchDate;
  });

  const handleBook = (trip: typeof DEFAULT_TRIPS[0]) => {
    if (bookedTrips.includes(trip.id)) {
      setBookedTrips(prev => prev.filter(id => id !== trip.id));
      toast("Reservation annulee", { description: `${trip.from} → ${trip.to}` });
    } else {
      setBookedTrips(prev => [...prev, trip.id]);
      if (trip.backendId) api.post(`/carpools/${trip.backendId}/book`, { seats: 1 }).catch(() => {});
      toast.success("Siege reserve !", { description: `${trip.from} → ${trip.to} avec ${trip.driver} a ${trip.time} · ${trip.price} F` });
    }
  };

  const handleOfferRide = () => {
    if (!offerFrom.trim()) { toast.error("Indiquez le point de depart"); return; }
    if (!offerTo.trim()) { toast.error("Indiquez la destination"); return; }
    if (!offerDate) { toast.error("Choisissez une date"); return; }
    if (!offerTime) { toast.error("Choisissez une heure"); return; }
    if (!offerPrice.trim()) { toast.error("Indiquez le prix par siege"); return; }
    if (!offerVehicle.trim()) { toast.error("Indiquez votre vehicule"); return; }

    toast.success("Trajet publie !", {
      description: `${offerFrom} → ${offerTo} · ${offerSeats} places · ${offerPrice} F/siege${isRecurrent ? " · Recurrent" : ""}`,
    });
    setOfferFrom(""); setOfferTo(""); setOfferDate(""); setOfferTime(""); setOfferPrice(""); setOfferVehicle("");
    setTab("find");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-sm">
        <ImageWithFallback src={CARPOOL_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A9D8F]/85 via-[#2A9D8F]/70 to-[#1E6091]/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E9C46A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#2A9D8F]/20 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-white">Covoiturage</h2>
              <p className="text-cyan-100 text-xs">Partagez vos trajets, economisez</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10 mb-4">
            <button onClick={() => setTab("find")} className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${tab === "find" ? "bg-white text-cyan-600 shadow-sm" : "text-white"}`}>
              Trouver un trajet
            </button>
            <button onClick={() => setTab("offer")} className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${tab === "offer" ? "bg-white text-cyan-600 shadow-sm" : "text-white"}`}>
              Proposer un trajet
            </button>
          </div>

          {tab === "find" && (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="relative pl-8">
                  <div className="absolute left-3 top-3 bottom-3 w-[2px] bg-emerald-400 rounded-full" />
                  <div className="absolute left-[6px] top-2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-md" />
                  <div className="absolute left-[6px] bottom-2 w-3 h-3 rounded-full bg-cyan-500 border-2 border-white shadow-md" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 focus-within:border-emerald-300 transition">
                      <input placeholder="Depart (ex: Campus)" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-foreground" />
                      {searchFrom ? <button onClick={() => setSearchFrom("")}><X className="w-4 h-4 text-slate-300" /></button> : <Navigation className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 focus-within:border-cyan-300 transition">
                      <input placeholder="Arrivee (ex: Maison)" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-foreground" />
                      {searchTo ? <button onClick={() => setSearchTo("")}><X className="w-4 h-4 text-slate-300" /></button> : <MapPin className="w-4 h-4 text-cyan-500" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {["Aujourd'hui", "Demain", "Tous"].map(d => (
                  <button
                    key={d}
                    onClick={() => setDateFilter(d)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border transition ${dateFilter === d ? "bg-white text-cyan-600 border-white shadow-sm" : "bg-white/15 text-white border-white/10 backdrop-blur-sm"}`}
                  >
                    <Calendar className="w-3 h-3" /> {d}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        {/* ═══ FIND TRIPS ═══ */}
        {tab === "find" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="title-gradient">Trajets disponibles</h3>
              <span className="text-[10px] bg-cyan-50 text-cyan-600 px-2.5 py-1 rounded-full">{filteredTrips.length} trajets</span>
            </div>

            {filteredTrips.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-cyan-400" />
                </div>
                <p className="text-slate-500 text-sm mb-1">Aucun trajet trouve</p>
                <p className="text-slate-400 text-xs">Modifiez vos criteres de recherche</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredTrips.map((t) => {
                const isBooked = bookedTrips.includes(t.id);
                return (
                  <div key={t.id} className={`bg-white rounded-2xl p-4 border shadow-sm transition ${isBooked ? "border-cyan-200 shadow-cyan-100/50" : "border-slate-100"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <ProfileAvatar initials={t.initials} size={44} className="rounded-2xl shadow-sm shadow-cyan-500/20" gradient={t.gradient} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-800">{t.driver}</p>
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] text-amber-700">{t.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{t.vehicle} · {t.date}</p>
                      </div>
                    </div>

                    <div className="relative pl-6 mb-4">
                      <div className="absolute left-1.5 top-1 bottom-1 w-[2px] bg-emerald-400 rounded-full" />
                      <div className="absolute left-0 top-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                      <div className="absolute left-0 bottom-0.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-white" />
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Depart</p>
                          <p className="text-sm text-slate-700">{t.from}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Arrivee</p>
                          <p className="text-sm text-slate-700">{t.to}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> {t.time}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          <Users className="w-3 h-3" /> {t.seats} places
                        </span>
                      </div>
                      <span className="text-emerald-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>{t.price} F</span>
                    </div>

                    <button
                      onClick={() => handleBook(t)}
                      className={`w-full py-3 rounded-2xl text-sm transition-all ${
                        isBooked
                          ? "bg-cyan-50 text-cyan-600 border-2 border-cyan-200"
                          : "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                      }`}
                    >
                      {isBooked ? (
                        <span className="flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Reserve · Annuler ?</span>
                      ) : (
                        "Reserver un siege"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ OFFER RIDE ═══ */}
        {tab === "offer" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <label className="text-sm text-slate-500 mb-3 block">Itineraire</label>
              <div className="relative pl-8">
                <div className="absolute left-3 top-5 bottom-5 w-[2px] bg-emerald-400 rounded-full" />
                <div className="absolute left-[6px] top-3.5 w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/40 border-2 border-white" />
                <div className="absolute left-[6px] bottom-3.5 w-3 h-3 rounded-full bg-cyan-500 shadow-md shadow-cyan-500/40 border-2 border-white" />
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-emerald-300 transition">
                    <input placeholder="Point de depart" value={offerFrom} onChange={(e) => setOfferFrom(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                    <Navigation className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-cyan-300 transition">
                    <input placeholder="Destination" value={offerTo} onChange={(e) => setOfferTo(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                    <MapPin className="w-4 h-4 text-cyan-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <label className="text-sm text-slate-500">Date & heure</label>
              <div className="flex gap-2.5">
                <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} className="flex-1 bg-slate-50 text-sm rounded-2xl px-4 py-3 border border-slate-100 outline-none focus:border-cyan-300" />
                <input type="time" value={offerTime} onChange={(e) => setOfferTime(e.target.value)} className="flex-1 bg-slate-50 text-sm rounded-2xl px-4 py-3 border border-slate-100 outline-none focus:border-cyan-300" />
              </div>
              <button
                onClick={() => setIsRecurrent(!isRecurrent)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl border-2 transition ${isRecurrent ? "border-cyan-400 bg-cyan-50" : "border-transparent bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isRecurrent ? "text-cyan-600" : "text-slate-400"}`} />
                  <span className="text-sm text-slate-700">Trajet recurrent</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition ${isRecurrent ? "bg-cyan-500 border-cyan-500" : "border-slate-300"}`}>
                  {isRecurrent && <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <label className="text-sm text-slate-500">Vehicule & places</label>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-cyan-300 transition">
                <Car className="w-4 h-4 text-cyan-500" />
                <input placeholder="Vehicule (ex: Toyota Yaris blanche)" value={offerVehicle} onChange={(e) => setOfferVehicle(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Places disponibles: {offerSeats}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setOfferSeats(n)}
                      className={`flex-1 py-3 rounded-xl text-sm transition border-2 ${offerSeats === n ? "bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/20" : "bg-slate-50 text-slate-600 border-transparent"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <label className="text-sm text-slate-500 mb-2 block">Prix par siege (FCFA)</label>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 focus-within:border-cyan-300 transition">
                <span className="text-sm text-slate-400">F</span>
                <input
                  type="number"
                  placeholder={carpoolPriceHint}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                />
              </div>
              {offerPrice && offerSeats > 0 && (
                <p className="text-xs text-emerald-500 mt-2" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                  Revenu potentiel: {(Number(offerPrice) * offerSeats).toLocaleString()} FCFA
                </p>
              )}
            </div>

            <button
              onClick={handleOfferRide}
              className="w-full bg-cyan-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm shadow-cyan-500/25 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" /> Publier le trajet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}