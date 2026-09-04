/**
 * Security utilities for input sanitization and defense in depth.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs or CSS variable key names)
 * to prevent CSS injection and structural context escaping.
 * Only alphanumeric characters, dashes, and underscores are allowed.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values to prevent breaking out of CSS rules,
 * injecting HTML/script tags, or exploiting CSS expression/url vulnerabilities.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip HTML tags, comments, backslashes, and CSS structural delimiters
  let clean = value
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[\{\}\;\<\>\\\/]/g, "");

  // 2. Iteratively strip unsafe CSS tokens to prevent nested bypass attempts (e.g. "javaJSscript:")
  let prev = "";
  while (clean !== prev) {
    prev = clean;
    clean = clean.replace(/(url\(|expression\(|javascript:|style)/gi, "");
  }

  return clean.trim();
}
