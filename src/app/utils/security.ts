/**
 * Security utilities for sanitizing inputs.
 */

/**
 * Sanitizes an identifier (ID or key) by removing any characters that are not
 * alphanumeric, hyphens, or underscores.
 * This is useful for preventing CSS injection or other attacks where an ID is used
 * in a sensitive context like a style tag.
 */
export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a color value by removing characters that could be used to break out
 * of a CSS property value or a style tag.
 * It strips ';', '}', '\', and '</style>'.
 */
export function sanitizeColor(color: string): string {
  return color.replace(/[;}\\]/g, "").replace(/<\/style>/gi, "");
}
