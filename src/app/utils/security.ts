/**
 * Security utilities for input sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as chart IDs or configuration keys).
 * Strips all characters except alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(id: string): string {
  if (typeof id !== "string") return "";
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (such as colors).
 * Blocks unsafe expressions/urls/tags and strips CSS delimiter injection characters.
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style")
  ) {
    return "";
  }
  return val.replace(/[;{}\\]/g, "").trim();
}
