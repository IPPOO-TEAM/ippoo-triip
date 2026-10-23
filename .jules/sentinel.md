## 2025-08-03 - Dynamic Chart CSS Injection & Sanitization
**Vulnerability:** Insecure injection of dynamic keys and color configuration values inside `<style>` blocks in the `ChartStyle` component (`chart.tsx`) via `dangerouslySetInnerHTML`.
**Learning:** Automatically constructed style templates can be exploited using special characters (`}`, `;`, `{`, `\`) or CSS functions (`url(`, `expression(`) to execute CSS injections, break out of styling context, or trigger XSS via HTML style-tag breakouts.
**Prevention:** Sanitize CSS identifiers to include only safe alphanumeric/dash characters and sanitize CSS color/style values by removing layout characters (`{}`, `;`, `\`) and blocking harmful URL schemes or tags (e.g. `javascript:`, `url(`, `</style>`).
