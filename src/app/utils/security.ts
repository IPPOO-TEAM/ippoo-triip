/**
 * Security utilities to prevent XSS and other injection attacks.
 */

export function sanitizeCSSIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

export function sanitizeCSSValue(value: string): string {
  if (!value) return "";
  const blocked = [/url\(/i, /expression\(/i, /javascript:/i, /<\/style>/i];
  if (blocked.some((p) => p.test(value))) return "transparent";
  return value.replace(/[;}\\]/g, "");
}
