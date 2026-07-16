/**
 * Security utilities for sanitization and validation.
 */

/**
 * Sanitizes a string for use as a CSS identifier (e.g., variable name or ID).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value to prevent injection.
 * Blocks common injection patterns like 'url(', 'expression(', 'javascript:', and '</style>'.
 */
export function sanitizeCSSValue(value: string): string {
  // Basic protection against common CSS injection vectors
  if (
    /url\(|expression\(|javascript:|@import|<\/style>/i.test(value)
  ) {
    return "transparent";
  }

  // Strip characters that could be used to break out of a declaration or rule
  return value.replace(/[;}\\]/g, "");
}
