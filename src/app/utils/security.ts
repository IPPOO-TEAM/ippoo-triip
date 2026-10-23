/**
 * Security utilities for sanitizing dynamic content before rendering in CSS / DOM contexts.
 */

/**
 * Sanitizes CSS identifiers (keys, IDs, class names) by stripping any character
 * outside alphanumerics, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== 'string') return '';
  return identifier.replace(/[^a-zA-Z0-9-_]/g, '');
}

/**
 * Sanitizes CSS property values (e.g., colors, lengths) to prevent CSS injection,
 * break-out attempts, HTML tag injection, or unsafe url/expression calls.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\\/g, '') // Strip backslashes
    .replace(/\/\*|\*\//g, '') // Strip CSS comments
    .replace(/[{}<>;]/g, '') // Strip CSS/HTML delimiters
    .replace(/(url|expression)\s*\(/gi, ''); // Strip dangerous CSS function calls
}
