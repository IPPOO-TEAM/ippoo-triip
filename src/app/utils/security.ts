/**
 * Utility functions for security sanitization.
 */

/**
 * Sanitizes an identifier (like a CSS ID or data attribute value) to prevent
 * injection or broken selectors.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a color value to prevent CSS injection.
 * Strips characters and keywords that could be used for CSS injection or XSS.
 */
export function sanitizeColor(color: string): string {
  if (!color) return "";
  // Block common CSS injection patterns
  if (/(url\(|expression\(|javascript:|<\/style>)/gi.test(color)) {
    return "transparent";
  }
  // Strip characters that can break out of a CSS rule
  return color.replace(/[;}\\]/g, "");
}
