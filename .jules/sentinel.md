## 2026-08-06 - CSS Injection Vulnerability in ChartStyle

**Vulnerability:** The shadcn chart style injector component (`ChartStyle` in `src/app/components/ui/chart.tsx`) was found to be injecting dynamically generated theme styling keys and values directly into a `<style>` tag using `dangerouslySetInnerHTML` without prior sanitization. This allowed potential CSS injection or breakout (XSS) via injected keys or style values.

**Learning:** When using components like Recharts with theme customizations, standard templates often leverage raw dynamic styling injections using `dangerouslySetInnerHTML` for the convenience of custom property assignment, overlooking the threat of malicious stylesheet breakouts.

**Prevention:** Always restrict dynamically generated selectors/keys using strict alphanumeric-focused regex checks (`/[^a-zA-Z0-9-_]/g`), and strictly sanitize values by stripping `;`, `}`, and `\`, while explicitly blocking dangerous payloads like `url()`, `expression()`, `javascript:`, or closing style tags (`</style>`).
