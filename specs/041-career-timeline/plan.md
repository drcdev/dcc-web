# Implementation Plan: Interactive career timeline

**Branch**: `041-career-timeline` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/041-career-timeline/spec.md` (issue #163)

## Summary

The About page gains a **Career** timeline directly after the "About me" list, which loses its
"Leadership" line. "Recognition" stays as it is.

- Each career step is one YAML file in a new `career` content collection (`glob()` loader, strict
  Zod schema). Related posts use `reference("posts")`; a small pure check names the step file when a
  post is missing or a draft, or when the current role has a "next move" part.
- A new body section, `<CareerTimeline />`, renders the steps as an ordered list of native
  `<details>`/`<summary>` disclosures. Opening and closing need no JavaScript, and the page reads in
  full with JavaScript off.
- The filter (All, Achievements, Leadership, Awards; only used categories shown) is a small custom
  element in the component's processed `<script>`, hidden in the HTML and revealed when it runs, the
  same pattern as `ProjectFilter.astro`. A chosen category opens and highlights matching steps and
  collapses and dithers the rest with a CSS-only dot pattern behind solid-backed text.
- Launch content is exactly the six steps in spec FR-006a. No reflection text is written.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`); Astro 7.3.5, `@astrojs/mdx`

**Primary Dependencies**: Astro content collections (`glob()` loader, `reference()`), `astro/zod`, Tailwind CSS, Astro's processed `<script>` with a custom element. No new packages.

**Storage**: Files in the repository only (`src/content/career/*.yaml`). No D1, KV or Worker change.

**Testing**: Vitest (unit, Container API component, build), Playwright (E2E on the fixture site, axe, visual, budget), per `docs/testing.md`.

**Target Platform**: Prerendered page on Cloudflare Workers static assets (unchanged).

**Project Type**: Static Astro site with one Worker for `/api/*` (not touched).

**Performance Goals**: `/about/` stays inside the CI performance budget; the only new client code is one small inline module (filter only).

**Constraints**: Readable and openable without JavaScript; WCAG 2.2 AA in both themes, idle and filtered; dither never lowers text contrast; one column at 320 px; print shows everything; no motion under reduced motion.

**Scale/Scope**: Six step files at launch; one collection, one schema, two pure modules, one reader, one section component, one About page edit.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes, no exceptions.*

| # | Principle | Status | How this plan meets it |
|---|-----------|--------|------------------------|
| I | Test-First | PASS | Tests are written and seen to fail before each piece. One primary layer per behaviour (`docs/testing.md` "Where a test goes"); see "Test placement" below. |
| II | Automated Release Gate | PASS | `pnpm run verify` unchanged and not loosened. New tests and baselines are added; none are weakened or skipped. Two Astro runs are added to the build budget and recorded in `docs/testing.md`. |
| III | Human Review of Every Change | PASS | One PR from `drc-agents`, auto-merge armed after the final push. `[PREVIEW-CHECK]` items for Don: the six steps' text against FR-006a, the labels and status wording, and the dither in both themes. |
| IV | First-Party Before Custom | PASS | Every capability uses a first-party option (table below). The Astro Docs MCP was available and used; research.md cites each page. Custom code is only what no first-party feature does: file-naming cross-collection checks, the current-role rule, period formatting and the filter's state logic. |
| V | Static by Default | PASS | The timeline is prerendered in `/about/`. No endpoint. Core content is server HTML inside native `<details>`, readable and openable with JS off (FR-007, FR-014). The only script is the filter, an isolated custom element loaded as Astro's deferred module. |
| VI | Content as Files | PASS | Career steps are YAML files under `src/content/career/`, validated by a collection schema. Bad content, a missing or draft post, or an unknown category fails the build naming the file (contracts/build-errors.md). Content is Don's only (FR-006): launch text is copied from FR-006a, nothing invented. |
| VII | Private Data | PASS (n/a) | No input, no storage, no cookies. The filter state is not persisted. |
| VIII | Cloudflare Best Practices | PASS (n/a) | No Worker, binding, D1, route or header change; `/about/` stays a static asset. |
| IX | Cost Ceiling | PASS | **Expected new monthly cost: $0.** No new service, binding, storage or package. |
| X | Accessible, Fast and Private | PASS | Native disclosure semantics; `aria-pressed` buttons and a polite status line for the filter; dither is pattern plus weight change, never colour alone, with text on a solid backing; forced-colours and print rules; axe on `/about/` idle and filtered; budget check on `/about/`; no third-party script. |
| XI | Spec Kit Workflow | PASS | Branch and directory from Spec Kit. Files shared with sibling worktrees are listed below with how conflicts are handled. |
| — | Technology Constraints | PASS | Astro, strict TypeScript, Tailwind; one package manager; nothing new outside the list. |
| — | Security Baseline | PASS | `public/_headers` unchanged. The page CSP comes from Astro's `security.csp` (astro.config.mjs), which hashes every processed script, so the new script needs no policy change ([security.csp](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)). The script reads only `data-*` it owns and writes `textContent` only. Ruleset, Dependabot and abuse controls unchanged. |
| — | Development Workflow | PASS | Astro choices cite docs (research.md). Every test task will name its layer. Copy is plain (FR-020). Don's job title appears only on the About page and in the career step file that feeds it (FR-019); a unit guard keeps it there. Out-of-scope items stay in the spec. |

