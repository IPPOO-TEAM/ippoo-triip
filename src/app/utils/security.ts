/**
 * Security utilities for sanitizing inputs used in dynamic CSS generation
 * and HTML contexts to protect against CSS injection and XSS.
 */

/**
 * Sanitizes CSS identifiers (e.g. element IDs, attribute values, variable names).
 * Allows only alphanumeric characters, underscores, and hyphens.
 */
export function sanitizeCSSIdentifier(input: unknown, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  const sanitized = input.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized || fallback;
}

/**
 * Sanitizes CSS values to prevent CSS injection and XSS breakout.
 * Strips HTML tags, backslashes, comment markers, delimiters ({, }, ;, <, >),
 * and function calls like url() and expression().
 */
export function sanitizeCSSValue(val: unknown): string {
  if (typeof val !== "string") return "";

  return val
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{}<>;]/g, "")
    .replace(/(url|expression)\s*\(/gi, "")
    .trim();
}
