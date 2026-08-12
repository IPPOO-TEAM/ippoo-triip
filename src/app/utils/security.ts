/**
 * Security utilities for CSS sanitization against CSS injection/XSS.
 */

/**
 * Sanitizes CSS identifiers (such as keys and IDs used as attribute/variable names).
 * Allows only standard safe alphanumeric characters, dashes, and underscores.
 * Anything else is stripped out.
 */
export function sanitizeCSSIdentifier(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as color codes, inline styles).
 * Blocks dangerous inputs containing 'url(', 'expression(', 'javascript:', and '</style>'.
 * Strips semicolons, curly braces, and backslashes to prevent rule injection.
 */
export function sanitizeCSSValue(input: string): string {
  if (typeof input !== "string") return "";

  const lower = input.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }

  // Strip characters commonly used to break out of rules: ;, }, \
  return input.replace(/[;}\\]/g, "");
}
