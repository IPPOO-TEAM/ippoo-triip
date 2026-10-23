## 2026-06-26 - Dynamic CSS Injection in ChartStyle Component
**Vulnerability:** Unsafety in dynamic `<style>` rendering via `dangerouslySetInnerHTML` in `ChartStyle` (`src/app/components/ui/chart.tsx`), where unescaped chart IDs, keys, or color values could allow CSS injection or XSS breakout.
**Learning:** React components using dynamic CSS generation with `dangerouslySetInnerHTML` need centralized sanitization for identifiers (alphanumeric/hyphen/underscore) and values (stripping tags, block delimiters, comments, and dangerous function calls).
**Prevention:** Always filter dynamic keys and values rendered into inline style tags through `sanitizeCSSIdentifier` and `sanitizeCSSValue` utilities before string interpolation.
