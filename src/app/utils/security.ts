/**
 * Security sanitization utilities to prevent injection vulnerabilities.
 */

/**
 * Sanitizes CSS identifiers (such as class names, IDs, data attributes, keys).
 * Removes any characters except alphanumeric, hyphen, and underscore.
 */
export function sanitizeCSSIdentifier(val: string): string {
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as colors).
 * Blocks forbidden patterns (url, expression, javascript, </style> tags)
 * and strips dangerous characters like semicolon, curly braces, and backslash.
 */
export function sanitizeCSSValue(val: string): string {
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }
  return val.replace(/[;}\\]/g, "");
}
