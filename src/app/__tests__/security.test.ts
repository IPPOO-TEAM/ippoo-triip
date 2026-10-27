import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("conserves valid alphanumeric, hyphen, and underscore characters", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
  });

  it("strips special characters, quotes, and HTML tags", () => {
    expect(sanitizeCSSIdentifier('chart<script>alert(1)</script>')).toBe("chartscriptalert1script");
    expect(sanitizeCSSIdentifier("chart; } body { background: red; }")).toBe("chartbodybackgroundred");
  });

  it("uses fallback if identifier is empty or completely stripped", () => {
    expect(sanitizeCSSIdentifier("")).toBe("chart");
    expect(sanitizeCSSIdentifier("!!!")).toBe("chart");
    expect(sanitizeCSSIdentifier("???", "custom-fallback")).toBe("custom-fallback");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows standard hex, rgb, or color names", () => {
    expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
    expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
  });

  it("strips HTML tags and dangerous delimiters", () => {
    expect(sanitizeCSSValue("red; } </style><script>alert(1)</script>")).toBe("red  alert(1)");
    expect(sanitizeCSSValue("red; background: blue;")).toBe("red background: blue");
  });

  it("removes dangerous CSS function calls", () => {
    expect(sanitizeCSSValue("url('http://evil.com/xss.css')")).toBe("'http:evil.comxss.css')");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
  });
});
