## 2025-05-15 - CSS Injection in Chart Styling
**Vulnerability:** User-controlled keys and color values were being injected directly into a `<style>` tag via `dangerouslySetInnerHTML`, allowing for potential XSS or style-based attacks.
**Learning:** Even within `dangerouslySetInnerHTML` for CSS, input must be strictly sanitized to prevent breaking out of property values or the style tag itself.
**Prevention:** Use a centralized security utility to sanitize CSS identifiers and values before injecting them into the DOM.
