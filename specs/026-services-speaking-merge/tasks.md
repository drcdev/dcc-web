---

description: "Task list for One Page for Services and Speaking (Work with me)"
---

# Tasks: One Page for Services and Speaking

**Input**: Design documents from `/specs/026-services-speaking-merge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/work-with-me-page.md, quickstart.md

**Tests**: MANDATORY (Constitution Principle I, Test-First). Every story has test tasks, and every
test task for every story is written and run red (T018) before any content file moves. Each test
task names its one primary layer (the cheapest layer that can observe the behaviour,
`docs/testing.md` "Where a test goes"); a second layer appears only with a written reason. Tests
never name real posts or projects and never restate page copy ("Invariants, not mirrors"); copy is
Don's to review.

**Why tests for all stories come first**: navigation is derived from the page files, so the one
content change (T019 to T022) turns most US2 and US3 tests green at the same moment as US1's. A
story-by-story order would write US2 and US3 tests after they could ever be red. The tasks are
still labelled by story for traceability.

**No task is ticked on a red suite.** The only tasks done while tests are red are the test tasks
and the red run (T018), where red is the expected result. T019 to T022 are one change: the rename
commit inside T019 leaves the build broken (home link, launch config), so none of T019 to T022 is
ticked until T024 is green.

**Major change (Principle III, navigation)**: flag in the PR body. Auto-merge stays OFF while any
`[PREVIEW-CHECK]` item is open (`.claude/skills/_shared/preview-check.md`).

**Local toolchain**: before any `pnpm`, `astro`, `playwright` command run `node -v`; if it is not
the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same Bash command. Ask Don before
the full `pnpm run verify`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 merged page, US2 header menu, US3 launch checks and links

## Phase 1: Setup

**Purpose**: start from current main.

- [X] T001 Merge `origin/main` into the branch if it has moved (sibling worktrees edit the same shell tests and baselines), so the later baseline refresh starts from current main.

---

## Phase 2: Foundational (shared test lists)

**Purpose**: the per-template lists every browser spec reads. Changing them first makes the
template-driven a11y, budget, geometry, menu and no-JS specs go red against the old content.

- [X] T002 Edit `tests/e2e/templates.ts`: replace the `services` and `speaking` TEMPLATES entries with one `work-with-me` entry at `/work-with-me/`, and change PRIMARY to the six links in order (Home, Work with me, Writing, Projects, About, Contact). Layer: shared helper for the E2E and a11y specs, no test of its own. Its effect is observed through the template-driven specs, red in T018.

**Checkpoint**: lists point at the new structure.

---

## Phase 3: Tests for every story (write first, see them fail)

### User Story 1 - One place to see everything Don offers (Priority: P1) 🎯 MVP

**Goal**: `/work-with-me/` holds every offering, block, the photo and one call to action, in the FR-004 order, under one h1; the Speaking page is gone.

- [X] T003 [P] [US1] Unit layer, `tests/unit/content/launch-content.test.ts`: in LAUNCH replace `services.mdx` (2) and `speaking.mdx` (3) with one `["work-with-me.mdx", 2, true]` (page schema, nav position 2, draft); change the "seven launch page files" header comment to "launch page files"; add a case that neither `services.mdx` nor `speaking.mdx` exists (FR-006, FR-007). Reason for unit layer: reads the files directly, needs no build.
- [X] T004 [P] [US1] Unit layer, same file, new `describe("Work with me page")` reading the MDX body (FR-002 to FR-005, data-model "Validation"): sections appear in the FR-004 order (no-practice paragraph, `Lead`, `Offerings` "Kinds of work", `TextBlock`s How I work and What I do not do, `Offerings` "Talk topics", `TextBlock`s Past talks and For event organizers, `Figure`, `CallToAction`); exactly one `Lead` and one `CallToAction`; exactly two `Offerings` with three `Offering` each; no section type outside the registered set; the `CallToAction` href is `/contact/`. Asserts structure only, not offering wording.
- [X] T005 [P] [US1] Unit layer, same file, the copy limits the resolve phase flagged untested (FR-002, FR-005, FR-014): the meta `description` is present and non-empty (no length cap: `docs/pages.md` says the 50 to 160 character range is advice, not enforced); the call-to-action link label is non-empty and not generic ("click here", "more", "read more", "here"); the `Figure` keeps a non-empty alt and a caption; the title is `Work with me`. No assertion of the proposed wording itself (Don reviews it).
- [X] T006 [US1] Build layer, `tests/build/local-site.test.ts`: rename the `services/index.html` read to `work-with-me/index.html` and keep its draft-notice (`data-draft-notice`) and draft robots-meta assertions (FR-011, FR-014). Add the heading-hierarchy assertion on the same built page (FR-012). Second-layer reason: only the rendered HTML shows heading levels, and a component test sees one section at a time. Exactly one `h1`; the `h2`s, in order, are Kinds of work, How I work, What I do not do, Talk topics, Past talks, For event organizers (derive the titles from the MDX the way T004 does, do not restate copy); each offering title is an `h3` inside its group; no heading level is skipped; the two groups are separate lists. `local-site.test.ts` is already in `test:build:content`.

### User Story 2 - The header menu has one entry for the merged page (Priority: P1)

**Goal**: six menu entries in order, only Work with me current on its page, the label fits at 320 px and 200 % text.

- [X] T007 [P] [US2] Unit layer, `tests/unit/content/navigation.test.ts`: fixture pages and expected list become the six entries in order with label "Work with me" at position 2 and position 3 unused (FR-006); drop "seven" wording in titles and comments.
- [X] T008 [P] [US2] Component layer, `tests/component/SiteHeader.test.ts`: PRIMARY list becomes the six entries; the current-page case marks only Work with me (`aria-current="page"`) for `/work-with-me/` and no other link (US2 scenario 2); drop "seven" wording.
- [X] T009 [P] [US2] E2E layer, `tests/e2e/menu.spec.ts` and `tests/e2e/no-js.spec.ts`: link counts 7 to 6 (desktop row, phone menu, JavaScript off); drop "seven" wording in titles and comments. Reason for E2E: only a browser shows the open phone menu and the no-JS menu.
- [X] T010 [P] [US2] E2E layer, `tests/e2e/pages.spec.ts` and `tests/e2e/shell.spec.ts`: the Services and Speaking current-page cases become one Work with me case (only that link has `aria-current="page"`, desktop and phone); the `shell.spec.ts` tab-order exception `outside:/services/` becomes `outside:/work-with-me/`; drop "seven" wording. The home call-to-action target is covered in T016.
- [X] T011 [US2] E2E layer, `tests/e2e/menu.spec.ts` (after T009): label fit for FR-012 and the spec's edge case. At 1280 px the six links share one row and the "Work with me" link is on one line (its box height equals one line, no wrap); at 320 px wide the open phone menu has no horizontal scroll and the link lies inside the viewport; repeat at 200 % using the zoom emulation `tests/e2e/a11y.spec.ts` already uses for its 200 % check (set no inline styles, the CSP blocks them). Reason it is its own test: `a11y.spec.ts` and `geometry.spec.ts` check the page with the menu closed, not the open menu or the label wrap, and this label is the longest in the menu.
- [X] T012 [P] [US2] E2E layer, `tests/e2e/analytics.spec.ts` (path list `/services/` to `/work-with-me/`) and `tests/e2e/theme-tokens.spec.ts` (selector `a[href="/services/"]` to `a[href="/work-with-me/"]`). These name the real menu, so they change with it (FR-009).

### User Story 3 - Launch checks and links follow the new structure (Priority: P2)

**Goal**: the launch check, config and runbook describe one page; no link, sitemap entry or redirect names a removed address; the removed addresses return 404.

- [X] T013 [P] [US3] Unit layer, `tests/unit/site/redirects.test.ts`: add one invariant: no redirect rule's source starts with `/services` or `/speaking` (FR-007, SC-003). It passes against today's files because it guards against a future redirect; see it fail once by adding a temporary `/services/ /work-with-me/ 301` line to `public/_redirects` locally, then remove the line (never commit it).
- [X] T014 [P] [US3] Build layer, `tests/build/indexing.test.ts` sitemap test: `/work-with-me/` appears exactly once in the main-branch and preview builds alike (draft pages are listed), and `/services/` and `/speaking/` do not (FR-008). The existing "names a file for every expected page id" case covers the `setup/config.json` change, so there is no new config test (plan test-placement table).
- [X] T015 [P] [US3] Component layer, `tests/component/HomeIntro.test.ts`: the fixture `cta.href` and its assertions move to `/work-with-me/` (FR-009). The fixture mirrors `index.mdx`, so this test is green as soon as it is edited; the red that proves the real link is T016.
- [X] T016 [P] [US3] E2E layer, `tests/e2e/pages.spec.ts` home journey: "See how I can help" navigates to `/work-with-me/`. Second-layer reason beside T015: the existing journey check, only its target changes, and it is the one that reads the real home page.
- [X] T017 [P] [US3] E2E layer, `tests/e2e/not-found.spec.ts`: add a `REMOVED_PAGES` list (`/services/`, `/services`, `/speaking/`, `/speaking`, plus one address below each) to `NOT_FOUND_ADDRESSES`; each returns status 404 with the not-found page and no `Location` header (FR-007, SC-003). Reason for E2E: only the served build shows the status.

### Red run

- [X] T018 Run, against today's content: `pnpm run test:unit`, `pnpm run test:build:content`, then a fresh `pnpm run build` and `pnpm exec playwright test tests/e2e/menu.spec.ts tests/e2e/no-js.spec.ts tests/e2e/pages.spec.ts tests/e2e/shell.spec.ts tests/e2e/analytics.spec.ts tests/e2e/theme-tokens.spec.ts tests/e2e/not-found.spec.ts tests/e2e/a11y.spec.ts`. Confirm T003 to T012, T014, T016 and T017 fail for the expected reason (no merged page, old menu; the template-driven specs fail on the `work-with-me` entry for the same reason) and that no failure has an unrelated cause; T013 and T015 are green as described in their tasks. Commit the tests with the red result recorded in the commit message.

---

## Phase 4: Implementation

### User Story 1 (with the references that keep the build whole)

T019 to T022 are one change, ticked together only after T024 is green.

- [X] T019 [US1] Step 1: `git mv src/content/pages/services.mdx src/content/pages/work-with-me.mdx` with no content edits, committed alone (`refactor(content): rename services page to work-with-me`) so Git records a 100 % rename and history follows (research R1). This commit is an intermediate state with a broken build; do not tick anything on it. Step 2: edit `src/content/pages/work-with-me.mdx` per data-model.md and research R6: front matter `title: Work with me`, combined `description`, `nav.position: 2`, no `nav.label`, `draft: true`; body in the FR-004 order with the Speaking sections moved in (Talk topics group, Past talks, For event organizers, the `Figure` with `./images/don-coleman.jpg`), one `Lead`, one `CallToAction` to `/contact/` using the R6 copy. Every offering, the four blocks and the photo caption and alt text stay word for word.
- [X] T020 [US1] `git rm src/content/pages/speaking.mdx`.
- [X] T021 [US1] `src/content/pages/index.mdx`: `intro.cta.href` becomes `/work-with-me/`; label unchanged (FR-009; tested by T016). Done here, not in US3, because the rename would otherwise leave the home page linking to a 404.
- [X] T022 [P] [US1] `setup/config.json`: in `launch.expectedPages` replace `services` and `speaking` with `work-with-me`; in `launch.expectedPaths` replace `/services/` and `/speaking/` with `/work-with-me/` (FR-010; tested by the existing `indexing.test.ts` case). Do not edit `scripts/setup-check/checks/launch-content-ready.ts`. Done here for the same reason as T021.
- [X] T023 [US1] Word-for-word check (not a committed test): diff the moved blocks against `git show main:src/content/pages/speaking.mdx` and `main:src/content/pages/services.mdx`; confirm only the leads, the call to action, the no-practice note and the description differ (FR-002). List the changed copy in the PR body for Don.
- [X] T024 [US1] Re-run the whole T018 set on a fresh `pnpm run build`; every test is green. Then tick T019 to T022. Any red that remains is fixed at its cause before ticking.

**Checkpoint**: the merged page exists, ordered, a draft; the old pages are gone; the menu has six entries.

### User Story 2

- [X] T025 [P] [US2] Comment-only edits: `src/lib/nav.ts` (`/services` example becomes `/work-with-me`) and `src/components/SiteHeader.astro` ("seven primary links" becomes "the primary links"). No logic change; do not touch `src/config/navigation.ts` (research R5). WCAG 2.2 AA and the performance budget on the merged page come from the existing template-driven `a11y.spec.ts` and `budget.spec.ts` via T002 (no new test; a second layer is rejected); `budget.spec.ts` runs in T034's gate.

### User Story 3

- [X] T026 [P] [US3] `docs/launch.md` L2: "Replace the Work with me placeholder copy ..." as one page (FR-010). Grep `docs/setup.md` and `docs/design/` too; change a mention only where it names `/services/`, `/speaking/` or the two pages as links or pages to replace (the "retired services" prose in `docs/setup.md` is about old hosting, not these pages).
- [X] T027 [P] [US3] `docs/pages.md`: address table and examples use `work-with-me` and `/work-with-me/`; the front-matter example shows `title: Work with me`, `position: 2`, no label; the menu-positions text says position 3 is unused and free, 4, 5 and 7 stay reserved for Writing, Projects and Contact, About is at 6 (FR-013).
- [X] T028 [US3] Run `pnpm run test:unit`, `pnpm run test:build:content`, `pnpm run build`, then the quickstart section 2 checks (`dist/services` and `dist/speaking` absent; no `href="/(services|speaking)/` in `dist`; no `/(services|speaking)` in `public/_redirects`) and the quickstart section 3 Playwright set including `not-found.spec.ts` and `site-links.spec.ts` (the existing crawl, unchanged, the SC-004 guard); all green.

