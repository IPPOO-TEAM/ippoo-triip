import { describe, expect, it } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - CSS Sanitization", () => {
  describe("sanitizeCSSIdentifier", () => {
    it("preserves valid identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
      expect(sanitizeCSSIdentifier("desktop_users")).toBe("desktop_users");
      expect(sanitizeCSSIdentifier("primaryColor123")).toBe("primaryColor123");
    });

    it("strips malicious payload characters from identifiers", () => {
      expect(sanitizeCSSIdentifier("chart-1}\nbody{background:red;}")).toBe(
        "chart-1bodybackgroundred",
      );
      expect(sanitizeCSSIdentifier("var;alert(1)")).toBe("varalert1");
      expect(sanitizeCSSIdentifier('chart""><script>alert(1)</script>')).toBe(
        "chartscriptalert1script",
      );
    });

    it("handles empty or falsy inputs", () => {
      expect(sanitizeCSSIdentifier("")).toBe("");
    });
  });

  describe("sanitizeCSSValue", () => {
    it("preserves standard CSS colors and values", () => {
      expect(sanitizeCSSValue("hsl(var(--chart-1))")).toBe(
        "hsl(var(--chart-1))",
      );
      expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
      expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    });

    it("strips potentially dangerous CSS injection constructs and handles nested bypasses", () => {
      expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
      expect(sanitizeCSSValue("url(https://attacker.com/cookie.png)")).toBe(
        "https:attacker.comcookie.png)",
      );
      expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
      expect(sanitizeCSSValue("javascript:alert(1)")).toBe("alert(1)");
      expect(sanitizeCSSValue("red</s</style>tyle><script>alert(1)</script>")).toBe(
        "redscriptalert(1)script",
      );
      expect(sanitizeCSSValue("blue\\;")).toBe("blue");
    });

    it("handles empty or falsy inputs", () => {
      expect(sanitizeCSSValue("")).toBe("");
    });
  });
});
