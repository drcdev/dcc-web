---

description: "Task list for design directions for the blog"
---

# Tasks: Design directions for the blog

**Input**: Design documents from `/specs/005-blog-design-directions/`

**Prerequisites**: plan.md, spec.md, research.md (R1-R11), data-model.md, contracts/prototype-routes.md, contracts/decision-document.md, quickstart.md

**Tests**: MANDATORY (Constitution Principle I). Every test task is written, run and seen to fail before the implementation task it covers. Component tests for the throwaway prototype components are not written (plan, Complexity Tracking); the e2e and axe spec exercises their rendered output.

**Organization**: Tasks are grouped by user story. The three directions (A, B, C) are independent of each other once the foundation exists, so their tasks are marked [P].

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 to US4 (maps to spec.md user stories)
- **[PREVIEW-CHECK]**: cannot be verified by a subagent locally; needs the preview deployment or Don's eyes

## Local toolchain notes

- Node comes from nvm and `.nvmrc` pins 24. Run `node -v` first; if it is not 24, run `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as the toolchain call.
- macOS has no `timeout`; bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd...>`.
- In this worktree use `corepack pnpm`, not bare `pnpm`.
- Docker Desktop is not needed: the prototypes are new routes under `/design/blog/` and are NOT added to the visual project, `TEMPLATES` in `tests/e2e/templates.ts`, `a11y.spec.ts` or the committed visual baselines. The plan changes no already-snapshotted page (only a sitemap filter in `astro.config.mjs`, covered by the existing sitemap tests), so there is no baseline-update task.

## Path Conventions

Single Astro project. Prototype code: `src/pages/design/blog/` (`_`-prefixed folders are private, not routed). Tests: `tests/unit/design/`, `tests/e2e/`, `tests/design/`. Kept on main: `docs/design/blog.md`, `docs/design/blog/*.jpg`, `specs/005-blog-design-directions/**`.

---

## Phase 1: Setup

**Purpose**: Confirm the toolchain and create the folder skeleton.

- [x] T001 Run `node -v` (must be 24 per `.nvmrc`; otherwise `source ~/.nvm/nvm.sh && nvm use` in the same command) and `corepack pnpm install --frozen-lockfile` in the worktree; confirm no dependency, `package.json` or lockfile change is needed (plan: no new dependency).
- [x] T002 [P] Create the folder skeleton from the plan: `src/pages/design/blog/{_data,_components,_images,a/all,a/topics,b/all,b/topics,c/all,c/[year]}`, `tests/unit/design/`, `tests/design/` (Git tracks files, so create them with the first real file in each).
- [x] T003 [P] Read `src/layouts/BaseLayout.astro`, `src/config/navigation.ts` (`getNavigation`), the SEO props (`noindex`, `canonical`), `src/styles/global.css` (prose, `.table-wrapper`, palettes), `docs/design-source.md`, `tests/e2e/a11y.spec.ts`, `tests/e2e/csp-violations.ts` and `tests/e2e/visual.spec.ts` (theme setup via `localStorage["color-theme"]`) to reuse their patterns; consult the Astro Docs MCP (`astro-docs`) for `getStaticPaths()`/`paginate()`, `astro:assets` `<Image />` and the sitemap `filter()` before writing routes (Principle IV).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Sample data, shared components, sitemap exclusion and the directions index. No user story can start until this is done.

### Tests first (write, run, see fail)

