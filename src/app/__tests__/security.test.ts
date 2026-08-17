import { describe, expect, it } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("my_custom_var")).toBe("my_custom_var");
    });

    it("should strip invalid characters that could inject CSS or HTML", () => {
      expect(sanitizeCSSIdentifier("chart-123; body { display: none; }")).toBe(
        "chart-123bodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("id'\"<script>")).toBe("idscript");
    });

    it("should handle non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe color values", () => {
      expect(sanitizeCSSValue("hsl(210 40% 98%)")).toBe("hsl(210 40% 98%)");
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    });

    it("should strip structural CSS breakout characters ; { } \\", () => {
      expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
      expect(sanitizeCSSValue("blue } body { color: red; {")).toBe("blue  body  color: red");
    });

    it("should neutralize dangerous CSS functions and payloads", () => {
      expect(sanitizeCSSValue("url(https://malicious.com/evil.jpg)")).toBe("invalid-url(https://malicious.com/evil.jpg)");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("invalid-expression(alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("invalid-javascript:alert(1)");
      expect(sanitizeCSSValue("red </style><script>alert(1)</script>")).toBe("red <\\/style><script>alert(1)</script>");
    });

    it("should handle non-string inputs safely", () => {
      expect(sanitizeCSSValue(null as unknown as string)).toBe("");
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
