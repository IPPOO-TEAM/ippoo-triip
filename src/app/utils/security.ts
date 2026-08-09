/**
 * Security utilities for the IPPOO application.
 */

/**
 * Sanitizes a CSS identifier (IDs/keys) by removing any characters
 * that are not letters, digits, hyphens, or underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (e.g., color) to prevent CSS injection.
 * Blocks dangerous functions/tags ('url(', 'expression(', 'javascript:', '</style>')
 * and strips characters that can be used to break out of CSS rules (';', '}', '\').
 */
export function sanitizeCSSValue(val: string): string {
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "transparent";
  }
  // Strip ;, }, and \
  return val.replace(/[;}\\]/g, "");
}
