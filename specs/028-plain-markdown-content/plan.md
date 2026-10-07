# Implementation Plan: Plain Markdown for standard content

**Branch**: `028-plain-markdown-content` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-plain-markdown-content/spec.md` (GitHub issue #117)

## Summary

Remove the `TextBlock`, `Offerings` and `Offering` sections from the section registry, delete
their components, schemas and tests, and rewrite `/work-with-me/` so its headings, paragraphs and
list are plain Markdown (`##` sections, `###` topics and kinds of work), keeping only `Lead` and
`CallToAction`. Astro's built-in heading ids then give every heading a linkable `id`; confirmed
against the real build (research R1). The existing "is not a section" check rejects the removed
tags with no new code (R2). The page and post guides state the plain-Markdown rule and document
exactly the eight remaining components. The sections fixture page loses its two blocks, so its
visual baselines are refreshed.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, MDX via `@astrojs/mdx` 8.0.2, Sätteri
Markdown processor (`@astrojs/markdown-satteri` 0.4.2), Node 24 (`.nvmrc`)

**Primary Dependencies**: none added or removed

**Storage**: N/A (content files in Git; Principle VI)

**Testing**: Vitest (unit, component, build projects), Playwright (e2e, a11y, sections, visual)

**Target Platform**: static pages served from the Cloudflare Worker's static assets

**Project Type**: static web site (Astro) with a Worker for `/api/*` (untouched)

**Performance Goals**: no change; the page loses markup (no `<ul>` wrapper, no `data-*`
attributes), so weight drops slightly. Performance budget unaffected.

**Constraints**: wording of Work with me unchanged (FR-005); no other page changes (FR-010,
SC-005); no new styles

**Scale/Scope**: 1 content page, 3 components removed, 2 guides, ~9 test files, 8 baseline PNGs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Result: **PASS**
before and after design; no exceptions, Complexity Tracking empty.

