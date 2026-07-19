/**
 * Centralized CSS sanitization utilities for IPPOO TRIIP.
 * Protects dynamic style injections against XSS and malicious CSS injection.
 */

/**
 * Sanitizes CSS identifiers (selectors, custom property keys, IDs).
 * Replaces any character that is not alphanumeric, hyphen, or underscore with empty string.
 */
export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (like color values).
 * Blocks potentially malicious content (e.g. url(), expression(), javascript:, </style>) by returning an empty string.
 * Strips semicolon (;) and closing curly brace (}) and backslash (\) to prevent breaking out of style block rules.
 */
export function sanitizeCSSValue(val: string): string {
  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return "";
  }
  // Strip ';', '}', and '\'
  return val.replace(/[;}\\]/g, "");
}
