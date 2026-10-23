import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip special characters, spaces, and CSS syntax characters", () => {
      expect(sanitizeCSSIdentifier("chart; body { display: none; }")).toBe("chartbodydisplaynone");
      expect(sanitizeCSSIdentifier("id:with.dots#and$special")).toBe("idwithdotsandspecial");
    });

    it("should handle empty or non-string input safely", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid color codes and CSS values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
    });

    it("should strip dangerous CSS injection payloads like braces and semicolons", () => {
      expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none");
    });

    it("should remove url, expression, javascript, and style tags", () => {
      expect(sanitizeCSSValue("url(https://evil.com/x.css)")).toBe("https://evil.com/x.css)");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("<script>alert(1)</script>");
    });
  });
});
