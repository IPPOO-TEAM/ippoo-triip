## 2026-06-26 - Dynamic CSS Injection in ChartStyle Component
**Vulnerability:** Unsanitized keys, IDs, and color strings injected directly into dynamic `<style>` tags via `dangerouslySetInnerHTML` in `ChartStyle` (`src/app/components/ui/chart.tsx`).
**Learning:** React components using `dangerouslySetInnerHTML` to inject dynamic inline CSS styles can be abused for CSS injection and XSS if user-controlled or dynamic keys/colors contain special delimiters (`}`, `;`, `<style>`) or CSS functions.
**Prevention:** Always sanitize dynamic identifiers with alphanumeric/hyphen/underscore filters (`sanitizeCSSIdentifier`) and strip CSS/HTML delimiters and dangerous functions (`sanitizeCSSValue`) before embedding raw CSS strings in style elements.
