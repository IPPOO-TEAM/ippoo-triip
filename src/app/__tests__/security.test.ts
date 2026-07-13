import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("my_variable")).toBe("my_variable");
    });

    it("should remove invalid characters", () => {
      expect(sanitizeCSSIdentifier("chart:123")).toBe("chart123");
      expect(sanitizeCSSIdentifier("chart id")).toBe("chartid");
      expect(sanitizeCSSIdentifier("chart.id")).toBe("chartid");
      expect(sanitizeCSSIdentifier("chart#id")).toBe("chartid");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid colors", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
    });

    it("should block dangerous patterns", () => {
      expect(sanitizeCSSValue("url(https://malicious.com)")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red </style><script>alert(1)</script>")).toBe("");
    });

    it("should strip breaking characters", () => {
      expect(sanitizeCSSValue("red;")).toBe("red");
      expect(sanitizeCSSValue("red}")).toBe("red");
      expect(sanitizeCSSValue("red\\")).toBe("red");
      expect(sanitizeCSSValue("red; color: blue")).toBe("red color: blue");
    });

    it("should handle empty or null values", () => {
      expect(sanitizeCSSValue("")).toBe("");
      expect(sanitizeCSSValue(null as any)).toBe("");
    });
  });
});
