import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should keep alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should remove other special characters", () => {
      expect(sanitizeCSSIdentifier("chart-123; {} #abc")).toBe("chart-123abc");
      expect(sanitizeCSSIdentifier("chart-123\\\"")).toBe("chart-123");
    });

    it("should handle empty strings", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe color values", () => {
      expect(sanitizeCSSValue("red")).toBe("red");
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
    });

    it("should block dangerous CSS functions and injections", () => {
      expect(sanitizeCSSValue("url('javascript:alert(1)')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("");
    });

    it("should strip CSS delimiters like semicolons, curly braces, and backslashes", () => {
      expect(sanitizeCSSValue("red; color: blue")).toBe("red color: blue");
      expect(sanitizeCSSValue("red } body { background: blue }")).toBe("red  body { background: blue ");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });
  });
});
