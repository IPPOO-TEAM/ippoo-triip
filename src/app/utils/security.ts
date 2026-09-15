/**
 * Sanitizes CSS identifiers (such as element IDs or CSS variable keys)
 * to ensure they only contain alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS property values (such as colors or lengths)
 * by stripping HTML tags, backslashes, comment markers, delimiters ({}, ;, <, >),
 * and recursively removing dangerous tokens (url, expression, javascript, style).
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";
  let clean = val
    .replace(/<[^>]*>/g, "")
    .replace(/\\/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[{};<>]/g, "");

  const unsafeTokens = [/url\s*\(/gi, /expression\s*\(/gi, /javascript\s*:/gi, /style\s*=/gi];
  let prev = "";
  while (clean !== prev) {
    prev = clean;
    for (const token of unsafeTokens) {
      clean = clean.replace(token, "");
    }
  }

  return clean.trim();
}
