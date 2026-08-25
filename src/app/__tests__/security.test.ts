import { describe, test, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    test("allows standard alphanumeric, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    test("strips special characters, quotes, curly braces, and HTML tags", () => {
      expect(sanitizeCSSIdentifier('chart-1"; body { background: red; }')).toBe(
        "chart-1bodybackgroundred",
      );
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe(
        "scriptalert1script",
      );
    });

    test("returns empty string for non-string inputs", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    test("allows standard safe CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(var(--primary))")).toBe("hsl(var(--primary))");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    test("blocks url(), expression(), javascript:, and </style>", () => {
      expect(sanitizeCSSValue("url(http://evil.com/xss.png)")).toBe("");
      expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red; </style><script>alert(1)</script>")).toBe("");
    });

    test("strips CSS injection delimiters ;, {, }, and \\", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red } body { display: none")).toBe("red  body  display: none");
    });

    test("returns empty string for non-string inputs", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
