import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization Utilities", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("should keep valid alphanumeric characters, hyphens, and underscores intact", () => {
      expect(sanitizeCSSIdentifier("chart-1-line_value")).toBe("chart-1-line_value");
    });

    it("should strip out special characters that could terminate or manipulate selectors", () => {
      expect(sanitizeCSSIdentifier("chartId}body{background:red;")).toBe("chartIdbodybackgroundred");
      expect(sanitizeCSSIdentifier("my-key;")).toBe("my-key");
      expect(sanitizeCSSIdentifier("my-key/deep")).toBe("my-keydeep");
      expect(sanitizeCSSIdentifier("my-key\\")).toBe("my-key");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("should keep valid color values intact", () => {
      expect(sanitizeCSSValue("#ff7f00")).toBe("#ff7f00");
      expect(sanitizeCSSValue("rgb(247, 127, 0)")).toBe("rgb(247, 127, 0)");
      expect(sanitizeCSSValue("hsl(28, 100%, 50%)")).toBe("hsl(28, 100%, 50%)");
    });

    it("should strip out standard CSS delimiters such as ;, }, and \\", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("blue} body{display:none}")).toBe("blue body{display:none");
      expect(sanitizeCSSValue("orange\\")).toBe("orange");
    });

    it("should block dangerous keywords like url(), expression(), javascript:, and </style>", () => {
      expect(sanitizeCSSValue("url('http://evil.com/leak')")).toBe("");
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
      expect(sanitizeCSSValue("red </style><script>alert(1)</script>")).toBe("");
    });
  });
});