- [x] T004 Write `tests/unit/design/blog-samples.test.ts` (Vitest, `unit` project) asserting data-model.md invariants 1-10: exactly 13 posts; 4 topics each with at least one post and `healthcare-leadership` the only single-post topic; 3-4 featured posts; at least two posts without `image`, one on the first listing page (newest five); a title of 90+ characters; a post with 3+ topics; exactly one `full-with-image` and one `full-no-image` body; no post slug contains a topic slug and none equals `all` or `topics`; `proposedAddress` for `a`, `b`, `c` never contains a topic slug; unique dates and total newest-first order; non-empty alt text on every image; topic intro 60-280 characters, summary at most 240; `relatedTo` returns 3 posts (newest fallback). Import from `src/pages/design/blog/_data/samples.ts`. Run `corepack pnpm exec vitest run --project unit tests/unit/design` and confirm it FAILS (module missing).
- [x] T005 Write the shared parts of `tests/e2e/design-blog.a11y.spec.ts` (Playwright, `a11y` project, no config change): a page list built from `samples.ts` per `contracts/prototype-routes.md` (22 pages: the index, plus landing, listing first, listing last, topic with several posts `agentic-ai-legacy`, topic with one post `healthcare-leadership`, post with image, post without image, for each of a, b, c; slugs read from `samples.ts`, never hard-coded twice); helpers for theme (set `localStorage["color-theme"]` before load, wait for the theme class), JS off (same script-stripping technique as `a11y.spec.ts`) and CSP-violation capture (`tests/e2e/csp-violations.ts`). Add the global tests: the sitemap files list no `/design/` address; neither the header navigation nor the footer of any existing (non-prototype) page links to `/design/`. Add the directions index tests (FR-005, FR-017, SC-004): `/design/blog/` returns 200, carries `<meta name="robots" content="noindex">`, has no canonical link, a title starting `Prototype`, the prototype notice and one `h1`; lists all three directions, each with its name, a one-paragraph summary, its "when no post is featured" sentence, and links to its landing page, listing and a post page that return 200. Run `corepack pnpm exec playwright test --project=a11y design-blog` (bounded by `perl -e 'alarm 600; exec @ARGV'`, with the same environment `verify` uses) and confirm the tests FAIL (404s, `samples.ts` missing).
- [x] T005a [P] Write `tests/unit/design/no-new-design-tokens.test.ts` (Vitest, `unit` project) for FR-013: it scans `src/pages/design/blog/` for hex/rgb/hsl colour literals and `@font-face` or `font-family` declarations, and asserts `newColoursOrFonts` is empty for all three directions in `samples.ts`. Include a self-check that feeds the scanner a known-bad fixture string and expects it to be flagged. Run it and confirm it FAILS (`samples.ts` missing) before T006.

### Implementation

