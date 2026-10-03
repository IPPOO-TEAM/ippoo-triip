import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric, hyphen, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip malicious characters from CSS identifiers", () => {
      expect(sanitizeCSSIdentifier('chart"; body { display: none; }')).toBe("chartbodydisplaynone");
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe("scriptalert1script");
    });

    it("should fallback to default if sanitized result is empty", () => {
      expect(sanitizeCSSIdentifier("!@#$%^&*()")).toBe("default");
      expect(sanitizeCSSIdentifier("!@#$", "custom-fallback")).toBe("custom-fallback");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve valid CSS values like hex, rgb, and standard names", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("should strip CSS injection and XSS payloads", () => {
      expect(sanitizeCSSValue('red; } body { background: red; }')).toBe("red  body  background: red ");
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("javascript:alert(1))");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("<script>alert(1)</script>")).toBe("alert(1)");
    });
  });
});
