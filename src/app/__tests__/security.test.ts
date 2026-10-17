import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves alphanumeric characters, dashes, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips malicious CSS injection tokens from identifiers", () => {
      expect(sanitizeCSSIdentifier('chart"] { color: red; }')).toBe("chartcolorred");
      expect(sanitizeCSSIdentifier("foo; background: url(x)")).toBe("foobackgroundurlx");
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe("scriptalert1script");
    });

    it("handles non-string inputs safely", () => {
      // @ts-ignore
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-ignore
      expect(sanitizeCSSIdentifier(12345)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips CSS injection breaks and curly braces", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none ");
      expect(sanitizeCSSValue("blue}\n { color: red }")).toBe("blue\n  color: red ");
    });

    it("disables url() and expression() function calls", () => {
      expect(sanitizeCSSValue("url('javascript:alert(1)')")).toBe("'javascript:alert(1)')");
      expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("alert(1))");
    });

    it("strips HTML tags and comment markers", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redalert(1)");
      expect(sanitizeCSSValue("/* comment */ red")).toBe(" red");
    });

    it("handles non-string inputs safely", () => {
      // @ts-ignore
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
