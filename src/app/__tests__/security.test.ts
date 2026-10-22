import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("main_theme_1")).toBe("main_theme_1");
    });

    it("strips malicious special characters and XSS attempts", () => {
      expect(sanitizeCSSIdentifier("chart:123</style>")).toBe("chart123style");
      expect(sanitizeCSSIdentifier("a; background: red;")).toBe("abackgroundred");
      expect(sanitizeCSSIdentifier("valid-id#123")).toBe("valid-id123");
    });

    it("returns fallback if identifier becomes empty", () => {
      expect(sanitizeCSSIdentifier("!@#$%^&*()")).toBe("default");
      expect(sanitizeCSSIdentifier("!@#$", "fallback_id")).toBe("fallback_id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips HTML tags and script elements", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redalert(1)");
    });

    it("strips CSS delimiters and escape characters", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black ");
    });

    it("strips unsafe CSS function calls like url() and expression()", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.jpg')")).toBe("'http://evil.com/xss.jpg')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });
  });
});
