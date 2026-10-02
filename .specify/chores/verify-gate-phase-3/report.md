# Review report: verify-gate-phase-3 (issue #26, phase 3)

Reviewed `git diff main...HEAD` (commits 107861c..9cf0ad3, W1 to W6) against `plan.md`, with fresh eyes. Read-only on everything except this file.

## Findings

### CRITICAL (1)

- **C1 Stray file outside the plan.** `5.py` (repository root, empty, 0 bytes) was added in commit 735befa (W5). No work item names it. It is most likely left over from a shell redirect. It is scope creep and must not ship.
  Fix: `git rm 5.py` and commit (`chore: remove stray file`).

### HIGH (0)

None.

### LOW (5)

- **L1 Fail-closed vs. the changed-paths comment.** `scripts/ci/verify-needs.ts:37-39` fails the aggregate when `changes.outputs.full` is unset. `scripts/ci/changed-paths.ts:100-104` still says "an unset output runs the full gate". After the split, an unset output does run the full gate in `static`, `build-tests` and `e2e`, but `verify` then goes red. This matches plan W1 rule 1 and errs on the safe side; no check is weakened. The only way to reach it is a throw from `appendFileSync` on `GITHUB_OUTPUT`, which is very unlikely.
  Fix (optional, follow-up): extend that comment with "and the aggregate `verify` fails closed".
- **L2 The budget run restarts both web servers.** `playwright.config.ts:26,38` sets `reuseExistingServer: !process.env.CI`. In CI, `test:e2e:parallel` shuts both servers down, then `test:budget` (`.github/workflows/ci.yml:139`) starts them again: a fresh D1 plus `wrangler dev`, and `build:fixtures` plus `astro preview` (about 1 min). If a `workerd` child process outlived the first shutdown on port 4321, the second start would fail with "already used". This is unlikely, because Playwright kills the whole process group on Linux. The plan accepts the cost (Risks, Out), and it is acceptable for this phase.
  Fix: none now. Covered by the budget `[PREVIEW-CHECK]` and the plan's fixture-server follow-up.
- **L3 `test:build` runs in its own fresh job for the first time.** `.github/workflows/ci.yml:102`.
  - Before the split, it ran in the same checkout after `lint` and `typecheck` (`astro check`). Now it runs straight after install.
  - I found nothing that depends on generated `.astro/` state.
  - No test reads git history; the only `HEAD^` is inside the text of `workflows.test.ts`. So the default one-commit checkout is enough.
  - Only the first CI run proves this.

  Fix: watch `build-tests` on the PR's first run (part of the wall-time `[PREVIEW-CHECK]`).
- **L4 Docs row not updated.** `docs/testing.md:20`, row "Real `astro build`", still says "plus `pnpm run build` in `verify`". That is true of the local script, but in CI the build runs in the `e2e` job.
  Fix: append "(the `e2e` job in CI)".
- **L5 Line width.** `docs/setup.md:339` is 116 columns after rewrapping; the file wraps at about 100 elsewhere. Some other lines in the file are already over 100, and no linter checks this.
  Fix: rewrap at about 100.

## Checks

1. **Work items as planned, nothing beyond: FAIL (C1).**
   - W1 to W6 each match the plan in their files: `scripts/ci/verify-needs.ts` plus its test, the `package.json` scripts, `playwright.config.ts` (`workers` only), `ci.yml` plus `workflows.test.ts`, two docs, and the chore skill's Ship step 6 sentence.
   - The `plan.md` changes only tick the W boxes.
   - Untouched, as the plan requires: `src/`, `tests/e2e/**`, `tests/build/**`, `vitest.config.ts`, the visual baselines, `visual-baselines.yml` and `major-change.yml`.
   - The only extra file is `5.py`.
2. **Named tests present and green: PASS.**
   - Present:
     - `tests/unit/ci/verify-needs.test.ts` (new);
     - the rewritten ci.yml test groups in `tests/unit/ci/workflows.test.ts`;
     - in `tests/unit/site/config-files.test.ts`: the new script strings, the budget `--workers=1` case, the Vitest and Playwright coverage guards, the `workers` re-import test, and the updated `test` string.
   - Every case in the W1 table is covered, including invalid, empty, `null`, `[]` and string `NEEDS` values through `run()`. `changed-paths.test.ts` does not start the script as a child process, so testing an exported `run(env)` was the right choice.
   - Re-run here: `perl -e 'alarm 600; exec @ARGV' pnpm exec vitest run --project unit tests/unit/ci/ tests/unit/setup/ tests/unit/site/config-files.test.ts`. Result: **14 files, 469 tests passed** in 2.4 s, including `drift.test.ts`, `pipeline-pr-author.test.ts` and `changed-paths.test.ts`.
