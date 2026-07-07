import { describe, it, expect } from "vitest";
import { sanitizeColor, sanitizeId } from "../utils/security";

describe("security utils", () => {
  describe("sanitizeId", () => {
    it("should allow alphanumeric, hyphens and underscores", () => {
      expect(sanitizeId("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip dangerous characters", () => {
      expect(sanitizeId("chart-123; drop table users")).toBe("chart-123droptableusers");
      expect(sanitizeId("id='test'")).toBe("idtest");
      expect(sanitizeId("<script>")).toBe("script");
    });
  });

  describe("sanitizeColor", () => {
    it("should allow normal colors", () => {
      expect(sanitizeColor("#ff0000")).toBe("#ff0000");
      expect(sanitizeColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeColor("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
    });

    it("should block dangerous injection patterns", () => {
      expect(sanitizeColor("#ff0000; background: url(javascript:alert(1))")).toBe("transparent");
      expect(sanitizeColor("#ff0000} body { display: none }")).toBe("#ff0000 body { display: none ");
      expect(sanitizeColor("#ff0000</style><script>alert(1)</script>")).toBe("transparent");
      expect(sanitizeColor("red\\")).toBe("red");
    });
  });
});
