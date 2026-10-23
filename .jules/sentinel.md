# Sentinel Security Journal

## 2025-05-18 - CSS Injection Prevention in Dynamic Style Components
**Vulnerability:** Dynamic CSS generation via `dangerouslySetInnerHTML` in `ChartStyle` allowed un-sanitized keys, IDs, and color strings to inject arbitrary CSS or HTML/script tags.
**Learning:** Components using `dangerouslySetInnerHTML` for inline `<style>` tags are vulnerable to CSS injection and selector breaking if input props or theme config values aren't strictly sanitized.
**Prevention:** Centralize CSS identifier and value sanitization in `src/app/utils/security.ts` to strip illegal selector characters and dangerous patterns (`url()`, `expression()`, `javascript:`, HTML tags, braces/semicolons) before injecting dynamic CSS.
