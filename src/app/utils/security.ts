/**
 * Utilities for security sanitization.
 */

/**
 * Sanitizes CSS identifiers (class names, attribute values, IDs, variable names).
 * Allows only alphanumeric characters, underscores, and hyphens.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Sanitizes CSS values to prevent CSS injection, XSS, and payload breaking.
 * Strips HTML tags, delimiters, and dangerous CSS functions.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  // Strip HTML tags, backslashes, comment markers, and control delimiters (}, {, ;, <, >)
  let cleaned = value
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\\/g, "")
    .replace(/[{};<>]/g, "");

  // Iteratively strip unsafe CSS tokens until fixed point to prevent nested bypasses
  const unsafeRegex = /url\s*\(|expression\s*\(|javascript\s*:|style/gi;
  let previous = "";
  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(unsafeRegex, "");
  }

  return cleaned.trim();
}
