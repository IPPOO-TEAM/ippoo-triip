## 2026-09-02 - CSS Injection in ChartStyle Component
**Vulnerability:** Raw dynamic chart keys, IDs, and color theme strings were inserted directly into a `<style>` block using `dangerouslySetInnerHTML` without input sanitization.
**Learning:** React components generating dynamic `<style>` elements can be exploited via CSS injection if user or dynamic configuration properties contain characters like `}`, `;`, or `url()`.
**Prevention:** Always sanitize dynamic identifiers with `sanitizeCSSIdentifier` and values with `sanitizeCSSValue` before rendering in inline `<style>` tags.
