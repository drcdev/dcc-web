# Chore plan: verify-gate-phase-3 (issue #26, phase 3)

Branch: `chore/verify-gate-phase-3`. Part of https://github.com/drcdev/dcc-web/issues/26, phase 3.
The PR body says `Part of #26`, because phases 4 to 6 remain.

## Goal

Phases 1 and 2 shipped in PR #29. CI still runs the whole gate as one `pnpm run verify` step in
one `verify` job, so its wall time is the **sum** of every layer: 870 s (14.5 min) on the
merge of PR #29. This run delivers **phase 3** of the plan in
[issue #26](https://github.com/drcdev/dcc-web/issues/26), under two ticked decisions:

- **D3** splits the CI job into parallel jobs that run after a small change-detection job:
  - `static`: secretlint, lint, typecheck, the unit/component Vitest project and the worker
    tests;
  - `build-tests`: the `build` Vitest project;
  - `e2e`: `astro build` plus Playwright.

  A final aggregate job named exactly `verify` needs all of them. Branch protection requires
  it. Wall time becomes the slowest job, not the sum.
- **D4** sets Playwright to 4 workers in CI for the `e2e`, `a11y`, `visual` and `sections`
  projects. The `budget` project runs in its own invocation with one worker, so other tests do
  not skew its throttled measurements.

Local `pnpm run verify` keeps its exact composition. No user-visible behaviour changes. Only
these files change: `.github/workflows/ci.yml`, `playwright.config.ts`, `package.json`
scripts, one new `scripts/ci/` file, the tests over those, two docs and one sentence of the
chore skill. Test content, `src/` and the visual baselines are not touched.

## Acceptance

**Before (source):** run 36930871071 (workflow "CI", push to `main`, merge commit `b92ac71`
of PR #29, success), job 110599499962. The `verify` job took **870 s (14.5 min)**:

- setup to install: about 32 s;
- Playwright Chromium install: 36 s;
- "Run the verify gate": **799 s**;
- preview crawl: 0 s (push event).

The gate is one step, so the step data does not split it by layer. Issue #26 measured
Playwright at 6.9 min with 2 workers, lint plus typecheck at 22 s and worker tests at 6 s.
That leaves about 5 to 6 min for Vitest plus the real `astro build` after phase 2. The
baseline before phase 2 was about 31 min.

**Targets.** The review phase checks each one, except those marked `[PREVIEW-CHECK]`, which
only the first real CI run can show.

1. **CI wall time ≤ 10 min** for a full CI run (one that is not skip-safe). It runs from the
   start of the first job (`changes`) to the end of the aggregate `verify` job. Read it from
   `gh run view <id> --json jobs`: the earliest `startedAt` to the `verify` job's
   `completedAt`. Measure it on this PR's own CI run (a `pull_request` run, which includes the
   preview crawl). After merge, measure the push run on `main` too (the issue's acceptance
   line). `[PREVIEW-CHECK]`
2. **Every check that ran before still runs, in exactly one job.** Each member of the `verify`
   script runs once across `static`, `build-tests` and `e2e`. The members are:
   - `lint:secrets`, `lint` and `typecheck`;
   - `test`: the Vitest `unit` and `build` projects plus the worker tests;
   - `build`;
   - `test:e2e`: all five Playwright projects.

   The PR-only preview crawl also runs once. The rewritten `tests/unit/ci/workflows.test.ts`
   (W4) and the project-coverage guards (W2) prove it.
3. **Local `pnpm run verify` is unchanged in composition.** The `verify` script string stays
   byte-identical, and the existing `tests/unit/site/config-files.test.ts` asserts it.
   `test:e2e` stays `playwright test`, which runs all projects with local default workers.
   Verify must be green (Principle II).
4. **Skip-safe PRs still yield a green `verify`.** On a skip-safe PR, `static` runs secretlint,
   and `build-tests` and `e2e` are skipped. The aggregate passes because those are the
   expected skips. The unit tests of the aggregate decision (W1) prove it. This run opens no
   skip-safe PR.
5. **No visual baseline changes.** The `visual` project passes at 4 workers against the
   committed Linux baselines on the PR's CI run. `[PREVIEW-CHECK]`
6. **The ruleset accepts the aggregate.** On the PR, the aggregate job reports the required
   `verify` check (GitHub Actions app, integration 15368), and the PR becomes mergeable on it.
   `[PREVIEW-CHECK]`

## Scope

**In:**

- `.github/workflows/ci.yml`: split into `changes`, `static`, `build-tests`, `e2e` and the
  aggregate `verify` (W4).
- `scripts/ci/verify-needs.ts` (new): decides whether the aggregate passes, from the results of
  the jobs it needs (W1).
- `playwright.config.ts`: `workers: process.env.CI ? 4 : undefined` (W3).
- `package.json` scripts (W2):
  - add `test:unit`, `test:build`, `test:worker` and `test:e2e:parallel`;
  - `test:budget` gains `--workers=1`;
  - `test` calls `test:worker` instead of repeating its command (same composition);
  - `verify` and `test:e2e` are unchanged.
- Tests over those files:
  - `tests/unit/ci/workflows.test.ts`: rewrite the ci.yml describes;
  - `tests/unit/ci/verify-needs.test.ts`: new;
  - `tests/unit/site/config-files.test.ts`: script and `workers` assertions, plus the coverage
    guards.
- Docs (W5): `docs/testing.md` gets a CI jobs section and corrected worker and budget rows.
  `docs/setup.md` item 11 gets the new job layout.
- `.claude/skills/chore/SKILL.md`: the Ship step 6 sentence that reads "the `verify` job's
  duration". After the split that job lasts seconds (W6).

**Out (later phases of #26 and follow-ups for the PR body):**

- Later phases of #26, not touched here:
  - **D5**: the changed-paths content tier;
  - **D6**: `verify:quick`;
  - **D7**: the governance cross-reference;
  - **D8**: the e2e and a11y matrices.
- The changed-paths allowlist in `scripts/ci/changed-paths.ts` is not edited. Only the way its
  output reaches the jobs changes.
- None of these change: `tests/e2e/**`, `tests/build/**`, `tests/component/**`,
  `vitest.config.ts`, `src/` and the visual baselines.
- `.github/workflows/visual-baselines.yml` and `major-change.yml` stay as they are.
  `update-baselines` stays one job.
- Old `specs/**` contracts that describe a single `verify` job are not rewritten. The current
  description lives in `docs/testing.md` and `docs/setup.md`.
- Follow-up: the budget invocation starts both web servers a second time. If that turns out to
  be the long pole, make the fixture web server conditional, for example by skipping it when
  only `budget` runs. Not done here.
- Follow-up: local `test:e2e` could mirror CI (the parallel projects, then budget on its own),
  so local budget runs are isolated too. Not done here, so the local composition stays
  unchanged.

## Constitution Check

- **I. Test-First:** every work item names its test. The aggregate decision (W1) and the new
  script and config guards (W2, W3) are written first and seen to fail. The rewritten workflow
  tests drive the ci.yml split (W4) and are written before the YAML changes.
- **II. Automated Release Gate:** no check is skipped or weakened. Every check runs in exactly
  one job. The aggregate fails when any job fails, is cancelled or is skipped when it should
  have run. Skip-safe behaviour is the same as today. Secretlint now runs as its own step in
  every CI run, which is the same coverage as before. Today it runs inside `pnpm run verify`,
  or as the skip-path step.
- **III. Human Review for Major Changes:** the criterion **"changes CI, deployment or
  infrastructure configuration"** fires. This run changes `.github/workflows/ci.yml`, which
  produces the required check, and the CI behaviour in `playwright.config.ts`.
  - "Could increase running costs" was checked and does not fire. The repository is public:
    `gh api repos/drcdev/dcc-web --jq .private` returned `false` on 2026-10-02. Standard
    GitHub-hosted runners are free for public repositories. The extra runner minutes from
    repeating install in each job therefore cost nothing.
  - No dependency is added.

  Verdict: **MAJOR**. Don's approval is needed, with no auto-merge.
- **IV. First-Party Before Custom:** the run uses first-party features:
  - GitHub Actions: `needs`, job outputs, the `if:` status functions and the `needs` context;
  - Playwright: the `workers` option and the `--project` and `--workers` CLI flags;
  - Vitest: the `--project` filter.

  There is one piece of custom code. GitHub has no setting that means "this job passes only if
  every job it needs passed, allowing named skips". A skipped required job reports as success
  (see the citations). A small tested script makes that decision instead (W1). No Astro
  decision is made: `astro build` runs unchanged, so this plan does not need the Astro Docs
  MCP.
- **V. Static by Default:** unaffected (no `src/` change).
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected. No new secret. The workflows still reference only
  `GITHUB_TOKEN`.
- **VIII. Cloudflare Best Practices:** unaffected. Wrangler and the preview deploy are not
  touched.
- **IX. Cost Ceiling:** unaffected, on the public-repository assumption above ($0 for Actions).
- **X. Accessible, Fast and Private:** the a11y and visual layers run unchanged. Budget
  measurements become more isolated (one worker, own invocation), which strengthens that
  layer.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/verify-gate-phase-3/`.

## Target topology (design decisions made in this plan)

```
changes ──┬── static        (always; secretlint always, the rest when full != 'false')
          ├── build-tests   (job if: full != 'false')
          └── e2e           (job if: full != 'false')
verify (needs: changes, static, build-tests, e2e; if: always()) → node scripts/ci/verify-needs.ts
```

**`changes`**

- `name: changes`, permissions `contents: read`.
- Steps:
  - checkout with `fetch-depth: 2`;
  - setup-node from `.nvmrc`, with no pnpm cache, because nothing is installed;
  - `node scripts/ci/changed-paths.ts`, with `id: changes`.
- Job output: `full: ${{ steps.changes.outputs.full }}`.

**`static`**

- `needs: changes`, permissions `contents: read`.
- No job-level `if:`, so secretlint always runs and the job always reports.
- Steps:
  - checkout, pnpm, setup-node (cache pnpm);
  - `pnpm install --frozen-lockfile`, with no `if:`;
  - `pnpm run lint:secrets`, with no `if:`;
  - `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit` and `pnpm run test:worker`,
    each with `if: needs.changes.outputs.full != 'false'`.

**`build-tests`**

- `needs: changes`, `if: needs.changes.outputs.full != 'false'`, permissions
  `contents: read`.
- Steps: checkout, pnpm, node, install, `pnpm run test:build`.

**`e2e`**

- `needs: changes`, `if: needs.changes.outputs.full != 'false'`.
- Permissions `checks: read` and `contents: read`, because the preview crawl reads check runs.
- Steps, in order:
  1. checkout, pnpm, node, install;
  2. `pnpm exec playwright install --with-deps chromium`;
  3. `pnpm run build` (the real-site build stays a check);
  4. `pnpm run test:e2e:parallel` (4 workers, from the config);
  5. `pnpm run test:budget` (own invocation, `--workers=1`);
  6. the preview crawl, with `if: github.event_name == 'pull_request'` and its environment
     unchanged;
  7. the playwright-output upload, with `if: failure()` and the same paths as today.

**`verify` (the aggregate)**

- `name: verify`, `needs: [changes, static, build-tests, e2e]`, `if: always()`, permissions
  `contents: read`.
- Steps:
  - checkout: a depth-1 checkout takes a few seconds, so a sparse checkout is not worth the
    extra configuration;
  - setup-node from `.nvmrc`;
  - `node scripts/ci/verify-needs.ts`, with `env: NEEDS: ${{ toJSON(needs) }}`.
- No install.

**Unchanged across the workflow**

- The five job display names (`changes`, `static`, `build-tests`, `e2e`, `verify`) are unique,
  and none is `major-change-approval`, the gate's status context.
- The workflow-level `permissions`, `concurrency` (cancel-in-progress) and triggers are
  unchanged.
- Every action keeps its existing SHA pin: checkout v7.0.1, pnpm/action-setup v6.1.0,
  setup-node v7.0.0 and upload-artifact v7.0.1.
- The preview crawl stays in `e2e` and runs on pull requests only, as today. After the split
  it starts earlier than before (see Risks).

## Work items

### W1 Aggregate decision: `scripts/ci/verify-needs.ts`

- [x] W1 done

**Files:** `scripts/ci/verify-needs.ts` (new), `tests/unit/ci/verify-needs.test.ts` (new).

**Test:** new-first unit tests over a pure `decide(needs)` function. They are seen to fail
before the script exists.

The script exports this function:

```ts
decide(needs: Record<string, { result: string; outputs?: Record<string, string> }>): {
  pass: boolean;
  problems: string[];
}
```

When run as the main module, it parses `process.env.NEEDS`, prints one line per problem and
exits non-zero unless `pass`. It uses the same `isMainModule` pattern as `changed-paths.ts`.
Rules:

1. `changes` must be `success`. Its `outputs.full` must be `"true"` or `"false"`. Any other
   value, including a missing one, fails (fail closed).
2. `static` must be `success`.
3. `build-tests` and `e2e` must be `success`. `skipped` is accepted **only** when
   `changes.outputs.full === "false"`.
4. If any of the four jobs is missing from `needs`, the decision fails. This guards against a
   rename that drops a job.
5. Any other result fails and names the job and its result. That covers `failure`, `cancelled`,
   and `skipped` when `full` is `"true"`.

Unit cases:

| Case | Expected |
|---|---|
| All `success`, `full` is `"true"` | pass |
| Skip-safe: `full` is `"false"`, `static` succeeded, `build-tests` and `e2e` skipped | pass |
| `full` is `"true"` and `e2e` skipped | fail, naming `e2e` |
| `failure` in each job, one at a time | fail, naming that job |
| `cancelled` in each job, one at a time | fail, naming that job |
| `static` skipped, `full` is `"false"` | fail |
| `changes` failed with no output | fail |
| `full` output missing | fail |
| One of the four job keys missing | fail |
| Invalid or empty `NEEDS` JSON on the main-module path | non-zero exit |

For the last case, spawn the script with `node` if `changed-paths.test.ts` uses that pattern.
Otherwise, test a small exported `run(env)` that returns the exit code. The test must contain
no `specs/` path literals (drift guard).

### W2 Per-layer package scripts and project-coverage guards

- [ ] W2 done

**Files:** `package.json`, `tests/unit/site/config-files.test.ts`.

**Test:** unit tests over config. The new assertions are written first and seen to fail. The
existing `verify` and `test:e2e` assertions are unchanged.

Scripts:

| Script | Value |
|---|---|
| `test:unit` (new) | `vitest run --project unit` |
| `test:build` (new) | `vitest run --project build` |
| `test:worker` (new) | `pnpm --filter ./worker test` |
| `test` (new form, same checks) | `vitest run && pnpm run test:worker` |
| `test:e2e:parallel` (new) | `playwright test --project=e2e --project=a11y --project=visual --project=sections` |
| `test:budget` (changed) | `playwright test --project=budget --workers=1` |
| `verify`, `test:e2e` | unchanged |

New and changed assertions in the "package.json scripts" describe of `config-files.test.ts`:

- Each new script's exact string.
- `test:budget` now carries `--workers=1`. Update the existing case for `test:a11y`,
  `test:budget` and `test:visual`.
- **Vitest coverage guard:** the `--project` names in `test:unit` and `test:build` together
  equal the set of project names in `vitest.config.ts`. A new Vitest project then cannot
  silently miss CI. Read the config source and extract each `name: "..."` under `projects`, or
  import the config if that loads cleanly.
- **Playwright coverage guard:** the `--project` names in `test:e2e:parallel` and
  `test:budget` together equal the config's project names, with no overlap. Reuse the existing
  `loadConfig()`. A new Playwright project then cannot silently miss CI, and budget never runs
  at 4 workers.
- `test` still runs `vitest run` (both projects) and the worker tests.

### W3 Playwright workers in CI

- [ ] W3 done

**Files:** `playwright.config.ts`, `tests/unit/site/config-files.test.ts`.

**Test:** unit test over config, written first. With `CI` set, the loaded config has
`workers: 4`. With `CI` unset, `workers` is `undefined`, Playwright's default. The config reads
`process.env.CI` when it is imported. The test therefore sets or clears the variable and
imports the config with a cache-busting query. If a re-import is not reliable under Vitest,
assert the exact source line `workers: process.env.CI ? 4 : undefined` instead. The
implementer picks one and notes the choice.

Change: add `workers: process.env.CI ? 4 : undefined,` next to `fullyParallel`. Add a comment
that the `budget` project runs on its own with `--workers=1`, because the CLI overrides the
config, and say why. Nothing else in the config changes: `webServer`, the projects,
`retries: 0` and the snapshot settings stay as they are.

### W4 Split `ci.yml` into parallel jobs and rewrite its workflow tests

- [ ] W4 done

**Files:** `.github/workflows/ci.yml`, `tests/unit/ci/workflows.test.ts`.

**Test:** rewrite these three describes first, against the target topology: "ci.yml", "ci.yml
change detection" and "ci.yml preview crawl". See them fail on the current file, then edit
the YAML.

Add two helpers:

- `job(id)` slices the text from `\n  <id>:` to the next job key at two-space indent, or to
  the end of the file.
- `stepBlock`, scoped to one job.

No YAML dependency is added. `tests/unit/setup/drift.test.ts` needs no change:
`/^\s{2}verify:/m` still matches, and the ruleset contexts are unchanged. It must stay green.

**Coverage mapping (each removed or changed assertion, and where the guarantee lives now):**

| Today's assertion | Now |
|---|---|
| Whole-file checks: "is named CI", the triggers, workflow `permissions: contents: read`, `--frozen-lockfile`, a SHA pin on every `uses:`, no `continue-on-error`, no `if: false`, only `GITHUB_TOKEN`, no `paths` or `paths-ignore` | Kept as they are. Add one: `concurrency` still has `cancel-in-progress: true`. |
| "has job verify" (`^\s{2}verify:`, `name: verify`) | Kept, now about the aggregate. Add: the jobs `changes`, `static`, `build-tests` and `e2e` exist with those `name:`s. All five names are unique. Only the aggregate is named `verify`, and none is named `major-change-approval`. |
| "has a step running `pnpm run verify`" | Replaced by "runs every verify member exactly once". `static` runs `pnpm run lint:secrets`, `lint`, `typecheck`, `test:unit` and `test:worker`. `build-tests` runs `test:build`. `e2e` runs `build`, `test:e2e:parallel` and `test:budget`. Each string appears exactly once in the file. W2's guards prove that these scripts together cover the `test` and `test:e2e` members of `verify`. The existing config-files test still pins the `verify` string. |
| "uploads Playwright output on failure, after the verify step, SHA-pinned" (and its paths) | In `e2e`: an `if: failure()` step using a SHA-pinned `actions/upload-artifact`, after the `pnpm run test:budget` step, with the same three paths. |
| "checks out two commits so HEAD^1 exists" | In `changes`: its checkout has `fetch-depth: 2`. |
| "detects changes after setup-node and before install" | In `changes`, the `node scripts/ci/changed-paths.ts` step has `id: changes` and comes after `actions/setup-node@`. The job declares `outputs: full: ${{ steps.changes.outputs.full }}`. `static`, `build-tests` and `e2e` each declare `needs: changes`. `changes` has no install, so "before install" becomes "every job that installs needs `changes`". |
| "gates the Playwright install and the verify gate on full != 'false'" | `build-tests` and `e2e` have the job-level `if: needs.changes.outputs.full != 'false'`. In `e2e`, that covers the Playwright install, the build and both Playwright runs. In `static`, the `lint`, `typecheck`, `test:unit` and `test:worker` steps each carry `if: needs.changes.outputs.full != 'false'`. |
| "runs secretlint on the skip path, after install" | In `static`, `pnpm run lint:secrets` has **no** `if:`. It runs on both paths, which matches the coverage before the split. It comes after `pnpm install --frozen-lockfile`. |
| "installs unconditionally" | In each of `static`, `build-tests` and `e2e`, the install step has no `if:`. |
| "has no job-level if:, so verify always reports" | `static` has no job-level `if:`. The aggregate `verify` has `if: always()`, and its `needs` lists exactly `changes`, `static`, `build-tests` and `e2e`. Its step runs `node scripts/ci/verify-needs.ts` with `NEEDS: ${{ toJSON(needs) }}`. W1 proves the decision. |
| "gives the verify job checks: read plus contents: read" | The `e2e` job holds the crawl, so it has `checks: read` and `contents: read`. The other jobs have `contents: read` only. |
| "has the preview crawl step, after the verify gate" | In `e2e`: the step runs `node scripts/site-check/preview.ts`, after the `pnpm run test:budget` step. |
| "runs only on pull_request"; "exposes only GITHUB_TOKEN, no CLOUDFLARE or CF_" | The same assertions, on the step sliced from the `e2e` job. |

The `major-change.yml`, `visual-baselines.yml` and CODEOWNERS describes are not changed.

### W5 Docs: `docs/testing.md` and `docs/setup.md`

- [ ] W5 done

**Files:** `docs/testing.md`, `docs/setup.md`.

**Test:** no behaviour: n/a (documentation only; W2 and W4 assert the commands it names).

`docs/testing.md`:

- **Intro:** add one sentence. CI runs the same scripts split across parallel jobs (see "CI
  jobs"), and phase 3 of #26 added this.
- **Layers table:**
  - the Unit and Component rows name `pnpm run test:unit`;
  - the Build rows name `pnpm run test:build`;
  - the Worker row already names `pnpm run test:worker`, which does not exist yet; W2 adds it;
  - the E2E, a11y and visual rows name `pnpm run test:e2e` locally and
    `pnpm run test:e2e:parallel` in CI;
  - the Budget row's depth becomes "Per template, own invocation with one worker
    (`pnpm run test:budget`)";
  - the Preview site-check row says the crawl runs in the `e2e` job on pull requests.
- **New "CI jobs" section, after "Layers":**
  - a table of each job (`changes`, `static`, `build-tests`, `e2e`, `verify`), its scripts and
    when it runs;
  - the rule that a new script, or a new Playwright or Vitest project, must be added to a job,
    and that the config tests guard it;
  - Playwright runs at 4 workers in CI, and budget runs on its own, with the reason;
  - the aggregate's pass rule: every job succeeded, or `build-tests` and `e2e` were skipped on
    a skip-safe change.

`docs/setup.md` item 11:

- Say that the workflow runs `changes`, `static`, `build-tests` and `e2e` in parallel, and a
  final `verify` job reports the result that branch protection requires.
- Reword the skip-safe sentence: "runs secretlint in the `static` job and skips `build-tests`
  and `e2e`; the `verify` job still reports success".
- The "How it will be confirmed" text stays. It is still true, because the check reads the
  conclusion of the `ci.yml` workflow run.

### W6 Chore skill: CI measurement wording

- [ ] W6 done

**Files:** `.claude/skills/chore/SKILL.md` (Ship step 6 only).

**Test:** no behaviour: n/a (agent instruction wording).
`tests/unit/setup/pipeline-pr-author.test.ts` must stay green, because the PR author block is
not touched. This sentence exists only in the chore skill, so the CLAUDE.md rule that keeps
the four pipelines aligned does not apply.

Today the step says to "read the `verify` job's duration from `gh run view` once it is green".
After the split the `verify` job lasts seconds, so change it to read the wall time of the
**workflow run** once `verify` is green. The source is `gh run view <id> --json jobs`: the
earliest job `startedAt` to the `verify` job's `completedAt`.

## Expected timing (for the review's comparison)

These are estimates from the before-run and the issue's stage figures. The review records the
real figures.

| Job | Estimate |
|---|---|
| `changes` | ~15 s |
| `static` | **~3 min**: setup and install ~35 s, secretlint, lint and typecheck ~25 s, unit project ~1–2 min, worker ~10 s |
| `build-tests` | **~4–6 min**: setup and install ~35 s, then the build project (20 builds, 12 syncs) |
| `e2e` | **~7–8.5 min**: setup and install ~35 s, Chromium ~36 s, `astro build` ~1 min, parallel Playwright at 4 workers ~3.5–4 min (6.9 min at 2 workers before, budget included), the budget run with both web servers starting again ~1–1.5 min, then the crawl on PRs |
| `verify` | ~15 s after the slowest job |

Expected wall time: **~8–9 min**. That is under the 10 min target, with little slack. If `e2e`
is the long pole and goes over 10 min, the first lever is the fixture web server for the
budget invocation (the named follow-up). No check is weakened to meet the target.

## Docs citations (Principle IV)

GitHub Actions (docs.github.com):

- `jobs.<job_id>.needs`: jobs run in parallel unless they declare `needs`, and a failed need
  skips the jobs that depend on it unless a status function is used.
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds
- The status check functions `always()`, `success()`, `failure()` and `cancelled()`:
  https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions
- `toJSON` and the `needs` context. `needs.<job_id>.result` is `success`, `failure`,
  `cancelled` or `skipped`, and `needs.<job_id>.outputs` holds the job's outputs.
  https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#tojson and
  https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context
- Job outputs, set as `jobs.<job_id>.outputs` from a step's `GITHUB_OUTPUT`:
  https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs
- `jobs.<job_id>.if`: a job-level condition. A skipped job reports `skipped`.
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif
- "Handling skipped but required checks": a skipped required check reports success. That is
  why the aggregate must not simply be skipped when a need fails.
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks#handling-skipped-but-required-checks
- Concurrency: `cancel-in-progress` cancels the whole run, all jobs.
  https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- Billing: standard GitHub-hosted runners are free in public repositories.
  https://docs.github.com/en/billing/concepts/product-billing/github-actions
- The standard runner for public repositories is a 4 vCPU Linux machine, which is the basis
  for 4 workers.
  https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories

Playwright 1.63 (playwright.dev):

- `workers` and limiting workers. `--workers` on the CLI overrides the config. The docs'
  example is `workers: process.env.CI ? 2 : undefined`.
  https://playwright.dev/docs/test-parallel#limit-workers and
  https://playwright.dev/docs/api/class-testconfig#test-config-workers
- The `--project` flag (repeatable) and the `--workers` flag:
  https://playwright.dev/docs/test-cli
- `webServer` as an array. Every invocation starts all the configured servers.
  https://playwright.dev/docs/test-webserver#multiple-web-servers
- CI guidance. The docs recommend `workers: 1` in CI for stability. D4 deliberately chose 4
  (see Risks). https://playwright.dev/docs/ci#workers

Vitest 5 (vitest.dev): the `--project` filter for `test.projects`.
https://vitest.dev/guide/cli#project and https://vitest.dev/guide/projects

pnpm: `pnpm run` and `--filter`. https://pnpm.io/cli/run and https://pnpm.io/filtering

## Risks

- **The aggregate goes green when it must not.** Without a status function, a failed need
  makes `verify` *skipped*, and a skipped required check counts as passing.
  - Mitigation: `if: always()` plus `verify-needs.ts`. The script fails on every result other
    than `success`, except the two named skips on a skip-safe change. It also fails closed on
    a missing or unexpected `full` output. W1 tests each case.
  - `always()` also runs the aggregate on a cancelled run. It then fails on the cancelled jobs,
    which is correct for a run that a newer one replaced.
- **Actions minutes rise.** Install repeats in four jobs (~35 s each), and Chromium still
  installs once. Billed runner minutes rise by about 2–3 min per run, while wall time falls.
  - The Principle III cost criterion and Principle IX do not fire, on the stated assumption
    that the repository stays public (checked 2026-10-02).
  - If the repository ever goes private, the split costs more minutes than the single job did,
    and it must be revisited.
- **Visual snapshots at 4 workers.** More pages render at once on four vCPUs, so font
  rendering and animation settling could differ. The config already disables animations and
  hides the caret.
  - A visual diff the spec did not predict is a regression to fix, not a baseline to refresh
    (CLAUDE.md).
  - Fallback: set `workers: 2` in CI (today's effective value) and record it. Do not touch the
    baselines.
- **Playwright's own CI advice is `workers: 1`.** D4 is ticked for 4. `retries: 0` stays, so
  any flake shows as red. If a11y or e2e tests flake at 4, step down to 3 or 2 and record it.
- **Budget measurements on a shared runner.** One worker removes contention from other
  Playwright workers. The two web servers and the runner's own noise remain. This is the same
  environment the budget has always had, minus the parallel tests, so it can only be more
  stable.
- **The budget invocation starts the web servers a second time.** `test:budget` starts both
  servers again:
  - `wrangler dev`, with a fresh D1;
  - `build:fixtures` + `astro preview`. The fixture build is the expensive part (~1 min).

  This cost is accepted for now and timed. The named follow-up trims it if `e2e` is the long
  pole.
- **The preview crawl starts earlier.** It waits up to 20 min for the `Workers Builds:
  dcc-web-preview` check run. Before the split it ran after a 13-min gate, so the preview build
  had already finished. Now `e2e` reaches the crawl after about 7 min. If the preview build
  takes longer than that, the PR run's wall time includes the wait. Push runs on `main` have no
  crawl. If this shows up, moving the crawl to its own parallel job is a follow-up.
- **`build-tests` may be the long pole.** The build project's CI time after phase 2 has never
  been measured on its own, because it ran inside one step. If it goes over ~8 min, that is a
  finding for the review, not a reason to change test content here.
- **Watching checks.** `gh pr checks --watch` can exit before `verify` registers (memory note).
  With the aggregate waiting on three jobs, that window is longer. The orchestrator watches the
  run id instead.
- **Drift guard.** New tests and scripts must not embed `specs/` path literals
  (`tests/unit/ci/changed-paths.test.ts`).

## [PREVIEW-CHECK] items

- `[PREVIEW-CHECK]` On the PR's first CI run, the wall time from the first job's start to the
  end of the `verify` job is ≤ 10 min. Record each job's duration. Repeat on the push run on
  `main` after merge (the issue's acceptance line).
- `[PREVIEW-CHECK]` The ruleset accepts the aggregate: the new `verify` job reports the PR's
  required `verify` check, and the PR is mergeable on it together with
  `major-change-approval`.
- `[PREVIEW-CHECK]` On the PR's CI run, `visual` passes at 4 workers against the committed
  Linux baselines, and `budget` passes in its own one-worker invocation.
- `[PREVIEW-CHECK]` After merge, `pnpm setup:check --item github-ci-workflow` and
  `--item launch-main-checks` still report complete. They read the conclusion of the `ci.yml`
  run and the `verify` check run on `main`.
