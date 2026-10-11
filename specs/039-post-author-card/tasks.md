---

description: "Task list for the author card at the end of posts"
---

# Tasks: Author card at the end of posts

**Input**: Design documents from `/specs/039-post-author-card/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/author-card.md

**Tests**: Mandatory (constitution Principle I). Every test task names its one primary layer, chosen
by "Where a test goes" in `docs/testing.md`, and gives the reason for any second layer. Tests are
written first and seen to fail before the implementation they cover. Test titles carry the contract
row id (`A4`) so a search finds them. Tests read the author text from `blog.author` and never repeat
the wording (FR-003). Tests name no real post: use the fixture site and neutral inline data.

**Organization**: By user story. All three stories land in one component, `AuthorCard.astro`; US1
creates it with the heading, photo and lines, US2 adds the writing link, US3 adds the About and
Contact links. Each phase is sized for one implement subagent.

**Local toolchain**: follow `CLAUDE.md` (run `node -v`, `source ~/.nvm/nvm.sh && nvm use` in the
same Bash command as any `pnpm`, `astro` or `playwright` call). Inner loop: `pnpm run verify:quick`.
The full gate is not run by the implement subagent (ask Don first, see CLAUDE.md memory notes).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2 or US3 (user story phases only)

## Phase 1: Setup

**Purpose**: Confirm the starting point. Nothing to install (no new dependency, no new file type).

- [X] T001 Run `node -v` per `CLAUDE.md`, then read `src/layouts/PostLayout.astro`, `src/config/blog.ts`, `src/config/topics.ts`, `tests/component/post/PostLayout.test.ts`, `tests/e2e/blog.spec.ts` (feature 035's `[data-views-note]` / `[data-share]` edge loop) and `docs/testing.md` "Where a test goes", so later tasks match the existing patterns. No edit.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: The shared author facts and the series helper that every story's card reads.

- [X] T002 [P] Write unit tests for `seriesOf(topics)` in `tests/unit/content/topics.test.ts` (row A8): returns the series id for a topic list holding one series, `undefined` for none, ignores non-series topics. Layer: Unit (pure logic over the topic config). Run and see them fail.
- [X] T003 [P] Write unit tests for the author settings in `tests/unit/content/blog-config.test.ts` (rows A6, A4; FR-002, FR-003, FR-004a): `blog.author` has non-empty `name`, `photo` and `photoAlt`; `lines` has exactly two entries, each one sentence, each at most 100 characters; no line matches `/cloud architect/i`; the About page source (read the file under `src/content/pages/` through `tests/helpers/content.ts`) contains the role title that line 1 uses. Compute the title from `blog.author.lines[0]` (the text between the leading "I'm " and " at "); the test file must not contain the role title or either line as a literal, so a revision of the wording needs no test edit. Layer: Unit (reads a settings constant and one source file; no render needed). Run and see them fail.
- [X] T004 Add `seriesOf(topics)` to `src/config/topics.ts` (five-line helper over the existing topic config, per plan Design "Files") so T002 passes.
- [X] T005 Add `author: { name, photo, photoAlt, lines }` to `src/config/blog.ts` per `data-model.md`: `photo` is `import portrait from "../content/pages/images/don-coleman.jpg"`, `photoAlt` is "Don Coleman" (FR-010c), `lines` are the two first-person drafts in FR-003. Update the file's header comment. T003 passes.

**Checkpoint**: `pnpm run test:unit` passes for the two files.

---

## Phase 3: User Story 1 - A reader learns who wrote the post (Priority: P1) MVP

**Goal**: Every post ends with a card headed "Written by Don Coleman" with the photo and two role lines, between the views note and the Share area.

**Independent Test**: Build the fixture site, open any post, and see the card with photo, heading and two lines in the right place, on posts only.

### Tests for User Story 1 (write first, see them fail)

- [X] T006 [P] [US1] Component tests in new `tests/component/post/AuthorCard.test.ts` (Astro Container API, docs.astro.build/en/guides/testing/#vitest-and-container-api) for rows A4, A5, A6, A9: one `section[data-author-card]`; one `h2` "Written by {blog.author.name}" with no link inside; one `img` with `alt` = `blog.author.photoAlt`, width and height 96, a `srcset` with 1x and 2x WebP, `loading="lazy"`; two `p` equal to `blog.author.lines` in order; no `script`, `button` or `hidden` element; no `aria-label`, `aria-labelledby` or `role` on the section; DOM order inside the card is `h2`, the two `p`, then the `img` last (row A14, FR-010b; the links slot in before the `img` in US2 and US3); no `time` element, topic pill, post title or summary (row A14, FR-012a). Layer: Component (one component's markup). Run and see them fail.
- [X] T007 [P] [US1] In `tests/component/post/PostLayout.test.ts` add a DOM-order test (row A2): `section[data-author-card]` is a direct child of the `<article>`, after the views note wrapper and before `section[data-share]`, and appears exactly once, for a post with and without Related posts, with and without a `questionHash` (questions panel), and for a draft post (FR-001 edge cases). Layer: Component (`PostLayout` is the unit that places it; cheaper than a browser). Run and see it fail.
- [X] T008 [P] [US1] Build test in `tests/build/post-validation.test.ts`, reusing its existing fixture-site build (add no new `buildFixtureSite` call; the build budget in `docs/testing.md` applies) for rows A1, A5: every built post page has exactly one `[data-author-card]`; the home page, a Markdown page, a project story, the writing landing page, a series page, the all-posts list and the not-found page have none; the RSS feed's post content has none; the built 2x portrait file is at most 20 KB. Layer: Build (output spanning pages and a generated file only the real build makes). Run and see it fail. *Done in `tests/build/blog-listing.test.ts`: `post-validation.test.ts` holds no successful build, and the listing file's single production build already has posts and the other page kinds.*
- [X] T009 [US1] Extend `tests/e2e/blog.spec.ts`: add `"[data-author-card]"` to feature 035's edge-equality loop and add 320 to its widths (row A3, within 1 px at 320, 375, 768, 1024 and 1440 px); at 1440 px check one built post that shows `[data-questions]` and one that does not, choosing both from the build (if the E2E build offers only one kind, say so in the task notes: T007 then carries the no-panel placement); add phone stack and centring below 768 px and photo-left, text left-aligned from 768 px (rows A10, A11); no sideways scroll at 320 px; extend the existing end-of-post order test so views note < card < Share < Related post. The file already defines a local `seriesOf` helper; replace it with the import from `src/config/topics.ts` (T004) rather than shadowing it. Layer: E2E (geometry and rendered order only a browser shows). Second layer for the order assertion: the test already asserts rendered order with Share and Related, so extending it costs nothing; the DOM order itself is T007. Run and see it fail. *Note: the E2E build's sample post and the series post decide whether the questions panel shows; the A3 test loops over three posts and PostLayout.test.ts (T007) carries the no-panel placement regardless. `blog.author.photo` was dropped (AuthorCard imports the portrait) because Playwright loads `blog.ts` in plain Node, which cannot import a JPEG.*
- [X] T010a [P] [US1] In `tests/e2e/blog-forced-colors.spec.ts` add a case (row A15, FR-010g): on the post page in forced colours, light and dark, `[data-author-card]` keeps a border of at least 1 px in the system `CanvasText` colour (reuse the file's `expectEdge` helper), and its heading, lines and links are visible. Layer: E2E (only a browser emulates forced colours; the file already holds the other forced-colours checks). Run and see it fail.
- [X] T010 [P] [US1] In `tests/e2e/blog.a11y.spec.ts` make sure the post template scans (axe, light and dark, both widths) include the card, and add `[data-author-card] a` to the 24 x 24 px target-size list (row A12). Layer: Accessibility (templates, not stories). Run and see the target-size check fail.

### Implementation for User Story 1

- [X] T011 [US1] Create `src/components/post/AuthorCard.astro` (props `{ topics: readonly string[] }`) per the markup outline in `plan.md` and `contracts/author-card.md`: the title card's box classes, `mt-8`, no width cap, centred below `md` and left-aligned from `md`, level-2 heading in the Share area's heading style, two `p`, Astro `<Image />` from `astro:assets` (96 x 96, `densities` 1 and 2, `format` webp, `loading="lazy"`, `rounded-full`, `order-first`, `shrink-0`) reading `blog.author`. Links come in US2 and US3. The Astro docs citation for `<Image />` and `densities` is research.md R2 (Principle IV); no further citation is needed.
- [X] T012 [US1] In `src/layouts/PostLayout.astro` insert `<AuthorCard topics={post.topics} />` as a direct child of the `<article>` between the views note wrapper and `<Share>`, and update the header comment's end-of-post order. T006 to T010a (apart from the link assertions) now pass; run `pnpm run test:unit` and `pnpm run test:build`.

**Checkpoint**: The card shows on every post with photo, heading and lines; US1 can be demonstrated alone.

---

## Phase 4: User Story 2 - A reader goes on to more of Don's writing (Priority: P2)

**Goal**: The card's writing link goes to the post's series page, or to `/writing/` for a post in no series.

**Independent Test**: On a Drift post, a Convergence post and a no-series post, the card shows the right single writing link.

### Tests for User Story 2 (write first, see them fail)

- [X] T013 [US2] Add to `tests/component/post/AuthorCard.test.ts` (rows A7, A8): for topics holding Drift, the first link reads "More in Drift" and goes to `/writing/drift/`; Convergence likewise; for topics in no series (neutral inline topic ids) the first link reads "More of my writing" and goes to `/writing/`, with no series link; a post's other topics do not change the link; never both links. Layer: Component (the link choice is a pure render of props). Run and see them fail.
- [X] T014 [US2] In `tests/e2e/blog.spec.ts` add a one-click journey on the build the E2E server serves: from the existing `SERIES_POST` (read through `tests/helpers/content.ts`, no real post named), following the card's writing link lands on that series page (HTTP 200 and the series heading). Layer: E2E (a journey across pages). Second layer: the component test proves the href; this proves the target page exists and is visible, which only a built site shows. Keep to one series post to stay inside the E2E time budget. Run and see it fail.

### Implementation for User Story 2

- [X] T015 [US2] In `src/components/post/AuthorCard.astro` add the `ul` with the writing link first, using `seriesOf`, `findTopic` and `topicHref` from `src/config/topics.ts`; link style is the landing page's "All posts" link classes (underlined, same weight). T013 and T014 pass.

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - A reader gets in touch (Priority: P2)

**Goal**: The card links to the About page and the Contact page.

**Independent Test**: From any post, "More about me" opens `/about/` and "Get in touch" opens `/contact/`.

### Tests for User Story 3 (write first, see them fail)

- [X] T016 [US3] Add to `tests/component/post/AuthorCard.test.ts` (rows A7, FR-008a): the list has exactly three links in order writing link, "More about me" to `/about/`, "Get in touch" to `/contact/`; no link has `aria-label`; the four possible link texts are all different; the heading and name are not links. Layer: Component (markup). Run and see them fail.
- [X] T017 [US3] Confirm row A13 is covered by the existing crawl in `tests/e2e/site-links.spec.ts` (the fixture post pages are crawled, so the new links are followed). Add a test only if the crawl does not visit post pages; otherwise write no new test and record that in the task notes. Layer: E2E (existing crawl, no second layer). Notes: the crawl follows the sitemap, which lists the post pages, so no new test was needed.

### Implementation for User Story 3

- [X] T018 [US3] In `src/components/post/AuthorCard.astro` add the "More about me" (`/about/`) and "Get in touch" (`/contact/`) links after the writing link, same classes, wrapping with `flex flex-wrap gap-x-4` and a vertical gap so targets stay at least 24 x 24 px when they wrap at 320 px; centred below `md`, left from `md`. T016 and T010's target-size check pass.

**Checkpoint**: All three stories work.

---

## Phase 6: Polish, baselines and documentation

**Purpose**: Cross-cutting checks, the visual baselines, and the contract note.

- [ ] T019 [P] Update `specs/008-blog/contracts/blog-pages.md` "Post" to note the card in the end-of-post order and point to `specs/039-post-author-card/contracts/author-card.md` (plan Design "Files").
- [ ] T020 Run `pnpm run verify:quick` and fix failures. Then run `node scripts/ci/changed-paths.ts --base origin/main` and run only the local tier it prints (CLAUDE.md memory: ask Don before a full `pnpm run verify`).
- [ ] T021 Run the E2E and a11y projects for the post template locally (`blog.spec.ts`, `blog.a11y.spec.ts`) and the budget project (`pnpm run test:budget`) to confirm FR-014a: 0 bytes of JavaScript added, no layout shift, the photo lazy, post page inside the budget. Layer note: the budget project is the only place these numbers are measured.
- [ ] T022 Refresh the macOS visual baselines with `pnpm run test:visual:update` (read `.claude/skills/_shared/visual-baselines.md` first; follow the nvm and shim notes in `CLAUDE.md`). Only the four `post-template-{desktop,phone}-{light,dark}-visual-darwin.png` files may change; any other diff is a regression to investigate. Compare `-previous.png`, not `-actual.png`.
- [ ] T023 Refresh the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it with an `AskUserQuestion` whose question text carries the instruction, per `CLAUDE.md`). Only the four `post-template-*-visual-linux.png` files may change. Run T023 after T022 and not at the same time (Docker builds `dist`).
- [ ] T024 Commit the eight refreshed `post-template-*` PNGs under `tests/e2e/visual.spec.ts-snapshots/` and run the visual project once more on macOS to confirm it is green.
- [ ] T025 [PREVIEW-CHECK] Don looks at the card on the preview (rules in `.claude/skills/_shared/preview-check.md`; leave unticked, list in the PR body): on a Drift post, a Convergence post, a post in no series and at phone width; he reads and may revise the two role lines and the link wording; keyboard focus moves through the three card links in order with a visible indicator not hidden by the sticky header; the card reflows at 320 px and at 200% text zoom; the alt text and link wording make sense to a screen reader (SC-005 manual remainder).
- [ ] T026 Note in the PR body, under their own "Follow-up" heading, the spec's out-of-scope items (structured data and link previews, project story cards, multiple authors, other stale "Cloud Architect" wording), and the added monthly cost of $0.

---

## Dependencies and execution order

- Phase 1, then Phase 2 (T002 and T003 in parallel, then T004 and T005). Phase 2 blocks everything else.
- Phase 3 (US1) before Phases 4 and 5: US2 and US3 add to the component US1 creates. US2 and US3 touch the same component file, so run them in order (US2 then US3).
- Within a story: tests first and failing, then implementation.
- Phase 6 last. T022 before T023 before T024; T025 waits on the preview.
- Parallel: T002 with T003; T006, T007, T008, T010 and T010a together (different files); T019 with T020.

## Implementation strategy

- MVP is Phase 2 plus Phase 3: the card with photo, heading and lines.
- Then US2 (writing link), US3 (About and Contact links), then Polish and baselines.
- One implement subagent per phase: Phases 1 and 2 together, then 3, 4 with 5, and 6.
- Run `pnpm run verify:quick` after each phase; do not weaken any existing test.
