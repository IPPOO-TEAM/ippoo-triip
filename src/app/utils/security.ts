/**
 * Utilities for security sanitization.
 */

/**
 * Sanitizes a CSS identifier (such as an element ID or CSS variable key)
 * by stripping any characters other than alphanumeric, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS property value to prevent CSS injection, XSS breaking out of style blocks,
 * or malicious URL execution.
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";

  // 1. Remove HTML tags, comments, backslashes, and CSS structural delimiters
  let clean = val
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\\/g, "")
    .replace(/[{};<>]/g, "");

  // 2. Iteratively strip unsafe CSS tokens until fixed-point to prevent nested bypasses
  const unsafePattern = /(url\(|expression\(|javascript:|style|@import)/gi;
  let previous: string;
  do {
    previous = clean;
    clean = clean.replace(unsafePattern, "");
  } while (clean !== previous);

  return clean.replace(/\s+/g, " ").trim();
}
