/**
 * Centralized security utility functions for input and CSS sanitization.
 */

/**
 * Sanitizes CSS identifiers (such as element IDs, class names, or CSS variable suffixes)
 * by removing any characters that are not alphanumeric, hyphens, or underscores.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors) to prevent injection breakout attempts.
 * It blocks dangerous constructs (e.g. url(), expression(), javascript:, </style>) by returning
 * an empty string, and strips characters that can be used to terminate a CSS rule declaration (;, }, \).
 */
export function sanitizeCSSValue(value: string): string {
  const lower = value.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }
  // Strip ';', '}', and '\'
  return value.replace(/[;}\\]/g, "");
}
