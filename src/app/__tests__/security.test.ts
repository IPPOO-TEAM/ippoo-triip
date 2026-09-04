import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utilities - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
      expect(sanitizeCSSIdentifier("primary_color")).toBe("primary_color");
      expect(sanitizeCSSIdentifier("Theme1")).toBe("Theme1");
    });

    it("strips special characters and spaces from CSS identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-123; body { display: none; }")).toBe(
        "chart-123bodydisplaynone",
      );
      expect(sanitizeCSSIdentifier("key\"'><script>")).toBe("keyscript");
    });

    it("handles non-string or empty inputs", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
      // @ts-expect-error test non-string input
      expect(sanitizeCSSIdentifier(null)).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves legitimate CSS colors and values", () => {
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
      expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeCSSValue("red")).toBe("red");
    });

    it("strips CSS injection payloads attempting to close blocks or inject rules", () => {
      const payload = "red; } body { background: black; }";
      expect(sanitizeCSSValue(payload)).toBe("red  body  background: black");
    });

    it("strips HTML script tags and javascript execution tokens", () => {
      const payload = "red</style><script>alert(1)</script>";
      expect(sanitizeCSSValue(payload)).toBe("redalert(1)");
    });

    it("strips dangerous CSS functions like url() and expression()", () => {
      expect(sanitizeCSSValue("url('http://evil.com/xss.css')")).toBe("'http:evil.comxss.css')");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
    });

    it("handles nested bypass attempts", () => {
      const nestedPayload = "javaJAVASCRIPT:script:alert(1)";
      expect(sanitizeCSSValue(nestedPayload)).toBe("alert(1)");
    });

    it("handles non-string or empty inputs", () => {
      expect(sanitizeCSSValue("")).toBe("");
      // @ts-expect-error test non-string input
      expect(sanitizeCSSValue(undefined)).toBe("");
    });
  });
});
