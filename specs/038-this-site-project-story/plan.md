# Implementation Plan: This site as a project story

**Branch**: `038-this-site-project-story` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/038-this-site-project-story/spec.md`

## Summary

Add one draft project story, `src/content/projects/doncoleman-ca.mdx` (address
`/projects/doncoleman-ca/`), titled "doncoleman.ca", in the four parts Problem, Options, Build
and Lessons, written only from the interview answers recorded in the spec and checked against
the repository record. It carries a light-mode screenshot of the live home page as its list
picture (reused beside Problem, as the drcdev and Flux stories do) and a pipeline diagram beside
Build, an SVG with embedded Inter glyphs made with `pnpm run fonts:diagrams`. It links to the
public repository through the existing `source` setting and to the Cadence story in the body.

No schema, component, template or page changes. The existing content-derived tests already run
over every project file, so they cover the new story without edits. One test line changes: the
real-content guard turns the new title into a needle, and `tests/build/indexing.test.ts` quotes
the same string as a host name. That literal is read from `setup/config.json` instead
(research R6). The story merges with `draft: true`.

## Technical Context

**Language/Version**: MDX content in Astro 7.3.5; TypeScript 6 (strict) for the one test edit;
Node 24 (`.nvmrc`)

**Primary Dependencies**: Existing only: Astro content collections and `astro:assets`, sharp
(already a dependency) for stripping screenshot metadata, Playwright (already a dev dependency)
for the screenshot, `uv`/`pyftsubset` through the existing `fonts:diagrams` script

**Storage**: Files in Git (`src/content/projects/`); no database

**Testing**: Vitest (unit, build) and Playwright (E2E, a11y, budget, visual), all existing

**Target Platform**: Static page served by the Cloudflare Worker's static assets

**Project Type**: Static website (Astro), content change

**Performance Goals**: The story page stays inside the existing budget (150 KB total transfer,
JS limit unchanged); the diagram stays under the 16 KB diagram cap

**Constraints**: No schema or component change (FR-001, FR-012); plain Markdown body only; the
Options table must satisfy the existing build checks; no link to the site's own host; draft at
merge (FR-011)

**Scale/Scope**: One `.mdx` file, one PNG (about 1600 x 1000), one SVG diagram, one test line

## Astro documentation consulted (Principle IV)

The Astro Docs MCP (`astro-docs`) was available and used.

- [Images in content collections](https://docs.astro.build/en/guides/images/#images-in-content-collections):
  frontmatter image paths relative to the entry, validated by the schema's `image()` helper and
  optimised by `<Image />`. The story's `visual` and `visuals` use this as every other story does.
- [Defining the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema):
  an entry that breaks the schema fails the build, which is how the story's frontmatter is
  checked; no schema change is needed.
- [Images in MDX files](https://docs.astro.build/en/guides/images/#images-in-mdx-files): read and
  set aside. The project body rules forbid pictures and imports in the body, so pictures go in
  frontmatter.

## First-party options (Principle IV)

| Capability | First-party option | Used? |
|---|---|---|
| Story content and validation | Astro content collections with the existing strict `projects` schema | Yes, unchanged |
| Picture optimisation | Astro `astro:assets` `<Image />` (already in `ProjectRow` and the story template) | Yes, unchanged |
| Home-page screenshot | No Astro or Cloudflare feature captures screenshots. Cloudflare Browser Rendering could, but needs an account call and is meant for runtime use; Playwright is already the repository's browser tool | Playwright, one-off, not committed |
| Diagram text in Inter | No first-party way to embed a font in an SVG shown as `<img>`; the repository's own `fonts:diagrams` script (feature 020) is the established route | Yes, existing script |
| Hosting and drafts | Cloudflare Workers static assets; drafts left out of the production build by `src/lib/build-mode.ts` | Yes, unchanged |

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design: still passes.*

| Principle | Status |
|-----------|--------|
| I. Test-First | Pass. The behaviours are a valid story page and its links, already covered by content-derived tests that run over every project file (schema and four-part build checks, `projects.spec.ts`, `seo.spec.ts`, `projects-no-js.spec.ts`, a11y, budget, the diagram font unit and E2E tests). They need no new test. Two of them are seen red first in the implementation order: the diagram font unit test before `fonts:diagrams` runs, and the real-content guard before the `indexing.test.ts` literal is changed (research R6, R7). |
| II. Automated Release Gate | Pass. No check skipped, disabled or loosened. The one test edit replaces a literal with the same value read from `setup/config.json`, so the host rule it checks is unchanged. |
| III. Human Review of Every Change | Pass. One PR from `drc-agents`, Don's approval, auto-merge armed after the final push. The PR body lists `[PREVIEW-CHECK]` items, because the draft story is only visible on the preview. |
| IV. First-Party Before Custom | Pass. See "First-party options" above; Astro docs cited. Nothing new is added. |
| V. Static by Default | Pass. One prerendered page; no endpoint, no client JavaScript; readable without JavaScript (SC-006, covered by `projects-no-js.spec.ts` on the picked story). |
| VI. Content as Files | Pass. The story is an MDX file validated by the existing schema; invalid content fails the build. |
| VII. Private Data | Pass. No personal data. The screenshot is of a public page, with metadata stripped. |
| VIII. Cloudflare Best Practices | Pass. No Worker, binding, route or configuration change. |
| IX. Cost Ceiling | Pass. Expected new monthly cost: $0 (a few hundred KB of static files on the free plan). |
| X. Accessible, Fast and Private | Pass. Alt text on both pictures and a text description of the diagram; the story becomes the picked story for the a11y and budget checks (research R5), so both run against it. No third-party script. |
| XI. Spec Kit Workflow | Pass. Spec Kit branch and directory; one feature. Parallel worktrees: the only shared file touched outside the new files is `tests/build/indexing.test.ts`; a conflict there is resolved by keeping both edits. |
| Technology Constraints / Security Baseline | Pass. No new tool, service or library; headers, ruleset and Dependabot untouched. |
| Development Workflow | Pass. Each test task names its layer (see "Test approach"); scope kept to the spec; copy in plain language. |

## Test approach (docs/testing.md "Where a test goes")

The story merges as a draft. Production leaves it out; every other build (local, the GitHub
Actions run, the Playwright servers, branch previews) includes it (`includeDrafts()`), so every
existing test sees it.

| Behaviour | Layer | Existing test (no edit) |
|---|---|---|
| Frontmatter valid, four parts in order, Options list and table accepted (FR-001, FR-002, FR-007, FR-013) | Build (the real `astro build` in the gate) | Schema and `src/lib/content` checks; any problem fails the build |
| The story page renders title, description, canonical, sitemap entry | E2E | `seo.spec.ts` loop over `projects` |
| Story page template: h1, source link "Source code for ...", invitation link, readable without JS (FR-005, SC-006) | E2E | `projects.spec.ts`, `projects-no-js.spec.ts` on `pickedStory` |
| Accessibility and performance budget (SC-005) | a11y / budget | `a11y.spec.ts`, `budget.spec.ts` on `TEMPLATES` (`project-story` = `pickedStory`) |
| Diagram embeds the Inter glyphs it uses, under 16 KB, labels fit their boxes | Unit + E2E (existing reason: only a browser measures drawn text) | `tests/unit/site/diagram-fonts.test.ts`, `tests/e2e/diagram-fonts.spec.ts` (glob `src/content/`) |
| Tests never name real content | Unit | `tests/unit/content/no-real-content-in-tests.test.ts` (goes red, research R6) |

Visual baselines: the visual project shoots only fixture projects and the fixture story
template, so no baseline changes (research R8). Behaviours no automated test can observe (the
story's wording, the facts, the source link for a signed-out visitor, the Cadence link reading
right, the picture looking right in both themes) are Don's `[PREVIEW-CHECK]` items on the
branch preview.

## Project Structure

### Documentation (this feature)

```text
specs/038-this-site-project-story/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── story-content.md # Phase 1: the story file's contract rows
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/content/projects/
├── doncoleman-ca.mdx                     # new: the story (draft: true)
└── images/doncoleman-ca/
    ├── index.png                         # new: light-mode home page screenshot
    └── pipeline.svg                      # new: pipeline diagram with embedded Inter subset

tests/build/indexing.test.ts              # one line: host literal read from setup/config.json
```

**Structure Decision**: Content-only change in the existing projects collection layout
(`docs/projects.md`). No new directories outside `src/content/projects/images/doncoleman-ca/`.

## Complexity Tracking

No violations. One note on FR-012 ("no test changes except where required by design"): the
title "doncoleman.ca" (FR-013) is a quoted needle for the real-content guard, and
`tests/build/indexing.test.ts` already quotes that string as a host. The guard is the design
rule that requires the edit; reading the host from `setup/config.json` keeps the test's rule
the same and does not loosen the guard.
