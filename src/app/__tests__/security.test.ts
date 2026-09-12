import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows standard alphanumeric identifiers, hyphens, and underscores", () => {
      expect(sanitizeCSSIdentifier("chart-123_test")).toBe("chart-123_test");
    });

    it("strips special characters and CSS injection payloads from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123; body { display: none; }")).toBe("chart-123bodydisplaynone");
      expect(sanitizeCSSIdentifier("test] { color: red; }")).toBe("testcolorred");
      expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe("scriptalert1script");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSIdentifier(null)).toBe("");
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSIdentifier(undefined)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows valid CSS color strings", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 10%, 20%)")).toBe("hsl(210, 10%, 20%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("strips CSS rule delimiters, comment markers, and angle brackets", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black");
      expect(sanitizeCSSValue("blue/* comment */")).toBe("blue");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("red/stylescriptalert(1)/script");
    });

    it("prevents url() and javascript: injection in values", () => {
      expect(sanitizeCSSValue("url(https://malicious.com/evil.png)")).toBe("https://malicious.com/evil.png)");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("prevents nested bypass attempts for forbidden tokens", () => {
      expect(sanitizeCSSValue("url(url(https://evil.com))")).toBe("https://evil.com))");
    });

    it("handles non-string inputs safely", () => {
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSValue(null)).toBe("");
      // @ts-expect-error testing invalid runtime types
      expect(sanitizeCSSValue(123)).toBe("");
    });
  });
});
