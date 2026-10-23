import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Security Tests", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("desktop_users")).toBe("desktop_users");
      expect(sanitizeCSSIdentifier("themeRed123")).toBe("themeRed123");
    });

    it("strips invalid characters from identifiers to prevent selector breakout", () => {
      expect(sanitizeCSSIdentifier("chart-1} body { display: none; }")).toBe("chart-1bodydisplaynone");
      expect(sanitizeCSSIdentifier("id'\"<script>")).toBe("idscript");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("allows standard CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("strips CSS rule delimiters, braces, and HTML tags", () => {
      expect(sanitizeCSSValue("red; } body { background: red; }")).toBe("red  body  background: red");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("redalert(1)");
    });

    it("strips unsafe functions and tokens iteratively to prevent bypasses", () => {
      expect(sanitizeCSSValue("ururl(l(https://evil.com/x.png)")).toBe("https:evil.comx.png)");
      expect(sanitizeCSSValue("expexpression(ression(alert(1)))")).toBe("alert(1)))");
      expect(sanitizeCSSValue("javascjavascript:ript:alert(1)")).toBe("alert(1)");
    });
  });
});
