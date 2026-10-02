# Review report: verify-gate-phase-4 (issue #26, phase 4)

Reviewed on 2026-10-02 against `plan.md`, `git log main..HEAD` (7 commits: plan, W1 to W6) and `git diff main...HEAD` (16 files). Fresh eyes, read-only on everything but this file. (The review subagent was blocked from writing this file and returned the text; the orchestrator saved it verbatim.)

## Verdict

All six work items are done as planned, and nothing in the diff goes beyond them. Every named test is present and green. The fail-closed paths hold, and no check is weakened. No CRITICAL or HIGH findings. Seven LOW findings, all cosmetic or hardening.

## Evidence

### 1. Scope (Development Workflow)

Every hunk traces to a work item:

| File | Work item |
|---|---|
| `scripts/ci/changed-paths.ts`, `tests/unit/ci/changed-paths.test.ts` | W1 |
| `tests/build/focus-pocus.test.ts` to `tests/unit/content/focus-pocus.test.ts` (94 % similarity: root URL plus one comment line) | W2 |
| `package.json` (2 added lines), `tests/unit/site/config-files.test.ts`, `tests/unit/ci/content-tier.test.ts` | W3 |
| `.github/workflows/ci.yml` (one output line, one `if:` and one new step), `tests/unit/ci/workflows.test.ts` | W4 |
| `docs/testing.md` | W5 |
| four `SKILL.md` files, `tests/unit/setup/pipeline-verify-wording.test.ts`, `CLAUDE.md` | W6 |

`src/`, `tests/e2e/**`, `vitest.config.ts`, `playwright.config.ts`, `scripts/ci/verify-needs.ts` and the visual baselines are untouched (`git diff` over those paths is empty). The only change under `tests/build/` is the focus-pocus removal.

### 2. Tests run (perl alarm, `--project unit`)

- `tests/unit/ci tests/unit/setup tests/unit/site/config-files.test.ts tests/unit/content/focus-pocus.test.ts`: **60 files, 913 tests passed** (3.0 s), `VERIFY_EXIT=0`. This includes `changed-paths`, `content-tier`, `workflows`, `verify-needs`, `drift`, `pipeline-pr-author`, `pipeline-verify-wording`, `config-files` and the moved focus-pocus file (5 tests).
- `tests/unit/setup-check` (holds `checks/github-ci-workflow.test.ts`): **390 tests passed**, `VERIFY_EXIT=0`.
- The full verify, Playwright and the `build` project were not run, per the brief.

Every test the plan names exists with the planned cases. W1: the `isContentOnly` true and false lists match the plan's table exactly, along with the tier cases, the non-PR events, the fail-closed inputs, the `!contentOnly || full` invariant and the three `toOutput` strings. W3: both `config-files` cases, including the exact member list and the "run by `verify`" trace. W4: the renamed output case and the new one-step case. W6: per-pipeline and alignment describes, plus the `verify:quick` existence case.

### 3. Coverage mappings

- **Build files that read real content.** These are `indexing.test.ts` (real `astro build`, sitemap, `launch.expectedPaths`) and `local-site.test.ts` (the real `services` draft, the `about.mdx` nav entry, `about` script count). Both are in `test:build:content`. `config-files.test.ts` pins the exact string.
- **Skipped files: `drafts`, `blog-listing`, `page-validation`, `post-validation`, `project-validation`, `fixture-site`.** I read every `describe`/`it` name and grepped each file for real slugs and `src/content` reads. Their assertions are on fixture posts, pages and projects (`valid/draft.mdx`, `minimal.mdx`, `listing-post-NN`, `workshops`, `legal`) and on config-driven topics. `fixture-site.test.ts` reads `realPostNames` dynamically, but only to check the harness copies or omits them, which is not affected by what the posts say. The machinery these files exercise lives in schemas, `content.config.ts`, `src/lib`, components and pages, and none of those paths is content-only. One exception is borderline, see L6.
- **Real content still proven on a content-only PR.** `pnpm run build` in `e2e` (unchanged, still job-gated only on `full != 'false'`) and the two listed build files. `test:unit` holds about 15 unit files that read real content (`launch-content`, `navigation`, `post-schema`, `body`, `project-body`, `privacy-policy`, `focus-pocus`, ...) and still runs in `static`.
- **focus-pocus.** All 5 `it` titles and bodies are unchanged. Only `root` moved up one level. The unit project's include `tests/unit/**/*.test.ts` picks it up, and it passes.
- **Guard.** `content-tier.test.ts` passes on the current tree (every slug, every needle, every unlisted file). It would catch a new top-level `tests/build/*.test.ts` that names a real slug as `x.mdx`, `x/index.html` or `/x/`. Gaps: it does not recurse (L2) and does not see dynamic reads (documented in `docs/testing.md`).

