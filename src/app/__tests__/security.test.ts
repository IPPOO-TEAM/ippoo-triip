import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows standard safe characters (alphanumeric, hyphens, underscores)", () => {
    expect(sanitizeCSSIdentifier("my-class_123")).toBe("my-class_123");
  });

  it("removes spaces, symbols, punctuation, and injection attempts", () => {
    expect(sanitizeCSSIdentifier("chart-id-123; border: 1px solid red;")).toBe("chart-id-123border1pxsolidred");
    expect(sanitizeCSSIdentifier("chart[data-chart]")).toBe("chartdata-chart");
    expect(sanitizeCSSIdentifier("chart-id</style><script>alert(1)</script>")).toBe("chart-idstylescriptalert1script");
    expect(sanitizeCSSIdentifier("chartid#foo.bar")).toBe("chartidfoobar");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows standard safe CSS values (hex colors, RGB, variable values, simple names)", () => {
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("hsl(220, 10%, 10%)")).toBe("hsl(220, 10%, 10%)");
    expect(sanitizeCSSValue("red")).toBe("red");
  });

  it("blocks dangerous payloads containing url(), expression(), javascript:, or </style> tags", () => {
    expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
    expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("");
    // Case insensitivity
    expect(sanitizeCSSValue("URL(https://evil.com)")).toBe("");
    expect(sanitizeCSSValue("eXpReSsIoN(alert)")).toBe("");
  });

  it("strips semicolons, closing brackets, and backslashes to prevent rule breakouts", () => {
    expect(sanitizeCSSValue("red; border: 1px solid blue")).toBe("red border: 1px solid blue");
    expect(sanitizeCSSValue("red} .evil { background: black")).toBe("red .evil { background: black");
    expect(sanitizeCSSValue("red\\")).toBe("red");
  });
});
