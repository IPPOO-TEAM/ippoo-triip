import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("desktop_users")).toBe("desktop_users");
    });

    it("strips special characters and space breaks", () => {
      expect(sanitizeCSSIdentifier("chart-123; body { display: none; }")).toBe(
        "chart-123bodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe(
        "scriptalert1script",
      );
    });

    it("handles non-string inputs gracefully", () => {
      // @ts-expect-error testing runtime resilience
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing runtime resilience
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows safe CSS values like hex, hsl, rgb, and named colors", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgba(0, 0, 0, 0.5)")).toBe("rgba(0, 0, 0, 0.5)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips CSS injection breakout characters, HTML tags, comments, and dangerous function calls", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe(
        "red  body  display: none ",
      );
      expect(
        sanitizeCSSValue("url('javascript:alert(1)')"),
      ).toBe("'javascript:alert(1)')");
      expect(
        sanitizeCSSValue("expression(alert(1))"),
      ).toBe("alert(1))");
      expect(sanitizeCSSValue("/* inline comment */ #000")).toBe(" #000");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("alert(1)");
    });

    it("handles non-string inputs gracefully", () => {
      // @ts-expect-error testing runtime resilience
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing runtime resilience
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
