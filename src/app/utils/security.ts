/**
 * Sanitizes a CSS identifier (e.g., HTML element IDs, class names, variable keys).
 * Restricts characters to alphanumeric, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(str: string): string {
  if (!str) return "";
  return str.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Sanitizes a CSS property value (e.g., color string, measurement).
 * Blocks unsafe expressions, urls, script protocols, and closing style tags.
 */
export function sanitizeCSSValue(str: string): string {
  if (!str) return "";
  return str
    .replace(/url\(/gi, "")
    .replace(/expression\(/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<\/style/gi, "")
    .replace(/[;{}\\]/g, "")
    .trim();
}
