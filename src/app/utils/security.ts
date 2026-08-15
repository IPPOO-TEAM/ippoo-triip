/**
 * Security utilities for input sanitization and defense-in-depth.
 */

/**
 * Sanitizes a string intended for use as a CSS class, identifier, or variable key.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  if (typeof id !== "string") return "";
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS property value to prevent CSS injection, break-out, and XSS.
 * Removes dangerous constructs like url(), expression(), javascript:, </style> tags,
 * and characters used for CSS syntax breaking (;, {}, \).
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/url\s*\(/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/["'\\]/g, "")
    .replace(/[;{}]/g, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}
