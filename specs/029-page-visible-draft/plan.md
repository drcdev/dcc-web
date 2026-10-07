# Implementation Plan: Page visibility and draft flags, file-driven navigation

**Branch**: `029-page-visible-draft` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-page-visible-draft/spec.md`

## Summary

Every standalone page gains `visible` (default true) beside `draft` (default false). A
not-visible page is left out of the production build entirely (no route, no menu link, no sitemap
entry, its own images pruned) but is built on previews and local builds with the draft notice
and noindex. The header and footer stop coming from lists in code: each page's `nav` gains a
required `location` (`header` | `footer`) next to its `position`, and two new body-less landing
files, `src/content/pages/writing.mdx` and `projects.mdx`, give the Writing and Projects code
routes their header entries. Built with Astro content collection schemas, a `getCollection()`
filter on the site's existing production signal, the existing `@astrojs/sitemap` filter, and the
existing asset-pruning hook; the only custom code is the menu builder (already custom) and two
small per-file checks in `generateId`. Today's header, footer and sitemap stay identical.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`), Astro (current stable, 6.x).

**Primary Dependencies**: Astro content collections (`astro:content`, `astro/loaders` glob,
`astro/zod`), `astro:env/server`, `@astrojs/sitemap`, `@astrojs/mdx`. No new dependency.

**Storage**: Files only (`src/content/pages/`). No D1 change.

**Testing**: Vitest (unit, Astro Container API component tests, fixture-site build tests via
`tests/build/fixture-site.ts`), Playwright (e2e, a11y, visual) on the local build (port 4321) and
the fixture site (`.cache/fixture-site`, port 4322).

**Target Platform**: Static build served by Cloudflare Workers static assets; production is the
Workers Builds build of `main`.

**Project Type**: Static web site (single Astro project with a Worker for `/api/*`, untouched).

**Performance Goals**: No change to shipped HTML/CSS/JS on today's content; performance budget
unchanged.

**Constraints**: Today's production header, footer, sitemap and draft notices identical
(FR-011, SC-005); no client JavaScript added; errors name the file in plain language.

**Scale/Scope**: 10 page files (8 existing + 2 landing), ~10 source files, ~15 test files.

