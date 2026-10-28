import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
      expect(sanitizeCSSIdentifier("desktop")).toBe("desktop");
    });

    it("strips special characters and CSS injection tokens from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart; body { display: none; }")).toBe("chartbodydisplaynone");
      expect(sanitizeCSSIdentifier("key\"}'><script>alert(1)</script>")).toBe("keyscriptalert1script");
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSIdentifier(123 as any)).toBe("");
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips CSS injection break-out attempts", () => {
      expect(sanitizeCSSValue("red; } body { background: red; }")).toBe("red  body  background: red ");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("strips HTML tags and comment blocks", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redalert(1)");
      expect(sanitizeCSSValue("red /* comment */ blue")).toBe("red  blue");
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSValue(undefined as any)).toBe("");
      expect(sanitizeCSSValue({} as any)).toBe("");
    });
  });
});
