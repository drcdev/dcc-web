# Implementation Plan: Footer at the Bottom

**Branch**: `027-footer-at-bottom` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-footer-at-bottom/spec.md`

## Summary

On a page shorter than the window, the footer should sit at the bottom of the window with no
scroll; on a longer page it follows the content as today. The fix is three Tailwind utility
classes in the one site shell, `src/layouts/BaseLayout.astro`: `<body>` becomes a flex column at
least as tall as the dynamic viewport (`flex min-h-dvh flex-col`), and the `.page-container`
wrapper around `<main>` takes the spare space (`grow`). No CSS file, component, script or
dependency changes. One geometry assertion added to the existing per-template E2E loop proves
it, and the not-found visual baselines are refreshed.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, as pinned in `package.json`)

**Primary Dependencies**: Tailwind CSS 4.3.3 through `@tailwindcss/vite` (already installed;
`src/styles/global.css` starts with `@import "tailwindcss"` and is imported by `BaseLayout.astro`)

**Storage**: N/A

**Testing**: Playwright E2E (`tests/e2e/geometry.spec.ts`), Playwright visual project
(`tests/e2e/visual.spec.ts`), existing axe checks (`tests/e2e/a11y.spec.ts`)

**Target Platform**: Static pages served by Cloudflare Workers static assets; evergreen browsers

**Project Type**: Static web site (Astro)

**Performance Goals**: No change; no added bytes beyond three utility classes in the CSS bundle

**Constraints**: Works with JavaScript off (Principle V); WCAG 2.2 AA (Principle X); the footer
stays a direct child of `<body>` (the footer helper in `tests/e2e/shell.spec.ts` uses
`body > footer`)

**Scale/Scope**: One file changed in `src/`, one E2E spec extended, four not-found visual
baselines per platform refreshed

## Current structure (read before deciding)

`BaseLayout.astro` renders, as direct children of `<body class="bg-white dark:bg-dusk-BASE antialiased">`:

1. `<SkipLink />`: an `<a>` that is `sr-only`, and `focus:fixed` when focused, so it is never in
   the normal flow;
2. `<SiteHeader />`: a `<nav>` with no outer margins;
3. `<div class="page-container">` wrapping `<main class="container mx-auto p-4 mt-4">`;
   `global.css` makes this wrapper an inline-size container only when the page holds a wide or
   full image (`.page-container:has(.kg-width-wide, .kg-width-full)`), for `100cqw`;
4. `<SiteFooter />`: `<footer class="dark:bg-dusk-900">`, no outer margins.

Every page layout (`PageLayout`, `PostLayout`, `ProjectLayout`, the not-found page) renders
through `BaseLayout`, so one change there covers every page (spec Assumptions).

## Decision

Add utilities in `BaseLayout.astro` only:

```text
<body class="... flex min-h-dvh flex-col">
  ...
  <div class="page-container grow">
