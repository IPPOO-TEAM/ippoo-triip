import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips malicious characters and selector breakouts", () => {
      expect(sanitizeCSSIdentifier("chart-123} body { background: red; }")).toBe(
        "chart-123bodybackgroundred"
      );
      expect(sanitizeCSSIdentifier("id; color: red")).toBe("idcolorred");
      expect(sanitizeCSSIdentifier('key" onclick="alert(1)"')).toBe("keyonclickalert1");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("strips rule-ending semicolons and brackets", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red} body { color: red")).toBe("red body  color: red");
    });

    it("strips dangerous function calls and protocols", () => {
      expect(sanitizeCSSValue("url('http://evil.com/x.css')")).toBe("http://evil.com/x.css)");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("escapes/strips HTML tag attempts to prevent XSS breakout", () => {
      expect(sanitizeCSSValue("red; </style><script>alert(1)</script>")).toBe(
        "red &lt;/style&gt;&lt;script&gt;alert(1)&lt;/script&gt;"
      );
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
