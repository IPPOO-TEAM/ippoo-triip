import { describe, it, expect } from "vitest";
import { sanitizeIdentifier, sanitizeColor } from "../utils/security";

describe("Security Sanitization", () => {
  describe("sanitizeIdentifier", () => {
    it("should allow valid identifiers", () => {
      expect(sanitizeIdentifier("valid-id_123")).toBe("valid-id_123");
    });

    it("should strip invalid characters", () => {
      expect(sanitizeIdentifier("invalid id!")).toBe("invalidid");
      expect(sanitizeIdentifier("chart-123;")).toBe("chart-123");
      expect(sanitizeIdentifier("id<script>")).toBe("idscript");
      expect(sanitizeIdentifier("id\"'")).toBe("id");
    });
  });

  describe("sanitizeColor", () => {
    it("should allow valid color values", () => {
      expect(sanitizeColor("#fff")).toBe("#fff");
      expect(sanitizeColor("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
      expect(sanitizeColor("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
      expect(sanitizeColor("red")).toBe("red");
    });

    it("should block dangerous patterns", () => {
      expect(sanitizeColor("url(javascript:alert(1))")).toBe("transparent");
      expect(sanitizeColor("expression(alert(1))")).toBe("transparent");
      expect(sanitizeColor("javascript:alert(1)")).toBe("transparent");
      expect(sanitizeColor("red</style><script>alert(1)</script>")).toBe("transparent");
    });

    it("should strip forbidden characters", () => {
      expect(sanitizeColor("red;")).toBe("red");
      expect(sanitizeColor("red}")).toBe("red");
      expect(sanitizeColor("red\\")).toBe("red");
      expect(sanitizeColor("#fff; color: red")).toBe("#fff color red");
    });

    it("should handle empty values", () => {
      expect(sanitizeColor("")).toBe("");
    });
  });
});
