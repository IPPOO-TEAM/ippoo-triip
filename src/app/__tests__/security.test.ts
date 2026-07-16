import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid alphanumeric identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("my_variable")).toBe("my_variable");
    });

    it("should strip invalid characters from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart; injection")).toBe("chartinjection");
      expect(sanitizeCSSIdentifier("id#123")).toBe("id123");
      expect(sanitizeCSSIdentifier("var$name")).toBe("varname");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
    });

    it("should block dangerous CSS injection patterns", () => {
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("transparent");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
      expect(sanitizeCSSValue("red; background: url(bad)")).toBe("transparent");
      expect(sanitizeCSSValue("blue </style><script>alert(1)</script>")).toBe("transparent");
    });

    it("should strip characters that can break out of declarations", () => {
      expect(sanitizeCSSValue("red;")).toBe("red");
      expect(sanitizeCSSValue("blue}")).toBe("blue");
      expect(sanitizeCSSValue("green\\")).toBe("green");
    });
  });
});
