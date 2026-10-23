/**
 * Utility functions for centralizing CSS sanitization and preventing injection vulnerabilities.
 */

/**
 * Sanitize CSS Identifier (IDs or keys used in dynamic selectors/attributes)
 * Strips any characters that do not match the safe pattern [a-zA-Z0-9-_].
 */
export function sanitizeCSSIdentifier(val: string): string {
  if (typeof val !== "string") return "";
  return val.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitize CSS Value (values like colors or measurements injected dynamically)
 * Blocks common CSS injection payloads: url(), expression(), javascript:, and </style> tags.
 * Strips potentially dangerous characters: ;, }, and \.
 */
export function sanitizeCSSValue(val: string): string {
  if (typeof val !== "string") return "";

  const lower = val.toLowerCase();
  if (
    lower.includes("url(") ||
    lower.includes("expression(") ||
    lower.includes("javascript:") ||
    lower.includes("</style>")
  ) {
    return ""; // Block by returning an empty string
  }

  return val.replace(/[;}\\]/g, "");
}
