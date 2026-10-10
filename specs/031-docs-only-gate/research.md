# Research: Docs-only verify gate

**Feature**: 031-docs-only-gate | **Date**: 2026-10-09

No Astro decision is made in this slice: nothing under `src/`, `astro.config.mjs` or the content
collections changes, so no Astro documentation page applies (Principle IV's Astro rule has nothing
to cite). The first-party options weighed are GitHub Actions built-ins.

## R1. How to pick the docs tier: `on.<event>.paths` filters or the repository's own script

- **Decision**: Extend `scripts/ci/changed-paths.ts` with a docs tier. Do not use workflow-level
  `paths` / `paths-ignore` filters.
- **Rationale**: GitHub's own path filtering (`on.pull_request.paths`, `paths-ignore`) skips the
  whole workflow. A required check (`verify`) from a skipped workflow stays "Expected — Waiting
  for status" and blocks the merge, which breaks FR-008 ("`verify` MUST report on every tier").
  Path filters also cannot run *part* of a job, cannot express "first match wins" across four
  tiers, and fail open (an unlisted path is ignored rather than gated). There is no first-party
  job-level or step-level path condition in GitHub Actions. The repository already solved this
  for the skip-safe tier with a fail-closed script that has unit tests and a drift guard; the
  docs tier is one more rule in the same function. The existing workflow test "does not use
  paths or paths-ignore filters" stays.
- **Alternatives considered**: `paths` filters (rejected above); `dorny/paths-filter` (third
  party, a new dependency and a major change in its own right, and it still needs the same
  fail-closed tier logic around it); a second workflow for docs (two `verify` checks with the
  same name race on the ruleset).

## R2. One `tier` output instead of more booleans (clarify note 1)

- **Decision**: The `changes` job writes one output, `tier`, with exactly one of `skip-safe`,
  `docs`, `content-only`, `full`. The `full` and `content_only` outputs are removed, and every
  `if:` in `ci.yml` and `scripts/ci/verify-needs.ts` reads `tier`.
- **Rationale**: Three booleans (`full`, `content_only`, `docs`) allow combinations that mean
  nothing (`docs=true, content_only=true`) and every condition would need to rule them out. One
  enumerated value has one meaning per run, is what FR-012 logs, and is easy to check for
  "unknown" in `verify`. Conditions are written so that an unset or unknown `tier` runs the
  heavier path:
  - lint, type-check, worker tests: `if: needs.changes.outputs.tier != 'skip-safe' && needs.changes.outputs.tier != 'docs'`
  - unit and component tests: `if: needs.changes.outputs.tier != 'skip-safe'`
  - `build-tests` and `e2e` jobs: `if: needs.changes.outputs.tier != 'skip-safe' && needs.changes.outputs.tier != 'docs'`
  - `test:build` step: `if: needs.changes.outputs.tier != 'content-only'`; `test:build:content`
    step: `if: needs.changes.outputs.tier == 'content-only'` (unchanged shape, so an unset tier
    runs the whole `test:build`).
- **Alternatives considered**: keep `full`/`content_only` and add `docs` (rejected: three
  coupled flags); keep both `tier` and the old booleans for compatibility (rejected: two sources
  of truth; workflow and script change in the same commit, so nothing needs the old names).

## R3. `verify` accepting docs-tier skips, failing closed (clarify note 2)

- **Decision**: `verify-needs.ts` reads `needs.changes.outputs.tier`. It passes only when
  `changes` succeeded, `tier` is one of the four known values, `static` succeeded, and each of
  `build-tests` and `e2e` either succeeded or was skipped **and** the tier is `skip-safe` or
  `docs`. An unknown, empty or missing `tier` fails with a problem naming the value. A skipped
  `build-tests` or `e2e` on `content-only` or `full` fails.
- **FR-008 step-level part**: `verify` sees job results only, not step results. The step-level
  half of FR-008 ("the skipped steps were skipped because the tier said so") is met by the step
  `if:` conditions in `static` and `build-tests` themselves: a step can only be skipped by its
  `if:`, and those conditions are exact strings that `tests/unit/ci/workflows.test.ts` asserts
  per step. A failing step fails its job, which `verify` sees.
- **Alternatives considered**: have `static` emit a list of steps it ran as an output for
  `verify` to cross-check (rejected: more machinery than the risk; the `if:` strings are the
  only way a step is skipped, and they are pinned by tests).

## R4. Diffing a push to `main` (clarify note 3)

