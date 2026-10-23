import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid alphanumeric, dash, underscore, and dot characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
      expect(sanitizeCSSIdentifier(".dark")).toBe(".dark");
    });

    it("strips characters that could break out of CSS selectors or attributes", () => {
      expect(sanitizeCSSIdentifier('chart-123"] { background: red; }')).toBe(
        "chart-123backgroundred"
      );
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe(
        "scriptalert1script"
      );
    });

    it("handles non-string inputs gracefully", () => {
      // @ts-expect-constant test non-string
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows safe CSS values such as hex, rgb, or named colors", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("strips curly braces, semicolons, and angle brackets to prevent rule injection", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe(
        "red  body  display: none"
      );
      expect(sanitizeCSSValue("blue</style><script>alert(1)</script>")).toBe(
        "blue/stylescriptalert(1)/script"
      );
    });

    it("strips url(), expression(), and javascript: protocols", () => {
      expect(
        sanitizeCSSValue("url('http://attacker.com/cookie')")
      ).toBe("");
      expect(sanitizeCSSValue("expression('alert(1)')")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("prevents nested bypass attempts", () => {
      expect(sanitizeCSSValue("javajavascript:script:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("ururl()l()")).toBe("");
    });
  });
});
