import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("theme_primary_key")).toBe("theme_primary_key");
    });

    it("strips special characters and CSS injection tokens", () => {
      expect(sanitizeCSSIdentifier("chart-123; } body { display:none }")).toBe("chart-123bodydisplaynone");
      expect(sanitizeCSSIdentifier("id\"'<>")).toBe("id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS colors and values", () => {
      expect(sanitizeCSSValue("#006A6B")).toBe("#006A6B");
      expect(sanitizeCSSValue("rgb(0, 106, 107)")).toBe("rgb(0, 106, 107)");
      expect(sanitizeCSSValue("hsl(180, 100%, 21%)")).toBe("hsl(180, 100%, 21%)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips CSS injection delimiters and comment markers", () => {
      const malicious = "red; } body { background: red; } /*";
      expect(sanitizeCSSValue(malicious)).toBe("red  body  background: red  ");
    });

    it("strips HTML tag attempts and angle brackets", () => {
      const malicious = "red</style><script>alert(1)</script>";
      expect(sanitizeCSSValue(malicious)).toBe("redalert(1)");
    });

    it("strips dangerous function calls like url() and expression()", () => {
      expect(sanitizeCSSValue("url('http://attacker.com/leak')")).toBe("'http://attacker.com/leak')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });
  });
});
