/**
 * Security utilities to sanitize CSS identifiers and values to prevent injection and XSS.
 */

/**
 * Sanitizes a CSS identifier (such as an ID, class name, or CSS variable key).
 * Strips any characters that do not match [a-zA-Z0-9-_].
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a CSS value (such as a color name, hex code, rgb, hsl, etc.).
 * Blocks critical CSS injection / XSS payload elements like url(), expression(), javascript:, and </style> tags.
 * Also strips structural CSS characters (;, }, and \) to prevent escaping the rule block.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "transparent";

  const lowerValue = value.toLowerCase();

  // Block potential CSS/XSS breakouts
  if (
    lowerValue.includes("url(") ||
    lowerValue.includes("expression(") ||
    lowerValue.includes("javascript:") ||
    lowerValue.includes("</style>")
  ) {
    return "transparent";
  }

  // Strip ;, }, and \
  return value.replace(/[;}\\]/g, "");
}
