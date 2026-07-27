/**
 * Centralized security sanitization utilities for CSS and styling values.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, and attributes)
 * to prevent breakout from style selectors. Strips any character that is not
 * alphanumeric, hyphen, or underscore.
 */
export function sanitizeCSSIdentifier(val: string): string {
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as custom property values, color strings, etc.)
 * to prevent injection/XSS payloads.
 * Blocks dangerous inputs (url, expression, javascript, style tag closers)
 * and strips potential layout-breaking symbols like semicolon, closing brace, and backslash.
 */
export function sanitizeCSSValue(val: string): string {
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "none";
  }
  // Strip syntax breakers: ;, }, \
  return val.replace(/[;}\\]/g, "");
}