3. **Coverage mapping true: PASS.** Each replaced assertion from main's `workflows.test.ts`, and where it is asserted now:
   - **Whole-file checks:** kept verbatim. Added: `expect(contents).toMatch(/concurrency:[\s\S]*?cancel-in-progress:\s*true/)`.
   - **"has job verify":**
     - `toMatch(/^\s{2}verify:/m)`;
     - each job's name equals its id: `expect(m![1]).toBe(id)`;
     - the five names are unique: `expect(new Set(names).size).toBe(names.length)`;
     - no job uses the gate's name: `not.toMatch(/name:\s*major-change-approval\b/)`.
   - **"a step running `pnpm run verify`":** `expect(runCount(contents, command)).toBe(1)` and `expect(runCount(text, command)).toBe(1)`, for each of:
     - `static`: `lint:secrets`, `lint`, `typecheck`, `test:unit`, `test:worker`;
     - `build-tests`: `test:build`;
     - `e2e`: `build`, `test:e2e:parallel`, `test:budget`.

     Plus `not.toMatch(/pnpm run verify/)`. The W2 guards prove these scripts cover every Vitest and Playwright project.
   - **Upload on failure:**
     - in `e2e`, after the budget step: `toMatch(/if:\s*failure\(\)[\s\S]*?uses:\s*actions\/upload-artifact@[0-9a-f]{40}/)`;
     - the three paths are checked with `toContain`;
     - `expect(count(contents, "upload-artifact@")).toBe(1)`.
   - **`fetch-depth: 2`:** `expect(stepBlock(changes, "actions/checkout@")).toMatch(/fetch-depth:\s*2\b/)`.
   - **Change detection after setup-node, before install:**
     - the step has `id: changes` and comes after `actions/setup-node@`;
     - `toMatch(/outputs:\s*\n\s+full:\s*\$\{\{\s*steps\.changes\.outputs\.full\s*\}\}/)`;
     - `changes` has no install;
     - every job that installs has `toMatch(/^\s{4}needs:\s*changes\s*$/m)`.
   - **Playwright install and the gate depend on `full`:**
     - the `build-tests` and `e2e` job headers `toContain("    if: needs.changes.outputs.full != 'false'\n")`;
     - each gated `static` step's block `toContain(gated)`;
     - `expect(count(contents, "playwright install")).toBe(1)`, in `e2e`.
   - **Secretlint on the skip path, after install:** `expect(stepBlock(staticJob, "pnpm run lint:secrets")).not.toMatch(/\bif:/)`, and it comes after install.
   - **Installs unconditionally:** `stepBlock(job(contents, id), "pnpm install --frozen-lockfile")` has `not.toMatch(/\bif:/)` in all three jobs.
   - **No job-level `if:`, so `verify` always reports:**
     - the `static` job header has no `if:`;
     - `verify` has `toMatch(/^\s{4}if:\s*always\(\)\s*$/m)`;
     - its `needs`, sorted, equals `["build-tests","changes","e2e","static"]`;
     - `toMatch(/NEEDS:\s*\$\{\{\s*toJSON\(needs\)\s*\}\}/)`.
   - **`checks: read` on the job with the crawl:**
     - `e2e` has `toMatch(/permissions:\s*\n\s+checks:\s*read\s*\n\s+contents:\s*read/)`;
     - the other four jobs have `contents: read` and `not.toContain("checks:")`.
   - **Crawl after the gate, PR only, `GITHUB_TOKEN` only:**
     - the crawl comes after `pnpm run test:budget` in `e2e` and appears once;
     - `toMatch(/if:.*github\.event_name == 'pull_request'/)`;
     - the only secret is `secrets.GITHUB_TOKEN`, and there is no `CLOUDFLARE` or `CF_`.
