/**
 * Security utilities for CSS and identifier sanitization.
 */

/**
 * Sanitizes a CSS identifier (e.g. CSS class name, ID, or variable key name)
 * by removing any character that is not alphanumeric, hyphen, or underscore.
 */
export function sanitizeCSSIdentifier(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (e.g. dynamic color, length, font) to prevent CSS injection / XSS.
 * Strips HTML tags, backslashes, CSS comments, block/statement delimiters ({}, ;, <, >),
 * and dangerous function calls like url() or expression().
 */
export function sanitizeCSSValue(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\\/g, "") // strip backslashes
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip CSS comment blocks
    .replace(/[{};<>]/g, "") // strip CSS delimiters/control chars
    .replace(/(url|expression)\s*\(/gi, ""); // strip url(...) and expression(...)
}
