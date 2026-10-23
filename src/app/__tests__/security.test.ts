import { describe, it, expect } from "vitest";
import { sanitizeChartId, sanitizeChartColor } from "../utils/security";

describe("Security Utils", () => {
  describe("sanitizeChartId", () => {
    it("should allow safe characters", () => {
      expect(sanitizeChartId("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should strip dangerous characters", () => {
      // Regex: /[^a-zA-Z0-9-_]/g
      // Space, semicolon, braces, colon are all stripped.
      expect(sanitizeChartId("chart-123; { background: red; }")).toBe("chart-123backgroundred");
    });
  });

  describe("sanitizeChartColor", () => {
    it("should allow safe color values", () => {
      expect(sanitizeChartColor("#ff0000")).toBe("#ff0000");
      expect(sanitizeChartColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(sanitizeChartColor("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
    });

    it("should strip dangerous characters", () => {
      expect(sanitizeChartColor("red; background: blue")).toBe("red background: blue");
      expect(sanitizeChartColor("red} .other { color: blue }")).toBe("red .other { color: blue ");
      expect(sanitizeChartColor("red\\")).toBe("red");
      expect(sanitizeChartColor("red</style><script>alert(1)</script>")).toBe("red<script>alert(1)</script>");
    });
  });
});
