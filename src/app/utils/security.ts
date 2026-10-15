/**
 * Security utilities for input sanitization and defense-in-depth against injection vulnerabilities.
 */

/**
 * Sanitizes CSS identifier strings (e.g., HTML element IDs, CSS class suffixes, CSS variable name keys)
 * by keeping only alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (e.g., color names, hex codes, numeric values with units)
 * to prevent CSS injection / breakout attacks when injected into inline `<style>` blocks.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\\/g, "") // Remove backslashes
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comment markers
    .replace(/[{};<>]/g, "") // Remove CSS delimiters and HTML brackets
    .replace(/(url|expression)\s*\(/gi, ""); // Remove dangerous function calls
}
