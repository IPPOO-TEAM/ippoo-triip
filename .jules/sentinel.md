## 2025-05-15 - [CSS Injection in ChartStyle]
**Vulnerability:** The `ChartStyle` component in `src/app/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject CSS variables based on configuration keys and color values without sanitization.
**Learning:** Dynamic CSS generation in React components using `dangerouslySetInnerHTML` can be a vector for CSS injection if the keys or values are user-controlled or not strictly validated.
**Prevention:** Sanitize identifiers and values used in dynamic CSS. Use a whitelist of allowed characters for identifiers and strictly validate CSS values (e.g., colors).
