import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("user_profile_theme")).toBe("user_profile_theme");
    });

    it("strips malicious characters from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123; body { display: none; }")).toBe("chart-123bodydisplaynone");
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe("scriptalert1script");
      expect(sanitizeCSSIdentifier('chart"')).toBe("chart");
    });

    it("handles non-string input safely", () => {
      // @ts-expect-error Testing runtime invalid input
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error Testing runtime invalid input
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS colors and values", () => {
      expect(sanitizeCSSValue("#2A9D8F")).toBe("#2A9D8F");
      expect(sanitizeCSSValue("hsl(210, 50%, 50%)")).toBe("hsl(210, 50%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips HTML tags, backslashes, comment blocks, and statement delimiters", () => {
      expect(sanitizeCSSValue('red; } </style><script>alert("xss")</script>')).toBe('red  alert("xss")');
      expect(sanitizeCSSValue("blue; background: url(http://evil.com/xss.jpg)")).toBe("blue background: http://evil.com/xss.jpg)");
      expect(sanitizeCSSValue("red; /* comment */ background: expression(alert(1))")).toBe("red  background: alert(1))");
    });

    it("handles non-string input safely", () => {
      // @ts-expect-error Testing runtime invalid input
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error Testing runtime invalid input
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
