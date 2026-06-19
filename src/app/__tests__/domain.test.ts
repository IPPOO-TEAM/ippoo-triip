import { describe, it, expect } from "vitest";
import {
  PhoneBJSchema, MoneyXOFSchema, RideSchema, UserSchema, GeoPointSchema,
} from "../types/domain";

describe("domain / PhoneBJSchema", () => {
  it("accepte un numéro béninois avec ou sans indicatif", () => {
    expect(PhoneBJSchema.safeParse("+22997123456").success).toBe(true);
    expect(PhoneBJSchema.safeParse("97123456").success).toBe(true);
  });
  it("rejette un numéro trop court ou alphanumérique", () => {
    expect(PhoneBJSchema.safeParse("123").success).toBe(false);
    expect(PhoneBJSchema.safeParse("abc").success).toBe(false);
  });
});

describe("domain / MoneyXOFSchema", () => {
  it("refuse les montants négatifs et fractionnés", () => {
    expect(MoneyXOFSchema.safeParse(-1).success).toBe(false);
    expect(MoneyXOFSchema.safeParse(10.5).success).toBe(false);
    expect(MoneyXOFSchema.safeParse(2500).success).toBe(true);
  });
});

describe("domain / GeoPointSchema", () => {
  it("borne lat/lng", () => {
    expect(GeoPointSchema.safeParse({ lat: 6.37, lng: 2.39 }).success).toBe(true);
    expect(GeoPointSchema.safeParse({ lat: 999, lng: 2 }).success).toBe(false);
  });
});

describe("domain / RideSchema", () => {
  it("valide une course complète", () => {
    const r = RideSchema.safeParse({
      id: "ride_1",
      clientId: "u_1",
      serviceType: "taxi_moto",
      status: "requested",
      origin: { lat: 6.37, lng: 2.39 },
      destination: { lat: 6.5, lng: 2.6 },
      priceXOF: 2500,
      createdAt: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });
});

describe("domain / UserSchema", () => {
  it("applique les valeurs par défaut", () => {
    const u = UserSchema.parse({
      id: "u_1", role: "client",
      fullName: "Kossi", phone: "+22997000000",
      createdAt: new Date().toISOString(),
    });
    expect(u.city).toBe("Cotonou");
    expect(u.language).toBe("fr");
    expect(u.kycStatus).toBe("pending");
  });
});
