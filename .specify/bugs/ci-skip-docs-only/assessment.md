# Bug Assessment: CI runs the full verify gate for changes no check reads

- **Slug**: ci-skip-docs-only
- **Created**: 2026-09-29
- **Source**: pasted text (Don, maintainer, ad hoc; no GitHub issue)
- **Verdict**: valid
- **Severity**: low
- **Major change**: yes. The fix edits `.github/workflows/ci.yml` and adds a file under
  `scripts/ci/`, both CI configuration under Constitution Principle III and both covered by
  `.github/CODEOWNERS`. The PR must carry the `major-change` label and leave auto-merge off.

## Report (verbatim)

> It takes an unnecessary amount of CI time to run `verify` for changes that don't touch code
> (e.g. updates to CLAUDE.md or the `.claude` folder). Help me exclude paths that do not pose any
> build/test risk.

## Symptom

Every pull request runs the whole `verify` job: `pnpm install`, a Playwright Chromium install
with system deps, then `pnpm run verify` (secretlint, eslint, `astro check`, vitest, `astro
build`, Playwright e2e/a11y/budget/visual). That happens even when the PR changes only agent
instructions or Spec Kit documents that no check reads. Expected: such a PR still gets a green
`verify` status, but without spending minutes on checks whose result it cannot change.

## Reproduction

1. Open a PR whose only change is to `CLAUDE.md` or a file under `.claude/skills/` (other than
   `setup-walkthrough/SKILL.md`, see below).
2. Watch the `CI / verify` run: every step runs, including the Playwright browser install and the
   full `pnpm run verify`.
3. Compare with the checks' inputs: eslint lints only JS/TS/Astro, `astro check` typechecks only
   TS/Astro, and vitest and Playwright read only the files listed below. Nothing in that PR is one
   of them, so the outcome cannot differ from `main`.

Exact wall-clock numbers per run were not measured here. The saving is the Playwright install
plus lint, typecheck, unit tests, build and e2e.

## Suspected Code Paths

- `.github/workflows/ci.yml:3-6`: triggers `pull_request` and `push: branches: [main]` with no
  change detection.
- `.github/workflows/ci.yml:19-39`: every step is unconditional; the job has no way to know what
  changed.
- `setup/github-ruleset.json:24-33`: `main` requires status contexts `verify` and
  `major-change-approval`, strict. This rules out a trigger-level `paths-ignore:` (see
  Alternatives).
- `package.json` `verify` script: `lint:secrets && lint && typecheck && test && build &&
  test:e2e`. `lint:secrets` is `secretlint "**/*"`, which scans every file, markdown included.
- `tests/unit/ci/workflows.test.ts:13-75`: asserts on ci.yml's structure and must be extended.

### What reads the documentation-looking paths (verified by grep)

| Path | Read by a check? | Evidence |
|---|---|---|
| `CLAUDE.md` | only secretlint | no reference in `src/`, `scripts/`, `tests/`, configs |
| `.claude/skills/setup-walkthrough/SKILL.md` | **yes** | `tests/unit/setup/skill-behaviour.test.ts:6` |
| other `.claude/**/*.md` | only secretlint | no reference |
| `.specify/memory/constitution.md` | **yes** | `tests/unit/setup/drift.test.ts:134`, `scripts/setup-check/checks/github-codeowners.ts:21`, CODEOWNERS |
| other `.specify/**` (md, yml, json, sh, py, ps1) | only secretlint | no reference; not JS/TS, so eslint and `astro check` ignore them |
| `specs/**` | only secretlint | referenced only in comments; `specs/001-setup-walkthrough/contracts/check-report.schema.json` is named in comments, never imported |
| `docs/setup.md` | **yes** | `tests/unit/setup/drift.test.ts:18`, `tests/unit/setup/docs-dns.test.ts:5` |
| `docs/pages.md`, `docs/design-source.md` | **yes** | `tests/unit/site/docs-content-structure.test.ts:6-7`, `tests/unit/site/design-source.test.ts:7` |

`.claude/**` is **not** wholly safe (the setup-walkthrough skill is under test), and every file in
`docs/` is read by unit tests, so `docs/` is not skip-safe. `tsconfig.json` includes `**/*` and
`eslint .` walks every directory, so a `.ts`/`.js`/`.mjs`/`.astro` file placed under an otherwise
safe prefix would be read. The allowlist must therefore constrain extensions as well as prefixes.

## Root Cause Hypothesis

The CI workflow was written as one unconditional job. That is correct, but it has no notion of
which files a change touches. The gate's results are not wrong; the issue is only its cost for
changes outside every check's inputs. Confidence: high.

