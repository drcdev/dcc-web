# Tasks: Page visibility and draft flags, file-driven navigation

**Input**: Design documents from `specs/029-page-visible-draft/` (plan.md, spec.md, research.md,
data-model.md, contracts/page-settings.md, quickstart.md, checklists/)

**Tests are mandatory** (Constitution Principle I; the template's "optional" does not apply). Each
test task names its one primary layer (`docs/testing.md`, "Where a test goes"), carries the
contract row id (V1 to V12) in the test title, and gives the reason for any second layer. Test
tasks come before the implementation they cover and must be seen to fail first. Use neutral
example data in unit tests and never name real content (`tests/helpers/content.ts`).

**Format**: `- [ ] T### [P?] [Story] Description with file path`. `[P]` = different files, no
dependency on an incomplete task.

**Major change** (Principle III, navigation): flag it in the PR body. **Baselines**: header and
footer output is unchanged (FR-011), so no task changes the shell, a template or the design
system, and no visual baseline task is included. If T044 shows a visual diff, stop and treat it
as a defect, not a baseline update.

## Phase 1: Setup

- [X] T001 Confirm the toolchain and a clean start: `node -v` matches `.nvmrc`, `git status` is clean on `029-page-visible-draft`, `.reference` links exist in the worktree (copy `.reference/flux`), and `pnpm run test:unit` passes before any edit (record the baseline in the commit message, no file change).
- [X] T002 [P] Record the pre-change production header, footer and sitemap address list as the SC-005 reference by reading `src/config/navigation.ts` and `astro.config.mjs` into a scratch note (not committed); the expectations are the six header links and three footer links in User Story 3 scenario 7.

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: the schema, the new landing collection and the content files that every story reads.
After this phase the old code lists still work (nothing reads `location` yet), so the build stays green.

### Tests first (all fail before T009 to T013)

- [X] T003 [P] Unit tests (layer: unit; schema parse needs no build) in `tests/unit/content/page-schema.test.ts`: `visible` and `draft` default true/false and reject quoted, numeric, `null` and empty values (V1); `nav.location` accepts only `header` or `footer` (V2); `nav` with a position but no location (V3), with a location but no position (V4), and an empty `nav` fail; empty/whitespace `label` and non-integer or non-positive `position` fail; landing schema is strict (extra key, `visible`, `draft`, `description` fail, V7), requires `nav` (V10) and rejects `location: footer` (V12).
- [X] T004 [P] Unit tests (layer: unit; `generateId` helpers are pure functions) in `tests/unit/content/page-flags.test.ts` (new): `assertHomeVisible` refuses `visible: false` for id `index` on any build and allows `draft: true` (V5); `assertLandingBody` refuses a non-empty body and allows whitespace (V8); errors name the file path in today's "Page file <path>: ..." form (FR-010).
- [X] T005 [P] Unit tests (layer: unit) in `tests/unit/content/page-flags.test.ts`: `unlistedPageAddresses()` includes draft and not-visible page addresses and skips the landing files (FR-012, FR-008). Second layer (build, T018) is justified there by the real sitemap output.
- [X] T006 [P] Unit tests (layer: unit) in `tests/unit/content/launch-content.test.ts`: extend the table with `location` and `position` for the three pages already in the header (home header 1, work-with-me header 2, about header 6); assert `writing` and `projects` landing files exist, parse with the landing schema, and sit in the header at positions 4 and 5; assert the Tempo privacy page has no `nav` (US4). Contact and the three footer pages are added to the table in T049 (Phase 5), because giving them `nav` before the menu builder reads `location` would clash with Home 1, Work with me 2 and the fixed Contact 7 and break the build.
- [X] T007 Update test helpers (layer: n/a, shared helper) in `tests/helpers/content.ts`: `Entry.visible`; `pages` excludes landing files; new `landingPages` export; `inBuild()` drops not-visible pages on production; `sitemapPaths()` lists only visible, non-draft pages. Update `tests/unit/content/content-helper.test.ts` (unit) for the new `inBuild(pages)` and sitemap rule, and confirm `tests/unit/content/no-real-content-in-tests.test.ts` still sees the real pages.
- [X] T008 Run the new and changed unit tests and confirm T003 to T007 fail for the right reasons (missing schema fields, missing module).

### Implementation

- [X] T009 Schema: in `src/content/schemas/shared.ts` make `navField` `{ location: enum(header, footer), position, label? }` (strict); in `src/content/schemas/page.ts` add `visible: z.boolean().default(true)` and `landingSchema` (strict `{ title, nav }` with `location: z.literal("header")`).
- [X] T010 Checks: create `src/lib/content/page-flags.ts` with `assertHomeVisible` and `assertLandingBody` using `contentError` (V5, V8).
- [X] T011 Collections: in `src/content.config.ts` add the negations `!writing.{md,mdx}` and `!projects.{md,mdx}` to the `pages` glob, call `assertHomeVisible` in its `generateId`, and add the `landing` collection (glob `{writing,projects}.{md,mdx}` over `./src/content/pages`, `generateId` runs `assertNoTwin` and `assertLandingBody`). In the same task, drop the landing files from the `import.meta.glob` page list in `src/pages/[...slug].astro` before `assertPageAddressesFree`, or the new `writing.mdx` would be refused as taken by `src/pages/writing/index.astro` and break the build. Cite the Astro content collections guide per research.md.
- [X] T012 [P] Content: add `nav.location: header` to the three pages that already have `nav` in `src/content/pages/` (index header 1 keeping label Home, work-with-me header 2, about header 6); do not touch contact or the footer pages yet (T050); create `src/content/pages/writing.mdx` (header 4, no body) and `src/content/pages/projects.mdx` (header 5, no body) with titles that match today's link text; do not change any draft flag.
- [X] T013 [P] Draft addresses: change `src/lib/content/draft-pages.ts` to export `unlistedPageAddresses()` (draft or not visible; skip landing files) and update its import in `astro.config.mjs`.
- [X] T014 Run `pnpm run test:unit`, `pnpm run typecheck` and `pnpm run build`: T003 to T007 pass and the site still builds with today's header and footer.

**Checkpoint**: schema, landing collection and content in place; menus still come from the old lists.

---

## Phase 3: User Story 1 - Keep a page off the live site (Priority: P1)

**Goal**: `visible: false` removes a page from the production build entirely and keeps it reviewable on previews.

**Independent Test**: production build with one not-visible page has no HTML, link, sitemap entry or orphan image for it; a preview build has the page with the notice and noindex.

### Tests first

- [X] T015 [P] [US1] Build test (layer: build, because only `astro build` output shows missing routes, sitemap entries and pruned images) in `tests/build/drafts.test.ts`: with the new fixture `tests/fixtures/pages/hidden-page.mdx` (`visible: false`, `nav: footer 9`, its own image under `tests/fixtures/pages/images/`), a production-mode build has no HTML file for its address, no built page links to it, the sitemap omits it and its image file is absent; an image also used by a built page stays (FR-002, SC-003).
- [X] T016 [P] [US1] Build test (layer: build, same file, preview-mode build of the same fixture) in `tests/build/drafts.test.ts`: the page is built with the same draft notice as a draft page and `<meta name="robots" content="noindex">`, and is absent from the sitemap (FR-002, US1 scenario 4). Its footer link on preview is asserted in T033, once menus come from the page files.
- [X] T017 [P] [US1] Build test (layer: build, a schema error is only observable through a real sync) in `tests/build/page-validation.test.ts` with broken fixtures under `tests/fixtures/pages/broken/`: non-boolean `visible` names file and setting (V1); not-visible home page fails on production and preview (V5). Second layer after the unit tests T003/T004 for wiring only: a schema or `generateId` helper that is never called passes its unit test.
- [X] T018 [P] [US1] Build test (layer: build) in `tests/build/indexing.test.ts` (where `isDraftPage` lives): `isDraftPage` treats a not-visible page as noindex, and the sitemap address list equals the helper's `sitemapPaths()` (FR-012).
- [X] T019 [US1] Confirm T015 to T018 fail (page still served on production).

### Implementation

- [X] T020 [US1] Reader: in `src/lib/pages.ts` make `getPages()` return `getCollection("pages", e => e.data.visible || includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH }))` using the existing `build-mode.ts` signal (FR-014; its fail-safe is already covered by `tests/unit/site/build-mode.test.ts` and `tests/unit/content/build-mode.test.ts`, which stay unchanged). Make the existing `getNavigation()` read its pages through `getPages()` so a not-visible page gets no menu link on production (T015).
- [X] T021 [US1] Route: in `src/pages/[...slug].astro` build paths from `getPages()` and pass `draft={data.draft || !data.visible}`.
- [X] T022 [US1] Pruning: confirm the existing `astro:build:done` asset-pruning hook removes a not-visible page's own images on production; extend it only if T015 shows an orphan (name the file in the commit).
- [X] T023 [US1] Run T015 to T018 and the unit suite until green.

**Checkpoint**: a page can be taken off the live site with one setting (SC-001).

---

## Phase 4: User Story 2 - Publish a visible page as a draft (Priority: P1)

**Goal**: today's draft behaviour is unchanged under the two-flag model, and visibility wins over draft.

**Independent Test**: build with a visible draft page and a visible non-draft page and compare notice, noindex, sitemap and menu.

### Tests first

- [X] T024 [P] [US2] Build test (layer: build) in `tests/build/drafts.test.ts` using `draft-page.mdx`: the visible draft page has the notice, noindex, no sitemap entry and keeps its menu link on production and preview; a visible non-draft page has no notice and, on production, no noindex and a sitemap entry (FR-003, FR-004, SC-004).
- [X] T025 [P] [US2] Build test (layer: build) in `tests/build/drafts.test.ts` using a `visible: false, draft: true` fixture: production leaves it out; preview treats it exactly as a not-visible, non-draft page (US2 scenario 4, FR-001).
- [X] T026 [US2] Run T024 and T025; T024 should already pass (guard), T025 is expected to pass after Phase 3. If either fails, fix the cause in `src/pages/[...slug].astro`.

### Implementation

- [X] T027 [US2] No new code expected: confirm the notice, noindex and sitemap filter paths use `draft || !visible` (T013, T021) and record the result in the commit message. Fix any gap found in the file the failing test points at.

**Checkpoint**: draft and visibility behave independently (visibility wins).

---

## Phase 5: User Story 3 - Menus come only from the page files (Priority: P2)

**Goal**: header and footer are built only from page files; the code lists are deleted; output is identical today.

**Independent Test**: add a page with a location and position and see it in that menu with no other edit; production output matches User Story 3 scenario 7.

### Tests first

- [X] T028 [P] [US3] Unit tests (layer: unit; the builder is a pure function) in `tests/unit/content/navigation.test.ts` (rewritten, fixed-entry cases deleted) for `buildMenus`: split by location; order by position; label defaults to title; per-menu position clash names both files in path order with the menu and position, and a three-way clash reports the first pair (V6); the same position in header and footer is allowed; duplicate link text in one menu, ignoring case and spaces, fails (V11); a menu with no entries is an empty array.
- [X] T029 [P] [US3] Component test (layer: component; Astro Container API renders the footer without a build) in `tests/component/SiteFooter.test.ts`: footer renders the `navigation` links it is given in order, then the social links; with an empty list it renders no `<ul>` for page links and keeps the site name, copyright, theme switch and social links (FR-006a, SC-006).
- [X] T030 [P] [US3] Component tests (layer: component; prop-shape change only) in `tests/component/BaseLayout.test.ts`, `NotFound.test.ts`, `PageLayout*.test.ts` and `tests/component/post/*`: pass a `navigation: { header, footer }` and assert `BaseLayout` hands the header list to `SiteHeader` and the footer list to `SiteFooter`.
- [X] T031 [P] [US3] Unit tests (layer: unit) in `tests/unit/site/navigation.test.ts`: delete the `fixedPrimaryNavigation` and `footerNavigation` blocks; keep `socialNavigation`, `isCurrent` and `isInSection`; assert `landingPages` names only `/writing/` and `/projects/`, and that the module no longer exports `fixedPrimaryNavigation`, `footerNavigation` or `navigationSource` (FR-005).
- [X] T032 [P] [US3] Build test (layer: build, sync wiring) in `tests/build/page-validation.test.ts` with broken fixtures: duplicate header position names both files (V6); duplicate link text (V11); landing file with a body (V8), with `visible`/`draft`/`description` (V7), without `nav` (V10), with `location: footer` (V12), and a removed landing file (V9, using the new `remove` option in `tests/build/fixture-site.ts`). Second layer after T003/T004/T028 because only a real sync proves the checks are wired into the loader and `getNavigation()`.
- [X] T033 [P] [US3] Build test (layer: build, the only layer that sees every built page at once) in a new `tests/build/navigation.test.ts`: on production the header links and footer links of every built page, the not-found page included, equal the menus computed from the page files by the helper in `tests/helpers/content.ts` (US3 scenario 7, FR-011); on preview the not-visible fixture from T015 is linked in the footer (US1 scenario 4). Its absence from production menus is T015's (US3 scenario 3), and the empty footer is T029's component test (SC-006); neither is repeated here. In the same task, rewrite the contract-row-15 wiring test in `tests/build/local-site.test.ts` (it names the fixed Projects and Contact entries) to cite V6 and file-driven entries, or delete it as covered by this task.
- [X] T049 [P] [US3] Unit tests (layer: unit) in `tests/unit/content/launch-content.test.ts`: extend the table with contact header 7 and privacy-policy footer 1, terms-of-use footer 2, technology footer 3 (completes T006; US3 scenario 7).
- [X] T034 [US3] Confirm T028 to T033 and T049 fail (old lists still in use).

### Implementation

- [X] T035 [US3] Menus: in `src/lib/content/navigation.ts` replace `mergeNavigation` with `buildMenus(entries)` returning `{ header, footer }` (V6, V11, no fixed entries).
- [X] T036 [US3] Config: in `src/config/navigation.ts` delete `fixedPrimaryNavigation`, `footerNavigation` and `navigationSource`; add `landingPages` and the `SiteNavigation` type; keep `socialNavigation` and `NavigationItem`.
- [X] T037 [US3] Reader: in `src/lib/pages.ts` make `getNavigation()` return `buildMenus([...pages, ...landing])`, reading the `landing` collection, and throw a `contentError` in today's form, "Page file <path>: missing. Add the landing file with a title and nav.", when a `landingPages` id has no entry (V9, FR-010).
- [X] T050 [US3] Content: give `src/content/pages/contact.mdx` a new `nav` (header 7) and the footer pages `nav` (privacy-policy footer 1, terms-of-use footer 2, technology footer 3), with no label where today's link text equals the title; do not change any draft flag. Must land with or after T035 to T037.
- [X] T038 [US3] Layouts and components: `src/layouts/BaseLayout.astro` takes `navigation: SiteNavigation` and passes `header` to `SiteHeader` and `footer` to `SiteFooter`; `src/components/SiteFooter.astro` takes the `navigation` prop and renders no page-link `<ul>` when empty; update the prop type only in `PageLayout`, `PostLayout`, `ProjectLayout`, `src/components/post/SeriesPage.astro`, `src/pages/404.astro`, `src/pages/writing/**` and `src/pages/projects/**`. Header and footer markup, `aria-current` and the draft notice stay as they are.
- [X] T039 [US3] Run T028 to T033 and T049, `pnpm run typecheck` and the unchanged `tests/e2e/shell.spec.ts`, `tests/e2e/menu.spec.ts` and `tests/component/SiteHeader.test.ts` (SC-005 guard, layer e2e, run once here only to catch a regression early).

**Checkpoint**: menus come only from page files; code lists are gone.

---

## Phase 6: User Story 4 - Pages that belong in no menu (Priority: P3)

**Goal**: a visible page with no `nav` is served and listed but in no menu.

**Independent Test**: the Tempo privacy page is served and is in neither menu.

### Tests first

- [X] T040 [US4] Build test (layer: build) in `tests/build/navigation.test.ts`: every real visible page without `nav` (the Tempo privacy page today, found through `tests/helpers/content.ts`, never named) has an HTML file, is in the sitemap unless draft, and appears in neither menu (US4 scenario 1).

### Implementation

- [X] T041 [US4] No new code expected; run T040 and fix any gap in `src/lib/content/navigation.ts` if it fails.

---

## Phase 7: Polish and cross-cutting

- [ ] T042 [P] Docs: update `docs/pages.md` (settings table with `visible`, `location`, the menu section, landing files, "taken addresses") and `docs/testing.md` (contract-row mapping for V1 to V12 to their tests). Plain language, no hype.
- [ ] T043 [P] Check the accessibility checklist `specs/029-page-visible-draft/checklists/accessibility.md` against the result and tick items the tests cover; run `pnpm run test:a11y` for the page templates, the Writing and Projects routes and the not-found page (layer: a11y, templates not stories).
- [ ] T044 Run `pnpm run test:visual` (macOS) and confirm no snapshot changes. No baseline update is planned (FR-011); a diff is a defect to fix, not a baseline to refresh.
- [ ] T045 Run the quickstart scenarios in `specs/029-page-visible-draft/quickstart.md` (not-visible page on production vs preview build, menu move between header and footer) with local builds.
- [ ] T046 Merge `origin/main` into the branch (shared hot spots: `src/config/navigation.ts`, `SiteFooter.astro`, `BaseLayout.astro`, page files), resolve keeping both sides, and re-run the unit suite.
- [ ] T047 [PREVIEW-CHECK] On the branch preview deployment, confirm with Don's eyes that the header and footer look identical to production (six header links, three footer links, same order) and that the Contact page and landing pages still open. A subagent cannot verify the deployed preview. (Today's content has no not-visible page, so the preview behaviour of one is covered by T016 and T033, not by this check.)
- [ ] T048 Final gate: ask Don before starting (parallel gates crash his machine), then run `pnpm run verify` (needs `ASTRO_PREVIEW_BACKGROUND=1`, run in the background under `perl alarm`, read `VERIFY_EXIT=`); fix any failure at its cause and never loosen a check.

