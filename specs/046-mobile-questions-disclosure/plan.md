# Implementation Plan: Collapsible questions panel on small screens

**Branch**: `046-mobile-questions-disclosure` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/046-mobile-questions-disclosure/spec.md`

## Summary

Below 1280 px the "Think while you read" panel (feature 022) becomes a closed disclosure: the
panel's own card cut down to one slim, full-width button row reading "Think while you read" over
"Optional AI critical thinking questions", with a chevron on the right. Activating it grows the
same card to show the unchanged panel content. The button is a native `<button>` inside the
panel's `h2` (APG disclosure pattern) whose `aria-expanded` attribute is the only state; Tailwind
classes show the content below xl only when that attribute is `"true"`, and always from xl,
where the button is not displayed. The closed state is in the prerendered HTML, so there is no
layout shift, and resizing across 1280 px needs no script. The panel's existing processed script
gains one click handler. Native `<details>` was considered and rejected (research R1). The
heading changes to "Think while you read" at every width. No new dependency, endpoint or cost.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Tailwind CSS 4.3.3

**Primary Dependencies**: none added (Astro processed `<script>`, Tailwind)

**Storage**: N/A (state lives in one DOM attribute for the page's lifetime; FR-011)

**Testing**: Vitest component test (Astro Container API), Playwright E2E (`sections` project on
the fixture site with the stubbed `/api/questions`), `a11y`, `budget` and `visual` projects

**Target Platform**: Static pages on Cloudflare Workers static assets; current Chromium,
WebKit (iOS Safari) and Firefox

**Project Type**: Static web site (Astro) with one Worker for `/api/*` (untouched)

**Performance Goals**: post template within the existing budget (JS ≤ 10 KB, LCP, CLS 0 from
the panel); the handler adds well under 0.5 KB

**Constraints**: WCAG 2.2 AA in both themes and forced colours; CSP forbids inline styles and
style attributes set from script; zero JS output when JavaScript is off (panel hidden);
closed bar ≤ 5rem at 390 px; no animation

**Scale/Scope**: one component (`QuestionsPanel.astro`), its tests, one comment in
`PostLayout.astro`, a `docs/testing.md` note, eight visual baselines

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1 design. No violations.*

| Principle | How this plan meets it |
|-----------|------------------------|
| I. Test-First | Tests are written and seen to fail before the component changes, one primary layer each (Design, "Tests"): component test for markup and the exact strings; E2E for disclosure behaviour, layout, focus and resize; a11y scans closed and open; budget unchanged; visual shots updated on purpose. |
| II. Automated Release Gate | No check is skipped or weakened. 022's P20 tests are replaced by the D-row tests that supersede that row (spec Context), not loosened; P21/P21a/P21b tests stay. The eight expected baselines are refreshed on both platforms; any other diff is a regression. |
| III. Human Review of Every Change | Normal PR from `drc-agents`, Don approves, auto-merge armed after the final push. `[PREVIEW-CHECK]` items: the closed bar and first-screen reading on a real phone, screen-reader announcement on iOS/Android, wide sidebar heading (quickstart "Manual check"). |
| IV. First-Party Before Custom | Astro Docs MCP was available and used. Disclosure: HTML `<details>`/`<summary>` was considered first and falls short: it cannot be closed below xl and open at xl from one prerendered markup without a layout shift or script on resize, cannot keep the small-layout state across 1280 px without extra script, and cannot sit inside the panel's heading (research R1). The chosen native `<button aria-expanded>` is standard HTML, and the logic goes in the component's Astro processed `<script>` (docs.astro.build/en/guides/client-side-scripts/#script-processing); per-width display uses Tailwind (the site's design system). Component tests use the Astro Container API (docs.astro.build/en/guides/testing/#vitest-and-container-api). Cloudflare: static-asset serving only, unchanged; no Worker, binding or config change. Fly.io: not used by this site. Table in research R8. |
| V. Static by Default | Page stays prerendered. The panel was already a late-loaded processed module; it gains one handler, no island, no endpoint. Core content reads with JS off; the panel stays hidden then (FR-008). |
| VI. Content as Files | No content or schema change. |
| VII. Private Data | No personal data; no storage (cookies, local/session storage) of the open state (FR-011). |
| VIII. Cloudflare Best Practices | No Worker, D1, Workers AI or routing change; the questions API, its origin check and bucket are untouched. Opening the panel sends no request (FR-005), so no extra model use. Free plan usage unchanged. |
| IX. Cost Ceiling | Expected added monthly cost: **$0**. Static markup and a few hundred bytes of script on existing free-plan hosting; no new service. |
| X. Accessible, Fast and Private | APG disclosure in a heading, `aria-expanded`/`aria-controls`, 44 px target, site focus ring, forced-colour system colours, name contains the visible label (2.5.3), no animation, reflow at 320 px and 200% zoom, axe closed and open in both themes. Closed state prerendered: CLS 0 from the panel; the body reaches the first screen on phones, which helps LCP. No tracking or third-party script. |
| XI. Spec Kit Workflow | Spec Kit branch/directory `046-mobile-questions-disclosure`. Overlap with sibling worktrees (045, 049, 050) is limited to `PostLayout.astro` and the `post-template` baselines; conflict handling in research R10. |
| Technology Constraints | Astro, strict TypeScript, Tailwind only; no new tool, service or library. |
| Security Baseline | `public/_headers` and the CSP unchanged: no inline style, no style attribute from script, no new inline script, no new origin. `main` ruleset, Dependabot and the questions API's abuse limits unchanged. Question text stays rendered as text, never HTML (022 P12). |
| Development Workflow | Constitution Check present; Astro choices cite docs pages; tests before implementation with named layers; scope kept to the panel (follow-ups stay in the spec); copy is the spec's exact plain-language strings. |

## Design

### Component (`src/components/post/QuestionsPanel.astro`)

Markup and rules are in [contracts/questions-disclosure.md](./contracts/questions-disclosure.md).
In short:

- A frontmatter constant `TITLE = "Think while you read"` feeds the aside's `aria-label`, the
  button's first line and the xl heading span (research R3).
- Aside: keeps `data-questions`, `hidden [.js_&]:block`, the grid placement, `data-sticky` and
  the card's border, radius and background; its padding becomes `xl:p-6` only (R5). Replace
  `aria-labelledby` with `aria-label`.
- `h2` (margins reset below xl) contains the button (`xl:hidden`) and the wide heading span
  (`hidden xl:inline`).
- Button: `type="button"`, `data-questions-toggle`, `aria-expanded="false"`,
  `aria-controls="questions-content"`; full width, `min-h-11`, label left, chevron right; the
  site's focus ring and forced-colour classes as on the panel's buttons; chevron `svg`
  `aria-hidden="true"` turned by a variant on the expanded state (no transition).
- Content wrapper `#questions-content[data-questions-content]` holds the existing sentence,
  buttons, status, list and note unchanged. Hidden below xl unless the toggle is expanded
  (a `:has([aria-expanded=true])` group variant on the aside, or equivalent pure-CSS selector),
  displayed from xl. Below-xl padding matches the card's (top padding dropped).
- Script: inside the existing per-panel loop, find `[data-questions-toggle]` and on `click`
  set `aria-expanded` to the opposite value. Nothing else. `fitSticky` is untouched (it only
  applies from xl).

### Layout (`src/layouts/PostLayout.astro`)

No structural change. Update the comment "Below xl the panel is a block above the body" to say
it is a closed disclosure there.

### Tests (layer per behaviour; tests first)

| Behaviour | Layer | File |
|---|---|---|
| D02/D03/D04 markup: aside named "Think while you read", `h2 > button` with exact two lines, `aria-expanded="false"`, `aria-controls` matching the wrapper id, chevron `aria-hidden`, wide span text, wrapper holds 022's order (P09) | Component | `tests/component/post/QuestionsPanel.test.ts` (P07 test rewritten) |
| D01 closed on load at 320/390/768/1279 px; D12 ≤ 5rem at 390 px; D13 first paragraph in the first viewport at 390×844 and 768×1024; no sideways scroll (replaces the three P20 tests) | E2E | `tests/e2e/questions.spec.ts` |
| D05 open/close by click, Enter, Space; focus stays; content out of the focus order when closed | E2E | `tests/e2e/questions.spec.ts` |
| D06 no request on open; questions kept across close/reopen; request in flight while closed completes and shows on reopen, focus not lost | E2E | `tests/e2e/questions.spec.ts` |
| D07/D08 at 1280 px no visible or focusable toggle; resizing 390→1280→390 restores the last small choice and keeps questions | E2E | `tests/e2e/questions.spec.ts` |
| D09 no trigger at 390 and 1280 px without JS | E2E | `tests/e2e/no-js.spec.ts` (extend existing test) |
| D15 axe with the panel open at 390 px, both themes (closed state is already scanned by the template scan at phone width) | a11y | `tests/e2e/blog-fixture.a11y.spec.ts` (second layer: open-state markup exists only after a press, as 022 argued) |
| D15 forced colours: trigger boundary and focus ring visible at 390 px | E2E | `tests/e2e/blog-forced-colors.spec.ts` |
| D11/D14 budget and CLS | budget | existing `budget.spec.ts`, unchanged |
| Pixels of both layouts | visual | existing `post-template` shots; refresh the eight images in research R9 |

The 022 journey tests run in Desktop Chrome (1280×720), the wide layout, so they keep passing
unchanged. The P21b zoom tests at 640/320 px keep checking `position: static` and no overlap.

### Docs

`docs/testing.md` "Critical-thinking questions": rename the panel and add one line on where
the disclosure is tested; the visual paragraph's "above the body" becomes "a closed bar above
the body".

### Visual baselines

Changing (macOS and Linux): `post-template-phone-light`, `post-template-phone-dark`
(closed bar), `post-template-desktop-light`, `post-template-desktop-dark` (heading wording).
Eight images, refreshed per `.claude/skills/_shared/visual-baselines.md` (Linux via Docker).

## Project Structure

### Documentation (this feature)

```text
specs/046-mobile-questions-disclosure/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── questions-disclosure.md
├── checklists/
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/post/QuestionsPanel.astro   # disclosure markup, classes, click handler
└── layouts/PostLayout.astro               # comment only

tests/
├── component/post/QuestionsPanel.test.ts
└── e2e/
    ├── questions.spec.ts
    ├── no-js.spec.ts
    ├── blog-fixture.a11y.spec.ts
    ├── blog-forced-colors.spec.ts
    └── visual.spec.ts-snapshots/post-template-*-visual-{darwin,linux}.png  # 8 images

docs/testing.md
```

**Structure Decision**: the existing Astro single-project layout; no new files in `src/`.

## Risks and open points

- **SC-001 depends on the post**: the fixture post's title card fits 390×844 with the closed
  bar, but a real post with a very long title or summary might still push the first paragraph
  below the fold. The test uses the fixture post; that is the spec's "representative post".
- **5rem at 390 px is tight** (≈ 4.63rem by arithmetic, R5); if Inter's metrics wrap the second
  line at 390 px, reduce horizontal padding or chevron gap rather than the text size.
- **Live region while closed**: a result that arrives while the panel is closed is not
  announced (R4, allowed by FR-009).
- **Sibling worktrees** touching `PostLayout.astro` or `post-template` baselines (R10).

## Complexity Tracking

No constitution violations to justify.
