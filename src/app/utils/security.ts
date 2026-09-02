/**
 * Utilities for security and sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs or property keys).
 * Strips all characters outside alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(id: string): string {
  if (!id) return "";
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values to prevent CSS injection and XSS via style tags.
 * Strips HTML tags, backslashes, comment markers, delimiters ({}, ;, <>, ()),
 * and iteratively removes unsafe keywords (url, expression, javascript, style)
 * to prevent nested bypasses.
 */
export function sanitizeCSSValue(val: string): string {
  if (!val) return "";

  // 1. Remove HTML tags
  let sanitized = val.replace(/<[^>]*>/g, "");

  // 2. Remove backslashes, comments, and CSS delimiters/braces
  sanitized = sanitized
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{}\n\r;<>]/g, "");

  // 3. Iteratively remove dangerous CSS tokens until no changes occur
  const unsafePatterns = [
    /url/gi,
    /expression/gi,
    /javascript\s*:/gi,
    /style/gi,
  ];
  let previous: string;
  do {
    previous = sanitized;
    for (const pattern of unsafePatterns) {
      sanitized = sanitized.replace(pattern, "");
    }
  } while (sanitized !== previous);

  // 4. Normalize whitespace
  return sanitized.replace(/\s+/g, " ").trim();
}