- **Decision**: For `push`, the workflow passes `github.event.before` to the script as
  `BEFORE_SHA` (env, not interpolated into `run:`). The script:
  1. rejects a value that is missing, not 40 lowercase hex characters, or all zeros → files
     unknown → `full`;
  2. runs `git fetch --no-tags --depth=1 origin <before>` (GitHub serves any reachable commit by
     SHA); a non-zero exit → `full`;
  3. runs `git diff --name-only --no-renames <before> HEAD`; a non-zero exit → `full`.
  `actions/checkout` keeps `fetch-depth: 2` (enough for the pull request merge commit's
  `HEAD^1`). A two-dot `git diff` compares two trees, so it needs only the two commits, not the
  history between them. The `main` ruleset forbids force-pushes, so `before` is always an
  ancestor of the pushed commit, and the diff covers every commit in a multi-commit push.
  Git is called through an injected runner so unit tests can drive each failure path.
- **Rationale**: A targeted fetch of one commit is cheaper than `fetch-depth: 0` and does not
  grow with the repository. Each failure falls through to `full` (FR-009, FR-010).
- **Alternatives considered**: `fetch-depth: 0` (works, but fetches the whole history on every
  run for one commit); `github.event.commits[]` file lists (the push payload lists files per commit but
  caps the number of commits it describes, so a large push would be sorted on a partial list); the compare REST API
  (needs a token in the `changes` job and pagination; git is already there).

## R5. Not cancelling `main` runs (FR-014)

- **Decision**:
  ```yaml
  concurrency:
    group: ci-${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.sha }}
    cancel-in-progress: ${{ github.event_name == 'pull_request' }}
  ```
- **Rationale**: Setting only `cancel-in-progress: false` for pushes is not enough. GitHub
  allows one running and one *pending* run per concurrency group, and a newer queued run cancels
  the older pending one even when `cancel-in-progress` is false. Three merges in quick
  succession would still lose the middle run (SC-005). Grouping pushes by commit SHA gives each
  push its own group, so none waits on or cancels another. Pull requests keep their per-ref
  group and keep cancelling (FR-014).
- **Alternatives considered**: drop `concurrency` for pushes entirely (not expressible per event
  except through the group key, which is what this does); `cancel-in-progress: false` alone
  (rejected above).

## R6. Timing the docs tier against SC-001 / SC-002 (clarify note 4)

Measured from recent CI runs (`gh run view <id> --json jobs`):

| Run | `changes` | `static`: start to end of install | secretlint | `test:unit` |
|---|---|---|---|---|
| 38019426135 (`main` push of #128) | 7 s | 22 s | 1 s | 24 s |
| 38017958110 (PR #128) | 5 s | 23 s | 2 s | 27 s |
| 38013982111 (`main` push, cutover stage 3) | n/a | 20 s | 1 s | 18 s |

On the docs tier `static` runs set-up, install, secretlint and `test:unit` only: about 50–55 s.
With `changes` (~7 s), `verify` (~10 s) and runner pick-up gaps (~3 s each), wall time is about
75–90 s, inside the 2-minute target. For comparison the full tier on run 38019426135 took 10 min
18 s, with `build-tests` the long pole. The target holds unless runner queueing is slow, which
no tier controls.

## R7. FR-007 numbering gap (clarify note 5)

The spec jumps from FR-006 to FR-008. Cosmetic; requirement IDs are kept as they are so
references from the checklist and clarify answers stay valid. Tasks cite FR-008 onward as
written.

## R8. Nothing outside the unit project reads `docs/` (spec assumption)

`grep -rn "docs/"` over `tests/e2e`, `tests/build`, `tests/worker`, `worker/`, `src/` and
`scripts/` finds only comments and user-facing hint strings (setup-check messages naming
`docs/setup.md` / `docs/launch.md` as text). No build, end-to-end or worker test reads a file
under `docs/`. ESLint has no Markdown plugin (`eslint.config.js`), and `typecheck`
(`astro check`, `tsc -p worker`, `wrangler types --check`) reads no `.md` under `docs/`. So
skipping those on the docs tier loses no coverage. Per the clarify answer, no drift guard is
added for this; the spec records the assumption.

## R9. Docs and setup check that describe the tiers

- `docs/testing.md`: CI jobs table (`changes` row, `static`, `build-tests`, `e2e` rows), the
  `verify` bullet, "Change tiers" (intro, new Docs row, Full row no longer says "every push to
  `main`"), the residual-risk paragraph (it relies on "the push run on `main`, which always runs
  the full gate", no longer true), and the measurement method ("A push to `main` is always the
  full tier" becomes "pick a full-tier run"). Plus a sentence on `main` runs not being cancelled.
- `docs/setup.md` item 11 ("Pushes to `main` always run the full gate") is updated.
- `scripts/setup-check/checks/launch-main-checks.ts` needs **no change**: it reads the newest
  `verify` check run on `main` by name and status; a docs-tier `verify` is a completed,
  successful run of the same check. Not cancelling `main` runs makes it more reliable (it no
  longer finds a cancelled newest run after quick merges).
- `CLAUDE.md` and `.claude/skills/_shared/` do not describe the tiers; no change.
