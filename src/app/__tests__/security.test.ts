import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-1_line")).toBe("chart-1_line");
      expect(sanitizeCSSIdentifier("myCoolChart")).toBe("myCoolChart");
    });

    it("should strip out spaces and special characters", () => {
      expect(sanitizeCSSIdentifier("chart 1")).toBe("chart1");
      expect(sanitizeCSSIdentifier("chart;invalid")).toBe("chartinvalid");
      expect(sanitizeCSSIdentifier("chart[data-attr]")).toBe("chartdata-attr");
      expect(sanitizeCSSIdentifier("chart.classname")).toBe("chartclassname");
      expect(sanitizeCSSIdentifier("chart#id")).toBe("chartid");
      expect(sanitizeCSSIdentifier("chart:hover")).toBe("charthover");
    });

    it("should handle empty or invalid non-string inputs", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      // @ts-expect-error - testing invalid inputs
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error - testing invalid inputs
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe CSS colors", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("should strip trailing semi-colons, curly braces, and backslashes", () => {
      expect(sanitizeCSSValue("#fff;")).toBe("#fff");
      expect(sanitizeCSSValue("#fff}")).toBe("#fff");
      expect(sanitizeCSSValue("red\\")).toBe("red");
      expect(sanitizeCSSValue("#fff; margin: 20px;")).toBe("#fff margin: 20px");
    });

    it("should completely block url() values to prevent data extraction/XSS", () => {
      expect(sanitizeCSSValue("url('http://evil.com/leak')")).toBe("");
      expect(sanitizeCSSValue("URL('http://evil.com/leak')")).toBe("");
    });

    it("should completely block expression() and javascript:", () => {
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
    });

    it("should completely block style closing tags", () => {
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    });

    it("should handle empty or invalid non-string inputs", () => {
      expect(sanitizeCSSValue("")).toBe("");
      // @ts-expect-error - testing invalid inputs
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error - testing invalid inputs
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
