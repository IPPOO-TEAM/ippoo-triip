/**
 * Security sanitization utilities.
 */

/**
 * Sanitizes CSS identifiers (such as class names, custom property names, or dataset values)
 * by keeping only safe characters.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors) by blocking potentially dangerous
 * features like 'url(', 'expression(', 'javascript:', and '</style>' tags, and
 * stripping forbidden characters like ';', '}', and '\'.
 */
export function sanitizeCSSValue(value: string): string {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("url(") ||
    normalized.includes("expression(") ||
    normalized.includes("javascript:") ||
    normalized.includes("</style>")
  ) {
    return "";
  }
  return value.replace(/[;}\\]/g, "");
}
