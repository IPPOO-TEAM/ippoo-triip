/**
 * Security utilities for CSS sanitization and injection prevention.
 */

/**
 * Sanitizes CSS identifiers (IDs, class names, CSS variable keys).
 * Restricts output strictly to alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (e.g., colors, lengths).
 * Strips HTML tags, comment markers, CSS rule delimiters ({, }, ;, \, <, >),
 * and iteratively removes dangerous function calls / protocols like url(), expression(), and javascript:.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip comments first
  let sanitized = value.replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Strip basic dangerous delimiters, backslashes, and angle brackets
  sanitized = sanitized.replace(/[{}<>;\\]/g, "");

  // 3. Iteratively strip forbidden keywords/tokens to prevent nested bypasses (e.g. "ururl(()")
  const dangerousPatterns = [
    /url\s*\(/gi,
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /style\s*:/gi,
  ];

  let previous: string;
  do {
    previous = sanitized;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, "");
    }
  } while (sanitized !== previous);

  return sanitized.trim();
}
