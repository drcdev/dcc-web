# Review report: draft-progress-snapshots (issue #48)

Fresh-eyes review phase. The reviewer did not write to `src/`, `tests/`, `scripts/`, `.github/`, `.claude/` or `docs/`. Branch `chore/draft-progress-snapshots` was reviewed at 3cbbc24 against `main`.

## Verdict

All three work items are done as planned and nothing beyond them. There are no CRITICAL or HIGH findings. The Principle III verdict, **not major**, holds against the real diff.

## Measurement

| | Visual tests (`--project=visual --list`) | PNGs in `tests/e2e/visual.spec.ts-snapshots/` |
|---|---|---|
| Before (plan) | 50 tests in 1 file | 100 (50 darwin, 50 linux) |
| After (this review) | **58 tests in 1 file** (`RUN_EXIT=0`) | **116** (58 darwin, 58 linux) |

## Checks

1. **Scope.** `git diff --name-status main...HEAD` lists only `tests/e2e/visual.spec.ts`, `docs/testing.md`, `.specify/chores/draft-progress-snapshots/plan.md` and 16 PNGs. `git diff --name-only main...HEAD -- src tests/fixtures scripts .github .claude playwright.config.ts package.json CLAUDE.md` is empty. There is no fixture, `src/` or config change.
2. **Baselines are additions only.** The snapshot directory's name-status shows exactly 16 `A` lines and no `M` or `D`:
   - 4 draft-darwin and 4 draft-linux;
   - 4 in-progress-darwin and 4 in-progress-linux.

   The names match `project-row-{draft,in-progress}-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png`.
3. **Subjects** (`tests/e2e/visual.spec.ts:188-201`).
   - `project-row-draft` uses `li[data-project="draft"]` and `project-row-in-progress` uses `li[data-project="every-part"]`.
   - Both use `path: "/projects/"` and `wait: onlyFixtureRows`, in the same shape as the `project-row-minimal` and `project-row-every-setting` entries. They are element shots on the fixture site through the shared `FIXTURE_SUBJECTS` loop.
   - The fixtures give the claimed states. `draft.mdx` is `status: in-progress` with `draft: true`, and `every-part.mdx` is `status: in-progress` and not a draft.
4. **The images show the claimed state.** 12 of the 16 new images were viewed, plus the `project-row-minimal-desktop-dark` darwin/linux pair for comparison.
   - **Draft row:** every image shows the boxed "Draft" mark above the "In progress" pill and the "Tooling" tag.
   - **In-progress row:** every image shows the "In progress" pill and the "Parts" tag, with no draft mark.
   - **Darwin vs linux:** the styling matches. Pill and mark outlines are orange in dark and a tinted fill with a brown outline in light. The layout is the same, with the image on the right on desktop and below on phone, and the same top rule.
   - **Differences:** only font rendering and line wrapping (DejaVu on Linux wraps the phone description to two lines). The existing `project-row-minimal` darwin/linux pair differs in the same way.
   - **Port contention:** the macOS captures taken while sibling worktrees held the ports look clean.
5. **Header comment** (`tests/e2e/visual.spec.ts:1-19`).
   - "58 images per platform" is right: shell 10 (header 4, footer 4, menu 2), not-found 4, sections 4, plus 10 fixture subjects × 4 = 58.
   - "ten fixture-site subjects" matches the 10 entries in `FIXTURE_SUBJECTS`.
   - "four project index rows (minimal, every-setting, draft and in progress)" is right.
   - The stale "the real draft rows" now reads "the real project rows", as planned.
6. **`docs/testing.md`.** The Visual row (line 26), the "Visual coverage" prose (lines 122-125) and the `projects` row (line 137) are updated as planned and agree with the header comment. The "Where a test goes" bullets are unchanged.
7. **Layer.** Both new tests are at the visual layer the plan names, for the plan's reason: they pin the pixels of a template state on frozen content. That the mark and pill render at all is already tested in `tests/component/project/ProjectRow.test.ts` and `tests/build/drafts.test.ts`.
8. **Tests green, per the implement summaries.** These results were relayed by the orchestrator and not re-run here, except the list, which reports 58.
   - **W1:** list 50 → 58; visual run 50 pass plus 8 missing-snapshot failures (the expected red).
   - **W2:** `test:visual:update` 58 pass; `test:visual:update:linux` 58 pass; visual rerun 58/58.
   - **W3:** unit setup tests 727 pass; lint and `verify:quick` green in every item.
9. **No check weakened.** `updateSnapshots: "none"`, the thresholds and the `toHaveCount` assertions in `onlyFixtureRows` are unchanged. The visual project only grew.
10. **Principle III.** There is no dependency, CI, contact-data, cost, constitution or design-system change, and no existing baseline moved. This is additions-only coverage, as in PR #43. **Not major.**

## Content-edit proof (criterion 6)

**Skipped in the review phase, because a list-only run proves nothing here.**
- The visual tests are built from static arrays (`WIDTHS`, `THEMES`, `FIXTURE_SUBJECTS`), so `--list` reports 58 whatever the content says. It cannot show that a content edit leaves the pixels alone.
- The real proof needs a `--project=visual` run. The reviewer did not do one because sibling worktrees held ports 4321 and 4322.
- The diff does not touch what makes the project immune to content edits: element shots on fixture content, with the real rows removed by `onlyFixtureRows`. The two new subjects work the same way as the two existing rows.
- **The full visual pass is left to the orchestrator's verify gate and CI `verify`.**
- No scratch edit was made, and `git status` stayed clean throughout.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

- **L1: missing commit trailers.** Commits 03d2c27 (W1) and 3cbbc24 (W3) have no `Co-Authored-By` or `Claude-Session` trailers, while 7312652 and 85b0444 do. This is cosmetic.
- **L2: plan criterion 6 (`.specify/chores/draft-progress-snapshots/plan.md`).** The plan makes the content-edit proof a review check, but it needs a full visual run. A review phase that cannot hold ports 4321 and 4322 cannot run one reliably. Future chore plans should put that proof in the orchestrator's verify step.
- **L3: phase-2 history (`docs/testing.md:122`).** The sentence still says "two projects index rows". That is correct as history, and the next sentence records what #48 added, so it was left alone.

## Follow-ups for the PR body

- **Docker drift on three unrelated images.** W2's `test:visual:update:linux` rewrote the three `post-template-*-linux.png` baselines. This is Docker rendering drift, not a template change. W2 restored them with `git checkout`, so they are not in the diff. If CI `verify` ever fails on them, use the `visual-baselines` label and artifact instead of the local Docker images.
- **Sibling-worktree port contention.** W2's macOS run hit contention on ports 4321 and 4322 from sibling worktrees and was rerun when they were free. The review compared the darwin images it viewed with their linux twins and found no styling drift. The full visual pass is left to the verify gate and CI.
- The follow-ups already open from PR #43 (the footer's build-time year and the shared theme helper) are unaffected.

## Orchestrator note

The review subagent was refused the write to this file, so the orchestrator saved its returned text verbatim and committed it.
