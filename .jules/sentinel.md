## 2026-04-11 - CSS Injection Mitigation in ChartStyle
**Vulnerability:** Unsanitized dynamic properties in `ChartStyle` (`dangerouslySetInnerHTML`) allowing CSS injection/XSS through malformed chart IDs or config colors.
**Learning:** React component libraries using dynamic `<style>` injection via `dangerouslySetInnerHTML` must sanitize identifiers and property values. Sanitizing static CSS selector prefixes (such as `.dark`) strips dot prefixes and breaks compilation.
**Prevention:** Use centralized sanitization functions (`sanitizeCSSIdentifier` and `sanitizeCSSValue`) for dynamic tokens injected into CSS blocks while preserving trusted structural CSS selectors.
