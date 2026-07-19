import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow safe standard CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
      expect(sanitizeCSSIdentifier("primaryColor")).toBe("primaryColor");
    });

    it("should strip invalid characters like spaces, colons, semicolons, and brackets", () => {
      expect(sanitizeCSSIdentifier("chart:123")).toBe("chart123");
      expect(sanitizeCSSIdentifier("color;selector")).toBe("colorselector");
      expect(sanitizeCSSIdentifier("some class")).toBe("someclass");
      expect(sanitizeCSSIdentifier("injection}body{color:red")).toBe("injectionbodycolorred");
      expect(sanitizeCSSIdentifier("some\"quote'")).toBe("somequote");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow safe standard CSS property values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(210, 10%, 90%)")).toBe("hsl(210, 10%, 90%)");
      expect(sanitizeCSSValue("blue")).toBe("blue");
    });

    it("should strip dangerous punctuation characters like ;, }, and \\", () => {
      expect(sanitizeCSSValue("#ff0000;")).toBe("#ff0000");
      expect(sanitizeCSSValue("blue; color: red")).toBe("blue color: red");
      expect(sanitizeCSSValue("red}")).toBe("red");
      expect(sanitizeCSSValue("margin: 20px\\")).toBe("margin: 20px");
    });

    it("should block and empty malicious payloads", () => {
      // url()
      expect(sanitizeCSSValue("url('http://malicious.com/exploit.css')")).toBe("");
      expect(sanitizeCSSValue("URL(http://abc)")).toBe("");

      // expression()
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("EXPRESSION(1)")).toBe("");

      // javascript:
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("JAVASCRIPT:alert(1)")).toBe("");

      // </style>
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
      expect(sanitizeCSSValue("</STYLE>")).toBe("");
    });
  });
});
