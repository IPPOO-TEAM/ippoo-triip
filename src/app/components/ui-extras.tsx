/**
 * Composants UI transverses IPPOO ajoutés par l'audit :
 *   - <Skeleton/>     : placeholder de chargement
 *   - <OfflineBanner/>: bandeau persistant si réseau coupé
 *   - <LanguagePicker/>: sélecteur FR/Fon/Yoruba/EN
 *   - <ThemeToggle/>  : light/dark
 *   - <LowDataToggle/>: basse data on/off
 *   - haptic()        : vibration tactile
 */
import { useAppStore } from "../store/app-store";
import { LANGUAGE_OPTIONS } from "../i18n/translations";
import { useT } from "../i18n/use-t";
import { Moon, Sun, Wifi, WifiOff, Zap, ZapOff } from "lucide-react";

/* -- Haptic feedback -- */
export function haptic(pattern: number | number[] = 15) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

/* -- Skeleton -- */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement"
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

/* -- Offline banner -- */
export function OfflineBanner() {
  const { state } = useAppStore();
  const t = useT();
  if (state.online) return null;
  return (
    <div role="status" aria-live="polite" className="ippoo-offline-banner">
      <WifiOff className="inline w-3 h-3 mr-1" aria-hidden /> {t("common.offline")} · vos actions seront synchronisées dès le retour du réseau.
    </div>
  );
}

/* -- Online pill (debug) -- */
export function NetworkPill() {
  const { state } = useAppStore();
  const Icon = state.online ? Wifi : WifiOff;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
        state.online ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {state.online ? "En ligne" : "Hors ligne"}
    </span>
  );
}

/* -- Language picker -- */
export function LanguagePicker() {
  const { state, dispatch } = useAppStore();
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Langue</span>
      <select
        value={state.language}
        onChange={(e) => {
          haptic();
          dispatch({ type: "SET_LANGUAGE", language: e.target.value as any });
        }}
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white"
        aria-label="Choisir la langue"
      >
        {LANGUAGE_OPTIONS.map((l) => (
          <option key={l.code} value={l.code}>{l.native}</option>
        ))}
      </select>
    </label>
  );
}

/* -- Theme toggle -- */
export function ThemeToggle() {
  const { state, dispatch } = useAppStore();
  const isDark = state.theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Désactiver le mode sombre" : "Activer le mode sombre"}
      onClick={() => {
        haptic();
        dispatch({ type: "SET_THEME", theme: isDark ? "light" : "dark" });
      }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200"
    >
      {isDark ? <Sun className="w-4 h-4" aria-hidden /> : <Moon className="w-4 h-4" aria-hidden />}
      <span>{isDark ? "Clair" : "Sombre"}</span>
    </button>
  );
}

/* -- Low data toggle -- */
export function LowDataToggle() {
  const { state, dispatch } = useAppStore();
  const on = state.lowDataMode;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Désactiver le mode basse data" : "Activer le mode basse data"}
      onClick={() => {
        haptic();
        dispatch({ type: "SET_LOW_DATA", on: !on });
      }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200"
    >
      {on ? <ZapOff className="w-4 h-4" aria-hidden /> : <Zap className="w-4 h-4" aria-hidden />}
      <span>Basse data {on ? "ON" : "OFF"}</span>
    </button>
  );
}

/* -- Skip link a11y -- */
export function SkipToContent() {
  return (
    <a href="#main" className="skip-link">
      Aller au contenu principal
    </a>
  );
}
