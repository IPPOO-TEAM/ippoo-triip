# Sentinel's Journal - Critical Security Learnings

## 2026-03-03 - CSS Injection Vulnerability in ChartStyle Dynamic Styles
**Vulnerability:** The `<ChartStyle>` component in `src/app/components/ui/chart.tsx` was vulnerable to CSS injection via `<style dangerouslySetInnerHTML={...} />`. Untrusted chart identifiers or theme color configurations could break out of the style block, allowing full CSS injection and potential Cross-Site Scripting (XSS) via payload strings.
**Learning:** React elements using `dangerouslySetInnerHTML` to inject styles dynamically do not automatically escape special characters such as brackets, semicolons, backslashes, or tags. Any user-controlled or dynamically generated key, id, or color value in these configs must be explicitly sanitized.
**Prevention:** Centralized sanitization utilities must be applied. Identifiers should match `/[^a-zA-Z0-9-_]/g` to strip dangerous punctuation, while CSS/color values must block strings like `url(`, `expression(`, `javascript:`, or `</style>` and strip `;`, `}`, and `\`.
