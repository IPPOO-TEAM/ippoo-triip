import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("desktop_users")).toBe("desktop_users");
      expect(sanitizeCSSIdentifier("item123")).toBe("item123");
    });

    it("should strip unsafe characters from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1} body { display:none }")).toBe("chart-1bodydisplaynone");
      expect(sanitizeCSSIdentifier('chart-1" onclick="alert(1)"')).toBe("chart-1onclickalert1");
      expect(sanitizeCSSIdentifier("chart-1<script>")).toBe("chart-1script");
    });

    it("should handle non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
      expect(sanitizeCSSIdentifier(123 as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("should strip CSS delimiters and escape characters", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red } body { color: black")).toBe("red  body  color: black");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });

    it("should block dangerous injection payloads", () => {
      expect(sanitizeCSSValue("url(https://malicious.com/tracker.png)")).toBe("");
      expect(sanitizeCSSValue("expression(alert('XSS'))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("");
    });

    it("should handle non-string inputs safely", () => {
      expect(sanitizeCSSValue(null as any)).toBe("");
      expect(sanitizeCSSValue(undefined as any)).toBe("");
      expect(sanitizeCSSValue(123 as any)).toBe("");
    });
  });
});
