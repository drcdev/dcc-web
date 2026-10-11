# Implementation Plan: Interactive architecture diagram on the Technology page

**Branch**: `036-technology-architecture-diagram` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/036-technology-architecture-diagram/spec.md` (GitHub issue #171)

## Summary

The Technology page is rebuilt around one inline SVG diagram of how the site works: 12 parts
(browser with the questions panel and contact form inside it; production with static pages, the
Worker API and the D1 database; the Workers AI model, the Turnstile bot check, the email path, the
contact inbox; and a small preview group). Each part is an SVG link to its entry in a list of
explanations below the diagram, so everything works without JavaScript; a small processed Astro
script adds the selected state and returns focus from "Back to diagram". Explanations are
Markdown part files in a new `architecture` content collection; geometry and connections are a
typed layout module. Each part's source path is checked at build time and turned into a GitHub
`main` link. The page's Site, Hosting and Contact form prose moves into the explanations; Design,
Analytics, the Data locations table and the closing note stay. No new service, dependency,
endpoint or cost.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`); Astro 7.3.5 static output.

**Primary Dependencies**: Astro (content collections `glob()` loader, processed `<script>`, MDX
section components, Fonts API Inter), Tailwind CSS 4.3.3. **No new npm dependency.**

**Storage**: none at run time. Content in `src/content/architecture/*.md` (12 files).

**Testing**: Vitest 5 `unit` project (unit, schema, component tests via the Astro container
helper in `tests/component/sections/helpers.ts`) and `build` project (real `astro build`);
Playwright `e2e` and `a11y` projects against the real site on port 4321; budget project.

**Target Platform**: Cloudflare Workers static assets (prerendered page); modern evergreen browsers.

**Project Type**: static web site (Astro) with one Worker for `/api/*` (untouched).

**Performance Goals**: Technology page inside the existing budget (LCP ≤ 2.5 s, CLS ≤ 0.1, JS ≤
10 KB, total ≤ 150 KB on simulated mobile). The diagram script is expected under 1 KB; the SVG
markup roughly 10–20 KB before compression.

**Constraints**: CSP with no inline `style` attributes and scripts only from `'self'` or hashed;
no third-party resource; one vertical layout at every width; part labels ≥ 14 CSS px and
connection labels ≥ 12 CSS px at a 320 px viewport (narrowest container 240 px in dark mode,
research R4); WCAG 2.2 AA in both themes and forced colours.

