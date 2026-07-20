import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows standard safe characters (alphanumeric, dashes, underscores)", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
  });

  it("strips spaces, punctuation, and injection payload characters", () => {
    expect(sanitizeCSSIdentifier("chart id with spaces")).toBe("chartidwithspaces");
    expect(sanitizeCSSIdentifier("chart;body{color:red}")).toBe("chartbodycolorred");
    expect(sanitizeCSSIdentifier("chart}* {background:red")).toBe("chartbackgroundred");
    expect(sanitizeCSSIdentifier("chart\\1234")).toBe("chart1234");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows safe color names, hex, rgb, hsl values", () => {
    expect(sanitizeCSSValue("red")).toBe("red");
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    expect(sanitizeCSSValue("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
  });

  it("strips breaking characters like semicolons, curly braces, and backslashes", () => {
    expect(sanitizeCSSValue("red;")).toBe("red");
    expect(sanitizeCSSValue("red}")).toBe("red");
    expect(sanitizeCSSValue("red\\")).toBe("red");
    expect(sanitizeCSSValue("red; background-color: black;")).toBe("red background-color: black");
  });

  it("blocks dangerous payloads (url, expression, javascript, style tag closure)", () => {
    expect(sanitizeCSSValue("url('http://evil.com')")).toBe("");
    expect(sanitizeCSSValue("URL('HTTP://EVIL.COM')")).toBe("");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("");
    expect(sanitizeCSSValue("red</style><script>alert(1)</script>")).toBe("");
  });
});
