## 2025-05-18 - Dynamic CSS Style Injection in ChartStyle Component
**Vulnerability:** Unsanitized dynamic IDs, keys, and color string values were directly interpolated into an inline `<style>` tag using `dangerouslySetInnerHTML` in the `ChartStyle` component.
**Learning:** Component style generation using `dangerouslySetInnerHTML` allows arbitrary CSS or HTML execution if chart identifiers or custom theme color attributes contain unescaped characters like `}</style><script>...`.
**Prevention:** Always sanitize dynamic CSS selectors and key identifiers with strict regex filtering (`/[^a-zA-Z0-9-_]/g`), and strip HTML tags, block delimiters, comment markers, and URL/expression function calls from dynamic CSS values before embedding in style elements.