### First-party options by capability (Principle IV)

| Capability | First-party option (Astro / Cloudflare / Fly.io) | Used? | Why / why not |
|------------|--------------------------------------------------|-------|---------------|
| Career data as editable content | Astro content collection, `glob()` loader over YAML, Zod schema | **Used** | One file per step; Astro's own YAML parsing and schema errors name the file (research R1). |
| Career data as one file | Astro `file()` loader | Rejected | In Astro 7.3.5 it logs a parse error or a missing file and continues with no entries, so a broken file would build an empty timeline silently (040 research R1; FR-005). |
| Links to posts | `reference("posts")` | **Used** for typing and shape | Astro checks a reference only when `getEntry()` reads it, and the error does not name the step file; a pure check adds that (R2). |
| Post titles and addresses | Existing `getPostSummaries()` and `postHref()` | **Used** | One source for post titles and URLs. |
| Open and close | HTML `<details>`/`<summary>` | **Used** | Works without JS, keyboard and screen-reader support built in; already used by the self-assessment (R6). Astro has no disclosure component. |
| Filter interactivity | Astro processed `<script>` with a custom element and `data-*` props | **Used** | Astro's documented pattern for interactivity without a framework; bundled, deduplicated, inlined when small (R7). A `client:*` framework island was rejected: it would add a framework runtime for a few buttons. |
| Dither pattern | Tailwind theme tokens with a CSS `radial-gradient` | **Used** | The theme is the design system; no image asset (R8). |
| Page composition | MDX components passed to `<Content components>` (section registry) | **Used** | Same as `<Now />` and `<StartHere />` (R11). |
| Print and reduced motion | CSS `print:` and `motion-safe:` variants (Tailwind) | **Used** | Same rules the self-assessment uses. |
| Hosting | Cloudflare Workers static assets | **Used, unchanged** | Nothing runs at request time. |
| Cloudflare data stores (D1, KV, R2) | — | Not needed | Content is static and in the repository (Principle VI). |
| Fly.io | — | Not applicable | The site does not run on Fly.io; nothing here needs a server. |

## Test placement

Every test task names its layer. One primary layer per behaviour; a second layer only with the
written reason shown.

