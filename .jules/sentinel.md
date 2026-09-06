# Sentinel Security Journal

## 2026-03-30 - Dynamic CSS Injection in Chart Component
**Vulnerability:** The `ChartStyle` component in `src/app/components/ui/chart.tsx` directly interpolated dynamic `id`, config key, and `color` properties into a inline `<style>` block via `dangerouslySetInnerHTML`. An attacker providing uncontrolled chart configs or IDs could inject arbitrary CSS rules or execute styles breakout.
**Learning:** React components using `dangerouslySetInnerHTML` for CSS generation often bypass JSX auto-escaping, leaving styled dynamic variables vulnerable to CSS injection if identifiers or property values contain unescaped characters like `;`, `}`, `url()`, or `expression()`.
**Prevention:** Always sanitize dynamic inputs injected into `<style>` blocks or `dangerouslySetInnerHTML`. Use identifier sanitizers (`/ [^a-zA-Z0-9-_] /g`) for selectors/variables and strict CSS value sanitizers for values.
