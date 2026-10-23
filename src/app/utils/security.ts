/**
 * Security utilities for sanitizing dynamically generated CSS and HTML/DOM attributes.
 */

/**
 * Sanitizes an identifier used in dynamic CSS (e.g., class names, dynamic data-attributes, variable names).
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values (e.g., color hex codes, rgb values, theme variables).
 * Prevents CSS injection (breakouts using `;`, `}`, `{`), HTML tag injection (`<`, `>`),
 * comment injections, and execution of dangerous functions like `url()` or `expression()`.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  return value
    // Remove HTML tags and CSS comments (including unclosed comments)
    .replace(/<[^>]*>/g, "")
    .replace(/\/\*[\s\S]*?(\*\/|$)/g, "")
    // Remove block delimiters, statement separators, backslashes and angle brackets
    .replace(/[{}<>;\\]/g, "")
    // Strip dangerous function calls like url(...) or expression(...) without breaking CSS color names like burlywood
    .replace(/(url|expression)\s*\(/gi, "");
}
