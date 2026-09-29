# Implementation Plan: Standalone pages for doncoleman.ca

**Branch**: `003-standalone-pages` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-standalone-pages/spec.md`

## Summary

Let Don publish and edit standalone pages as single text files. Pages become an Astro content
collection (`pages`, `glob()` loader, strict Zod schema with the `image()` helper) rendered by one
rest-parameter route, `src/pages/[...slug].astro`, through a new `PageLayout` ported from Flux
`page.hbs` + `content-section.hbs` (title, optional feature image, `.prose-accent` body). The
official MDX integration lets page bodies use a closed set of section components (Lead,
TextBlock, Offerings/Offering, CallToAction, Figure, WideImage, FullImage) passed to `<Content />`
so no imports are needed; wide/full images port Flux's `kg-width-wide` / `kg-width-full` styles.
The Home page's introduction card ports `layout-author-hero.hbs` with its Subscribe button
replaced by a call to action to `/services/`. Page files can opt into the header navigation;
their entries merge with the fixed Writing/Projects/Contact entries so the rendered navigation is
unchanged. Build-time checks turn every content mistake into a failed build naming the file.
Seven launch pages ship as drafts; Terms of use and Technology start from the current site. The
feature also fixes the shared content structure (config, schemas, section folder, error type) that
blog, portfolio and contact will extend, documented in `docs/design-source.md`. Details and doc
citations: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6.0 (strict, `astro/tsconfigs/strict`), Node 24 (`.nvmrc`),
Astro 7.3.5, static output.

**Primary Dependencies**: existing `astro`, `tailwindcss` + `@tailwindcss/vite`,
`@tailwindcss/typography`, `@astrojs/sitemap`. **New**: `@astrojs/mdx` (official integration,
added with `pnpm astro add mdx`). Nothing else. Markdown stays on Astro 7's default Sätteri
processor with no plugins (R4).

**Storage**: Files only: `src/content/pages/*.mdx` and `src/content/pages/images/`. No database.

**Testing**: Vitest (unit/schema in `tests/unit/`; component tests via the Astro Container API in
`tests/component/`, with the MDX container renderer for MDX fixtures; build-level tests in
`tests/build/` using Astro's programmatic `build()`/`sync()` on a copied fixture site); Playwright
against `wrangler dev` serving `dist/` (`e2e`, `a11y`, `budget`, `visual`) plus a new `sections`
project against the fixture site served by `astro preview` on port 4322; `@axe-core/playwright`
for accessibility.

**Target Platform**: Cloudflare Workers static assets, built and deployed by Workers Builds
(unchanged); evergreen browsers; readable without JavaScript.

**Project Type**: Static website, single Astro project at the repository root.

**Performance Goals**: The foundation budget per page on simulated mobile: LCP ≤ 2.5 s,
CLS < 0.1, long tasks ≤ 200 ms, JS ≤ 10 KB, total transfer ≤ 100 KB (R12 of feature 002). The
home photo is served as an optimised ~512 px WebP with `fetchpriority="high"` to stay inside it.

**Constraints**: WCAG 2.2 AA in both themes; no horizontal scroll from 320 px; no new client
script (FR-030); CSP unchanged (`img-src 'self' data:` covers `astro:assets` output); no page-level
`noindex`; no redirects; $0 added running cost.

**Scale/Scope**: 7 launch pages, 1 route file, ~12 new components (layout, home intro, feature
image, draft notice, 8 sections), 1 collection, ~17 build-failure fixtures, 8 new visual
baselines per platform for launch pages plus the sections fixture baselines.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* — **Result: PASS**
before research and after design. No violations; Complexity Tracking is empty.

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | All test layers are written and seen failing before the code they cover (see "Test layers the tasks phase must schedule first" below): unit/schema, component, build-level, E2E, accessibility, performance budget and visual baselines. The contact-API integration layer does not apply (no API). |
| **II. Automated Release Gate** | `pnpm run verify` stays the local gate and the CI `verify` job runs it unchanged in `ci.yml`. `verify` is unchanged: the fixture site's Playwright web server runs `build:fixtures` before serving it, so `verify`, the `update-baselines` job and the Linux baseline script all get the fixture site with no script or workflow change; build-failure tests run inside `pnpm run test`. Nothing is skipped or weakened: `futureDestinations` shrinks (stricter), existing baselines must stay unchanged. Invalid content fails `astro build`, so Workers Builds cannot deploy it and the merge is blocked (FR-009). |
| **III. Human Review for Major Changes** | **Major change** — see the verdict below. PR carries the `major-change` label; auto-merge stays off until Don has reviewed the preview. |
| **IV. First-Party Before Custom** | Every capability names its first-party option (table below). The Astro Docs MCP (`astro-docs`) was available and used; each Astro choice cites its doc page in research.md. The custom code is limited to what no first-party option does: address-conflict and navigation-position checks, body checks that name the file, section prop checks, and the fixture-site test harness. |
| **V. Static by Default** | Every page is prerendered by `getStaticPaths()`; sections and the home card are Astro components with no client script; content is readable with JavaScript off (E2E + a11y no-JS runs). |
| **VI. Content as Files** | Pages are MDX files in the repo, validated by a content collection schema; invalid content fails the build with a clear error (contracts/build-errors.md). No CMS, no database. |
| **VII. Private Data** | No data collected. The privacy policy describes the future contact form from the constitution (fields typed only, stored in Toronto, deleted after a retention period) with the field list, retention period, spam-protection service and request route marked "to be confirmed" (FR-022a). No secrets touched. |
| **VIII. Fly.io Best Practices** | Not applicable: no Fly.io service in this feature. |
| **IX. Cost Ceiling** | `@astrojs/mdx` is a free, build-time package; images are built into static assets. **Expected additional monthly cost: $0.** |
| **X. Accessible, Fast and Private** | axe on every launch page and the sections fixture in both themes and widths, JS on and off; budget test on every launch page; no third-party scripts or cookies added. Failing ported colour pairings are swapped for the nearest passing shade and recorded (R13). |
| **XI. Spec Kit Workflow** | Spec Kit branch and directory; one feature on this branch. Out-of-scope items stay in the spec's follow-up list (blog, portfolio, contact, final copy, new photo). |
| **Technology constraints** | Astro current stable, TypeScript strict, Tailwind; Flux remains the design baseline (ports, not new designs; accessibility shade swaps documented); Cloudflare hosting and previews unchanged; GitHub Actions; pnpm with committed lockfile. `@astrojs/mdx` is an official Astro integration the constitution names ("official integrations for MDX"). |
| **Development workflow** | Astro decisions cite the docs (research.md); tasks will order tests before implementation; placeholder copy is plain and marked as draft. |

### First-party option per capability (Principle IV)

| Capability | First-party option | Used? / why it falls short |
|---|---|---|
| Page files with validated settings | Astro content collections, `glob()` loader, Zod schema (`astro/zod`), strict objects | Used (R1, R2) |
| Page images in settings | Schema `image()` helper + `astro:assets` `<Image />` | Used (R2, R8) |
| Sharing image URL | `getImage()` from `astro:assets` | Used (R8) |
| Reusable sections | `@astrojs/mdx` + Astro components passed via `<Content components>` | Used (R3) |
| Images inside sections | MDX Markdown image syntax, optimised by Astro | Used (R8) |
| Wide / full images | Flux CSS port with Tailwind | Used; CSS only (R9) |
| Routing / addresses | `getStaticPaths()` rest route, `trailingSlash: "always"`, loader `generateId` | Used (R5) |
| Duplicate addresses | Glob loader only warns; Astro allows a static route to shadow a dynamic one | Falls short → small pure check over `import.meta.glob` file lists (R6) |
| Unknown section / file-named errors | MDX's missing-component error does not name the file in production; Sätteri plugins would need a new package and an undocumented error path | Falls short → body check in the route + prop checks in components (R4, R7) |
| Navigation from pages | `getCollection()` | Used; merge/sort/duplicate check is a small pure function (R10) |
| Sitemap | `@astrojs/sitemap` (existing) | Used, no config change (R11) |
| Page metadata | Existing `Seo.astro` (no official Astro SEO integration) | Reused |
| Hosting, previews, 404 status | Cloudflare Workers static assets + Workers Builds (existing) | Used, unchanged |
| Component tests | Astro Container API + `@astrojs/mdx/container-renderer` | Used (R15) |
| Build-failure tests / fixture site | Astro programmatic `build()`, `sync()`, `astro preview` | Used (R14); experimental API, test-only |
| Visual, a11y, budget | Playwright, `@axe-core/playwright` (existing) | Used |

### Major-change verdict (Principle III)

**Major.** It (1) adds a dependency and integration, `@astrojs/mdx`; (2) changes site-wide layout
and navigation: a new shared page layout, the home introduction card, and a new source for the
header navigation (page files merged with fixed entries), even though the rendered navigation is
unchanged; (3) changes build and test configuration (`astro.config.mjs` integrations,
`package.json` new `build:fixtures` script, `playwright.config.ts` second web server and `sections`
project, `vitest.config.ts` includes). Running cost does not increase. The spec reaches the same
verdict. The PR needs the `major-change` label and Don's approval after the preview checks in
[quickstart.md §7](./quickstart.md#7-preview-deployment-checks-for-don-sc-006-major-change);
auto-merge is left off.

## Test layers the tasks phase must schedule first (Principle I)

Each is written, reviewed against the spec and seen failing before the implementation it covers.

1. **Unit / schema** (`tests/unit/content/`): `pageSchema` accepts valid settings and rejects
   each FR-007 settings mistake (with a stand-in `image` validator); `addressFromPath` (including
   rejecting names outside `[a-z0-9-]`); `assertUniqueAddresses` (page/page, page/route, nested
   index, reserved `futureDestinations`); `validatePageBody` (empty body, unknown section, empty
   alt, level-1 heading, code fences ignored); `mergeNavigation` (launch order equals the
   foundation's seven links; duplicate position names both sources; label defaults to title);
   section prop schemas; launch-content test (seven files, all `draft: true`, home has `intro`
   and no `<CallToAction>` in its body; privacy policy mentions cookies, Canada/Toronto,
   retention, statistics and spam protection, marks the field list, retention period,
   spam-protection service and request route "to be confirmed", states no concrete retention
   duration, and shows a "Last updated" date (spec FR-022, FR-022a); terms/technology contain no
   "Ghost", "member", "subscribe", "comment", "Drift", "Convergence", "News" category
   references); `futureDestinations` is exactly `/writing/`, `/projects/`, `/contact/`;
   `docs/design-source.md` documents the content structure (FR-031) and `docs/pages.md` has an
   example per section (FR-012); `package.json`/`astro.config.mjs`/`playwright.config.ts` config
   assertions.
2. **Component** (`tests/component/`, Container API): `PageLayout` (one `<h1>`, feature image
   present/absent with no empty wrapper, draft notice on/off, prose-accent wrapper classes);
   `HomeIntro` (gradient wrapper, `<h1>` name, photo alt, tagline, bio, GitHub/LinkedIn with the
   footer's accessible names, CTA href `/services/`, no Subscribe); `DraftNotice`; each section
   (structure, list semantics, `figure`/`figcaption`, width classes, focusable CTA, offering
   titles `<h3>` under a list title and `<h2>` without one, and a thrown
   error naming the section and missing prop); `SiteHeader`/`BaseLayout` with a passed
   `navigation`.
3. **Build-level** (`tests/build/`): one broken fixture per row of
   [contracts/build-errors.md](./contracts/build-errors.md) fails the build with the stated
   message (SC-003); one-file page publishes with metadata and sitemap entry (SC-002).
4. **E2E** (`tests/e2e/pages.spec.ts`, plus updates): every launch page returns 200 with its
   title as `<h1>`; old addresses resolve; current-page marker; `/cookie-policy/` and the three
   future destinations are 404; per-page `<title>`, description, canonical, default `og:image`
   (custom sharing image, feature image and draft vs non-draft robots meta are asserted on
   fixtures, since every launch page is a draft with the default image); landmarks unchanged;
   no-JS readability;
   no horizontal scroll at 320/390/1280. `tests/e2e/templates.ts`, `not-found.spec.ts`,
   `seo.spec.ts` and `no-js.spec.ts` extended to the launch pages.
5. **Accessibility** (`tests/e2e/a11y.spec.ts`): TEMPLATES gains all seven launch pages; axe in
   both themes, phone and desktop, JS on and off (FR-028, SC-004). Sections fixture in the new
   `sections` project.
6. **Performance budget** (`tests/e2e/budget.spec.ts`): all seven launch pages (FR-030, SC-007).
7. **Visual baselines** (`tests/e2e/visual.spec.ts`): home and about at 390 and 1280 px in dark
   and light (8 new images per platform, FR-029), plus the sections fixture page (phone/desktop,
   both themes) loaded from the fixture server by absolute URL inside the `visual` project, so
   `test:visual:update` refreshes every baseline; existing header/footer/menu/not-found baselines must pass
   unchanged. Both macOS and Linux sets are committed (CLAUDE.md).

## Content structure shared with later features (FR-031)

To be written into `docs/design-source.md` (new "Content structure" section) and followed by the
blog, portfolio and contact features:

| Path | Holds | Later features add |
|---|---|---|
| `src/content.config.ts` | Every collection definition (`pages` now) | `posts`, `projects` collections |
| `src/content/schemas/shared.ts` | Reusable Zod pieces: `imageWithAlt(image)`, `seoFields`, `navField` | — (reuse) |
| `src/content/schemas/page.ts` | `pageSchema({ image })` | `post.ts`, `project.ts` beside it |
| `src/content/pages/` (+ `images/`) | Page files and their images | `src/content/posts/`, `src/content/projects/` |
| `src/components/sections/` + `index.ts` registry + `schemas.ts` | Sections usable in any MDX body | New sections register here |
| `src/components/page/` | `HomeIntro`, `FeatureImage`, `DraftNotice` | Post/project furniture in `src/components/post/` etc. |
| `src/layouts/PageLayout.astro` | Standard page layout inside `BaseLayout` | `PostLayout`, `ProjectLayout` |
| `src/lib/content/` | `address.ts`, `body.ts`, `navigation.ts`, `errors.ts` | Reused for posts/projects (address checks cover every route) |
| `src/pages/[...slug].astro` | Route for pages | `src/pages/writing/…`, `src/pages/projects/…`; the address check reserves their prefixes |
| `docs/pages.md` | Don's guide: settings and one example per section (FR-012) | Posts/projects guides |

## Mapping updates for `docs/design-source.md`

| Flux part | Becomes (this feature) |
|---|---|
| `page.hbs` + `content-section.hbs` | `src/layouts/PageLayout.astro` (title, optional feature image, prose-accent section); share bar left to the Blog feature |
| `layout-author-hero.hbs` | `src/components/page/HomeIntro.astro`; Subscribe → CTA to `/services/`; name `<h2>` → `<h1>`; Website/X/Bluesky and author links dropped |
| `content-feature-image.hbs` | `src/components/page/FeatureImage.astro` (`<Image />`, `srcset` from `astro:assets`) |
| `kg-width-wide` / `kg-width-full` (`screen.css`) | Same class names in `src/styles/global.css`, clamped wide margin and `cqw`-based full width (R9); used by `WideImage` / `FullImage` |

## Project Structure

### Documentation (this feature)

```text
specs/003-standalone-pages/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and doc citations
├── data-model.md        # Phase 1: page, intro, section, navigation, error
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   ├── page-file.md     # Frontmatter format and addresses
│   ├── sections.md      # Section usage and rendered structure
│   ├── build-errors.md  # Every build-failing mistake and its message
│   └── page-dom.md      # Page layout and home card markup
├── checklists/          # From specify/clarify
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
astro.config.mjs                    # + mdx() integration
src/
├── content.config.ts               # NEW: pages collection
├── content/
│   ├── schemas/{shared,page}.ts    # NEW
│   └── pages/                      # NEW: index, services, speaking, about,
│       │                           #      privacy-policy, terms-of-use, technology (.mdx)
│       └── images/don-coleman.jpg  # NEW (copied from the current site)
├── components/
│   ├── sections/                   # NEW: Lead, TextBlock, Offerings, Offering, CallToAction,
│   │                               #      Figure, WideImage, FullImage, index.ts, schemas.ts
│   ├── page/                       # NEW: HomeIntro, FeatureImage, DraftNotice
│   └── SiteHeader.astro            # takes items from BaseLayout
├── config/navigation.ts            # fixed entries get positions; futureDestinations shrinks
├── layouts/{BaseLayout,PageLayout}.astro   # PageLayout NEW; BaseLayout gains navigation prop
├── lib/content/{address,body,navigation,errors}.ts   # NEW
├── env.d.ts                        # NEW: App.Locals.pageFile
├── pages/[...slug].astro           # NEW; src/pages/index.astro REMOVED; 404 passes navigation
└── styles/global.css               # + kg-width-wide / kg-width-full, body container
docs/design-source.md               # + content structure, mapping rows, a11y adjustments
docs/pages.md                       # NEW: guide for Don (FR-012)
tests/
├── unit/content/                   # NEW
├── component/                      # + page and section tests
├── build/                          # NEW: fixture-site.ts, page-validation, one-file-page
├── fixtures/pages/                 # NEW: sections.mdx, workshops.mdx, broken/*, images/
└── e2e/                            # pages.spec.ts NEW; a11y/budget/visual/seo/no-js/templates extended
package.json                        # + @astrojs/mdx, build:fixtures (verify unchanged)
playwright.config.ts                # + second webServer (4322, builds fixtures then previews), `sections` project, e2e testIgnore
vitest.config.ts                    # include tests/build; longer timeout for that folder
eslint.config.js / .gitignore       # ignore .cache/ (already gitignored)
```

**Structure Decision**: Single Astro project, extending the foundation's layout. New content
code is grouped by role (`content/`, `components/sections/`, `components/page/`, `lib/content/`)
so later features add siblings rather than new conventions.

## Build order (for the tasks phase)

Tests first inside every step.

1. **Setup**: add `@astrojs/mdx` (`pnpm astro add mdx`); config tests first; `.cache/` in ESLint
   ignores; `build:fixtures` script; Playwright `sections` project and second web server.
2. **Foundational content layer**: schema, address, body, navigation, error modules and
   `content.config.ts` (unit tests first); fixture-site harness and build-failure tests (fail
   until the checks exist).
3. **US1 + US3 — page layout and route**: `PageLayout`, `DraftNotice`, `FeatureImage`,
   `[...slug].astro`, `BaseLayout`/`SiteHeader` navigation prop, remove `index.astro`; seven
   launch page files with draft copy; `futureDestinations` shrink; E2E/a11y/budget/SEO updates.
4. **US2 — home**: `HomeIntro` port, Don's photo, home copy; visual baselines for home and about.
5. **US4 — sections**: components, CSS port, sections fixture, `sections` project tests;
   Services/Speaking use sections.
6. **US5 — build errors**: remaining checks until every build-failure test passes.
7. **US6 — legal and technology copy**: fetch and adapt the current pages; content tests.
8. **Docs**: `docs/pages.md`, `docs/design-source.md` (structure, mapping, contrast swaps).
9. **Polish**: baselines (macOS + Linux), `pnpm run verify`, PR as a major change.

## Risks and open questions

- **Astro programmatic API is experimental** (R14): only tests use it; a breaking Astro upgrade
  shows as a failing test.
- **Images inside section children** (R8): expected to be optimised by Astro's MDX image handling;
  the first section component test proves it, with an `import.meta.glob` `src` prop as the
  fallback.
- **`astro:content` inside Vitest** (R10): component tests pass `navigation` explicitly so they do
  not depend on the content layer.
- **Full-width images and scrollbars**: headless Chromium hides scrollbars, so the `cqw` fix is
  covered by reasoning and a computed-width assertion rather than a visible scrollbar.
- **Contrast of ported hero classes** (R13): some Flux shades will likely fail AA and be swapped;
  each swap is recorded for Don's review.
- **Indexing**: drafts are not hidden, but the foundation's site-wide pre-launch `noindex` still
  applies to every page until the domain switch (R11). Spec FR-006 now states this explicitly;
  flag it if Don expected pages to be indexable before the switch.
- **Carried-over copy**: fetched from the live site at implement time; if the site is unreachable,
  the copy falls back to short draft placeholders and the task notes it.

## Complexity Tracking

No constitution violations. Nothing to justify.
