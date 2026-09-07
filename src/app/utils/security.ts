/**
 * Security sanitization utilities to prevent CSS Injection / Reflected XSS
 * in dynamically rendered CSS blocks.
 */

/**
 * Sanitizes CSS identifiers such as element IDs, class names, or CSS property keys.
 * Strips any characters outside alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (e.g. hex codes, rgb/hsl values, named colors)
 * by stripping HTML/CSS block delimiters, backslashes, comments, and dangerous directives.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // Remove HTML tags, delimiters, backslashes, and comment characters
  let clean = value.replace(/[{};<>\\/]/g, "").trim();

  // Iteratively strip dangerous CSS functions/protocols until fixed point
  let prev = "";
  while (clean !== prev) {
    prev = clean;
    clean = clean.replace(/(url\(|expression\(|javascript:|style)/gi, "");
  }

  return clean;
}
