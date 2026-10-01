/**
 * Security utilities for input sanitization and defense in depth.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS custom property names)
 * to prevent CSS injection vulnerabilities.
 * Strips any characters outside safe alphanumeric, hyphen, and underscore characters.
 * Returns a fallback identifier if sanitization results in an empty string.
 */
export function sanitizeCSSIdentifier(identifier: string, fallback = "chart-default"): string {
  if (typeof identifier !== "string") {
    return fallback;
  }
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Sanitizes CSS property values to prevent breaking out of CSS rules,
 * injecting malicious styles, HTML tag escaping, or executing CSS expression functions.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/<[^>]*>?/g, "") // remove HTML tags
    .replace(/\\/g, "") // remove backslashes
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove CSS comments
    .replace(/[{};<>]/g, "") // remove CSS rule delimiters and brackets
    .replace(/(url|expression)\s*\(/gi, ""); // strip dangerous CSS functions
}
