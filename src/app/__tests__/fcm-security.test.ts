import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleFcmClick } from "../services/firebase";

describe("FCM Security / handleFcmClick", () => {
  const initialUrl = "https://example.com/app";

  beforeEach(() => {
    // Setup window.location mock
    delete (window as any).location;
    window.location = {
      origin: "https://example.com",
      href: initialUrl,
      pathname: "/app",
      search: "",
      hash: "",
    } as any;
  });

  it("should navigate to valid relative URL", () => {
    handleFcmClick("/rides/123");
    expect(window.location.href).toBe("/rides/123");
  });

  it("should navigate to valid same-origin absolute URL", () => {
    handleFcmClick("https://example.com/notifications?id=1");
    expect(window.location.href).toBe("/notifications?id=1");
  });

  it("should ignore external cross-origin URLs (Open Redirect)", () => {
    handleFcmClick("https://malicious-site.com/phishing");
    expect(window.location.href).toBe(initialUrl);
  });

  it("should ignore javascript: protocol URLs (XSS)", () => {
    handleFcmClick("javascript:alert(1)");
    expect(window.location.href).toBe(initialUrl);
  });

  it("should ignore data: protocol URLs", () => {
    handleFcmClick("data:text/html,<script>alert(1)</script>");
    expect(window.location.href).toBe(initialUrl);
  });
});
