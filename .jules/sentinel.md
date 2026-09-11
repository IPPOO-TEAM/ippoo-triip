## 2026-03-24 - Dynamic CSS Injection in ChartStyle Component
**Vulnerability:** Unsanitized dynamic IDs and color variables injected into dangerouslySetInnerHTML `<style>` tags in `ChartStyle` (`chart.tsx`).
**Learning:** React component styling using raw style strings with `dangerouslySetInnerHTML` bypasses JSX auto-escaping, allowing CSS injection and XSS if keys or color values are untrusted or contain nested bypass tokens.
**Prevention:** Always sanitize dynamic identifiers with alphanumeric/hyphen allowlists and iteratively strip delimiters, HTML blocks (`<style>`, `<script>`), and unsafe keywords (`url(`, `expression(`, `javascript:`) before inserting into CSS templates.
