/**
 * Security utilities for input sanitization and prevention of injection vulnerabilities.
 */

/**
 * Sanitizes a CSS identifier (such as element IDs, class names, or CSS variable keys).
 * Keeps only safe alphanumeric characters, hyphens, and underscores.
 * Preserves static leading dot/hash if passed, or strips disallowed characters.
 */
export function sanitizeCSSIdentifier(identifier: string, fallback: string = ""): string {
  if (typeof identifier !== "string") return fallback;
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized || fallback;
}

/**
 * Sanitizes CSS values (such as colors or variable values) injected into inline <style> tags.
 * Strips HTML tags, backslashes, comment delimiters, CSS block/declaration delimiters,
 * and dangerous CSS function calls (like url(...) or expression(...)).
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{};<>]/g, "")
    .replace(/(url|expression)\s*\(/gi, "");
}
