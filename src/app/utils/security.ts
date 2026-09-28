/**
 * Utilities for sanitizing dynamic content rendered in HTML or CSS contexts.
 */

/**
 * Sanitizes a CSS identifier (e.g., element ID, class name, or CSS variable key)
 * to ensure only alphanumeric characters, hyphens, and underscores are allowed.
 */
export function sanitizeCSSIdentifier(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (e.g. hex colors, rgb/hsl functions) to prevent CSS injection
 * or breaking out of style tags.
 */
export function sanitizeCSSValue(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[\{\}\;<>\\/*]/g, "") // Strip CSS block delimiters, comments, and backslashes
    .replace(/(url|expression)\s*\(/gi, ""); // Neutralize dangerous CSS function calls
}
