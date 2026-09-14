import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid alphanumeric CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips special characters, dots, quotes, and brackets", () => {
      expect(sanitizeCSSIdentifier("chart-id; body { color: red; }")).toBe("chart-idbodycolorred");
      expect(sanitizeCSSIdentifier("class.name#id")).toBe("classnameid");
    });

    it("returns empty string for non-string input", () => {
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSIdentifier(123)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves safe CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("var(--primary)")).toBe("var(--primary)");
    });

    it("strips curly braces, semicolons, angle brackets, and backslashes", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black");
      expect(sanitizeCSSValue("red<script>alert(1)</script>")).toBe("redalert(1)");
    });

    it("removes dangerous dynamic functions and protocols iteratively", () => {
      expect(sanitizeCSSValue("url(https://malicious.com)")).toBe("https://malicious.com)");
      expect(sanitizeCSSValue("ururl(l(test)")).toBe("test)");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("returns empty string for non-string input", () => {
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSValue(null)).toBe("");
    });
  });
});
