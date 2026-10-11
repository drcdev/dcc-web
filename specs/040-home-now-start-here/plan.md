# Implementation Plan: Home page with a Now section and Start here reading paths

**Branch**: `040-home-now-start-here` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/040-home-now-start-here/spec.md` (issue #162)

## Summary

The home page body becomes intro, **Now**, **Start here**, **Recent writing**. The two paragraphs and
"What I do" are cut from `src/content/pages/index.mdx`.

- **Now** is one Markdown file, `src/content/now/now.md`, in a new `now` content collection
  (`glob()` loader, strict Zod schema). Its front matter holds the `updated` date and the four
  topics; its body is the one-line "open to" sentence with its contact link, rendered by Astro's own
  `render()`.
- **Start here** is one YAML file per reading path in `src/content/reading-paths/`, in a new
  `readingPaths` collection (`glob()` loader). Each item is `{ post: <slug> }` or
  `{ project: <slug> }` through Astro's `reference()`. A small pure module checks what the schema
  cannot see: missing targets, duplicate items, more than four paths, duplicate positions. Each check
  names the file and the item.
- Reading times come from the existing reading-time plugin (Astro's "Add reading time" recipe),
  which already stores `minutesRead` for every Markdown/MDX entry. Posts read it through
  `getPostSummaries()`. Project stories read it from `render(entry).remarkPluginFrontmatter`.
- Two new body sections, `<Now />` and `<StartHere />`, join the closed section registry beside
  `<RecentWriting />`. They render static HTML and add no JavaScript.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`); Astro 7.3.5, `@astrojs/mdx` 8.0.2

**Primary Dependencies**: Astro content collections (`glob()` loader, `reference()`, `render()`), `astro/zod`, Tailwind CSS. No new packages.

**Storage**: Files in the repository only (`src/content/now/`, `src/content/reading-paths/`). No D1, KV or Worker change.

**Testing**: Vitest (unit, Astro Container API component tests, fixture-site build tests), Playwright (E2E, axe accessibility, visual, budget), per `docs/testing.md`.

**Target Platform**: Static pages on Cloudflare Workers static assets (unchanged).

**Project Type**: Static web site (Astro) with one Worker for `/api/*` (not touched).

**Performance Goals**: Home page stays inside the existing CI performance budget (`tests/e2e/budget.spec.ts`); zero added client JS.

**Constraints**: Readable without JavaScript; WCAG 2.2 AA; no horizontal scroll at 320 px; build fails with plain, file-naming messages on bad content.

**Scale/Scope**: One Now file, 0–4 reading path files of 1–5 items each. Two new section components, two new collections, two small library modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes, no exceptions.*

