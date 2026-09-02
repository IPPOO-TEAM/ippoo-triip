import { useState, useEffect } from "react";
import { X, Navigation, MapPin, Calendar, Search, Star, Clock, Users, Check, Car, Plus, Route } from "lucide-react";
import { ProfileAvatar } from "./profile-avatar";
import { toast } from "sonner";
import { api } from "../api/client";
import { usePlatformConfig, findOffer } from "../store/platform-config";
import { M3Page, SectionHeader, M3Card, M3Button, EmptyState } from "./m3";

const CARPOOL_IMG = "https://images.unsplash.com/photo-1766330301316-9db45ccf9bb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2l0eSUyMGNhcnBvb2wlMjByaWRlJTIwc2hhcmluZ3xlbnwxfHx8fDE3NzU5MTYyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const TRIP_GRADIENTS = ["from-cyan-500 to-teal-600", "from-emerald-400 to-green-500", "from-blue-500 to-blue-600", "from-violet-400 to-purple-500"];

interface Trip {
  id: number; backendId: string; driver: string; from: string; to: string;
  time: string; date: string; seats: number; price: number; rating: number;
  vehicle: string; initials: string; gradient: string;
}

const initialsOf = (name: string) => {
  const p = name.trim().split(" ").filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "IP";
};

export function CarpoolPage() {
  const config = usePlatformConfig();
  const carpoolPriceHint = String(findOffer(config, "carpool")?.priceFrom ?? 500);
  const [tab, setTab] = useState<"find" | "offer">("find");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [dateFilter, setDateFilter] = useState("Aujourd'hui");
  const [bookedTrips, setBookedTrips] = useState<number[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Offer ride state
  const [offerFrom, setOfferFrom] = useState("");
  const [offerTo, setOfferTo] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerTime, setOfferTime] = useState("");
  const [offerSeats, setOfferSeats] = useState(2);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerVehicle, setOfferVehicle] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);

  // Charge les trajets réellement publiés depuis le backend (aucun jeu de démo)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<any[]>("/carpools");
        if (cancelled) return;
        const today = new Date().toDateString();
        setTrips((list ?? []).map((c, i) => {
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
            rating: Number(c.rating ?? 0),
            vehicle: c.vehicle,
            initials: initialsOf(c.driverName),
            gradient: TRIP_GRADIENTS[i % TRIP_GRADIENTS.length],
          };
        }));
      } catch {
        if (!cancelled) setTrips([]);
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

  const handleBook = (trip: Trip) => {
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

  const Hero = (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-full bg-white/15 p-1.5 backdrop-blur-md border border-white/15">
        {([["find", "Trouver un trajet"], ["offer", "Proposer un trajet"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition ${tab === id ? "bg-white text-[var(--m3-primary)] shadow-sm" : "text-[var(--m3-on-primary)]/90"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "find" && (
        <>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="relative pl-8">
              <div className="absolute bottom-3 left-3 top-3 w-[2px] rounded-full bg-[var(--m3-primary)]/40" />
              <div className="absolute left-[6px] top-2 h-3 w-3 rounded-full border-2 border-white shadow-md" style={{ background: "var(--m3-primary)" }} />
              <div className="absolute bottom-2 left-[6px] h-3 w-3 rounded-full border-2 border-white shadow-md" style={{ background: "var(--m3-accent)" }} />
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                  <input placeholder="Depart (ex: Campus)" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-800 outline-none" />
                  {searchFrom ? <button onClick={() => setSearchFrom("")}><X className="h-4 w-4 text-slate-300" /></button> : <Navigation className="h-4 w-4 text-[var(--m3-primary)]" />}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                  <input placeholder="Arrivee (ex: Maison)" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-800 outline-none" />
                  {searchTo ? <button onClick={() => setSearchTo("")}><X className="h-4 w-4 text-slate-300" /></button> : <MapPin className="h-4 w-4 text-[var(--m3-accent)]" />}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {["Aujourd'hui", "Demain", "Tous"].map(d => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition ${dateFilter === d ? "border-white bg-white text-[var(--m3-primary)] shadow-sm" : "border-white/15 bg-white/15 text-[var(--m3-on-primary)] backdrop-blur-md"}`}
              >
                <Calendar className="h-3 w-3" /> {d}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <M3Page
      title="Covoiturage"
      subtitle="Partagez vos trajets, economisez"
      icon={Car}
      hero={Hero}
    >
      {/* --- FIND TRIPS --- */}
      {tab === "find" && (
        <div className="mx-auto max-w-md">
          <SectionHeader
            title="Trajets disponibles"
            icon={Route}
            action={<span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>{filteredTrips.length} trajets</span>}
          />

          {filteredTrips.length === 0 && (
            <EmptyState
              icon={Search}
              title="Aucun trajet trouve"
              description="Modifiez vos criteres de recherche ou proposez votre propre trajet."
              action={<M3Button icon={Plus} onClick={() => setTab("offer")}>Proposer un trajet</M3Button>}
            />
          )}

          <div className="space-y-3">
            {filteredTrips.map((t, i) => {
              const isBooked = bookedTrips.includes(t.id);
              return (
                <M3Card key={t.id} delay={i * 0.05} className={isBooked ? "ring-2 ring-[var(--m3-primary)]/40" : ""}>
                  <div className="mb-4 flex items-center gap-3">
                    <ProfileAvatar initials={t.initials} size={44} className="rounded-2xl shadow-sm" gradient={t.gradient} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{t.driver}</p>
                        {t.rating > 0 && (
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-[10px] text-amber-700">{t.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{t.vehicle} · {t.date}</p>
                    </div>
                  </div>

                  <div className="relative mb-4 pl-6">
                    <div className="absolute bottom-1 left-1.5 top-1 w-[2px] rounded-full bg-[var(--m3-primary)]/40" />
                    <div className="absolute left-0 top-0.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-primary)" }} />
                    <div className="absolute bottom-0.5 left-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-accent)" }} />
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Depart</p>
                        <p className="text-sm text-slate-700">{t.from}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Arrivee</p>
                        <p className="text-sm text-slate-700">{t.to}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {t.time}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-400">
                        <Users className="h-3 w-3" /> {t.seats} places
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{t.price} F</span>
                  </div>

                  {isBooked ? (
                    <M3Button variant="tonal" icon={Check} onClick={() => handleBook(t)}>Reserve · Annuler ?</M3Button>
                  ) : (
                    <M3Button onClick={() => handleBook(t)}>Reserver un siege</M3Button>
                  )}
                </M3Card>
              );
            })}
          </div>
        </div>
      )}

      {/* --- OFFER RIDE --- */}
      {tab === "offer" && (
        <div className="mx-auto max-w-md space-y-4">
          <M3Card>
            <SectionHeader title="Itineraire" icon={Route} />
            <div className="relative pl-8">
              <div className="absolute bottom-5 left-3 top-5 w-[2px] rounded-full bg-[var(--m3-primary)]/40" />
              <div className="absolute left-[6px] top-3.5 h-3 w-3 rounded-full border-2 border-white shadow-md" style={{ background: "var(--m3-primary)" }} />
              <div className="absolute bottom-3.5 left-[6px] h-3 w-3 rounded-full border-2 border-white shadow-md" style={{ background: "var(--m3-accent)" }} />
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                  <input placeholder="Point de depart" value={offerFrom} onChange={(e) => setOfferFrom(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
                  <Navigation className="h-4 w-4 text-[var(--m3-primary)]" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                  <input placeholder="Destination" value={offerTo} onChange={(e) => setOfferTo(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
                  <MapPin className="h-4 w-4 text-[var(--m3-accent)]" />
                </div>
              </div>
            </div>
          </M3Card>

          <M3Card delay={0.05}>
            <SectionHeader title="Date & heure" icon={Calendar} />
            <div className="flex gap-2.5">
              <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} className="flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--m3-primary)]/30" />
              <input type="time" value={offerTime} onChange={(e) => setOfferTime(e.target.value)} className="flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--m3-primary)]/30" />
            </div>
            <button
              onClick={() => setIsRecurrent(!isRecurrent)}
              className={`mt-3 flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition ${isRecurrent ? "border-[var(--m3-primary)]" : "border-transparent bg-slate-50"}`}
              style={isRecurrent ? { background: "var(--m3-container)" } : undefined}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${isRecurrent ? "text-[var(--m3-primary)]" : "text-slate-400"}`} />
                <span className="text-sm text-slate-700">Trajet recurrent</span>
              </div>
              <div className="grid h-5 w-5 place-items-center rounded-full border-2 transition" style={isRecurrent ? { background: "var(--m3-primary)", borderColor: "var(--m3-primary)" } : { borderColor: "#cbd5e1" }}>
                {isRecurrent && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          </M3Card>

          <M3Card delay={0.1}>
            <SectionHeader title="Vehicule & places" icon={Car} />
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
              <Car className="h-4 w-4 text-[var(--m3-primary)]" />
              <input placeholder="Vehicule (ex: Toyota Yaris blanche)" value={offerVehicle} onChange={(e) => setOfferVehicle(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="mt-3">
              <p className="mb-2 text-xs text-slate-400">Places disponibles: {offerSeats}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setOfferSeats(n)}
                    className="flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition"
                    style={offerSeats === n
                      ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)", borderColor: "var(--m3-primary)" }
                      : { background: "#f8fafc", color: "#475569", borderColor: "transparent" }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </M3Card>

          <M3Card delay={0.15}>
            <SectionHeader title="Prix par siege (FCFA)" />
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
              <span className="text-sm text-slate-400">F</span>
              <input
                type="number"
                placeholder={carpoolPriceHint}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              />
            </div>
            {offerPrice && offerSeats > 0 && (
              <p className="mt-2 text-xs font-semibold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                Revenu potentiel: {(Number(offerPrice) * offerSeats).toLocaleString()} FCFA
              </p>
            )}
          </M3Card>

          <M3Button icon={Plus} onClick={handleOfferRide}>Publier le trajet</M3Button>
        </div>
      )}
    </M3Page>
  );
}

export default CarpoolPage;
