import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip invalid characters that could be used for CSS/HTML injection", () => {
      expect(sanitizeCSSIdentifier('chart-id"] { color: red; }')).toBe("chart-idcolorred");
      expect(sanitizeCSSIdentifier("id<script>alert(1)</script>")).toBe("idscriptalert1script");
    });

    it("should handle empty or non-string input safely", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      // @ts-expect-constant-type-check
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("should block dangerous URL or script injection patterns", () => {
      expect(sanitizeCSSValue("red; background: url('http://evil.com/xss.jpg')")).toBe("");
      expect(sanitizeCSSValue("expression(alert('xss'))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red}</style><script>alert(1)</script>")).toBe("");
    });

    it("should strip block breaking characters like semicolons and braces", () => {
      expect(sanitizeCSSValue("red; color: blue")).toBe("red color: blue");
      expect(sanitizeCSSValue("red} body { background: black; }")).toBe("red body  background: black");
    });

    it("should handle empty or non-string input safely", () => {
      expect(sanitizeCSSValue("")).toBe("");
      // @ts-expect-constant-type-check
      expect(sanitizeCSSValue(null as unknown as string)).toBe("");
    });
  });
});