4. **`ci.yml` behaviour: PASS** (L2 and L3 noted).
   - **`needs` edges.** `static`, `build-tests` and `e2e` each need `changes` (lines 40, 81, 107). `verify` needs all four jobs (line 163).
   - **The aggregate always runs.** `if: always()` (line 164) makes it run even after a job it depends on failed, was cancelled or was skipped. Without it, `verify` would be skipped, and GitHub counts a skipped required check as passing.
   - **`verify-needs.ts` fails on anything unexpected:**
     - a `failure` or `cancelled` result in any job;
     - `skipped` on `static` or `changes`;
     - `skipped` on `build-tests` or `e2e`, unless `full === "false"`;
     - a missing job;
     - a missing or unknown `full`;
     - invalid JSON.
   - **Outputs wiring.**
     - `outputs.full: ${{ steps.changes.outputs.full }}` (line 22) reads the step with `id: changes` (line 35), which writes `full=true|false` to `GITHUB_OUTPUT`.
     - Jobs read it with `needs.changes.outputs.full != 'false'`, at job level (lines 82, 108) and on single steps (lines 64, 68, 72, 76). The `needs` context is allowed in a step `if:`.
     - A step `if:` also implies `success()`, so a lint failure stops the later `static` steps, just as the old `&&` chain did.
   - **Skip-safe PR stays green.** `changes` succeeds with `full` set to `false`. In `static`, install and secretlint run, the gated steps are skipped, and the job succeeds. `build-tests` and `e2e` are skipped. The decision passes, so `verify` is green.
   - **Every local `verify` check runs exactly once.**
     - `static`: `lint:secrets`, `lint`, `typecheck`, `test:unit`, `test:worker`.
     - `build-tests`: `test:build`.
     - `e2e`: `build`, then `test:e2e:parallel` (the `e2e`, `a11y`, `visual` and `sections` projects), then `test:budget` (the `budget` project).

     Together these equal the local `test` (`vitest run` for both projects, plus the worker tests) and `test:e2e` (all five Playwright projects). Nothing is missing or duplicated.
   - **Secretlint** always runs; its step has no `if:` (line 60).
   - **Preview crawl** runs on pull requests only (line 142), after the build and budget steps, with its environment unchanged. The old step-level `full` check is now the job-level `if:`.
   - **Failure upload:** `playwright-output` uploads with `if: failure()` in `e2e`, with the same three paths.
   - **Chromium install** happens only in `e2e`.
   - **Action pins:** every action keeps its main SHA: checkout `3d3c42e…` v7.0.1, pnpm `ea17c68…` v6.1.0, setup-node `8207627…` v7.0.0, upload-artifact `043fb46…` v7.0.1.
   - **Unchanged:** workflow `permissions: contents: read`, `concurrency` with `cancel-in-progress: true`, and the triggers.
   - **`fetch-depth: 2`** is set in `changes`, the only job that diffs against `HEAD^1`.
   - **`NEEDS: ${{ toJSON(needs) }}`** is passed through `env:`, so multi-line JSON causes no shell quoting problems.
   - **Aggregate name:** `name: verify` (line 162), exactly the context the ruleset requires.
   - **Budget restart:** CI sets `reuseExistingServer` to false, so the budget run starts both web servers again. This is acceptable and was planned; the risk is L2.
5. **`playwright.config.ts`: PASS.** The only change is `workers: process.env.CI ? 4 : undefined` plus a comment. `webServer`, the projects, `retries: 0`, `updateSnapshots: "none"` and the `toHaveScreenshot` settings are unchanged.
6. **`package.json`: PASS.**
   - `git diff main -- package.json` leaves `verify` and `test:e2e` byte-identical.
   - The new scripts point at real targets: `--project unit` and `--project build` match `vitest.config.ts`, and `pnpm --filter ./worker test` is the old inline command.
   - `test:e2e:parallel` and `test:budget` together cover all five Playwright projects with no overlap. The guard compares sorted lists, so a duplicate would fail it.
7. **Alignment: PASS.**
   - The chore SKILL.md diff is a single change at line 347 (Ship step 6). The shared sections (Local toolchain, the pre-PR pause, `[PREVIEW-CHECK]`, the visual baselines step and the PR author block) are untouched.
   - `pipeline-pr-author.test.ts` is green.
   - `deliver`, `tweak` and `squash` only say "the `verify` check on the PR is expected to be red on visual only". That is still true, because a failing `e2e` job turns the aggregate red. No outdated "verify job" wording was found, so there is no follow-up.
8. **Docs match `ci.yml`: PASS** (L4 and L5 noted).
   - `docs/testing.md`, "CI jobs" section: the job names, the scripts in each job, the `e2e` step order (build, parallel run, budget, then the crawl on PRs), 4 workers in CI and 1 for budget, and the aggregate's pass rule all match.
   - `docs/setup.md` item 11 matches the new job layout and the skip-safe behaviour.
