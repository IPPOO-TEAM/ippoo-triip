/**
 * Security utilities for input sanitization and context escaping.
 */

/**
 * Sanitizes an identifier used in dynamic CSS selectors, class names, or CSS variable names.
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS property values to prevent CSS injection, break-out, and XSS.
 * Removes HTML tags, backslashes, comments, block delimiters, and dangerous CSS expressions.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")             // Remove HTML tags (e.g. </style>)
    .replace(/\\/g, "")                  // Remove backslashes (escape sequence abuse)
    .replace(/\/\*[\s\S]*?\*\//g, "")     // Remove CSS comments
    .replace(/[{};<>]/g, "")             // Remove CSS block delimiters and statement terminators
    .replace(/(url|expression)\s*\(/gi, "") // Neutralize url(...) and IE expression(...) calls
    .trim();
}
