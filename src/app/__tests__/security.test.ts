import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid alphanumeric, hyphen, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("chart-1_test")).toBe("chart-1_test");
      expect(sanitizeCSSIdentifier("desktopColor")).toBe("desktopColor");
    });

    it("strips invalid characters and potential injection payloads", () => {
      expect(sanitizeCSSIdentifier('chart"] { background: red; }')).toBe("chartbackgroundred");
      expect(sanitizeCSSIdentifier("chart<script>alert(1)</script>")).toBe("chartscriptalert1script");
    });

    it("handles non-string input safely", () => {
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows safe CSS values like hex colors, hsl, rgb, and named colors", () => {
      expect(sanitizeCSSValue("#2563eb")).toBe("#2563eb");
      expect(sanitizeCSSValue("hsl(220, 90%, 56%)")).toBe("hsl(220, 90%, 56%)");
      expect(sanitizeCSSValue("rgb(37, 99, 235)")).toBe("rgb(37, 99, 235)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips HTML tags, backslashes, block delimiters, and comment markers", () => {
      expect(sanitizeCSSValue("}</style><script>alert(1)</script>")).toBe("alert(1)");
      expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
      expect(sanitizeCSSValue("/* comment */ red")).toBe(" comment  red");
    });

    it("neutralizes dangerous CSS functions like url() and expression()", () => {
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("javascript:alert(1))");
      expect(sanitizeCSSValue("EXPRESSION (alert(1))")).toBe("alert(1))");
    });

    it("handles non-string input safely", () => {
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing invalid input types
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
