/**
 * Security utilities for sanitizing dynamically injected CSS content.
 */

/**
 * Sanitizes a string intended to be used as a CSS identifier (class, id, key, or CSS variable name).
 * Strips out any characters except standard alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") {
    return "";
  }
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS property value (such as color values or theme strings).
 * Strips potentially dangerous characters like ';', '{', '}', '\' and neutralizes
 * common CSS injection / XSS payload vectors such as url(), expression(), javascript:, and style tag closes.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") {
    return "";
  }
  // Strip characters that break out of CSS property declarations or rulesets
  let sanitized = value.replace(/[;{}\\]/g, "");

  // Neutralize dangerous protocols/functions/tags
  sanitized = sanitized.replace(/url\s*\(/gi, "invalid-url(")
    .replace(/expression\s*\(/gi, "invalid-expression(")
    .replace(/javascript\s*:/gi, "invalid-javascript:")
    .replace(/<\/style/gi, "<\\/style");

  return sanitized.trim();
}
