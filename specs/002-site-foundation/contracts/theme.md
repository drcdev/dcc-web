# Contract: Theme

Tests: `tests/unit/site/theme.test.ts`, `theme-init.test.ts`, `tests/component/ThemeToggle.test.ts`,
`tests/e2e/theme.spec.ts`.

## Storage

- Key `color-theme`; values `dark` | `light` | `system`. Anything else, absence, or a throwing
  `localStorage` → dark. Not written until the visitor uses the switch.

## Pre-paint script (`src/scripts/theme-init.js`, inline in `<head>` before the stylesheet)

- Adds `js` to `<html>`.
- Sets/removes `dark` on `<html>` per the stored choice (system → `prefers-color-scheme`).
- Never throws; no network access; ≤ 1 KB.
- Its SHA-256 is in the page's CSP `script-src` (see [http-responses.md](./http-responses.md)).

## Toggle (`ThemeToggle.astro`)

- Visible label text `Theme:` then `<button type="button">` showing the moon (dark), sun (light)
  or the word `System` (system), as in Flux.
- Accessible name: `Theme: Dark` | `Theme: Light` | `Theme: Match device`; a visually hidden
  `aria-live="polite"` region announces the new theme on change.
- Click cycles dark → light → system → dark, applies immediately, writes storage (failure
  ignored).
- In system mode, a device theme change is followed without reload.
- Hidden when JavaScript is off.

## First-paint guarantee (SC-003)

For each stored value (`dark`, `light`, `system` with emulated light and dark, absent, `garbage`)
the E2E test records `<html>`'s `dark` class at the moment `<body>` is first inserted (via a
`MutationObserver` in `addInitScript`) and asserts it equals the expected theme, over repeated
loads and across a second page.
