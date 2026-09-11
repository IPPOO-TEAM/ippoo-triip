/**
 * Security utilities for input sanitization and defense-in-depth against injection attacks.
 */

/**
 * Sanitizes CSS identifiers (keys, IDs, class names) to allow only alphanumeric characters,
 * underscores, and hyphens.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (e.g. colors, lengths) to prevent CSS injection / XSS attacks.
 * Strips dangerous tokens, HTML tags, backslashes, comment markers, and block/declaration delimiters.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Strip <style> and <script> blocks along with all HTML tags, backslashes, comments, and delimiters
  let clean = value
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{};<>]/g, "");

  // 2. Iteratively strip unsafe CSS functions / keywords until reaching a fixed point
  const unsafePatterns = [/url\s*\(/gi, /expression\s*\(/gi, /javascript\s*:/gi, /style/gi];

  let previous: string;
  do {
    previous = clean;
    for (const pattern of unsafePatterns) {
      clean = clean.replace(pattern, "");
    }
  } while (clean !== previous);

  return clean.trim();
}
