/**
 * Security utility functions for input sanitization and protection.
 */

/**
 * Sanitizes a CSS identifier or property key.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values to prevent CSS injection and XSS via style tags.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip HTML tags, backslashes, comment markers, and CSS delimiters
  let sanitized = value
    .replace(/<[^>]*>/g, "")
    .replace(/[\/\\{}<>;]/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Iteratively remove unsafe tokens until fixed point to prevent nested bypasses
  const unsafePatterns = [/url\s*\(/gi, /expression\s*\(/gi, /javascript\s*:/gi, /style/gi];

  let prev = "";
  while (sanitized !== prev) {
    prev = sanitized;
    for (const pattern of unsafePatterns) {
      sanitized = sanitized.replace(pattern, "");
    }
  }

  return sanitized.trim();
}
