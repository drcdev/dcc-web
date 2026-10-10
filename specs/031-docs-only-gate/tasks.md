---

description: "Task list for the docs-only verify gate"
---

# Tasks: Docs-only verify gate

**Input**: Design documents from `/specs/031-docs-only-gate/` (spec.md, plan.md, research.md, data-model.md, contracts/ci-tiers.md, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Every test task names its one primary layer and is ordered before the implementation it covers. All logic here is observable at the **unit** layer (Vitest `unit` project, `tests/unit/ci/`), the cheapest layer ("Where a test goes", `docs/testing.md`); no second layer is used for any behaviour. This slice changes CI only, so there is no visual baseline, build-test or e2e task. Live CI runs that need a real docs-only PR or a real push to `main` can only happen after this PR merges (this PR edits the workflow, so it always sorts to `full`), and they need neither the preview deployment nor Don's eyes before merge, so they are not `[PREVIEW-CHECK]` items and do not hold auto-merge. They are recorded as post-merge verification in spec.md ("Post-merge verification" under Accepted risks and follow-up); this task list holds only the local spot checks.

**Toolchain**: run `node -v` before any `pnpm` command; if it is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the same Bash command (see `CLAUDE.md`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 = docs-only pull request, US2 = docs-only push to `main`

## Phase 1: Setup

- [X] T001 Confirm a green baseline: run `pnpm exec vitest run --project unit tests/unit/ci/` and read `specs/031-docs-only-gate/contracts/ci-tiers.md` and `data-model.md` for the exact `if:` strings and tier rules used below. No file changes.

---

## Phase 2: Foundational (blocking prerequisite)

**Purpose**: replace the two booleans with one `tier` value everywhere, so both stories build on the same shape. Behaviour of the existing skip-safe, content-only and full tiers is unchanged (FR-011).

- [X] T002 Test, layer unit: in `tests/unit/ci/changed-paths.test.ts`, re-express every existing `decide` case with `{ tier, reason }` (`skip-safe`, `content-only`, `full`) and `toOutput` as `tier=<value>\n`; seen failing against the current `{ full, contentOnly }` shape.
- [X] T003 [P] Test, layer unit: in `tests/unit/ci/verify-needs.test.ts`, change the helper to build `needs` from a `tier`, re-express the existing failure, cancelled and missing-job cases, and add: unknown, empty, missing and old-style (`full` output only) tier fails naming `tier`; `changes` failed, cancelled or skipped fails on any tier; `static` failed fails on `skip-safe` (FR-008, FR-010, FR-015).
- [X] T004 [P] Test, layer unit: in `tests/unit/ci/workflows.test.ts`, assert the `changes` job outputs exactly `tier` and no reference to `outputs.full` or `outputs.content_only` remains in `.github/workflows/ci.yml`.
- [X] T005 Implement in `scripts/ci/changed-paths.ts`: `Tier` type, `ChangeDecision = { tier, reason }`, `decide` returning the existing three tiers with a logged reason, `toOutput` writing `tier=<value>\n`; keep the log of tier, reason and one changed file per line plain text (FR-012). Makes T002 pass.
- [X] T006 [P] Implement in `scripts/ci/verify-needs.ts`: read `needs.changes.outputs.tier`, accept only the four known tiers, allow `build-tests` and `e2e` to be skipped only on `skip-safe` or `docs`, fail closed otherwise (research R3). Makes T003 pass.
- [X] T007 Implement in `.github/workflows/ci.yml`: `changes` outputs `tier`; switch every `if:` in `static`, `build-tests` and `e2e` to the `tier` strings in `contracts/ci-tiers.md` (unset or unknown tier runs the heavier side). Makes T004 pass.

**Checkpoint**: `pnpm exec vitest run --project unit tests/unit/ci/` is green with no behaviour change.

---

## Phase 3: User Story 1 - A docs-only pull request gets a fast verify (Priority: P1)

**Goal**: a pull request changing only `.md` files under `docs/` (plus skip-safe files) runs the secret scan and `test:unit` only; `verify` passes.

**Independent Test**: unit tests for `isDocs`, `decide`, `verify-needs` and the workflow `if:` strings pass; quickstart step 1 on a real PR.

### Tests for User Story 1 (write first, seen failing)

- [X] T008 [P] [US1] Test, layer unit: in `tests/unit/ci/changed-paths.test.ts`, `isDocs` true for `docs/testing.md` and `docs/design/blog.md`; false for `docs/x.png`, `docs/x.mdx`, `docs/x.MD`, `docs/x.markdown`, `Docs/a.md`, `README.md`, `src/docs/a.md`, `docs`, `docs/../src/a.md`, `/docs/a.md`, `docs\a.md`, a git-quoted non-ASCII path, and a `docs/--help.md` name treated as text (FR-001, FR-002, SC-003).
- [X] T009 [US1] Test, layer unit: in `tests/unit/ci/changed-paths.test.ts` (same file as T008, so not parallel), `decide` cases: docs only gives `docs`; docs plus skip-safe gives `docs`; skip-safe only stays `skip-safe`; docs plus content gives `content-only`; docs plus `src/` gives `full` naming the file; docs plus `docs/design/x.png` gives `full`; docs plus `.github/workflows/ci.yml` or `scripts/ci/changed-paths.ts` gives `full` (FR-016); unknown event, empty and blank diffs, and `files: null` give `full`; each reason names the forcing file or the counts (FR-003, FR-004, FR-010, FR-012).
- [X] T010 [P] [US1] Test, layer unit: in `tests/unit/ci/verify-needs.test.ts`, `docs` tier passes with `build-tests` and `e2e` skipped and also passes when they succeeded; fails when `static` is skipped or failed; fails when `build-tests` or `e2e` is skipped on `content-only` or `full` (FR-008, FR-015).
- [X] T011 [P] [US1] Test, layer unit: in `tests/unit/ci/workflows.test.ts`, assert the exact `if:` string of each `static` step (secretlint has none; lint, type-check and worker tests skip on `skip-safe` and `docs`; unit tests skip only on `skip-safe`), the `build-tests` and `e2e` job `if:` strings, the two build-test step strings, and that the existing no-`paths`-filter, read-only-permissions and no-secret tests still hold (FR-015, FR-019, FR-020).

### Implementation for User Story 1

- [X] T012 [US1] Implement `isDocs` in `scripts/ci/changed-paths.ts` per data-model.md and export it beside `isSkipSafe` and `isContentOnly`. Makes T008 pass.
- [X] T013 [US1] Implement the four-tier `decide` in `scripts/ci/changed-paths.ts` (skip-safe, docs, content-only admitting docs, full; first match wins; workflow and tier-rule files never match a narrow tier). Makes T009 pass.
- [X] T014 [P] [US1] Make `scripts/ci/verify-needs.ts` and `.github/workflows/ci.yml` satisfy T010 and T011 (docs skips lint, type-check, worker tests, build tests and e2e; unit tests and secretlint still run); adjust any `if:` that differs from `contracts/ci-tiers.md`.
- [X] T015 [US1] Update `docs/testing.md`: "Change tiers" as a table with the new Docs row and what counts as documentation, the CI job table, the `verify` description, and the accepted risk that no guard notices a future non-unit check that reads `docs/` (FR-013, FR-017).
- [X] T016 [US1] Local spot check, no file changes: with `GITHUB_EVENT_NAME=pull_request` run `node scripts/ci/changed-paths.ts` in the worktree and confirm it prints a recognised `tier=<value>` line, the reason and one changed file per line as plain text (FR-012). The live docs-only PR checks (quickstart steps 1 and 2, SC-001) are post-merge verification in spec.md, not tasks here.

**Checkpoint**: US1 works at the unit layer; live confirmation is post-merge verification (spec.md).

---

## Phase 4: User Story 2 - A docs-only push to `main` gets the same fast verify (Priority: P2)

**Goal**: pushes to `main` are sorted by the same rules from `github.event.before` to the pushed commit, and no push run is cancelled by a later one.

**Independent Test**: unit tests for `collectFiles`, the `BEFORE_SHA` wiring and the concurrency strings pass; quickstart steps 3 to 5 on real merges.

### Tests for User Story 2 (write first, seen failing)

- [X] T017 [P] [US2] Test, layer unit: in `tests/unit/ci/changed-paths.test.ts`, `collectFiles` with an injected fake git runner: pull request runs `diff --name-only --no-renames HEAD^1 HEAD`; push with missing, empty, short, non-hex, uppercase and all-zero `before` returns `null` without calling git; push fetch throws gives `null`; push diff throws gives `null`; push success runs the fetch of the validated id then `diff --name-only --no-renames <before> HEAD` (so a rename counts both paths, spec edge cases); other events give `null`; `decide` on a `push` with docs only gives `docs` and with `files: null` gives `full` (FR-009, FR-010, FR-018, SC-003).
- [X] T018 [P] [US2] Test, layer unit: in `tests/unit/ci/workflows.test.ts`, the `changes` step passes `BEFORE_SHA: ${{ github.event.before }}` through `env:` and no `run:` line contains `github.event.before`; the concurrency group and `cancel-in-progress` strings equal those in research R5 (push runs group by `github.sha`, pull requests keep per-ref cancelling) (FR-014, FR-018, SC-005).

### Implementation for User Story 2

- [X] T019 [US2] Implement `collectFiles({ event, before }, git)` in `scripts/ci/changed-paths.ts` per research R4 and wire `main()` to `execFileSync("git", ...)`, `process.env.GITHUB_EVENT_NAME` and `process.env.BEFORE_SHA`; paths are read from git output and never passed back to git or a shell; any failure yields `null`, which `decide` maps to `full`. Makes T017 pass.
- [X] T020 [US2] Implement in `.github/workflows/ci.yml`: `BEFORE_SHA` via `env:` on the `changes` step, and the per-push concurrency group with `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`; keep `fetch-depth: 2`, read-only permissions and the pinned actions. Makes T018 pass.
- [X] T021 [US2] Update `docs/testing.md` (pushes to `main` are sorted, runs on `main` are not cancelled, the residual-risk paragraph now says a content-only merge loses its full `main` backstop, the measurement method says to pick a full-tier run and that docs-tier timings exclude the wait for the first runner, the runner-queueing accepted risk) and `docs/setup.md` item 11 (replace "Pushes to `main` always run the full gate"). Confirm no statement that pushes always run the full gate remains (FR-013).
- [X] T022 [US2] Local spot check, no file changes (quickstart "Local"): `GITHUB_EVENT_NAME=push BEFORE_SHA=0000000000000000000000000000000000000000 node scripts/ci/changed-paths.ts` logs `tier=full` naming the all-zeros `before`; with `BEFORE_SHA` set to the commit `origin/main` points at, it fetches that commit, logs the files changed from it to `HEAD` one per line, and logs `tier=full` (this branch changes the workflow) (FR-009, FR-012). The live `main` push checks (quickstart steps 3 to 5, SC-002, SC-005, setup check) are post-merge verification in spec.md, not tasks here.

**Checkpoint**: both stories work at the unit layer and in local spot checks; live checks are post-merge verification (spec.md).

---

## Phase 5: Polish and cross-cutting

- [ ] T023 [P] Re-read `docs/testing.md` and `docs/setup.md` against FR-013 and the spec's Accepted risks; fix wording to plain language with no leftover `full`/`content_only` output names. Scope stays inside the files named in plan.md.
- [ ] T024 Run the full local gate: `pnpm run verify` (ask Don first; use `ASTRO_PREVIEW_BACKGROUND=1`, check port 4321 with lsof first, read the `VERIFY_EXIT=` line). The PR body flags the major-change criterion "changes CI, deployment or infrastructure configuration".

---

## Dependencies and order

- T001, then Phase 2 (T002 to T004 before T005 to T007), then US1, then US2 (US2 reuses `decide` from US1 but is independently testable).
- Within each story: tests, seen failing, then implementation, then docs, then the local spot check.
- T024 last. No task is `[PREVIEW-CHECK]`; the live CI checks are post-merge verification recorded in spec.md and do not hold auto-merge.

## Parallel opportunities

- T003 and T004 with T002; T006 with T005.
- T010 and T011 with T008; T017 and T018 are in different files.

## Implementation strategy

MVP is Phase 1, 2 and US1 (the pull request case the issue names). Add US2 after. Both ship in one PR because the workflow and scripts change together.
