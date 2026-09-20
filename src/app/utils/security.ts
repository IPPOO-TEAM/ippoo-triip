/**
 * Security utilities for sanitizing dynamic CSS inputs (identifiers, keys, values).
 * Protects against CSS injection and XSS via dynamic <style> tags.
 */

/**
 * Sanitizes CSS identifiers (IDs, class names, property keys).
 * Strictly permits alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (colors, lengths, etc.).
 * Strips HTML tags, comment markers, backslashes, statement delimiters,
 * and dangerous functions/protocols (e.g. url(), expression(), javascript:).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  let sanitized = value
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/[\\{}<>;]/g, "");

  let prev: string;
  const unsafePattern = /(url\(|expression\(|javascript:|style)/gi;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(unsafePattern, "");
  } while (sanitized !== prev);

  return sanitized.trim();
}