```

- `flex flex-col` on `<body>` stacks its in-flow children (header, wrapper, footer) in source
  order, so reading and keyboard order are unchanged (FR-005). Children stretch to the full
  width by default (`align-items: stretch`), as block boxes do today.
- `min-h-dvh` (`min-height: 100dvh`) makes the body at least the dynamic viewport height. On a
  phone, `dvh` follows the address bar, so a short page never gains a scroll from the placement;
  the footer may shift slightly as the bar moves, which the spec accepts (Edge Cases). A browser
  without `dvh` support drops the declaration and keeps today's layout, which is a safe fallback.
- `grow` (`flex-grow: 1`, basis `auto`) on `.page-container` gives it all spare height, so the
  spare space falls between the main content and the footer (FR-001). With basis `auto`, a long
  page's wrapper is exactly its content height, so a long page is unchanged (FR-003).
- The footer stays a direct child of `<body>`; `SiteFooter.astro` is not touched.

**Why spacing is pixel-identical on long pages**: today `<main>`'s `mt-4` collapses through the
wrapper (no padding or border) and sits between header and wrapper. As a flex item the wrapper
is its own formatting context, so the 16 px margin now sits inside the wrapper instead. The
header has no bottom margin and the wrapper no top margin, so the content lands at the same
place. There is no bottom margin on `<main>` or top margin on the footer, so nothing else
changes. The visual baselines (SC-004) confirm this.

**Wide-image pages**: `.page-container` keeps its class, so the `:has()` rule still makes it an
inline-size container. As a stretched flex item in a column it has a definite width equal to
the body's width, the same as a block box today, so `100cqw` is unchanged (spec Edge Cases).

**Mobile menu**: the open menu is laid out inside the header `<nav>` (`js:max-md:data-open:flex`
etc.), in flow, so it pushes the wrapper down as today; the wrapper simply grows less. Nothing
is positioned over it.

**Zoom and text resize**: at 400% zoom or 200% text the content outgrows the viewport, `grow`
has no spare space to hand out, and the footer follows the content; nothing is clipped because
no height is fixed (only a minimum).

### Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| `margin-top: auto` (`mt-auto`) on the footer instead of `grow` on the wrapper | Works, but puts a layout concern inside `SiteFooter.astro`, which is used only by the shell; keeping all of the change in `BaseLayout` is one file and keeps the footer component's markup and classes (FR-004) untouched. |
| CSS grid on `<body>` (`grid-template-rows: auto 1fr auto`) | `<body>` has four children (the skip link counts as a grid item even when visually hidden, and becomes a positioned box only on focus), so the row template would have to account for it; flex with `grow` on the one element needs no row bookkeeping. |
| `min-h-screen` (`100vh`) | On phones `100vh` is the large viewport (address bar hidden), so a short page would scroll by the bar's height while it shows, which breaks FR-002 on real phones. |
| `min-h-svh` (`100svh`) | Never scrolls, but leaves a gap below the footer once the address bar hides; `dvh` matches the request (bottom of the visible window) and the spec accepts the small shift. |
| Sticky or `position: fixed` footer | Takes the footer out of flow on long pages, covering content or needing padding to compensate; changes behaviour on long pages (FR-003) and risks overlap at zoom (FR-005). |
| JavaScript measuring heights | Fails with JavaScript off (Principle V, FR-004) and adds client script for what CSS does. |
| Custom CSS rule in `global.css` | Tailwind already provides each utility (`flex`, `flex-col`, `min-h-dvh`, `grow`); the site styles the shell with utilities in markup, so a separate rule adds indirection for nothing. |

Astro sources (Principle IV, via the Astro Docs MCP):

- Shared shell in a layout component: <https://docs.astro.build/en/basics/layouts/> (layouts are
  Astro components that hold the page shell; one change there applies to every page using it).
- Tailwind 4 through the Vite plugin, imported once from `src/styles/global.css` in the layout:
  <https://docs.astro.build/en/guides/styling/#tailwind> (the setup this repository already
  uses; utility classes in the layout's markup are the documented way to style it).

No Astro API, configuration or integration changes.

## Tests (written first, seen to fail)

Layer choice follows "Where a test goes" (`docs/testing.md`): footer placement depends on real
layout at a real viewport size, which only a browser can show, so the primary layer is E2E.

1. **E2E, `tests/e2e/geometry.spec.ts`** (extend the existing per-template loop, which already
   loads every template at 320 x 640, 390 x 844 and 1280 x 800 with JavaScript on; no extra page
   loads). Add, for each template and size:
   - the footer (`body > footer`) bottom edge, in document coordinates, equals
     `document.documentElement.scrollHeight` within 1 px (nothing below the footer);
   - `scrollHeight` equals `max(window.innerHeight, header height + wrapper content height +
     footer height)` within 1 px, where the wrapper content height is `<main>`'s margin box. On a
     short page this means no vertical scroll and the footer at the window's bottom (FR-001,
     FR-002, SC-001); on a long page it means no added height and the footer straight after the
     content (FR-003, SC-002).
   Today the first assertion fails on the not-found page at every size (the document is
   viewport-tall but the footer ends mid-window), which is the red state.
2. **E2E, JavaScript off**: `tests/e2e/no-js.spec.ts` keeps the sideways-scroll check without
   JavaScript; the placement is pure CSS with no `js:` variant, so a second-layer footer test
   with JS off is not added (no written reason to duplicate it).
3. **Visual, `tests/e2e/visual.spec.ts`**: no new shots. The not-found full-page shots (phone and
   desktop, dark and light) change and are refreshed for macOS and Linux following
   `.claude/skills/_shared/visual-baselines.md`. Every other shot (shell elements, sections
   fixture, template subjects) must stay identical; any other diff is a regression (SC-004).
4. **Accessibility**: the existing axe checks on every template (`tests/e2e/a11y.spec.ts`) run
   unchanged and must report no new violations (SC-003).

No unit or component test: a component test could only restate the class list, which the
geometry check already proves by effect.

## Constitution Check

*GATE: checked before design and again after it. Result: PASS, no exceptions.*

| Principle | Check |
|-----------|-------|
| I. Test-First | Geometry assertions are written and seen failing on the not-found page before the classes are added; visual baselines are refreshed only for the shots the spec names. |
| II. Automated Release Gate | No check is skipped or loosened; the full `verify` gate and CI run as usual. Visual baseline refresh follows the documented flow. |
| III. Human Review | Don ruled the change not major (spec Clarifications, same as PR #84). Checked against each criterion: no dependency, integration or service added; no contact data touched; design system, navigation and visual identity unchanged (no colour, type, spacing token or component style changes); the "site-wide layout" criterion is the closest one, and Don's ruling covers it: the footer moves only on short pages inside the existing shell; no running-cost change; no CI, deployment or infrastructure change; no constitution amendment. No other criterion fires. The PR still needs Don's approval and may arm auto-merge. |
| IV. First-Party Before Custom | Uses the existing Tailwind utilities in the Astro layout component, per the Astro docs pages cited above; no custom CSS or script. Astro Docs MCP was available and used. |
| V. Static by Default | Pure CSS; no client JavaScript; works with JavaScript off. No server code. |
| VI. Content as Files | No content change. |
| VII. Private Data | No data handled. |
| VIII. Cloudflare Best Practices | No Worker, D1, Turnstile or AI change. |
| IX. Cost Ceiling | No cost change. |
| X. Accessible, Fast and Private | DOM and reading order unchanged; no fixed heights, so reflow at 320 px and 400% zoom holds; axe checks must stay clean; no performance budget impact (three utilities). |
| XI. Spec Kit Workflow | Runs on the Spec Kit branch `027-footer-at-bottom` in its own worktree; only `BaseLayout.astro`, `geometry.spec.ts` and the not-found baselines change. |
| Security Baseline | `_headers`, Dependabot, ruleset and abuse limits untouched. |

Post-design re-check: PASS; the design adds no file, dependency or script.

## Project Structure

### Documentation (this feature)

```text
specs/027-footer-at-bottom/
├── spec.md
├── plan.md          # this file
├── quickstart.md    # validation steps
└── tasks.md         # next phase (/speckit-tasks)
```

`research.md`, `data-model.md` and `contracts/` are not produced: there are no unknowns left
after reading the shell (decisions and rejected alternatives are above), no data, and no
interface change.

### Source Code (repository root)

```text
src/layouts/BaseLayout.astro                      # add flex min-h-dvh flex-col to <body>, grow to .page-container
tests/e2e/geometry.spec.ts                        # footer placement assertions in the per-template loop
tests/e2e/visual.spec.ts-snapshots/not-found-*    # refreshed baselines (macOS and Linux)
```

**Structure Decision**: Single Astro project; the change lives in the shared layout and the
existing E2E geometry spec.

## Risks

- **Margin collapse**: covered above; the visual shots of long pages are the proof. If any
  long-page shot moves, the cause is a collapsing margin that the flex item now contains, and the
  fix is to move that margin, not to refresh the baseline.
- **Linux baseline glyph drift**: the not-found page has ordinary glyphs, so the local Docker
  refresh should match CI; fall back to the `visual-baselines` label if it does not.
- **Sections fixture shot**: changes only if that page is shorter than the window at a given
  size (spec Visual Impact); check the diff before accepting it.

## Complexity Tracking

None. No constitution exceptions.
