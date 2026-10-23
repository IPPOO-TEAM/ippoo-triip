import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handleFcmClick } from "../services/firebase";

describe("FCM Click Navigation Security", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      origin: "https://app.ippoo.com",
      href: "https://app.ippoo.com/dashboard",
      pathname: "/dashboard",
      search: "",
      hash: "",
    } as unknown as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("allows relative URL navigation", () => {
    handleFcmClick("/app/notifications");
    expect(window.location.href).toBe("/app/notifications");
  });

  it("allows same-origin absolute URL navigation", () => {
    handleFcmClick("https://app.ippoo.com/app/profile");
    expect(window.location.href).toBe("https://app.ippoo.com/app/profile");
  });

  it("blocks protocol-relative URLs leading to external domains", () => {
    handleFcmClick("//evil.com/phishing");
    expect(window.location.href).toBe("https://app.ippoo.com/dashboard");
  });

  it("blocks external domain URLs (open redirect attempt)", () => {
    handleFcmClick("https://evil.com/phishing");
    expect(window.location.href).toBe("https://app.ippoo.com/dashboard");
  });

  it("blocks javascript: pseudo-protocol URLs", () => {
    handleFcmClick("javascript:alert('xss')");
    expect(window.location.href).toBe("https://app.ippoo.com/dashboard");
  });

  it("blocks invalid/malformed URLs", () => {
    handleFcmClick("http://");
    expect(window.location.href).toBe("https://app.ippoo.com/dashboard");
  });
});
