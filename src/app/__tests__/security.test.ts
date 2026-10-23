import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric, hyphen, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("chart-line_123")).toBe("chart-line_123");
    });

    it("should strip spaces, punctuation, brackets, and quotes", () => {
      expect(sanitizeCSSIdentifier("chart line; [attr] 'quoted'")).toBe("chartlineattrquoted");
    });

    it("should neutralize potential CSS breaking or payload injecting chars", () => {
      expect(sanitizeCSSIdentifier("id}body{background:red;")).toBe("idbodybackgroundred");
      expect(sanitizeCSSIdentifier("id\\3c")).toBe("id3c");
    });

    it("should handle non-string gracefully", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow clean color names and hex codes", () => {
      expect(sanitizeCSSValue("red")).toBe("red");
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
    });

    it("should strip ';', '}', and '\\'", () => {
      expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
      expect(sanitizeCSSValue("red } body { background: blue")).toBe("red  body  background: blue");
      expect(sanitizeCSSValue("re\\d")).toBe("red");
    });

    it("should block 'url(' (case-insensitive) and return an empty string", () => {
      expect(sanitizeCSSValue("url('http://evil.com')")).toBe("");
      expect(sanitizeCSSValue("URL('http://evil.com')")).toBe("");
    });

    it("should block 'expression(' (case-insensitive) and return an empty string", () => {
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("");
    });

    it("should block 'javascript:' (case-insensitive) and return an empty string", () => {
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("JAVASCRIPT:alert(1)")).toBe("");
    });

    it("should block '</style>' (case-insensitive) and return an empty string", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("");
      expect(sanitizeCSSValue("red</STYLE><script>alert(1)</script>")).toBe("");
    });

    it("should handle non-string gracefully", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