---

## Dependencies and order

- Phase 1 then Phase 2 (blocks everything). Within Phase 2: T003 to T007 in parallel, T008, then T009 to T013 (T012 and T013 parallel with each other after T009 to T011), then T014.
- US1 (Phase 3) and US2 (Phase 4) need Phase 2; US2 builds on the route change in T021, so run it after US1. US3 (Phase 5) needs Phase 2 and can run in parallel with US1 only if the branch owner accepts conflicts in `src/lib/pages.ts` (T020 and T037); the safe order is US1, US2, US3, US4.
- Within US3: T049 with the other tests; T050 after T035 to T037 (its `nav` settings clash under the old merge).
- US4 needs US3 (menus). Polish needs all stories; T047 and T048 are last.

## Parallel examples

- Phase 2 tests: T003, T004, T005, T006 together.
- US3 tests: T028, T029, T030, T031, T032, T033, T049 together.
- Polish: T042 and T043 together.

## Implementation strategy

MVP = Phase 1, Phase 2 and US1 (a page can be kept off production). Then US2 as a guard, US3 to
remove the code lists, US4 as a check. Commit after each phase.

## Notes

- Open items for the PR body: major change under Principle III (navigation); second `landing`
  collection over the pages folder (research R8); one `[PREVIEW-CHECK]` item (T047), so
  auto-merge stays off.
- No visual baseline tasks: output is unchanged by design (see the header note).
