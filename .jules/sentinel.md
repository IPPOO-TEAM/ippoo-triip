# Sentinel's Journal

## 2026-04-10 - Dynamic CSS Injection in dangerouslySetInnerHTML Style Tags
**Vulnerability:** Unsanitized user/dynamic identifiers (`id`, config keys, CSS color values) injected directly into `<style dangerouslySetInnerHTML=... />` blocks in UI components like `ChartStyle`.
**Learning:** Attacker-controlled keys or values could break out of CSS rule blocks using `;`, `}`, or close `<style>` tags to inject malicious HTML/JS.
**Prevention:** Always sanitize dynamic identifiers with `sanitizeCSSIdentifier` (retaining `/[a-zA-Z0-9-_]/g`) and dynamic CSS values with `sanitizeCSSValue` (stripping HTML tags, comment markers, CSS rule delimiters, and dangerous function calls like `url()` and `expression()`).
