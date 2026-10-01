import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("primary_color")).toBe("primary_color");
      expect(sanitizeCSSIdentifier("theme1")).toBe("theme1");
    });

    it("strips special characters and spaces from CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123; } body { display:none }")).toBe("chart-123bodydisplaynone");
      expect(sanitizeCSSIdentifier("key\"</style><script>alert(1)</script>")).toBe("keystylescriptalert1script");
      expect(sanitizeCSSIdentifier("color: red;")).toBe("colorred");
    });

    it("uses fallback if sanitization results in an empty string", () => {
      expect(sanitizeCSSIdentifier("!!!", "fallback-id")).toBe("fallback-id");
      expect(sanitizeCSSIdentifier("   ")).toBe("chart-default");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSIdentifier(null)).toBe("chart-default");
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSIdentifier(undefined, "fb")).toBe("fb");
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSIdentifier(123)).toBe("chart-default");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves safe CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips CSS rule delimiters, comment blocks, backslashes, and tags", () => {
      expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
      expect(sanitizeCSSValue("#fff} body { background: black }")).toBe("#fff body  background: black ");
      expect(sanitizeCSSValue("red/* comment */blue")).toBe("redblue");
      expect(sanitizeCSSValue("</style><script>alert('xss')</script>")).toBe("alert('xss')");
    });

    it("strips dangerous functions like url() and expression()", () => {
      expect(sanitizeCSSValue("url('https://evil.com/xss.js')")).toBe("'https://evil.com/xss.js')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
