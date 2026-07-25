import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should preserve valid CSS identifiers (a-z, A-Z, 0-9, -, _)", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip spaces and special characters", () => {
      expect(sanitizeCSSIdentifier("chart id with spaces!")).toBe("chartidwithspaces");
      expect(sanitizeCSSIdentifier("chart-id#123.test")).toBe("chart-id123test");
    });

    it("should prevent selector injection breakouts", () => {
      expect(sanitizeCSSIdentifier("} body { background: red; }")).toBe("bodybackgroundred");
    });

    it("should handle non-string inputs gracefully", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve safe color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(200, 100%, 50%)")).toBe("hsl(200, 100%, 50%)");
      expect(sanitizeCSSValue("tomato")).toBe("tomato");
    });

    it("should strip malicious structural characters (;, }, \\)", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("blue } body { background: red")).toBe("blue  body { background: red");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });

    it("should block CSS injection vectors and return transparent", () => {
      expect(sanitizeCSSValue("url(https://attacker.com/cookie)")).toBe("transparent");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("transparent");
    });

    it("should be case-insensitive when blocking injection vectors", () => {
      expect(sanitizeCSSValue("URL('https://malicious.com')")).toBe("transparent");
      expect(sanitizeCSSValue("Expression(1)")).toBe("transparent");
      expect(sanitizeCSSValue("JAVASCRIPT:alert")).toBe("transparent");
    });

    it("should handle non-string inputs gracefully", () => {
      expect(sanitizeCSSValue(null as any)).toBe("transparent");
    });
  });
});
