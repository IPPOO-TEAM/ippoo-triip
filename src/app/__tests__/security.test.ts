import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should preserve valid CSS identifiers (alphanumeric, hyphens, underscores)", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("chart_456-abc")).toBe("chart_456-abc");
    });

    it("should strip spaces, semicolons, curly braces, and other dangerous chars", () => {
      expect(sanitizeCSSIdentifier("chart-123;")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("chart-123} body { background: red; }")).toBe(
        "chart-123bodybackgroundred",
      );
      expect(sanitizeCSSIdentifier("chart%def")).toBe("chartdef");
      expect(sanitizeCSSIdentifier("chart\\123")).toBe("chart123");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe CSS color values", () => {
      expect(sanitizeCSSValue("red")).toBe("red");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
    });

    it("should block unsafe expressions/URLs (url, expression, javascript:, </style>)", () => {
      expect(sanitizeCSSValue("url('http://attacker.com')")).toBe("");
      expect(sanitizeCSSValue("URL('http://attacker.com')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    });

    it("should strip dangerous punctuation characters (;, }, and \\)", () => {
      expect(sanitizeCSSValue("red;")).toBe("red");
      expect(sanitizeCSSValue("blue; background: red")).toBe("blue background: red");
      expect(sanitizeCSSValue("green}")).toBe("green");
      expect(sanitizeCSSValue("color\\")).toBe("color");
    });
  });
});
