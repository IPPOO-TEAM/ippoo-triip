import { describe, it, expect } from "vitest";
import { sanitizeCSSIdentifier, sanitizeCSSValue } from "../utils/security";

describe("Security utilities / sanitizeCSSIdentifier", () => {
  it("removes insecure characters from CSS identifiers", () => {
    expect(sanitizeCSSIdentifier("my-class-123_abc")).toBe("my-class-123_abc");
    expect(sanitizeCSSIdentifier("my-class; injection")).toBe("my-classinjection");
    expect(sanitizeCSSIdentifier("my-class} injection")).toBe("my-classinjection");
    expect(sanitizeCSSIdentifier("my-class\\ injection")).toBe("my-classinjection");
    expect(sanitizeCSSIdentifier("my-class'\"injection")).toBe("my-classinjection");
  });
});

describe("Security utilities / sanitizeCSSValue", () => {
  it("removes semicolons, braces and backslashes", () => {
    expect(sanitizeCSSValue("red")).toBe("red");
    expect(sanitizeCSSValue("red; background: blue")).toBe("red background: blue");
    expect(sanitizeCSSValue("red} body { background: blue")).toBe("red body  background: blue");
  });

  it("blocks dangerous injection patterns and returns transparent", () => {
    expect(sanitizeCSSValue("url(javascript:alert(1))")).toBe("transparent");
    expect(sanitizeCSSValue("expression(alert(1))")).toBe("transparent");
    expect(sanitizeCSSValue("javascript:alert(1)")).toBe("transparent");
    expect(sanitizeCSSValue("red</style><script>")).toBe("transparent");
  });
});
