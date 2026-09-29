import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip spaces, braces, quotes, and special characters", () => {
      expect(sanitizeCSSIdentifier("chart-id; body { color: red; }")).toBe("chart-idbodycolorred");
      expect(sanitizeCSSIdentifier("id'\"<>")).toBe("id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve valid hex, rgb, or color names", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("should strip malicious characters and block closing tags/braces", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("red/stylescriptalert(1)/script");
    });

    it("should neutralize url() and expression() injections", () => {
      expect(sanitizeCSSValue("url('http://malicious.com')")).toBe("'http://malicious.com')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });
  });
});
