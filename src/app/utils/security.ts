/**
 * Security utilities for input sanitization and CSS injection prevention.
 */

/**
 * Sanitizes CSS identifiers (class names, IDs, variable names).
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string, fallback = "default"): string {
  if (typeof identifier !== "string") return fallback;
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Sanitizes CSS property values to prevent breaking out of style declarations
 * or injecting harmful CSS/JavaScript constructs (e.g., expression(), url()).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[{}<>;\\/]/g, "") // Strip delimiters, HTML tags, backslashes, comment slash
    .replace(/\/\*[\s\S]*?\*\//g, "") // Strip CSS comment blocks
    .replace(/(url|expression)\s*\(/gi, ""); // Strip dangerous functions like url() or expression()
}