**Checkpoint**: all three stories work; internal links are clean.

---

## Phase 5: Polish and cross-cutting

**Purpose**: baselines, reference sweep, gate, preview.

### Visual baselines (FR-015)

The merge changes the menu links, so every visual image that shows them changes. Expected to
change, both themes, both platforms (8 images per platform): `header-desktop-*` (full link row),
`menu-open-phone-*` (open phone menu), `not-found-desktop-*` and `sections-desktop-*` (full-page
shots whose header shows the desktop link row; the fixture site builds the real pages plus the
fixtures). This is exactly FR-015's list. Expected NOT to change: `header-phone-*`,
`not-found-phone-*` and `sections-phone-*` (the closed phone header shows only the site name and
menu button; the list is hidden at phone width), `footer-*` (footer links come from
`src/config/navigation.ts`, unchanged), `contact-form-*`, `post-template-*`, `listing-cards-*`,
`lead-story-*`, banner, project-row and retired-story-header shots (element shots without the
header). Any other diff is a regression, to fix at its cause, not by accepting the image.
`--update-snapshots` rewrites only images past the threshold, so an unchanged image is left alone.

- [X] T029 Read `.claude/skills/_shared/visual-baselines.md`. Ensure sibling Playwright runs are idle and `origin/main` is merged (T001; merge again if main moved), then refresh the macOS baselines with `pnpm run test:visual:update` (via the nvm and pnpm-shim wrapper in the background, per the memory notes). Do not run it while Docker is building `dist`.
- [X] T030 Review the macOS diff with `git status` on `tests/e2e/visual.spec.ts-snapshots/`: only the 8 `*-darwin.png` images listed above may be modified; compare against `-previous.png`, not `-actual.png`. Any other changed image is a regression.
- [X] T031 Refresh the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop). If `docker info` fails, ask Don through `AskUserQuestion` (the instruction in the question text) to start Docker Desktop; do not fall back to CI without asking. Only with Don's agreement fall back to the `visual-baselines` label at `gh pr create`, downloading the artifact and copying only `*-linux.png`. Confirm the same 8 `*-linux.png` images, and no others, changed.
- [X] T032 Commit the baselines (`test(visual): refresh header menu baselines for six-entry menu`) and push before opening the PR.

