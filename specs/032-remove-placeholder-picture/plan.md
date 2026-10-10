# Implementation Plan: Remove the project placeholder picture option

**Branch**: `032-remove-placeholder-picture` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-remove-placeholder-picture/spec.md` (GitHub issue #137)

## Summary

Remove the optional `placeholder` boolean from both picture shapes (image and diagram) in the
project schema, so the existing strict objects reject it as an unknown key and the build fails
naming the file and the setting. Remove the "Placeholder" mark from `PartPicture.astro` and the
two styles that existed only for it (`[data-visual-mark]` and the `[data-placeholder]` entry in
the forced-colours border list in `portfolio.css`). Drop the setting from every fixture (two
valid fixtures with pictures, one draft fixture, seven deliberately broken ones, and the
component and schema test data), rewrite the three tests that asserted the mark, add unit tests
that prove the setting is rejected, update `docs/projects.md`, and refresh only the
`story-template-*` visual baselines (4 macOS + 4 Linux). The project-row baselines do not change.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`), Astro 7.3.5

**Primary Dependencies**: Astro content collections with `astro/zod` (Zod 4), `astro:assets` `<Image>`, Tailwind CSS. No dependency added or removed.

**Storage**: Content as files (`src/content/projects/*.mdx`); no database touched.

**Testing**: Vitest (unit, component via Astro container, build tests over the fixture site), Playwright (e2e, a11y, visual).

**Target Platform**: Static prerendered pages on Cloudflare Workers static assets.

**Project Type**: Static web site (single project, `src/` + `tests/`).

**Performance Goals**: No change; the story page loses three small `<p>` elements, so it only gets lighter. The CI budget stays in force.

**Constraints**: Published project pages and index rows must be byte-for-byte unaffected in what they show (FR-008, SC-004). Broken fixtures must keep failing for their own reason only (FR-005).

**Scale/Scope**: 1 schema file, 1 component, 1 stylesheet, 1 doc, 10 fixture files, 5 test files, 8 baseline PNGs.

