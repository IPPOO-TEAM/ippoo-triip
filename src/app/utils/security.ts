/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS property key suffixes).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values to prevent CSS injection and XSS payload execution via style tags.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Remove HTML tags, delimiters, comments, and backslashes
  let sanitized = value
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[{}<>;]/g, "");

  // 2. Iteratively strip unsafe tokens until fixed point reached to prevent nested bypasses (e.g. `javascjavascript:ript:`)
  const unsafeTokens = [/url\s*\(/gi, /expression\s*\(/gi, /javascript\s*:/gi, /style/gi];
  let previous = "";

  while (sanitized !== previous) {
    previous = sanitized;
    for (const token of unsafeTokens) {
      sanitized = sanitized.replace(token, "");
    }
  }

  return sanitized.replace(/\s+/g, " ").trim();
}
