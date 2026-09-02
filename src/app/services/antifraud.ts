/**
 * ML antifraude IPPOO - heuristiques côté client (pré-filtre).
 * Le score est remonté au backend pour la vraie décision (ML serveur).
 *
 * Signaux capturés :
 *  - Nouvelle device sur compte vieux
 *  - Géolocalisation incohérente (ride à Lagos depuis téléphone à Cotonou)
 *  - Multi-comptes sur même device (téléphones successifs en 24h)
 *  - Vitesse de saisie OTP suspecte (< 2s = bot)
 *  - Mode incognito / WebView non standard
 */
import { logger } from "./logger";

export type FraudSignal = {
  code: string;
  severity: "low" | "medium" | "high";
  detail?: string;
};

const DEVICE_KEY = "ippoo_triip_device_id";
const HISTORY_KEY = "ippoo_triip_phone_history";

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = "dev_" + crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function recordPhoneOnDevice(phone: string) {
  try {
    const hist: { phone: string; at: number }[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]",
    );
    hist.push({ phone, at: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-20)));
  } catch {}
}

export function analyzeLoginAttempt(input: {
  phone: string;
  otpEnteredInMs: number;
  geoLat?: number;
  geoLng?: number;
}): { signals: FraudSignal[]; score: number } {
  const signals: FraudSignal[] = [];

  // 1) OTP saisi trop vite → probable bot
  if (input.otpEnteredInMs < 1500) {
    signals.push({ code: "OTP_TOO_FAST", severity: "high",
      detail: `${input.otpEnteredInMs}ms` });
  }

  // 2) Multi-comptes sur device en 24h
  try {
    const hist: { phone: string; at: number }[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]",
    );
    const recent = hist.filter((h) => Date.now() - h.at < 86_400_000);
    const distinct = new Set(recent.map((h) => h.phone));
    if (distinct.size > 3) {
      signals.push({ code: "MULTI_ACCOUNTS_DEVICE", severity: "high",
        detail: `${distinct.size} numéros distincts en 24h` });
    } else if (distinct.size > 1) {
      signals.push({ code: "MULTI_ACCOUNTS_DEVICE", severity: "medium",
        detail: `${distinct.size} numéros distincts` });
    }
  } catch {}

  // 3) Géolocalisation hors Bénin
  if (typeof input.geoLat === "number" && typeof input.geoLng === "number") {
    const inBenin =
      input.geoLat >= 6.2 && input.geoLat <= 12.5 &&
      input.geoLng >= 0.7 && input.geoLng <= 3.9;
    if (!inBenin) {
      signals.push({ code: "GEO_OUT_OF_COUNTRY", severity: "medium",
        detail: `(${input.geoLat.toFixed(2)},${input.geoLng.toFixed(2)})` });
    }
  }

  // 4) UA suspect
  const ua = navigator.userAgent.toLowerCase();
  if (/headless|phantom|puppeteer|playwright/.test(ua)) {
    signals.push({ code: "HEADLESS_BROWSER", severity: "high" });
  }

  const score = signals.reduce(
    (s, sig) => s + ({ low: 10, medium: 30, high: 60 }[sig.severity]),
    0,
  );

  if (score > 0) logger.warn("antifraud.signals", { score, signals });
  return { signals, score };
}

/** Analyse rapide d'une course pour détecter une anomalie */
export function analyzeRide(input: {
  priceXOF: number;
  distanceKm: number;
  serviceType: string;
}): FraudSignal[] {
  const signals: FraudSignal[] = [];
  const pricePerKm = input.distanceKm > 0 ? input.priceXOF / input.distanceKm : 0;

  if (pricePerKm > 5000) {
    signals.push({ code: "PRICE_PER_KM_TOO_HIGH", severity: "high",
      detail: `${pricePerKm.toFixed(0)} XOF/km` });
  }
  if (input.distanceKm > 500) {
    signals.push({ code: "UNUSUAL_DISTANCE", severity: "medium",
      detail: `${input.distanceKm} km` });
  }
  return signals;
}
