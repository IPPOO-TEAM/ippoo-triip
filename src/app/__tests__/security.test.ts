import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-1_test")).toBe("chart-1_test");
    });

    it("should strip spaces, curly braces, and malicious CSS selector breakout characters", () => {
      expect(sanitizeCSSIdentifier("chart-1} body { display: none; }")).toBe(
        "chart-1bodydisplaynone"
      );
      expect(sanitizeCSSIdentifier("my-class; color: red")).toBe(
        "my-classcolorred"
      );
    });

    it("should handle non-string input safely", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid color codes and CSS values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("should sanitize CSS declaration breakout attempts", () => {
      expect(sanitizeCSSValue("red; background: url('evil.com')")).toBe("red background:");
      expect(sanitizeCSSValue("blue; } body { display: none; }")).toBe("blue body display: none");
    });

    it("should strip malicious keywords like javascript: and expression()", () => {
      expect(sanitizeCSSValue("expression(alert(1))")).toBe(")");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should handle nested injection bypass attempts", () => {
      expect(sanitizeCSSValue("javascjavascript:ript:alert(1)")).toBe("alert(1)");
    });

    it("should handle non-string input safely", () => {
      expect(sanitizeCSSValue(null as unknown as string)).toBe("");
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
