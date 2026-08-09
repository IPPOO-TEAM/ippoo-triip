import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("CSS Identifier Sanitization", () => {
  it("should allow valid alphanumeric CSS identifiers, hyphens, and underscores", () => {
    expect(sanitizeCSSIdentifier("chart-123_abc")).toBe("chart-123_abc");
    expect(sanitizeCSSIdentifier("validName")).toBe("validName");
  });

  it("should strip out special characters that can break CSS", () => {
    expect(sanitizeCSSIdentifier("chart; injection")).toBe("chartinjection");
    expect(sanitizeCSSIdentifier("chart{color:red}")).toBe("chartcolorred");
    expect(sanitizeCSSIdentifier("id\\escape")).toBe("idescape");
    expect(sanitizeCSSIdentifier("id[attr]")).toBe("idattr");
  });
});

describe("CSS Value Sanitization", () => {
  it("should allow safe standard CSS color values", () => {
    expect(sanitizeCSSValue("#fff")).toBe("#fff");
    expect(sanitizeCSSValue("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)");
    expect(sanitizeCSSValue("hsl(200, 50%, 50%)")).toBe("hsl(200, 50%, 50%)");
    expect(sanitizeCSSValue("red")).toBe("red");
  });

  it("should replace dangerous payloads with 'transparent'", () => {
    expect(sanitizeCSSValue("url('http://evil.com')")).toBe("transparent");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
    expect(sanitizeCSSValue("</style><script>alert(1)</script>")).toBe("transparent");
  });

  it("should strip out characters that can terminate CSS declarations", () => {
    expect(sanitizeCSSValue("#fff; margin: 0")).toBe("#fff margin: 0");
    expect(sanitizeCSSValue("#fff} .evil { color: red }")).toBe("#fff .evil { color: red ");
    expect(sanitizeCSSValue("val\\escape")).toBe("valescape");
  });
});
