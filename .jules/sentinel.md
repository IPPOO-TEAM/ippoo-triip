## 2026-04-10 - CSS Injection Vulnerability in ChartStyle Component
**Vulnerability:** `ChartStyle` rendered dynamic `id`, key, and `color` properties directly into a `<style>` element using `dangerouslySetInnerHTML` without input sanitization, allowing potential CSS breakout or injection attacks.
**Learning:** Components using `dangerouslySetInnerHTML` for dynamically generated inline styles require strict white-listing/sanitization for both identifiers (restricting to `[a-zA-Z0-9-_]`) and values (stripping tags, block delimiters, and dangerous CSS functions like `url()` or `expression()`).
**Prevention:** Always sanitize dynamic inputs injected into `<style>` tags using centralized sanitization helper functions (`sanitizeCSSIdentifier` and `sanitizeCSSValue`).
