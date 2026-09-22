import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("security / sanitizeCSSIdentifier", () => {
  it("allows safe alphanumeric characters, hyphens, and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
  });

  it("strips special characters, quotes, and HTML/CSS injection payload characters", () => {
    expect(sanitizeCSSIdentifier("chart-123; } body { display:none }")).toBe("chart-123bodydisplaynone");
    expect(sanitizeCSSIdentifier('<script>alert("xss")</script>')).toBe("scriptalertxssscript");
  });

  it("handles non-string input safely", () => {
    // @ts-expect-error test invalid runtime inputs
    expect(sanitizeCSSIdentifier(null)).toBe("");
    // @ts-expect-error test invalid runtime inputs
    expect(sanitizeCSSIdentifier(undefined)).toBe("");
  });
});

describe("security / sanitizeCSSValue", () => {
  it("allows valid CSS color values", () => {
    expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
    expect(sanitizeCSSValue("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeCSSValue("var(--primary)")).toBe("var(--primary)");
  });

  it("strips CSS rule terminators, braces, and HTML tags", () => {
    expect(sanitizeCSSValue("red; } body { background: red; }")).toBe("red  body  background: red");
    expect(sanitizeCSSValue("<script>alert(1)</script>red")).toBe("alert(1)red");
  });

  it("strips dangerous functions like url(...) or expression(...)", () => {
    expect(sanitizeCSSValue("url('http://malicious.com/leak')")).toBe("'http://malicious.com/leak')");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
  });

  it("handles non-string input safely", () => {
    // @ts-expect-error test invalid runtime inputs
    expect(sanitizeCSSValue(null)).toBe("");
    // @ts-expect-error test invalid runtime inputs
    expect(sanitizeCSSValue(undefined)).toBe("");
  });
});
