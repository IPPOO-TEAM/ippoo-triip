import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / CSS sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows standard alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips special characters, quotes, and HTML tag delimiters", () => {
      expect(sanitizeCSSIdentifier('chart-123" <script>')).toBe("chart-123script");
      expect(sanitizeCSSIdentifier("id; background: red")).toBe("idbackgroundred");
    });

    it("handles null/undefined or non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(123 as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows valid CSS color strings, hex values, and named colors with embedded sub-words", () => {
      expect(sanitizeCSSValue("hsl(var(--chart-1))")).toBe("hsl(var(--chart-1))");
      expect(sanitizeCSSValue("#1E6091")).toBe("#1E6091");
      expect(sanitizeCSSValue("rgba(255, 0, 0, 0.5)")).toBe("rgba(255, 0, 0, 0.5)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("removes injection breakout delimiters and comment blocks", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none");
      expect(sanitizeCSSValue("blue/* comment */")).toBe("blue");
    });

    it("scrubs dangerous CSS functions and protocols recursively", () => {
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("alert(1))");
    });

    it("strips HTML tag delimiters", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("red/stylescriptalert(1)/script");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
