# Implementation Plan: Docs-only verify gate

**Branch**: `031-docs-only-gate` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/031-docs-only-gate/spec.md` (issue #127)

## Summary

Add a fourth change tier, **docs**, to the CI gate: a change made only of `.md` files under
`docs/` (plus skip-safe files) runs the secret scan and the whole unit and component suite, and
skips lint, type-check, worker tests, build tests and the end-to-end job. Pushes to `main` are
sorted by the same rules, from `github.event.before` to the pushed commit, and no longer cancel
each other. The `changes` job replaces its `full` / `content_only` outputs with one `tier`
output; `verify-needs.ts` accepts skipped heavy jobs on `skip-safe` and `docs` and fails closed
on any unknown tier. Approach and alternatives are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript run directly by Node 24 (type stripping), as the existing
`scripts/ci/*.ts`; GitHub Actions YAML.

**Primary Dependencies**: none new. `git` on the runner, `actions/checkout` (already pinned).

**Storage**: N/A.

**Testing**: Vitest `unit` project (`tests/unit/ci/changed-paths.test.ts`,
`verify-needs.test.ts`, `workflows.test.ts`).

**Target Platform**: GitHub-hosted `ubuntu-latest` runners.

**Project Type**: CI configuration and scripts in the Astro site repository.

**Performance Goals**: docs-tier `verify` in under 2 minutes wall time (measured estimate
75–90 s, research R6).

**Constraints**: fail closed on every unknown or error (FR-010); `verify` reports on every tier
(FR-008); no new actions or services.

**Scale/Scope**: 3 files changed in `scripts/ci` and `.github/workflows`, 3 test files, 2 docs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Result: **pass**
before and after design; no exceptions, so Complexity Tracking is empty.

| Principle | How this plan meets it |
|---|---|
| I. Test-First | Unit tests for `isDocs`, the four-tier `decide`, push-diff collection (each failure path through an injected git runner), `verify-needs` tier rules, and the workflow's exact `if:` and concurrency strings are written and seen failing before the scripts and YAML change. Primary layer: unit (cheapest layer that observes the logic). The live CI runs in quickstart.md are confirmation, not a second test layer. |
| II. Automated Release Gate | Checks are not weakened: on the docs tier the only jobs skipped are ones that cannot observe a `.md` file under `docs/` (research R8: nothing outside the unit project reads `docs/`; ESLint has no Markdown plugin; type-check reads no `docs/`). Every unit check, including each that reads a changed doc, runs. Unknown tier, failed sort, failed fetch, empty diff → full gate; unknown tier fails `verify`. Production deploys stay with Cloudflare Workers Builds on `main`, unchanged. |
| III. Human Review | **Major change**: it changes CI configuration (`.github/workflows/ci.yml`, `scripts/ci/*`). The PR body flags it with that criterion. No other major-change criterion applies (no dependency, contact data, design, cost or constitution change). |
| IV. First-Party Before Custom | First-party option considered: GitHub Actions `on.<event>.paths` / `paths-ignore`. It falls short because a filtered-out workflow never reports the required `verify` check (the PR blocks), it cannot skip part of a job, cannot order four tiers, and fails open on unlisted paths (R1). GitHub has no job- or step-level path condition. The repository's own `changed-paths.ts` is therefore extended, not replaced. Concurrency uses the built-in `concurrency` key (R5); the diff uses the runner's `git` and `actions/checkout` (R4). No Astro or Cloudflare decision is made, so no Astro docs page applies; Fly.io is not used. |
| V. Static by Default | Unaffected; no page, endpoint or client code changes. |
| VI. Content as Files | Unaffected. Content-only tier keeps its rules (FR-011). |
| VII. Private Data | Unaffected. The `changes` job gains no secret; `BEFORE_SHA` is a public commit id passed via `env:`, not interpolated into a shell line. |
| VIII. Cloudflare Best Practices | Unaffected; Worker config and deploys untouched. |
| IX. Cost Ceiling | Expected new monthly cost: **$0**. GitHub Actions minutes on a public repository are free; the slice reduces minutes used. No Cloudflare change. |
| X. Accessible, Fast and Private | The a11y and budget checks still run on every tier that can change a page; a docs-only change cannot change a page. |
| XI. Spec Kit Workflow | Spec Kit branch `031-docs-only-gate`, one feature, own worktree. No sibling is known to edit `ci.yml` or `scripts/ci/`; if one merges first, merge `origin/main` and re-run the workflow tests. |
| Security Baseline | Ruleset untouched (still requires `verify` only, which reports on every tier). Headers, Dependabot, edge protections unchanged. No write permissions are added to any job (asserted by an existing test). |
| Development Workflow | Every test task names its layer (unit). Out-of-scope items (images under `docs/design/`, `README.md`) stay as spec follow-ups. |

## Design

### `scripts/ci/changed-paths.ts`

- Add `isDocs(path)` (data-model "Documentation file").
- Replace `ChangeDecision { full, contentOnly }` with `{ tier, reason }`; `decide` tries
  skip-safe → docs → content-only (now admitting docs files) → full, and treats `push` like
  `pull_request` (data-model "Change tier").
- Add `collectFiles({ event, before }, git)` with the PR and push paths (research R4); `main()`
  wires it to `execFileSync("git", ...)` and `process.env.BEFORE_SHA`.
- `toOutput` writes `tier=<value>\n`. Log tier, reason and files (FR-012).

### `scripts/ci/verify-needs.ts`

- Read `outputs.tier`; known tiers `skip-safe | docs | content-only | full`; `build-tests` and
  `e2e` may be `skipped` only on `skip-safe` or `docs` (research R3). FR-008's step-level part is
  met by the step `if:` conditions, pinned by the workflow tests.

### `.github/workflows/ci.yml`

- Concurrency per research R5.
- `changes`: output `tier`; step env `BEFORE_SHA: ${{ github.event.before }}`.
- `static`, `build-tests`, `e2e`: conditions per contracts/ci-tiers.md.

### Docs

- `docs/testing.md`: CI jobs table, `verify` bullet, "Change tiers" (intro, new Docs row, Full
  row, pushes to `main` sorted, `main` runs not cancelled, output now `tier`), residual-risk
  paragraph (the `main` push run is no longer a guaranteed full backstop for content-only
  merges; say so plainly), measurement method ("choose a full-tier run").
- `docs/setup.md` item 11: replace "Pushes to `main` always run the full gate" with the tiered
  behaviour and add the docs tier to the skip description.
- `scripts/setup-check/checks/launch-main-checks.ts`: no change (research R9).

## Tests (all layer: unit)

1. `tests/unit/ci/changed-paths.test.ts`
   - `isDocs`: true for `docs/testing.md`, `docs/design/blog.md`; false for `docs/x.png`,
     `docs/x.mdx`, `docs/x.MD`, `README.md`, `src/docs/a.md`, `docs`, `docs/../src/a.md`,
     `/docs/a.md`, `docs\\a.md`.
   - `decide`: docs only → `docs`; docs + skip-safe → `docs`; skip-safe only → `skip-safe`;
     docs + content → `content-only`; docs + `src/` → `full` naming the `src/` file; docs +
     `docs/design/x.png` → `full`; `push` with docs only → `docs`; `push` with `files: null` →
     `full`; unknown event → `full`; empty and blank diffs → `full`; the existing skip-safe and
     content-only cases re-expressed with `tier` (FR-011).
   - `collectFiles` with a fake git runner: PR runs `diff HEAD^1 HEAD`; push with empty, short,
     non-hex and all-zero `before` → `null` without calling git; push fetch throws → `null`;
     push diff throws → `null`; push success runs fetch then `diff <before> HEAD`.
   - `toOutput` renders `tier=docs\n`.
   - Existing drift guard unchanged.
2. `tests/unit/ci/verify-needs.test.ts` (helper builds `needs` from a tier)
   - docs: heavy jobs skipped → pass; heavy jobs succeeded → pass; `static` skipped or failed →
     fail.
   - content-only and full: a skipped `build-tests` or `e2e` → fail.
   - unknown tier (`"bogus"`, `""`, missing, old `full` output only) → fail naming `tier`.
   - existing failure / cancelled / missing-job cases re-expressed with `tier`.
3. `tests/unit/ci/workflows.test.ts`
   - `changes` outputs exactly `tier`; the step passes `BEFORE_SHA: ${{ github.event.before }}`
     via `env:` and no `run:` line contains `github.event.before`.
   - each `static` step's `if:` is the exact string in contracts/ci-tiers.md; secretlint has
     none; `build-tests` / `e2e` job `if:` strings; the two build-test step strings; no
     reference to `outputs.full` or `outputs.content_only` remains.
   - concurrency group and `cancel-in-progress` strings per research R5.
   - existing "does not use paths or paths-ignore filters" stays.

## Project Structure

### Documentation (this feature)

```text
specs/031-docs-only-gate/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ci-tiers.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
.github/workflows/ci.yml
scripts/ci/changed-paths.ts
scripts/ci/verify-needs.ts
tests/unit/ci/changed-paths.test.ts
tests/unit/ci/verify-needs.test.ts
tests/unit/ci/workflows.test.ts
docs/testing.md
docs/setup.md
```

**Structure Decision**: existing files only; no new source files.

## Risks

- **Content-only merges lose their full `main` backstop.** FR-011 applies the content-only tier
  to pushes, so the residual risk `docs/testing.md` describes (a content edit colliding with a
  fixture-build assertion) is no longer caught by a full run on `main`; it shows on the next
  full-tier run instead. The spec chose this; the docs say it plainly.
- **Runner queueing** can push a docs-tier run past 2 minutes; the tier cannot control that.
- **Fetching `before` by SHA** relies on GitHub serving reachable commits by id; if that fails,
  the run is full, never wrongly narrow.

## Complexity Tracking

None.
