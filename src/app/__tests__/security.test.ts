import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips special characters and CSS injection tokens from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-id}\nbody{background:red}")).toBe(
        "chart-idbodybackgroundred",
      );
      expect(sanitizeCSSIdentifier('chart" style="color:red"')).toBe(
        "chartstylecolorred",
      );
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 50%, 50%)")).toBe("hsl(210, 50%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("strips HTML tags and CSS syntax delimiters", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe(
        "red  body  display: none",
      );
      expect(sanitizeCSSValue('<script>alert(1)</script>#000000')).toBe(
        "alert(1)#000000",
      );
    });

    it("iteratively strips dangerous CSS functions like url() and expression()", () => {
      expect(
        sanitizeCSSValue("url(javascript:alert(1))"),
      ).toBe("alert(1))");
      expect(
        sanitizeCSSValue("ururl(l(https://evil.com/xss.css)"),
      ).toBe("https://evil.com/xss.css)");
    });

    it("handles non-string input safely", () => {
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
