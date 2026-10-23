/**
 * Security utilities for sanitizing dynamic content injected into CSS or HTML.
 */

/**
 * Sanitizes a string for use as a CSS identifier (e.g., class, ID, variable name).
 * Strips any characters that are not letters, numbers, hyphens, or underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS property value to prevent CSS injection / breakout.
 * Strips semicolon, closing brace, and backslash, and blocks dangerous constructs.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  const lower = value.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style")
  ) {
    return "";
  }

  return value.replace(/[;{}\\]/g, "");
}
