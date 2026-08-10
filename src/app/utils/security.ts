/**
 * Utilities for security sanitization.
 */

/**
 * Sanitizes CSS identifiers (IDs, class names, CSS variable keys)
 * by keeping only standard alphanumeric characters, hyphens, and underscores.
 * Matches /[^a-zA-Z0-9-_]/g and replaces them with an empty string.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (like colors) by:
 * 1. Blocking unsafe features: url(), expression(), javascript:, and </style> tags.
 * 2. Stripping potentially dangerous CSS characters: ';', '}', and '\'.
 */
export function sanitizeCSSValue(val: string): string {
  if (!val) return "";
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
