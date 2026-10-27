/**
 * Security utilities for CSS and input sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, custom property keys).
 * Strips any character that is not alphanumeric, hyphen, or underscore.
 */
export function sanitizeCSSIdentifier(identifier: string, fallback = "chart"): string {
  if (!identifier) return fallback;
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized || fallback;
}

/**
 * Sanitizes dynamic values inserted into CSS declarations.
 * Strips HTML tags, comment markers, slashes, backslashes, braces, angle brackets, semicolons,
 * and dangerous CSS function calls (url(...), expression(...)).
 */
export function sanitizeCSSValue(value: string): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\\/*{}<>;]/g, "")
    .replace(/(url|expression)\s*\(/gi, "");
}
