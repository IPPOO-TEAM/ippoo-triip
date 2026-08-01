import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric identifiers, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip spaces, punctuation, and other non-alphanumeric characters", () => {
      expect(sanitizeCSSIdentifier("chart; body { color: red; }")).toBe("chartbodycolorred");
      expect(sanitizeCSSIdentifier("chart:hover")).toBe("charthover");
      expect(sanitizeCSSIdentifier("id\\123")).toBe("id123");
      expect(sanitizeCSSIdentifier("id\"'")).toBe("id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow simple safe colors and values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(120, 100%, 50%)")).toBe("hsl(120, 100%, 50%)");
    });

    it("should block dangerous expressions, urls, javascript, or styles", () => {
      expect(sanitizeCSSValue("url(https://malicious.site)")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    });

    it("should strip syntax breaking characters like semicolons, closing curly braces, and backslashes", () => {
      expect(sanitizeCSSValue("red;")).toBe("red");
      expect(sanitizeCSSValue("red; color: blue; }")).toBe("red color: blue ");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });
  });
});
