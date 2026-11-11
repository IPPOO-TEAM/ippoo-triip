/**
 * Security utilities for input sanitization and defense in depth.
 */

/**
 * Sanitizes CSS identifiers (such as class names, IDs, CSS variable keys).
 * Restricts output to alphanumeric characters, dashes, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string, fallback = "item"): string {
  if (typeof identifier !== "string") {
    return fallback;
  }
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Sanitizes CSS values interpolated directly into style blocks.
 * Prevents HTML tag breakout (`</style>`, `<script>`), CSS block breakout (`{`, `}`, `;`),
 * backslash escaping, comments, and dangerous url/expression invocations.
 * Preserves forward slash `/` to support modern CSS alpha channel syntax (e.g. `hsl(var(--primary) / 0.8)`).
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") {
    return "";
  }
  return val
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip CSS comments
    .replace(/[<>{};\\]/g, "")
    .replace(/(url|expression)\s*\(/gi, "")
    .trim();
}