### 4. Fail-closed trace

`changes` job: `git diff --name-only --no-renames HEAD^1 HEAD` on the PR merge commit (unchanged from phase 3). `--no-renames` lists both the old and the new path of a rename. Deleted files appear by name. git quotes unusual names (non-ASCII, `"`, `\`, control characters) in double quotes, and a leading `"` matches neither regex, so such a name runs the full gate. `isContentOnly` rejects `..`, a leading `/` and `\` before the anchored regexes. Its character class `[A-Za-z0-9._-]` rejects spaces. `src/content/schemas/post.ts` and `src/content.config.ts` are not content-only, and both are tested.

| Case | `full` / `content_only` outputs | `build-tests` | `static`, `e2e` | `verify-needs.ts` |
|---|---|---|---|---|
| Output unset (script threw) | `''` / `''` | job runs (`'' != 'false'`); `test:build` runs (`'' != 'true'`) | all steps run | fails: `full` is not `"true"`/`"false"` |
| Garbled (`yes`) | `yes` / `yes` | job runs; `test:build` runs | all run | fails on `full` |
| `content_only=true`, `full=true` | | job runs; only `test:build:content` runs | all run (neither job reads `content_only`) | passes only if every job succeeded |
| Skip-safe | `false` / `false` | job skipped | `static`: secretlint only; `e2e` skipped | accepts the two skips because `full === "false"` |
| Full | `true` / `false` | job runs; only `test:build` runs | all run | every job must succeed |
| Mixed content and code | `true` / `false` (unit-tested with a schema file) | full `test:build` | all run | |
| `push` / `workflow_dispatch` / `pull_request_target` | `true` / `false` (unit-tested) | full | all | |

The two step conditions are exact complements on one literal, so exactly one step runs for any value. Step `if:` implies `success()`, so a failed install skips both steps and the job fails. CI triggers only on `pull_request` and `push` to `main`, so `main` always takes the full path.

### 5. Alignment rule

The paragraph and sentence appear exactly once in each of the four skills. The new test flattens whitespace and asserts both per skill and together, and it passes. The stale "no scoped or tiered E2E" sentence is gone from all four. The diff shows no other hunk in any skill: Local toolchain, release gate, pre-PR pause, `[PREVIEW-CHECK]`, visual baselines and the PR author block are untouched, and `pipeline-pr-author.test.ts` is green. The chore skill keeps "A chore that changes the gate itself ..." after P, as planned. The deliver E2E bullet is shortened as planned. The new `CLAUDE.md` bullet sits in the "A change to any of these goes into all four together" list.

### 6. `docs/testing.md` against the code

The output names `full`/`content_only`, the script names, the skip-safe allowlist, the content patterns (`.mdx`, image and video extensions under the three collections), the fail-closed rule, the skipped-file list (all six non-listed files in `tests/build/`), the build budget (20/12 total, 7/0 on content-only) and the 33 s figure all match. The 33 s was re-measured exactly in this review. Two wording slips: L4 and L5.

### 7. Principle III and Principle II

The real diff changes `.github/workflows/ci.yml`, `scripts/ci/changed-paths.ts` and `package.json` scripts, all CODEOWNERS paths that decide what the required `verify` check runs. **MAJOR still holds.** Don's approval is needed, with no auto-merge.

No check is weakened:

- The `verify` script string is byte-identical (the `config-files` exact-string case is unchanged and green).
- `test:build` is unchanged and runs in full on every non-content PR and every `main` push.
- `verify-needs.ts` is unchanged, and so is the job-level gating.

### 8. Secrets

No `.env*` path is in the diff. The diff adds no token, key or secret literal, and `ci.yml` still references only `GITHUB_TOKEN`.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

- **L1** `tests/unit/content/focus-pocus.test.ts:9`: there is no space after the comma in `new URL("../../../",import.meta.url)` (lint has no formatter, so nothing caught it). Fix: add the space.
- **L2** `tests/unit/ci/content-tier.test.ts:44`: the guard lists `tests/build` with a flat `readdirSync`, but the `build` project includes `tests/build/**/*.test.ts`. A nested build test that names real content would escape. Fix: walk `tests/build` recursively.
- **L3** `tests/unit/ci/content-tier.test.ts:9`: the guard keeps only arguments that start with `tests/build/`. A stray file argument elsewhere is silently ignored, though the plan's case 1 asked for "each under `tests/build/`". Fix: assert that every positional argument after `--project build` starts with `tests/build/`.
- **L4** `docs/testing.md:59`: "the five pipeline `SKILL.md` files". One of the five in `READ_BY_CHECKS` is `setup-walkthrough`, which is not a pipeline. Fix: write "the four pipeline `SKILL.md` files, `setup-walkthrough`'s `SKILL.md`".
- **L5** `docs/testing.md:55`: "The checks are in this order, and the first match wins" does not match `decide()`. A non-PR event and a missing or empty diff go to full **before** the skip-safe check. Fix: open the paragraph with "A push to `main` and a missing or empty diff are full; otherwise the first matching row wins".
- **L6** `tests/build/drafts.test.ts:94-108`: these assertions read the home page built from the **real** `src/content/pages/index.mdx`, because fixture builds copy `src/`: "mentions no draft ... home page" and "leaves the Recent writing section off the home page". The guard leaves out the `index` slug by design. The assertions test the `<RecentWriting />` machinery, not the home copy, so only a text collision (for example a literal "Recent writing" heading in `index.mdx`) would trip them, and that shows only on the `main` push run. This is covered by the documented residual risk but not named there. Fix: name `drafts.test.ts`'s home-page reads in the residual-risk paragraph, or give fixture builds a fixture home page (see follow-ups).
- **L7** `.claude/skills/chore/SKILL.md:222`, `.claude/skills/deliver/SKILL.md:185`: sentence S is pasted as one long unwrapped line inside a hard-wrapped paragraph. The test flattens whitespace, so this is cosmetic. Fix: rewrap to the surrounding width.

## Measurement

| | Before (plan) | After |
|---|---|---|
| CI wall time, full tier | 7 min 30 s (run 37040715545) | **pending the PR's first CI run** (expect about the same; this PR takes the full path) |
| CI `build-tests`, full tier | 6 min 33 s (step 6 min 02 s) | pending the PR's first CI run (unchanged expected) |
| CI `e2e` | 7 min 07 s (long pole) | pending; unchanged expected |
| CI `build-tests`, content-only tier | 6 min 33 s (it ran the whole project) | expected about **1.5 to 2 min**: W3's local `test:build:content` took 59 s (72 passed, 1 skipped), plus about 30 s of checkout, pnpm and install, plus slower runners. Content-PR wall time stays bounded by `e2e` at about 7 min. To be observed on the first content-only PR (target 8). |
| Local inner loop | full `pnpm run verify` 5 min 17 s | **`pnpm run verify:quick`: 33 s** (`date +%s` 1790964475 to 1790964508, 600 s alarm, `VERIFY_EXIT=0`) |

The local after-measurement is 33 s for `verify:quick` against 5 min 17 s for the full `verify`. That beats the plan's target 6 (about 2 min or less). The CI pair stays open until the PR runs.

## Follow-ups for the PR body

- `[PREVIEW-CHECK]` On this PR's CI run (full tier), `verify` is green and the wall time is at most 10 min. Record each job against the before-table.
- `[PREVIEW-CHECK]` Target 8: on the first content-only PR after merge, confirm that `changes` logs `content_only=true`, that `build-tests` runs only the `test:build:content` step, and that `verify` is green. Record `build-tests` against 6 min 33 s.
- Make `local-site.test.ts` assert the draft page and the page-sourced nav entry on fixture pages instead of the real `services.mdx`/`about.mdx`. Content PRs would then run only `indexing.test.ts` (2 builds).
- Give fixture builds a fixture home page (or a fixture-only `src/content/pages`), so fixture assertions never read real content (removes the L6 and collision residual risk).
- The LOW findings L1 to L7 (all one-line fixes).
- From #30: make the fixture web server conditional for the budget-only run.
- From #30: make local `test:e2e` mirror CI.
- From #30: move the preview crawl to its own job.
- Out of scope for this run: phase 5 of #26 (**D7**, governance cross-reference) and **D8** (review the e2e and a11y matrices). The PR body says `Part of #26`.

## Fix round

- L1 fixed: `tests/unit/content/focus-pocus.test.ts` (space after the comma).
- L2 fixed: `tests/unit/ci/content-tier.test.ts` (guard lists `tests/build` recursively).
- L3 fixed: `tests/unit/ci/content-tier.test.ts` (every positional argument after `--project build` must start with `tests/build/`).
- L4 fixed: `docs/testing.md` (four pipeline `SKILL.md` files plus `setup-walkthrough`).
- L5 fixed: `docs/testing.md` (tier-order sentence now states the full-first cases).
- L6 fixed: `docs/testing.md` (residual-risk paragraph names the `drafts.test.ts` home-page reads).
- L7 fixed: `.claude/skills/chore/SKILL.md` and `.claude/skills/deliver/SKILL.md` (line breaks only).
