import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Sanitization - CSS Identifier", () => {
  it("allows standard alphanumeric identifiers", () => {
    expect(sanitizeCSSIdentifier("chart-primary-123")).toBe("chart-primary-123");
    expect(sanitizeCSSIdentifier("my_unique_id")).toBe("my_unique_id");
  });

  it("removes potential CSS breakout characters", () => {
    // Attempting to breakout with selectors, style blocks, or comments
    expect(sanitizeCSSIdentifier("chart-id] { background: url(evil.com) }")).toBe("chart-idbackgroundurlevilcom");
    expect(sanitizeCSSIdentifier("chart-id; color: red")).toBe("chart-idcolorred");
    expect(sanitizeCSSIdentifier("chart-id/* comment */")).toBe("chart-idcomment");
    expect(sanitizeCSSIdentifier("chart-id\\")).toBe("chart-id");
  });
});

describe("Security Sanitization - CSS Value", () => {
  it("allows normal CSS colors and values", () => {
    expect(sanitizeCSSValue("red")).toBe("red");
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    expect(sanitizeCSSValue("hsl(200, 100%, 50%)")).toBe("hsl(200, 100%, 50%)");
  });

  it("blocks URL injection payloads", () => {
    expect(sanitizeCSSValue("url('http://malicious-site.com/logger')")).toBe("none");
    expect(sanitizeCSSValue("URL('http://malicious-site.com/logger')")).toBe("none");
  });

  it("blocks HTML tag or JS expression breakout injection payloads", () => {
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("none");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("none");
    expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("none");
  });

  it("strips syntax breaking characters", () => {
    expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
    expect(sanitizeCSSValue("blue}")).toBe("blue");
    expect(sanitizeCSSValue("orange\\")).toBe("orange");
  });
});
