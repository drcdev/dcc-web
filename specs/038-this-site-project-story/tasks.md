---

description: "Task list for This site as a project story"
---

# Tasks: This site as a project story

**Input**: Design documents from `/specs/038-this-site-project-story/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/story-content.md, quickstart.md

**Tests**: Mandatory (constitution Principle I). The behaviours here are already described by
content-derived tests that run over every project file, so no new test file is written (plan
"Test approach"). Each test task below names its one primary layer, and the red-first steps
from the plan (R6, R7) are kept: the two existing tests are seen to fail before the code that
turns them green.

**Organization**: Grouped by user story. US1 holds nearly all the work (the story, its two
pictures, the test edit). US2 and US3 are small checks and copy rules on the same file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3
- `[PREVIEW-CHECK]`: Don's check on the branch preview; left unticked by subagents and listed in
  the PR body (`.claude/skills/_shared/preview-check.md`)

**Toolchain**: before any `pnpm`, `astro`, `playwright` or `wrangler` call run `node -v`; if it
is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the same Bash command
(`CLAUDE.md` "Local toolchain"). Bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd...>`.

## Phase 1: Setup

- [X] T001 Sync the worktree with `origin/main` (`git fetch origin`, merge if behind), copy `.reference/flux` into the worktree if missing, and confirm `node -v` matches `.nvmrc` in `/Users/doncoleman/orca/workspaces/dcc-web/this-site-as-a-project-story`
- [X] T002 Create the directory `src/content/projects/images/doncoleman-ca/` and read `docs/projects.md`, `src/content/projects/cadence.mdx` and `src/content/projects/flux.mdx` as the pattern for frontmatter, Options table, notes comment, invitation and diagram labels

---

## Phase 2: Foundational (red-first baseline)

**Purpose**: Show the two guarding tests are green before the story exists, so the red in US1 is
caused by the story and nothing else.

- [X] T003 Test (layer: unit, Vitest `unit` project): run `pnpm exec vitest run --project unit tests/unit/site/diagram-fonts.test.ts tests/unit/content/no-real-content-in-tests.test.ts` and record that both pass on the current content

**Checkpoint**: Baseline green.

---

## Phase 3: User Story 1 - Read how the site is built (Priority: P1) MVP

**Goal**: A draft story, `/projects/doncoleman-ca/`, in four parts, with a list picture, a
pipeline diagram and the facts traced to the repository record.

**Independent Test**: Build the site, open `dist/projects/doncoleman-ca/index.html`, and read it
with JavaScript on and off; the Playwright content-derived specs pass on it as the picked story.

### Tests for User Story 1 (red first, before the implementation they cover)

- [ ] T004 [US1] Test (layer: unit): `tests/unit/site/diagram-fonts.test.ts` is the primary test for the diagram (C08: Inter glyphs embedded, no system font asked for, under 16 KB, labels fit). It goes red when T008 adds `pipeline.svg` without the font block (seen in T010) and green after T011. No edit to the test file.
- [ ] T005 [US1] Test (layer: unit): `tests/unit/content/no-real-content-in-tests.test.ts` is the primary test for C17. It goes red when T007 adds the title `doncoleman.ca`, naming `tests/build/indexing.test.ts`, and green after T012. No edit to the test file. A second layer is not added: the build layer already asserts the host rule itself.
- [ ] T006 [US1] Test (layer: build, the real `astro build` via `pnpm run build`): the schema and `src/lib/content` four-part and Options checks are the primary test for C01 to C03, C07, C12, C16. No new test; T017 runs it. A second layer is not added because no HTML is read by a new assertion.

### Implementation for User Story 1

