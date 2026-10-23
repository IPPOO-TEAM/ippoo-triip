import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should preserve valid identifier characters (a-z, A-Z, 0-9, -, _)", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc-XYZ")).toBe("chart-123_abc-XYZ");
    });

    it("should strip invalid identifier characters (spaces, special chars)", () => {
      expect(sanitizeCSSIdentifier("chartId; injection{}")).toBe("chartIdinjection");
      expect(sanitizeCSSIdentifier("my-key.name#with$special%chars")).toBe("my-keynamewithspecialchars");
    });

    it("should handle empty or invalid inputs securely", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      expect(sanitizeCSSIdentifier(null as any)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should preserve safe color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(200, 100%, 50%)")).toBe("hsl(200, 100%, 50%)");
    });

    it("should strip semicolon, closing brace, and backslash characters", () => {
      expect(sanitizeCSSValue("red; color: blue;")).toBe("red color: blue");
      expect(sanitizeCSSValue("blue}")).toBe("blue");
      expect(sanitizeCSSValue("val\\ue")).toBe("value");
    });

    it("should block and strip unsafe constructs like url(), expression(), javascript:, and </style> tags", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss')")).toBe("'http://evil.com/xss')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("red<script>alert(1)</script>");
    });

    it("should block unsafe constructs case-insensitively with varying spaces", () => {
      expect(sanitizeCSSValue("URL  ( 'http://evil.com' )")).toBe(" 'http://evil.com' )");
      expect(sanitizeCSSValue("Expression  ( 1 )")).toBe(" 1 )");
      expect(sanitizeCSSValue("JaVaScRiPt : foo")).toBe(" foo");
      expect(sanitizeCSSValue("red</STYLE>")).toBe("red");
    });

    it("should handle empty or invalid inputs securely", () => {
      expect(sanitizeCSSValue("")).toBe("");
      expect(sanitizeCSSValue(null as any)).toBe("");
    });
  });
});
