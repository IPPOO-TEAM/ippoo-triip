import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric identifiers with hyphens and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip special characters, quotes, and punctuation", () => {
      expect(sanitizeCSSIdentifier("chart-123; } body { color: red; }")).toBe("chart-123bodycolorred");
      expect(sanitizeCSSIdentifier("id'\"<>")).toBe("id");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
    });

    it("should sanitize delimiters and HTML tags", () => {
      expect(sanitizeCSSValue("red; } </style><script>alert(1)</script>")).toBe("red alert(1)");
    });

    it("should strip unsafe CSS function tokens and handle nested bypasses", () => {
      // "ururl(l(" -> outer "url(" stripped, inner "url(" stripped -> leaves "http://evil.com/x.png)"
      expect(sanitizeCSSValue("ururl(l(http://evil.com/x.png)")).toBe("http://evil.com/x.png)");
      // "expexpression(ression(" -> "expression(" stripped iteratively -> leaves "alert(1))"
      expect(sanitizeCSSValue("expexpression(ression(alert(1))")).toBe("alert(1))");
    });
  });
});
