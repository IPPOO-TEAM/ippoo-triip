# Sentinel Security Journal

## 2026-08-20 - Dynamic Style Tag CSS Injection via Chart Config
**Vulnerability:** Unsanitized chart config keys, IDs, and color strings were interpolated directly into raw `<style>` element strings via `dangerouslySetInnerHTML` in `ChartStyle`. An attacker controlling chart config metadata or dynamic values could inject CSS rules or break out of style tags.
**Learning:** React component libraries using `dangerouslySetInnerHTML` for dynamically constructed CSS rules bypass standard React XSS protections if inputs are not validated or sanitized prior to interpolation. Also, sanitization functions must strictly avoid altering static/trusted CSS selectors like `.dark` theme prefixes.
**Prevention:** Use dedicated sanitization utilities (`sanitizeCSSIdentifier` and `sanitizeCSSValue`) whenever embedding dynamic user-controlled strings inside raw CSS or HTML blocks.
