/**
 * Utility functions for security sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as class names, element IDs, or variable keys)
 * to prevent CSS injection vulnerabilities. Allows only alphanumeric characters,
 * hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors, lengths, etc.) to prevent
 * breaking out of CSS rules or executing malicious code/injections.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // Remove HTML tags, backslashes, comment markers, and block delimiters
  let sanitized = value.replace(/[\/\\{}<>;]/g, "").replace(/<[^>]*>?/gm, "");

  // Iteratively strip unsafe CSS functions/keywords to prevent nested bypasses
  let prev = "";
  while (sanitized !== prev) {
    prev = sanitized;
    sanitized = sanitized
      .replace(/url\s*\([^)]*\)/gi, "")
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/style/gi, "");
  }

  return sanitized.replace(/\s+/g, " ").trim();
}
