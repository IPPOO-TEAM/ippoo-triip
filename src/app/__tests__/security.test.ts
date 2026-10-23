import { describe, expect, it } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows standard alphanumeric identifiers, hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips special characters, spaces, and brackets that could lead to CSS breakout", () => {
      expect(sanitizeCSSIdentifier('chart-123] { color: red; } "')).toBe(
        "chart-123colorred",
      );
      expect(sanitizeCSSIdentifier("foo; bar")).toBe("foobar");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing runtime robustness
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing runtime robustness
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows standard CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("strips characters that allow rule closing or statement separation", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red } .body { display: none }")).toBe(
        "red  .body  display: none ",
      );
    });

    it("blocks dangerous payloads like url(), expression(), javascript:, and style tags", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.css')")).toBe("");
      expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red; </style><script>alert(1)</script>")).toBe("");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing runtime robustness
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing runtime robustness
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
