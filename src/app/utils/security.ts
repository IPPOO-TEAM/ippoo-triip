/**
 * Security utility functions for input sanitization and dynamic styling.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs or CSS variable keys).
 * Keeps only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values before inserting into dynamic <style> tags.
 * Prevents CSS injection and XSS by removing HTML tags, backslashes, comment markers,
 * CSS delimiters ({}, ;, <>), and dangerous function calls like url() or expression().
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    // Remove HTML tags
    .replace(/<[^>]*>?/g, "")
    // Remove backslashes, comment markers, and CSS block/statement delimiters
    .replace(/[\\{};<>]/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove functions like url(...) or expression(...)
    .replace(/(url|expression)\s*\(/gi, "");
}
