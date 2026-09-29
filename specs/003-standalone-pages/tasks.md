# Tasks: Standalone pages for doncoleman.ca

**Input**: Design documents in `/specs/003-standalone-pages/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)
**Prerequisites**: plan.md, spec.md. Constitution: `.specify/memory/constitution.md` (Principle I test-first; this is a **major change** under Principle III, so auto-merge stays off).

**Tests are mandatory** (Constitution Principle I). Within every phase, test tasks come first, and each says the tests must be run and seen to fail before the implementation tasks that follow. A task is never marked done on a red suite.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 to US6 (user stories from spec.md)
- **[PREVIEW-CHECK]** suffix: cannot be verified locally; needs the preview deployment or Don's eyes. The implementer leaves these unchecked and lists them in the PR body.

## Local toolchain (applies to every task that runs pnpm, astro, playwright or wrangler)

- Node comes from nvm. Run `node -v` first; if it is not the `.nvmrc` version (24), run `source ~/.nvm/nvm.sh && nvm use` in the **same** Bash command as the toolchain call.
- macOS has no `timeout`. Bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd...>`.
- Astro decisions: consult the Astro Docs MCP (`astro-docs`) and the pages cited in research.md; if the MCP is unavailable, say so in the task notes and use docs.astro.build.

## Phase 1: Setup

**Purpose**: dependency, scripts and test-project scaffolding. Nothing here changes what visitors see.

