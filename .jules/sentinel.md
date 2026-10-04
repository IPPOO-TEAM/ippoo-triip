## 2025-10-04 - Dynamic CSS Injection via dangerouslySetInnerHTML in Chart Components
**Vulnerability:** Unsanitized keys, IDs, and color properties in ChartStyle (`src/app/components/ui/chart.tsx`) were being directly interpolated into `<style>` tags via `dangerouslySetInnerHTML`.
**Learning:** Third-party UI component templates (like shadcn/ui chart) often insert CSS variables dynamically without built-in string sanitization.
**Prevention:** Always pass dynamic CSS identifiers and values through robust sanitization functions (`sanitizeCSSIdentifier`, `sanitizeCSSValue`) before embedding them in `<style>` blocks.
