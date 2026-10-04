/**
 * Security utilities for input sanitization and defense-in-depth against injection vulnerabilities.
 */

/**
 * Sanitizes CSS identifiers (keys, IDs, variable names).
 * Allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values to prevent CSS injection and XSS via dynamic style tags.
 * Strips dangerous syntax characters, HTML tags, backslashes, comment markers, and function calls like url()/expression().
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[{}<>;\\]/g, "") // Remove CSS/HTML break-out characters and backslashes
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .replace(/(url|expression|javascript)\s*\(/gi, ""); // Remove potentially dangerous CSS function calls
}
