/**
 * Security utilities for CSS input sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as class names, IDs, data attributes, CSS variable names)
 * by retaining only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors, lengths) injected into <style> blocks or inline styles.
 * Strips HTML/CSS syntax delimiters and iteratively removes potentially dangerous functions/keywords
 * (url, expression, javascript, style) until a fixed point is reached to prevent nested bypasses.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // Remove HTML and CSS rule delimiters to prevent breaking out of context
  let sanitized = value.replace(/[<>{};]/g, "");

  // Iteratively strip unsafe CSS keywords/tokens until no more instances exist
  const unsafePattern = /(url|expression|javascript|style)/gi;
  let previous: string;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(unsafePattern, "");
  } while (sanitized !== previous);

  return sanitized.trim();
}
