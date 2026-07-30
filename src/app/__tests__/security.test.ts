import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows safe alphanumeric identifiers with hyphens and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-123")).toBe("chart-123");
    expect(sanitizeCSSIdentifier("my_key_99")).toBe("my_key_99");
    expect(sanitizeCSSIdentifier("SimpleValue")).toBe("SimpleValue");
  });

  it("strips out unsafe non-identifier characters", () => {
    // Malicious injection attempts inside dynamic identifiers
    expect(sanitizeCSSIdentifier("chart;background:red")).toBe("chartbackgroundred");
    expect(sanitizeCSSIdentifier("id}body{color:red")).toBe("idbodycolorred");
    expect(sanitizeCSSIdentifier("chart-id-with-spaces ")).toBe("chart-id-with-spaces");
    expect(sanitizeCSSIdentifier("chart/\\%#@")).toBe("chart");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows safe CSS values like standard colors and units", () => {
    expect(sanitizeCSSValue("red")).toBe("red");
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("hsl(120, 100%, 50%)")).toBe("hsl(120, 100%, 50%)");
  });

  it("blocks dangerous payloads containing url(), expression(), javascript:, and style closing tags", () => {
    // Case-insensitive checks for malicious features
    expect(sanitizeCSSValue("url('http://evil.com/bg.jpg')")).toBe("");
    expect(sanitizeCSSValue("URL(https://evil.com/bg.png)")).toBe("");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
    expect(sanitizeCSSValue("EXPRESSION(alert(1))")).toBe("");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
    expect(sanitizeCSSValue("JAVASCRIPT:alert(1)")).toBe("");
    expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("");
    expect(sanitizeCSSValue("</STYLE>")).toBe("");
  });

  it("strips out terminator and escape characters (; } \\)", () => {
    // Stripping characters to prevent breaking out of style block declarations
    expect(sanitizeCSSValue("red;")).toBe("red");
    expect(sanitizeCSSValue("red; font-size: 10px;")).toBe("red font-size: 10px");
    expect(sanitizeCSSValue("red} body { background: green; }")).toBe("red body { background: green ");
    expect(sanitizeCSSValue("red\\")).toBe("red");
  });
});
