import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip spaces and special characters that could break CSS syntax", () => {
      expect(sanitizeCSSIdentifier("chart id-123; {}")).toBe("chartid-123");
    });

    it("should handle empty or invalid non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe colors and measurements", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
      expect(sanitizeCSSValue("20px")).toBe("20px");
    });

    it("should strip potential dangerous characters (;, }, \\)", () => {
      expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
      expect(sanitizeCSSValue("blue} body { color: red; }")).toBe("blue body { color: red ");
      expect(sanitizeCSSValue("va\\lue")).toBe("value");
    });

    it("should block CSS injection payloads like url(), expression(), javascript: and </style> case-insensitively", () => {
      expect(sanitizeCSSValue("url('http://evil.com')")).toBe("");
      expect(sanitizeCSSValue("URL('http://evil.com')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    });

    it("should handle empty or invalid non-string inputs safely", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
    });
  });
});
