import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip invalid characters like dots, spaces, quotes, and HTML tags", () => {
      expect(sanitizeCSSIdentifier("chart.123 <script>alert(1)</script>")).toBe(
        "chart123scriptalert1script",
      );
    });

    it("should handle empty inputs gracefully", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow standard CSS color values", () => {
      expect(sanitizeCSSValue("hsl(var(--chart-1))")).toBe("hsl(var(--chart-1))");
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    });

    it("should strip CSS delimiters, braces, and semicolons to prevent rule injection", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red body display: none");
    });

    it("should strip unsafe tokens like url(), expression(), javascript:, and style", () => {
      expect(sanitizeCSSValue("url('https://malicious.com/test.png')")).toBe("('https://malicious.com/test.png')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("(alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should strip nested unsafe tokens (prevent bypasses)", () => {
      expect(sanitizeCSSValue("uurlrl('https://malicious.com/test.png')")).toBe("('https://malicious.com/test.png')");
      expect(sanitizeCSSValue("javajavascript:script:")).toBe("");
    });
  });
});
