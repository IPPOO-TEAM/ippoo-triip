/**
 * Security utilities for input sanitization and defense-in-depth measures.
 */

/**
 * Sanitizes an identifier for use in CSS rules (e.g., class names, attribute values, or CSS variable names).
 * Strips out characters that could be used for CSS injection attacks or breaking out of style blocks.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") {
    return "";
  }
  // Allow leading dot for static selectors like ".dark", otherwise strip non-alphanumeric, dash, underscore, and dot characters.
  return identifier.replace(/[^a-zA-Z0-9-_.]/g, "");
}

/**
 * Sanitizes a CSS property value to prevent CSS injection (e.g., url(), expression(), javascript: URLs, or HTML tag injection).
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") {
    return "";
  }
  // Strip HTML delimiters < and > first
  let sanitized = value.replace(/[<>]/g, "");

  // Iteratively remove dangerous patterns until fixed point to prevent nested bypasses (e.g. `javajavascript:script:`)
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized
      .replace(/url\s*\((?:[^()]*|\([^()]*\))*\)/gi, "")
      .replace(/expression\s*\((?:[^()]*|\([^()]*\))*\)/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/import/gi, "");
  } while (sanitized !== prev);

  // Strip curly braces and semicolons that break out of CSS declarations
  sanitized = sanitized.replace(/[{};]/g, "");

  return sanitized.trim();
}