### Reference sweep and gate

- [X] T033 Sweep for leftovers with `grep -rnE "/(services|speaking)\b"` over `src docs setup scripts tests public .github`, and for "Services and Speaking". Every hit must be a made-up input in a component or schema test (`Offerings.test.ts`, `TextBlock.test.ts`, `PageLayout.test.ts`, `BaseLayout.test.ts`, `page-schema.test.ts`, `section-schemas.test.ts`, `tests/unit/site/navigation.test.ts`, the missing-file case in `launch-content-ready.test.ts`, `tests/fixtures/pages/sections.mdx`), unrelated prose (`contact.mdx`, `terms-of-use.mdx`, the Focus Pocus post, `privacy/tempo.mdx`), or be fixed (FR-009).
- [X] T034 Run `pnpm run verify:quick` (lint, typecheck, unit, worker, build); green.
- [ ] T035 Release gate: ask Don, then run the full `pnpm run verify` from the agent shell per the memory notes (`ASTRO_PREVIEW_BACKGROUND=1`, wrapper under `perl -e 'alarm N; exec @ARGV'`, `lsof -i :4321` first); read the `VERIFY_EXIT=` line. If red only from machine load, rerun once load is low. Never weaken a check.
- [ ] T036 PR notes: flag the change as a MAJOR change (Principle III, navigation: the header menu loses two entries and gains one, two addresses are removed with no redirect); list the proposed copy for Don's review (meta description, no-practice note, joined lead, call to action "Get in touch"); list the `[PREVIEW-CHECK]` items below; state that auto-merge is OFF while they are open. Open the PR from `drc-agents` (`gh auth switch --user drc-agents` before `gh pr create`, back to `drcdev` after).

