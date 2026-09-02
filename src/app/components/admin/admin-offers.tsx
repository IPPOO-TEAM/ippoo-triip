/**
 * Back office - Édition des offres, tarifs, fiches et localisation.
 * Toutes les modifications sont enregistrées en temps réel dans la config
 * centrale et reflétées immédiatement sur l'ensemble de la plateforme.
 */
import type { ReactNode } from "react";
import {
  Tag, Bike, MapPin, RotateCcw, Save, ToggleLeft, ToggleRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePlatformConfig,
  updateOffer,
  updateRideVehicle,
  updateContact,
  resetPlatformConfig,
} from "../../store/platform-config";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1E6091] focus:bg-white transition";

export function AdminOffersPage() {
  const config = usePlatformConfig();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="title-gradient">Offres, tarifs & localisation</h1>
          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Les changements sont enregistrés automatiquement et appliqués partout sur la plateforme.
          </p>
        </div>
        <button
          onClick={() => {
            resetPlatformConfig();
            toast.success("Configuration réinitialisée aux valeurs par défaut");
          }}
          className="inline-flex items-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      </div>

      {/* --- OFFRES & FICHES --- */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#1E6091]/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-[#1E6091]" />
          </div>
          <h2 className="title-gradient">Offres & fiches</h2>
        </header>

        <div className="divide-y divide-slate-100">
          {config.offers.map((o) => (
            <div key={o.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={o.name}
                  onChange={(e) => updateOffer(o.id, { name: e.target.value })}
                  className="text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#1E6091] outline-none flex-1"
                />
                <button
                  onClick={() => updateOffer(o.id, { active: !o.active })}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs"
                  style={{ color: o.active ? "#2A9D8F" : "#94A3B8" }}
                >
                  {o.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {o.active ? "Active" : "Inactive"}
                </button>
              </div>

              <Field label="Accroche / statistique">
                <input
                  value={o.tagline}
                  onChange={(e) => updateOffer(o.id, { tagline: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Fiche descriptive">
                <textarea
                  value={o.description}
                  onChange={(e) => updateOffer(o.id, { description: e.target.value })}
                  rows={3}
                  className={`${inputCls} resize-y`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Prix de départ (FCFA)">
                  <input
                    type="number"
                    min={0}
                    value={o.priceFrom}
                    onChange={(e) => updateOffer(o.id, { priceFrom: Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Tarif au km (FCFA)">
                  <input
                    type="number"
                    min={0}
                    value={o.perKm}
                    onChange={(e) => updateOffer(o.id, { perKm: Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- VÉHICULES DE COURSE --- */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#F77F00]/10 flex items-center justify-center">
            <Bike className="w-4 h-4 text-[#F77F00]" />
          </div>
          <h2 className="title-gradient">Tarifs des véhicules (course)</h2>
        </header>

        <div className="p-5 space-y-4">
          {config.rideVehicles.map((v) => (
            <div key={v.id} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <Field label="Véhicule">
                <input
                  value={v.label}
                  onChange={(e) => updateRideVehicle(v.id, { label: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Prix min (FCFA)">
                <input
                  type="number"
                  min={0}
                  value={v.basePrice}
                  onChange={(e) => updateRideVehicle(v.id, { basePrice: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </Field>
              <Field label="Prix max (FCFA)">
                <input
                  type="number"
                  min={0}
                  value={v.maxPrice}
                  onChange={(e) => updateRideVehicle(v.id, { maxPrice: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </Field>
              <Field label="Tarif/km (FCFA)">
                <input
                  type="number"
                  min={0}
                  value={v.perKm}
                  onChange={(e) => updateRideVehicle(v.id, { perKm: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </Field>
              <button
                onClick={() => updateRideVehicle(v.id, { active: !v.active })}
                className="inline-flex items-center gap-1.5 text-xs h-[38px]"
                style={{ color: v.active ? "#2A9D8F" : "#94A3B8" }}
              >
                {v.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {v.active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* --- LOCALISATION & CONTACT --- */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#2A9D8F]" />
          </div>
          <h2 className="title-gradient">Localisation & contact</h2>
        </header>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Adresse / localisation">
            <input
              value={config.contact.address}
              onChange={(e) => updateContact({ address: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Requête Google Maps">
            <input
              value={config.contact.mapsQuery}
              onChange={(e) => updateContact({ mapsQuery: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Téléphone">
            <input
              value={config.contact.phone}
              onChange={(e) => updateContact({ phone: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Email de contact">
            <input
              value={config.contact.email}
              onChange={(e) => updateContact({ email: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Save className="w-3.5 h-3.5 text-[#2A9D8F]" />
        Enregistrement automatique actif · dernière mise à jour&nbsp;:
        {" "}
        {config.updatedAt ? new Date(config.updatedAt).toLocaleString("fr-FR") : "valeurs par défaut"}
      </div>
    </div>
  );
}
