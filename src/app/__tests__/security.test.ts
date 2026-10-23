import { describe, expect, it } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves safe CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("primary_color")).toBe("primary_color");
    });

    it("strips invalid characters from CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1'; body { display: none; }")).toBe(
        "chart-1bodydisplaynone"
      );
      expect(sanitizeCSSIdentifier("color: red;")).toBe("colorred");
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe(
        "scriptalert1script"
      );
    });

    it("handles non-string values gracefully", () => {
      // @ts-expect-error testing invalid input
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing invalid input
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("var(--primary)")).toBe("var(--primary)");
    });

    it("strips delimiters, comments, HTML tags, and backslashes", () => {
      expect(
        sanitizeCSSValue("red; } body { background: black; }")
      ).toBe("red  body  background: black");
      expect(sanitizeCSSValue("/* malicious comment */ blue")).toBe("blue");
      expect(sanitizeCSSValue("<style>body{color:red}</style>#000")).toBe("#000");
    });

    it("strips url(), expression(), javascript:, and style recursively", () => {
      expect(sanitizeCSSValue("red url('http://evil.com/xss')")).toBe(
        "red 'http://evil.com/xss')"
      );
      expect(
        sanitizeCSSValue("expressexpression(ion(alert(1))")
      ).toBe("alert(1))");
      expect(sanitizeCSSValue("javajavascript:script:")).toBe("");
    });

    it("handles non-string values gracefully", () => {
      // @ts-expect-error testing invalid input
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing invalid input
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
