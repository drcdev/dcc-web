# Implementation Plan: Design directions for the blog

**Branch**: `005-blog-design-directions` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-blog-design-directions/spec.md`, plus the
"Technical direction" and "Parallel work" sections of the feature brief kept with the /deliver
run, and `docs/design-source.md`.

## Summary

Build three structurally different design directions for the "Drift & Convergence" blog as
static, prerendered prototype pages under `/design/blog/` (A. Front page, B. Timeline,
C. Topic hubs). Each has a Writing landing page, a paginated post listing (all posts and per
topic) and a post page, built from the site's existing `BaseLayout`, Tailwind tokens and prose
styles with hard-coded, realistic sample posts. The prototypes are kept out of navigation,
the sitemap and search indexes, and covered by one self-contained accessibility spec and one
sample-data unit test. A Playwright capture script produces 36 screenshots (3 directions ×
3 screens × 2 widths × 2 themes) for `docs/design/blog.md`, the decision document with an empty
Decision section. The prototypes stay on the branch for Don's preview review, then a
follow-up commit removes them (and their tests and capture script) before merge, so only the
decision document and its pictures reach main.

**Major change (Constitution Principle III): yes.** The directions propose the structure,
navigation into and addresses of a whole new site section and extend the site's visual
identity to the blog, and the feature touches build configuration (`astro.config.mjs` sitemap
filter) on the branch. The pull request is labelled a major change, auto-merge stays off, and
it waits for Don's approval after he has looked at the preview deployment.

## Technical Context

**Language/Version**: TypeScript 6 (strict) and Astro 7.3 components on Node 24 (`.nvmrc`).

**Primary Dependencies**: Existing only: `astro` 7.3.5 (routing, `paginate()`, `astro:assets`),
`tailwindcss` 4.3 with `@tailwindcss/typography`, `@astrojs/sitemap` 3.7.4. Tests: `@playwright/test`
1.63, `@axe-core/playwright` 4.13, `vitest` 5. **No new dependency.**

**Storage**: N/A. Sample content is a TypeScript module; no content collection, no database.

**Testing**: Vitest (`unit` project) for the sample-data invariants; Playwright `a11y` project
for the prototype pages (axe WCAG 2.2 AA, both themes, both widths, JavaScript off, reflow, CSP,
noindex, links); the existing `verify` gate unchanged. A standalone Playwright config for
screenshot capture (not a test gate).

**Target Platform**: Static build served by Cloudflare Workers static assets; branch preview
deployment for review. Local e2e runs against `wrangler dev` over the production build.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Prototype pages stay within the site's existing budget in spirit (no
added JavaScript, SVG images, no web fonts). They are not added to the CI budget gate because
they never reach production (see Complexity Tracking).

**Constraints**: Site CSP (`style-src 'self'` + hashes, `img-src 'self' data:`) forbids inline
style attributes and Shiki (research R4, R5); readable without JavaScript; no horizontal
scroll at 320 px; existing palettes and system font stack only; nothing added to navigation
or the sitemap; runs in parallel with the portfolio-design and contact features.

**Scale/Scope**: 3 directions, 22 prototype pages tested (plus the pages `getStaticPaths()`
generates for every sample post and topic), 13 sample posts, 4 topics, 5 SVG illustrations,
36 screenshots, 1 decision document.

## Constitution Check

*GATE: checked before Phase 0 research and re-checked after Phase 1 design. Result: PASS, with
two recorded exceptions in Complexity Tracking.*

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | `tests/unit/design/blog-samples.test.ts` and `tests/e2e/design-blog.a11y.spec.ts` are written first and seen to fail (missing module, 404s) before any prototype page is built (quickstart step 1). Every prototype page gets automated accessibility checks. Component tests are not written for prototype components: see Complexity Tracking. |
| **II. Automated Release Gate** | The new specs run inside the unchanged `pnpm run verify` (the `a11y` and `unit` projects already match their names). No check is skipped or weakened; the existing sitemap and visual tests stay as they are and act as regression checks. The branch preview deployment shows the prototypes. |
| **III. Human Review for Major Changes** | **Major change.** Triggers: it proposes the design, navigation and addresses of a new site section (visual identity / navigation), and changes build configuration (`astro.config.mjs`) on the branch. PR labelled major, auto-merge off, merge waits for Don's approval after the preview. The removal step is a `[PREVIEW-CHECK]` task. |
| **IV. First-Party Before Custom** | Astro first-party options used for every capability: static file routes and `_`-prefixed exclusion (docs.astro.build/en/guides/routing/#excluding-pages), `getStaticPaths()` + `paginate()` (docs.astro.build/en/guides/routing/#pagination; /reference/routing-reference/#paginate), `astro:assets` `<Image />` (docs.astro.build/en/guides/images/#astro-components-for-images), `@astrojs/sitemap` `filter()` (docs.astro.build/en/guides/integrations-guide/sitemap/#configuration). Syntax highlighting: Astro's Shiki `<Code />` falls short because it is incompatible with Astro's CSP (docs.astro.build/en/reference/configuration-reference/#securitycsp); the documented alternative `<Prism />` needs a new package, so code renders as plain `<pre><code>` and highlighting is left to the blog feature (R4). Cloudflare: the existing per-branch preview and `_headers` noindex are the first-party features used; nothing custom (R11). Astro Docs MCP was available and consulted. |
| **V. Static by Default** | Every prototype page is prerendered; no server code; no new client JavaScript (disclosures use `<details>`); readable with JavaScript off, and tested so. |
| **VI. Content as Files** | Sample content is hard-coded in a prototype-only TypeScript module, not public content; the brief rules out schemas for this feature. Real posts will be Markdown/MDX in a `posts` collection in the later blog feature. No CMS or database. |
| **VII. Private Data** | Not touched: no forms, no data collection, no contact data. |
| **VIII. Cloudflare Best Practices** | No Worker, D1, Turnstile or configuration change. `wrangler.jsonc` and `public/_headers` untouched. |
| **IX. Cost Ceiling** | Expected monthly cost of anything new: **$0**. Static pages and images on the existing Workers static-assets preview; no service added. |
| **X. Accessible, Fast and Private** | Every prototype page is axe-checked against WCAG 2.2 AA in both themes at phone and desktop width and without JavaScript; reflow at 320 px; topic colours from existing palettes with contrast-checked shades and a text marker for "Featured" (not colour alone). No third-party scripts, no fonts, SVG images. |
| **XI. Spec Kit Workflow** | Spec Kit branch `005-blog-design-directions`, one feature, in its own worktree. Shared files and conflict handling are stated under "Parallel work" below. |
| **Technology Constraints** | Astro, strict TypeScript, Tailwind, pnpm only. Design baseline kept: existing palettes and fonts only; no direction needs a new colour or font (each direction's description says so explicitly). |
| **Development Workflow** | Astro choices cite docs (above and research.md). Tests precede implementation in tasks. Out-of-scope items (real blog, collections, feeds, highlighting, redirects) stay in spec Follow-up work. Plain-language copy. |

**Post-design re-check (after Phase 1)**: unchanged; PASS. The design adds no dependency,
no service, no global style change and no navigation entry. The only shared-file edit is the
one-line sitemap filter in `astro.config.mjs`, which is reverted to main's version at removal.

## Project Structure

### Documentation (this feature)

```text
specs/005-blog-design-directions/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R11
├── data-model.md        # Phase 1: Topic, SamplePost, DesignDirection (A/B/C), invariants
├── quickstart.md        # Phase 1: validation and removal run guide
├── contracts/
│   ├── prototype-routes.md     # routes, proposed addresses, page furniture rules, tested pages
│   └── decision-document.md    # docs/design/blog.md structure and screenshot capture
├── checklists/          # from specify/clarify
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
# On the branch for review (all removed before merge)
src/pages/design/blog/
├── index.astro                 # directions index
├── _data/samples.ts            # topics, 13 sample posts, 3 directions, helpers
├── _components/                # PrototypeNotice, SampleBody, PostMeta, TopicPill, Pagination, per-direction pieces
├── _images/*.svg               # 5 sample illustrations
├── a/  index.astro, all/[...page].astro, topics/[topic].astro, [slug].astro
├── b/  index.astro, all/[...page].astro, topics/[topic].astro, [slug].astro
└── c/  index.astro, all/[...page].astro, [topic].astro, [year]/[slug].astro

tests/unit/design/blog-samples.test.ts     # sample-data invariants (Vitest, unit project)
tests/e2e/design-blog.a11y.spec.ts         # prototype checks (Playwright, a11y project)
tests/design/playwright.config.ts          # standalone screenshot capture config
tests/design/capture-blog.spec.ts          # writes docs/design/blog/*.jpg

astro.config.mjs                            # sitemap filter also drops /design/ (reverted to main at removal)

# Merges to main
docs/design/blog.md                         # decision document, Decision section empty
docs/design/blog/*.jpg                      # 36 screenshots
specs/005-blog-design-directions/**         # Spec Kit artifacts
```

**Structure Decision**: Single Astro project. All prototype code sits under one route folder
with `_`-prefixed private folders, so removal is a directory delete and nothing lands in
`src/components/`, `src/styles/global.css`, `src/config/` or `tests/e2e/templates.ts`.

## Phase outline for tasks

1. **Tests first**: sample-data and no-new-design-tokens unit tests; prototype a11y/structure
   spec listing the 22 pages from `contracts/prototype-routes.md`, including the directions
   index and the US1, US2 and US3 checks for the direction pages (all written before any
   direction page exists); sitemap-exclusion and navigation assertions. Run; see them fail.
2. **Foundation**: `samples.ts` (topics, posts, directions, helpers, proposed addresses);
   SVG images; shared prototype components (`PrototypeNotice`, `SampleBody` with figure, code
   region and table region, `PostMeta`, `TopicPill`, `Pagination`); sitemap filter; directions
   index.
3. **Direction A**, **Direction B**, **Direction C** (independent of each other once the
   foundation exists): landing, listing (`paginate()`), topic listing, post page, each passing
   the spec in both themes and widths.
4. **Screenshots**: capture config and spec; run; commit 36 JPEGs.
5. **Decision document**: `docs/design/blog.md` per `contracts/decision-document.md`, Decision
   section empty.
6. **Verify and PR**: full `verify`; rebase per "Parallel work"; open the PR from
   `drc-agents`, labelled major change, auto-merge off, body listing the preview URL and the
   pending removal.
7. **[PREVIEW-CHECK] Removal after Don's review**: delete prototype routes, prototype tests and
   capture script; restore `astro.config.mjs` from `origin/main`; mark preview links as
   removed in `docs/design/blog.md`; re-run `verify`; push. Then, still major, Don approves
   and merges.

## Parallel work

This feature runs alongside `006-portfolio-design-directions` and `007-contact-form`.

- **Files this feature owns**: `src/pages/design/blog/**`, `tests/e2e/design-blog.a11y.spec.ts`,
  `tests/unit/design/**`, `tests/design/**` (capture for blog; if the portfolio feature also
  creates `tests/design/`, file names differ: `capture-blog.spec.ts` vs its own), `docs/design/blog.md`,
  `docs/design/blog/**`.
- **Shared files touched**: `astro.config.mjs` only (sitemap filter). The change is written as
  `!pathname.startsWith("/404") && !pathname.startsWith("/design/")` so the portfolio feature's
  equivalent edit is identical; on conflict keep one copy of the combined condition. At
  removal the file is restored from `origin/main`, so whatever main has at that moment wins.
  If `tests/design/playwright.config.ts` exists on main from the portfolio feature by then,
  keep theirs and add this feature's spec to it rather than overwriting.
- **Not touched**: `package.json`, the lockfile, `src/components/`, `src/layouts/`,
  `src/styles/global.css`, `src/config/navigation.ts`, `tests/e2e/templates.ts`,
  `tests/e2e/a11y.spec.ts`, visual baselines, `playwright.config.ts`.
- Before opening the PR and before any merge: commit, `git fetch origin main`,
  `git rebase origin/main`, `git push --force-with-lease` if already pushed, re-run `verify`.

## Risks and open questions

- **Preview-to-removal ordering**: the PR cannot merge until the removal commit lands, which
  waits on Don. That is intended (major change) but means the PR stays open through review.
- **Screenshot size**: 36 full-page JPEGs; if the set exceeds about 6 MB, clip heights further
  or drop to quality 70 rather than removing any width/theme pair (FR-019 needs both themes).
- **Topic colour contrast**: some palette shades on dusk backgrounds fail AA (see
  `docs/design-source.md`); the axe run will catch them and the nearest passing shade is used.
- **Shared `tests/design/` folder** with the portfolio feature: handled as above; flag to Don
  only if the two configs genuinely conflict.
- No open questions block tasks.

## Complexity Tracking

| Exception | Why needed | Simpler alternative rejected because |
|---|---|---|
| No component tests for prototype components (Principle I lists component tests as a layer) | The components exist only on the branch and are deleted before merge; their rendered output is exercised on every page by the e2e/axe spec, which is what Don reviews | Component tests for throwaway components add maintenance and a removal step without testing anything that ships |
| Prototype pages not in the CI performance budget gate (Principle X) | They never reach production; the budget gate iterates the shipped `TEMPLATES` list, and adding them would edit shared test files the parallel features also touch | Adding them would force edits to `templates.ts`/`budget.spec.ts` and a second revert at removal; the prototypes add no JavaScript and use small SVG images, so budget risk is negligible |
| `astro.config.mjs` changed on the branch (Principle III trigger) | Required to keep prototypes out of the sitemap (FR-017) and to keep the existing exact-sitemap tests green | Reverted to `origin/main` at removal; no config change of this feature's reaches main |
