## 2025-05-18 - CSS Injection in ChartStyle Component
**Vulnerability:** Inline CSS injected via `dangerouslySetInnerHTML` in `ChartStyle` (`src/app/components/ui/chart.tsx`) allowed unsanitized IDs, config keys, and color strings to inject arbitrary CSS rule blocks or break out of selectors.
**Learning:** `ChartStyle` constructed CSS rule blocks using raw strings from chart config (`id`, `key`, and `color`). Unfiltered delimiters (`;`, `{`, `}`) or function calls could compromise rendering or inject styles.
**Prevention:** Sanitize dynamic CSS identifiers with strict character white-listing (`a-zA-Z0-9-_`) and strip CSS delimiters and dangerous function calls from dynamic CSS values using centralized security utilities in `src/app/utils/security.ts`.
