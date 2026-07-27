## 2026-06-26 - ChartStyle CSS Injection
**Vulnerability:** Dynamic chart styling injected via `<style dangerouslySetInnerHTML>` did not sanitize user-controlled configuration keys, IDs, or theme colors, allowing breakout and CSS Injection.
**Learning:** React elements utilizing `dangerouslySetInnerHTML` for styling require regex-based sanitization for all input variables (identifiers must match `/[^a-zA-Z0-9-_]/g` and colors must exclude keywords like `url(`, `expression(`, `javascript:`, and strip `;`, `}`, `\`).
**Prevention:** Always centralize and apply strict regular expression sanitizers for dynamic CSS keys and values before placing them in `<style>` elements.
