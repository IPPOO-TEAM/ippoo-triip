# Sentinel's Journal - Critical Learnings

## 2026-03-31 - CSS Injection via Dynamic Style Blocks
**Vulnerability:** Dynamic injection of unvalidated identifiers and color values into `<style dangerouslySetInnerHTML={{ __html: ... }} />` in `ChartStyle` allowed CSS breakouts and style injection.
**Learning:** Components generating runtime CSS rules from user-supplied or variable configuration objects can be exploited to break out of selectors using `{`, `}`, `;`, and unclosed comments `/*`.
**Prevention:** Sanitize CSS identifiers to restricted character sets (`/[^a-zA-Z0-9-_]/g`) and sanitize property values by stripping HTML tags, comment markers, block/statement delimiters, and dangerous function calls (`url(`, `expression(`).
