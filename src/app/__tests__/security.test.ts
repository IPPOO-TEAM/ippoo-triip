import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid alphanumeric, dash, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips special characters, quotes, and HTML break-outs from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123'; alert(1);")).toBe("chart-123alert1");
      expect(sanitizeCSSIdentifier("</style><script>alert(1)</script>")).toBe("stylescriptalert1script");
    });

    it("handles non-string values gracefully", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows normal CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(0, 255, 0)")).toBe("rgb(0, 255, 0)");
    });

    it("strips HTML closing tags and script tags", () => {
      expect(sanitizeCSSValue("red; </style><script>alert(1)</script>")).toBe("red alert(1)");
    });

    it("strips CSS rule delimiters like braces and semicolons", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none");
    });

    it("neutralizes url(...) and expression(...) CSS functions", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.js')")).toBe("'http://evil.com/xss.js')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("strips backslashes and comments", () => {
      expect(sanitizeCSSValue("red /* comment */ \\53\\43")).toBe("red  5343");
    });

    it("handles non-string values gracefully", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
    });
  });
});
