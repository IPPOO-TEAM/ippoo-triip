import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("desktop_users")).toBe("desktop_users");
    });

    it("strips invalid special characters from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1; body { display: none }")).toBe("chart-1bodydisplaynone");
      expect(sanitizeCSSIdentifier("key</style><script>alert(1)</script>")).toBe("keystylescriptalert1script");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("var(--primary-color)")).toBe("var(--primary-color)");
    });

    it("strips CSS injection vectors, HTML tags and delimiters", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redalert(1)");
      expect(sanitizeCSSValue("url('http://malicious.com/bg.png')")).toBe("'http://malicious.com/bg.png')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });
  });
});
