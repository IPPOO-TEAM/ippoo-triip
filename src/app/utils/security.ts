/**
 * Utility functions for security sanitization.
 */

/**
 * Sanitizes a CSS identifier (IDs/keys) to match /[^a-zA-Z0-9-_]/g.
 */
export function sanitizeCSSIdentifier(val: string): string {
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value to block dangerous functions/tags and strip breaking characters.
 */
export function sanitizeCSSValue(val: string): string {
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }
  return val.replace(/[;}\\]/g, "");
}
