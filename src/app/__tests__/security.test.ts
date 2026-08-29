import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-1_test")).toBe("chart-1_test");
      expect(sanitizeCSSIdentifier("primaryColor")).toBe("primaryColor");
    });

    it("removes special characters and whitespace", () => {
      expect(sanitizeCSSIdentifier("chart-1; body { display: none }")).toBe(
        "chart-1bodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("id'\"<>")).toBe("id");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error - testing runtime safety
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error - testing runtime safety
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows safe CSS values (hex, hsl, rgb, var, keywords)", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe(
        "hsl(210, 100%, 50%)",
      );
      expect(sanitizeCSSValue("var(--primary-color)")).toBe(
        "var(--primary-color)",
      );
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("strips HTML/CSS rule delimiters and style tags", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red}</style><script>alert(1)</script>")).toBe(
        "red/scriptalert(1)/script",
      );
    });

    it("removes unsafe tokens and handles nested bypass attempts", () => {
      expect(sanitizeCSSValue("urlurl((https://evil.com/x.css)")).toBe(
        "((https://evil.com/x.css)",
      );
      expect(
        sanitizeCSSValue("expressexpressionion((alert(1))"),
      ).toBe("((alert(1))");
      expect(
        sanitizeCSSValue("javascriptjavascript:alert(1)"),
      ).toBe(":alert(1)");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error - testing runtime safety
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error - testing runtime safety
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
