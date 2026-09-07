import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifier characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("strips malicious characters from CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123}</style><script>alert(1)</script>")).toBe("chart-123stylescriptalert1script");
      expect(sanitizeCSSIdentifier("color; background: red")).toBe("colorbackgroundred");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSIdentifier(null as unknown as string)).toBe("");
      expect(sanitizeCSSIdentifier(undefined as unknown as string)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS color values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgba(0, 0, 0, 0.5)")).toBe("rgba(0, 0, 0, 0.5)");
    });

    it("strips block delimiters and HTML tags", () => {
      expect(sanitizeCSSValue("red; } body { background: black; }")).toBe("red  body  background: black");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redscriptalert(1)script");
    });

    it("strips unsafe CSS functions and nested bypass attempts", () => {
      expect(sanitizeCSSValue("url('https://malicious.com')")).toBe("'https:malicious.com')");
      expect(sanitizeCSSValue("ururl(l('http://evil.com')")).toBe("'http:evil.com')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("handles non-string inputs safely", () => {
      expect(sanitizeCSSValue(null as unknown as string)).toBe("");
      expect(sanitizeCSSValue(undefined as unknown as string)).toBe("");
    });
  });
});