## Proposed Remediation

### Framing under Principle II

No check is skipped, disabled or weakened. A check's result depends only on the files it reads.
If a PR changes none of those files, the check's result on the PR equals its result on the base
commit, which already passed (strict required checks keep PRs up to date with `main`). The change
only avoids re-running checks whose inputs are unchanged. It decides this per file from an
explicit allowlist and **fails closed**: anything it does not positively recognise runs the full
gate. The one check that does read these files, secretlint, still runs on every PR.

### Decisions

1. **The skip path still runs `pnpm run lint:secrets`.** It is the only check that reads markdown,
   `.claude/**`, `.specify/**` and `specs/**`, and a docs PR is exactly where a pasted token
   would land. The cost is `pnpm install` (from the cached store) plus one secretlint pass.
2. **Allowlist of skip-safe paths.** The list is explicit, and everything else runs the full
   gate. A changed path is skip-safe only if **all** of these hold:
   - it is exactly `CLAUDE.md`, **or** it starts with one of the prefixes `.claude/`,
     `.specify/`, `specs/`;
   - its extension is one of `.md`, `.yml`, `.yaml`, `.json`, `.sh`, `.py`, `.ps1`. A `.ts`,
     `.js`, `.mjs`, `.cjs`, `.astro`, `.mdx`, extensionless or any other file under those
     prefixes fails closed;
   - it is not on the deny list of files that a check reads:
     `.claude/skills/setup-walkthrough/SKILL.md`, `.specify/memory/constitution.md`.

   `docs/**`, root markdown files other than `CLAUDE.md`, and everything else are **not**
   skip-safe. (`.specify/memory/constitution.md` is also a major change in its own right.)
3. **The detector is a TypeScript module**, run with `node scripts/ci/changed-paths.ts` after
   `actions/setup-node`. Node 24 from `.nvmrc` strips types natively, which `major-change.yml`
   already relies on. The module can be tested table-driven; a bash `grep -v` step cannot.
4. **Diff source.** On `pull_request`, `actions/checkout` checks out the test merge commit
   (`refs/pull/N/merge`), whose first parent is the current base tip. With `fetch-depth: 2`,
   `git diff --name-only --no-renames HEAD^1 HEAD` lists exactly what the PR changes relative to
   the base. `--no-renames` reports both the old and new path of a rename, so moving a file from
   `src/` into `specs/` still runs everything.
5. **Push to `main` and every other event always run the full gate.** This keeps the post-merge
   run that `scripts/setup-check/checks/github-ci-workflow.ts` reads a genuine full run. It also
   avoids guessing at `github.event.before`, which is all zeros on new branches and unreachable
   after force pushes. The time is spent on PRs, so that is where the saving is. (Judgment call:
   the exploration notes suggested diffing `github.event.before` on push. Running everything is
   simpler and strictly more conservative.)

### New module `scripts/ci/changed-paths.ts`

It has the same shape as `scripts/ci/major-change-gate.ts`: pure exports plus a thin CLI, guarded
by `const isMainModule = process.argv[1] && import.meta.url === \`file://${process.argv[1]}\``.

```ts
export const SKIP_SAFE_FILES: readonly string[];      // ["CLAUDE.md"]
export const SKIP_SAFE_PREFIXES: readonly string[];   // [".claude/", ".specify/", "specs/"]
export const SKIP_SAFE_EXTENSIONS: readonly string[]; // [".md", ".yml", ".yaml", ".json", ".sh", ".py", ".ps1"]
export const READ_BY_CHECKS: readonly string[];       // [".claude/skills/setup-walkthrough/SKILL.md", ".specify/memory/constitution.md"]

export function isSkipSafe(path: string): boolean;

export interface ChangeInput {
  event: string;            // GITHUB_EVENT_NAME
  files: string[] | null;   // null = the diff could not be computed
}
export interface ChangeDecision {
  full: boolean;            // true = run the full verify gate
  reason: string;           // one line for the job log
}
export function decide(input: ChangeInput): ChangeDecision;

/** Renders the $GITHUB_OUTPUT line: "full=true\n" or "full=false\n". */
export function toOutput(decision: ChangeDecision): string;
```

`decide` applies these rules in order:

1. If the event is not `pull_request`, run the full gate.
2. If `files` is null, run the full gate.
3. If `files` is empty after blank lines are trimmed, run the full gate. An empty diff is
   unexpected, so it fails closed.
4. If any file fails `isSkipSafe`, run the full gate. The reason names the first such file.
5. Otherwise return `full: false`.

