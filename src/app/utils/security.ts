/**
 * Sanitizes CSS identifiers (such as custom IDs, chart keys) by stripping out
 * any character that is not alphanumeric, a hyphen, or an underscore.
 */
export function sanitizeCSSIdentifier(identifier: string): string {
  if (typeof identifier !== "string") return "";
  return identifier.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes CSS values (such as custom color values) to prevent style injection
 * or script execution. It strips characters like ';', '}', and '\' and blocks
 * values containing 'url(', 'expression(', 'javascript:', and '</style>'.
 */
export function sanitizeCSSValue(value: string): string {
  if (typeof value !== "string") return "";

  const lowerValue = value.toLowerCase();
  if (
    lowerValue.includes("url(") ||
    lowerValue.includes("expression(") ||
    lowerValue.includes("javascript:") ||
    lowerValue.includes("</style>")
  ) {
    return "";
  }

  // Strip ';', '}', and '\'
  return value.replace(/[;}\\]/g, "");
}
