/**
 * Security utilities for IPPOO TRIIP.
 * These functions help prevent common vulnerabilities like XSS when dealing with dynamic content.
 */

/**
 * Sanitizes a string for use as a CSS identifier (e.g., in data attributes or class names).
 * Removes any characters except alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a string for use as a CSS property value (e.g., color, spacing).
 * Blocks dangerous patterns that could lead to XSS or style injection.
 */
export function sanitizeCSSValue(value: string): string {
  if (!value) return "";

  // Block potential XSS vectors in CSS values
  const dangerousPatterns = [
    /url\(/i,
    /expression\(/i,
    /javascript:/i,
    /<\/style>/i,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(value))) {
    return "transparent";
  }

  // Strip characters that could be used to break out of a CSS rule
  return value.replace(/[;}\\]/g, "");
}
