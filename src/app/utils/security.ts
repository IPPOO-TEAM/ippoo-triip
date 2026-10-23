/**
 * Security utilities for IPPOO TRIIP.
 * Handles sanitization of inputs used in sensitive contexts like dangerouslySetInnerHTML.
 */

/**
 * Sanitizes a string for use as a CSS identifier or data attribute value.
 * Strips any character that is not a letter, number, hyphen, or underscore.
 */
export function sanitizeCSSIdentifier(str: string): string {
  return str.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a string for use as a CSS property value (e.g., color).
 * Blocks dangerous patterns and strips characters that could be used for injection.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  const dangerousPatterns = [
    /url\(/i,
    /expression\(/i,
    /javascript:/i,
    /<\/style>/i,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(value))) {
    return "";
  }

  // Strip ;, } and \
  return value.replace(/[;}\\]/g, "");
}
