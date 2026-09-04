## 2025-02-18 - CSS Injection Sanitization in ChartStyle
**Vulnerability:** Unsanitized dynamic IDs and theme/color properties injected into `<style dangerouslySetInnerHTML={...}>` block in `src/app/components/ui/chart.tsx`.
**Learning:** React components injecting custom CSS variables or selectors via raw string interpolation in `<style>` blocks can allow attackers or malformed configuration to escape CSS property blocks, inject malicious CSS rules, or break layout/rendering.
**Prevention:** Sanitize dynamic IDs/keys to strict alphanumeric/hyphen characters (`/[^a-zA-Z0-9-_]/g`), and strip structural CSS delimiters (`{`, `}`, `;`), HTML tags, and dangerous functions (`url`, `expression`, `javascript`) from CSS values before dangerously setting inner HTML.
