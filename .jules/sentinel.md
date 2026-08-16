## 2025-05-18 - CSS Injection in Dynamic Chart Style Component
**Vulnerability:** Unsanitized string interpolation in ChartStyle component inside dangerouslySetInnerHTML style tag allowed CSS injection and potential style breakout/XSS.
**Learning:** React components injecting dynamic theme keys or dynamic colors into inline style blocks using dangerouslySetInnerHTML bypass standard JSX auto-escaping.
**Prevention:** Always sanitize dynamic identifiers with a strict alphanumeric/hyphen/underscore allowlist and sanitize CSS property values by stripping rule-ending characters ({, }, ;, \) and blocking dangerous constructs (url(), expression(), javascript:, </style>).
