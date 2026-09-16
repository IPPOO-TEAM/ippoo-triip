## 2025-05-18 - Dynamic CSS Injection in ChartStyle Component
**Vulnerability:** Unsanitized dynamic values (`id`, `key`, `color`) were directly interpolated into a raw CSS string inside a `<style>` element using `dangerouslySetInnerHTML` in `ChartStyle`.
**Learning:** React elements utilizing `dangerouslySetInnerHTML` to render dynamic CSS blocks bypass standard JSX escaping, enabling CSS injection or XSS if malicious input contains structural CSS delimiters or closing tags.
**Prevention:** Always sanitize dynamic identifiers with alphanumeric/hyphen/underscore filters and CSS property values by stripping HTML tags, comments, structural delimiters (`{`, `}`, `;`), and unsafe CSS function tokens before rendering inside CSS blocks.
