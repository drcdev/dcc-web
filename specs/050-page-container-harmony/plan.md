# Implementation Plan: Standalone pages use the same content card in light and dark mode

**Branch**: `050-page-container-harmony` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/050-page-container-harmony/spec.md` (issue #181)

## Summary

Today the content section of every page drawn by `PageLayout` (and the hand-written copy of it in
`src/pages/404.astro`) is a card only in dark mode (`dark:rounded-2xl dark:bg-dusk-800 dark:p-6`).
This feature moves that section into one small Astro component, `ContentCard`, used by both
`PageLayout.astro` and `404.astro`, whose classes give the same card in both themes:
`rounded-2xl border border-dusk-200/80 bg-white p-4 shadow-xs sm:p-6 md:p-8
dark:border-dusk-700/80 dark:bg-dusk-800`, plus today's prose classes and `max-w-screen-lg`.
Every class that affects the box (radius, border width, padding, max width) is theme-independent,
so the card's box and the text column inside it cannot differ between themes; only colours
carry a `dark:` variant. Tests: one new browser spec measures the card and first paragraph on
About and the not-found page at 390, 640, 768 and 1280 px in both themes; the theme-token spec
gains the card's colours; a component test proves both pages render the same card; the
not-found, sections, home and contact-form visual baselines are refreshed on both platforms.

## Technical Context

**Language/Version**: TypeScript (strict) in Astro 7.3.5 components; Node 24 (`.nvmrc`)

**Primary Dependencies**: Astro 7.3.5, Tailwind CSS 4.3.3 via `@tailwindcss/vite`,
`@tailwindcss/typography` 0.5.20. No new dependency.

**Storage**: N/A (no data; static markup and CSS only)

**Testing**: Vitest component tests (Astro Container API), Playwright `e2e`, `sections`
(fixture site), `a11y` (axe) and `visual` projects. `pnpm run verify` is the gate.

**Target Platform**: Static pages served by Cloudflare Workers static assets; evergreen browsers

**Project Type**: Static web site (Astro) with one Worker for `/api/*` (untouched here)

**Performance Goals**: No regression of the CI performance budget (LCP, CLS, bytes). The change
adds a handful of utility classes (well under 1 KB of CSS) and no JavaScript.

**Constraints**: WCAG 2.2 AA in both themes; no horizontal scroll at 320 px; no new colours
outside the theme; no client JavaScript (FR-010); card outer box unchanged (FR-004).

**Scale/Scope**: 2 source files changed (`src/layouts/PageLayout.astro`, `src/pages/404.astro`),
1 component added, 1 doc note; affects every page `PageLayout` draws (home, About, Work with me,
Technology, Contact, Privacy policy, Terms of use, app privacy pages) and the not-found page.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | PASS | Tests are written and seen to fail first: the new geometry spec (light mode has no border, no padding today, so the light/dark parity checks fail), the theme-token probes (light border is `0px`/transparent today) and the component parity test (404 has no `#content-section` today). Each test task names its layer (see research R6). |
| II. Automated Release Gate | PASS | No check is skipped or weakened. Changed visual baselines are refreshed on macOS and Linux (Docker) in the same PR, per `.claude/skills/_shared/visual-baselines.md`, and CI `verify` must pass. |
| III. Human Review of Every Change | PASS | Normal PR from `drc-agents`, Don approves; auto-merge armed after the final push. The PR body lists a `[PREVIEW-CHECK]` item: compare About and a dead link in both themes on the preview. |
| IV. First-Party Before Custom | PASS | Styling uses the site's Tailwind theme and the Typography plugin already in use; the shared wrapper is an Astro component with a default `<slot />`, the pattern of Astro's own "Style rendered Markdown with Tailwind Typography" recipe (https://docs.astro.build/en/recipes/tailwind-rendered-markdown/) and "Components > Slots" (https://docs.astro.build/en/basics/astro-components/#slots), found through the Astro Docs MCP. Cloudflare: no platform capability is involved (static assets unchanged, no Worker code). No custom code beyond markup and utility classes. |
| V. Static by Default | PASS | Prerendered pages only; no endpoint, no SSR, no client JavaScript added (FR-010). Pages stay readable with JavaScript off (`no-js.spec.ts` keeps running). |
| VI. Content as Files | PASS | No content or schema changes; Markdown pages render into the same slot. |
| VII. Private Data | PASS | No personal data touched. The contact form only moves inside a light-mode card; its fields, island and API are unchanged. |
| VIII. Cloudflare Best Practices | PASS | No Worker, D1, Turnstile, Workers AI or Email Routing change; only `/api/*` invokes Worker code, unchanged. |
| IX. Cost Ceiling | PASS | Expected added monthly cost: **$0**. No new service, binding, dependency or traffic pattern. |
| X. Accessible, Fast and Private | PASS | Text colours are unchanged against unchanged backgrounds (white in light: the card is white on white; dusk-800 in dark: as today), so contrast is unchanged; axe runs on every template in both themes. The edge is a real 1 px border, so it survives forced colours (spec edge case). CSS growth is negligible; budget spec unchanged. No third-party script. |
| XI. Spec Kit Workflow | PASS | Spec Kit branch `050-page-container-harmony`, one feature. Sibling worktrees: this plan touches `PageLayout.astro`, `404.astro`, `theme-tokens.spec.ts` and visual baselines; if a sibling edits them, merge `origin/main` before the gate and resolve by keeping both changes, then refresh baselines last. |
| Technology Constraints | PASS | Astro, strict TypeScript, Tailwind theme as design system; no new tool. |
| Security Baseline | PASS | `public/_headers`, CSP and the ruleset are untouched; no inline style or script is added (the card is classes only, so CSP is unaffected). |
| Development Workflow | PASS | Astro choice cites the docs (above, research R1). Every behaviour has one primary layer (research R6); the 320 px no-scroll criterion (SC-004) is already owned by `geometry.spec.ts`, which runs every template at 320 px, so no second test is added. Out-of-scope items stay in the spec's follow-up list. Copy is unchanged. |

No violations; Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: unchanged, all PASS. The design adds one component and no
runtime behaviour; the contracts in `contracts/content-card.md` keep every box-affecting class
theme-independent, which is what makes FR-003 to FR-005 hold by construction.

## Project Structure

### Documentation (this feature)

```text
specs/050-page-container-harmony/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R7
├── data-model.md        # Phase 1: the ContentCard "entity" (visual tokens per theme)
├── quickstart.md        # Phase 1: how to validate
├── contracts/
│   └── content-card.md  # Phase 1: DOM/CSS contract for the card
├── checklists/          # From specify
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── components/page/
│   └── ContentCard.astro        # NEW: <section id="content-section"> card + default slot
├── layouts/
│   └── PageLayout.astro         # use ContentCard instead of the inline <section>
└── pages/
    └── 404.astro                # use ContentCard instead of the inline <section>

tests/
├── component/
│   ├── PageLayout.test.ts       # content-section assertions keep passing (structure unchanged)
│   └── NotFound.test.ts         # + same card as PageLayout (class list parity, FR-006)
└── e2e/
    ├── content-card.spec.ts     # NEW: light/dark geometry parity + light edge (SC-001–SC-003)
    ├── theme-tokens.spec.ts     # + card background/border colour probes per theme (FR-001/002)
    └── visual.spec.ts-snapshots/ # refreshed: not-found, sections, home-now-start-here, contact-form

docs/
└── design-source.md             # one-line note: light card departs from Flux content-section.hbs
```

**Structure Decision**: Single Astro site. The card lives in `src/components/page/` beside the
other `PageLayout` parts (`DraftNotice`, `HomeIntro`, `FeatureImage`). `404.astro` keeps using
`BaseLayout` directly (it has no title section or feature image) and wraps its copy in the same
component, so the two cannot drift apart again.

## Complexity Tracking

No Constitution Check violations.