`isSkipSafe` rejects any path that contains `..`, starts with `/` or contains a backslash.

The CLI (`main`) reads `GITHUB_EVENT_NAME`. On `pull_request` it runs `git diff --name-only
--no-renames HEAD^1 HEAD` through `execFileSync` (no shell), and any thrown error sets
`files = null`. It then calls `decide`, logs the reason and the file list, and appends
`toOutput(...)` to the file named by `GITHUB_OUTPUT`. If `GITHUB_OUTPUT` is unset (local use), it
prints the decision and exits 0. The CLI never exits non-zero because of a diff problem; it
reports `full=true` instead.

### Workflow shape (`.github/workflows/ci.yml`)

- `actions/checkout` gains `with: fetch-depth: 2`.
- The steps run in this order:
  1. checkout;
  2. pnpm setup;
  3. setup-node;
  4. **new step** `Decide which checks this change can affect` (`id: changes`,
     `run: node scripts/ci/changed-paths.ts`);
  5. `pnpm install --frozen-lockfile`, unconditional;
  6. **new step** `Scan for committed secrets` with `if: steps.changes.outputs.full == 'false'`,
     running `pnpm run lint:secrets`;
  7. Playwright install with `if: steps.changes.outputs.full != 'false'`;
  8. `pnpm run verify` with `if: steps.changes.outputs.full != 'false'`;
  9. the existing `if: failure()` upload step, unchanged.
- Gate the heavy steps on `!= 'false'`, not `== 'true'`. If the output is ever missing or empty,
  the full gate runs, so the YAML fails closed too.
