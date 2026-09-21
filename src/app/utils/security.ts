/**
 * Security utilities for input sanitization and defense-in-depth.
 */

/**
 * Sanitizes a CSS identifier (e.g. ID, class name fragment, CSS variable suffix).
 * Strips any characters that are not alphanumeric, hyphen, or underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic values intended to be injected into CSS property values or CSS variables.
 * Prevents CSS injection attacks, break-out attempts, and XSS.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // 1. Remove HTML tag delimiters, structural CSS delimiters, backslashes, and comment markers
  let cleaned = value.replace(/[{}<>;\\]/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Iteratively strip dangerous CSS function tokens/protocols or key terms ('url(', 'expression(', 'javascript:', 'style') to prevent nested bypasses
  let previous: string;
  do {
    previous = cleaned;
    cleaned = cleaned.replace(/(url|expression|javascript|style)/gi, "");
  } while (cleaned !== previous);

  return cleaned.trim();
}
