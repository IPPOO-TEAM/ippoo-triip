/**
 * Security utilities for IPPOO TRIIP.
 * Centralizes sanitization logic to prevent vulnerabilities like CSS Injection.
 */

/**
 * Sanitizes a CSS identifier (like an ID or a key used in a CSS variable name).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (like a color).
 * Blocks common injection vectors and strips characters that could break out of a declaration.
 */
export function sanitizeCSSValue(value: string): string {
  if (!value) return "";

  const lowerValue = value.toLowerCase();

  // Block potential dangerous patterns
  if (
    lowerValue.includes("url(") ||
    lowerValue.includes("expression(") ||
    lowerValue.includes("javascript:") ||
    lowerValue.includes("</style>")
  ) {
    return "";
  }

  // Strip characters that could be used for injection or breaking the CSS block
  return value.replace(/[;}\\]/g, "");
}