| Behaviour | Primary layer | File |
|---|---|---|
| Schema rows T01–T07 | Unit | `tests/unit/content/career-schema.test.ts` |
| Cross-file rows T08–T11, ordering, period text | Unit | `tests/unit/content/career.test.ts` |
| Used categories, matching steps, status sentence | Unit | `tests/unit/content/career-filter.test.ts` |
| Job title appears in no `src/` file but `about.mdx` and `src/content/career/` (FR-019) | Unit | `tests/unit/content/job-title-only-on-about.test.ts` (reads the current role through `tests/helpers/content.ts`; names no literal) |
| Launch content: six steps, last is current and ends `present`, no `nextMove` on it, every post published | Unit | `tests/unit/content/career-launch.test.ts` (rules over the real files via the helper, no literals) |
| Markup: order, closed by default, labels only for present parts, FR-008 order, no empty headings, plain award without link, filter and status `hidden`, only used categories offered, no next-move label on the last step, nothing rendered with no steps | Component | `tests/component/sections/CareerTimeline.test.ts` (Container API, `timeline` prop) |
| Schema wired and Astro names the file (sync); `checkCareer()` runs from `/about/` and names the file (build) | Build | `tests/build/career-timeline.test.ts` (2 runs) |
| About page placement: timeline after "About me", before "Recognition"; Leadership line gone | Build (real content) | added to an existing `test:build:content` file reading `dist/about/index.html` |
| Open/close by mouse, touch-size target and keyboard; filter journey; All resets; dithered step still visible and openable; status text; no-JS; 320 px; print emulation; reduced motion; forced colours | E2E | `tests/e2e/career-timeline.spec.ts` on the fixture site `/about/` |
| Contrast and roles, idle | Accessibility | existing `a11y.spec.ts` entry for `/about/` (no change) |
| Contrast and roles with a category chosen | Accessibility (second layer) | `tests/e2e/career-timeline.a11y.spec.ts`. Reason: the filtered markup and dither exist only after a press, as with the questions panel states. |
| Budget | Budget | existing `/about/` entry (no change) |
| Template pixels incl. dither | Visual | `visual.spec.ts`: one element shot of the fixture timeline with a category chosen and one step dithered, phone and desktop, light and dark |

Fixtures: `tests/fixtures/career/` holds valid fixture steps (neutral roles, naming fixture posts
`every-part` and `text-only`, all three categories, one award without a link, one step with every
part) and broken files for the build runs. No test names a real role, post or award; the
`no-real-content-in-tests` guard stays green.

## Project Structure

### Documentation (this feature)

```text
specs/041-career-timeline/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R13
├── data-model.md        # Phase 1: career step, category, timeline view, client state
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   ├── content-files.md     # The step file format Don edits
│   ├── timeline-markup.md   # Rendered markup and filter behaviour
│   └── build-errors.md      # T01–T11 and where each is proven
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── content.config.ts                     # EDIT: add `career` collection (glob, YAML)
├── content/
│   ├── career/*.yaml                     # NEW: six launch steps (FR-006a)
│   ├── schemas/career.ts                 # NEW: strict step schema (T01–T07)
│   └── pages/about.mdx                   # EDIT: drop Leadership line, add <CareerTimeline /> before ### Recognition
├── lib/
│   ├── content/errors.ts                 # EDIT: ErrorKind gains "career step"
│   ├── content/career.ts                 # NEW, pure: checkCareer(), orderSteps(), formatPeriod(), buildTimeline()
│   ├── content/career-filter.ts          # NEW, pure: usedCategories(), matchingSteps(), statusText()
│   └── career.ts                         # NEW: getCareerTimeline() (collection + posts + checks)
└── components/sections/
    ├── CareerTimeline.astro              # NEW: markup, styles, <career-timeline> script
    ├── index.ts                          # EDIT: register CareerTimeline
    └── schemas.ts                        # EDIT: no-prop schema

tests/
├── unit/content/career-schema.test.ts, career.test.ts, career-filter.test.ts, career-launch.test.ts, job-title-only-on-about.test.ts
├── component/sections/CareerTimeline.test.ts
├── build/career-timeline.test.ts
├── build/fixture-site.ts                 # EDIT: drop real career files by default; `career` option for fixtures
├── helpers/content.ts                    # EDIT: read src/content/career/
├── fixtures/career/                      # NEW: valid + broken step files
├── e2e/career-timeline.spec.ts, career-timeline.a11y.spec.ts
└── e2e/visual.spec.ts                    # EDIT: career-timeline element shots
scripts/build-fixture-site.ts             # EDIT: swap in fixture career files
docs/testing.md                           # EDIT: feature 041 section, contract-row mapping, build budget +2
```