**Scale/Scope**: one page, 12 parts, 9 connections; about 30 files touched (12 content files,
component, layout and source modules, schema, section registry, page MDX, tests, docs).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan complies |
|---|---|---|
| I. Test-First | Pass | Every task starts with a failing test at one named layer (see "Test placement"). Layout invariants, source rules and schema are unit tests; markup is a component test; build wiring and built-page facts are build tests; journeys, focus, no-JS and rendered label sizes are E2E; the template is already in the a11y scan. |
| II. Automated Release Gate | Pass | No check is skipped or loosened. The source-link check (FR-007) is part of the build and the unit suite, so a broken link fails `verify` and CI. `budget.spec.ts` keeps measuring the Technology template. |
| III. Human Review of Every Change | Pass | Normal single flow: PR from `drc-agents`, auto-merge armed after the final push, Don approves after the `[PREVIEW-CHECK]` items (quickstart §4), including reading every explanation for truth (FR-013) and the note that links to files added by this PR resolve only after merge. |
| IV. First-Party Before Custom | Pass | Astro first-party throughout, each cited from the Astro Docs MCP: content collections with `glob()` and a Zod schema (docs.astro.build/en/guides/content-collections/), `generateId` for file-naming checks (docs.astro.build/en/reference/content-loader-reference/#glob-loader), `render()` for bodies, processed `<script>` instead of a framework island (docs.astro.build/en/guides/client-side-scripts/#script-processing), MDX components passed to `<Content />` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content), Fonts API Inter (docs.astro.build/en/guides/fonts/), Astro CSP (docs.astro.build/en/reference/configuration-reference/#securitycsp). Considered and rejected with reasons (research R1): Astro image handling of an SVG file (inert, no links, no page fonts, sandboxed CSP), UI framework islands (runtime JS, no no-JS path), third-party diagram libraries (no Astro first-party option exists). Cloudflare: nothing new is needed; the page is a Workers static asset. Fly.io: not used by the site; no server is needed, so no Fly.io capability applies. Custom code is limited to the layout module, the source-path check (no first-party repository-link checker; precedent `assertImagesExist`) and ~40 lines of selection script. |
| V. Static by Default | Pass | Page stays prerendered; no endpoint added or changed. The only script is a small island-like module for the diagram, loaded as a deferred module on this page only. The diagram, explanations and links work with JavaScript off (FR-008). |
| VI. Content as Files | Pass | Explanations are Markdown files in a schema-validated collection; invalid content (missing name, missing or bad source, empty body, id mismatch) fails the build with the file named (contracts/part-files.md). |
| VII. Private Data | Pass | No data collected or stored. Explanations describe the contact path truthfully: nothing stored, one fixed verified inbox, preview emails marked. |
| VIII. Cloudflare Best Practices | Pass | No Worker, binding, D1 or configuration change. `wrangler.jsonc` is only linked to, not edited. Only `/api/*` runs Worker code, as before. |
| IX. Cost Ceiling | Pass | Expected change **$0/month** (research R10): no new service, request path or storage; a few KB more static HTML. The PR body states it. |
| X. Accessible, Fast and Private | Pass | WCAG 2.2 AA design in research R7 (label-in-name, text alternative for lines via "Connects to", focus ring, non-colour selected cue, forced colours, sensible tab order, focus management). Budget kept (tiny script). No third-party script or resource (FR-011). |
| XI. Spec Kit Workflow | Pass | Spec Kit branch and directory; one feature in its own worktree. Shared files with possible sibling branches: `src/components/sections/index.ts`, `schemas.ts`, `src/content.config.ts`, `tests/helpers/content.ts`, `docs/testing.md`, `docs/pages.md`. Conflicts are handled by merging `origin/main` before the gate and resolving by keeping both sides' additions (all are additive lists). |
| Technology Constraints | Pass | Astro, strict TypeScript, Tailwind theme tokens; no new tool, service or library. |
| Security Baseline | Pass | `public/_headers` unchanged; CSP unchanged and respected (no `style` attributes, no inline unhashed script). Source links use `rel="noopener"` with `target="_blank"`. |
| Development Workflow | Pass | Constitution Check present; every Astro choice cites its docs page (above and research); tests precede code; each behaviour has one primary layer, second layers justified below; out-of-scope items stay in the spec's follow-up list. Plain-language copy. |

**Gate result**: pass. No violations; Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: still pass. The design added a content collection
(Principle VI satisfied by Markdown files), one section component, one processed script and no
dependency. The one interpretation made (FR-014 "closing note" vs "Questions section", research
R9) changes no principle.

## Design

### Rendering

`technology.mdx` body starts with `<ArchitectureDiagram />` (registered section, no props in
content). The component:

1. Reads the `architecture` collection (or the `parts` prop in tests), checks it against the
   layout (`checkParts`: same ids, labels match names; contracts/part-files.md P08, P09) and
   throws a `contentError` naming the problem otherwise.
2. Renders `<figure id="architecture-diagram">` with the inline SVG from the layout: group frames,
   boxes, connection polylines with arrowhead markers and labels (all `aria-hidden`), then one
   `<a href="#id">` per part over its box or group tab (contracts/diagram-dom.md M01–M05).
3. Renders `## How each part works` and one `<article id="id" tabindex="-1">` per part with the
   explanation (`render()`), the generated "Connects to" line, the source link and the back link
   (M06–M08).
4. Includes one processed `<script>` (research R5) and a scoped `<style>` using theme tokens, focus
   ring, selected state and `forced-colors` rules (R6, R7).

### Source links

`src/lib/architecture/source.ts`: `REPOSITORY_URL`, `assertPartSource(file, base, data)` (called
from the collection's `generateId`) and `sourceUrl(root, path)` deciding `blob` vs `tree` from the
file system (research R8; contracts/part-files.md P03–P06).

### Page content changes (FR-014)

Remove `## Site`, `## Hosting`, `## Contact form` and the `## Questions` heading; keep `## Design`,
`## Analytics`, `## Data locations` and the closing note paragraph after the explanations. The
removed prose, rewritten where needed to stay true today, goes into the static-pages, worker-api,
production, preview, contact-form, bot-check, email-path and inbox explanations (research R9).

## Test placement

One primary layer per behaviour (docs/testing.md "Where a test goes"). Tests never name real
content: the E2E and content tests read the part files through a new `architectureParts` reader
in `tests/helpers/content.ts`; layout ids are code (the layout module), not content, so unit tests
may use them. No test file contains a `specs/` path literal; tests cite contract row ids
(`M03`, `P04`, `L06`, …). The no-real-content guard is not extended to part names (they are short
generic labels such as "Static pages" that would produce false hits); tests read them from the
helper instead.

| Behaviour | Layer | File | Rows |
|---|---|---|---|
| Layout geometry, flow rules, order, sizes; L01 pins the 12 anchors (FR-009) | unit | `tests/unit/site/architecture-layout.test.ts` | L01–L09 |
| Part schema | unit | `tests/unit/content/architecture-schema.test.ts` | P01, P02 |
| Source path rules and URL | unit (temp folder, neutral data) | `tests/unit/content/architecture-source.test.ts` | P03–P07 |
| Layout vs files check (`checkParts`) | unit | same file as above | P08, P09 |
| Real part files: tracked sources, browser-only exception, ids = layout ids, explanation length (FR-013) | unit content test (reads helper) | `tests/unit/content/architecture-content.test.ts` | P10, P11, P08 on real data |
| Static markup: links, entries, source link attributes, back links, no `style`, `aria-hidden` shapes | component | `tests/component/sections/ArchitectureDiagram.test.ts` | M02–M09 |
| Section registered and allowed in page bodies, documented in `docs/pages.md` | unit (existing registry tests extended) | `tests/unit/content/section-schemas.test.ts`, `tests/unit/content/body.test.ts`, `tests/unit/site/docs-content-structure.test.ts` | — |
| Technology data-handling claims (existing block, rewritten to read the contact path's part files once `## Contact form` is gone) | unit content test | `tests/unit/content/site-pages.test.ts` | FR-013, FR-014 |
| `generateId` runs `assertPartSource` on real files | build (`sync` fixture) | `tests/build/architecture-validation.test.ts` + `tests/fixtures/architecture/broken/` | P04 wiring |
| Built Technology page: diagram first, every part fragment resolves to an entry, unique ids, no `style` attributes, the kept sections present and the removed headings gone | build (content tier) | `tests/build/local-site.test.ts` | M01, M03, M06, M09, M10, FR-014 |
| Click, keyboard, back-link focus, deep link, single selection, non-part fragment | E2E | `tests/e2e/architecture.spec.ts` | J01–J07 |
| No-JS reading and fragment navigation | E2E (JS disabled) | same spec | N01, N02 |
| Rendered label sizes at 320 px both themes, Inter, labels inside boxes, part target size | E2E | same spec | R01–R03, R05 |
| Selected state has no axe violations, both themes, 320 px and desktop (SC-003) | a11y (second layer: the selected markup exists only after an activation, as with the questions panel) | same spec, axe | SC-003 |
| Idle page a11y, both themes and widths | a11y (existing `technology` template) | `tests/e2e/a11y.spec.ts` unchanged | — |
| No sideways scroll at 320/390/1280 | E2E (existing) | `tests/e2e/geometry.spec.ts` unchanged | R04 |
| Budget | budget (existing template) | `tests/e2e/budget.spec.ts` unchanged | SC-005 |

`tests/build/local-site.test.ts` is already in `test:build:content`; `content-tier.test.ts`
stays satisfied. The new `architecture-validation.test.ts` uses fixtures only, so it is not
content-tier. `tests/build/fixture-site.ts` gains an `architecture` option to copy fixture part
files into the fixture site's `src/content/architecture/`.

No new visual baselines: the diagram is real content, and the visual project snapshots fixture
subjects only (#40). Pixel-level look (lines meeting boxes, spacing) is covered by layout unit
invariants L02–L04, the E2E label-in-box check and the `[PREVIEW-CHECK]` look in quickstart §4.
The `fonts:diagrams` subset and its gate do not apply (research R2).

## Project Structure

### Documentation (this feature)

```text
specs/036-technology-architecture-diagram/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R10
├── data-model.md        # Phase 1: part file, layout module, initial parts and connections
├── quickstart.md        # Phase 1: validation guide and PREVIEW-CHECK list
├── contracts/
│   ├── diagram-dom.md   # markup, behaviour, layout and rendered-check rows
│   └── part-files.md    # part file rules and build errors
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── architecture/                 # NEW: 12 part files, <id>.md
│   ├── pages/technology.mdx          # body rebuilt around <ArchitectureDiagram />
│   └── schemas/architecture.ts       # NEW: part schema
├── content.config.ts                 # + `architecture` collection (glob, generateId → assertPartSource)
├── components/sections/
│   ├── ArchitectureDiagram.astro     # NEW: figure, SVG, entries, script, scoped style
│   ├── index.ts                      # + ArchitectureDiagram in sectionNames / sectionComponents
│   └── schemas.ts                    # + ArchitectureDiagram: section({})
└── lib/
    ├── architecture/
    │   ├── layout.ts                 # NEW: viewBox, parts, connections (pure)
    │   ├── check.ts                  # NEW: checkParts(layout, parts)
    │   └── source.ts                 # NEW: REPOSITORY_URL, assertPartSource, sourceUrl
    └── content/errors.ts             # + "Architecture part file" kind

tests/
├── helpers/content.ts                # + architectureParts reader
├── unit/site/architecture-layout.test.ts
├── unit/content/architecture-{schema,source,content}.test.ts
├── component/sections/ArchitectureDiagram.test.ts
├── build/architecture-validation.test.ts, build/fixture-site.ts (+ architecture option), build/local-site.test.ts (+ technology checks)
├── fixtures/architecture/broken/     # missing-source fixture
└── e2e/architecture.spec.ts

docs/
├── pages.md                          # how to edit a part (file + layout), the build errors, the review trigger (FR-019)
└── testing.md                        # "Architecture diagram (feature 036)" placement note
```

**Structure Decision**: single Astro project, as today. New code sits beside its closest
precedents: the section component next to `RecentWriting`, pure helpers under `src/lib/`, the
collection beside `pages`, `posts` and `projects`.

## Risks and open points

- **Label fit at 240 units**: two side-by-side boxes inside the browser frame leave about 105
  units each; "Questions panel" at 15 units needs two lines. Implementation may adjust box sizes
  or line breaks; the size floors in R4 are fixed.
- **Links to `main` on a preview**: a source file added by this PR 404s on GitHub until merge
  (research R8). Every initial source path already exists on `main`.
- **Diagram truth beyond links** stays a review responsibility (spec edge case); the flow-rule
  unit test (L06) pins the connections FR-003 names.
- **FR-014 interpretation** (research R9, now written into FR-014): the closing note stays, its `## Questions` heading goes.
- **Manual assistive-technology pass** (SC-007): keyboard, VoiceOver with Safari and forced colours are `[PREVIEW-CHECK]` items (quickstart §4), since automated checks cover only part of WCAG.

## Complexity Tracking

No violations to justify.