### Preview checks (Don, on the preview deployment; leave unticked and list in the summary)

- [ ] T037 [PREVIEW-CHECK] Desktop menu row at 1280 px and the open phone menu at about 390 px, light and dark: reads Home, Work with me, Writing, Projects, About, Contact; "Work with me" is on one line and fits (FR-016, FR-012).
- [ ] T038 [PREVIEW-CHECK] Menu at 320 px wide and at 200 % browser text size in a real browser: no horizontal scroll, the label does not clip (T011 covers an emulated check; this is the real-browser confirmation).
- [ ] T039 [PREVIEW-CHECK] `/work-with-me/` in light and dark, desktop and phone: section order, two offering groups, photo, one call to action, draft notice shown; read and approve or edit the proposed copy (meta description, no-practice note, joined lead, call to action wording) (FR-002, FR-005, FR-014, FR-016).
- [ ] T040 [PREVIEW-CHECK] `/services/` and `/speaking/` each show the not-found page (FR-007, FR-016).

---

## Dependencies and execution order

- Phase 1 (T001), then Phase 2 (T002), then every test task (T003 to T017, any order within the [P] markers), then the red run T018. No content file moves before T018 is recorded.
- Implementation: T019 to T022 as one change, T023, then the green run T024. T025 to T027 after T024. T028 after T027.
- Phase 5 needs Phase 4 done; T031 needs Docker; T035 after T034; T036 after T032 and T035; T037 to T040 wait for the preview and never block the agent.

## Parallel examples

- Test writing: T003, T004, T005 together (same file, so one editor at a time in practice); T007 to T010 and T012 together; T013 to T017 together.
- Implementation: T021 and T022 together; T025, T026, T027 together.

## Implementation strategy

MVP is US1 plus the T002 lists: a merged, ordered page. Because the menu is built from the page
files, the one content change also delivers US2's menu and most of US3's links; the US2 and US3
tests written in Phase 3 prove it. All three stories land in one PR, because a menu pointing at a
missing page, or two entries for one page, is a visible defect.

## Notes

- Every test task names one primary layer; second layers with reasons: T006 (build, for rendered heading levels), T011 (E2E, open-menu label fit beside the page-level reflow checks) and T016 (E2E, existing journey beside T015).
- Task count: 40. Setup 1, Foundational 1, tests 15 plus the red run (US1 4, US2 6, US3 5), implementation 10 (US1 6, US2 1, US3 3), Polish 12 (4 are PREVIEW-CHECK).
