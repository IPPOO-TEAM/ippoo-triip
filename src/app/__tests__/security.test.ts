import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should allow valid characters", () => {
      expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip invalid characters", () => {
      expect(sanitizeCSSIdentifier("chart; DROP TABLE users;")).toBe("chartDROPTABLEusers");
      expect(sanitizeCSSIdentifier("chart'\" <script>")).toBe("chartscript");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should allow valid colors", () => {
      expect(sanitizeCSSValue("#fff")).toBe("#fff");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
    });

    it("should strip ;, } and \\", () => {
      expect(sanitizeCSSValue("#fff; color: red")).toBe("#fff color: red");
      expect(sanitizeCSSValue("#fff} body { background: red }")).toBe("#fff body { background: red ");
      expect(sanitizeCSSValue("red\\")).toBe("red");
    });

    it("should return empty string for dangerous patterns", () => {
      expect(sanitizeCSSValue("url('javascript:alert(1)')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    });
  });
});
