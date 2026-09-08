/**
 * Security utilities for sanitizing dynamic values injected into CSS/DOM.
 */

/**
 * Sanitizes CSS identifiers (keys, IDs, class name fragments).
 * Strips characters outside alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (colors, dimensions, custom properties).
 * Prevents CSS injection / break-out attacks by stripping comment delimiters,
 * block delimiters ({}, ;), backslashes, HTML brackets (<>), and unsafe CSS tokens.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Remove HTML tags and CSS comments
  let sanitized = value
    .replace(/\/\*[\s\S]*?\*\//g, "") // CSS comments /* ... */
    .replace(/<[^>]*>/g, ""); // HTML tags

  // 2. Remove dangerous CSS structural characters / delimiters
  sanitized = sanitized.replace(/[{};<>\\]/g, "");

  // 3. Iteratively remove dangerous functions/schemes until fixed point to prevent nested bypasses
  const unsafePatterns = [/url\s*\(/gi, /expression\s*\(/gi, /javascript\s*:/gi, /style\s*=/gi];
  let previous: string;
  do {
    previous = sanitized;
    for (const pattern of unsafePatterns) {
      sanitized = sanitized.replace(pattern, "");
    }
  } while (sanitized !== previous);

  return sanitized.trim();
}
