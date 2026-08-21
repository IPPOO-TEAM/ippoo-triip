/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS custom property keys)
 * to prevent CSS injection vulnerabilities.
 * Strips any characters except alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (such as colors or lengths).
 * Prevents rule injection by stripping semicolons, curly braces, and backslashes,
 * and neutralizes potential XSS/injection vectors like `url()`, `expression()`,
 * `javascript:`, or `</style>`.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  // Check for dangerous patterns
  const lower = value.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }
  // Strip CSS block delimiters and escape characters
  return value.replace(/[;{}\\]/g, "").trim();
}
