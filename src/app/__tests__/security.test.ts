import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization - CSS Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves safe alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-1_test")).toBe("chart-1_test");
    });

    it("strips malicious characters, spaces, and delimiters", () => {
      expect(sanitizeCSSIdentifier("chart-1; } body { display:none }")).toBe("chart-1bodydisplaynone");
      expect(sanitizeCSSIdentifier('chart" onerror="alert(1)"')).toBe("chartonerroralert1");
    });

    it("uses fallback when input becomes empty", () => {
      expect(sanitizeCSSIdentifier("!!!", "fallback-id")).toBe("fallback-id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("strips HTML tags, backslashes, CSS delimiters, and comments", () => {
      const malicious = "</style><script>alert('xss')</script>/* comment */ { background: red; }";
      const sanitized = sanitizeCSSValue(malicious);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</style>");
      expect(sanitized).not.toContain("{");
      expect(sanitized).not.toContain("}");
      expect(sanitized).not.toContain(";");
    });

    it("strips dangerous CSS function calls like url() and expression()", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss')")).toBe("'http://evil.com/xss')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });
  });
});
