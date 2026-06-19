import { describe, it, expect, beforeEach } from "vitest";
import { analyzeLoginAttempt, analyzeRide } from "../services/antifraud";

beforeEach(() => { localStorage.clear(); });

describe("antifraud / analyzeLoginAttempt", () => {
  it("flag OTP trop rapide", () => {
    const { signals, score } = analyzeLoginAttempt({
      phone: "+22997000000", otpEnteredInMs: 800,
    });
    expect(signals.some((s) => s.code === "OTP_TOO_FAST")).toBe(true);
    expect(score).toBeGreaterThanOrEqual(60);
  });

  it("flag géolocalisation hors Bénin", () => {
    const { signals } = analyzeLoginAttempt({
      phone: "+22997000000", otpEnteredInMs: 5000,
      geoLat: 48.85, geoLng: 2.35, // Paris
    });
    expect(signals.some((s) => s.code === "GEO_OUT_OF_COUNTRY")).toBe(true);
  });

  it("ne flag rien sur login normal à Cotonou", () => {
    const { signals } = analyzeLoginAttempt({
      phone: "+22997000000", otpEnteredInMs: 8000,
      geoLat: 6.37, geoLng: 2.39,
    });
    expect(signals.length).toBe(0);
  });
});

describe("antifraud / analyzeRide", () => {
  it("flag prix/km anormal", () => {
    const signals = analyzeRide({ priceXOF: 100_000, distanceKm: 5, serviceType: "taxi_moto" });
    expect(signals.some((s) => s.code === "PRICE_PER_KM_TOO_HIGH")).toBe(true);
  });
});
