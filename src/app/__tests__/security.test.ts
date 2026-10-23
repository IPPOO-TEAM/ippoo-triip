import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves safe alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("my-safe_identifier123")).toBe("my-safe_identifier123");
    });

    it("strips out special characters, spaces, and punctuation", () => {
      expect(sanitizeCSSIdentifier("my identifier;")).toBe("myidentifier");
      expect(sanitizeCSSIdentifier("id#123.class")).toBe("id123class");
      expect(sanitizeCSSIdentifier("color: red;")).toBe("colorred");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves safe color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
    });

    it("strips semicolons, curly braces, and backslashes to prevent property breakout", () => {
      expect(sanitizeCSSValue("red; color: blue;")).toBe("red color: blue");
      expect(sanitizeCSSValue("blue}")).toBe("blue");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });

    it("blocks URL-based css injections, expression, and javascript links by returning transparent", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.css')")).toBe("transparent");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("transparent");
    });
  });
});
