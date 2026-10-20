# Implementation Plan: Second call to action in the home introduction card

**Branch**: `051-home-dual-cta` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/051-home-dual-cta/spec.md` (GitHub issue #182)

## Summary

The home page's `intro` settings gain an optional `secondaryCta: { label, href }` with the same
rules as `cta`. `HomeIntro.astro` moves the GitHub and LinkedIn icons onto their own row and puts
the calls to action in a button group below them: filled main button first, outlined second
button after it. The group stacks full width below 640 px and sits on one row (each button as
wide as its label) from 640 px. Both buttons get a 44 px minimum height. The launch content sets
"Read my writing" → `/writing/`. Everything is static HTML and Tailwind theme colours: no script,
no new dependency, no new cost.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, as pinned in `package.json`), Node 24 (`.nvmrc`)

**Primary Dependencies**: Astro content collections with `astro/zod`, Tailwind CSS 4 via the Vite plugin. No new dependency.

**Storage**: N/A (front matter in `src/content/pages/index.mdx`)

**Testing**: Vitest (unit schema tests, component tests with the Astro Container API), Playwright (e2e, axe accessibility, visual)

**Target Platform**: Static pages served by Cloudflare Workers static assets

**Project Type**: Static website (single Astro project)

**Performance Goals**: Home page stays inside the existing CI performance budget (`tests/e2e/budget.spec.ts`); zero added client JavaScript

**Constraints**: WCAG 2.2 AA (text 4.5:1, border and focus outline 3:1, 44 × 44 px targets, visible focus); existing theme colours only; no horizontal overflow from 320 px

**Scale/Scope**: One schema field, one component, one content file, one docs row, test extensions and 8 visual baselines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes, no exceptions.*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | Pass | Tasks write the schema, component and e2e extensions first and see them fail (the field is rejected by `strictObject` today; the card has 3 links, the main button is about 36 px tall). Layers per `docs/testing.md`: see "Test plan" below. |
| II. Automated Release Gate | Pass | No check is skipped or loosened. The 8 changed visual baselines are regenerated (macOS and Linux via Docker, `.claude/skills/_shared/visual-baselines.md`), not tolerated. `pnpm run verify` is the local gate. |
| III. Human Review of Every Change | Pass | Normal PR from `drc-agents`, Don approves, auto-merge armed. The visible change (taller main button, second button, social row moved) is listed for Don to check on the preview. |
| IV. First-Party Before Custom | Pass | Schema: Astro content collection schema with `astro/zod` `z.strictObject(...).optional()` ([Content collections, "Defining the collection schema"](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema); [`astro/zod` reference](https://docs.astro.build/en/reference/modules/astro-zod/)). Styling: Tailwind 4 through the official Vite plugin ([Styles and CSS, "Tailwind"](https://docs.astro.build/en/guides/styling/#tailwind)). Component tests: Container API `renderToString` ([Astro Container API](https://docs.astro.build/en/reference/container-reference/#rendertostring); [Testing, Vitest and Container API](https://docs.astro.build/en/guides/testing/#vitest-and-container-api)). Cloudflare: nothing new; the page stays a static asset. No custom code replaces a first-party option. Docs found through the Astro Docs MCP. |
| V. Static by Default | Pass | Prerendered page, two plain `<a href>` links, no island, no script; works with JavaScript off. No endpoint added. |
| VI. Content as Files | Pass | Label and link live in `index.mdx` front matter; a bad `secondaryCta` (empty label, bad link, extra field) fails `astro sync`/`build` through the existing collection schema wiring. |
| VII. Private Data | Pass (N/A) | No personal data, no form, no logging. |
| VIII. Cloudflare Best Practices | Pass (N/A) | No Worker, binding, D1 or config change; `/api/*` untouched. |
| IX. Cost Ceiling | Pass | Expected added monthly cost: **$0** (static markup and CSS only, no new service or dependency). |
| X. Accessible, Fast and Private | Pass | Contrast computed for every state (research.md R3): all text ≥ 7.36:1 except the main button at rest in light mode (4.77:1, unchanged); second button border 5.41:1 light, 4.00:1 dark; focus outline about 3.2:1 light, 5.7:1 dark (FR-010). 44 px min height on both buttons. Global `a:focus-visible` outline applies. No script, no tracker; Tailwind classes add bytes in the hundreds. |
| XI. Spec Kit Workflow | Pass | Spec Kit branch/dir naming, one feature per branch. Parallel worktrees: this feature edits `HomeIntro.astro`, `page.ts`, `index.mdx`, `docs/pages.md`, the tests named below and the `home-now-start-here-*` baselines; any sibling touching those resolves by merging `origin/main` and regenerating baselines. |
| Dev workflow: scope and copy | Pass | Only the home card changes. Copy is "Read my writing": plain, no job title (FR-015). |

## Design

### Schema (`src/content/schemas/page.ts`)

Add `secondaryCta: <same strictObject as cta>.optional()` inside the `intro` strict object. Define
the call-to-action shape once (a local `callToAction` constant) and use it for both fields, so the
rules cannot drift (FR-001, FR-002). `cta` stays required. Full shape: [data-model.md](./data-model.md).

### Component (`src/components/page/HomeIntro.astro`)

The DOM and class contract is in [contracts/home-intro-ctas.md](./contracts/home-intro-ctas.md). In short:

- The wrapper that held icons and button side by side becomes a column at every width; the icon
  `<ul>` is its first row (FR-011).
- A button group follows: `grid w-full auto-rows-fr gap-3 sm:flex sm:w-auto sm:flex-row`. When
  stacked, children fill the column and `auto-rows-fr` keeps their heights equal even if a long
  label wraps; in the row each is as wide as its label and the default `align-items: stretch`
  makes their heights equal (FR-007, FR-008). Gaps: 12 px in the group, 16 px above it (FR-007).
- Both buttons share base classes: `inline-flex min-h-11 items-center justify-center rounded-lg
  border px-4 py-2 text-sm font-medium motion-safe:transition-colors`. The main button's border is
  `border-transparent` so both boxes measure the same.
- Main (filled, unchanged colours): `bg-rust-600 text-white hover:bg-rust-700 dark:bg-rust-300
  dark:text-dusk-900 dark:hover:bg-rust-200`.
- Second (outlined): `border-dusk-500 text-dusk-800 hover:bg-mist-200 dark:border-dusk-400
  dark:text-mist-200 dark:hover:bg-dusk-700`. The issue's `border-dusk-300` / `dark:border-dusk-600`
  fail the 3:1 outline rule (2.46:1 and 1.91:1), so the plan uses dusk-500 / dusk-400 (research.md R3).
- The second button renders only when `intro.secondaryCta` is set; no empty element otherwise. The
  one-button card uses the same wrapper, group and button classes (FR-004).
- Focus: the global `a:focus-visible` outline is reused unchanged (FR-010); its 4 px reach fits in
  the text column's 24 px padding, so the card's `overflow-hidden` never clips it.
- Forced colours: both buttons have a real border, so the system draws their boundary.

### Content and docs

- `src/content/pages/index.mdx`: add `secondaryCta: { label: Read my writing, href: /writing/ }` (FR-013).
- `docs/pages.md` line 46 (`intro` row): add `secondaryCta` (optional) to the field list.
- `specs/040-home-now-start-here/spec.md` FR-016 already carries a pointer note to this spec
  (added in the checklist phase).

## Test plan (extend existing files; no new spec files)

Each behaviour has one primary layer (`docs/testing.md`, "Where a test goes").

| Behaviour | Layer | File to extend |
|---|---|---|
| `secondaryCta` optional; same rules as `cta` (empty or whitespace-only label, missing/relative/protocol-relative href, extra field, empty object, `null` and wrong type rejected, with the issue path naming the field; internal and https accepted); `secondaryCta` without `cta` rejected | Unit (schema) | `tests/unit/content/page-schema.test.ts` (existing `intro`/`cta` cases at lines ~19–24, 74–75, 141–160) |
| Build wiring of schema errors | Build (existing, no change) | `tests/build/page-validation.test.ts` already proves the collection schema runs on real files; the new field reuses that path, so no second-layer test |
| Second link renders after main, source and focus order GitHub, LinkedIn, main, second; filled vs outlined classes; `min-h-11` on both; no second link and no empty element when unset; social `<ul>` before the button group | Component | `tests/component/HomeIntro.test.ts` (add a second `intro` fixture with `secondaryCta`; update "focusable in order" and "source order") |
| Stacked full width at 375; one row, label widths, left-aligned from 640 (640, 768, 1280); social row above; all four links inside the card and not overlapping; equal heights ≥ 44; gaps 12 px and 16 px; a long label (text swapped in the page) wraps with equal heights and no overflow; second link navigates to its content href; border 3:1, focus outline 3:1 against the card and not clipped or covered, and hover text 4.5:1 in both themes (axe does not check borders, focus or hover) | E2E | `tests/e2e/pages.spec.ts`, describe "home introduction card" (lines ~147–207; the 24 px target test's `toHaveCount(3)` becomes 4). Add `homeSecondaryCtaHref` beside `homeCtaHref` in `tests/helpers/content.ts` so the spec reads the href from content (literal guard). Hover checks emulate `reducedMotion: "reduce"` so no mid-fade colour is sampled. |
| Text contrast at rest, both themes, every width; no-JS DOM | E2E a11y (existing, no change) | `tests/e2e/a11y.spec.ts` (home is in `tests/e2e/templates.ts`) |
| No horizontal overflow at 320/390/1280 | E2E geometry (existing, no change) | `tests/e2e/geometry.spec.ts` |
| Appearance | Visual (baselines change) | `tests/e2e/visual.spec.ts` "home now and start here" → regenerate `tests/e2e/visual.spec.ts-snapshots/home-now-start-here-{phone,desktop}-{light,dark}-visual-{darwin,linux}.png` (8 files) |
| Script and size budget | E2E budget (existing, no change) | `tests/e2e/budget.spec.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/051-home-dual-cta/
├── spec.md
├── plan.md                       # this file
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── contracts/home-intro-ctas.md  # Phase 1 (UI contract)
├── quickstart.md                 # Phase 1
└── tasks.md                      # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── content/schemas/page.ts           # add secondaryCta
├── content/pages/index.mdx           # launch content
└── components/page/HomeIntro.astro   # layout + second button
docs/pages.md                         # intro field list
tests/
├── unit/content/page-schema.test.ts
├── component/HomeIntro.test.ts
├── helpers/content.ts                # homeSecondaryCtaHref
└── e2e/
    ├── pages.spec.ts
    └── visual.spec.ts-snapshots/home-now-start-here-*.png
```

**Structure Decision**: Single Astro project; the change touches the files above only.
`src/layouts/PageLayout.astro` takes its `intro` type from `HomeIntro`'s props, so it needs no edit.

## Risks

- **Linux baselines need Docker.** Docker Desktop is normally off; the implement phase must ask Don
  to start it (CLAUDE.md, Local toolchain).
- **Spec 040 superseded.** Spec 040 said the intro's call to action is the home page's one button;
  this feature knowingly changes that (spec Assumptions). `tests/e2e/pages.spec.ts` "the text below
  the card has no button-style links" stays valid because both buttons are inside the card.
- **Dark border 4.00:1** passes with margin but is the tightest new ratio; the e2e border-contrast
  check guards it.

## Complexity Tracking

No constitution violations; nothing to justify.
