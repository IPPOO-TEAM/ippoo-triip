/**
 * Sanitizes CSS identifiers (such as element IDs or CSS variable key names).
 * Allows only alphanumeric characters, dashes, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as colors, lengths, or custom properties).
 * Prevents CSS injection / XSS by stripping HTML/CSS delimiters and unsafe tokens.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  // Strip obvious HTML/CSS code block delimiters
  let sanitized = value.replace(/[{}<>;"]/g, "");

  // Iteratively strip dangerous tokens until fixed point to prevent nested bypasses (e.g. "javaJSjavascript:script:")
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(/(?:url\s*\(|expression\s*\(|javascript\s*:|style\s*=)/gi, "");
  } while (sanitized !== prev);

  return sanitized.trim();
}
