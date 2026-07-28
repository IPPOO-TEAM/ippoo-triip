## 2025-05-24 - [CSS Injection in ChartStyle Component]
**Vulnerability:** The `<ChartStyle>` component injected unvalidated config keys, IDs, and color strings directly into a `<style>` block via `dangerouslySetInnerHTML`. This allowed potential style injection and CSS-based attacks.
**Learning:** React components that inject dynamic variables into style blocks bypass React's default XSS escaping, creating a direct CSS/HTML injection vector if any part of the dynamic data is user-controlled or malicious.
**Prevention:** Always sanitize dynamic identifiers and CSS values using regex-based whitelist filtering before injecting them into dynamic style tags. Block dangerous keywords like `url(`, `expression(`, `javascript:`, and closing tags like `</style>`.
