## 2025-07-09 - [CSS/XSS Injection in Charts]
**Vulnerability:** Dynamic CSS variables injected into a `<style>` tag via `dangerouslySetInnerHTML` were unsanitized.
**Learning:** React's `dangerouslySetInnerHTML` in a `<style>` block bypasses standard XSS protections, allowing CSS breakout and potential XSS via malicious input in `ChartConfig`.
**Prevention:** Always sanitize dynamic keys and values used in CSS injection. Use strict regex for identifiers (`/[^a-zA-Z0-9-_]/g`) and block dangerous CSS patterns like `url(`, `expression(`, and `javascript:`.
