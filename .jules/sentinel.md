## 2026-07-04 - Chart CSS Injection via DangerouslySetInnerHTML
**Vulnerability:** Dynamic properties (`id`, `key`, `color`) interpolated into raw CSS strings inside `<style>` tags via `dangerouslySetInnerHTML` in `ChartStyle` (`src/app/components/ui/chart.tsx`) allowed potential CSS injection and HTML tag breakout.
**Learning:** Security utilities for CSS sanitization (`sanitizeCSSIdentifier` and `sanitizeCSSValue`) must strip dangerous tokens (e.g. `;`, `}`, `url(`, `expression(`, `javascript:`, `</style>`) without altering valid static selectors (like `.dark` or standard CSS variables).
**Prevention:** Always pass user-supplied or dynamic keys/colors through centralized CSS sanitization functions before embedding them into inline `<style>` tags or style attributes.
