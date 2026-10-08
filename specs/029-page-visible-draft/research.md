# Research: Page visibility and draft flags, file-driven navigation (029)

The Astro Docs MCP (`astro-docs`) was available and was consulted for every Astro decision below.
The page each decision rests on is named in its row.

## R1. Where `visible` and `draft` are validated

- **Decision**: Add `visible: z.boolean().default(true)` beside the existing
  `draft: z.boolean().default(false)` in `src/content/schemas/page.ts`. The strict object already
  rejects a non-boolean value and names the key.
- **Rationale**: Content collection schemas are Astro's first-party validation for front matter
  and fail the build with the file and key named (Principle VI). Defaults keep every existing file
  valid with no edit (FR-001).
- **Docs**: docs.astro.build/en/guides/content-collections/#defining-the-collection-schema;
  docs.astro.build/en/reference/modules/astro-zod/.
- **Alternatives**: a `status: published | draft | hidden` enum (rejected: the spec asks for two
  independent flags, and `visible: false` with `draft: true` must be allowed, US2 scenario 4).

## R2. How a not-visible page is left out of the production build

- **Decision**: Filter the `pages` collection in the one reader, `src/lib/pages.ts`, with
  `getCollection("pages", filter)` where the filter keeps an entry when it is visible or the build
  includes drafts. "Includes drafts" is `includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH })` from
  `src/lib/build-mode.ts`, reading the two values from `astro:env/server` as
  `src/lib/posts.ts` already does. The pages route (`src/pages/[...slug].astro`) and the
  navigation both read through this function, so a not-visible page has no route and no menu link
  on production.
- **Rationale**: The Astro guide shows exactly this pattern (a `getCollection()` filter that drops
  drafts only in production). The site's production signal is already defined once in
  `build-mode.ts` and used by posts and projects; pages reuse it rather than `import.meta.env.PROD`,
  which is also true on preview builds (FR-002 needs previews to keep the page).
- **Docs**: docs.astro.build/en/guides/content-collections/#filtering-collection-queries;
  docs.astro.build/en/reference/modules/astro-content/#getcollection.
- **Alternatives**: excluding the files in the glob loader pattern at config time (rejected: the
  schema would no longer validate a not-visible page on production, so a broken hidden page could
  merge unnoticed, and the loader has no clean access to the build mode).

## R3. Draft notice and noindex for a not-visible page on previews

- **Decision**: The pages route passes `draft={data.draft || !data.visible}` to `PageLayout`, which
  already renders the notice and the noindex robots tag for a draft. No layout change.
- **Rationale**: FR-002 asks for the same treatment as a draft on previews; one derived flag reuses
  the existing component and its tests.

## R4. Keeping not-visible and draft pages out of the sitemap

- **Decision**: Keep the `@astrojs/sitemap` `filter` in `astro.config.mjs` and widen the address
  set it checks: `draftPageAddresses()` in `src/lib/content/draft-pages.ts` becomes
  `unlistedPageAddresses()`, returning the address of every page file with `draft: true` **or**
  `visible: false`. On production a not-visible page is not built, so it never reaches the filter;
  on previews it is built and the filter drops it.
