import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows valid identifiers", () => {
    expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
    expect(sanitizeCSSIdentifier("my_id_456")).toBe("my_id_456");
  });

  it("removes dangerous characters from identifiers", () => {
    expect(sanitizeCSSIdentifier("chart-123;")).toBe("chart-123");
    expect(sanitizeCSSIdentifier("chart\"'><script>")).toBe("chartscript");
    expect(sanitizeCSSIdentifier("chart space")).toBe("chartspace");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows valid colors and values", () => {
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    expect(sanitizeCSSValue("hsl(0, 0%, 100%)")).toBe("hsl(0, 0%, 100%)");
    expect(sanitizeCSSValue("red")).toBe("red");
  });

  it("blocks dangerous patterns in values", () => {
    expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("transparent");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
    expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("transparent");
  });

  it("strips rule-breaking characters from values", () => {
    expect(sanitizeCSSValue("red;")).toBe("red");
    expect(sanitizeCSSValue("red}")).toBe("red");
    expect(sanitizeCSSValue("red\\")).toBe("red");
  });

  it("handles empty values", () => {
    expect(sanitizeCSSValue("")).toBe("");
    expect(sanitizeCSSValue(null as any)).toBe("");
  });
});
