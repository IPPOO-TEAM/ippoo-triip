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
 * Strips characters that could be used to break out of a CSS rule or the <style> tag.
 */
export function sanitizeColor(color: string): string {
  if (!color) return "";
  // Remove characters that could be used for CSS injection or closing the style tag
  return color.replace(/[;}\\]|<\/style>/gi, "");
}
