import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("primary_color")).toBe("primary_color");
      expect(sanitizeCSSIdentifier("abc123XYZ")).toBe("abc123XYZ");
    });

    it("strips malicious special characters and quotes from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1'; alert(1);")).toBe("chart-1alert1");
      expect(sanitizeCSSIdentifier('chart"}> <script>alert(1)</script>')).toBe("chartscriptalert1script");
      expect(sanitizeCSSIdentifier("class.name#id")).toBe("classnameid");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(123 as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("strips HTML tags, backslashes, CSS comments, and block delimiters", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black ");
      expect(sanitizeCSSValue("blue</style><script>alert(1)</script>")).toBe("bluealert(1)");
      expect(sanitizeCSSValue("red/*comment*/green")).toBe("redgreen");
      expect(sanitizeCSSValue("red\\00000a")).toBe("red00000a");
    });

    it("disables dangerous CSS function invocations like url() and expression()", () => {
      expect(sanitizeCSSValue("url('https://malicious.com/payload')")).toBe("'https://malicious.com/payload')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSValue(undefined as any)).toBe("");
      expect(sanitizeCSSValue(456 as any)).toBe("");
    });
  });
});
