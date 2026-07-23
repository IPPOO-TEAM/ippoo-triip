/**
 * Security utilities to sanitize injected CSS identifiers and values,
 * mitigating CSS Injection attacks (XSS via styles, data exfiltration, etc.).
 */

/**
 * Sanitizes a CSS identifier or property name.
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (e.g., color).
 * Blocks attempts to import URLs, evaluate expressions, run scripts, or break styles,
 * and removes punctuation characters that could close a CSS rule.
 */
export function sanitizeCSSValue(value: string): string {
  if (!value) return "";

  // Strip characters capable of terminating a CSS declaration or escaping content
  let cleaned = value.replace(/[;}\\]/g, "");

  const lower = cleaned.toLowerCase();

  // Block common injection vectors: url, expression, javascript protocols, and style tags
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "transparent";
  }

  return cleaned;
}
