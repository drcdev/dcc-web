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

- [x] T001 Write config tests first in `tests/unit/site/config-mdx.test.ts`: `package.json` lists `@astrojs/mdx` (pinned, like the other dependencies), has a `build:fixtures` script, and `verify` is unchanged; `astro.config.mjs` registers `mdx()`; `playwright.config.ts` has a second `webServer` on port 4322 whose command runs `pnpm run build:fixtures` before `astro preview` of the fixture site, a `sections` project, and `sections.spec.ts` in the `e2e` project's `testIgnore`; `vitest.config.ts` includes `tests/build/**`; `eslint.config.js` ignores `.cache/`. Run them and confirm they fail before T002 to T006.
- [x] T002 Add the official MDX integration with `pnpm astro add mdx` (Astro docs: MDX integration guide); confirm the pinned version and lockfile are committed, and `astro.config.mjs` registers `mdx()` beside the sitemap integration.
- [x] T003 [P] Add `.cache/` to the ignores in `eslint.config.js` and confirm `.gitignore` already ignores it (fixture builds write there).
- [x] T004 Add the `build:fixtures` script to `package.json` (builds the fixture site from T012 into `.cache/fixture-site/dist`); leave `verify` unchanged, because the fixture web server (T005) runs this script itself. Create `scripts/build-fixture-site.ts` as the script it calls (copy the repo's site with `tests/fixtures/pages/sections.mdx` as an extra page, then `astro build`).
- [x] T005 Update `playwright.config.ts`: add the second `webServer` on port 4322 whose command is `pnpm run build:fixtures && pnpm exec astro preview --root .cache/fixture-site --port 4322` (with a timeout long enough for a full build), so every Playwright run, including `verify`, the `update-baselines` CI job and `test:visual:update:linux`, has the fixture site without any other script or workflow change; add a `sections` project whose `testMatch` is `tests/e2e/sections.spec.ts` and whose `baseURL` is `http://localhost:4322`; add `sections.spec.ts` to the `e2e` project's `testIgnore` so it never runs against port 4321. Keep every other existing project setting untouched.
- [x] T006 Update `vitest.config.ts` to include `tests/build/**` with a longer `testTimeout` for that folder only; create the empty directories with placeholder-free structure as needed (`tests/unit/content/`, `tests/build/`, `tests/fixtures/pages/`, `tests/fixtures/pages/broken/`, `tests/fixtures/pages/images/`).
- [x] T007 Run `pnpm run lint`, `pnpm run typecheck` and `pnpm run test`; the T001 config tests must now pass and nothing else may have regressed.

**Checkpoint**: MDX is installed and the test scaffolding exists.

## Phase 2: Foundational (content layer and fixture harness)

**Purpose**: the schema, address, body, navigation and error modules every story depends on, plus the fixture-site harness. Blocks all user stories.

### Tests first (write, run, and see fail before T017 to T027)

- [x] T008 [P] Write `tests/unit/content/page-schema.test.ts`: `pageSchema({ image })` (with a stand-in `image` validator) accepts a minimal page and a full page; rejects missing `title`, missing `description`, empty strings, `nav.position` of `"second"`, `0` and `1.5`, unknown keys at every level (`titel`), `image` or `featureImage` without or with empty `alt`, and `intro` missing any of photo, name, tagline, bio, cta; defaults `draft` to `false`. Run and confirm it fails.
- [x] T009 [P] Write `tests/unit/content/address.test.ts`: `addressFromPath` maps `index.mdx` to `/`, `about.mdx` to `/about/`, `x/index.mdx` to `/x/`, nested paths to nested addresses; rejects `About_Me.mdx`, spaces and upper case with the message from contracts/build-errors.md row 17; `assertUniqueAddresses` fails for page/page (`about.md` + `about.mdx`), `x.mdx` + `x/index.mdx`, a page against a route file in `src/pages/` (including a generated file such as `robots.txt.ts`), a page under the fixed prefix of a route with a variable part (for example `writing/intro.mdx` against `src/pages/writing/[slug].astro`), and each reserved `futureDestinations` address. Run and confirm it fails.
- [x] T010 [P] Write `tests/unit/content/body.test.ts`: `validatePageBody` rejects an empty body ("no content"), an unknown capitalised tag (message names the file, the tag and lists valid sections), an image with empty alt ("alt text"), a level-1 Markdown heading or `<h1>` ("use ##"); ignores tags and `# ` inside code fences and inline code; accepts every registered section. Run and confirm it fails.
- [x] T011 [P] Write `tests/unit/content/navigation.test.ts`: `mergeNavigation` at launch returns Home, Services, Speaking, Writing, Projects, About, Contact in that order with the foundation's hrefs; label defaults to the page title; page entries with `nav` are merged with the fixed Writing 4, Projects 5, Contact 7; a duplicate position names both sources and the position (page vs page, and a page asking for 4, 5 or 7 names the page file and the fixed entry); pages without `nav` are absent. Also assert `PageContentError` messages start with `Page file <path>:` or `Page files <a> and <b>:`. In the same task, rewrite the existing `tests/unit/site/navigation.test.ts` for the new config shape before T023 touches it: `fixedPrimaryNavigation` is exactly Writing 4, Projects 5, Contact 7 with `source`, `primaryNavigation` is no longer exported, and `futureDestinations` equals exactly `["/writing/", "/projects/", "/contact/"]`. Run both and confirm they fail.
- [x] T012 Create the fixture site content: `tests/fixtures/pages/sections.mdx` (not a draft; sets a custom `image` and a `featureImage`; uses every section: Lead, TextBlock, Offerings/Offering, CallToAction, Figure, WideImage, FullImage; has `##`, `###` and `####` headings and a long unbroken web address in the body), `tests/fixtures/pages/workshops.mdx` (the minimal example from contracts/page-file.md), one small image in `tests/fixtures/pages/images/`, and one broken file per row 1 to 17 of contracts/build-errors.md in `tests/fixtures/pages/broken/` (named `NN-short-name.mdx`, plus companion files for the two-file rows).
- [x] T013 Write the fixture-site harness `tests/build/fixture-site.ts` (copies the repo's site source to a temp dir under `.cache/`, adds given fixture files to `src/content/pages/`, and runs Astro's programmatic `build()` or `sync()`; returns success or the thrown error message) with a smoke test `tests/build/fixture-site.test.ts`. Run it and confirm it fails until the content layer exists.
- [x] T014 Write `tests/build/page-validation.test.ts`: one test case per row of contracts/build-errors.md (17 rows) using the T012 fixtures and the T013 harness; each asserts the build rejects and the message contains the strings in the contract's last column (row 7 asserts the image path only). Run and confirm every case fails.
- [x] T015 [P] Write `tests/build/one-file-page.test.ts` (SC-002, US3): the fixture site plus only `workshops.mdx` builds; `/workshops/` has the title as `<h1>`, description, canonical link, the default `og:image` and a sitemap entry, and the header navigation is unchanged; as a non-draft page it shows no draft notice and its robots meta is identical to a draft launch page's (`/about/`) in the same build (FR-006, FR-015, SC-008). Then change one word in `workshops.mdx`, rebuild, and assert the only HTML file in `dist/` whose content differs is `workshops/index.html` (US3 scenario 5). Run and confirm it fails.
- [x] T016 [P] Write `tests/unit/content/section-schemas.test.ts` for the Zod prop schemas in `src/components/sections/schemas.ts` (per data-model.md Section table: required and optional props, `CallToAction` needs `label` and `href`, `Offering` needs `title`, image sections need exactly one image). Run and confirm it fails.

### Implementation

- [x] T017 [P] Create `src/lib/content/errors.ts` with `PageContentError` and the two message helpers (one file, two files).
- [x] T018 [P] Create `src/content/schemas/shared.ts` with `imageWithAlt(image)`, `seoFields` and `navField` (strict objects, per data-model.md).
- [x] T019 Create `src/content/schemas/page.ts` with `pageSchema({ image })` including `intro` (HomeIntro) and `draft` default (depends on T018).
- [x] T020 [P] Create `src/lib/content/address.ts` with `addressFromPath`, `assertUniqueAddresses` and the segment rule (depends on T017).
- [x] T021 [P] Create `src/components/sections/schemas.ts` and the registry `src/components/sections/index.ts` (names only at this stage, components arrive in Phase 5) so `body.ts` can list valid sections.
- [x] T022 Create `src/lib/content/body.ts` with `validatePageBody` (depends on T017, T021).
- [x] T023 Edit `src/config/navigation.ts`: replace `primaryNavigation` with `fixedPrimaryNavigation` (Writing 4, Projects 5, Contact 7, with `source`), add `position` and `source` to the item type, and shrink `futureDestinations` to `/writing/`, `/projects/`, `/contact/`. Update every source import of the old names (`src/components/SiteHeader.astro`) so nothing breaks; the unit test was already rewritten in T011 and `tests/e2e/not-found.spec.ts` keeps importing `futureDestinations`. Run T011's tests and confirm they now pass.
- [x] T024 Create `src/lib/content/navigation.ts` with `mergeNavigation` (depends on T017, T023).
- [x] T025 Create `src/content.config.ts` defining the `pages` collection: `glob()` loader over `src/content/pages/**/*.{md,mdx}` with `generateId` from `addressFromPath`, schema from T019 (Astro docs: content collections, `glob()` loader).
- [x] T026 Create `src/env.d.ts` entry for `App.Locals.pageFile` if the route needs it (per plan), and run `pnpm astro sync`. *(Note: `astro sync` run; `src/env.d.ts` not created because a static route passes the page file as a prop, so `App.Locals` is not needed. Phase 3 adds it only if that changes.)*
- [x] T027 Run the Phase 2 unit tests (T008 to T011, T016) and confirm they pass; run `tests/build/fixture-site.test.ts` and confirm the harness works. Build-failure cases stay failing until Phases 3 to 6; that is expected. *(Result: unit project 780 passed; harness smoke 4 passed; page-validation rows 1 to 5 and 17 already pass, rows 6 to 16 and one-file-page stay red until Phase 3. Row 6 needs the route to load the collection, because `astro sync` does not resolve `image()` files.)*

**Checkpoint**: content modules exist and are unit-tested; the harness can build fixture sites.

## Phase 3: User Story 1 (visitors read launch pages) and User Story 3 (one file, one page) — Priority: P1

**Goal**: the seven launch addresses render through one shared layout from single page files; adding a file publishes a page with no other change.

**Independent test**: `pnpm run build`, all seven `dist/**/index.html` files exist, each with one `<h1>`, a draft notice, correct metadata and a sitemap entry; the one-file fixture builds.

### Tests first (write, run, and see fail before T035 onward)

- [x] T028 [P] [US1] Write component tests `tests/component/PageLayout.test.ts` (Container API): exactly one `<h1>` with the title, feature image present renders `<Image>` and absent renders no empty wrapper, draft notice on/off, `.prose-accent` wrapper classes, body slot. Run and confirm it fails.
- [x] T029 [P] [US1] Write `tests/component/DraftNotice.test.ts` and `tests/component/FeatureImage.test.ts` (the notice is a plain `<p data-draft-notice>` in plain language, with no role, not a heading and not a landmark (FR-015, contracts/page-dom.md); image has alt and optional caption). Run and confirm they fail.
- [x] T030 [P] [US1] Extend `tests/component/SiteHeader.test.ts` and `tests/component/BaseLayout.test.ts` so a passed `navigation` prop drives the header items, marks the current page only on the exact address, and leaves footer and social links unchanged (FR-025, FR-025b, FR-026). Run and confirm the new cases fail.
- [x] T031 [P] [US1] Write `tests/unit/content/launch-content.test.ts`: seven files exist in `src/content/pages/` with the addresses and `nav` positions in data-model.md; all `draft: true`; home has `intro` and no `<CallToAction>` in its body; Services covers kinds of work, how Don works and what he does not do; Speaking covers talk topics, past talks and an organiser bio and photo; About covers background, credentials and how the practice fits alongside his full-time role (FR-021); `privacy-policy.mdx` says the site sets no cookies, that the theme choice is kept only in the visitor's local storage, names Cloudflare Web Analytics and Cloudflare hosting (request information such as IP address), mentions Canada or Toronto, retention, spam protection and how to ask what is held or ask for deletion, marks the field list, retention period, spam-protection service and request route as "to be confirmed", states no concrete retention duration, does not name the spam-protection service, has no link to `/cookie-policy/`, and shows a "Last updated" date (FR-022, FR-022a); no `cookie-policy` file exists. Run and confirm it fails.
- [x] T032 [P] [US1] Write `tests/e2e/pages.spec.ts` (project `e2e`): every launch page returns 200 with its title as the only `<h1>` and a draft notice; the landmarks are exactly the foundation's (one banner, one navigation labelled "Main", one main, one contentinfo, no other landmark) (FR-013); the page loads no script beyond the foundation's (FR-030); old addresses `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` resolve; current-page marker on Services, Speaking and About and none on Home when elsewhere; `/cookie-policy/`, `/writing/`, `/projects/`, `/contact/` return 404; per-page `<title>`, description, canonical and the default `og:image` (the custom sharing image, the feature image and the non-draft comparison are covered on fixtures in T015 and T057); readable with JavaScript off; no horizontal scroll at 320, 390 and 1280 px; sitemap lists the seven pages and neither the not-found page nor `/cookie-policy/`. Run and confirm it fails.
- [x] T033 [P] [US1] Extend `tests/e2e/templates.ts` with the seven launch pages, then extend `tests/e2e/a11y.spec.ts` (both themes, phone and desktop, JS on and off), `tests/e2e/budget.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/no-js.spec.ts` and `tests/e2e/not-found.spec.ts` (link check no longer treats `/services/`, `/speaking/`, `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` as future destinations, FR-027) to use them. Run and confirm the new cases fail.
- [x] T034 [P] [US3] Complete `tests/build/one-file-page.test.ts` and the `page-validation.test.ts` rows 1 to 4, 9, 13 and 14 so they depend only on Phase 2 and this phase; run and confirm they fail.

### Implementation

- [x] T035 [P] [US1] Create `src/components/page/DraftNotice.astro` (plain-language notice, visible at top of content, AA contrast in both themes).
- [x] T036 [P] [US1] Create `src/components/page/FeatureImage.astro` using `<Image />` from `astro:assets` with `srcset`, alt and optional caption.
- [x] T037 [US1] Create `src/layouts/PageLayout.astro` inside `BaseLayout`, ported from Flux `page.hbs` + `content-section.hbs` (see `.reference/flux`): title `<h1>`, optional feature image, draft notice, `.prose-accent` body; no share bar.
- [x] T038 [US1] Update `src/layouts/BaseLayout.astro` and `src/components/SiteHeader.astro` to take `navigation` items and pass them through; update `src/pages/404.astro` to pass the merged navigation. *(Note: `SiteHeader` and `BaseLayout` now require `navigation`; the interim launch fallback is removed. `src/lib/pages.ts` `getNavigation()` builds it for the route and the 404 page.)*
- [x] T039 [US1] Create `src/pages/[...slug].astro` with `getStaticPaths()` over the `pages` collection, run `validatePageBody`, `assertUniqueAddresses` and the navigation merge, pass `components` (section registry) to `<Content />`, use `PageLayout`, and set title, description, canonical and sharing image through the existing `Seo.astro` (`getImage()` for a custom image). Remove `src/pages/index.astro`. *(Note: file lists for `assertUniqueAddresses` come from `import.meta.glob`, not the collection, because the collection keeps only one of two same-address files. `sectionComponents` is an empty registry until Phase 5. Added `assertFrontmatterImagesExist` (`src/lib/content/images.ts`, called from `generateId` in `content.config.ts`) so a missing frontmatter image names the page file (row 6); Astro alone names only the image.)*
- [x] T040 [P] [US1] Copy Don's photo from the current site (https://www.doncoleman.ca/ author image; fetch the image file from the site, since `tests/reference/ghost/` holds only screenshots) to `src/content/pages/images/don-coleman.jpg`; record its source URL in the task notes. If the site is unreachable, stop and record it as a blocker rather than substituting another image. *(Note: source: https://www.doncoleman.ca/content/images/2026/01/Image--3-.png (the author photo on the current site, 645x645 PNG), converted to JPEG with `sips`. Adding `<Image>` needs Sharp, which pnpm does not expose to Astro; added `sharp@0.35.5` as a direct dependency per docs.astro.build/en/guides/images/#default-image-service. It is a new dependency, already covered by this feature being a major change; list it in the PR body (T089).)*
- [x] T041 [US1] Create the launch page files `src/content/pages/services.mdx`, `speaking.mdx`, `about.mdx` with short plain-language draft copy, `draft: true`, `nav` positions from data-model.md, and Services covering kinds of work, how he works and what he does not do (FR-021, FR-024). Use only Markdown at this stage; sections are adopted in Phase 5.
- [x] T042 [US1] Create `src/content/pages/privacy-policy.mdx` (draft, no `nav`): what the contact form collects, where submissions are stored (Toronto, Canada), that they are deleted after a retention period without naming a duration, that the site sets no cookies (the theme choice stays in the visitor's local storage and is never sent), visitor statistics (Cloudflare Web Analytics on the main site only, no cookies, no tracking of individuals), hosting (Cloudflare processes request information such as the IP address), spam protection described generically without naming the service, how to ask what the site holds or ask for deletion, a note that it replaces the former cookie policy without linking to `/cookie-policy/`, and a "Last updated" date; mark field list, retention period, spam-protection service and request route as "to be confirmed" (FR-022, FR-022a).
- [x] T043 [US1] Create a temporary minimal `src/content/pages/index.mdx` (title, description, short body, `nav: { position: 1, label: "Home" }`, `draft: true`) so `/` keeps working; the intro card arrives in Phase 4. Create stub `terms-of-use.mdx` and `technology.mdx` files with a title, description and one-line draft body so all seven addresses exist (real copy in Phase 7).
- [x] T044 [US1] Run all Phase 3 tests (T028 to T034); component, unit and build tests must pass, then `pnpm run build` and the E2E, a11y and budget specs against it. Fix failures in the code, not the tests. Existing header, footer, menu and not-found visual baselines must pass unchanged; a visual diff on them is a regression to fix. *(Note: Run against a temporary Playwright config without the sections fixture web server, because `tests/fixtures/pages/sections.mdx` cannot build until the section components exist (Phase 5); until then `pnpm run test:e2e` cannot start. Results: vitest 834 pass, e2e 274 pass, a11y + budget 176 pass, visual 12 pass and 2 fail (footer desktop dark/light: baseline shows 2025, the build year is now 2026; not caused by this phase). The fixture harness now gives each build its own Astro cache (`tests/build/run-astro.ts`), because parallel builds shared `node_modules/.astro` and read one another's page files.)*
- [x] T045 [US1] Confirm `pnpm run verify` is green except for tests owned by later phases (home visuals, sections, and any build-error rows not yet green, expected to include at least rows 10 to 12); list exactly which are still red in the task notes. *(Note: still red for later phases: `page-validation` rows 11 and 12 (section components and prop checks, Phases 5 and 6); `tests/e2e/sections.spec.ts` and the Playwright fixture web server (Phase 5); home visuals (Phase 4); footer visual baselines need a refresh for the year (Phase 9). `pnpm run verify` was not run end to end for the reason in T044.)*

**Checkpoint**: seven pages publish; a single file is enough to add another.

## Phase 4: User Story 2 (Home introduces Don) — Priority: P1

**Goal**: home page opens with the introduction card ported from Flux, with a call to action to `/services/` instead of Subscribe.

**Independent test**: `/` shows one `<h1>` (name), the photo with alt text, tagline, bio, GitHub and LinkedIn links matching the footer, and a call to action to `/services/`; no Subscribe.

### Tests first (write, run, and see fail before T050 onward)

- [x] T046 [P] [US2] Write `tests/component/HomeIntro.test.ts`: gradient wrapper, `<h1>` name, photo alt, italic tagline, bio, GitHub and LinkedIn as a list with the same accessible names as the footer, CTA href `/services/`, no "Subscribe" text, no Website/X/Bluesky links; the gradient border and social icons are `aria-hidden` and add nothing to accessible names; source order is photo, name, tagline, bio, GitHub, LinkedIn, CTA; only the links and CTA are focusable; the card adds no landmark (FR-013, FR-016). Run and confirm it fails.
- [x] T047 [P] [US2] Extend `tests/e2e/pages.spec.ts` with the home checks: one `<h1>` equal to the name, card elements visible, CTA link navigates to `/services/`, no Subscribe button, text below the card says who Don helps and what he does (FR-019), photo is an optimised WebP with `fetchpriority="high"`; the social links and CTA show the foundation focus indicator (solid outline at least 2px, offset 2px) and have targets at least 24 by 24 CSS px (FR-028a). Run and confirm it fails.
- [x] T048 [P] [US2] Extend `tests/unit/content/launch-content.test.ts` for the home file: `intro` has photo, name, tagline, bio and `cta.href === "/services/"`, and the file passes `pageSchema`. Run and confirm it fails.
- [x] T049 [US2] Add the visual snapshots for the new pages to `tests/e2e/visual.spec.ts`: home and about at 390 and 1280 px in dark and light (8 shots per platform, FR-029), following the existing naming pattern. Run `pnpm run test:visual` and confirm the new ones fail for lack of baselines (baselines are generated in Phase 9).

### Implementation

- [x] T050 [US2] Create `src/components/page/HomeIntro.astro` ported from Flux `layout-author-hero.hbs` (see `.reference/flux`): gradient border, photo via `<Image />` (~512 px WebP, `fetchpriority="high"`), name as `<h1>`, tagline, bio, social links from `socialNavigation`, and the CTA link in place of Subscribe.
- [x] T051 [US2] Wire `HomeIntro` into `PageLayout.astro`: when `intro` is set it replaces the title heading (still exactly one `<h1>`).
- [x] T052 [US2] Replace the temporary `src/content/pages/index.mdx` with the real draft: `intro` (photo `./images/don-coleman.jpg`, name, tagline, bio, `cta` to `/services/`), and a body that says who Don helps and what he does, with no `CallToAction` in the body (FR-016 to FR-019, FR-024).
- [x] T053 [US2] Ported hero classes may fail AA in a theme: run the a11y spec for `/` in both themes; where a Flux shade fails, swap it for the nearest passing shade in `src/components/page/HomeIntro.astro` and note each swap (from, to, ratio, where) in the task notes for T080. *(Note, for T080: tagline light `text-mauve-400` #9e939f on white 2.94:1 became `text-mauve-600` (same as the footer copyright); tagline dark `dark:text-mauve-500` #857788 on dusk-800 #2b283e 3.38:1 became `dark:text-mauve-400` #9e939f, 4.83:1; CTA `bg-rust-500` #d17a2e with white text 3.21:1 became `bg-rust-600` #a76225, 4.75:1, hover `bg-rust-700` 7.39:1, both themes. Social icons and body copy passed unchanged.)*
- [x] T054 [US2] Run T046 to T049 tests and the budget spec for `/`; confirm all pass except the not-yet-baselined visuals. *(Note: vitest 859 pass, 2 fail (build rows 11 and 12, Phases 5 and 6); e2e + a11y + budget 455 pass with a temporary config lacking the sections server; visual 12 pass, 10 fail: 8 new home and about shots without baselines, plus the 2 known footer-desktop year diffs (Phase 9). The shell test "Tab from the skip link" now allows the home card's repeated Services link. Astro docs consulted: images (`<Image />`, `format`, `fetchpriority`), `astro/types` `ComponentProps`.)*
- [ ] T055 [US2] [PREVIEW-CHECK] Don compares the home page on the preview deployment with https://www.doncoleman.ca/ (and `tests/reference/ghost/home-*.png`) in both themes at phone and desktop widths: same card, gradient border, photo, name, tagline, bio and social links; Subscribe replaced by the call to action.

**Checkpoint**: home page matches the current site's card with the new call to action.

## Phase 5: User Story 4 (compose pages from reusable sections) — Priority: P2

**Goal**: a closed set of section components usable in any MDX body with no imports; each renders consistently, accessibly and without client JavaScript.

**Independent test**: the fixtures page using every section passes axe in both themes and widths, has no horizontal scroll, and reads with JavaScript off.

### Tests first (write, run, and see fail before T062 onward)

- [x] T056 [P] [US4] Write component tests per section in `tests/component/sections/` (Container API with the MDX container renderer): `Lead`, `TextBlock` (title as `<h2>`, `<section>` without an accessible name so it adds no landmark), `Offerings`/`Offering` (list semantics; titles `<h3>` under a list title and `<h2>` without one; `href` renders a link), `CallToAction` (focusable link with label), `Figure`, `WideImage`, `FullImage` (`figure`/`figcaption`, width classes `kg-width-wide` and `kg-width-full`, image optimised by Astro); each throws an error naming the section and the missing prop. The `Figure` test also proves images inside section children are optimised (plan risk R8); if not, record the `import.meta.glob` fallback in the task notes. Run and confirm every test fails. *(Note: R8 confirmed: a Markdown image inside a section child is optimised by Astro's MDX pipeline with no import (`tests/component/sections/MdxImages.test.ts`), so no `import.meta.glob` fallback is needed. Section errors name the page file through `Astro.locals.pageFile`, set by the route; `src/env.d.ts` now types it.)*
- [x] T057 [P] [US4] Write `tests/e2e/sections.spec.ts` (project `sections`, fixture site on 4322): axe in both themes at phone and desktop, no horizontal scroll at 320, 390, 1100 and 1280 px, readable with JavaScript off, wide image wider than the text column at 1280 px, full-width image equals the viewport content width (computed-width assertion), the long unbroken address wraps without horizontal scroll; the CTA and offering links are keyboard-focusable with the foundation focus indicator and targets at least 24 by 24 CSS px, and links in content are underlined (FR-028a); content headings use the design-system colours (`h2` rust, `h3` sage, `h4` lavender) in both themes (FR-014); the page's `og:image` is its custom sharing image and the feature image renders at the top of the content with its alt (US3 scenario 2, US4 scenario 6); no draft notice. Run (the fixture web server builds the site) and confirm it fails.
- [x] T058 [P] [US4] Add the sections fixture page snapshots to `tests/e2e/visual.spec.ts` (the `visual` project), loading the page by its absolute fixture URL `http://localhost:4322/sections/`: phone and desktop, both themes. Keeping them in the `visual` project means `test:visual:update` (macOS, Linux and CI) refreshes them with no script change. Confirm they fail for lack of baselines.
- [x] T059 [P] [US4] Extend `tests/unit/content/launch-content.test.ts`: `services.mdx` and `speaking.mdx` use at least one section each and only registered sections; the Speaking page uses `Figure` for the organiser photo. Extend the build tests so `page-validation.test.ts` rows 10 to 12 depend on this phase. Run and confirm they fail.
- [x] T060 [P] [US4] Write `tests/unit/site/global-css.test.ts` asserting `src/styles/global.css` defines `kg-width-wide` and `kg-width-full` (clamped wide margin, `cqw`-based full width) and the body container. Run and confirm it fails. *(Note: the container is `.page-container`, a full-width wrapper added around `<main>` in `BaseLayout`, not `body`: `container-type` on the body stops its background reaching the whole window (the not-found dark visual regressed), so the test asserts the wrapper and forbids containment on the body.)*

### Implementation

- [x] T061 [US4] Add the `kg-width-wide` and `kg-width-full` styles and body container to `src/styles/global.css`, ported from Flux `screen.css` per research R9 (Tailwind, no JavaScript).
- [x] T062 [P] [US4] Create `Lead.astro`, `TextBlock.astro` and `CallToAction.astro` in `src/components/sections/`, each validating props with the schemas from T021 and throwing `PageContentError` naming the section and prop.
- [x] T063 [P] [US4] Create `Offerings.astro` and `Offering.astro` in `src/components/sections/` (list semantics, heading levels per plan).
- [x] T064 [P] [US4] Create `Figure.astro`, `WideImage.astro` and `FullImage.astro` in `src/components/sections/` (exactly one Markdown image, caption, width classes).
- [x] T065 [US4] Complete the registry in `src/components/sections/index.ts` and confirm `[...slug].astro` passes it as `components` to `<Content />`; pages need no imports.
- [x] T066 [US4] Adopt sections in `src/content/pages/services.mdx` (Lead, Offerings/Offering, TextBlock, CallToAction) and `speaking.mdx` (TextBlock, Offerings, Figure); keep the copy plain and `draft: true`.
- [x] T067 [US4] Run `pnpm exec playwright test --project=sections` (the fixture web server builds the site first) plus all Phase 5 unit and component tests; fix colour or focus failures in the components and note each colour swap for T080. *(Note, for T080: colour swap: dark h4 `lavender-400` #8b6ac8 on dusk-800 #2b283e 3.38:1 became `lavender-300` in `.dark .prose-accent h4` (global.css), which passes axe. Added `overflow-wrap: anywhere` to `.prose-accent` so a long unbroken address wraps. Results: vitest 900 passed; `--project=sections` 17 passed with the real Playwright config (needs `ASTRO_PREVIEW_BACKGROUND=1` in an agent shell, because Astro 7 auto-backgrounds `astro preview` when it detects an agent). Full Playwright run: 483 passed, 15 failed = 8 home/about + 4 sections baselines missing, 2 footer-desktop year diffs (Phase 9), and one intermittent axe contrast failure on the home CTA during its colour transition (Phase 4 component, different viewport each run).)*

**Checkpoint**: every section works on a page with no imports and passes accessibility checks.

## Phase 6: User Story 5 (broken page files fail clearly) — Priority: P2

**Goal**: every content mistake in contracts/build-errors.md fails the build naming the file and the problem.

**Independent test**: `pnpm exec vitest run tests/build/page-validation.test.ts` passes all 17 rows.

- [x] T068 [US5] Run `tests/build/page-validation.test.ts` now and record which of the 17 rows are still red (the tests were written in T014 and must already exist; do not weaken any assertion). Each red row is a work item for T069 to T072.
- [x] T069 [US5] Fix schema-derived rows 1 to 6: make sure Astro's collection error, or a wrapped `PageContentError`, names the file and key (for the `image()` helper of row 6, also the image path). Adjust `src/content.config.ts` or `src/content/schemas/*.ts`, not the tests.
- [x] T070 [US5] Fix body-derived rows 8 to 10 and 16: confirm `validatePageBody`, already wired into `src/pages/[...slug].astro` by T039, runs before rendering (move it to a loader step only if needed) so the message names the file, the section (with the list of valid sections) or "use ##".
- [x] T071 [US5] Fix section-prop rows 11 and 12 in `src/components/sections/*.astro` and address rows 13, 14 and 17 in `src/lib/content/address.ts`, and navigation row 15 in `src/lib/content/navigation.ts`, so the message names the file(s), the section or the address as the contract states.
- [x] T072 [US5] Confirm row 7 (missing body image) fails with Astro's own message containing the image path; no code change unless it does not fail.
- [x] T073 [US5] Run `pnpm run test` fully; all 17 rows and the one-file-page test must pass, along with every unit, component and build test so far.

**Checkpoint**: invalid content cannot build; a failing build blocks the merge (FR-009).

## Phase 7: User Story 6 (legal and technology pages carried over) — Priority: P2

**Goal**: Terms of use and Technology start from the current site's pages at the same addresses, corrected for the new site.

**Independent test**: `/terms-of-use/` and `/technology/` render the carried-over copy with no references to Ghost, members, subscriptions or comments.

### Tests first (write, run, and see fail before T077 onward)

- [x] T074 [US6] Extend `tests/unit/content/launch-content.test.ts` for `terms-of-use.mdx` and `technology.mdx`: real copy (more than the T043 stubs, e.g. at least several paragraphs), `draft: true`, no case-insensitive match for "Ghost", "member", "subscribe", "comment", "Drift", "Convergence" or "News" category references; both pass `pageSchema`. Run and confirm it fails against the stubs.

### Implementation

- [x] T075 [US6] Fetch the current site's Terms of use (https://www.doncoleman.ca/terms-of-use/) and Technology (https://www.doncoleman.ca/technology/) pages as the starting copy (curl or WebFetch; save raw text in the scratchpad, not the repo). If the site is unreachable, fall back to short draft placeholders and say so in the task notes. *(Note: both live pages were fetched with curl; raw HTML stayed in the scratchpad.)*
- [x] T076 [US6] Rewrite `src/content/pages/terms-of-use.mdx` and `src/content/pages/technology.mdx` from that copy: plain language, corrected for the new site (remove the removed features listed in T074, describe the actual stack: Astro, Cloudflare, Tailwind, the contact form's storage in Toronto as planned), keep the same addresses, `draft: true`. Run T074 and confirm it passes.
- [ ] T077 [P] [US6] [PREVIEW-CHECK] Don reads the Privacy policy, Terms of use and Technology pages on the preview deployment for accuracy against the new site and reviews the placeholder copy on Home, Services, Speaking and About.

**Checkpoint**: all seven pages carry real draft copy.

## Phase 8: Documentation

**Purpose**: document the shared structure and Don's guide. Tests first.

- [x] T078 [P] Write `tests/unit/site/docs-content-structure.test.ts`: `docs/design-source.md` contains a "Content structure" section naming each path in the plan's shared-structure table (`src/content.config.ts`, `src/content/schemas/`, `src/content/pages/`, `src/components/sections/`, `src/components/page/`, `src/layouts/PageLayout.astro`, `src/lib/content/`, `src/pages/[...slug].astro`, `docs/pages.md`), the Flux mapping rows (`page.hbs`, `layout-author-hero.hbs`, `content-feature-image.hbs`, `kg-width-wide` and `kg-width-full`), and an accessibility adjustments subsection; `docs/pages.md` exists, lists every settings key, gives the description-length guidance (about 50 to 160 characters, not enforced) and has one example per section (FR-012, FR-031). Run and confirm it fails.
- [x] T079 Document the shared content and component folder structure in `docs/design-source.md` (new "Content structure" section: the plan's table with what each later feature adds, and the mapping updates table from the plan).
- [x] T080 Record every colour substitution made for contrast (from T053, T067 and any later a11y fix) in `docs/design-source.md`: original Flux class, replacement, both contrast ratios and the component; if none were needed, say so in one sentence.
- [x] T081 [P] Create `docs/pages.md`: Don's guide (where page files go, addresses from paths, every settings key from data-model.md, description-length guidance (about 50 to 160 characters, not enforced), draft notice, navigation, images, and one short example of each section with its rules from contracts/sections.md), in plain language.
- [x] T082 Run T078 and confirm it passes.

## Phase 9: Polish, baselines and release gate

- [ ] T083 Check `docker info`; if it fails, ask Don through `AskUserQuestion` (put the instruction in the question text) to start Docker Desktop, and do not fall back to CI without asking.
- [ ] T084 Update the macOS visual baselines with `pnpm run test:visual:update` (home and about at 390 and 1280 px, and the sections fixture at phone and desktop, in both themes). Inspect the new images; confirm the existing header, footer, menu and not-found baselines are byte-identical in `git status`. Any unexpected change to them is a regression to fix, not to refresh.
- [ ] T085 Update the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; the fixture web server builds the sections fixture inside the container) and commit both sets in `tests/e2e/visual.spec.ts-snapshots/`. If Docker cannot be started, use the `visual-baselines` PR label fallback from CLAUDE.md.
- [ ] T086 Run `pnpm run test:visual` on macOS to confirm the baselines match, including the sections fixture shots.
- [ ] T087 Run `pnpm run verify` (`lint:secrets`, `lint`, `typecheck`, `test`, `build`, `test:e2e`, whose fixture web server runs `build:fixtures`) bounded by `perl -e 'alarm 1500; exec @ARGV' pnpm run verify`; it must be fully green. Do not skip or weaken any check.
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