- [ ] T007 [US1] Write `src/content/projects/doncoleman-ca.mdx` with the frontmatter in `data-model.md` (title `doncoleman.ca`, themes `[Agentic development, Web, Static sites]`, `status: shipped`, `date: 2026-09-28`, `source: https://github.com/drcdev/dcc-web`, `draft: true`, a `problem` of one sentence of at most 140 characters ending in a full stop, a one-sentence `description`, a Cadence-style first-person `invitation` ending "tell me about it", `visual` and `visuals.screenshot` (part problem) and `visuals.pipeline` (kind diagram, part build) with alt text per FR-017 and a diagram `description` that states every step and arrow). Body: first a `{/* ... */}` notes comment starting "Written from Don's interview answers (2026-10-11).", naming each fact's record (research R9), the 2026-10-11 public check of the repository and why there is no demo link. Then exactly four `##` parts in order. Problem, Options and Lessons are written only from the spec's "Story source material" (not framed as an agent experiment; the four constraints in the recorded order, identical in list and table; options: stay on Ghost/Flux, Astro on GitHub Pages or Vercel, **Astro on Cloudflare Workers**; `Yes`/`Partly`/`No` cells; a `Why` paragraph). Build covers the four pipelines `/deliver`, `/tweak`, `/squash`, `/chore` (the first three start from a spec, `/chore` from a plan with no spec phase; first three from Cadence, linking `/projects/cadence/` with link text naming Cadence), the constitution (eleven principles, version 4.0.0), the single-approval rule with agents opening PRs from a separate account, auto-merge, and the gate cut from about 31 minutes to about 6, plus the port collisions and machine load of parallel worktrees. Lessons keep Don's sentence word for word: "Agents will happily overcomplicate things and I had to work at keeping decisions pragmatic and testing focused on what is important." Plain first-person copy, none of the FR-009 AI-copy markers, no "Cloud Architect" (use "Director, Data Infrastructure and Architecture at Island Health" only if the role is named), no link to the site's own host, every figure dated or rounded as in the spec's "Fact sources".
- [ ] T008 [P] [US1] Draw `src/content/projects/images/doncoleman-ca/pipeline.svg` per research R4: 1200 x 480, `font-family="Inter, sans-serif"`, `role="img"` with `aria-label`, opaque light background, labels at least 24 units, 16 units clear space plus 8 units slack per box, wrapped not shrunk. Flow: issue or request, one of four pipelines, phases in fresh subagents (no label may say every pipeline starts with a spec: `/chore` has no spec phase), pull request from a separate account, Don's one approving review, `main` and production; a band showing the constitution governing every phase. Do not run `fonts:diagrams` yet. Check contrast (4.5:1 text, 3:1 boxes and arrows) and that no meaning is by colour alone.
- [ ] T009 [P] [US1] Make the list picture `src/content/projects/images/doncoleman-ca/index.png` per research R3: a throwaway Playwright script in the scratchpad (not committed) opens `https://www.doncoleman.ca/` in Chromium, `colorScheme: "light"`, viewport 1280 x 800, `deviceScaleFactor: 1.25`, waits for fonts and images, saves a viewport PNG of 1600 x 1000; re-encode with sharp with no metadata; confirm with `sips -g pixelWidth -g pixelHeight` and a file size under 500 KB. If the live page does not match the repository's home page, say so in the summary.
- [ ] T010 [US1] Red evidence (layer: unit, as T004 and T005): after T007, T008 and T009, run `pnpm exec vitest run --project unit tests/unit/site/diagram-fonts.test.ts tests/unit/content/no-real-content-in-tests.test.ts` and record that the diagram test fails naming `pipeline.svg` and that the guard fails naming `tests/build/indexing.test.ts`. Do not proceed until both are seen red.
- [ ] T011 [US1] Run `pnpm run fonts:diagrams -- src/content/projects/images/doncoleman-ca/pipeline.svg` (needs `uv`), then confirm the file is under 16 KB and the diagram test is green.
- [ ] T012 [US1] In `tests/build/indexing.test.ts` replace the literal `"doncoleman.ca"` in the host rule (about line 29) with `setupConfig.zone`, which the file already reads from `setup/config.json`; change nothing else, loosen no guard. Re-run the two tests from T010 and record that both are green.
- [ ] T013 [US1] Check every figure and date in the story against its record (research R9; `git log --reverse`, the constitution footer, `.specify/chores/verify-gate-phase-6/report.md`, `CLAUDE.md`, `setup/github-ruleset.json`, `gh repo view drcdev/dcc-web --json visibility`) and fix the copy or the notes comment where they differ (SC-003).

**Checkpoint**: The story file, both pictures and the test edit exist; the two unit tests are green.

---

## Phase 4: User Story 2 - Go to the source (Priority: P2)

**Goal**: The story's source link opens the public repository.

**Independent Test**: On the story page, "Source code for doncoleman.ca" opens `https://github.com/drcdev/dcc-web` signed out.

