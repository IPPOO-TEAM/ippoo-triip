/**
 * Security utilities for the IPPOO application.
 */

/**
 * Sanitizes a CSS identifier (like class names, IDs, variable names).
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(val: string): string {
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (like colors, lengths).
 * Validates against common injection patterns such as html tags, javascript execution,
 * and malicious style closing.
 */
export function sanitizeCSSValue(val: string): string {
  // Block potential CSS/HTML injection keywords & characters
  if (
    /url\(/i.test(val) ||
    /expression\(/i.test(val) ||
    /javascript:/i.test(val) ||
    /<\/style>/i.test(val)
  ) {
    return "transparent";
  }
  // Strip out semicolons, brackets, and backslashes to prevent escaping property rules
  return val.replace(/[;}\\]/g, "");
}
