# Sentinel's Journal

## 2026-06-26 - CSS & HTML Injection in Dynamic Chart Styles
**Vulnerability:** The shadcn-based `ChartStyle` component in `src/app/components/ui/chart.tsx` directly interpolated dynamic configuration IDs, keys, and color values into `<style dangerouslySetInnerHTML={{ __html: ... }} />`. An unvalidated configuration or user-controllable color/id value could break out of the style tag (`</style><script>...`) or inject arbitrary CSS rules.
**Learning:** Modern component libraries often utilize inline `<style dangerouslySetInnerHTML=...>` to inject CSS custom properties scoped to a dynamic selector. Without explicit character whitelisting for identifiers and stripping of style delimiters/tags for values, this creates XSS and CSS injection risks.
**Prevention:** Centralize CSS identifier and value sanitization functions in `src/app/utils/security.ts`. Strictly restrict CSS identifiers to alphanumeric characters, dashes, and underscores, and strip `<`, `>`, `{`, `}`, `;`, `\`, comment markers, and dangerous functional expressions (`url()`, `expression()`) from dynamic CSS property values before interpolation.
