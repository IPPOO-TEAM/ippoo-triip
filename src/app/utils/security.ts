/**
 * Security sanitization utilities.
 * Designed to prevent CSS and HTML injections when embedding user/dynamic content in dynamic styling.
 */

/**
 * Sanitizes CSS identifiers (such as class names, custom properties keys, and elements IDs).
 * Restricts key characters to alphanumeric, dashes, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS values (such as color values, sizes, etc.).
 * Strips semicolon, brace, and backslash characters, and blocks patterns like "url(", "expression(", "javascript:", and closing style tags.
 */
export function sanitizeCSSValue(val: string): string {
  let clean = val.replace(/[;{}\\]/g, "");
  const lower = clean.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "transparent";
  }
  return clean;
}
