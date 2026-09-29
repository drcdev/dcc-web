# Contract: Shell DOM (every page)

Tests: `tests/component/*.test.ts` (Container API) and `tests/e2e/shell.spec.ts`, `menu.spec.ts`,
`no-js.spec.ts`, `a11y.spec.ts`.

## Document

- `<html lang="en" class="dark …">` server-rendered; the head init script may remove `dark` and
  always adds `js` when script runs.
- Exactly one `<header>` (banner), one `<nav aria-label="Main">`, one `<main id="main">`, one
  `<footer>` (contentinfo). Exactly one `<h1>` per page; no skipped heading levels.
- First focusable element: skip link `<a href="#main">Skip to main content</a>`, visually hidden
  until focused.

## Header

- Site name link: text `Don Coleman`, `href="/"`.
- Primary links in order: Home `/`, Services `/services/`, Speaking `/speaking/`, Writing
  `/writing/`, Projects `/projects/`, About `/about/`, Contact `/contact/` — one `<ul>` inside
  the nav, `id="primary-nav-list"`.
- Current page link: `aria-current="page"` and a visible style difference.
- Menu button: `<button type="button" aria-controls="primary-nav-list" aria-expanded="false">`
  with accessible name `Menu`; hidden unless `html.js` and viewport < 48rem.
- Must not contain: search button, Subscribe, Sign in, Account, portal links (`#/portal`).

## Mobile menu behaviour (viewport < 48rem, JS on)

| Action | Result |
|---|---|
| Page load | List hidden, button visible, `aria-expanded="false"` |
| Activate button | List shown, `aria-expanded="true"` |
| Activate again | Hidden, `false` |
| Escape while open | Hidden, `false`, focus on button |
| Choose a link | Hidden, `false` |
| Click outside / focus leaves nav | Hidden, `false` |
| Resize to ≥ 48rem | Desktop list visible; state reset to closed |

JS off: list visible and wrapping at every width, no button rendered visible. No horizontal
scroll at 320 px.

## Footer

- Site name link home; links `/privacy-policy/`, `/terms-of-use/`, `/technology/`;
  social links `https://github.com/drcdev` (name "GitHub") and
  `https://www.linkedin.com/in/drcdev` (name "LinkedIn") with decorative SVG icons.
- Copyright text: `© {build year} Don Coleman. All rights reserved.`
- Theme switch (see [theme.md](./theme.md)).

## Focus

- Every link and button shows a visible focus ring (`outline` 2px, offset 2px, accent) and stays
  visible in forced-colours mode. Tab order follows visual order: skip link → header → main →
  footer.