- The job stays named `verify` and has **no job-level `if:`**. It always reports a conclusion
  (success when the skip path's secretlint passes), so the required check never sits pending or
  shows as skipped.
- No new third-party action, no new secrets and no new permissions.

**Alternatives**:
- *`paths-ignore:` on the `pull_request` trigger.* Rejected. The workflow never starts, so the
  required `verify` context stays at "Expected — Waiting" forever and blocks `gh pr merge --auto
  --merge`. It also cannot express the deny-list exceptions, and a docs-only PR would not run
  secretlint.
- *A second, always-green `verify` workflow with the inverse `paths:` filter.* Rejected. A PR
  that touches both sets runs both, two checks share the name `verify`, and this is a fragile
  pattern for required checks.
- *A bash `git diff | grep -v -E` step.* Simpler, but it cannot be tested in vitest and is easy
  to get wrong (regex anchoring, extension rules, failing closed on errors). The TS module costs
  one file.
- *A third-party action such as `dorny/paths-filter`.* Rejected. It is a new dependency (a major
  change, and Principle IV prefers none), and the in-repo diff is a few lines.

**Files likely to change**:
- `scripts/ci/changed-paths.ts` (new)
- `tests/unit/ci/changed-paths.test.ts` (new)
- `.github/workflows/ci.yml`
- `tests/unit/ci/workflows.test.ts`
- `docs/setup.md` §11 `github-ci-workflow`: add one sentence saying that a PR changing only
  skip-safe paths runs secretlint and skips the rest, and that `verify` still reports. This file
  is itself under test, so re-run `tests/unit/setup/drift.test.ts` and `docs-dns.test.ts` after
  editing it.

**Tests to add or update** (write them first and see them fail, per Principle I):

`tests/unit/ci/changed-paths.test.ts` (new, table-driven, imports
`../../../scripts/ci/changed-paths.ts`):

- `isSkipSafe` returns true for: `CLAUDE.md`, `.claude/skills/tweak/SKILL.md`,
  `.claude/skills/squash/SKILL.md`, `.specify/bugs/x/assessment.md`,
  `.specify/extensions/git/git-config.yml`, `.specify/scripts/bash/common.sh`,
  `.specify/extensions/git/scripts/python/auto_commit.py`, `.specify/feature.json`,
  `specs/003-standalone-pages/spec.md`,
  `specs/001-setup-walkthrough/contracts/check-report.schema.json`.
- `isSkipSafe` returns false for: `.claude/skills/setup-walkthrough/SKILL.md`,
  `.specify/memory/constitution.md`, `docs/setup.md`, `docs/pages.md`,
  `docs/design-source.md`, `README.md`, `src/pages/index.astro`,
  `src/content/pages/about.mdx`, `tests/unit/ci/workflows.test.ts`, `package.json`,
  `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `.gitignore`, `.secretlintignore`,
  `tsconfig.json`, `.claude/hooks/check.ts`, `.claude/x.js`, `specs/foo/helper.mjs`,
  `specs/foo/page.astro`, `.specify/extensions/.registry` (no extension), `claude.md` (case
  differs), `.claude` (bare directory name), `nested/CLAUDE.md`, `specs/../src/index.ts`,
  `/CLAUDE.md`, `.claude\skills\x.md` (backslashes).
- `decide`:
  - `{event: "pull_request", files: ["CLAUDE.md", ".claude/skills/tweak/SKILL.md"]}` gives
    `full: false`;
  - the mixed list `["CLAUDE.md", "src/pages/index.astro"]` gives `full: true`, with a reason that
    names `src/pages/index.astro`;
  - `files: []` gives `full: true`, and so does `files: ["", "  "]`;
  - `files: null` gives `full: true`;
  - `event: "push"` with only skip-safe files gives `full: true`;
  - `event: "workflow_dispatch"` gives `full: true`, and so does `event: "pull_request_target"`;
  - a single deny-listed file gives `full: true`.
- `toOutput`: `full: true` gives `"full=true\n"`; `full: false` gives `"full=false\n"`.
- Drift guard:
  - scan `src/**`, `scripts/**`, `tests/**` and the root config files (`astro.config.mjs`,
    `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`) for quoted string literals
    matching `` /["'`](?:\.\.\/)*\/?((?:\.claude|\.specify|specs)\/[^"'`\s]+|CLAUDE\.md)/g ``;
  - normalise each match by stripping any leading `../` and `/`;
  - assert `isSkipSafe(path) === false` for each.

  On today's tree the scan finds only the two deny-listed files, so the guard passes. If a future
  test starts reading a skip-safe file, the guard fails until that path joins `READ_BY_CHECKS`.

`tests/unit/ci/workflows.test.ts`, `ci.yml` describe block (extend it; all existing asserts stay):

- checkout sets `fetch-depth: 2`;
- a step with `id: changes` runs `node scripts/ci/changed-paths.ts`, and it comes after the
  setup-node step and before `pnpm install --frozen-lockfile`;
- the Playwright install step and the `pnpm run verify` step each carry
  `if: steps.changes.outputs.full != 'false'`;
- a step running `pnpm run lint:secrets` carries `if: steps.changes.outputs.full == 'false'`
  and comes after the install step;
- `pnpm install --frozen-lockfile` has no `if:`;
- the `verify` job has no job-level `if:` (no line matching `^\s{4}if:` between `  verify:` and
  `    steps:`);
- there is no `paths:` or `paths-ignore:` anywhere in the file.

## Risks & Considerations

- **False skip** is the only real risk: a check starts reading a skip-safe file, and a PR that
  changes that file goes green without running the check. Several things limit this:
  - the extension allowlist is narrow, and the deny list covers the files checks read today;
  - the drift guard test fails when a new reader appears;
  - `main` always runs the full gate after merge, so a regression would surface there straight
    away;
  - production deploys only from `main` after its own full CI run (Principle II), so a mistake
    costs one missed PR-time run, not a production deploy of untested code.
- **Strict required checks**: unaffected. The job still reports `verify` on every PR.
- **`major-change-approval`**: unaffected. `major-change.yml` runs independently.
- **`github-ci-workflow` setup check**: it reads the latest ci.yml run on `main`, which is always
  a full run under this design.
- **`fetch-depth: 2`** adds one commit's history to the checkout, which is negligible. If `HEAD^1`
  is ever unavailable, the diff throws and the detector returns `full=true`.
- **The fix PR itself** touches `.github/` and `scripts/`, so it runs the full gate. That
  exercises the new workflow structure end to end.
- **Major change** under Principle III: label the PR `major-change` and leave auto-merge off. Don
  should confirm on a docs-only follow-up PR that `verify` shows green with the heavy steps
  skipped.

## Follow-ups (out of scope, noted only)

- `.claude/worktrees/` is not in `.gitignore`. Local worktrees live there and could be staged by
  a careless `git add -A` from the main checkout. `eslint .` and `astro check` (`tsconfig`
  `include: ["**/*"]`) would also walk into local worktrees when run from the main checkout.
- `ASTRO_PREVIEW_BACKGROUND=1` for the Playwright fixture server came up during exploration; it
  was not investigated here.
- Push-to-`main` runs could later use the same detector against `github.event.before`, if CI time
  on `main` ever matters. They are deliberately left as full runs for now.

## Open Questions

None blocking. These judgment calls were made without asking:
- push to `main` always runs the full gate;
- `docs/**` is not skip-safe, because all three files are read by tests;
- the skip path keeps `lint:secrets`.
