import { describe, it, expect } from "vitest";
import { isSafeUrl } from "../services/firebase";

describe("FCM Security / isSafeUrl", () => {
  it("allows relative paths", () => {
    expect(isSafeUrl("/rides/123")).toBe(true);
    expect(isSafeUrl("/wallet")).toBe(true);
    expect(isSafeUrl("/")).toBe(true);
  });

  it("allows same-origin absolute URLs", () => {
    const origin = window.location.origin;
    expect(isSafeUrl(`${origin}/rides/123`)).toBe(true);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeUrl("//evil.com/phish")).toBe(false);
  });

  it("rejects javascript: and data: URLs (XSS)", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects external cross-origin URLs (Open Redirect)", () => {
    expect(isSafeUrl("https://evil.com")).toBe(false);
    expect(isSafeUrl("https://phishing-site.com/login")).toBe(false);
  });

  it("rejects invalid/malformed inputs", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(null as any)).toBe(false);
  });
});
