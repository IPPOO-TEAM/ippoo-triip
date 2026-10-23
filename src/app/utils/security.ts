/**
 * Security utilities for CSS sanitization.
 * Prevents CSS injection vulnerabilities, especially inside dangerouslySetInnerHTML.
 */

/**
 * Sanitizes a CSS identifier (e.g., class names, element IDs, data attribute names, variable keys).
 * Strictly allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (e.g., colors, lengths, styles).
 * Blocks dangerous inputs containing sequences like 'url(', 'expression(', 'javascript:', and '</style>'.
 * Also strips potential CSS breaking characters like semicolons, closing braces, and backslashes.
 */
export function sanitizeCSSValue(value: string): string {
  const normalized = value.toLowerCase();

  // Block known dangerous injection sequences
  if (
    normalized.includes("url(") ||
    normalized.includes("expression(") ||
    normalized.includes("javascript:") ||
    normalized.includes("</style>")
  ) {
    return "";
  }

  // Strip CSS syntax breakers: semicolons, curly braces, and backslashes
  return value.replace(/[;}\\]/g, "");
}
