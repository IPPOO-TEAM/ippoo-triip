/**
 * Utilities for security and sanitization across the application.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs or CSS class/variable names)
 * by removing any characters outside of alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values to prevent CSS injection, XSS breakout, and unwanted function execution.
 * Strips HTML tags, backslashes, CSS comments, rule delimiters, and dangerous function calls like url() or expression().
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip HTML tags, backslashes, comment markers, and delimiters
  let cleaned = value
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{};<>]/g, "");

  // 2. Strip dangerous CSS function calls (e.g. url(...), expression(...))
  cleaned = cleaned.replace(/(url|expression)\s*\(/gi, "");

  return cleaned.trim();
}
