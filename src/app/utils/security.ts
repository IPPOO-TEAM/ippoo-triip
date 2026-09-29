/**
 * Security utilities for input sanitization and defense-in-depth measures.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs or CSS variable keys)
 * to allow only safe alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors)
 * to prevent breaking out of CSS declarations or injecting HTML/scripts.
 */
export function sanitizeCSSValue(input: string): string {
  if (typeof input !== "string") return "";
  // Remove backslashes, comments, tags, and CSS block/statement delimiters ({, }, ;, <, >)
  let clean = input
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{}<>;]/g, "");
  // Strip dangerous CSS function calls like url( or expression(
  clean = clean.replace(/(url|expression)\s*\(/gi, "");
  return clean.trim();
}