No NEEDS CLARIFICATION remain; the spec's clarifications plus research R1 to R11 settle every
choice.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Verdict | How this plan meets it |
|---|---|---|
| I. Test-First | Pass | Tasks write the failing tests first at the cheapest layer: schema and menu builder (unit), footer prop (component), production vs preview visibility, sitemap and image pruning (build, the only layer that sees `astro build` output), and the existing e2e shell spec as the unchanged-navigation guard. See "Tests" below. |
| II. Automated Release Gate | Pass | No check is removed or weakened. Tests that assert the deleted code lists are rewritten against the file-driven menus with the same expectations (same six header links, same three footer links). |
| III. Human Review for Major Changes | **Major change** | Criterion "changes ... navigation": the header and footer are rebuilt from page files and the code lists are deleted. Flag it in the PR body. No other criterion applies: no dependency, integration or service added or removed; no contact data touched; no cost increase; no CI, deployment or infrastructure configuration change (`astro.config.mjs` only widens an existing sitemap filter's address set; `src/content.config.ts` adds a collection); no constitution amendment. Visible navigation output is unchanged, but the mechanism is navigation, so treat as major (when in doubt, major). |
| IV. First-Party Before Custom | Pass | Astro Docs MCP consulted (research.md). Validation: content collection Zod schemas (strict objects, defaults). Production exclusion: `getCollection()` filter pattern from the content collections guide, using the existing `build-mode.ts` signal via `astro:env`. Sitemap: `@astrojs/sitemap` `filter`. Image pruning: existing `astro:build:done` integration hook. Landing files: a second first-party glob loader with a strict schema over the same folder (R8 explains why one collection cannot hold both shapes with clear errors). Custom code only where no first-party option exists: menu ordering/clash errors (Astro has no navigation API outside Starlight), home-visible and empty-body checks in `generateId` (a schema cannot see the id or the body). Cloudflare: no runtime change; Fly.io: not used. |
| V. Static by Default | Pass | Everything is decided at build time; no endpoint, no SSR, no client JS. Not-visible pages are simply not prerendered on production. |
| VI. Content as Files | Pass | Visibility and menus move *into* the page files; invalid settings fail the build naming the file (contract rows V1 to V10). |
| VII. Private Data | Pass (n/a) | No personal data touched. The Contact page's visibility is a setting like any other; the contact API is unchanged. |
| VIII. Cloudflare Best Practices | Pass | No Worker, D1, Turnstile or Workers AI change. A not-visible page's address falls through to the existing `not_found_handling: "404-page"`. |
| IX. Cost Ceiling | Pass | Expected new monthly cost: **$0**. No new service, binding or build minutes of note (two tiny extra files). |
| X. Accessible, Fast and Private | Pass | Header and footer markup unchanged; a11y and visual checks keep running on every template; no third-party script. A not-visible page on previews keeps the draft notice, which already passes a11y. |
| XI. Spec Kit Workflow | Pass | Spec Kit branch `029-page-visible-draft` in its own worktree. Parallel-worktree risk: `src/config/navigation.ts`, `SiteFooter.astro`, `BaseLayout.astro` and the page files are shared hot spots; merge `origin/main` before the gate and resolve by keeping both sides' content with this feature's menu mechanism. |
| Security Baseline | Pass | `public/_headers`, ruleset, Dependabot unchanged. Hidden pages leave no trace in production output (no route, link, sitemap entry or orphan asset). |
| Development Workflow | Pass | Each Astro choice cites its docs page (research.md). Every test task names its layer; no behaviour is tested twice without a reason (the e2e shell spec is kept as the existing template-level guard, not a new duplicate). Out-of-scope items stay in the spec's follow-ups. Error text is plain language. |

No violations; Complexity Tracking is empty.

### Post-design re-check

Phase 1 kept every verdict. The one design point a reviewer may question, a second `landing`
collection over the pages folder (research R8), uses only first-party loaders and schemas and
was chosen *for* Principle VI's clear-error rule; it is called out in the PR body as an
interpretation of FR-008's "in the pages collection".

## Design

Details: [research.md](./research.md), [data-model.md](./data-model.md),
[contracts/page-settings.md](./contracts/page-settings.md), [quickstart.md](./quickstart.md).

1. **Schema** (`src/content/schemas/shared.ts`, `page.ts`): `navField` becomes
   `{ location: enum(header, footer), position, label? }`; page schema adds
   `visible: z.boolean().default(true)`. New `landingSchema` = strict `{ title, nav }` where `nav`
   is `navField` with `location: z.literal("header")` (V12).
2. **Collections** (`src/content.config.ts`): `pages` glob adds the negations
   `!writing.{md,mdx}`, `!projects.{md,mdx}`; its `generateId` adds `assertHomeVisible`. New
   `landing` collection: glob `{writing,projects}.{md,mdx}` over `./src/content/pages`,
   `generateId` runs `assertNoTwin`, `assertLandingBody` (empty body). Checks live in
   `src/lib/content/page-flags.ts` (new) with `contentError`.
3. **Reader** (`src/lib/pages.ts`): `getPages()` = `getCollection("pages", e => e.data.visible ||
   includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH }))`; `getNavigation()` returns
   `buildMenus([...pages, ...landing])` as `{ header, footer }` and throws when a `landingPages`
   id has no entry.
4. **Menus** (`src/lib/content/navigation.ts`): `mergeNavigation` → `buildMenus`; per-menu
   position clash naming both files in path order, the menu and the position (V6); per-menu
   duplicate link text clash (V11); no fixed entries.
5. **Config** (`src/config/navigation.ts`): delete `fixedPrimaryNavigation`, `footerNavigation`,
   `navigationSource`; add `landingPages`; keep `socialNavigation`, `NavigationItem`, add
   `SiteNavigation`.
6. **Route** (`src/pages/[...slug].astro`): build paths from `getPages()`; drop landing files from
   the `import.meta.glob` list before `assertPageAddressesFree`; pass
   `draft={data.draft || !data.visible}`.
7. **Layouts/components**: `BaseLayout` takes `navigation: SiteNavigation`, passes `header` to
   `SiteHeader` and `footer` to `SiteFooter` (new `navigation` prop; renders no `<ul>` when the
   footer list is empty). `PageLayout`, `PostLayout`, `ProjectLayout`, `SeriesPage` change only
   the prop type. Header and footer markup, `aria-current` marking and the draft notice are
   otherwise unchanged (spec FR-003a, FR-006a).
8. **Sitemap** (`src/lib/content/draft-pages.ts` → `unlistedPageAddresses()`, `astro.config.mjs`):
   include `visible: false` files; skip landing files.
9. **Content**: add `nav.location` to the seven menu pages, add `nav` to `contact.mdx`, add
   `writing.mdx` and `projects.mdx` (data-model.md table). No draft flag changes.
10. **Docs**: `docs/pages.md` (settings table, menu section, "taken addresses"), `docs/testing.md`
    contract-row mapping for V1 to V10.

## Tests (layer per behaviour; existing tests that change)

New or changed, test-first:

| Behaviour | Layer | File |
|---|---|---|
| `visible`/`draft` defaults and type errors; `nav.location` enum; `nav` needs both location and position (V1 to V4) | unit | `tests/unit/content/page-schema.test.ts` |
| Landing schema strictness (V7, V10) | unit | `tests/unit/content/page-schema.test.ts` |
| `assertHomeVisible`, `assertLandingBody` (V5, V8) | unit | `tests/unit/content/page-flags.test.ts` (new) |
| `buildMenus`: split by location, order, label default, per-menu clash naming both files in path order with menu and position, three-way clash reports the first pair, same position across menus allowed (V6), duplicate link text in one menu (V11) | unit | `tests/unit/content/navigation.test.ts` (rewritten: fixed-entry cases deleted) |
| Landing `nav.location` must be header (V12); empty `nav`, `null`/quoted/number flags, empty label rejected | unit | `tests/unit/content/page-schema.test.ts` |
| `unlistedPageAddresses` includes draft and not-visible, skips landing files | unit | `tests/unit/content/page-flags.test.ts` |
| Footer renders the links it is given, then social links; renders no `<ul>` for an empty list | component | `tests/component/SiteFooter.test.ts` (passes a `navigation` prop) |
| BaseLayout hands header and footer items through | component | `tests/component/BaseLayout.test.ts`, `NotFound.test.ts`, `PageLayout*.test.ts`, `post/*` (prop shape only) |
| Production: not-visible page absent, unlinked, unlisted, image pruned; preview: built with notice and noindex, linked, unlisted (US1, US2-4) | build | `tests/build/drafts.test.ts` + new fixture `tests/fixtures/pages/hidden-page.mdx` (`visible: false`, `nav: footer 9`, own image) |
| Wiring of V5, V7, V8, V9 into a real sync | build (sync) | `tests/build/page-validation.test.ts` + broken fixtures; `fixture-site.ts` gains `remove` option for V9 |
| Launch files carry the expected location/position and pass the schema; landing files exist | unit | `tests/unit/content/launch-content.test.ts` (table gains location; adds contact, writing, projects) |

Existing tests that change because their subject changes:

- `tests/unit/site/navigation.test.ts`: delete the `fixedPrimaryNavigation` and
  `footerNavigation` blocks; keep `socialNavigation`, `isCurrent`, `isInSection`. Header/footer
  content is now covered by `launch-content.test.ts` (files) and `navigation.test.ts` (builder).
- `tests/helpers/content.ts`: `Entry.visible`; `pages` excludes landing files and a new
  `landingPages` export reads them; `inBuild()` drops not-visible pages on production;
  `sitemapPaths()` lists only visible, non-draft pages. `tests/unit/content/content-helper.test.ts`
  updates its `inBuild(pages)` and sitemap expectations to the new rule.
- `tests/build/indexing.test.ts`: `isDraftPage` also treats not-visible pages as noindex (it
  derives from the helper, so today's content gives the same result).
- `tests/unit/site/sitemap.test.ts`: unchanged (it avoids page addresses by design); the build
  test covers the widened filter.
- `tests/unit/content/no-real-content-in-tests.test.ts`: reads `pages`; check it still sees the
  real pages (landing files have no body, so they add no needles).

Unchanged, and must stay green as the SC-005 guard: `tests/e2e/shell.spec.ts` (header `PRIMARY`
and `FOOTER_LINKS` in `tests/e2e/templates.ts` / the spec), `tests/e2e/menu.spec.ts`,
`tests/component/SiteHeader.test.ts`, the visual baselines (header/footer pixels unchanged, so no
baseline refresh is expected). The Playwright fixture site copies the real pages and so picks up
the landing files and menu settings with no script change; its fixture pages have no `nav`.

## Project Structure

### Documentation (this feature)

```text
specs/029-page-visible-draft/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── page-settings.md
├── checklists/
└── tasks.md             # /speckit-tasks, not created here
```

### Source Code (repository root)

```text
src/
├── config/navigation.ts              # remove fixed/footer lists; add landingPages, SiteNavigation
├── content.config.ts                 # pages glob excludes landing files; new `landing` collection
├── content/
│   ├── schemas/shared.ts             # navField gains location
│   ├── schemas/page.ts               # visible; landingSchema
│   └── pages/                        # nav.location on 7 pages, nav on contact; writing.mdx, projects.mdx (new)
├── lib/
│   ├── pages.ts                      # getPages() filter, getNavigation() -> { header, footer }
│   └── content/
│       ├── navigation.ts             # buildMenus()
│       ├── page-flags.ts             # new: assertHomeVisible, assertLandingBody
│       └── draft-pages.ts            # unlistedPageAddresses()
├── layouts/{Base,Page,Post,Project}Layout.astro   # navigation prop type
├── components/{SiteFooter,post/SeriesPage}.astro  # footer prop; prop type
└── pages/{[...slug],404}.astro, writing/**, projects/**  # use SiteNavigation
astro.config.mjs                      # sitemap filter uses unlistedPageAddresses
docs/pages.md, docs/testing.md
tests/ (see Tests above)
```

**Structure Decision**: Single Astro project; changes stay in the existing content, lib, layout
and test folders. No new top-level directory.

## Risks and open questions

- **Landing files as a second collection** (R8): meets FR-008's behaviour exactly, but reads
  "in the pages collection" as "in the pages folder". If Don wants one literal collection, the
  fallback is a union schema with a custom error formatter; flag in the PR body.
- **Hidden-page links in bodies**: a visible page that links to a not-visible one points at a
  404 on production; out of scope per spec (follow-up).
- **Parallel worktrees**: shared files listed under Principle XI; merge `origin/main` before the
  gate.
- **Content-derived tests**: the helper change keeps "change a flag, no test edit" true for
  pages, as issue #55 made it for posts and projects.

## Complexity Tracking

No Constitution Check violations.
