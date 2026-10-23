import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-1_test")).toBe("chart-1_test");
      expect(sanitizeCSSIdentifier("desktopColor")).toBe("desktopColor");
    });

    it("should strip spaces, HTML tags, and special characters", () => {
      expect(sanitizeCSSIdentifier("chart 1 <script>")).toBe("chart1script");
      expect(sanitizeCSSIdentifier("id; background: red;")).toBe("idbackgroundred");
      expect(sanitizeCSSIdentifier("foo'\"{}()")).toBe("foo");
    });

    it("should handle non-string inputs gracefully", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve valid CSS color and style values", () => {
      expect(sanitizeCSSValue("#2563eb")).toBe("#2563eb");
      expect(sanitizeCSSValue("hsl(220, 90%, 56%)")).toBe("hsl(220, 90%, 56%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("should strip HTML tags and scripts", () => {
      expect(sanitizeCSSValue("red<script>alert(1)</script>")).toBe("redalert(1)");
    });

    it("should strip CSS comment blocks and dangerous delimiters", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black");
    });

    it("should strip dangerous CSS functions like url() or expression()", () => {
      expect(sanitizeCSSValue("url('https://evil.com/xss.js')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("red url('http://malicious.com')")).toBe("red");
    });

    it("should handle non-string inputs gracefully", () => {
      expect(sanitizeCSSValue(null as unknown as string)).toBe("");
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
