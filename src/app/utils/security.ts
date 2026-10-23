/**
 * Centralized security utility functions for input sanitization and safe rendering.
 */

/**
 * Sanitizes CSS identifiers (such as class names, element IDs, or variable keys)
 * to prevent CSS injection vulnerabilities.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes dynamic CSS values (such as color strings) used in inline or dynamic styles
 * to prevent CSS injection, break-out, and XSS.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  const lower = value.toLowerCase();
  // Reject dangerous CSS directives, URLs, or script execution payloads
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style")
  ) {
    return "";
  }

  // Strip CSS delimiter and control characters that could break out of properties/rules
  return value.replace(/[;{}\\]/g, "").trim();
}
