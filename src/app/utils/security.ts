/**
 * Security utilities for input sanitization and defense-in-depth.
 */

/**
 * Sanitizes CSS identifiers (IDs, class names, CSS variable key names)
 * by allowing only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS values (e.g. colors, properties) by removing
 * syntax characters (`;`, `{`, `}`, `\`) and stripping dangerous constructs
 * (`url(`, `expression(`, `javascript:`, `</style>`).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  let clean = value.replace(/;|\{|\}|\\/g, "");
  if (/url\(|expression\(|javascript:|<\/style>/i.test(clean)) {
    clean = clean.replace(/url\(|expression\(|javascript:|<\/style>/gi, "");
  }
  return clean.trim();
}
