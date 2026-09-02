import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Shield, Users, ChevronRight, Navigation, MapPin, Truck, Check, Calendar, Camera } from "lucide-react";
import { toast } from "sonner";
import { getGPSPosition } from "./utils";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { usePlatformConfig, findOffer } from "../store/platform-config";
import { M3Page, M3Card, M3Button, SectionHeader } from "./m3";

const HEAVY_IMG = "https://images.unsplash.com/photo-1757454122792-147411c3c695?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdHJ1Y2slMjBjYXJnbyUyMG1vdmluZyUyMGxvZ2lzdGljc3xlbnwxfHx8fDE3NzU5MTY0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/** Base de référence (Pickup) servant à mettre les tarifs à l'échelle. */
const HEAVY_REF_BASE = 5000;

const vehiclesBase = [
  { id: "pickup", Icon: Truck, label: "Pickup", desc: "Petits déménagements", basePrice: 5000 },
  { id: "tricycle", Icon: Truck, label: "Tricycle cargo", desc: "Marchandises moyennes", basePrice: 3500 },
  { id: "camionnette", Icon: Truck, label: "Camionnette", desc: "Gros volumes", basePrice: 8000 },
];

export function HeavyTransportPage() {
  const navigate = useNavigate();
  // Tarifs pilotés par le back office (mise à l'échelle selon l'offre « biens lourds »)
  const config = usePlatformConfig();
  const heavyOffer = findOffer(config, "heavy");
  const priceRatio = (heavyOffer?.priceFrom ?? HEAVY_REF_BASE) / HEAVY_REF_BASE;
  const vehicles = vehiclesBase.map((v) => ({ ...v, basePrice: Math.round(v.basePrice * priceRatio) }));
  const [selected, setSelected] = useState("pickup");
  const [labor, setLabor] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [payTime, setPayTime] = useState("before");
  const [pickupAddr, setPickupAddr] = useState("");
  const [deliveryAddr, setDeliveryAddr] = useState("");
  const [description, setDescription] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedVehicle = vehicles.find(v => v.id === selected)!;
  const total = selectedVehicle.basePrice + (labor ? 2000 : 0) + (insurance ? 500 : 0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoTaken(true);
      toast.success("Photo ajoutée !", { description: file.name });
    }
  };

  const handleGPS = () => {
    setGpsLoading(true);
    toast("Localisation GPS en cours...");
    getGPSPosition(
      (label) => { setPickupAddr(label); setGpsLoading(false); toast.success("Position GPS détectée !"); },
      (fallback) => { setPickupAddr(fallback); setGpsLoading(false); toast("Position approximative utilisée"); }
    );
  };

  const handleOrder = () => {
    if (!pickupAddr.trim()) { toast.error("Indiquez l'adresse de chargement"); return; }
    if (!deliveryAddr.trim()) { toast.error("Indiquez l'adresse de livraison"); return; }
    if (scheduled && (!scheduleDate || !scheduleTime)) { toast.error("Completez la date et l'heure"); return; }

    setOrdering(true);
    toast.success("Commande confirmée !", {
      description: `${selectedVehicle.label} · ${pickupAddr} → ${deliveryAddr} · ${total.toLocaleString()} FCFA`,
    });
    setTimeout(() => navigate("/app/tracking"), 1500);
  };

  const hero = (
    <div className="relative h-24 overflow-hidden rounded-3xl">
      <ImageWithFallback src={HEAVY_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, var(--m3-primary), transparent)" }} />
    </div>
  );

  return (
    <M3Page title="Transport de biens" subtitle="Déménagement & gros colis" icon={Truck} hero={hero}>
      {/* Type de véhicule */}
      <SectionHeader title="Type de véhicule" icon={Truck} />
      <div className="space-y-2.5">
        {vehicles.map((v, i) => {
          const isSelected = selected === v.id;
          return (
            <M3Card
              key={v.id}
              delay={0.04 * i}
              onClick={() => setSelected(v.id)}
              className="flex items-center gap-4"
              style={isSelected ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl" style={isSelected ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                {isSelected ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <v.Icon className="h-5 w-5" strokeWidth={1.8} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-800">{v.label}</p>
                <p className="text-xs text-slate-400">{v.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600" style={{ fontFamily: "'Space Grotesk', monospace" }}>{v.basePrice.toLocaleString()} F</p>
                <p className="text-[10px] text-slate-400">base</p>
              </div>
            </M3Card>
          );
        })}
      </div>

      {/* Itinéraire */}
      <SectionHeader title="Itinéraire" icon={MapPin} />
      <M3Card>
        <div className="relative pl-8">
          <div className="absolute left-3 top-5 bottom-5 w-[2px] rounded-full" style={{ background: "var(--m3-primary)" }} />
          <div className="absolute left-[6px] top-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-accent)" }} />
          <div className="absolute left-[6px] bottom-3.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: "var(--m3-primary)" }} />
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
              <input placeholder="Adresse de chargement" value={pickupAddr} onChange={(e) => setPickupAddr(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
              <button onClick={handleGPS} disabled={gpsLoading} className="shrink-0">
                {gpsLoading
                  ? <div className="h-4 w-4 rounded-full border-2 border-[var(--m3-primary)]/30 border-t-[var(--m3-primary)] animate-spin" />
                  : <Navigation className="h-4 w-4 text-[var(--m3-primary)]" />
                }
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition focus-within:border-[var(--m3-primary)]">
              <input placeholder="Adresse de livraison" value={deliveryAddr} onChange={(e) => setDeliveryAddr(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
              <MapPin className="h-4 w-4 text-[var(--m3-primary)]" />
            </div>
          </div>
        </div>
      </M3Card>

      {/* Détails du chargement */}
      <SectionHeader title="Details du chargement" icon={Camera} />
      <M3Card className="space-y-3">
        <textarea
          placeholder="Décrivez les biens à transporter (meubles, cartons, électroménager...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--m3-primary)]"
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          onClick={() => photoTaken ? (setPhotoTaken(false), setPhotoPreview(null)) : photoInputRef.current?.click()}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-sm transition ${photoTaken ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
        >
          {photoTaken ? (
            photoPreview
              ? <><img src={photoPreview} className="h-8 w-8 rounded-lg object-cover" alt="" /> Photo ajoutée, Changer</>
              : <><Check className="h-4 w-4" /> Photo ajoutée, Supprimer</>
          ) : (
            <><Camera className="h-4 w-4" /> Ajouter une photo (optionnel)</>
          )}
        </button>
      </M3Card>

      {/* Programmer */}
      <SectionHeader title="Planification" icon={Calendar} />
      <M3Card
        onClick={() => setScheduled(!scheduled)}
        className="flex items-center gap-3"
        style={scheduled ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl" style={scheduled ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">Programmer le transport</p>
          <p className="text-xs text-slate-400">{scheduled ? "Date et heure définies" : "Maintenant par défaut"}</p>
        </div>
        <ToggleCircle active={scheduled} />
      </M3Card>
      {scheduled && (
        <div className="mt-2.5 flex gap-2.5">
          <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--m3-primary)]" />
          <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--m3-primary)]" />
        </div>
      )}

      {/* Options */}
      <SectionHeader title="Options" icon={Shield} />
      <div className="space-y-2.5">
        <M3Card
          onClick={() => setLabor(!labor)}
          className="flex items-center gap-4"
          style={labor ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={labor ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Main-d'œuvre</p>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>+2 000 F</span>
            </div>
            <p className="text-xs text-slate-400">Aide au chargement / déchargement</p>
          </div>
          <ToggleCircle active={labor} />
        </M3Card>

        <M3Card
          onClick={() => setInsurance(!insurance)}
          className="flex items-center gap-4"
          style={insurance ? { borderColor: "var(--m3-primary)", borderWidth: 2 } : undefined}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={insurance ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#f1f5f9", color: "#94a3b8" }}>
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Assurance transport</p>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>+500 F</span>
            </div>
            <p className="text-xs text-slate-400">Protection de vos biens</p>
          </div>
          <ToggleCircle active={insurance} />
        </M3Card>
      </div>

      {/* Paiement */}
      <div className="mt-4 flex gap-2.5">
        <button
          onClick={() => setPayTime("before")}
          className="flex-1 rounded-full py-3.5 text-sm font-semibold transition"
          style={payTime === "before" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}
        >
          Avant la course
        </button>
        <button
          onClick={() => setPayTime("after")}
          className="flex-1 rounded-full py-3.5 text-sm font-semibold transition"
          style={payTime === "after" ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" } : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}
        >
          Après livraison
        </button>
      </div>

      {/* Total */}
      <M3Card tonal className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="opacity-70">Transport ({selectedVehicle.label})</span>
          <span style={{ fontFamily: "'Space Grotesk', monospace" }}>{selectedVehicle.basePrice.toLocaleString()} F</span>
        </div>
        {labor && <div className="flex justify-between text-sm"><span className="opacity-70">Main-d'œuvre</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>2 000 F</span></div>}
        {insurance && <div className="flex justify-between text-sm"><span className="opacity-70">Assurance</span><span style={{ fontFamily: "'Space Grotesk', monospace" }}>500 F</span></div>}
        <div className="mt-2 flex justify-between border-t border-current/10 pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace" }}>{total.toLocaleString()} FCFA</span>
        </div>
      </M3Card>

      <div className="mt-5">
        <M3Button onClick={handleOrder} disabled={ordering} icon={ordering ? undefined : ChevronRight}>
          {ordering ? "Confirmation..." : "Commander"}
        </M3Button>
      </div>
    </M3Page>
  );
}

function ToggleCircle({ active }: { active: boolean }) {
  return (
    <div className="grid h-5 w-5 place-items-center rounded-full border-2 transition-all" style={active ? { background: "var(--m3-primary)", borderColor: "var(--m3-primary)" } : { borderColor: "#cbd5e1" }}>
      {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </div>
  );
}
