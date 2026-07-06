import { describe, it, expect } from "vitest";
import { sanitizeId, sanitizeColor } from "../utils/security";

describe("Security Utils", () => {
  describe("sanitizeId", () => {
    it("should allow alphanumeric characters, hyphens, and underscores", () => {
      expect(sanitizeId("chart-123_abc")).toBe("chart-123_abc");
    });

    it("should remove other characters", () => {
      expect(sanitizeId("chart:123.abc!@#")).toBe("chart123abc");
    });

    it("should prevent CSS injection attempts in IDs", () => {
      expect(sanitizeId("chart] { background: red; }")).toBe("chartbackgroundred");
    });
  });

  describe("sanitizeColor", () => {
    it("should allow normal color values", () => {
      expect(sanitizeColor("#ffffff")).toBe("#ffffff");
      expect(sanitizeColor("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    });

    it("should remove characters that break out of CSS properties", () => {
      expect(sanitizeColor("red; background: blue")).toBe("red background: blue");
      expect(sanitizeColor("blue } .other { color: red }")).toBe("blue  .other { color: red ");
    });

    it("should strip </style> tags case-insensitively", () => {
      expect(sanitizeColor("red</style><script>alert(1)</script>")).toBe("red<script>alert(1)</script>");
      expect(sanitizeColor("blue</STYLE>")).toBe("blue");
    });

    it("should remove backslashes", () => {
      expect(sanitizeColor("red\\")).toBe("red");
    });
  });
});
