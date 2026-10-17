/**
 * Utilities for sanitizing dynamic values injected into CSS or HTML.
 */

/**
 * Sanitizes dynamic CSS identifiers (e.g., IDs, property key names).
 * Strips characters outside [a-zA-Z0-9-_].
 */
export function sanitizeCSSIdentifier(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (e.g., colors, lengths).
 * Strips HTML tags, comment blocks, backslashes, comment markers, delimiters ({, }, ;, <, >),
 * and dangerous function calls like url(...) or expression(...).
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[\\/*{};<>]/g, "")
    .replace(/\b(url|expression)\s*\(/gi, "");
}