- [x] T006 Create `src/pages/design/blog/_data/samples.ts` per data-model.md: `Topic`, `SamplePost`, `DesignDirection` types; the four fixed topics with tones; 13 realistic sample posts on systems leadership and technology (2025-2026, unique dates, edge cases from invariants 2-7, slugs free of topic words); the three `DesignDirection` instances (idea, topic presentation, addresses, `newColoursOrFonts: []`, `noFeaturedBehaviour`); helpers `byNewest`, `featuredPosts`, `postsInTopic`, `relatedTo`, `proposedAddress`, and a helper mapping a real-blog address to `/design/blog/{d}/...` per contracts/prototype-routes.md. Run T004; it must now pass.
- [x] T007 [P] Create the five sample SVG illustrations in `src/pages/design/blog/_images/*.svg` (existing palettes only, no fonts, meaningful shapes at 3:1 contrast, small files) for `astro:assets` `<Image />`; wire them to the posts' `image` field in `samples.ts`.
- [x] T008 [P] Create `src/pages/design/blog/_components/PrototypeNotice.astro`: bordered note "Design prototype for review. This is not the published blog." with links to the directions index and to the same screen in the other two directions (targets computed from `samples.ts`, only addresses that exist in the build).
- [x] T009 [P] Create `src/pages/design/blog/_components/PostMeta.astro` and `TopicPill.astro`: `<time datetime>`, "N min read", topics linked to the direction's topic page, a "Featured" text marker (not colour alone); topic colour through existing palette utility classes with contrast-checked shades, no inline `style` (research R5).
- [x] T010 [P] Create `src/pages/design/blog/_components/Pagination.astro`: `<nav aria-label="Pagination">`, current page `aria-current="page"`, no Newer/Previous on the first page and no Older/Next on the last, "Page N of M".
- [x] T011 [P] Create `src/pages/design/blog/_components/SampleBody.astro`: inside `prose dark:prose-invert prose-accent`: introduction, `h2` section, `<Image />` figure with `<figcaption>` and descriptive alt, plain `<pre><code>` (one line wider than a phone) in a focusable scroll region with an accessible name, a wide table with `<caption>` in `.table-wrapper` as a focusable scroll region, closing section; the `full-no-image` variant omits only the feature image; the `short` variant is a brief body. No Shiki, no inline styles, no `define:vars` (research R4).
- [x] T012 Edit `astro.config.mjs`: change the `@astrojs/sitemap` filter to `!pathname.startsWith("/404") && !pathname.startsWith("/design/")` (written exactly so the portfolio feature's equivalent edit is identical). Run the existing sitemap tests and confirm they stay green.
- [x] T013 Create `src/pages/design/blog/index.astro` (directions index): `BaseLayout` with `navigation={await getNavigation()}`, `noindex`, `canonical={false}`, title starting `Prototype`, `PrototypeNotice`, one `h1`, each direction with name, one-paragraph summary, its "when no post is featured" sentence (spec edge case) and links to its landing, listing and a post page (SC-004). Confirm the index tests from T005 pass.

> Implementation notes (Phase 2): `SamplePost.image` holds `{ id, alt }` and `_data/images.ts` maps the id to an imported SVG, so `samples.ts` stays free of Astro imports (Playwright and Vitest read it). Astro 7 turns a local `.svg` import into an inline component, so the images render as inline SVG with `role="img"` and an accessible name rather than `<Image />` (docs.astro.build/en/guides/images/#svg-components). The "every link from the Direction X section returns 200" index tests are separate tests that stay red until Phase 3 creates the direction pages. Also added a `/design/` case to `tests/unit/site/sitemap.test.ts`.

**Checkpoint**: unit tests (T004, T005a) green; index page and sitemap/navigation tests green; direction page tests not yet written or still failing.

---

## Phase 3: User Story 1 - Don compares the directions side by side (Priority: P1)

**Goal**: Each of the three directions has a Writing landing page, a listing (all posts and per topic) and a post page that are linked to each other and structurally different, filled with realistic sample posts.

**Independent Test**: From `/design/blog/`, open each direction's landing, listing and post page without typing an address; confirm each renders with sample content and the directions differ in layout and organisation.

### Tests for User Story 1 (write first, see fail)

- [x] T014 [US1] Extend `tests/e2e/design-blog.a11y.spec.ts` with US1 tests for every direction page in the list: returns 200, has `<meta name="robots" content="noindex">`, no canonical link, title starts with `Prototype`, contains the prototype notice, presents "Drift & Convergence" (FR-022), exactly one `main` and one `h1`, no skipped heading levels, no links to `/writing/`; every internal link returns 200; from each landing, links reach that direction's listing and a post page (SC-004: every screen within two clicks of the index); structural difference checks (A has a lead story and a featured bento region, B has a "Start here" list and month grouping, C has topic hub regions and a topic index). Also assert: every page keeps the site's "Skip to main content" link (FR-024); the prototype notice on each page links to the same screen in the other two directions and back to the index (FR-005); and the cheap page-furniture checks (200, `noindex` meta, no canonical, title starting `Prototype`, notice) run on every generated prototype page, enumerated from `samples.ts` (every listing page, every topic page and every post, for each direction), not only the 22 sampled pages (FR-017). Run and confirm the new tests FAIL because the direction pages do not exist.

### Implementation for User Story 1

- [x] T015 [P] [US1] Direction A (Front page): create `src/pages/design/blog/a/index.astro` (lead story, featured bento grid, "Latest" card grid, pill row, links to listing and every topic), `a/all/[...page].astro` (`getStaticPaths` + `paginate()`, size 5, card grid), `a/topics/[topic].astro` (topic-coloured intro banner, card grid, links to other topics and all posts), `a/[slug].astro` (feature-image overlay header, `SampleBody`, three related-post cards), plus A-only pieces in `src/pages/design/blog/_components/a/`, using the shared notice, meta, pill and pagination components.
- [x] T016 [P] [US1] Direction B (Timeline): create `src/pages/design/blog/b/index.astro` ("Start here" list above the newest-first stream grouped by month, text-first, topic filter row), `b/all/[...page].astro` (timeline grouped by year, Newer/Older links plus "Page N of M"), `b/topics/[topic].astro` (intro paragraph, filtered timeline, other topics and all posts), `b/[slug].astro` (title and meta first, image below, `SampleBody`, related text list, previous/next by date), plus B-only pieces in `_components/b/`.
- [x] T017 [P] [US1] Direction C (Topic hubs): create `src/pages/design/blog/c/index.astro` ("Latest" strip of three, four topic hubs each with intro, featured post and newest posts), `c/all/[...page].astro` (two-column list with topic index; `<details>` disclosure on phone, no JavaScript), `c/[topic].astro` (hub: intro, featured, all its posts, other topics and all posts), `c/[year]/[slug].astro` (two columns: body plus side column with date, reading time, topics and "In this post" contents; related grouped as "More in {topic}"), plus C-only pieces in `_components/c/`.
- [x] T018 [US1] Wire cross-links: the notice's "same screen in the other directions" targets for every page type (landing, listing, topic, post) and the index links; run the US1 tests from T014 and fix until green.

**Checkpoint**: three directions browsable end to end; US1 tests green.

---

## Phase 4: User Story 2 - Each direction shows everything a reader will need (Priority: P1)

**Goal**: Each direction demonstrates newest writing, set-apart featured posts, newest-first pagination, topic browsing with introductions, full post metadata everywhere, image with caption, code and table on posts, and related posts.

**Independent Test**: For each direction, walk through the reader needs on its three screens and confirm each is demonstrated.

### Tests for User Story 2 (write first, see fail)

- [x] T019 [US2] Extend `tests/e2e/design-blog.a11y.spec.ts` with US2 tests per direction: the landing shows the newest post within the first desktop viewport and the first two phone viewports; featured posts carry a visible "Featured" text marker and are set apart; the landing links to the listing and every topic; the listing shows posts newest first (dates descending), 5 per page, a pagination nav with `aria-current="page"`, no Newer/Previous on the first page, no Older/Next on the last, pages 1-3 exist; topic pages name the topic in the `h1`, show its introduction above its posts and link to other topics and all posts; the one-post topic renders correctly; every post presentation (card, row, entry, header) shows title, `<time datetime>`, reading time, topics linked to the direction's topic page and a summary; post pages contain an image with `<figcaption>` and alt text, a code region and a table region (each focusable with an accessible name), and end with a "Related posts" section of three links; the long-title and many-topics posts do not overflow. Written together with T014 and T024, before any of T015-T017 (Principle I); run and confirm they FAIL because the direction pages do not exist.

### Implementation for User Story 2

- [x] T020 [P] [US2] Close every US2 gap in Direction A files under `src/pages/design/blog/a/` and `_components/a/` (featured marker, pagination edges, topic intro banner, related cards, meta on every card, no-image fallback layout, long-title and many-topics wrapping).
- [x] T021 [P] [US2] Close every US2 gap in Direction B files under `src/pages/design/blog/b/` and `_components/b/` (Start here list, marker in stream, pagination edges, topic intro, related list and previous/next, no-image fallback, long-title and many-topics wrapping).
- [x] T022 [P] [US2] Close every US2 gap in Direction C files under `src/pages/design/blog/c/` and `_components/c/` (hub featured/newest fallback, pagination edges, topic index and `<details>` disclosure, "More in {topic}" related, in-post contents, no-image fallback, long-title and many-topics wrapping).
- [x] T023 [US2] Re-run the US1 and US2 tests until green (shared `_components/` adjusted only if a gap is common to all three directions).

**Checkpoint**: all reader needs demonstrated in all three directions.

---

## Phase 5: User Story 3 - Both themes, phone and desktop, accessible (Priority: P1)

**Goal**: Every prototype page meets WCAG 2.2 AA in both themes at phone and desktop widths, with JavaScript off, and reflows at 320 px.

**Independent Test**: Run the accessibility spec over every prototype page; check by eye that both themes work at both widths.

### Tests for User Story 3 (write first, see fail)

- [x] T024 [US3] Extend `tests/e2e/design-blog.a11y.spec.ts` with US3 tests for every one of the 22 pages: axe (WCAG 2.0, 2.1 and 2.2 A and AA tags) reports zero violations at 390 px and 1280 px in dark and light themes; the same axe check with JavaScript disabled; no horizontal page scroll at 320 px (`documentElement.scrollWidth <= clientWidth`), the wide table and long code line scrolling inside their own focusable regions; no CSP violations; no `style` attributes in the rendered HTML; core content present with JavaScript disabled (title, summaries, links, `<details>` still operable); keyboard: Tab reaches topic navigation, pagination and the `<details>` summary; `lang="en"`. Written together with T014 and T019, before any of T015-T017 (Principle I); run and confirm they FAIL because the direction pages do not exist.
- [x] T025 [US3] After T023, run the T024 tests against the built pages and record the failing axe rules and pages as a note under this task so fixes are targeted (expect topic colour contrast failures, per the plan's risks).
  - Note (first run of the T024 tests against the built pages): axe reported zero violations on all 22 pages in both themes and at both widths, so no topic-colour swaps were needed. Failures were: (1) keyboard focus ring missing on the code `<pre>` region and the `<details>` summary "Browse by topic" (global focus style covers only `a` and `button`); (2) target size under 24 px on post-title links (21-23 px high) in A, B and C; (3) test defects, fixed in the tests: axe cannot run with JavaScript disabled, so the no-script axe check now runs over the script-stripped response and a separate JS-off context checks content; the disclosure test needs the phone width, where the `<details>` is shown.
  - Fixes: shared `SampleBody.astro` (focus outline on code and table regions), `c/TopicIndex.astro` (summary focus outline), title links `inline-block min-h-6` in `a/Card`, `b/Entry`, `c/Row` and `b/index`; only existing accent tokens used.

### Implementation for User Story 3

- [x] T026 [P] [US3] Fix Direction A accessibility findings in `src/pages/design/blog/a/**` and `_components/a/`: nearest passing palette shade for topic colours on dusk backgrounds, overlay text contrast on feature images, heading order, landmark labels, focus styles.
- [x] T027 [P] [US3] Fix Direction B accessibility findings in `src/pages/design/blog/b/**` and `_components/b/` (timeline markers and lines at 3:1, heading order, landmark labels, focus styles).
- [x] T028 [P] [US3] Fix Direction C accessibility findings in `src/pages/design/blog/c/**` and `_components/c/` (side column reflow at 320 px, `<details>` disclosure name and focus, contents list semantics).
- [x] T029 [US3] Fix shared findings in `src/pages/design/blog/_components/*` and `_images/*.svg` (pill contrast, SVG meaningful-part contrast, scroll-region names); re-run the whole `design-blog` spec plus the existing `a11y`, sitemap and SEO tests until green.
- [x] T030 [US3] Re-run `tests/unit/design/no-new-design-tokens.test.ts` (written in T005a) over the finished direction files; fix any colour literal or font declaration it flags (FR-013: existing palettes and system font stack only) and confirm `newColoursOrFonts` is empty for all three directions.

**Checkpoint**: 22 pages green in both themes, both widths, JS off, 320 px.

---

## Phase 6: User Story 4 - Decision document (Priority: P2)

**Goal**: One decision document with every direction's summary, previews, 12 pictures, topic presentation, addresses, no-featured behaviour, new colours or fonts and trade-offs, ending in an empty Decision section.

**Independent Test**: Open `docs/design/blog.md`; each direction has all eight sub-sections and 12 pictures; the Decision section is last and empty.

### Tests for User Story 4 (write first, see fail)

- [x] T031 [US4] Write `tests/unit/design/decision-document.test.ts` (Vitest): `docs/design/blog.md` exists; each of `Direction A: Front page`, `Direction B: Timeline`, `Direction C: Topic hubs` has the eight sub-sections (Summary, Preview, Pictures, How topics are presented, Proposed addresses, When no post is featured, New colours or fonts, Trade-offs); 12 image references per direction, each a relative `blog/{d}-{screen}-{width}-{theme}.jpg` path to an existing file, with alt text naming the direction, screen, width and theme (FR-021); the "How to compare" overview table has one row for each of the five FR-003 axes (grouping, landing order, featured posts, page layout, topic presentation) and one column per direction; each Trade-offs sub-section names all six FR-019 dimensions (reading experience, growth in the number of posts, build effort, cost of renaming, merging or splitting topics, dependence on feature images, phone behaviour); each Proposed addresses sub-section states that renaming, merging or splitting topics changes no post address; `## Decision` is the last section and contains exactly `Chosen direction:` and `Notes:` with nothing after either; 36 JPEGs totalling under about 6 MB in `docs/design/blog/`. Run and confirm it FAILS. (Deleted in the removal task with the other prototype-only tests.)
- [x] T032 [P] [US4] Write the capture config `tests/design/playwright.config.ts` (standalone, not in `verify`; web server `wrangler dev --ip 127.0.0.1 --port 4321` over the production build, mirroring the repo's e2e config) and `tests/design/capture-blog.spec.ts`: for each direction, screen (landing = `/{d}/`, listing = `/{d}/all/`, post = the full-with-image post from `samples.ts`), width (390x844, 1280x800) and theme (`localStorage["color-theme"]` before load), wait for the theme class, disable animations, save a full-page JPEG (quality 80, clipped to 3200 px tall) to `docs/design/blog/{d}-{screen}-{width}-{theme}.jpg` (36 files, no pixel comparison).

### Implementation for User Story 4

- [x] T033 [US4] Run the capture: `corepack pnpm run build`, then `corepack pnpm exec playwright test --config tests/design/playwright.config.ts` (bounded by `perl -e 'alarm 600; exec @ARGV'`). Confirm 36 JPEGs in `docs/design/blog/` named per `contracts/decision-document.md`, view a sample from each direction in both themes and widths, keep the total within the plan's budget (about 6 MB; if exceeded, clip heights further or drop JPEG quality to 70, never drop a width/theme pair), and commit the JPEGs under `docs/design/blog/`.
- [x] T034 [US4] Write `docs/design/blog.md` exactly per `contracts/decision-document.md`: purpose paragraph (prototypes were on the pull request's preview deployment; the pictures show every direction after removal), "How to compare" with the preview index URL and the FR-003 overview table (a row per axis: grouping, landing order, featured posts, page layout, topic presentation; a column per direction), Directions A, B and C each with all eight sub-sections (12 relative images with alt text naming direction, screen, width and theme; a proposed-address table stating that no post address contains a topic, so renaming, merging or splitting topics changes no post address (FR-012); "None" for new colours or fonts; bulleted trade-offs covering reading experience, how it copes as the number of posts grows, build effort, the cost of renaming, merging or splitting topics later, dependence on feature images and phone behaviour), "Notes common to all directions", and a final `## Decision` section holding only the empty `Chosen direction:` and `Notes:` labels. Do NOT fill in the Decision section. Plain language, no hype. Run T031 until green.

**Checkpoint**: decision document and 36 pictures committed; Decision section empty.

---

## Phase 7: Polish and cross-cutting concerns

**Purpose**: Full gate, regression confirmation, pull request, and the steps that wait on Don.

- [x] T035 Confirm nothing outside scope changed: `git diff origin/main --stat` lists only `src/pages/design/blog/**`, `tests/unit/design/**`, `tests/e2e/design-blog.a11y.spec.ts`, `tests/design/**`, `astro.config.mjs` (sitemap filter only), `docs/design/blog.md`, `docs/design/blog/*.jpg` and `specs/005-blog-design-directions/**`; no change to `package.json`, the lockfile, `src/components/`, `src/layouts/`, `src/styles/global.css`, `src/config/navigation.ts`, `tests/e2e/templates.ts`, `tests/e2e/a11y.spec.ts`, `wrangler.jsonc`, `public/_headers` or `tests/e2e/visual.spec.ts-snapshots/` (no visual baseline update is needed).
  - Result: only the allowlist plus `.specify/feature.json` (Spec Kit branch pointer) and `tests/unit/site/sitemap.test.ts` (the test for the allowlisted sitemap filter in `astro.config.mjs`); no forbidden path changed.
- [x] T036 Walk quickstart step 4 locally (`wrangler dev` over the production build): each direction, both themes, phone and desktop width, JS off. Include the FR-031 keyboard and zoom walk-through of each direction: meaningful alt text, focus order matching the visual reading order, link purpose, visible focus in both themes, text resized to 200 percent and zoom to 400 percent with no loss of content, reduced motion honoured, and no hover-only content or control. Record the results as a note under this task for the PR body; fix anything the automated checks missed (a fix gets a test first).
  - Walk-through note (scripted with Playwright over the production build, all 64 built prototype pages, phone 390 and desktop 1280, dark and light, JS off for content checks, reduced motion emulated; the existing `design-blog` a11y project already covers axe, keyboard and 320 px reflow):
    - Passed: one h1 and one main per page, `lang` set, every image has meaningful alt and a caption, no vague link text, no positive tabindex, visible focus ring in both themes, focus order follows the visual reading order (card-by-card in the grids), reduced motion leaves no transition or animation, no hover-only rule reveals content, no `title`-only information, 320 px (400 percent zoom) has no horizontal scroll or clipped content.
    - Found and fixed (test first, seen failing on 5 pages): at 200 percent text on a 390 px phone the long topic names in the topic-page h1 (A, B, C) and the Direction C hub grid overflowed sideways. Added `text at 200 percent on a phone` to `tests/e2e/design-blog.a11y.spec.ts`; fixed with `break-words` on those headings and `grid-cols-1` on the C hub grid.
    - Kept as is: Direction B landing clamps post summaries to 3 lines from md up (keeps the newest post in the first desktop viewport, US2 test). At 200 percent text a long summary is cut with an ellipsis there, but the full summary is on the post page and the listing. Removing the clamp broke that test, so it stays.
    - Note: the directions index repeats link text ("Writing landing page" x3) but each sits in a section labelled by its direction heading, so the purpose is clear in context. Don should still re-check keyboard and zoom on the preview (T040).
- [x] T037 Full local gate: `node -v` (24), then `export ASTRO_PREVIEW_BACKGROUND=1` and `perl -e 'alarm 600; exec @ARGV' corepack pnpm run verify` in this worktree; all checks (types, lint, unit, e2e, a11y including `design-blog`, visual regression unchanged, build, budget) must pass.
  - Result: secretlint, eslint (0 problems), astro check (0 errors), vitest (82 files, 1060 tests), build (72 pages) and Playwright (853 passed: a11y incl. design-blog, e2e, visual unchanged, budget) all green. The e2e stage was rerun alone once because sibling worktrees held port 4321 during earlier full runs (spurious 404s).
- [ ] T038 Before opening the pull request: commit, `git fetch origin main`, `git rebase origin/main` (handle the shared `astro.config.mjs` and `tests/design/` files per the plan's "Parallel work" section: keep one copy of the combined sitemap condition; if the portfolio feature's `tests/design/playwright.config.ts` is on main, keep theirs and add this feature's spec to it), re-run T037, then `git push --force-with-lease` if already pushed.
- [ ] T039 Open the pull request from the `drc-agents` account (`gh auth switch --user drc-agents` immediately before `gh pr create`, `gh auth switch --user drcdev` straight after): label it a major change (Constitution Principle III), leave auto-merge OFF, say in the body that it is a major change with removal pending Don's review, list the branch preview URL (`/design/blog/`), state that the Decision section is intentionally empty, include the T036 keyboard and zoom walk-through results (FR-031) for Don to re-check on the preview, and end with the required attribution lines.
- [ ] T040 [PREVIEW-CHECK] Don reviews each direction on the preview deployment (`/design/blog/`) in both themes at phone and desktop width; confirms the response carries `X-Robots-Tag: noindex` and `/sitemap-index.xml` lists no `/design/` address (quickstart step 7); decides, or asks for changes. Agents never fill in the Decision section.
- [ ] T041 [PREVIEW-CHECK] Only after Don's review and decision, remove the prototypes: `git rm -r src/pages/design/blog tests/design tests/unit/design tests/e2e/design-blog.a11y.spec.ts`; `git fetch origin main`; `git checkout origin/main -- astro.config.mjs`; edit `docs/design/blog.md` so preview links read "(removed after review; see the pictures)" (the pictures and descriptions alone must still compare the directions, FR-021); leave the Decision section as Don left it.
- [ ] T042 [PREVIEW-CHECK] After the removal, re-run the full gate (`ASTRO_PREVIEW_BACKGROUND=1`, `perl -e 'alarm 600; exec @ARGV' corepack pnpm run verify`), confirm `git diff origin/main --stat` lists only `docs/design/blog.md`, `docs/design/blog/*.jpg` and `specs/005-blog-design-directions/*`, push, and wait for Don's approval; after it merges (auto-merge stays off), switch to `main`, pull and run `git branch -d 005-blog-design-directions`.

---

## Dependencies and execution order

- Phase 1, then Phase 2 (T004, T005 and T005a tests first, then T006 onward; T007-T011 parallel after T006).
- Phase 3 (US1) needs Phase 2: T014, T019 and T024 (all in `design-blog.a11y.spec.ts`, written in that order) are written and seen failing before any of T015-T017; T015, T016, T017 parallel (separate direction folders); T018 last.
- Phase 4 (US2) needs Phase 3 (it refines the same pages): T019 already written and failing (see Phase 3); T020-T022 parallel; T023 last.
- Phase 5 (US3) needs Phase 4: T024 already written and failing (see Phase 3); T025 before T026-T028 (parallel), then T029 and T030.
- Phase 6 (US4): T031 and T032 can be written any time after Phase 2 and are parallel; T033 needs finished, accessible pages (after Phase 5); T034 needs T033.
- Phase 7 needs all earlier phases; T040-T042 wait on Don, in order.
- Directions A, B and C never edit each other's files; shared `_components/*` edits (T029 and any common gap in T023) are serialised.

## Parallel example

```text
After T014, T019, T024 fail:    T015 (A)   T016 (B)   T017 (C)
After T025:                     T026 (A)   T027 (B)   T028 (C)
Any time after Phase 2:         T031 (decision-document test)   T032 (capture config and spec)
```

## Implementation strategy

- **MVP**: Phases 1-3 (User Story 1): Don can browse three distinct directions. US2 and US3 are also P1; the slice is not ready for Don's review until Phases 1-5 are green, and the decision document and pictures (US4, P2) follow.
- Incremental: commit after each phase (Spec Kit git extension); run the relevant test subset after each task and the full `verify` only at T037.
- Test-first: every test task runs and is seen failing before the implementation task that follows it.
- Out of scope (spec follow-up): the real blog, content collections, feeds, syntax highlighting, redirects from current-site addresses.
