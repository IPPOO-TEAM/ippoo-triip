import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Sanitization Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe alphanumeric characters, dashes, and underscores", () => {
      expect(sanitizeCSSIdentifier("my-safe_chart-123")).toBe("my-safe_chart-123");
    });

    it("should strip malicious characters trying to break out of selectors/rules", () => {
      expect(sanitizeCSSIdentifier("chart-id; body { background: red; }")).toBe("chart-idbodybackgroundred");
      expect(sanitizeCSSIdentifier("chart-id} #injection { color: blue; }")).toBe("chart-idinjectioncolorblue");
      expect(sanitizeCSSIdentifier("chart-id\\")).toBe("chart-id");
      expect(sanitizeCSSIdentifier("chart-id.class")).toBe("chart-idclass");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow standard hex and rgb colors", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
    });

    it("should strip out url() patterns to block data URI or external asset loading", () => {
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("URL('http://malicious.com')")).toBe("'http://malicious.com')");
    });

    it("should strip out expression() and javascript: patterns", () => {
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("should strip out closing style tags to prevent style breakout", () => {
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("red<script>alert(1)</script>");
    });

    it("should strip ';', '}' and '\\' characters", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("red} body { background: blue }")).toBe("red body { background: blue ");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });
  });
});
