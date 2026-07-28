/**
 * Security utilities for CSS sanitization and injection prevention.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or data attribute values)
 * by stripping out any characters that are not alphanumeric, hyphens, or underscores.
 */
export function sanitizeCSSIdentifier(val: string): string {
  if (typeof val !== "string") return "";
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors) to prevent injection of malicious code,
 * closing tags, or expression/url execution.
 *
 * It blocks "url(", "expression(", "javascript:", and "</style>" tags.
 * It also strips semicolon, curly braces, and backslash characters.
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";

  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }

  // Strip ';', '{', '}', and '\'
  return val.replace(/[;{}\\]/g, "");
}
