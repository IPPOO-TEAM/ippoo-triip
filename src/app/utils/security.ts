/**
 * Security utilities for sanitizing CSS inputs used in inline styles or style tags.
 */

/**
 * Sanitizes a string for use as a CSS identifier (e.g., class name, id, variable name).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a string for use as a CSS property value (e.g., color, length).
 * Disallows CSS structure breakers, injection vectors (url, expression, javascript),
 * and closing HTML style tags.
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<\/style>/gi, "")
    .replace(/url\(/gi, "")
    .replace(/expression\(/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/[;{}\\]/g, "")
    .trim();
}
