import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid alphanumeric identifiers, hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_test")).toBe("chart-123_test");
    });

    it("strips illegal characters and XSS attempts from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123</style><script>alert(1)</script>")).toBe("chart-123stylescriptalert1script");
      expect(sanitizeCSSIdentifier("foo bar.class#id")).toBe("foobarclassid");
    });

    it("handles non-string values gracefully", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows valid CSS color values", () => {
      expect(sanitizeCSSValue("hsl(var(--primary))")).toBe("hsl(var(--primary))");
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    });

    it("strips CSS rule delimiters and brackets to prevent selector escape", () => {
      expect(sanitizeCSSValue("red; } body { background: red; }")).toBe("red  body  background: red");
    });

    it("strips dangerous function calls like url(), expression(), and javascript:", () => {
      expect(sanitizeCSSValue("url('http://evil.com')")).toBe("'http://evil.com')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("handles nested obfuscated token attacks", () => {
      expect(sanitizeCSSValue("ururl(http://evil.com)")).toBe("urhttp://evil.com)");
    });

    it("strips HTML tags and comments", () => {
      expect(sanitizeCSSValue("red/* comment */<script>alert(1)</script>")).toBe("redalert(1)");
    });

    it("handles non-string values gracefully", () => {
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
