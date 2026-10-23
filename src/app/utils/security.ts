/**
 * Security utilities for input sanitization and defensive coding.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS custom property keys).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as color values or dimension strings).
 * Blocks dangerous patterns like `url(`, `expression(`, `javascript:`, and `</style>` tags,
 * and strips characters like `;`, `{`, `}`, and `\`.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // Check for suspicious/dangerous CSS or HTML breaking patterns
  const dangerousPatterns = [/url\s*\(/i, /expression\s*\(/i, /javascript\s*:/i, /<\/style/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return "";
    }
  }

  // Strip characters that could escape out of property declaration blocks
  return value.replace(/[;{}\\]/g, "").trim();
}