- [ ] T014 [US2] Test (layer: E2E, existing `tests/e2e/projects-no-js.spec.ts` on the picked story, which asserts the source link): no new test; T018 runs it and the picked story must be this one (research R5). Second layer: none.
- [ ] T015 [US2] [PREVIEW-CHECK] Open "Source code for doncoleman.ca" in a signed-out window on the branch preview and confirm it opens the public `https://github.com/drcdev/dcc-web` (SC-004). Only Don can check this signed out.

---

## Phase 5: User Story 3 - Follow the thread from Cadence (Priority: P3)

**Goal**: The story links to Cadence where it names the pipelines' origin.

**Independent Test**: The link `/projects/cadence/` resolves and its sentence agrees with the Cadence story.

- [ ] T016 [US3] Test (layer: E2E, existing `tests/e2e/site-links.spec.ts`, which crawls every internal link): no new test; T018 runs it. Second layer: none, because only a browser crawl follows the rendered link. Confirm by reading `src/content/projects/cadence.mdx` that the sentence in T007 agrees with Cadence's own statement.

---

## Phase 6: Polish and cross-cutting

- [ ] T017 Run `pnpm run build` (a local build, which includes drafts) and confirm it succeeds and `dist/projects/doncoleman-ca/index.html` exists and is marked as a draft (build layer, C01 to C03, C07, C16). Production leaving the story out (C12, SC-001) is covered by the existing build-layer test `tests/build/drafts.test.ts`, which proves the rule on a production build and runs in the gate; do not hand-build in production mode. SC-001 on the real site is T024.
- [ ] T018 Run `node scripts/ci/changed-paths.ts --base origin/main` after `git fetch origin`, then the checks that tier needs (content-only is expected: ask Don before the full `pnpm run verify`, run it through the wrapper in the background under `perl alarm` with `ASTRO_PREVIEW_BACKGROUND=1`, and read `VERIFY_EXIT=`). It must pass on the new story as picked story: `projects.spec.ts`, `projects-no-js.spec.ts`, `seo.spec.ts`, `a11y.spec.ts`, `budget.spec.ts`, `diagram-fonts.spec.ts`, `site-links.spec.ts`. If the budget fails, shrink the PNG first, then drop the screenshot beside Problem; never raise the budget. Check for sibling worktrees on ports 4321 and 4322 first (`lsof`).
- [ ] T019 Confirm no visual baseline changed (`git status` shows no `*.png` under `tests/e2e/**-snapshots`). The plan expects no change because the visual project shoots fixture content only; if one did change, refresh both platforms with `pnpm run test:visual:update` then `pnpm run test:visual:update:linux` (needs Docker Desktop) per `.claude/skills/_shared/visual-baselines.md`.
- [ ] T020 [P] Tick completed tasks in this file and list the open `[PREVIEW-CHECK]` items for the PR body.
- [ ] T021 [PREVIEW-CHECK] Don reads `/projects/doncoleman-ca/` on `br-038-this-site-project-story-dcc-web-preview.drc-dev.workers.dev`: the wording and facts match what he told the interview and the notes comment, the Build part covers pipelines, constitution, single-approval rule and the gate (C04, C11), his quote is intact, and the copy reads as his.
- [ ] T022 [PREVIEW-CHECK] Don checks `/projects/` lists the story marked Draft with title, problem, themes, status and picture, and that the screenshot and the diagram look right in both light and dark themes.
- [ ] T023 [PREVIEW-CHECK] Don checks the Cadence link opens the Cadence story and reads right (C10).
- [ ] T024 [PREVIEW-CHECK] After merge, Don checks production `/projects/` still shows the five published stories and not this one (SC-001).

---

## Dependencies and order

- Phase 1 then Phase 2, then US1. T007, T008 and T009 are independent files ([P] for T008 and T009). T010 needs all three. T011 needs T008 and T010. T012 needs T010. T013 needs T007.
- US2 and US3 checks need US1 done; T017 and T018 need T011, T012 and T013.
- Preview checks (T015, T021 to T024) come after the PR is open and are not gates for auto-merge.

## Parallel example

T008 (diagram) and T009 (screenshot) can run while T007 (copy) is written.

## Implementation strategy

MVP is US1: the draft story with its two pictures and the one test-line edit. US2 and US3 add
no files; they are verification and copy rules on the same story. Red first: T010 must show
both unit tests failing before T011 and T012 turn them green.
