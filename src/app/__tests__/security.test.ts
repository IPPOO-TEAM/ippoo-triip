import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security utils", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow alphanumeric, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip special characters and spaces", () => {
      expect(sanitizeCSSIdentifier("chart-123} </style><script>alert(1)</script>")).toBe(
        "chart-123stylescriptalert1script"
      );
    });

    it("should return empty string for non-string inputs", () => {
      expect(sanitizeCSSIdentifier(123 as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve valid CSS color strings", () => {
      expect(sanitizeCSSValue("hsl(var(--chart-1))")).toBe("hsl(var(--chart-1))");
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    });

    it("should sanitize malicious CSS injections and tags", () => {
      expect(sanitizeCSSValue("red; } </style><script>alert('xss')</script>")).toBe(
        "red alert('xss')"
      );
    });

    it("should strip dangerous CSS functions like url() and expression()", () => {
      expect(sanitizeCSSValue("url('https://evil.com/xss.css')")).toBe("'https://evil.com/xss.css')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
    });

    it("should handle recursive bypass attempts", () => {
      expect(sanitizeCSSValue("javascjavascript:ript:alert(1)")).toBe("alert(1)");
    });
  });
});