**Structure decision**: the existing single Astro project. The new collection sits beside `now` and
`readingPaths`; pure logic in `src/lib/content/`, the Astro-runtime reader in `src/lib/`, the
component in the section registry.

## Design notes

- **Order of work**: collection, schema and fixture-harness changes first (R12, the main risk: real
  step files name real posts, which every fixture build removes), then the checks, then the
  component, then the filter script, then the About page edit and launch files.
- **Headings**: "Career" is an `h3` inside "About me", matching "Recognition"; list headings are
  `h4`. Steps are list items, not headings (R10).
- **Dither** is a dot pattern on the summary row with the text on a solid backing; role weight
  drops too, so the state is not colour alone. Forced colours get a dashed border; print gets none
  (R8).
- **Matching items** show their role and organization through the opened step's summary line
  directly above them (R9). If review wants it repeated per item, that is a small markup addition.
- **Current role** is the step with the latest start; it must end `present` and has no next move
  (R5).
- **Job title**: it appears in `about.mdx` (already) and in the current step's `role`. Both render
  only on `/about/`. The unit guard fails if the title string appears in any other `src/` file.

## Visual baselines

- The About page itself has no snapshot (the visual project shoots only the shell, the not-found
  page and fixture subjects; `docs/testing.md` "Visual coverage"), so the real About content cannot
  fail it, and **no existing baseline should change**. The shell shots are taken on `/`, not
  `/about/`.
- **New baselines**: `career-timeline-{phone,desktop}-{light,dark}` on the fixture site `/about/`
  (fixture steps, one category chosen so both an open highlighted step and a dithered step are in
  frame), darwin and linux: 8 PNGs. macOS via `pnpm run test:visual:update`; Linux via
  `pnpm run test:visual:update:linux`, which needs Docker Desktop (ask Don to start it if
  `docker info` fails). Follow `.claude/skills/_shared/visual-baselines.md`; any other image that
  moves is a regression to fix.

## Shared files and likely merge conflicts (sibling worktrees)

| File | This feature | Sibling risk | Handling |
|------|--------------|--------------|----------|
| `src/components/sections/index.ts`, `schemas.ts` | Adds `CareerTimeline` | Any feature adding a section | Additive entries; keep both. |
| `src/content.config.ts` | Adds `career` | Any feature adding a collection | Additive; keep both. |
| `src/content/pages/about.mdx` | Body edit | Constitution or "current site" chores rarely touch it | Small hunk; resolve by hand if needed. |
| `tests/build/fixture-site.ts`, `scripts/build-fixture-site.ts`, `tests/helpers/content.ts` | New option / file swap / reader | The doncoleman.ca story worktree may touch fixtures | Separate hunks; re-run fixture builds after merging main. |
| `tests/e2e/visual.spec.ts` + snapshots | New shots | Any visual change | New names only. |
| `docs/testing.md` | New section, budget row | Any test-adding feature | Additive; recompute the budget total on merge. |
| `.specify/feature.json` | Points at 041 | Every sibling | Keep own value when merging main. |

## Follow-up (not in this feature)

- `scripts/ci/changed-paths.ts` does not treat `src/content/career/*.yaml` as content-only, so a
  reflection-part edit runs the full gate. Widening the content tier is a separate chore (as noted
  for 040's Now and reading-path files).
- Don adds reflection parts (what changed, what he wishes he had known, the skill to the next move)
  in later small content changes.

## Complexity Tracking

No constitution violations, so this section is empty.
