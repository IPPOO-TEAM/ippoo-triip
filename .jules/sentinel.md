## 2025-05-14 - [CSS Injection via ChartStyle]
**Vulnerability:** The `ChartStyle` component in `src/app/components/ui/chart.tsx` was injecting raw user-provided colors and keys into a `<style>` tag using `dangerouslySetInnerHTML`.
**Learning:** Even internal UI components like charts can be vectors for CSS injection or XSS if they dynamically generate styles from configuration objects that might contain unsanitized input.
**Prevention:** Always sanitize dynamic identifiers and color values before injecting them into CSS. Use a whitelist for identifiers (alphanumeric, hyphens, underscores) and block dangerous CSS keywords/characters (`url()`, `javascript:`, `;`, `}`, etc.) in color values.
