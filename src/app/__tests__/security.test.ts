import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security Utils - sanitizeCSSIdentifier", () => {
  it("allows alphanumeric, hyphens, and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
  });

  it("strips malicious CSS injection characters", () => {
    expect(sanitizeCSSIdentifier("chart1; } body { background: red; }")).toBe("chart1bodybackgroundred");
    expect(sanitizeCSSIdentifier("id<script>")).toBe("idscript");
  });

  it("uses fallback if result is empty or non-string", () => {
    expect(sanitizeCSSIdentifier("!!!", "fallback-id")).toBe("fallback-id");
    expect(sanitizeCSSIdentifier(123 as any, "fallback-id")).toBe("fallback-id");
  });
});

describe("Security Utils - sanitizeCSSValue", () => {
  it("preserves valid CSS color strings", () => {
    expect(sanitizeCSSValue("#ff0000")).toBe("#ff0000");
    expect(sanitizeCSSValue("hsl(210, 100%, 50%)")).toBe("hsl(210, 100%, 50%)");
    expect(sanitizeCSSValue("burlywood")).toBe("burlywood");
  });

  it("strips CSS injection constructs and delimiters", () => {
    expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
    expect(sanitizeCSSValue("red; } body { display: none; }")).toBe("red  body  display: none ");
    expect(sanitizeCSSValue("url('http://malicious.com')")).toBe("'http:malicious.com')");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("alert(1))");
  });
});