- **Rationale**: The official sitemap integration's `filter(page)` is the documented way to leave
  pages out; it sees only the URL, which is why the addresses are read from the files at config
  time (the approach issue #119 already took). `serialize()` returning `undefined` would also work
  but `filter` is the simpler documented option and already in place.
- **Docs**: docs.astro.build/en/guides/integrations-guide/sitemap/#filter.
- **Alternatives**: a custom sitemap endpoint (rejected, Principle IV).

## R5. Images of a not-visible page on production

- **Decision**: No new code. `pruneDraftAssets` (`src/lib/prune-unreferenced-assets.ts`, an
  `astro:build:done` integration hook) already deletes every `_astro` asset no built file refers to
  on the production build. A not-visible page is not built, so its own images are unreferenced and
  pruned. An image shared with a built page stays, because pruning is by reference.
- **Docs**: docs.astro.build/en/reference/integrations-reference/#astrobuilddone.
- **Test**: one build-layer assertion with a fixture page that uses its own image (the same
  technique the draft project test uses).

## R6. Shape of the navigation settings

- **Decision**: `nav` stays an optional strict object and gains a required `location`:
  `nav: { location: "header" | "footer", position: int >= 1, label?: text }`. No `nav` means no
  menu (FR-006). Because both `location` and `position` are required inside `nav`, "a location
  without a position" and "a position without a location" are both schema errors that name the
  file and the missing key (FR-007), with no custom code.
- **Rationale**: The spec keys the setting as "navigation settings ... location, position, label";
  keeping them in the one `nav` object means a page's menu membership is one block, and a Zod
  strict object gives the plain error for free (Principle IV, VI).
- **Alternatives**: a top-level `location` key beside `nav` (rejected: needs a cross-field
  refinement to tie the two together, and splits one setting over two keys).

## R7. Building the header and footer from files

- **Decision**: Replace `mergeNavigation()` in `src/lib/content/navigation.ts` with a pure
  `buildMenus(pages)` that returns `{ header, footer }`: each menu holds the pages whose
  `nav.location` names it, sorted by position, label defaulting to title. Two pages in one menu
  with one position throw `contentError("page", [a, b], ...)` naming both files (FR-009); the same
  position in different menus is allowed. `getNavigation()` in `src/lib/pages.ts` feeds it the
  visible-in-this-build pages plus the two landing page files (R8), and throws a plain error when
  a landing file is missing (FR-010).
- `fixedPrimaryNavigation` and `footerNavigation` are deleted from `src/config/navigation.ts`;
  `socialNavigation` stays (spec assumption). `NavigationItem.kind` keeps `"primary" | "footer" |
  "social"`.
- `BaseLayout`'s `navigation` prop changes from `NavigationItem[]` to
  `{ header: NavigationItem[]; footer: NavigationItem[] }`; it hands `header` to `SiteHeader`
  (unchanged prop) and `footer` to `SiteFooter` (new `navigation` prop, replacing its import of
  `footerNavigation`). Every route already calls `getNavigation()` and passes the result through,
  so only the type changes at the eight call sites.
- **Rationale**: One reader, one pure function, unit-testable without a build (Development
  Workflow: cheapest layer).

## R8. Landing page files for Writing and Projects

- **Decision**: Two files, `src/content/pages/writing.mdx` and `src/content/pages/projects.mdx`,
  each holding only `title` and `nav` front matter and no body. They live in the pages folder with
  every other page file, so Don edits menus in one place. In code they are loaded by a second
  collection, `landing`, defined in `src/content.config.ts` with a glob over the same
  `./src/content/pages` base and the pattern `{writing,projects}.{md,mdx}`, and a strict schema
  `z.strictObject({ title, nav: navField })` (no `visible`, `draft`, `description` or anything
  else). The `pages` collection's glob excludes those two names, and the pages route's
  `import.meta.glob` list leaves them out before the address check, so they never get a
  `[...slug]` route and never clash with `src/pages/writing/index.astro` or
  `src/pages/projects/index.astro` (contract row 14). The `landing` loader's `generateId` checks
  the file body is empty (FR-008), using the same raw-file read as `assertPostDates`.
- The landing ids and their addresses are one constant, `landingPages` in
  `src/config/navigation.ts` (`writing → /writing/`, `projects → /projects/`). It names the code
  routes, which exist in code anyway; it holds no labels, positions or menu choices, so FR-005 is
  met. The landing routes' `<h1>` and description stay in code (FR-008).
- **Why a second collection over one folder**: one collection has one schema, and a Zod schema
  cannot see the entry id. Keeping the landing files in `pages` would need either a
  `z.union([pageSchema, landingSchema])` (Zod reports a failed union as an opaque "Invalid input",
  which breaks Principle VI's clear-error rule) or making `description` optional for every page and
  re-checking it in code (custom code where the schema already does the job). Two collections over
  one folder are both first-party glob loaders with strict schemas, so every mistake gets Astro's
  own named-key error. The spec's "page file in the pages collection" is read as "a page file in
  `src/content/pages/`, beside the others"; this is noted as a risk for Don to confirm at review.
- **Docs**: docs.astro.build/en/guides/content-collections/#build-time-collection-loaders (glob
  `pattern` and `base`); docs.astro.build/en/reference/content-loader-reference/#glob-loader
  (`generateId`).
- **Alternatives**: a `src/content/navigation/` folder (rejected: Don chose page files in the
  pages folder); keeping Writing and Projects in a code list (rejected: FR-005).

## R9. Home page marked not visible

- **Decision**: The `pages` loader's `generateId` (which already runs `assertNoTwin` and
  `assertImagesExist` for every file, on every build and every `astro sync`) also runs
  `assertHomeVisible(entry, data)`: when the id is `index` and the raw `data.visible === false`,
  it throws `contentError("page", file, "the home page cannot be hidden ...")`. This fails
  previews, local dev and production alike (clarification 2026-10-07).
- **Rationale**: Same hook and error format as the other per-file checks; no build-mode branch.

## R10. Test helpers and fixtures

- `tests/helpers/content.ts`: `pages` excludes the two landing files (they are not standalone
  pages and their addresses are already listed by `sitemapPaths`); a new `landingPages` export
  reads them. `Entry` gains `visible` (front matter `visible !== false`). `inBuild()` drops
  not-visible pages on production; `sitemapPaths()` lists a page only when it is visible and not a
  draft. Tests that derive from these helpers then follow the content with no edit (issue #55).
- The Playwright fixture site (`scripts/build-fixture-site.ts`, `.cache/fixture-site`) copies the
  repository's real pages, so it gains the landing files and the moved menu settings with no
  script change. Its fixture pages (`sections.mdx`, `contact-form.mdx`) have no `nav`, so the
  header and footer on the fixture site stay as they are.
- `tests/build/fixture-site.ts` gains a `remove?: string[]` option (paths deleted from the copied
  site after copying) so a build test can prove the missing-landing-file error.

## R11. First-party options considered (Principle IV summary)

| Capability | First-party option | Used? |
|---|---|---|
| Validate `visible`, `draft`, `nav.location` | Astro content collection schema (`astro/zod`, strict object, defaults) | Yes |
| Leave not-visible pages out of production | `getCollection()` filter (Astro guide pattern) with the site's existing build-mode signal | Yes |
| Sitemap exclusion | `@astrojs/sitemap` `filter` | Yes |
| Prune hidden pages' images | Astro integration `astro:build:done` hook (existing) | Yes, unchanged |
| Landing page files | Astro glob loader over the same folder, strict schema | Yes (second collection, R8) |
| Home-visible and empty-body checks | glob loader `generateId` hook | Yes; the schema cannot see the id or the body, so a small check function is the only option |
| Menu ordering and clash errors | none in Astro; Starlight's sidebar config is not available in a plain Astro site | Custom pure function (already custom today) |
| Production signal | Cloudflare Workers Builds `WORKERS_CI` / `WORKERS_CI_BRANCH` through `astro:env` (existing) | Yes |

No Cloudflare runtime feature or Fly.io service is involved: the change is build-time only.
