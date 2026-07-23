import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow alphanumeric, hyphen, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("valid-id_123")).toBe("valid-id_123");
    });

    it("should strip spaces, punctuation, and other special characters", () => {
      expect(sanitizeCSSIdentifier("invalid id!@#")).toBe("invalidid");
      expect(sanitizeCSSIdentifier("chart;body")).toBe("chartbody");
      expect(sanitizeCSSIdentifier("my-key:123")).toBe("my-key123");
    });

    it("should strip characters capable of breaking out of a selector/block", () => {
      expect(sanitizeCSSIdentifier("id} body { background: red; }")).toBe("idbodybackgroundred");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(120, 100%, 50%)")).toBe("hsl(120, 100%, 50%)");
    });

    it("should strip delimiters like semicolons, curly braces, and backslashes", () => {
      expect(sanitizeCSSValue("red;")).toBe("red");
      expect(sanitizeCSSValue("blue}")).toBe("blue");
      expect(sanitizeCSSValue("green\\")).toBe("green");
      expect(sanitizeCSSValue("red; background: url('http://evil.com')")).toBe("transparent");
    });

    it("should neutralize url() injections", () => {
      expect(sanitizeCSSValue("url('http://attacker.com/cookie')")).toBe("transparent");
      expect(sanitizeCSSValue("URL('https://attacker.com')")).toBe("transparent");
    });

    it("should neutralize expression() injections", () => {
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
      expect(sanitizeCSSValue("EXPRESSION(1)")).toBe("transparent");
    });

    it("should neutralize javascript: protocol", () => {
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
    });

    it("should neutralize closing style tags to prevent HTML breakout", () => {
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("transparent");
      expect(sanitizeCSSValue("</Style>")).toBe("transparent");
    });
  });
});