No NEEDS CLARIFICATION remains; Clarify settled the open points (see research.md R2-R5).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan meets it |
|---|---|---|
| I. Test-First | Pass | Tests change first and are seen to fail: new unit tests in `tests/unit/content/project-schema.test.ts` asserting `placeholder` is rejected on `visual` (image, diagram) and on a `visuals` entry, with the issue text naming `placeholder` (fails today because the schema accepts it). The component test is rewritten to assert no "Placeholder" text and no `data-placeholder`/`data-visual-mark` attribute even when the data object carries the key (fails today). The build test in `tests/build/local-site.test.ts` flips to `not.toContain("data-placeholder")` (fails today). Then implementation. |
| II. Automated Release Gate | Pass | Full `verify` gate in CI; no check skipped or weakened. The e2e test "marks placeholders with real text" is removed because the behaviour it covered is removed (not a weakening); its replacement assertion lives at the cheaper component and build layers. Visual baselines refreshed only where pixels change, on both platforms. |
| III. Human Review | Pass, **not a major change** | No dependency, integration or service change; no contact data; no cost; no CI, deployment or infrastructure change; no constitution amendment. Removing an unused label and its dead style hook from one component is not a change to the design system, site-wide layout, navigation or visual identity: no published page renders the mark today, so no live page changes. The fixture `story-template` baselines change only because fixtures used the mark (same ruling Don gave for PR #84: a template-with-baselines change is not major). Don still approves the PR; auto-merge may be armed. |
| IV. First-Party Before Custom | Pass | Capability: reject a removed setting. First-party option: Astro content collection schema with `astro/zod` `z.strictObject` (docs: https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema; errors surface as Astro's `InvalidContentEntryDataError`, https://docs.astro.build/en/reference/error-reference/#content-collection-errors). Used as is: deleting the key from the strict object is the whole mechanism; no custom check. Capability: render pictures. First-party `astro:assets` `<Image>` is kept unchanged. No Cloudflare or Fly.io capability is involved (static content only). Astro Docs MCP was consulted. |
| V. Static by Default | Pass | No route, endpoint or client JavaScript added. Pages stay prerendered and readable without JavaScript. |
| VI. Content as Files | Pass | The change narrows the file format; invalid content (a file still using `placeholder`) fails the build with a clear error naming file and key. |
| VII. Private Data | Pass (not touched) | No contact or personal data path changes. |
| VIII. Cloudflare Best Practices | Pass (not touched) | No Worker, D1, Turnstile, Workers AI or config change. |
| IX. Cost Ceiling | Pass | Nothing new runs. Expected monthly cost of this change: **$0**. |
| X. Accessible, Fast, Private | Pass | WCAG unaffected: images keep alt text, diagrams keep the `aria-describedby` figcaption. Forced-colours borders for `[data-part-picture]` and the other project elements stay; only the selector for the removed element goes. Page weight drops slightly. No tracking. |
| XI. Spec Kit Workflow | Pass | Spec Kit branch/dir naming; one feature on this branch in its own worktree. Files touched are not shared with a sibling feature in flight. |
| Security Baseline | Pass | `_headers`, ruleset, Dependabot and abuse limits untouched. |
| Test placement | Pass | Each behaviour has one primary layer: rejection = unit (schema); mark gone = component; real build wiring = build test (existing assertion flipped, it already asserted the mark at build level); pixels = visual. Astro naming the file for a strict-schema failure is already proven by the existing wiring run in `tests/build/project-validation.test.ts` (rows 01-08, R01), so no new broken fixture or build run is added for `placeholder` (see research R3). |

Post-design re-check (after Phase 1): unchanged, all pass. No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/032-remove-placeholder-picture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── project-picture.md   # File-format and DOM delta for a project picture
├── checklists/             # requirements, accessibility, fixtures, schema-content, visual-baselines
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── content/schemas/project.ts          # remove `placeholder` from both picture shapes
└── components/project/
    ├── PartPicture.astro               # remove the mark line; update the header comment
    └── portfolio.css                   # remove [data-visual-mark] rule (~line 98) and
                                        # [data-placeholder] from the forced-colours list (~line 225)

docs/projects.md                        # remove the yaml line and the bullet; rename the
                                        # "Drafts and placeholders" heading to "Drafts"

tests/
├── unit/content/project-schema.test.ts # drop placeholder from `full`; add rejection tests
├── component/project/
│   ├── helpers.ts                      # drop placeholder from the `screenshot` visual
│   └── PartPicture.test.ts             # replace the mark test with a "no mark" test
├── build/local-site.test.ts            # flip the data-placeholder assertion (~line 372)
├── e2e/projects-fixtures.spec.ts       # delete "marks placeholders with real text" (~line 253)
├── e2e/visual.spec.ts-snapshots/       # refresh story-template-* only (8 PNGs)
└── fixtures/projects/
    ├── every-part.mdx                  # drop 4 `placeholder: true` lines
    ├── every-setting.mdx               # drop 2
    ├── draft.mdx                       # drop 1
    └── broken/                         # drop 1 each from 17-missing-image, 26-duplicate-slug,
                                        # 27-bad-file-name, R01-removed-order,
                                        # RP04-missing-replacement, story-malformed-table,
                                        # story-mdx-element
```

Left untouched on purpose: `docs/design/portfolio.md` (historical design record),
`specs/014-*` (historical spec artifacts), and every unrelated use of the word "placeholder"
(DraftNotice, form hints, shiki colour placeholders, `changed-paths.test.ts`, budget/a11y spec
comments, the flux.mdx comment "Themes are placeholders", post text). The fixture alt texts
"A placeholder picture for ..." in `every-part.mdx` are alt text, not the setting; they are kept
so no alt-dependent assertion moves (see research R6).

**Structure Decision**: Single static Astro site; changes stay inside the existing project
schema, project components and their tests.

## Visual baselines

Predicted to change (both platforms, regenerate per `.claude/skills/_shared/visual-baselines.md`):

- `story-template-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png` (8 files). The shot is
  `article[data-story]` on `/projects/every-part/`, where three story pictures carry the mark
  today; removing three `<p>` blocks shifts everything below them.

Predicted **not** to change:

- `project-row-*` (40 files). `ProjectRow.astro` receives only `visual.src` and `visual.alt` and
  never renders a mark, so the list-picture `placeholder` in the fixtures had no pixels.
- `retired-story-header-*`, `lead-story-*` and every other shot: no placeholder in their fixtures.

Any other visual diff is a regression to fix, not a baseline to refresh. The issue named the
project-row shots as expected to change; this plan overrides that after checking the component.

## Risks

- **Linux baselines via Docker vs CI**: no new glyphs are introduced (text is removed), so the
  local Docker run should match CI; fall back to the `visual-baselines` label flow if not.
- **Broken fixtures**: if any broken fixture kept `placeholder`, it would fail on the unknown key
  instead of its intended error and the `project-validation` build test would fail on a message
  mismatch. Every listed broken fixture is edited; a `grep -rn "placeholder:" tests/fixtures`
  check after the edit must come back empty.
- **Type check**: `picture.placeholder` disappears from the inferred type, so any missed reader
  fails `astro check`; only `PartPicture.astro` reads it today.

## Complexity Tracking

None. No constitution violations.
