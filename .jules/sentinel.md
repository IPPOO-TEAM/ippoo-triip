## 2025-05-18 - Dynamic CSS Injection in Chart Component
**Vulnerability:** Unsanitized chart config keys, IDs, and color values injected into dynamic `<style>` tags via `dangerouslySetInnerHTML` in `ChartStyle` allowed potential CSS injection / XSS payloads.
**Learning:** React components injecting runtime user/config data into inline `<style>` blocks bypass standard JSX auto-escaping, making CSS delimiters (`{`, `}`, `;`) and HTML tags (`</style>`) dangerous injection vectors.
**Prevention:** Always sanitize dynamic identifiers with `[^a-zA-Z0-9-_]` white-listing and strip HTML tags, comment tokens, delimiters, and unsafe functions (`url()`, `expression()`, etc.) from dynamic CSS property values before template insertion.
