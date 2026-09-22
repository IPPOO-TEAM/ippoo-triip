/**
 * Centralized security and sanitization utilities.
 */

/**
 * Sanitizes CSS identifiers (such as CSS variables, HTML data attributes, or class/element IDs).
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors, lengths, font families).
 * Removes HTML tags, backslashes, CSS comment delimiters, syntax delimiters ({, }, ;, <, >),
 * and dangerous CSS function calls like url(...) or expression(...).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  let sanitized = value
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove backslashes and comment markers
    .replace(/[\/\\]\*|\*[\/\\]/g, "")
    .replace(/\\/g, "")
    // Remove syntax delimiters
    .replace(/[{};<>]/g, "");

  // Remove dangerous functions like url(...) or expression(...)
  sanitized = sanitized.replace(/(url|expression)\s*\(/gi, "");

  return sanitized.trim();
}
