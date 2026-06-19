import { describe, it, expect } from "vitest";
import { detectOperator, operatorLabel, operatorUssdCode } from "../services/mobile-money";

describe("mobile-money / detectOperator (Bénin)", () => {
  it("détecte MTN sur préfixe 97", () => {
    expect(detectOperator("+22997123456")).toBe("mtn_momo");
    expect(detectOperator("97123456")).toBe("mtn_momo");
  });

  it("détecte Moov sur préfixe 94", () => {
    expect(detectOperator("+22994000001")).toBe("moov_money");
  });

  it("détecte Celtiis sur préfixe 90", () => {
    expect(detectOperator("+22990000002")).toBe("celtiis_cash");
  });

  it("retourne null sur numéro trop court", () => {
    expect(detectOperator("9")).toBe(null);
  });

  it("expose les labels et codes USSD", () => {
    expect(operatorLabel("mtn_momo")).toBe("MTN MoMo");
    expect(operatorUssdCode("moov_money")).toBe("*555#");
  });
});
