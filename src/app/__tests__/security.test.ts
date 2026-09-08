import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid identifier characters (alphanumeric, hyphen, underscore)", () => {
      expect(sanitizeCSSIdentifier("chart-1_aB")).toBe("chart-1_aB");
    });

    it("strips special characters, brackets, quotes, and whitespace", () => {
      expect(sanitizeCSSIdentifier("chart-1; body { background: red; }")).toBe(
        "chart-1bodybackgroundred",
      );
      expect(sanitizeCSSIdentifier("id'\"<>")).toBe("id");
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSIdentifier(123 as any)).toBe("");
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows safe CSS values (hex colors, rgb, hsl, dimensions)", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("12px")).toBe("12px");
    });

    it("strips CSS rule delimiters, comment tags, and HTML brackets", () => {
      const malicious = "red; } body { background: black; } /* comment */ <script>";
      expect(sanitizeCSSValue(malicious)).toBe("red  body  background: black");
    });

    it("strips dangerous function calls like url(), expression(), javascript:", () => {
      expect(sanitizeCSSValue("url(https://attacker.com/xss)")).toBe("https://attacker.com/xss)");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("prevents nested bypass attempts", () => {
      expect(sanitizeCSSValue("url(url(https://attacker.com))")).toBe("https://attacker.com))");
      expect(sanitizeCSSValue("javajavascript:script:alert(1)")).toBe("alert(1)");
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSValue(undefined as any)).toBe("");
      expect(sanitizeCSSValue(100 as any)).toBe("");
    });
  });
});