9. **Principle III and the gate: PASS.**
   - Still **MAJOR**: the diff changes `ci.yml`, which produces the required check, and how `playwright.config.ts` behaves in CI. Don must approve, and auto-merge stays off.
   - No dependency is added. The repository is public, so the extra runner minutes cost $0.
   - No check is weakened: every check runs once, secretlint always runs, and the aggregate fails closed.
   - The drift guard in `tests/unit/ci/changed-paths.test.ts` is green, and the new files contain no `specs/` path strings.

## Measurement

- **Before:** CI run 36930871071 (push to `main`, merge commit `b92ac71` of PR #29), job 110599499962. The single `verify` job took **870 s (14.5 min)**; its "Run the verify gate" step took 799 s.
- **After:** **`[PREVIEW-CHECK]`, still to come.**
  - Measured on this PR's first CI run, from the earliest job `startedAt` to the `verify` job's `completedAt` (`gh run view <id> --json jobs`).
  - Repeated on the push run on `main` after merge.
  - Target ≤ 10 min; the plan estimates about 8 to 9 min.
- **Local:** the plan names no local measurement to re-run, because every target is a CI figure. None was taken.

## Follow-ups for the PR body

- Fix before the PR: remove `5.py` (C1).
- `[PREVIEW-CHECK]` items:
  - Wall time ≤ 10 min on the PR's run, with each job's time recorded. Watch `build-tests` on its first run as its own job (L3). Repeat on the push run on `main`.
  - The aggregate reports the required `verify` check, and the PR can merge on it together with `major-change-approval`.
  - `visual` passes at 4 workers against the committed Linux baselines. `budget` passes in its own one-worker run, with the web servers starting again cleanly (L2).
  - After merge, `pnpm setup:check --item github-ci-workflow` and `--item launch-main-checks` report complete.
- Optional nits: L4 (`docs/testing.md:20`, name the `e2e` job), L5 (rewrap `docs/setup.md:339`), and the optional comment in `scripts/ci/changed-paths.ts:103` (L1).
- Carried over from the plan:
  - make the fixture web server conditional when only `budget` runs;
  - make local `test:e2e` run the way CI does (parallel projects, then budget alone);
  - move the preview crawl into its own job if waiting for the preview build adds to the wall time;
  - later phases of #26: D5, D6, D7 and D8.
- Merge mode: MAJOR, auto-merge off, waiting for Don's approval.

## Review round 2

Reviewed fix commit `6e61443` against the round-1 findings. Read-only.

- **C1 closed.** `git show --stat HEAD` touches only `5.py` (deleted, 0 lines), `docs/setup.md` (+3/-2) and `docs/testing.md` (+1/-1). `git ls-files 5.py` is empty and the file is not on disk.
- **L4 closed.** The `docs/testing.md:20` "Real `astro build`" row now says `pnpm run build` "runs in the `e2e` job in CI and in the local `verify` script". This matches `.github/workflows/ci.yml`, where `pnpm run build` is at line 133, inside the `e2e` job (lines 105–160).
- **L5 closed.** `git diff HEAD~1 -- docs/setup.md` only rewraps the item 11 paragraph. The words are the same and the substance is unchanged. Lines 336–341 are now 93–98 columns wide.
- **Scope.** `git diff main...HEAD --name-only` lists 12 files, all inside plan scope:
  - `.claude/skills/chore/SKILL.md`
  - `.github/workflows/ci.yml`
  - `.specify/chores/verify-gate-phase-3/{plan,report}.md`
  - `docs/setup.md`, `docs/testing.md`
  - `package.json`, `playwright.config.ts`
  - `scripts/ci/verify-needs.ts`
  - `tests/unit/ci/{verify-needs,workflows}.test.ts`
  - `tests/unit/site/config-files.test.ts`
- **No drift.** `git diff HEAD~1` is empty for `ci.yml`, `playwright.config.ts`, `package.json` and `scripts/ci/verify-needs.ts`.
- **Tests.** `vitest run --project unit` over `tests/unit/ci/`, `tests/unit/setup/` and `tests/unit/site/config-files.test.ts` passed: 14 files, 469 tests, 0 failures, 2.9 s. The build project, Playwright and the full gate were not run.
- **Still open, accepted:** L1 (fail-closed `verify` vs. the `changed-paths.ts` comment), L2 (budget run restarts the web servers in CI) and L3 (`test:build` runs in its own job for the first time). These are watch items for the first CI run.

Totals after round 2: CRITICAL 0, HIGH 0, LOW 3. Ready for the verify phase.
