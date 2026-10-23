/**
 * Security sanitization utilities.
 */

/**
 * Sanitizes CSS identifiers (IDs, keys, custom property names) to prevent injection.
 * Strips out any characters except letters, digits, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as color values) to prevent style injection and XSS.
 * Blocks/removes suspicious constructs like url(), expression(), javascript:, and </style> tags.
 * Also strips semicolons, closing braces, and backslashes to prevent escaping the declaration block.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // First, strip semicolons, closing braces, and backslashes
  let sanitized = value.replace(/[;}\\]/g, "");

  // Block suspicious constructs case-insensitively
  const unsafePatterns = [
    /url\s*\(/gi,
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /<\/style>/gi
  ];

  for (const pattern of unsafePatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized;
}
