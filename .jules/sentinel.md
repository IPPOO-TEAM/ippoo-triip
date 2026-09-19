## 2026-09-02 - CSS Injection in ChartStyle dangerouslySetInnerHTML

**Vulnerability:** Unsanitized user/theme configuration in `ChartStyle` (`chart.tsx`) was injected directly into a `<style>` element using `dangerouslySetInnerHTML`, enabling CSS injection and potential XSS if arbitrary keys or values break out of CSS property context.

**Learning:** Component style generators often construct CSS string blocks dynamically without realizing `dangerouslySetInnerHTML` bypasses React's automatic string escaping.

**Prevention:** Always sanitize dynamic identifiers with a strict whitelist (`/[^a-zA-Z0-9-_]/g`) and strip dangerous tokens (`expression()`, `url()`, `javascript:`, HTML tags, delimiters) from dynamic CSS property values before inserting into `<style>` tags.
