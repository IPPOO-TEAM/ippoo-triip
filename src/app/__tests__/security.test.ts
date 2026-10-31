import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows valid CSS identifiers with alphanumeric characters, dashes, and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-1")).toBe("chart-1");
    expect(sanitizeCSSIdentifier("theme_primary")).toBe("theme_primary");
    expect(sanitizeCSSIdentifier("color123")).toBe("color123");
  });

  it("strips special characters, spaces, quotes, and HTML tags", () => {
    expect(sanitizeCSSIdentifier("chart:1")).toBe("chart1");
    expect(sanitizeCSSIdentifier("chart'\"")).toBe("chart");
    expect(sanitizeCSSIdentifier("foo] { color: red; } [data-bar=")).toBe("foocolorreddata-bar");
    expect(sanitizeCSSIdentifier("<script>alert(1)</script>")).toBe("scriptalert1script");
  });

  it("returns fallback value when sanitized identifier becomes empty", () => {
    expect(sanitizeCSSIdentifier("!!!", "fallback-id")).toBe("fallback-id");
    expect(sanitizeCSSIdentifier(null, "default-id")).toBe("default-id");
    expect(sanitizeCSSIdentifier(undefined, "default-id")).toBe("default-id");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("preserves standard safe CSS colors and values", () => {
    expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("hsl(210 20% 98%)")).toBe("hsl(210 20% 98%)");
    expect(sanitizeCSSValue("var(--primary)")).toBe("var(--primary)");
  });

  it("preserves legitimate color names containing substring 'url' like burlywood", () => {
    expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
  });

  it("neutralizes CSS breakout attempts via block delimiters and semicolons", () => {
    const malicious = "red; } body { display: none; }";
    const sanitized = sanitizeCSSValue(malicious);
    expect(sanitized).not.toContain(";");
    expect(sanitized).not.toContain("}");
    expect(sanitized).not.toContain("{");
    expect(sanitized).toBe("red  body  display: none");
  });

  it("neutralizes XSS attempts via style closing tags and script tags", () => {
    const payload = "</style><script>alert('xss')</script>";
    const sanitized = sanitizeCSSValue(payload);
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).not.toContain("script");
    expect(sanitized).toBe("alert('xss')");
  });

  it("neutralizes dangerous function calls like url() and expression()", () => {
    expect(sanitizeCSSValue("url('https://evil.com/leak')")).not.toMatch(/url\s*\(/i);
    expect(sanitizeCSSValue("expression(alert('xss'))")).not.toMatch(/expression\s*\(/i);
    expect(sanitizeCSSValue("red url(javascript:alert(1))")).not.toMatch(/url\s*\(/i);
  });

  it("handles non-string values safely", () => {
    expect(sanitizeCSSValue(null)).toBe("");
    expect(sanitizeCSSValue(undefined)).toBe("");
    expect(sanitizeCSSValue(123)).toBe("");
  });
});