- [ ] T001 Write config tests first in `tests/unit/site/config-mdx.test.ts`: `package.json` lists `@astrojs/mdx` (pinned, like the other dependencies), has a `build:fixtures` script, and `verify` runs `build:fixtures` before `test:e2e`; `astro.config.mjs` registers `mdx()`; `playwright.config.ts` has a second `webServer` on port 4322 (astro preview of the fixture site) and a `sections` project; `vitest.config.ts` includes `tests/build/**`. Run them and confirm they fail before T002 to T006.
- [ ] T002 Add the official MDX integration with `pnpm astro add mdx` (Astro docs: MDX integration guide); confirm the pinned version and lockfile are committed, and `astro.config.mjs` registers `mdx()` beside the sitemap integration.
- [ ] T003 [P] Add `.cache/` to the ignores in `eslint.config.js` and confirm `.gitignore` already ignores it (fixture builds write there).
- [ ] T004 Add the `build:fixtures` script to `package.json` (builds the fixture site from T012 into `.cache/fixture-site/dist`) and update `verify` so it runs `pnpm run build:fixtures` before `pnpm run test:e2e`. Create `scripts/build-fixture-site.ts` as the script it calls (copy the repo's site with `tests/fixtures/pages/sections.mdx` as an extra page, then `astro build`).
- [ ] T005 Update `playwright.config.ts`: add the second `webServer` (`astro preview` of `.cache/fixture-site` on port 4322) and a `sections` project whose `testMatch` is `tests/e2e/sections.spec.ts` and whose `baseURL` is `http://localhost:4322`; keep every existing project untouched.
- [ ] T006 Update `vitest.config.ts` to include `tests/build/**` with a longer `testTimeout` for that folder only; create the empty directories with placeholder-free structure as needed (`tests/unit/content/`, `tests/build/`, `tests/fixtures/pages/`, `tests/fixtures/pages/broken/`, `tests/fixtures/pages/images/`).
- [ ] T007 Run `pnpm run lint`, `pnpm run typecheck` and `pnpm run test`; the T001 config tests must now pass and nothing else may have regressed.

**Checkpoint**: MDX is installed and the test scaffolding exists.

## Phase 2: Foundational (content layer and fixture harness)

**Purpose**: the schema, address, body, navigation and error modules every story depends on, plus the fixture-site harness. Blocks all user stories.

### Tests first (write, run, and see fail before T017 to T027)

- [ ] T008 [P] Write `tests/unit/content/page-schema.test.ts`: `pageSchema({ image })` (with a stand-in `image` validator) accepts a minimal page and a full page; rejects missing `title`, missing `description`, empty strings, `nav.position` of `"second"`, `0` and `1.5`, unknown keys at every level (`titel`), `image` or `featureImage` without or with empty `alt`, and `intro` missing any of photo, name, tagline, bio, cta; defaults `draft` to `false`. Run and confirm it fails.
- [ ] T009 [P] Write `tests/unit/content/address.test.ts`: `addressFromPath` maps `index.mdx` to `/`, `about.mdx` to `/about/`, `x/index.mdx` to `/x/`, nested paths to nested addresses; rejects `About_Me.mdx`, spaces and upper case with the message from contracts/build-errors.md row 17; `assertUniqueAddresses` fails for page/page (`about.md` + `about.mdx`), `x.mdx` + `x/index.mdx`, a page against a route file in `src/pages/`, and each reserved `futureDestinations` address. Run and confirm it fails.
- [ ] T010 [P] Write `tests/unit/content/body.test.ts`: `validatePageBody` rejects an empty body ("no content"), an unknown capitalised tag (message names the file, the tag and lists valid sections), an image with empty alt ("alt text"), a level-1 Markdown heading or `<h1>` ("use ##"); ignores tags and `# ` inside code fences and inline code; accepts every registered section. Run and confirm it fails.
- [ ] T011 [P] Write `tests/unit/content/navigation.test.ts`: `mergeNavigation` at launch returns Home, Services, Speaking, Writing, Projects, About, Contact in that order with the foundation's hrefs; label defaults to the page title; page entries with `nav` are merged with the fixed Writing 4, Projects 5, Contact 7; a duplicate position names both sources and the position; pages without `nav` are absent. Also assert `futureDestinations` equals exactly `["/writing/", "/projects/", "/contact/"]` and `PageContentError` messages start with `Page file <path>:` or `Page files <a> and <b>:`. Run and confirm it fails.
- [ ] T012 Create the fixture site content: `tests/fixtures/pages/sections.mdx` (uses every section: Lead, TextBlock, Offerings/Offering, CallToAction, Figure, WideImage, FullImage), `tests/fixtures/pages/workshops.mdx` (the minimal example from contracts/page-file.md), one small image in `tests/fixtures/pages/images/`, and one broken file per row 1 to 17 of contracts/build-errors.md in `tests/fixtures/pages/broken/` (named `NN-short-name.mdx`, plus companion files for the two-file rows).
- [ ] T013 Write the fixture-site harness `tests/build/fixture-site.ts` (copies the repo's site source to a temp dir under `.cache/`, adds given fixture files to `src/content/pages/`, and runs Astro's programmatic `build()` or `sync()`; returns success or the thrown error message) with a smoke test `tests/build/fixture-site.test.ts`. Run it and confirm it fails until the content layer exists.
- [ ] T014 Write `tests/build/page-validation.test.ts`: one test case per row of contracts/build-errors.md (17 rows) using the T012 fixtures and the T013 harness; each asserts the build rejects and the message contains the strings in the contract's last column (row 7 asserts the image path only). Run and confirm every case fails.
- [ ] T015 [P] Write `tests/build/one-file-page.test.ts` (SC-002): the fixture site plus only `workshops.mdx` builds; `/workshops/` has the title as `<h1>`, description, canonical link and a sitemap entry, and the header navigation is unchanged. Run and confirm it fails.
- [ ] T016 [P] Write `tests/unit/content/section-schemas.test.ts` for the Zod prop schemas in `src/components/sections/schemas.ts` (per data-model.md Section table: required and optional props, `CallToAction` needs `label` and `href`, `Offering` needs `title`, image sections need exactly one image). Run and confirm it fails.

### Implementation

- [ ] T017 [P] Create `src/lib/content/errors.ts` with `PageContentError` and the two message helpers (one file, two files).
- [ ] T018 [P] Create `src/content/schemas/shared.ts` with `imageWithAlt(image)`, `seoFields` and `navField` (strict objects, per data-model.md).
- [ ] T019 Create `src/content/schemas/page.ts` with `pageSchema({ image })` including `intro` (HomeIntro) and `draft` default (depends on T018).
- [ ] T020 [P] Create `src/lib/content/address.ts` with `addressFromPath`, `assertUniqueAddresses` and the segment rule (depends on T017).
- [ ] T021 [P] Create `src/components/sections/schemas.ts` and the registry `src/components/sections/index.ts` (names only at this stage, components arrive in Phase 5) so `body.ts` can list valid sections.
- [ ] T022 Create `src/lib/content/body.ts` with `validatePageBody` (depends on T017, T021).
- [ ] T023 Edit `src/config/navigation.ts`: replace `primaryNavigation` with `fixedPrimaryNavigation` (Writing 4, Projects 5, Contact 7, with `source`), add `position` and `source` to the item type, and shrink `futureDestinations` to `/writing/`, `/projects/`, `/contact/`. Update every import of the old names (`SiteHeader`, `SiteFooter`, tests, e2e helpers) so nothing breaks.
- [ ] T024 Create `src/lib/content/navigation.ts` with `mergeNavigation` (depends on T017, T023).
- [ ] T025 Create `src/content.config.ts` defining the `pages` collection: `glob()` loader over `src/content/pages/**/*.{md,mdx}` with `generateId` from `addressFromPath`, schema from T019 (Astro docs: content collections, `glob()` loader).
- [ ] T026 Create `src/env.d.ts` entry for `App.Locals.pageFile` if the route needs it (per plan), and run `pnpm astro sync`.
- [ ] T027 Run the Phase 2 unit tests (T008 to T011, T016) and confirm they pass; run `tests/build/fixture-site.test.ts` and confirm the harness works. Build-failure cases stay failing until Phases 3 to 6; that is expected.

**Checkpoint**: content modules exist and are unit-tested; the harness can build fixture sites.

## Phase 3: User Story 1 (visitors read launch pages) and User Story 3 (one file, one page) — Priority: P1

**Goal**: the seven launch addresses render through one shared layout from single page files; adding a file publishes a page with no other change.

**Independent test**: `pnpm run build`, all seven `dist/**/index.html` files exist, each with one `<h1>`, a draft notice, correct metadata and a sitemap entry; the one-file fixture builds.

### Tests first (write, run, and see fail before T035 onward)

- [ ] T028 [P] [US1] Write component tests `tests/component/PageLayout.test.ts` (Container API): exactly one `<h1>` with the title, feature image present renders `<Image>` and absent renders no empty wrapper, draft notice on/off, `.prose-accent` wrapper classes, body slot. Run and confirm it fails.
- [ ] T029 [P] [US1] Write `tests/component/DraftNotice.test.ts` and `tests/component/FeatureImage.test.ts` (notice text is plain language and announced as a note, not an alert; image has alt and optional caption). Run and confirm they fail.
- [ ] T030 [P] [US1] Extend `tests/component/SiteHeader.test.ts` and `tests/component/BaseLayout.test.ts` so a passed `navigation` prop drives the header items, marks the current page only on the exact address, and leaves footer and social links unchanged (FR-025, FR-025b, FR-026). Run and confirm the new cases fail.
- [ ] T031 [P] [US1] Write `tests/unit/content/launch-content.test.ts`: seven files exist in `src/content/pages/` with the addresses and `nav` positions in data-model.md; all `draft: true`; home has `intro` and no `<CallToAction>` in its body; Services covers kinds of work, how Don works and what he does not do (FR-021); `privacy-policy.mdx` mentions cookies, Canada or Toronto, retention, statistics and spam protection, marks the field list, retention period, spam-protection service and request route as "to be confirmed", states no concrete retention duration, and shows a "Last updated" date (FR-022, FR-022a); no `cookie-policy` file exists. Run and confirm it fails.
- [ ] T032 [P] [US1] Write `tests/e2e/pages.spec.ts` (project `e2e`): every launch page returns 200 with its title as the only `<h1>` and a draft notice; old addresses `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` resolve; current-page marker on Services, Speaking and About and none on Home when elsewhere; `/cookie-policy/`, `/writing/`, `/projects/`, `/contact/` return 404; per-page `<title>`, description, canonical and `og:image` (default and custom); draft and non-draft pages have identical robots meta; readable with JavaScript off; no horizontal scroll at 320, 390 and 1280 px; sitemap lists the seven pages. Run and confirm it fails.
- [ ] T033 [P] [US1] Extend `tests/e2e/templates.ts` with the seven launch pages, then extend `tests/e2e/a11y.spec.ts` (both themes, phone and desktop, JS on and off), `tests/e2e/budget.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/no-js.spec.ts` and `tests/e2e/not-found.spec.ts` (link check no longer treats `/services/`, `/speaking/`, `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` as future destinations, FR-027) to use them. Run and confirm the new cases fail.
- [ ] T034 [P] [US3] Complete `tests/build/one-file-page.test.ts` and the `page-validation.test.ts` rows 1 to 4, 9, 13 and 14 so they depend only on Phase 2 and this phase; run and confirm they fail.

### Implementation

- [ ] T035 [P] [US1] Create `src/components/page/DraftNotice.astro` (plain-language notice, visible at top of content, AA contrast in both themes).
- [ ] T036 [P] [US1] Create `src/components/page/FeatureImage.astro` using `<Image />` from `astro:assets` with `srcset`, alt and optional caption.
- [ ] T037 [US1] Create `src/layouts/PageLayout.astro` inside `BaseLayout`, ported from Flux `page.hbs` + `content-section.hbs` (see `.reference/flux`): title `<h1>`, optional feature image, draft notice, `.prose-accent` body; no share bar.
- [ ] T038 [US1] Update `src/layouts/BaseLayout.astro` and `src/components/SiteHeader.astro` to take `navigation` items and pass them through; update `src/pages/404.astro` to pass the merged navigation.
- [ ] T039 [US1] Create `src/pages/[...slug].astro` with `getStaticPaths()` over the `pages` collection, run `validatePageBody`, `assertUniqueAddresses` and the navigation merge, pass `components` (section registry) to `<Content />`, use `PageLayout`, and set title, description, canonical and sharing image through the existing `Seo.astro` (`getImage()` for a custom image). Remove `src/pages/index.astro`.
- [ ] T040 [P] [US1] Copy Don's photo from the current site (https://www.doncoleman.ca/ author image; use the copy already in `tests/reference/ghost/` or fetch the file from the site) to `src/content/pages/images/don-coleman.jpg`; record its source URL in the task notes.
- [ ] T041 [US1] Create the launch page files `src/content/pages/services.mdx`, `speaking.mdx`, `about.mdx` with short plain-language draft copy, `draft: true`, `nav` positions from data-model.md, and Services covering kinds of work, how he works and what he does not do (FR-021, FR-024). Use only Markdown at this stage; sections are adopted in Phase 5.
- [ ] T042 [US1] Create `src/content/pages/privacy-policy.mdx` (draft, no `nav`): what the contact form collects, where submissions are stored (Toronto, Canada), that they are deleted after a retention period without naming a duration, cookies and statistics (Cloudflare Web Analytics, no tracking cookies), spam protection (Turnstile) and a "Last updated" date; mark field list, retention period, spam-protection service and request route as "to be confirmed" (FR-022, FR-022a).
- [ ] T043 [US1] Create a temporary minimal `src/content/pages/index.mdx` (title, description, short body, `nav: { position: 1, label: "Home" }`, `draft: true`) so `/` keeps working; the intro card arrives in Phase 4. Create stub `terms-of-use.mdx` and `technology.mdx` files with a title, description and one-line draft body so all seven addresses exist (real copy in Phase 7).
- [ ] T044 [US1] Run all Phase 3 tests (T028 to T034); component, unit and build tests must pass, then `pnpm run build` and the E2E, a11y and budget specs against it. Fix failures in the code, not the tests. Existing header, footer, menu and not-found visual baselines must pass unchanged; a visual diff on them is a regression to fix.
- [ ] T045 [US1] Confirm `pnpm run verify` is green except for tests owned by later phases (home visuals, sections, build-error rows 5 to 8, 10 to 12, 15 to 17); list which are still red in the task notes.

**Checkpoint**: seven pages publish; a single file is enough to add another.

## Phase 4: User Story 2 (Home introduces Don) — Priority: P1

**Goal**: home page opens with the introduction card ported from Flux, with a call to action to `/services/` instead of Subscribe.

**Independent test**: `/` shows one `<h1>` (name), the photo with alt text, tagline, bio, GitHub and LinkedIn links matching the footer, and a call to action to `/services/`; no Subscribe.

### Tests first (write, run, and see fail before T050 onward)

- [ ] T046 [P] [US2] Write `tests/component/HomeIntro.test.ts`: gradient wrapper, `<h1>` name, photo alt, italic tagline, bio, GitHub and LinkedIn with the same accessible names as the footer, CTA href `/services/`, no "Subscribe" text, no Website/X/Bluesky links. Run and confirm it fails.
- [ ] T047 [P] [US2] Extend `tests/e2e/pages.spec.ts` with the home checks: one `<h1>` equal to the name, card elements visible, CTA link navigates to `/services/`, no Subscribe button, text below the card says who Don helps and what he does (FR-019), photo is an optimised WebP with `fetchpriority="high"`. Run and confirm it fails.
- [ ] T048 [P] [US2] Extend `tests/unit/content/launch-content.test.ts` for the home file: `intro` has photo, name, tagline, bio and `cta.href === "/services/"`, and the file passes `pageSchema`. Run and confirm it fails.
- [ ] T049 [US2] Add the visual snapshots for the new pages to `tests/e2e/visual.spec.ts`: home and about at 390 and 1280 px in dark and light (8 shots per platform, FR-029), following the existing naming pattern. Run `pnpm run test:visual` and confirm the new ones fail for lack of baselines (baselines are generated in Phase 9).

### Implementation

- [ ] T050 [US2] Create `src/components/page/HomeIntro.astro` ported from Flux `layout-author-hero.hbs` (see `.reference/flux`): gradient border, photo via `<Image />` (~512 px WebP, `fetchpriority="high"`), name as `<h1>`, tagline, bio, social links from `socialNavigation`, and the CTA link in place of Subscribe.
- [ ] T051 [US2] Wire `HomeIntro` into `PageLayout.astro`: when `intro` is set it replaces the title heading (still exactly one `<h1>`).
- [ ] T052 [US2] Replace the temporary `src/content/pages/index.mdx` with the real draft: `intro` (photo `./images/don-coleman.jpg`, name, tagline, bio, `cta` to `/services/`), and a body that says who Don helps and what he does, with no `CallToAction` in the body (FR-016 to FR-019, FR-024).
- [ ] T053 [US2] Ported hero classes may fail AA in a theme: run the a11y spec for `/` in both themes; where a Flux shade fails, swap it for the nearest passing shade in `src/components/page/HomeIntro.astro` and note each swap (from, to, ratio, where) in the task notes for T080.
- [ ] T054 [US2] Run T046 to T049 tests and the budget spec for `/`; confirm all pass except the not-yet-baselined visuals.
- [ ] T055 [US2] [PREVIEW-CHECK] Don compares the home page on the preview deployment with https://www.doncoleman.ca/ (and `tests/reference/ghost/home-*.png`) in both themes at phone and desktop widths: same card, gradient border, photo, name, tagline, bio and social links; Subscribe replaced by the call to action.

**Checkpoint**: home page matches the current site's card with the new call to action.

## Phase 5: User Story 4 (compose pages from reusable sections) — Priority: P2

**Goal**: a closed set of section components usable in any MDX body with no imports; each renders consistently, accessibly and without client JavaScript.

**Independent test**: the fixtures page using every section passes axe in both themes and widths, has no horizontal scroll, and reads with JavaScript off.

### Tests first (write, run, and see fail before T062 onward)

- [ ] T056 [P] [US4] Write component tests per section in `tests/component/sections/` (Container API with the MDX container renderer): `Lead`, `TextBlock` (title as heading), `Offerings`/`Offering` (list semantics; titles `<h3>` under a list title and `<h2>` without one; `href` renders a link), `CallToAction` (focusable link with label), `Figure`, `WideImage`, `FullImage` (`figure`/`figcaption`, width classes `kg-width-wide` and `kg-width-full`, image optimised by Astro); each throws an error naming the section and the missing prop. The `Figure` test also proves images inside section children are optimised (plan risk R8); if not, record the `import.meta.glob` fallback in the task notes. Run and confirm every test fails.
- [ ] T057 [P] [US4] Write `tests/e2e/sections.spec.ts` (project `sections`, fixture site on 4322): axe in both themes at phone and desktop, no horizontal scroll at 320, 390, 1100 and 1280 px, readable with JavaScript off, wide image wider than the text column at 1280 px, full-width image equals the viewport content width (computed-width assertion), CTA keyboard-focusable with visible focus. Run (after `pnpm run build:fixtures`) and confirm it fails.
- [ ] T058 [P] [US4] Add the sections fixture page snapshots to `tests/e2e/visual.spec.ts` (or a `sections`-project visual spec): phone and desktop, both themes, in the `sections` project. Confirm they fail for lack of baselines.
- [ ] T059 [P] [US4] Extend `tests/unit/content/launch-content.test.ts`: `services.mdx` and `speaking.mdx` use at least one section each and only registered sections; the Speaking page uses `Figure` for the organiser photo. Extend the build tests so `page-validation.test.ts` rows 10 to 12 depend on this phase. Run and confirm they fail.
- [ ] T060 [P] [US4] Write `tests/unit/site/global-css.test.ts` asserting `src/styles/global.css` defines `kg-width-wide` and `kg-width-full` (clamped wide margin, `cqw`-based full width) and the body container. Run and confirm it fails.

### Implementation

- [ ] T061 [US4] Add the `kg-width-wide` and `kg-width-full` styles and body container to `src/styles/global.css`, ported from Flux `screen.css` per research R9 (Tailwind, no JavaScript).
- [ ] T062 [P] [US4] Create `Lead.astro`, `TextBlock.astro` and `CallToAction.astro` in `src/components/sections/`, each validating props with the schemas from T021 and throwing `PageContentError` naming the section and prop.
- [ ] T063 [P] [US4] Create `Offerings.astro` and `Offering.astro` in `src/components/sections/` (list semantics, heading levels per plan).
- [ ] T064 [P] [US4] Create `Figure.astro`, `WideImage.astro` and `FullImage.astro` in `src/components/sections/` (exactly one Markdown image, caption, width classes).
- [ ] T065 [US4] Complete the registry in `src/components/sections/index.ts` and confirm `[...slug].astro` passes it as `components` to `<Content />`; pages need no imports.
- [ ] T066 [US4] Adopt sections in `src/content/pages/services.mdx` (Lead, Offerings/Offering, TextBlock, CallToAction) and `speaking.mdx` (TextBlock, Offerings, Figure); keep the copy plain and `draft: true`.
- [ ] T067 [US4] Run `pnpm run build:fixtures` and `pnpm exec playwright test --project=sections` plus all Phase 5 unit and component tests; fix colour or focus failures in the components and note each colour swap for T080.

**Checkpoint**: every section works on a page with no imports and passes accessibility checks.

## Phase 6: User Story 5 (broken page files fail clearly) — Priority: P2

**Goal**: every content mistake in contracts/build-errors.md fails the build naming the file and the problem.

**Independent test**: `pnpm exec vitest run tests/build/page-validation.test.ts` passes all 17 rows.

- [ ] T068 [US5] Run `tests/build/page-validation.test.ts` now and record which of the 17 rows are still red (the tests were written in T014 and must already exist; do not weaken any assertion). Each red row is a work item for T069 to T072.
- [ ] T069 [US5] Fix schema-derived rows 1 to 6: make sure Astro's collection error, or a wrapped `PageContentError`, names the file and key (for the `image()` helper of row 6, also the image path). Adjust `src/content.config.ts` or `src/content/schemas/*.ts`, not the tests.
- [ ] T070 [US5] Fix body-derived rows 8 to 10 and 16: wire `validatePageBody` into `src/pages/[...slug].astro` (or a loader step) so the message names the file, the section (with the list of valid sections) or "use ##".
- [ ] T071 [US5] Fix section-prop rows 11 and 12 in `src/components/sections/*.astro` and address rows 13, 14 and 17 in `src/lib/content/address.ts`, and navigation row 15 in `src/lib/content/navigation.ts`, so the message names the file(s), the section or the address as the contract states.
- [ ] T072 [US5] Confirm row 7 (missing body image) fails with Astro's own message containing the image path; no code change unless it does not fail.
- [ ] T073 [US5] Run `pnpm run test` fully; all 17 rows and the one-file-page test must pass, along with every unit, component and build test so far.

**Checkpoint**: invalid content cannot build; a failing build blocks the merge (FR-009).

## Phase 7: User Story 6 (legal and technology pages carried over) — Priority: P2

**Goal**: Terms of use and Technology start from the current site's pages at the same addresses, corrected for the new site.

**Independent test**: `/terms-of-use/` and `/technology/` render the carried-over copy with no references to Ghost, members, subscriptions or comments.

### Tests first (write, run, and see fail before T077 onward)

- [ ] T074 [US6] Extend `tests/unit/content/launch-content.test.ts` for `terms-of-use.mdx` and `technology.mdx`: real copy (more than the T043 stubs, e.g. at least several paragraphs), `draft: true`, no case-insensitive match for "Ghost", "member", "subscribe", "comment", "Drift", "Convergence" or "News" category references; both pass `pageSchema`. Run and confirm it fails against the stubs.

### Implementation

- [ ] T075 [US6] Fetch the current site's Terms of use (https://www.doncoleman.ca/terms-of-use/) and Technology (https://www.doncoleman.ca/technology/) pages as the starting copy (curl or WebFetch; save raw text in the scratchpad, not the repo). If the site is unreachable, fall back to short draft placeholders and say so in the task notes.
- [ ] T076 [US6] Rewrite `src/content/pages/terms-of-use.mdx` and `src/content/pages/technology.mdx` from that copy: plain language, corrected for the new site (remove the removed features listed in T074, describe the actual stack: Astro, Cloudflare, Tailwind, the contact form's storage in Toronto as planned), keep the same addresses, `draft: true`. Run T074 and confirm it passes.
- [ ] T077 [P] [US6] [PREVIEW-CHECK] Don reads the Privacy policy, Terms of use and Technology pages on the preview deployment for accuracy against the new site and reviews the placeholder copy on Home, Services, Speaking and About.

**Checkpoint**: all seven pages carry real draft copy.

## Phase 8: Documentation

**Purpose**: document the shared structure and Don's guide. Tests first.

- [ ] T078 [P] Write `tests/unit/site/docs-content-structure.test.ts`: `docs/design-source.md` contains a "Content structure" section naming each path in the plan's shared-structure table (`src/content.config.ts`, `src/content/schemas/`, `src/content/pages/`, `src/components/sections/`, `src/components/page/`, `src/layouts/PageLayout.astro`, `src/lib/content/`, `src/pages/[...slug].astro`, `docs/pages.md`), the Flux mapping rows (`page.hbs`, `layout-author-hero.hbs`, `content-feature-image.hbs`, `kg-width-wide` and `kg-width-full`), and an accessibility adjustments subsection; `docs/pages.md` exists, lists every settings key and has one example per section (FR-012, FR-031). Run and confirm it fails.
- [ ] T079 Document the shared content and component folder structure in `docs/design-source.md` (new "Content structure" section: the plan's table with what each later feature adds, and the mapping updates table from the plan).
- [ ] T080 Record every colour substitution made for contrast (from T053, T067 and any later a11y fix) in `docs/design-source.md`: original Flux class, replacement, both contrast ratios and the component; if none were needed, say so in one sentence.
- [ ] T081 [P] Create `docs/pages.md`: Don's guide (where page files go, addresses from paths, every settings key from data-model.md, draft notice, navigation, images, and one short example of each section with its rules from contracts/sections.md), in plain language.
- [ ] T082 Run T078 and confirm it passes.

## Phase 9: Polish, baselines and release gate

- [ ] T083 Check `docker info`; if it fails, ask Don through `AskUserQuestion` (put the instruction in the question text) to start Docker Desktop, and do not fall back to CI without asking.
- [ ] T084 Update the macOS visual baselines with `pnpm run test:visual:update` (home, about and sections fixture, at 390 and 1280 px in both themes). Inspect the new images; confirm the existing header, footer, menu and not-found baselines are byte-identical in `git status`. Any unexpected change to them is a regression to fix, not to refresh.
- [ ] T085 Update the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop) and commit both sets in `tests/e2e/visual.spec.ts-snapshots/`.
- [ ] T086 Run `pnpm run test:visual` on macOS to confirm the baselines match, and check the sections project's baselines are committed too.
- [ ] T087 Run `pnpm run verify` (`lint:secrets`, `lint`, `typecheck`, `test`, `build`, `build:fixtures`, `test:e2e`) bounded by `perl -e 'alarm 1500; exec @ARGV' pnpm run verify`; it must be fully green. Do not skip or weaken any check.
- [ ] T088 Walk through quickstart.md sections 2 to 6 commands and confirm each expected result (7 sitemap entries, no `dist/cookie-policy`, 17 build-error tests).
- [ ] T089 Prepare the PR body: state this is a **major change** (Principle III: new dependency `@astrojs/mdx`, site-wide layout and navigation source, build and test config), auto-merge stays off, expected added cost $0, the list of colour swaps, the note that the site-wide pre-launch `noindex` still applies (plan risk), and the open `[PREVIEW-CHECK]` items (T055, T077, T090). Add the `major-change` label. Do not run `gh pr merge --auto`.
- [ ] T090 [PREVIEW-CHECK] Every page renders on the preview deployment in both themes; follow each header and footer link except Writing, Projects and Contact and confirm a real page with the draft notice, and open `/`, `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` (quickstart section 7).

## Dependencies and execution order

- Phase 1 (Setup) then Phase 2 (Foundational) block everything.
- Phase 3 (US1 + US3) needs Phase 2. Phase 4 (US2) needs Phase 3 (layout, route, photo). Phase 5 (US4) needs Phase 3; Phase 4 and Phase 5 can proceed in parallel after Phase 3 but both edit `PageLayout.astro` and `launch-content.test.ts`, so run them in order unless separate worktrees are used. Phase 6 (US5) needs Phases 3 and 5 (section prop rows). Phase 7 (US6) needs Phase 3 only. Phase 8 needs the colour notes from Phases 4 and 5. Phase 9 needs everything.
- Within every phase: tests first, seen failing, then implementation, then the phase's checkpoint run.

## Parallel opportunities

- Phase 2: T008 to T011, T015, T016 (separate test files); T017, T018, T020, T021 (separate modules).
- Phase 3: T028 to T034 (separate test files); T035, T036, T040.
- Phase 5: T056 to T060; T062 to T064.
- Phase 8: T078 and T081 in parallel.

## Implementation strategy

- MVP is Phases 1 to 3 (seven pages published from files through one route), then Phase 4 for the home card. Sections, build errors, legal copy, docs and baselines follow in order.
- Never mark a task done on a red suite; run the phase's tests before ticking its checkpoint.
- Task notes should record the Astro doc pages consulted and any deviations from the plan.
