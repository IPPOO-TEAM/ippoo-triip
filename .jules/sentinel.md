# Sentinel's Journal - Critical Security Learnings

## 2026-06-26 - Chart Style CSS Injection
**Vulnerability:** In `<ChartStyle>`, configuration keys and values like colors and chart IDs were injected directly into a style tag with `dangerouslySetInnerHTML` without validation or sanitization. This allowed attackers to perform CSS injection (e.g., escaping block selectors, injecting malicious content, triggering unvetted external resources, or breaking page layout).
**Learning:** React's `dangerouslySetInnerHTML` combined with `<style>` tags completely bypasses standard React JSX element escaping. Any dynamic values placed inside raw string CSS declarations can contain closing style tags `</style>`, background url assets `url()`, or control characters that compromise DOM safety.
**Prevention:** Always sanitize injected identifiers (such as class names and dataset values) using strict alphanumeric/safe-character regexes. Always sanitize injected dynamic values (such as color values) by stripping delimiters like `;`, `}`, and `\`, and explicitly blocking malicious structures like `url(`, `expression(`, `javascript:`, or `</style>` tags.
