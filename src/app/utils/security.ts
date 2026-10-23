/**
 * Utility functions for security sanitization.
 */

/**
 * Sanitizes an identifier (e.g., for use in CSS selectors or data attributes).
 * Strips any character that is not a-z, A-Z, 0-9, -, or _.
 */
export function sanitizeIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a color value for safe injection into a <style> tag.
 * Blocks dangerous patterns and strips characters that could be used to break out of the CSS rule.
 */
export function sanitizeColor(color: string): string {
  if (!color) return "";

  const dangerousPatterns = [/url\(/i, /expression\(/i, /javascript:/i, /<\/style>/i];
  if (dangerousPatterns.some((pattern) => pattern.test(color))) {
    return "transparent";
  }

  // Strip characters that could be used to inject CSS properties or break the style block
  return color.replace(/[;}\\]/g, "");
}
