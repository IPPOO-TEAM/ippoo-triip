/**
 * Security sanitization utilities
 */

/**
 * Sanitizes a CSS identifier (e.g., element ID, class name, key/property name)
 * to prevent CSS injection attacks via uncontrolled dynamic values.
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(input: string, fallback = "default"): string {
  if (typeof input !== "string") return fallback;
  const sanitized = input.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Sanitizes a CSS property value (e.g., color hex, rgb, css variables).
 * Strips HTML tags, backslashes, comment markers, curly braces, angle brackets,
 * semicolons, and dangerous function calls like url() or expression().
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\\/g, "") // strip backslashes
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip block comments
    .replace(/[{};<>]/g, "") // strip CSS delimiters
    .replace(/(url|expression)\s*\(/gi, ""); // strip dangerous function calls
}
