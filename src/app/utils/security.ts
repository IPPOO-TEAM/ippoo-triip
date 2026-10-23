/**
 * Security utilities for sanitizing inputs used in potentially dangerous ways.
 */

/**
 * Sanitizes an identifier (ID, key) to be used in CSS selectors or data attributes.
 * Removes any character that is not a letter, number, hyphen, or underscore.
 */
export function sanitizeChartId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes a color value to be used in a CSS variable.
 * Strips characters that could be used for CSS injection or closing a style tag.
 */
export function sanitizeChartColor(color: string): string {
  return color.replace(/[;}\\]/g, "").replace(/<\/style>/gi, "");
}
