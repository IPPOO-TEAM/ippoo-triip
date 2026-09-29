## 2026-06-26 - Sanitizing Dynamic CSS in React Chart Components
**Vulnerability:** XSS/CSS Injection via raw string interpolation in `<style dangerouslySetInnerHTML>` inside `ChartStyle` (`src/app/components/ui/chart.tsx`).
**Learning:** Dynamic CSS styling using object keys and color values can allow malicious payloads to break out of CSS declarations or execute arbitrary scripts if inputs contain closing tags or braces.
**Prevention:** Sanitize CSS identifiers (restricting to `/a-zA-Z0-9-_/`) and CSS property values (stripping tags, block delimiters, and dangerous functions like `url(` or `expression(`) using centralized utilities in `src/app/utils/security.ts`.
