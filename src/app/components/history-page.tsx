import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Download, Bike, Package, Users, Truck, Filter, ChevronRight, ChevronLeft,
  X, Star, MapPin, Clock, Navigation, Copy, RotateCcw, AlertTriangle,
  Calendar, Search, Trash2
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { downloadBlob } from "./utils";
import { api } from "../api/client";
import articleImg from "figma:asset/article3.jpg";

type Category = "all" | "courses" | "livraisons" | "groupees" | "biens";

const filters: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tout", icon: Filter },
  { id: "courses", label: "Courses", icon: Bike },
  { id: "livraisons", label: "Livraisons", icon: Package },
  { id: "groupees", label: "Groupees", icon: Users },
  { id: "biens", label: "Biens", icon: Truck },
];

interface HistoryItem {
  id: string;
  cat: string;
  title: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: string;
  priceNum: number;
  status: "completed" | "cancelled" | "refunded";
  statusLabel: string;
  statusColor: string;
  gradient: string;
  Icon: React.ElementType;
  driver: string;
  driverRating: number;
  vehicle: string;
  distance: string;
  duration: string;
  paymentMethod: string;
  userRating: number | null;
}

const historyItems: HistoryItem[] = [
  { id: "IPP-20260410", cat: "courses", title: "Course moto", from: "Campus Abomey-Calavi", to: "Marche Dantokpa", date: "10 Avr 2026", time: "14:32", price: "1 200 F", priceNum: 1200, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-blue-500 to-indigo-600", Icon: Bike, driver: "Hounkpatin A.", driverRating: 4.8, vehicle: "Honda CB125", distance: "4.2 km", duration: "12 min", paymentMethod: "IPPOO Cash", userRating: 5 },
  { id: "IPP-20260409", cat: "livraisons", title: "Livraison colis", from: "Boulevard St-Michel", to: "Godomey, rue 312", date: "09 Avr 2026", time: "11:15", price: "1 500 F", priceNum: 1500, status: "completed", statusLabel: "Livree", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-orange-400 to-rose-500", Icon: Package, driver: "Togbédji M.", driverRating: 4.6, vehicle: "Moto cargo", distance: "6.8 km", duration: "25 min", paymentMethod: "IPPOO Cash", userRating: 4 },
  { id: "IPP-20260408", cat: "courses", title: "Course voiture", from: "Aeroport Cadjehoun", to: "Hotel du Lac", date: "08 Avr 2026", time: "16:45", price: "3 500 F", priceNum: 3500, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-blue-500 to-indigo-600", Icon: Bike, driver: "Fifamè D.", driverRating: 4.9, vehicle: "Toyota Yaris", distance: "8.1 km", duration: "18 min", paymentMethod: "IPPOO Cash", userRating: null },
  { id: "IPP-20260407", cat: "groupees", title: "Commande campus", from: "Marche Dantokpa", to: "Campus UAC", date: "07 Avr 2026", time: "09:20", price: "800 F", priceNum: 800, status: "completed", statusLabel: "Livree", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-violet-500 to-purple-600", Icon: Users, driver: "Sessinou K.", driverRating: 4.7, vehicle: "Tricycle", distance: "5.3 km", duration: "20 min", paymentMethod: "IPPOO Cash", userRating: 5 },
  { id: "IPP-20260406", cat: "courses", title: "Course moto", from: "Quartier Zongo", to: "CNHU", date: "06 Avr 2026", time: "08:00", price: "600 F", priceNum: 600, status: "cancelled", statusLabel: "Annulee", statusColor: "bg-red-50 text-red-500", gradient: "from-slate-400 to-slate-500", Icon: Bike, driver: "—", driverRating: 0, vehicle: "—", distance: "—", duration: "—", paymentMethod: "Rembourse", userRating: null },
  { id: "IPP-20260405", cat: "biens", title: "Demenagement", from: "Cotonou Centre", to: "Abomey-Calavi", date: "05 Avr 2026", time: "10:00", price: "7 500 F", priceNum: 7500, status: "completed", statusLabel: "Terminee", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-rose-400 to-red-500", Icon: Truck, driver: "Akotègnon B.", driverRating: 4.5, vehicle: "Camionnette", distance: "12.4 km", duration: "35 min", paymentMethod: "IPPOO Cash", userRating: 4 },
  { id: "IPP-20260404", cat: "livraisons", title: "Document express", from: "Bureau, Bd St-Michel", to: "Tribunal de Cotonou", date: "04 Avr 2026", time: "13:10", price: "1 000 F", priceNum: 1000, status: "completed", statusLabel: "Livree", statusColor: "bg-emerald-50 text-emerald-600", gradient: "from-orange-400 to-rose-500", Icon: Package, driver: "Aїdatou T.", driverRating: 4.8, vehicle: "Moto", distance: "3.1 km", duration: "10 min", paymentMethod: "IPPOO Cash", userRating: 5 },
];

/* ─── Présentation par type de service (backend → UI) ─── */
const SERVICE_PRESENTATION: Record<string, { cat: string; title: string; Icon: React.ElementType; gradient: string }> = {
  taxi_moto:       { cat: "courses",   title: "Course moto",      Icon: Bike,    gradient: "from-blue-500 to-indigo-600" },
  delivery:        { cat: "livraisons", title: "Livraison colis", Icon: Package, gradient: "from-orange-400 to-rose-500" },
  heavy_transport: { cat: "biens",     title: "Transport lourd",  Icon: Truck,   gradient: "from-rose-400 to-red-500" },
  group_order:     { cat: "groupees",  title: "Commande groupée", Icon: Users,   gradient: "from-violet-500 to-purple-600" },
  carpool:         { cat: "courses",   title: "Covoiturage",      Icon: Bike,    gradient: "from-blue-500 to-indigo-600" },
  air_freight:     { cat: "livraisons", title: "Fret aérien",     Icon: Package, gradient: "from-orange-400 to-rose-500" },
};

const STATUS_PRESENTATION: Record<string, { status: HistoryItem["status"]; statusLabel: string; statusColor: string }> = {
  completed: { status: "completed", statusLabel: "Terminée", statusColor: "bg-emerald-50 text-emerald-600" },
  cancelled: { status: "cancelled", statusLabel: "Annulée",  statusColor: "bg-red-50 text-red-500" },
};

/** Convertit une course du backend mock en élément d'historique UI. */
function rideToHistoryItem(r: any): HistoryItem {
  const svc = SERVICE_PRESENTATION[r.serviceType] ?? SERVICE_PRESENTATION.taxi_moto;
  const st = STATUS_PRESENTATION[r.status] ?? STATUS_PRESENTATION.completed;
  const d = new Date(r.createdAt);
  const priceNum = r.priceXOF ?? 0;
  return {
    id: r.id,
    cat: svc.cat,
    title: svc.title,
    from: r.origin?.label ?? "—",
    to: r.destination?.label ?? "—",
    date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    price: `${priceNum.toLocaleString("fr-FR")} F`,
    priceNum,
    status: st.status,
    statusLabel: st.statusLabel,
    statusColor: st.statusColor,
    gradient: r.status === "cancelled" ? "from-slate-400 to-slate-500" : svc.gradient,
    Icon: svc.Icon,
    driver: r.driverName ?? "—",
    driverRating: r.driverRating ?? 0,
    vehicle: r.vehicle ?? "—",
    distance: r.distanceKm ? `${r.distanceKm} km` : "—",
    duration: r.durationMin ? `${r.durationMin} min` : "—",
    paymentMethod: r.status === "cancelled" ? "Remboursé" : "IPPOO Cash",
    userRating: null,
  };
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [items, setItems] = useState(historyItems);
  const [parallaxY, setParallaxY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setParallaxY(y * 0.4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Charge l'historique depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: any[] }>("/rides?pageSize=50");
        if (cancelled || !res.items?.length) return;
        setItems(res.items.map(rideToHistoryItem));
      } catch {
        /* repli silencieux sur historyItems */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = items
    .filter(i => active === "all" || i.cat === active)
    .filter(i => !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.from.toLowerCase().includes(searchQuery.toLowerCase()) || i.to.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalSpent = items.filter(i => i.status === "completed").reduce((s, i) => s + i.priceNum, 0);

  const handleRebook = (item: HistoryItem) => {
    if (item.cat === "courses") navigate("/book-ride");
    else if (item.cat === "livraisons") navigate("/delivery");
    else if (item.cat === "biens") navigate("/heavy-transport");
    else if (item.cat === "groupees") navigate("/group-orders");
    toast(`Reprise du trajet ${item.from} → ${item.to}`);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSelectedItem(null);
    toast("Element supprime de l'historique");
  };

  const handleDownloadReceipt = (item: HistoryItem) => {
    const lines = [
      "╔════════════════════════════════════════╗",
      "║            RECU IPPOO TRIIP             ║",
      "╚════════════════════════════════════════╝",
      "",
      `Référence   : ${item.id}`,
      `Date        : ${item.date} à ${item.time}`,
      `Statut      : ${item.statusLabel}`,
      "",
      "─── TRAJET ────────────────────────────",
      `Départ      : ${item.from}`,
      `Destination : ${item.to}`,
      `Distance    : ${item.distance}`,
      `Durée       : ${item.duration}`,
      "",
      "─── DÉTAILS ───────────────────────────",
      `Service     : ${item.title}`,
      `Chauffeur   : ${item.driver}`,
      `Véhicule    : ${item.vehicle}`,
      "",
      "─── PAIEMENT ──────────────────────────",
      `Mode        : ${item.paymentMethod}`,
      `Montant     : ${item.price} CFA`,
      "",
      "Merci d'avoir choisi IPPOO !",
      "www.ippoo.app | support@ippoo.app",
      "+229 21 00 00 00",
      "",
      `Généré le : ${new Date().toLocaleString("fr-FR")}`,
    ].join("\n");

    downloadBlob(lines, `recu-ippoo-${item.id}.txt`);
    toast.success("Reçu téléchargé !", { description: item.id });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div ref={headerRef} className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        {/* Background image with parallax */}
        <img src={articleImg} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E6091]/85 via-[#1E6091]/70 to-[#2A9D8F]/80" />
        {/* Luminous halo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F77F00]/20 rounded-full -mr-20 -mt-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#2A9D8F]/20 rounded-full -ml-16 -mb-10 blur-3xl" />

        <div className="relative z-10 px-5 pt-14 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white mb-1">Historique</h2>
              <p className="text-xs text-white/60">{items.length} commandes · <span style={{ fontFamily: "'Space Grotesk', monospace" }}>{totalSpent.toLocaleString()} F</span> total</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20 mb-3 focus-within:border-white/40 transition">
            <Search className="w-4 h-4 text-white/60" />
            <input placeholder="Rechercher une course, livraison..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40" />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-white/50" /></button>}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  active === f.id
                    ? "bg-white text-[#1E6091] shadow-lg shadow-black/15"
                    : "bg-white/15 text-white/80 border border-white/10 active:bg-white/25"
                }`}
              >
                <f.icon className="w-3.5 h-3.5" /> {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? `Aucun resultat pour "${searchQuery}"` : "Aucun element dans cette categorie"}
            </p>
          </div>
        )}
        {filtered.map((item) => (
          <button key={item.id} onClick={() => setSelectedItem(item)}
            className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:bg-slate-50 transition text-left">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
                <item.Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-800 truncate">{item.title}</p>
                  <span className={`text-sm whitespace-nowrap ml-2 ${item.status === "cancelled" ? "text-slate-400 line-through" : "text-emerald-500"}`} style={{ fontFamily: "'Space Grotesk', monospace" }}>{item.price}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{item.from} → {item.to}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded" style={{ fontFamily: "'Space Grotesk', monospace" }}>{item.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.statusColor}`}>{item.statusLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{item.date}</span>
                {item.userRating && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-amber-600">{item.userRating}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800">Detail de la commande</p>
              <button onClick={() => setSelectedItem(null)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Status & price */}
            <div className="text-center mb-5">
              <div className={`w-14 h-14 bg-gradient-to-br ${selectedItem.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                <selectedItem.Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-xl text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedItem.price}CFA</p>
              <span className={`text-[10px] px-3 py-1 rounded-full mt-2 inline-block ${selectedItem.statusColor}`}>{selectedItem.statusLabel}</span>
            </div>

            {/* Route */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
              <div className="relative pl-7">
                <div className="absolute left-2 top-1 bottom-1 w-[2px] bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full" />
                <div className="absolute left-0.5 top-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                <div className="absolute left-0.5 bottom-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Depart</p>
                    <p className="text-sm text-slate-700">{selectedItem.from}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Destination</p>
                    <p className="text-sm text-slate-700">{selectedItem.to}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 mb-5">
              <DetailRow label="Date" value={`${selectedItem.date} a ${selectedItem.time}`} />
              <DetailRow label="Reference" value={selectedItem.id} mono />
              {selectedItem.driver !== "—" && <DetailRow label="Chauffeur" value={`${selectedItem.driver} (${selectedItem.driverRating}★)`} />}
              {selectedItem.vehicle !== "—" && <DetailRow label="Vehicule" value={selectedItem.vehicle} />}
              {selectedItem.distance !== "—" && <DetailRow label="Distance" value={selectedItem.distance} mono />}
              {selectedItem.duration !== "—" && <DetailRow label="Duree" value={selectedItem.duration} mono />}
              <DetailRow label="Paiement" value={selectedItem.paymentMethod} />
              {selectedItem.userRating && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-400">Votre note</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= selectedItem.userRating! ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-3">
              {selectedItem.status === "completed" && (
                <button onClick={() => { handleRebook(selectedItem); setSelectedItem(null); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition">
                  <RotateCcw className="w-4 h-4" /> Reprendre
                </button>
              )}
              <button onClick={() => { navigator.clipboard?.writeText(`Recu IPPOO ${selectedItem.id} - ${selectedItem.price}`); toast.success("Recu copie"); }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm active:scale-[0.98] transition">
                <Copy className="w-4 h-4" /> Copier recu
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDownloadReceipt(selectedItem)}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-sm">
                <Download className="w-4 h-4" /> Télécharger reçu
              </button>
              <button onClick={() => handleDelete(selectedItem.id)}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 px-4 rounded-xl text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {selectedItem.status === "completed" && !selectedItem.userRating && (
              <button onClick={() => { navigate("/tracking"); setSelectedItem(null); toast("Notez cette course"); }}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-50 text-amber-600 py-3 rounded-xl text-sm border border-amber-200">
                <Star className="w-4 h-4" /> Noter cette course
              </button>
            )}

            {selectedItem.status === "completed" && (
              <button onClick={() => { toast("Signalement envoye", { description: "Un agent vous contactera sous 24h" }); setSelectedItem(null); }}
                className="w-full mt-2 text-sm text-slate-400 py-2 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Signaler un probleme
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-slate-800 ${mono ? "" : ""}`} style={mono ? { fontFamily: "'Space Grotesk', monospace" } : undefined}>{value}</span>
    </div>
  );
}