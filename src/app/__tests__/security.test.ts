import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("should preserve valid CSS identifiers (alphanumeric, hyphens, underscores)", () => {
    expect(sanitizeCSSIdentifier("chart-1_blue")).toBe("chart-1_blue");
    expect(sanitizeCSSIdentifier("accentColor")).toBe("accentColor");
  });

  it("should strip spaces, semicolons, brackets, and quotes", () => {
    expect(sanitizeCSSIdentifier("chart-id; background: url(bad)")).toBe("chart-idbackgroundurlbad");
    expect(sanitizeCSSIdentifier("chart:id 'quote'")).toBe("chartidquote");
    expect(sanitizeCSSIdentifier("chart{id}")).toBe("chartid");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("should allow valid CSS values (colors, simple measurements)", () => {
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("hsl(200, 100%, 50%)")).toBe("hsl(200, 100%, 50%)");
  });

  it("should return empty string for unsafe constructs", () => {
    expect(sanitizeCSSValue("url('http://evil.com')")).toBe("");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
    expect(sanitizeCSSValue("red </style><script>alert(1)</script>")).toBe("");
  });

  it("should strip semi-colons, braces, and backslashes", () => {
    expect(sanitizeCSSValue("red; border: 1px solid black")).toBe("red border: 1px solid black");
    expect(sanitizeCSSValue("blue }")).toBe("blue ");
    expect(sanitizeCSSValue("green \\")).toBe("green ");
  });
});
