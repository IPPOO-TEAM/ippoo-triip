/**
 * Centralized security sanitization utilities.
 */

/**
 * Sanitizes CSS identifiers (such as class names, custom property names, data attribute values).
 * Strips out any characters that do not match [a-zA-Z0-9-_].
 */
export function sanitizeCSSIdentifier(val: string): string {
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as colors, fonts, margins) to prevent injection.
 * Blocks potential attack vectors such as url(), expression(), javascript:, and style closing tags.
 * Also strips out character terminators and escape characters like semicolon, closing brace, and backslash.
 */
export function sanitizeCSSValue(val: string): string {
  const normalized = val.trim();

  // Block lists for high-risk dynamic CSS features and tag breakouts
  if (
    /url\s*\(/i.test(normalized) ||
    /expression\s*\(/i.test(normalized) ||
    /javascript\s*:/i.test(normalized) ||
    /<\/style/i.test(normalized)
  ) {
    return "";
  }

  // Strip terminators and escape characters: ; } \
  return normalized.replace(/[;}\\]/g, "");
}
