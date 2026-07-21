/**
 * Centralized security sanitization utilities.
 * Protects components injecting dynamic values into CSS/HTML.
 */

/**
 * Sanitizes a CSS identifier (like IDs, class names, or custom property keys).
 * Keeps only alphanumeric characters, dashes, and underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS property value (like colors).
 * Blocks forbidden patterns: url(), expression(), javascript:, and </style> tags.
 * Strips semicolon, closing curly brace, and backslash characters.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") {
    return "";
  }

  let sanitized = value;

  // Case-insensitive patterns for blocking potentially harmful injections
  const forbiddenPatterns = [
    /url\s*\(/gi,
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /<\/style>/gi
  ];

  for (const pattern of forbiddenPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Strip characters used to break out of CSS rules: ';', '}', and '\'
  sanitized = sanitized.replace(/[;}\\]/g, "");

  return sanitized;
}
