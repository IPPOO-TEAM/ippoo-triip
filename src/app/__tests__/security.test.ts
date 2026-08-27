import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Security Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("my_var_name")).toBe("my_var_name");
      expect(sanitizeCSSIdentifier("PrimaryColor")).toBe("PrimaryColor");
    });

    it("strips out CSS breakout characters and invalid characters", () => {
      expect(sanitizeCSSIdentifier("chart-1; } body { display: none }")).toBe(
        "chart-1bodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("id\"'<>")).toBe("id");
      expect(sanitizeCSSIdentifier("test:selector")).toBe("testselector");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves safe CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("strips out dangerous CSS injections and breakout characters", () => {
      expect(sanitizeCSSValue("red; } body { display: none }")).toBe(
        "red  body  display: none",
      );
      expect(sanitizeCSSValue("blue; </style><script>alert(1)</script>")).toBe(
        "blue <script>alert(1)</script>",
      );
      expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe(
        "alert(1))",
      );
      expect(sanitizeCSSValue("expression(alert(1))")).toBe(
        "alert(1))",
      );
    });
  });
});
