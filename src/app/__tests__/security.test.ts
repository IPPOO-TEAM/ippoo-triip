import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves safe alphanumeric, hyphen, and underscore characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips malicious characters like quotes, brackets, semicolons, and spaces", () => {
      expect(sanitizeCSSIdentifier(`chart-id"; body { display: none; }`)).toBe(
        "chart-idbodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe(
        "scriptalert1script",
      );
    });

    it("handles non-string values safely", () => {
      expect(sanitizeCSSIdentifier(123 as any)).toBe("");
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips HTML tags and script execution attempts", () => {
      expect(sanitizeCSSValue("red</style><script>alert('xss')</script>")).toBe(
        "redalert('xss')",
      );
    });

    it("strips CSS rule delimiters like semicolons and braces to prevent CSS breakout", () => {
      expect(sanitizeCSSValue("red; body { background: black; }")).toBe(
        "red body  background: black",
      );
    });

    it("strips dangerous CSS function calls like url() and expression()", () => {
      expect(sanitizeCSSValue("url('http://evil.com/leak')")).toBe(
        "'http://evil.com/leak')",
      );
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSValue(undefined as any)).toBe("");
      expect(sanitizeCSSValue(123 as any)).toBe("");
    });
  });
});
