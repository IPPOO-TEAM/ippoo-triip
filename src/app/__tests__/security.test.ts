import { describe, expect, it } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security utils", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("primary_color")).toBe("primary_color");
    });

    it("strips invalid special characters and injection vectors", () => {
      expect(sanitizeCSSIdentifier("chart-123} body { background: red; }")).toBe(
        "chart-123bodybackgroundred"
      );
      expect(sanitizeCSSIdentifier('chart"; alert(1);')).toBe("chartalert1");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
    });

    it("strips CSS injection delimiters and malicious URLs/scripts", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("alert(1))");
    });
  });
});