| # | Principle | Status | How this plan meets it |
|---|-----------|--------|------------------------|
| I | Test-First | PASS | Every behaviour gets one primary layer, written and seen to fail first. **Unit**: the Now and reading-path schemas, the date checks (shape, real day, not in the future), the collection checks (missing item, duplicate item, more than four paths, duplicate position), and the resolver (draft filter, empty path dropped, order). **Component** (Container API): `Now` and `StartHere` markup, heading levels, `<time datetime>`, the "Project" label, the reading-time text. **Build** (fixture site): each build failure names the file and the item; a production build (`WORKERS_CI=1`, branch `main`) leaves out drafts; no reading-path files means no section. **E2E**: the home journey on the fixture site, whose home page is the real `index.mdx` with fixture Now and reading-path content (section order, removed copy gone, links navigate, tab order, no JS, 320 px and zoom, forced colours). The axe and budget checks on `/` run on the real site with the launch paths. **Accessibility and visual** run on the home template, not per story. |
| II | Automated Release Gate | PASS | Nothing is skipped or loosened. `pnpm run verify` already exists and runs the whole gate. New baselines are added; none are weakened. |
| III | Human Review of Every Change | PASS | One PR from `drc-agents`, auto-merge armed after the final push. The launch Now wording (FR-021) and the path descriptions (FR-022) are listed as `[PREVIEW-CHECK]` items for Don. |
| IV | First-Party Before Custom | PASS | Every capability uses an Astro first-party feature (table below). The Astro Docs MCP was available and used; research.md cites each page. Custom code covers only what Astro does not do: cross-collection checks with file-naming errors (Astro's `reference()` is checked only when read, and its error does not name the file), the future-date check, the Now body check, and the resolver. |
| V | Static by Default | PASS | Both sections are prerendered in the home page. No endpoint, no island, no client script. Content is readable with JS off (E2E no-JS check on `/`). |
| VI | Content as Files | PASS | The Now entry and the reading paths are files under `src/content/`, validated by collection schemas. Bad content fails the build with a clear message (contracts/build-errors.md). Editing either needs no code change (FR-005, FR-011). |
| VII | Private Data | PASS (n/a) | No personal data is collected. The "open to" link goes to the existing contact page. |
| VIII | Cloudflare Best Practices | PASS (n/a) | No Worker, binding, D1, route or header change. The pages stay static assets. |
| IX | Cost Ceiling | PASS | **Expected new monthly cost: $0.** No new service, binding, storage or package. Build time grows by one project render per listed project, which is cached per build. |
| X | Accessible, Fast and Private | PASS | Heading order: one `h1` (intro name), `h2` per section, `h3` per reading path. Topic labels use `<dl>`, items use `<ol>`. axe runs on the home template, the budget check runs on `/`, and no third-party script is added. |
| XI | Spec Kit Workflow | PASS | Branch and directory come from Spec Kit (`040-home-now-start-here`). The shared files that sibling worktrees may also touch are listed below, with how each conflict is resolved. |
| — | Security Baseline | PASS | `public/_headers`, the ruleset, Dependabot and the abuse controls are unchanged. No visitor input is added. |
| — | Development Workflow | PASS | Astro choices cite docs (research.md). Copy is plain and uses the current role (FR-020). Out-of-scope items stay as follow-ups in the spec. |

### First-party options by capability (Principle IV)

| Capability | First-party option (Astro / Cloudflare / Fly.io) | Used? | Why / why not |
|------------|-----------------------------------|-------|---------------|
| Now entry as editable content | Astro content collection, `glob()` loader, Zod schema | **Used** | One Markdown file. The `generateId` hook can check the raw date, as the posts collection already does. |
| Now entry as a data file | Astro `file()` loader (YAML) | Rejected | In Astro 7.3.5 `file()` logs a missing file or a YAML parse error and carries on with no entries (`astro/dist/content/loaders/file.js`). A broken Now file would then build silently, against FR-006 (R1). |
| "Open to" line with a link | Markdown body rendered by `render()` from `astro:content` | **Used** | A normal Markdown link. No custom Markdown-in-YAML rendering. |
| Reading paths | `glob()` loader over `src/content/reading-paths/*.yaml`, one file per path | **Used** | Astro's own YAML parsing and schema errors. The id comes from the file name. Adding or removing a path means adding or removing a file. |
| Path items pointing at posts and projects | `reference("posts")`, `reference("projects")` | **Used** for typing and shape | Astro checks a reference only when `getEntry()` reads it, and that error does not name the path file. A small check over `getCollection()` adds the file-naming errors (FR-012). The same pattern is used for `replacedBy` (`src/lib/content/project-replacement.ts`). |
| Reading time | Astro "Add reading time" recipe, already used as `src/lib/markdown/reading-time.ts` | **Used** | It already runs for every Markdown/MDX entry, project stories included. No second count. |
| Draft filtering | Existing `getPostSummaries()` / `getPublishedProjects()` (`build-mode.ts`) | **Used** | One visibility rule for the whole site. |
| Dates | `<time datetime>` with the existing `formatDate` / `isoDate` | **Used** | Same date style as posts ("October 1, 2026"). |
| Page composition | MDX components passed to `<Content components>` (existing section registry) | **Used** | Same pattern as `<RecentWriting />`. The section order lives in the home page file. |
| Hosting and serving | Cloudflare Workers static assets | **Used, unchanged** | Nothing runs at request time. |
| Cloudflare data stores (D1, KV) | — | Not needed | The content is static and lives in the repository (Principle VI). |
| Fly.io | — | Not applicable | The site does not run on Fly.io. Nothing in this feature needs a server. |

## Project Structure

### Documentation (this feature)

```text
specs/040-home-now-start-here/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10
├── data-model.md        # Phase 1: Now entry, reading path, item, resolved view
├── quickstart.md        # Phase 1: how to validate end to end
├── contracts/
│   ├── content-files.md # The two file formats Don edits
│   ├── home-sections.md # Rendered markup contract for <Now /> and <StartHere />
│   └── build-errors.md  # Build failures and their messages (N01–N09, R01–R10)
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── content.config.ts                    # EDIT: add `now` and `readingPaths` collections
├── content/
│   ├── now/now.md                       # NEW: launch Now entry (FR-021)
│   ├── reading-paths/
│   │   ├── leading-change-in-healthcare.yaml   # NEW (FR-022)
│   │   └── building-with-ai-agents.yaml        # NEW (FR-022)
│   ├── schemas/now.ts                   # NEW: Now front matter schema + pure checkNowBody() (N06, N08)
│   ├── schemas/reading-path.ts          # NEW: reading path schema (reference())
│   └── pages/index.mdx                  # EDIT: body becomes <Now /> <StartHere /> <RecentWriting />
├── lib/
│   ├── content/dates.ts                 # NEW (or extend post-dates.ts): raw-date + not-in-future check, reused by Now
│   ├── content/errors.ts                # EDIT: ContentKind gains "now" and "reading path"
│   ├── content/reading-paths.ts         # NEW, pure: checkReadingPaths(), resolveReadingPaths()
│   ├── now.ts                           # NEW: getNow() (exactly one entry, runs checkNowBody(), render body)
│   └── reading-paths.ts                 # NEW: getReadingPaths() (collections + summaries + project minutes)
└── components/sections/
    ├── Now.astro                        # NEW
    ├── StartHere.astro                  # NEW
    ├── index.ts                         # EDIT: register Now, StartHere
    └── schemas.ts                       # EDIT: no-prop schemas for both

tests/
├── unit/content/now-schema.test.ts, now-body.test.ts, reading-path-schema.test.ts, reading-paths.test.ts, dates.test.ts, launch-paths.test.ts
├── unit/markdown/reading-time.test.ts   # EDIT: one shared rule for posts and projects (FR-010a)
├── component/sections/Now.test.ts, StartHere.test.ts
├── build/home-sections.test.ts          # build failures, production draft filter, no-paths case
├── build/fixture-site.ts                # EDIT: drop real reading-path files when real posts/projects are removed; `readingPaths` option
├── fixtures/now/, fixtures/reading-paths/ (valid + broken)
├── e2e/home.spec.ts                     # NEW (fixture site): order, removed copy, links, tab order, 320 px, zoom, no JS, forced colours; existing a11y/budget lists already include "/"
└── e2e/visual.spec.ts                   # EDIT: new home Now + Start here shots on the fixture site
scripts/build-fixture-site.ts            # EDIT: swap in fixture Now + reading paths
```

**Structure decision**: The existing single Astro project layout. New content collections sit beside
`pages`, `posts` and `projects`. New pure logic goes in `src/lib/content/`, and Astro-runtime readers go in
`src/lib/`, as the posts and projects code already does.

## Design notes

- **Section order lives in content.** `index.mdx` body: `<Now />`, `<StartHere />`, `<RecentWriting />`.
  `validatePageBody` already accepts any registered section. The intro (front matter `intro`) is
  unchanged. FR-016 is met by deleting the two paragraphs and "What I do".
- **Now topics** render as a `<dl>` with labels "Working on", "Reading", "MBA research",
  "AI experiments". The date renders as "Updated <time datetime="2026-10-01">October 1, 2026</time>",
  in the site's existing date style, as spec FR-002 now requires (R6).
- **Future date**: the build fails when `updated` is after the build's UTC date (R5).
- **Reading paths order** comes from a required `position` (1–4, unique), like `nav.position` on
  pages. Items keep the order they have in the file.
- **Fixture builds.** By default the fixture harness removes the real posts, and the Playwright
  fixture site removes real posts and projects too. The real reading-path files would then point at
  missing items and fail every fixture build. So both harnesses delete the copied
  `src/content/reading-paths/*.yaml`, and the Playwright fixture site swaps in fixture Now and
  reading-path files that point at its fixture posts and projects (R8). This is the main
  implementation risk; land it first.
- **Real-content tests** read the reading paths through `tests/helpers/content.ts` (extend it to read
  `src/content/reading-paths/` and `src/content/now/`). No test names a real slug, so the
  `no-real-content-in-tests` guard keeps passing.

## Visual baselines

- **No existing baseline should change.** No full-page home shot exists today. The shots taken on
  `/` (`header-*`, `footer-*`, `menu-open-phone-*`) are element screenshots of the header and
  footer, and this feature does not change those. If `menu-open-phone-*` moves because the open menu
  overlaps the new sections, refresh those four images per `.claude/skills/_shared/visual-baselines.md`
  and say so in the PR.
- **New baselines**: `home-now-start-here-{phone,desktop}-{light,dark}` (darwin + linux, 8 PNGs). They
  are taken on the fixture site (port 4322) home page, which uses the fixture Now and reading-path
  files, so Don's Now edits never break a baseline. Linux images need Docker Desktop
  (`test:visual:update:linux`).
- `sections-*` baselines are not touched: the sections fixture page does not use the new sections.

## Shared files and likely merge conflicts (sibling worktrees)

| File | This feature | Sibling risk | Handling |
|------|--------------|--------------|----------|
| `src/components/sections/index.ts`, `schemas.ts` | Adds `Now`, `StartHere` | **037 wayfinder self-assessment** probably registers a new section for the post body | Additive list entries; resolve by keeping both. Merge `origin/main` after whichever lands first. |
| `src/content.config.ts` | Adds two collections | **039 author card** may add an author data collection | Additive; keep both. |
| `src/content/posts/the-systems-leadership-wayfinder-…mdx` | Read only (path item 1) | **037** edits this post | No textual conflict. Its reading time may change, and tests derive it, so no test edit is needed. The slug must not change; if 037 renames it, the build fails with R04 naming the path. |
| `src/content/projects/*` | Read only (Cadence, drc.dev, Flux) | **038** adds a "this site" story | No conflict. Adding it to "Building with AI agents" is a later content edit, not part of this feature. |
| `src/content/pages/index.mdx` | Body rewritten | **039** reads the home portrait/bio for the author card | Front matter is unchanged here, so no conflict is expected. |
| `tests/build/fixture-site.ts`, `scripts/build-fixture-site.ts` | New option / file swap | Any sibling adding fixtures | Small, separate hunks. Re-run fixture builds after merging main. |
| `tests/e2e/visual.spec.ts` + snapshots dir | New shots | **036** (technology diagram) and **037** likely add shots | Additive test blocks and new PNG names. Conflicts are only textual. |
| `.specify/feature.json` | Points at 040 | Every sibling | Keep own value when merging main (known DIRTY-PR cause). |

## Follow-up (not in this feature)

- `scripts/ci/changed-paths.ts` treats only `.mdx` and images under `pages|posts|projects` as
  content-only. A Now or reading-path edit therefore runs the full gate. Widening the content tier to
  `src/content/now/` and `src/content/reading-paths/` is a separate chore.
- The rest is as listed in the spec's Follow-up section.

## Complexity Tracking

No constitution violations, so this section is empty.
