/**
 * Security utilities for input sanitization and verification to prevent injection attacks (e.g., CSS injection, XSS).
 */

/**
 * Sanitizes CSS identifiers (such as IDs or keys) by allowing only alphanumeric characters, hyphens, and underscores.
 * Any other character is stripped out to prevent breaking out of CSS selectors.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors) to prevent injection of styles, scripts, or closing tags.
 * Blocks sensitive functions/words like 'url(', 'expression(', 'javascript:', and '</style>'.
 * Strips character delimiters like ';', '}', and '\'.
 */
export function sanitizeCSSValue(value: string): string {
  // If value contains dangerous keywords, return an empty string/fallback
  const dangerousRegex = /url\s*\(|expression\s*\(|javascript\s*:|<\/style>/i;
  if (dangerousRegex.test(value)) {
    return "";
  }
  // Strip out delimiters that can terminate statements or escape characters
  return value.replace(/[;}\\]/g, "").trim();
}
