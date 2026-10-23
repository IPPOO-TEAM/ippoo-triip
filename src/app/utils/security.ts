/**
 * Security utilities for input sanitization and prevention of injection vulnerabilities.
 */

/**
 * Sanitizes CSS identifiers (such as class names, IDs, data attributes, and CSS variable names).
 * Allows only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== 'string') return '';
  return identifier.replace(/[^a-zA-Z0-9-_]/g, '');
}

/**
 * Sanitizes CSS property values before inserting them into inline style tags.
 * Strips HTML tags, backslashes, comment markers, delimiters ({, }, ;, <, >),
 * and dangerous function calls like url() or expression().
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\\/g, '') // Strip backslashes
    .replace(/\/\*[\s\S]*?\*\//g, '') // Strip block comments
    .replace(/[{}\n\r;<>]|(?:\/\*|\*\/)/g, '') // Strip delimiters and remaining comment markers
    .replace(/(url|expression)\s*\(/gi, ''); // Strip dangerous function calls
}
