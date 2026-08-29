## 2026-06-27 - ChartStyle CSS Injection Sanitization
**Vulnerability:** Unsanitized dynamic IDs, keys, and values were injected directly into a `<style>` tag via `dangerouslySetInnerHTML` in `ChartStyle` (`src/app/components/ui/chart.tsx`), exposing potential CSS injection and XSS vectors.
**Learning:** `dangerouslySetInnerHTML` in CSS rendering components can allow attackers or untrusted config data to break out of CSS rule blocks using HTML/CSS delimiters (e.g., `}</style>`) or inject malicious CSS tokens (e.g., `url()`, `javascript:`).
**Prevention:** Use centralized CSS sanitization (`sanitizeCSSIdentifier` and `sanitizeCSSValue`) for all dynamic values rendered inside raw `<style>` tags, while preserving trusted static internal prefixes/selectors.
