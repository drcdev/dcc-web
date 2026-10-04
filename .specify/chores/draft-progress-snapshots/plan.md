# Chore plan: draft-progress-snapshots (issue #48)

Branch: `chore/draft-progress-snapshots`, at `main` commit fb9dd8e (after #54 merged).
Issue: https://github.com/drcdev/dcc-web/issues/48. The PR body says `Closes #48`.

## Goal

The `visual` project pins two projects index rows on the fixture site (`project-row-minimal`,
a shipped project, and `project-row-every-setting`, an experiment), but no row that shows the
draft mark (`<p data-draft-mark>Draft</p>` in `ProjectRow.astro`) and no row whose status pill
reads "In progress". Both are template states of `ProjectRow.astro` and `StatusPill.astro` that
can regress unnoticed. [#48](https://github.com/drcdev/dcc-web/issues/48) (a follow-up named in
PR #43's plan, item 5) adds one fixture element snapshot for each, using fixture projects that
already exist, so no fixture, page, component or style changes.

**This chore is the "chore about the baselines themselves" exception** that the pipeline's
visual-baselines step names. New baseline images are expected and must be committed: 8 new
`-darwin` PNGs and 8 new `-linux` PNGs. No existing baseline image may change. Any change to an
existing image is a regression to fix, not a baseline to refresh.

## Acceptance

Before measurement (local, this worktree, `playwright test --project=visual --list` via the
wrapper): **50 visual tests in 1 file**; `ls tests/e2e/visual.spec.ts-snapshots | wc -l` =
**100** PNGs (50 `*-darwin.png`, 50 `*-linux.png`).

Mechanical criteria (the review phase checks each one):

1. **Two new subjects** in `FIXTURE_SUBJECTS` of `tests/e2e/visual.spec.ts`:
   - `project-row-draft`: locator `li[data-project="draft"]` on `/projects/` of the fixture
     site, `wait: onlyFixtureRows`. The shot holds the `[data-draft-mark]` element (the review
     confirms it is visible in the image).
   - `project-row-in-progress`: locator `li[data-project="every-part"]` on `/projects/` of the
     fixture site, `wait: onlyFixtureRows`. The row has the in-progress pill and no draft mark.
   - Both are element shots on `http://localhost:4322`, like every other fixture subject.
2. **Test count:** `--project=visual --list` reports **58** tests in 1 file (was 50).
3. **Snapshot files:** `tests/e2e/visual.spec.ts-snapshots/` holds **116** PNGs, 58
   `*-darwin.png` and 58 `*-linux.png` (was 100). The 16 new files are
   `project-row-{draft,in-progress}-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png`.
4. **No existing baseline changes:**
   `git diff --name-status main -- tests/e2e/visual.spec.ts-snapshots/` shows exactly 16 lines,
   all `A`. No `M` or `D` line.
5. **The visual project passes** with the new baselines: `--project=visual` all 58 pass on macOS
   locally, and on Linux in CI (`verify` green).
6. **Content-edit proof** (review phase, scratch, never committed): add a word to the `problem`
   of one real project in `src/content/projects/`, rebuild the fixture site (port 4322 free),
   run `--project=visual`, all 58 pass, revert. `git status --porcelain src/` is empty
   afterwards.
7. **Inventories updated:** the head comment of `visual.spec.ts` says 58 images per platform,
   ten fixture-site subjects and four project index rows (minimal, every-setting, draft and
   in progress). `docs/testing.md` Visual row, "Visual coverage" prose and the `projects` row of
   the coverage table name the two new subjects.
8. **Scope of the diff:** `git diff --name-only main` lists only `tests/e2e/visual.spec.ts`,
   the 16 new PNGs, `docs/testing.md` and `.specify/chores/draft-progress-snapshots/**`.
   Nothing under `src/`, `tests/fixtures/`, `scripts/`, `.github/`, `.claude/`, nor
   `playwright.config.ts`, `package.json` or `CLAUDE.md`.

## Scope

**In:**

- `tests/e2e/visual.spec.ts`: two `FIXTURE_SUBJECTS` entries and the head comment.
- `tests/e2e/visual.spec.ts-snapshots/`: 16 new PNGs (8 darwin, 8 linux).
- `docs/testing.md`: line 26 (Layers table, Visual row), the "Visual coverage" prose (line ~123,
  "two projects index rows"), and line 136 (`projects` row of the coverage table).
- This plan, and the review report later.

**Out:**

- Any fixture change. `tests/fixtures/projects/draft.mdx` (in-progress, `draft: true`) and
  `every-part.mdx` (in-progress, published) already give both states, and `FIXTURE_PROJECTS`
  already keeps both rows.
- The story page's draft notice (`[data-draft-notice]` in `StoryHeader.astro`). It is a
  different element on a different template, and the issue names only the index row.
- A `[data-draft-mark]`-only shot (see W1 for why the whole row is shot).
- `playwright.config.ts`, CI workflows, `scripts/visual-baselines-linux.sh`, CLAUDE.md and the
  pipeline skills. The shared baseline sentences stay true.
- A new "Measured gate times" row: four more element shots per platform on an existing project
  is not a layer or job change, so the rule "re-measure when a layer or job changes" does not
  fire.

**Follow-ups for the PR body:** none new. Already-open follow-ups from PR #43 (the footer
build-time year, the shared theme helper) are unaffected.

## Constitution Check

- **I. Test-First:** W1 adds the two test cases before any baseline exists; with
  `updateSnapshots: "none"` they fail on the missing baseline (seen red) until W2 generates the
  images. No production code changes.
- **II. Automated Release Gate:** nothing skipped or weakened; the visual project grows from 50
  to 58 blocking tests; the full gate runs locally and in CI (`tests/**` is a full-tier path).
- **III. Human Review for Major Changes:** no criterion fires. No dependency, contact-data, CI,
  cost or constitution change. The design system, layout and visual identity do not change: not
  one pixel of the real site moves, and the new images only pin current templates. Additions-only
  baselines are coverage, as in PR #43. Verdict: **not major**.
- **IV. First-Party Before Custom:** Playwright's own `expect(locator).toHaveScreenshot()`
  element shots and its `--update-snapshots` flow (via the existing `test:visual:update` scripts);
  no custom script. No Astro decision, so no Astro docs page is cited.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected; fixture content is reused as is.
- **VII. Private Data:** unaffected.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected (a few seconds more on free CI runners).
- **X. Accessible, Fast and Private:** unaffected; axe and the budget are unchanged.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, plan in
  `.specify/chores/draft-progress-snapshots/`, `after_chore_*` commits.

## Work items

**Preamble for the implement subagent:**

- Run every toolchain command through the wrapper
  `/Users/doncoleman/.claude/jobs/1ebf5257/tmp/run.sh <alarm-seconds> pnpm <args>` from the
  worktree. Never use `timeout`; never `cd` to `/Users/doncoleman/Repos/dcc-web`.
- Before any Playwright run, check `lsof -i :4321 -i :4322`. A sibling worktree's server gives
  spurious 404s or ECONNREFUSED; wait and rerun.
- Do not touch `src/` or `tests/fixtures/`. If a test can only pass by changing the site, stop and
  report it.
- After each item run the targeted tests, then `pnpm run verify:quick`. Never the full
  `pnpm run verify` (the orchestrator runs it).

Order: W1 → W2 → W3. W2 needs W1; W3 describes the result.

### [x] W1 Two fixture row subjects in `visual.spec.ts`

**Files:** `tests/e2e/visual.spec.ts`.

**Change:** after the `project-row-every-setting` entry (line ~181-187), add, in the same shape:

```ts
{
  prefix: "project-row-draft",
  title: "fixture project row, draft",
  path: "/projects/",
  locator: (page: Page) => page.locator('li[data-project="draft"]'),
  wait: onlyFixtureRows,
},
{
  prefix: "project-row-in-progress",
  title: "fixture project row, in progress",
  path: "/projects/",
  locator: (page: Page) => page.locator('li[data-project="every-part"]'),
  wait: onlyFixtureRows,
},
```

Update the head comment (lines 1-19): "50 images per platform" → 58; "eight fixture-site
subjects" → ten; "two project index rows (minimal and every-setting)" → "four project index rows
(minimal, every-setting, draft and in progress)". Line 12's "(Related posts, the real draft
rows)" is stale since #54 published every real project; make it "the real project rows".

**Decision (made here):** shoot the whole draft row, not only `[data-draft-mark]`. It matches the
other project-row subjects, shows the mark in its place in the row (where a layout regression
would appear), and a tiny text-only element shot would be fragile and say little. The draft row
also carries an in-progress pill; the `every-part` row is the clean in-progress state (no draft
mark), so the two subjects isolate the two states.

**Test:** new-first. **Layer: visual**, the one primary layer: pixel identity of a template
state on frozen content is what only a snapshot shows. That the mark and the pill render at all
is already asserted at cheaper layers (`tests/component/project/ProjectRow.test.ts` for the
mark, `tests/build/drafts.test.ts` for the built index); this adds only the pixels, so it is not
a second layer for the same behaviour.

**Run:** `run.sh 120 pnpm exec playwright test --project=visual --list` reports 58. Then
`run.sh 600 pnpm exec playwright test --project=visual -g "project row, (draft|in progress)"`
fails on 8 missing baselines (record the red).

### [x] W2 Generate the new baselines (additions only)

**Files:** `tests/e2e/visual.spec.ts-snapshots/` (16 new PNGs).

**Steps:**

1. **macOS:** `run.sh 900 pnpm run test:visual:update` (first-party Playwright
   `--update-snapshots`; it only writes missing or over-threshold images). Run it in the
   background and do not run anything else that builds `dist/` at the same time.
2. **Linux (what CI compares):** `pnpm run test:visual:update:linux` in Docker (needs Docker
   Desktop; the orchestrator asks Don to start it). Fallback when Docker is unavailable: add the
   `visual-baselines` label to the PR, download the `visual-baselines-linux` artifact with
   `gh run download`, and copy only the eight new `project-row-{draft,in-progress}-*-linux.png`
   files. This step belongs to the orchestrator if the implement subagent cannot reach Docker.
3. Check `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` and
   `git diff --name-status main -- tests/e2e/visual.spec.ts-snapshots/`: only `??`/`A` entries
   for the 16 new files. If any existing image shows as modified, restore it
   (`git checkout -- <file>`) and report it as a regression or flake; never commit it.
4. Open the four darwin images and confirm the draft row shows "Draft" and the in-progress pill,
   and the every-part row shows "In progress" with no draft mark.

**Test:** existing (W1's tests turn green). **Layer: visual.**

**Run:** `run.sh 600 pnpm exec playwright test --project=visual`: 58 passed.

### W3 Update `docs/testing.md`

**Files:** `docs/testing.md`.

- Line 26 (Layers, Visual row): "two projects index rows" → "four projects index rows (shipped,
  experiment, draft and in progress)".
- "Visual coverage" prose (line ~123): "two projects index rows" → the same four, and add a short
  sentence that #48 added the draft and in-progress rows.
- Line 136 (`projects` row): name `project-row-draft` and `project-row-in-progress` next to
  `project-row-minimal` and `project-row-every-setting`, and replace "the fixture index also
  lists real draft rows" with "the fixture index also lists the real rows, which the test
  removes".
- "Where a test goes" bullets stay byte-identical.

**Test:** `no behaviour: n/a (documentation of the test inventory)`. `verify:quick` covers the
docs lint.

## Docs citations

The usage pattern is unchanged: element shots with `expect(locator).toHaveScreenshot(name)` and
baselines written by `--update-snapshots`, exactly as the eight existing fixture subjects do.
Reference: Playwright "Visual comparisons" (https://playwright.dev/docs/test-snapshots) and
`LocatorAssertions.toHaveScreenshot`
(https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-screenshot).
No Astro choice is made, so no Astro docs page applies.

## Risks

- **Docker Linux images can differ from CI.** The new text ("Draft", "In progress", the fixture
  titles and problems) is plain ASCII already rendered in other baselines, so Docker should match;
  CI `verify` is the check. If it fails only on the new linux images, use the label-and-artifact
  fallback.
- **`test:visual:update` rewriting an existing image.** It rewrites only images past the
  threshold, which would mean a real regression or a flake. W2 step 3 refuses such a change.
- **Port collisions** with sibling worktrees on 4321/4322 (mass ECONNREFUSED or 404s). Check
  `lsof` first; rerun when idle.
- **Row order.** `onlyFixtureRows` removes the real rows, so each fixture row's position depends
  only on the four fixtures. The draft row is first (2026-01-02) and every-part third; neither
  moves when real projects change.
- **The draft row depends on the fixture build listing drafts.** It already does
  (`onlyFixtureRows` asserts four rows including `draft`), and `toHaveCount(1)` fails loudly if
  that ever changes.
