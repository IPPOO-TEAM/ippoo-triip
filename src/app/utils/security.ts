/**
 * Security utilities for sanitizing dynamic CSS selectors and values.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs and CSS custom property names).
 * Strips all characters outside a-z, A-Z, 0-9, hyphen (-), and underscore (_).
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as color strings).
 * Strips HTML tags, backslashes, comment markers, and CSS delimiters ({, }, ;, <, >),
 * then iteratively removes unsafe tokens ('url(', 'expression(', 'javascript:', 'style')
 * until a fixed point is reached to prevent nested bypasses.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip HTML tags, backslashes, CSS comment markers, and delimiters
  let sanitized = value
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{};<>]/g, "");

  // 2. Iteratively strip unsafe tokens until reaching a fixed point
  const unsafePattern = /url\(|expression\(|javascript:|style/gi;
  let previous: string;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(unsafePattern, "");
  } while (sanitized !== previous);

  return sanitized;
}
