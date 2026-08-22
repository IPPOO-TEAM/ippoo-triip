import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security utils", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_test")).toBe("chart-123_test");
    });

    it("strips special characters and space breaks", () => {
      expect(sanitizeCSSIdentifier("chart-123; } body { display:none }")).toBe("chart-123bodydisplaynone");
      expect(sanitizeCSSIdentifier("id<script>alert(1)</script>")).toBe("idscriptalert1script");
    });

    it("handles non-string inputs gracefully", () => {
      // @ts-expect-error testing invalid runtime argument
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing invalid runtime argument
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows standard CSS colors and units", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    });

    it("strips control syntax like semicolons, curly braces, and backslashes", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("blue; } body { color: red; }")).toBe("blue  body  color: red");
    });

    it("blocks dangerous payloads like url(), expression(), javascript:, and style tag closes", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.css')")).toBe("");
      expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red; </style><script>alert(1)</script>")).toBe("");
    });

    it("handles non-string inputs gracefully", () => {
      // @ts-expect-error testing invalid runtime argument
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing invalid runtime argument
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
