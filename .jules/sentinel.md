## 2025-03-30 - Dynamic CSS Injection Sanitization in Chart Components
**Vulnerability:** Dynamic injection of unescaped CSS identifiers and variable values in `<ChartStyle>` via `dangerouslySetInnerHTML` permitted potential CSS injection / XSS payload injection if chart config values originate from user/external inputs.
**Learning:** React component libraries using dynamic `<style>` tag generation with `dangerouslySetInnerHTML` must sanitize both property identifiers and values, especially stripping CSS expression functions, protocols, HTML tags, and structural block delimiters like `{`, `}`, `;`.
**Prevention:** Use centralized `sanitizeCSSIdentifier` and `sanitizeCSSValue` utilities whenever injecting string variables into inline CSS blocks or HTML templates.
