---
description: "Task list for Frame the Writing pages around Drift & Convergence"
---

# Tasks: Frame the Writing pages around Drift & Convergence

**Input**: Design documents in `specs/013-writing-series/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests are mandatory** (Constitution Principle I). Within each phase every test task comes
before the implementation task it covers. Write the test, run it, and see it fail for the
right reason before implementing. Tests must never reference `specs/` paths (changed-paths
drift guard); cite requirement ids in test names only.

**Major change** (Constitution Principle III): auto-merge stays off; the last task is a
`[PREVIEW-CHECK]` for Don.

**Format**: `- [ ] T### [P?] [Story?] Description with file path`. `[P]` = different files, no dependency on an incomplete task.

**Toolchain reminders**: run `node -v` first (must match `.nvmrc`); `pnpm` runs via `corepack pnpm`; bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd>`.

## Phase 1: Setup

- [ ] T001 Confirm a clean baseline: run the Vitest suite and `pnpm run build` on the branch and note any pre-existing failures; confirm `.reference/flux` is present (copy it into the worktree if not) for palette reference.
- [ ] T002 [P] Add fixture posts in `tests/fixtures/posts/valid/` (one in `drift`, one in `convergence`, one untagged, one whose only topic is free-form `cloud-cost`, one with a series plus a free-form topic) and in `tests/fixtures/posts/broken/` (rows P23 `topics: [drift, convergence]`, P24 `convergance`, P25 files `drift.mdx` and `convergence.mdx`, P26 `Cloud Cost` and a 41-character id), per `contracts/build-errors.md`.

---

## Phase 2: Foundational (blocks all user stories)

Controlled topic list, colour tokens and pure helpers that every story reads.

- [ ] T003 [P] Write failing unit tests in `tests/unit/content/topics.test.ts`: six controlled entries in the FR-010a order; `drift` and `convergence` have `series: true`; colours Compliant data `rust`, Technology teams `sand`, Agentic AI `mauve`, Healthcare leadership `mist`, Drift `lavender`, Convergence `sage`, all unique; `pillRowTopics` excludes series; `topicHref` and `otherSeries` behave per data-model.md.
- [ ] T004 [P] Write failing unit tests in `tests/unit/content/topic-ids.test.ts` for new `src/lib/content/topic-ids.ts`: `editDistance`, `nearMiss` (names the controlled id), `topicLabel` (`cloud-cost` to "Cloud cost"), `orderTopics` (series first, others in written order), `mainTopic` (series, else first topic).
- [ ] T005 [P] Write a failing contrast unit test in `tests/unit/content/topic-contrast.test.ts` that reads the theme tokens from `src/styles/global.css` and asserts 4.5:1 for every controlled pill, series marker, controlled banner, series banner, the `dusk` free-form pill and `dusk` plain banner in light and dark, and 3:1 for the 2px marker outline (shade 700 light / 300 dark) against fill and surface (FR-010, FR-010a, FR-016c).
- [ ] T006 Add `mauve` and `sand` palette tokens (same shade pattern as existing palettes, both themes) to `src/styles/global.css`, taking values from `.reference/flux`; confirm `dusk` already exists. No other new colours.
- [ ] T007 Update `src/config/topics.ts`: add `drift` and `convergence` (`series: true`, descriptions from the About copy, flux colours), recolour `agentic-ai` to `mauve` and `technology-teams` to `sand`, and export `controlledIds`, `seriesIds`, `pillRowTopics`, `topicHref`, `otherSeries`. Makes T003 pass.
- [ ] T008 Create `src/lib/content/topic-ids.ts` with `editDistance`, `nearMiss`, `topicLabel`, `orderTopics`, `mainTopic` (pure, no dependency). Makes T004 pass.
- [ ] T009 Add `mauve`, `sand`, `dusk` entries and series-marker classes (semibold, 2px solid border in shade 700 light / 300 dark; forced-colours keeps the 2px outline in the system text colour) to `src/components/post/topic-styles.ts`. Makes T005 pass; record the computed contrast values in `specs/013-writing-series/research.md` (FR-016c).

**Checkpoint**: topic list, tokens and helpers pass their unit tests.

---

## Phase 3: User Story 2 - Don tags a post into a series (P1)

**Goal**: a series id in `topics` joins the post to the series; bad content fails the build with a plain message naming the file.

**Independent test**: tag a fixture post `drift`, build, see it on the Drift page; both-series, near-miss, bad-id and reserved-slug fixtures each fail the build with the contract message.

### Tests (write first, see fail)

- [ ] T010 [P] [US2] Extend `tests/unit/content/post-schema.test.ts`: free-form ids accepted; `[drift, convergence]` rejected naming both ids and "one series" (P23); `[drift, drift]` rejected by the named-once rule, not the both-series rule; near-miss `convergance`, `drfit`, `agentic-a` rejected naming the intended id (P24); bad ids `Cloud Cost` and 41+ chars rejected with the id-rule message (P26); revised P6 (`agentic-a1` says `Did you mean "agentic-ai"?` and lists controlled ids in list order).
- [ ] T011 [P] [US2] Extend `tests/unit/content/post-address.test.ts`: `drift` and `convergence` slugs rejected, message names the file, `/writing/drift/` (or convergence) and "reserved" (P25); `all` and `topics` still reserved.
- [ ] T012 [P] [US2] Extend `tests/build/post-validation.test.ts` with fixture-build rows P23 to P26, revised P6 and P21 (removed topic id now builds as free-form), and the must-build cases: untagged post builds with a silent build (no warning output), free-form-only post builds, series plus others builds; assert drafts are validated too (FR-012a).

### Implementation

- [ ] T013 [US2] Update `src/content/schemas/post.ts`: accept free-form ids, keep the id-format rules, and in `superRefine` fail on both series and on near-miss ids with the contract messages (uses `topic-ids.ts`). Makes T010 pass.
- [ ] T014 [US2] Add the series ids to `RESERVED` in `src/lib/content/post-address.ts` and make `assertPostFiles` raise the P25 message. Makes T011 pass.
- [ ] T015 [US2] Tag the four posts in `src/content/posts/*.mdx` with the series id first in `topics` (FR-005): Convergence for `the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change` and `starting-something-new`; Drift for `building-focus-pocus-what-i-learned-about-ai-coding-and-integration` and `self-contained-development-for-ghost-themes`. Leave `sample-everything` untouched. Update `tests/unit/content/sample-posts.test.ts` if it pins topics.
- [ ] T016 [US2] Run T010 to T012 and the full Vitest suite; fix until green.

**Checkpoint**: content model complete; US2 independently testable.

---

## Phase 4: User Story 4 - Series pages and redirects (P2, built before the landing links to them)

**Goal**: `/writing/drift/` and `/writing/convergence/` are canonical, with a rich banner; old topic addresses 301 to them.

**Independent test**: open both series pages, check banner, only-own posts and links; request the old addresses and see 301.

### Tests (write first, see fail)

- [ ] T017 [P] [US4] Component test `tests/component/post/SeriesBanner.test.ts`: one `h1` with the series name, "Series" eyebrow is a `p`, description, links "Read {other series}" and "All writing", no new landmark, short-address hrefs.
- [ ] T018 [P] [US4] Extend `tests/component/post/TopicBanner.test.ts`: a free-form topic renders a plain `dusk` banner with sentence-case label and the same heading structure as a controlled topic.
- [ ] T019 [P] [US4] Unit test `tests/unit/site/redirects.test.ts` for `public/_redirects`: 301 rules for `/writing/topics/drift/`, `/writing/topics/drift/:page/`, and the same for convergence; targets use the short address; no rule targets a redirected address (no loop); rule count under Cloudflare limits.
- [ ] T020 [P] [US4] Build test in `tests/build/blog-listing.test.ts`: `/writing/drift/` and `/writing/convergence/` exist and paginate at `/writing/{id}/2/`; `/writing/topics/drift/` and `/writing/topics/convergence/` are NOT built; a free-form topic page is built from the fixture posts; a free-form id used only by a draft gets no page in production; an empty series page shows the existing empty-listing message.
- [ ] T021 [P] [US4] E2E tests in `tests/e2e/blog.spec.ts`: a series page lists only posts tagged with that series and shows the banner links; the other-series link and "All writing" link work. E2E tests in `tests/e2e/blog-fixtures.spec.ts` (fixture site): a free-form topic page renders a plain banner and listing; an empty series page shows the empty message.
- [ ] T022 [US4] E2E redirect test in `tests/e2e/blog.spec.ts` using `request.get(url, { maxRedirects: 0 })`: `/writing/topics/drift/`, `/writing/topics/drift/2/` and `/writing/topics/convergence/` return status 301 with a `Location` header on the short address. The default `e2e` project runs against `wrangler dev` (see `playwright.config.ts`), which serves `dist/` and `public/_redirects`, so this test runs locally. Do not place it in the fixture-site project: that one uses `astro preview`, which ignores `_redirects`, so a redirect assertion there could only pass on the Worker. If the E2E server is ever changed to `astro preview`, mark this test `[PREVIEW-CHECK]` and cover it with T019 locally.
- [ ] T023 [P] [US4] Accessibility tests in `tests/e2e/blog.a11y.spec.ts`: axe on `/writing/drift/`, `/writing/convergence/`, a controlled topic page; in `tests/e2e/blog-fixture.a11y.spec.ts`: axe on a free-form topic page and an empty series page; heading order has no skipped level.

### Implementation

- [ ] T024 [P] [US4] Create `src/components/post/SeriesBanner.astro` (FR-009, FR-016a, FR-016b). Makes T017 pass.
- [ ] T025 [P] [US4] Update `src/components/post/TopicBanner.astro` to render a plain `dusk` banner for free-form ids. Makes T018 pass.
- [ ] T026 [P] [US4] Create `public/_redirects` with the two static and two splat 301 rules (research R3, contracts/writing-pages.md). Makes T019 pass.
- [ ] T027 [US4] Create `src/components/post/SeriesPage.astro` (shared body: banner, listing, pagination) and routes `src/pages/writing/drift/[...page].astro` and `src/pages/writing/convergence/[...page].astro` using `paginate()` at `blog.pageSize`.
- [ ] T028 [US4] Update `src/pages/writing/topics/[topic]/[...page].astro`: exclude series ids, add free-form ids from visible posts, plain banner for them. Makes T020 pass.
- [ ] T029 [US4] Run `pnpm run build`, then T017 to T023 against the built site (`wrangler dev` serves it); fix until green.

---

## Phase 5: User Story 3 - Series markers everywhere pills appear (P2)

**Goal**: "Series: Drift" / "Series: Convergence" marker, first, linking to the series page; free-form pills neutral; text-only cards take the series border.

**Independent test**: open each page type with a tagged and an untagged post; the marker is distinct without colour and the untagged post is unchanged apart from the recolour.

### Tests (write first, see fail)

- [ ] T030 [P] [US3] Component test `tests/component/post/SeriesMarker.test.ts`: text "Series: Drift", link text is the full visible text with no `aria-label`, href is the short address, semibold and 2px outline classes, 24x24 target.
- [ ] T031 [P] [US3] Extend `tests/component/post/TopicPill.test.ts`: series ids delegate to `SeriesMarker`; a free-form id renders a neutral `dusk` pill with sentence-case label linking `/writing/topics/{id}/`; controlled pills use mauve and sand.
- [ ] T032 [P] [US3] Extend `tests/component/post/TopicPillRow.test.ts`: the row contains only non-series controlled topics, never free-form.
- [ ] T033 [P] [US3] Extend `tests/component/post/PostCard.test.ts`, `LeadStory.test.ts`, `PostMeta.test.ts` and `RelatedPosts.test.ts`: series marker first then other topics in written order; a text-only card's border takes the series colour, otherwise the first topic; an untagged card is unchanged; the title stays the card's only link to the post; related posts show markers.
- [ ] T034 [P] [US3] E2E tests in `tests/e2e/blog.spec.ts` for SC-002: marker present on the landing, `/writing/all/`, a topic page, a series page, the post header, home "Recent writing" and related posts for tagged posts, absent for untagged; the post-header marker links to the series page.
- [ ] T035 [P] [US3] Accessibility tests in `tests/e2e/blog.a11y.spec.ts`: axe on a post page, `/writing/all/` and the landing with markers present, light and dark themes; reflow with no horizontal scroll at 320 px and 200% zoom.
- [ ] T036 [P] [US3] Forced-colours E2E test in new `tests/e2e/blog-forced-colors.spec.ts` (model on `tests/e2e/projects-forced-colors.spec.ts`): with forced colours emulated the marker keeps a 2px outline and its "Series:" text and an ordinary pill keeps a 1px border (FR-016d).

### Implementation

- [ ] T037 [US3] Create `src/components/post/SeriesMarker.astro`. Makes T030 pass.
- [ ] T038 [US3] Update `src/components/post/TopicPill.astro` (series delegates, free-form neutral) and `src/components/post/TopicPillRow.astro` (non-series controlled only). Makes T031 and T032 pass.
- [ ] T039 [US3] Update `src/components/post/PostCard.astro`, `LeadStory.astro` and `PostMeta.astro` to use `orderTopics` and `mainTopic` (series first; series border on text-only cards). Makes T033 pass.
- [ ] T040 [US3] Run T030 to T036; fix until green. Confirm no client JavaScript was added.

---

## Phase 6: User Story 1 - Writing landing framing (P1)

**Goal**: `/writing/` opens with a framing lead describing both series, with a link into each.

**Independent test**: build, open `/writing/`, read the lead with JavaScript off, follow each link.

### Tests (write first, see fail)

- [ ] T041 [P] [US1] Component test `tests/component/post/SeriesIntro.test.ts`: `section` labelled by its `h2` "Drift & Convergence", an `h3` per series, links "Read Convergence" and "Read Drift" to the short addresses, copy follows `VOICE.md` (no hype words).
- [ ] T042 [P] [US1] Unit test in `tests/unit/content/blog-config.test.ts`: the landing description names Drift & Convergence and both series (FR-007), and the series intro copy exists in `src/config/blog.ts`.
- [ ] T043 [P] [US1] E2E tests in `tests/e2e/blog.spec.ts`: the lead sits between the `h1` "Writing" and the lead story `h2`; each link reaches its series page; lead story, pill row (without series), Featured, Latest and "All posts" still render; both series links are visible on a desktop viewport without scrolling past the lead story (SC-001). In `tests/e2e/blog-fixtures.spec.ts`: an empty series is still linked.
- [ ] T044 [P] [US1] E2E test in `tests/e2e/no-js.spec.ts`: with JavaScript disabled the landing lead and both links are present and usable.
- [ ] T045 [P] [US1] Accessibility test in `tests/e2e/blog.a11y.spec.ts`: axe on `/writing/` with the lead; heading levels not skipped.

### Implementation

- [ ] T046 [US1] Add the series intro copy and landing description to `src/config/blog.ts` (plain language, `VOICE.md`).
- [ ] T047 [US1] Create `src/components/post/SeriesIntro.astro` and insert it in `src/pages/writing/index.astro` between the page header and the lead story; keep series out of the pill row. Makes T041 to T043 pass.
- [ ] T048 [US1] Run T041 to T045; fix until green.

---

## Phase 7: User Story 5 - Feed, home and About (P3)

**Goal**: the feed names the series; home "Recent writing" has the Drift & Convergence line; About links to the series pages.

**Independent test**: read the built feed, home page and About page.

### Tests (write first, see fail)

- [ ] T049 [P] [US5] Unit test in `tests/unit/content/blog-config.test.ts`: feed title is "Drift & Convergence", description names both series; feed items carry no category or series element.
- [ ] T050 [P] [US5] Component test `tests/component/sections/RecentWriting.test.ts`: heading unchanged, one paragraph (not a heading) under it naming Drift & Convergence with links "Convergence" and "Drift" to the short addresses; cards show markers.
- [ ] T051 [P] [US5] Add an assertion (in `tests/unit/content/launch-content.test.ts` or a new test beside it) that `src/content/pages/about.mdx` links to `/writing/drift/` and `/writing/convergence/`, no longer carries two long series paragraphs, and keeps the closing invitation; fix any existing test that pins the old About text.
- [ ] T052 [P] [US5] E2E tests: feed title and description (`tests/e2e/seo.spec.ts`); home line and links, About links (`tests/e2e/pages.spec.ts`); `tests/e2e/site-links.spec.ts` covers the new addresses.
- [ ] T053 [P] [US5] Accessibility test in `tests/e2e/a11y.spec.ts`: axe on home and About; link text names the series (FR-016b).

### Implementation

- [ ] T054 [P] [US5] Update feed title and description in `src/config/blog.ts` (and the RSS route only if it hard-codes copy). Makes T049 pass.
- [ ] T055 [P] [US5] Add the one-line paragraph with series links to `src/components/sections/RecentWriting.astro`. Makes T050 pass.
- [ ] T056 [P] [US5] Rewrite "About the writing" in `src/content/pages/about.mdx` per FR-015: short introduction, links to both series pages, closing invitation kept. If PR #25 changes the section first, apply FR-015 to the landed text. Makes T051 pass.
- [ ] T057 [US5] Run T049 to T053; fix until green.

---

## Phase 8: Visual baselines

Run once, after the appearance is final and Phases 3 to 7 pass (FR-018a).

- [ ] T058 Update `tests/e2e/visual.spec.ts`: add the `writing-series` snapshot (`/writing/drift/`) at both sizes and both themes. Run it and see it fail for lack of a baseline.
- [ ] T059 Run `pnpm run test:visual` on macOS and confirm the only failing snapshots are `writing-landing`, `writing-all`, `writing-topic`, `writing-post`, `home`, `about` and the new `writing-series`. Any other diff (header, footer, mobile menu, not-found, contact, sections fixture, projects, project story) is a regression to fix, not a baseline to refresh.
- [ ] T060 Run `pnpm run test:visual:update` (macOS baselines) and review each changed image against the FR-018 table in `specs/013-writing-series/spec.md`: framing lead and markers on the landing; markers and mauve/sand on all-posts; sand banner on `writing-topic`; mauve pill and related-post markers on `writing-post`; the home line; the shortened About; the new series banner.
- [ ] T061 Run `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it, and fall back to the `visual-baselines` PR label and the `visual-baselines-linux` artifact only after asking; from the artifact take only `*-linux.png`). Review the Linux diffs against the same FR-018 table.
- [ ] T062 Build the per-snapshot list for the PR body: each refreshed snapshot with the requirement it traces to (FR-018a).

---

## Phase 9: Polish and cross-cutting

- [ ] T063 [P] Run the full gate: `ASTRO_PREVIEW_BACKGROUND=1 pnpm run verify` (unit, component, build, lint, types, E2E, a11y, budget, visual); confirm budget thresholds are unchanged (SC-006). A verify that is red only from local load may be pushed for CI to verify.
- [ ] T064 [P] Walk `specs/013-writing-series/quickstart.md` against the built site and fix drift between it and the implementation.
- [ ] T065 [P] Confirm no new dependency, no new client JavaScript and no new colour token beyond `mauve`, `sand` and `dusk`; confirm no test references a `specs/` path.
- [ ] T066 PR body note: state this is a major change under Principle III and auto-merge is off, list the refreshed snapshots (T062), and list the `[PREVIEW-CHECK]` items.
- [ ] T067 [PREVIEW-CHECK] Don walks the preview deployment (URL in the Cloudflare PR comment) and ticks each item. Not a subagent task. Items: (a) Writing landing lead and its Convergence and Drift links; (b) both series pages at `/writing/drift/` and `/writing/convergence/`, their banner links and post lists; (c) `/writing/topics/drift/` and `/writing/topics/convergence/` return 301 to the series pages, including a paginated address, and Back returns to the previous page; (d) series markers on cards and post headers, in light and dark themes; (e) Agentic AI (mauve) and Technology teams (sand) pills recoloured; (f) the home "Recent writing" line and its two links; (g) About section links; (h) RSS title "Drift & Convergence" and description; (i) screen-reader wording of the marker and series links (FR-016e); (j) the visual diffs from T060 and T061 match the FR-018 table; (k) Linux baselines pass in CI.

---

## Dependencies and order

- Phase 1 then Phase 2 block everything. Phase 3 (US2) next: content model before pages.
- Phase 4 (US4) needs Phase 3; Phase 5 (US3) needs Phases 2 and 3; Phase 6 (US1) needs Phases 4 and 5 (links target series pages, cards show markers); Phase 7 (US5) needs Phases 4 and 5.
- Phase 8 needs Phases 3 to 7. Phase 9 needs Phase 8. T067 is last and is Don's.
- Phases 4 and 5 touch different components and may run in parallel after Phase 3, except shared edits to `tests/e2e/blog.spec.ts` (serialise those test tasks).

## Parallel examples

- Phase 2 tests: T003, T004, T005 together.
- Phase 3 tests: T010, T011, T012 together.
- Phase 5 component tests: T030 to T033 together; implementation T037 to T039 follows in order.
- Phase 7: T049 to T053 together, then T054 to T056 together.

## Implementation strategy

MVP is Phases 1 to 4 plus Phase 6 (landing with working series pages and redirects). Add markers (Phase 5) and the feed, home and About copy (Phase 7) next. Refresh baselines once at the end (Phase 8). Merge only after Don's approval following T067.
