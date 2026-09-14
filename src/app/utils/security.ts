/**
 * Security utilities for sanitizing inputs used in dynamic CSS / HTML generation.
 */

/**
 * Sanitizes CSS identifiers (IDs, class names, property keys).
 * Retains only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") {
    return "";
  }
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (e.g. colors, lengths) to prevent CSS injection / XSS.
 * Strips out HTML tags, backslashes, comment markers, curly braces, semicolons, angle brackets,
 * and dangerous dynamic functions like url(), expression(), javascript:, or style tags.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") {
    return "";
  }

  // 1. Strip HTML tags, backslashes, comment markers, curly braces, semicolons, and angle brackets
  let sanitized = value.replace(/<[^>]*>?|[\x00-\x1F\x7F-\x9F\\]|\/\*|\*\/|[{};<>]/g, "").trim();

  // 2. Iteratively strip dangerous CSS function tokens / protocols until fixed point reached
  const unsafePattern = /url\(|expression\(|javascript:|style/gi;
  let previous = "";
  while (sanitized !== previous) {
    previous = sanitized;
    sanitized = sanitized.replace(unsafePattern, "");
  }

  return sanitized.trim();
}
