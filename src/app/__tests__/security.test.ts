import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / CSS sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
      expect(sanitizeCSSIdentifier("PrimaryColor")).toBe("PrimaryColor");
    });

    it("strips invalid characters and injection payloads", () => {
      expect(sanitizeCSSIdentifier('chart"}\'><script>alert(1)</script>')).toBe(
        "chartscriptalert1script",
      );
      expect(sanitizeCSSIdentifier("foo.bar;baz")).toBe("foobarbaz");
      expect(sanitizeCSSIdentifier("   spaces   ")).toBe("spaces");
    });

    it("handles empty or non-string inputs", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves safe CSS values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(120, 100%, 50%)")).toBe("hsl(120, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("strips HTML tags, delimiters, and comment markers", () => {
      expect(sanitizeCSSValue('red; /* comment */ background: url("x")')).toBe(
        'red  background: "x")',
      );
      expect(sanitizeCSSValue("<script>alert(1)</script>red")).toBe("alert(1)red");
      expect(sanitizeCSSValue("{ color: red; }")).toBe(" color: red ");
    });

    it("iteratively strips unsafe keywords to prevent nested bypasses", () => {
      expect(sanitizeCSSValue("javajavascript:script:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("expexpression(ression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("ururl(l(http://evil.com)")).toBe("http://evil.com)");
      expect(sanitizeCSSValue("ststyleyle")).toBe("");
    });

    it("handles empty or non-string inputs", () => {
      expect(sanitizeCSSValue("")).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
