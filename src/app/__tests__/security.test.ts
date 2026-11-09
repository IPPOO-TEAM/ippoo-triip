import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("allows valid identifier characters", () => {
      expect(sanitizeCSSIdentifier("chart-1_primary")).toBe("chart-1_primary");
      expect(sanitizeCSSIdentifier("colorTheme123")).toBe("colorTheme123");
    });

    it("strips out invalid identifier characters and breakouts", () => {
      expect(sanitizeCSSIdentifier("test] { color: red; }")).toBe("testcolorred");
      expect(sanitizeCSSIdentifier("foo</style><script>")).toBe("foostylescript");
      expect(sanitizeCSSIdentifier("hello.world$#@%")).toBe("helloworld");
    });

    it("returns default fallback when string is empty or completely stripped", () => {
      expect(sanitizeCSSIdentifier("")).toBe("item");
      expect(sanitizeCSSIdentifier("!@#$%^&*()")).toBe("item");
      expect(sanitizeCSSIdentifier("", "fallback")).toBe("fallback");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves valid color values", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("#123456")).toBe("#123456");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("var(--primary)")).toBe("var(--primary)");
      expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
    });

    it("strips style tag breakouts, scripts, brackets, and semicolons", () => {
      const malicious = "red; } </style><script>alert(1)</script>";
      const sanitized = sanitizeCSSValue(malicious);
      expect(sanitized).not.toContain("</style>");
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("}");
      expect(sanitized).not.toContain(";");
    });

    it("strips url and expression CSS injection attempts", () => {
      expect(sanitizeCSSValue("url('https://malicious.site/leak')")).not.toContain("url(");
      expect(sanitizeCSSValue("expression(alert(1))")).not.toContain("expression(");
    });

    it("strips CSS comments and backslashes", () => {
      expect(sanitizeCSSValue("/* comment */ #ff0000 \\22")).toBe("comment  #ff0000 22");
    });
  });
});
