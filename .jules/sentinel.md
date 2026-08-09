## 2026-06-26 - [Dynamic Style Block Injection via ChartStyle Component]
**Vulnerability:** Dynamic style blocks using `dangerouslySetInnerHTML` allow CSS injection. An attacker could inject malicious selectors, terminate rules early with `;` or `}`, or load third-party resources via `url()`, potentially causing cross-site scripting (XSS) via `</style><script>`.
**Learning:** In shadcn-style Chart components, colors and key identifiers are generated dynamically. Lacking proper sanitization of keys/values leads directly to CSS/XSS injection.
**Prevention:** Always sanitize dynamic identifiers to safe alphanumeric patterns (`/[^a-zA-Z0-9-_]/g`) and color values to prevent termination characters (`/[;}\\]/g`) or dangerous CSS functions.
