## 2025-05-15 - [XSS and CSS Injection in Dynamic Charts]
**Vulnerability:** The `ChartStyle` component in `src/app/components/ui/chart.tsx` used `dangerouslySetInnerHTML` to inject dynamic CSS into a `<style>` tag without proper sanitization.
**Learning:** Dynamic CSS generation using user-provided or data-driven identifiers and values (like chart keys and colors) can lead to XSS if an attacker can inject closing tags (e.g., `</style><script>...`) or dangerous CSS properties (e.g., `expression()`, `url(javascript:...)`).
**Prevention:** Always sanitize dynamic CSS identifiers to allow only alphanumeric characters, hyphens, and underscores. For CSS values, block dangerous patterns like `javascript:`, `url(`, and `expression(`, and strip rule-breaking characters like `;`, `}`, and `\`.
