/**
 * Utilities for security sanitization and defensive handling.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS variable keys).
 * Restricts output strictly to safe characters [a-zA-Z0-9-_].
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (such as colors, lengths, or strings).
 * Strips HTML tags, backslashes, comment markers, block delimiters ({, }, ;, <, >),
 * and dangerous CSS function calls (like url() or expression()).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  let sanitized = value
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove backslashes
    .replace(/\\/g, "")
    // Remove CSS comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove block delimiters & statement terminators
    .replace(/[{};<>]/g, "");

  // Remove unsafe CSS functions like url(...) or expression(...) handling nested parens
  while (/(url|expression)\s*\(/i.test(sanitized)) {
    const next = sanitized.replace(/(url|expression)\s*\((?:[^()]+|\([^()]*\))*\)/gi, "");
    if (next === sanitized) break;
    sanitized = next;
  }

  return sanitized.trim();
}
