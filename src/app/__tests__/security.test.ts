import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security utilities / sanitizeCSSIdentifier", () => {
  it("allows normal alphanumeric identifiers, dashes, and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
  });

  it("removes dangerous characters like semicolons, curly braces, colons, etc.", () => {
    expect(sanitizeCSSIdentifier("chart;body{background:red}")).toBe("chartbodybackgroundred");
    expect(sanitizeCSSIdentifier("chart-id:123")).toBe("chart-id123");
  });

  it("returns an empty string if input is not a string", () => {
    expect(sanitizeCSSIdentifier(undefined as any)).toBe("");
    expect(sanitizeCSSIdentifier(null as any)).toBe("");
  });
});

describe("Security utilities / sanitizeCSSValue", () => {
  it("allows standard color values and safe inputs", () => {
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
  });

  it("blocks dangerous payloads containing url(), expression(), or javascript:", () => {
    expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
  });

  it("blocks closing style tags", () => {
    expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
  });

  it("strips rule injection characters like semicolons, curly braces, and backslashes", () => {
    expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
    expect(sanitizeCSSValue("blue}")).toBe("blue");
    expect(sanitizeCSSValue("font\\family")).toBe("fontfamily");
  });

  it("returns an empty string if input is not a string", () => {
    expect(sanitizeCSSValue(undefined as any)).toBe("");
  });
});