| Principle | Check |
|-----------|-------|
| I. Test-First | Tests are changed first and seen to fail: body.test.ts gains rejection cases for the three tags (fail while they are registered); section-schemas expects eight names; launch-content and the local-site build test expect Markdown structure and heading ids (fail on today's page); docs-content-structure expects the eight examples and no removed tags. Each behaviour has one primary layer (research R4). |
| II. Automated Release Gate | No check skipped or weakened. Deleted tests cover only deleted components; the e2e target-size check keeps the CTA (an inline link is exempt from WCAG 2.5.8), so no rule is loosened. Full `verify` gate before PR. |
| III. Human Review | Every PR needs Don's approval. **Not a major change** — see "Major-change classification" below. |
| IV. First-Party Before Custom | Heading ids: Astro's built-in Markdown/MDX heading ids (docs.astro.build/en/guides/markdown-content/#heading-ids), used as is. Rejecting tags: the site's existing `validatePageBody` check over Astro content collections; no first-party Astro feature validates MDX component names, and this check already exists, so nothing new is built. Components without import: MDX `components` prop (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content), unchanged except a shorter map. Cloudflare: no capability needed. Fly.io: not part of this stack; no capability needed. Astro Docs MCP was available and consulted. |
| V. Static by Default | Pages stay prerendered; no JS added; content readable without JS (no-JS e2e kept). |
| VI. Content as Files | Content stays MDX in Git; invalid content (removed tags) fails the build with a clear error. |
| VII. Private Data | Contact form, D1 and data handling untouched. |
| VIII. Cloudflare Best Practices | No Worker, binding, endpoint or configuration change. |
| IX. Cost Ceiling | Nothing new runs or is hosted. Expected monthly cost change: **$0**. |
| X. Accessible, Fast and Private | Heading order stays h1 → h2 → h3 with no skips (build test). Removing the unnamed `<section>` wrappers removes no landmark. a11y specs cover `/work-with-me/` (`tests/e2e/templates.ts`) and the sections fixture. Page weight drops slightly. |
| XI. Spec Kit Workflow | Spec Kit branch and directory; one feature, one worktree. Files shared with likely parallel work: `docs/pages.md`, `tests/e2e/sections.spec.ts`, `tests/fixtures/pages/sections.mdx`; conflicts, if any, are resolved by merging `origin/main` before the gate, keeping both sides' intent. |
| Technology Constraints / Security Baseline | No new tool, library or service; `_headers`, ruleset, Dependabot and abuse controls untouched. |
| Development Workflow | Astro choices cite docs (above and research R1). Writing on the guides stays plain. Out-of-scope items stay in the spec's follow-up list. |

### Major-change classification (Principle III)

**Not a major change.** Criterion by criterion:

- dependency, integration or external service: none added, removed or replaced (MDX and Astro
  stay; three local components are deleted, which is not a dependency);
- contact data: untouched;
- design system, site-wide layout, navigation, visual identity: unchanged. No token, colour,
  typography rule, template, shell or menu changes. Two authoring components are retired; the
  remaining eight render identically. The one visible change is the content of a single **draft**
  page (Work with me), which moves from the offerings list layout to the ordinary typography
  every other page already uses. The `sections-*` baselines change only because the fixture page
  stops using the removed sections; the remaining sections' pixels do not change;
- running costs: none ($0);
- CI, deployment or infrastructure configuration: none (test files change, workflow and Worker
  config do not);
- constitution: not amended.

This matches the spec's working assumption and Don's clarification (auto-merge on, no
`[PREVIEW-CHECK]` item). Reviewer note for the PR: say in one line that the slice was classified
not major and why, so Don can overrule it.

### Visual baselines

The visual project snapshots the shell (header, footer, menu), templates and the sections
fixture page, not `/work-with-me/`. This slice changes **only the sections fixture snapshot**:
`sections-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png` (8 files). Tasks must include a
baseline refresh per `.claude/skills/_shared/visual-baselines.md` and a check that no other PNG
changed.

## Project Structure

### Documentation (this feature)

```text
specs/028-plain-markdown-content/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── content-rules.md # Phase 1
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/sections/
│   ├── index.ts              # drop TextBlock, Offerings, Offering from sectionNames + sectionComponents
│   ├── schemas.ts            # drop their schemas and the `offerings` content counter
│   ├── validate.ts           # summarise(): drop `offerings`
│   ├── TextBlock.astro       # delete
│   ├── Offerings.astro       # delete
│   └── Offering.astro        # delete
├── content/pages/work-with-me.mdx   # rewrite as plain Markdown (Lead + CTA stay)
└── lib/content/body.ts       # unchanged (reads sectionNames)

docs/
├── pages.md                  # rule stated once; eight components incl. ContactForm, RecentWriting; ##/### examples
└── posts.md                  # list of page sections usable in posts: Lead, CallToAction

tests/
├── unit/content/body.test.ts                 # + removed tags rejected, ignored in code
├── unit/content/section-schemas.test.ts      # eight names; delete removed blocks
├── unit/content/launch-content.test.ts       # Work with me structure as Markdown
├── unit/site/docs-content-structure.test.ts  # eight examples, no removed tags
├── component/sections/TextBlock.test.ts      # delete
├── component/sections/Offerings.test.ts      # delete
├── build/local-site.test.ts                  # Work with me headings + ids from the real build
├── fixtures/pages/sections.mdx               # drop TextBlock/Offerings, add an inline Markdown link
├── e2e/sections.spec.ts                      # no-JS text list; CTA target size; inline link focus + underline
└── e2e/visual.spec.ts-snapshots/sections-*   # refresh 8 PNGs
```

**Structure Decision**: single Astro project at the repository root; no new directories.

## Ordering notes for tasks

1. Tests first (unit → build → docs → e2e), seen failing.
2. Registry, schemas, validator; delete the three components and their component tests.
3. Rewrite `work-with-me.mdx` (wording copied verbatim; headings `##`/`###`).
4. Fixture page and e2e spec; refresh `sections-*` baselines (macOS, then Linux via Docker or the
   CI label).
5. Guides.
6. Full verify gate (ask Don first); PR with auto-merge, not major.

## Risks

- The `sections` Playwright project and the visual project share the fixture server on 4322;
  sibling worktrees can collide (memory notes). Rerun when quiet.
- Docker Linux baselines usually match CI for this page (no unusual glyphs); fall back to the
  `visual-baselines` label if CI disagrees.
- `What I don't do` slugs to `what-i-dont-do`; tests should read ids from the built HTML rather
  than hard-code them, apart from the `consulting` spot check.

## Complexity Tracking

No violations.
