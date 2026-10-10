# Feature Specification: Docs-only verify gate

**Feature Branch**: `031-docs-only-gate`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description (GitHub issue #127, "Skip the full verify gate when a change touches
no code"): "When a pull request or a push to `main` changes only documentation, such as Markdown
under `docs/`, CI runs only the checks that read those files and skips the build, build tests and
end-to-end tests. `verify` still reports, so the branch rule is satisfied, and it passes as soon
as those few checks pass. Today only changes under `.claude/`, `.specify/` and `specs/` (and
`CLAUDE.md`) skip the gate. A docs-only change such as PR #126, which ticked boxes in the cutover
plan, waits on the full build and end-to-end run, and every push to `main` runs the full gate
whatever it changed. Anything CI cannot positively recognise as documentation still runs the full
gate."

## Context

CI already sorts each pull request into one of three tiers by the files it changes (recorded in
`docs/testing.md`, "Change tiers"):

- **Skip-safe**: every changed file is pipeline wording that no check reads (`.md`, `.yml`,
  `.yaml`, `.json`, `.sh`, `.py` and `.ps1` files under `.claude/`, `.specify/` and `specs/`, and
  `CLAUDE.md`, except files a check reads). Only the secret scan runs.
- **Content-only**: every changed file is skip-safe or a post, page or project content file or
  content image. The whole gate runs, with a narrower set of build tests.
- **Full**: everything else, every push to `main`, an empty diff and any failure to work out the
  diff.

Files under `docs/` are in none of the narrow tiers, so a change that only edits the cutover plan
or the testing guide runs the full build and end-to-end run, which takes several minutes and adds
nothing: no part of the built site reads `docs/`.

Some files under `docs/` are read by unit checks (for example `docs/setup.md`, `docs/launch.md`
and the authoring guides, read by checks of the setup walkthrough, the launch runbook and the
guides). A docs-only change therefore still runs the whole unit and component suite, so a broken
guide or runbook is still caught, and no list of which checks read `docs/` has to be kept.

Production is deployed by Cloudflare Workers Builds on every push to `main`, independently of
this workflow, so the CI run on `main` never gates a deploy. The `main` ruleset requires a pull
request that is up to date with `main`, so the tree that lands on `main` is one CI already
checked on its pull request.

**Major change (Constitution Principle III)**: this changes CI configuration, so it is a major
change and its pull request is flagged as one. Principle II ("checks are never skipped") is met
in the same way as the existing skip-safe tier: the only checks left out are ones that cannot
observe the change, and every unit check, including each one that reads a changed file, still
runs.

## Clarifications

### Session 2026-10-09

- Q: Should pushes to `main` be sorted into tiers too, and if so, into which ones? → A: Every
  tier, by the same rules as pull requests.
- Q: Which files should a `main` push be compared against, and should a newer merge still be
  allowed to cancel the `main` run already going? → A: Compare `github.event.before` with the
  pushed commit, fetching enough history for that; run the full gate if `before` is missing, all
  zeros or cannot be fetched; stop cancelling in-progress runs on `main`, while pull requests keep
  cancelling.
- Q: On a docs-only change, should CI run a hand-kept list of "docs checks" protected by a guard,
  or simply the whole unit and component suite? → A: The secret scan and the whole unit and
  component suite (`test:unit`); lint, type-check, worker tests, build, build tests and end-to-end
  tests are skipped; no named list and no drift guard.
- Q: Which files count as documentation for the docs tier? → A: Only `.md` files under `docs/`,
  at any depth.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A docs-only pull request gets a fast verify (Priority: P1)

Don or an agent opens a pull request that changes only documentation, for example ticking boxes
in the cutover plan. CI runs the secret scan and the unit and component suite, skips the lint,
type-check, worker tests, build, build tests and end-to-end tests, and reports `verify` as passed
once those checks pass. Don can approve and the pull request merges without waiting for the full
gate.

**Why this priority**: It is the problem the issue names (PR #126 waited on the full gate for a
checklist edit), and the most frequent case during the cutover.

**Independent Test**: Open a pull request that changes only a Markdown file under `docs/` and
confirm that the secret scan and the unit and component suite run, the build, build tests and
end-to-end tests are skipped, and `verify` passes.

**Acceptance Scenarios**:

1. **Given** a pull request whose only change is `docs/cutover-plan.md`, **When** CI runs,
   **Then** the secret scan and the unit and component suite run, the lint, type-check, worker
   tests, build, build tests and end-to-end tests do not run, and `verify` passes.
2. **Given** a pull request that changes `docs/launch.md` so that a launch-runbook check fails,
   **When** CI runs, **Then** that check runs as part of the unit and component suite and fails,
   and `verify` fails.
3. **Given** a pull request that changes only documentation and skip-safe files (for example
   `docs/testing.md` and a file under `specs/`), **When** CI runs, **Then** it gets the docs
   tier, not the full gate.
4. **Given** a pull request that changes a documentation file and any file that is neither
   documentation nor skip-safe nor content, **When** CI runs, **Then** the full gate runs.

---

### User Story 2 - A docs-only push to `main` gets the same fast verify (Priority: P2)

When a pull request merges, or a commit lands on `main` some other way, CI sorts the push by the
files it changed between the commit `main` was on before the push and the pushed commit, using
the same tiers as a pull request. A merge that brought in only documentation runs the docs tier
on `main` too. Each push to `main` gets its own complete run: a later push does not cancel it.

**Why this priority**: Every merge today runs the full gate again on `main`, whatever it changed.
It matters less than the pull request case because nothing waits on it, but it doubles the cost
of every docs-only change.

**Independent Test**: Merge a docs-only pull request and confirm the `main` run takes the docs
tier and `verify` passes; merge a pull request that changes code and confirm the `main` run takes
the full gate.

**Acceptance Scenarios**:

1. **Given** a merge to `main` whose changes against the previous `main` are only documentation,
   **When** CI runs on the push, **Then** it runs the docs tier and `verify` passes once the unit
   and component suite and the secret scan pass.
2. **Given** a merge to `main` that brings in any code, configuration, dependency or test change,
   **When** CI runs on the push, **Then** the full gate runs.
3. **Given** a push to `main` whose previous commit is missing, all zeros or cannot be fetched,
   **When** CI runs, **Then** the full gate runs.
4. **Given** a merge to `main` whose run is in progress, **When** a second merge is pushed,
   **Then** the first run is not cancelled and both runs complete.

### Edge Cases

- **Deleting a documentation file** that a check reads: the change is still docs-only, the unit
  and component suite runs, and the check that reads it fails.
- **Moving a file into or out of `docs/`**: the change is treated as a deletion plus an addition.
  The side outside `docs/` decides the tier, so moving a code file into `docs/`, or a doc out of
  it, runs the full gate unless the other side is itself skip-safe.
- **A non-Markdown file under `docs/`** (an image such as the design images under `docs/design/`,
  a script, a data file): not documentation for this rule; the full gate runs.
- **A Markdown file outside `docs/`**, such as `README.md` or a `.md` file under `src/`: not
  documentation for this rule; the full gate runs.
- **Unusual paths** (containing `..`, starting with `/`, or containing a backslash): never
  documentation; the full gate runs.
- **Documentation plus content files**: the content-only tier runs (the whole gate with the
  narrower build tests), which includes the unit and component suite.
- **An empty diff** or a diff that cannot be computed, on a pull request or a push: the full gate
  runs.
- **A push to `main` of several commits at once**: the tier is decided by every file changed
  between the commit `main` was on before the push and the pushed commit, not only the last
  commit.
- **Two merges to `main` in quick succession**: neither run is cancelled, so each push is sorted
  and checked on its own. Pull request runs still cancel an older run on the same branch.
- **The workflow file or the tier rules themselves change**: those are not documentation, so the
  full gate runs.
- **The preview site check on pull requests**: it runs inside the end-to-end job, so it is skipped
  on a docs-only change. Documentation does not reach the built site, so there is nothing for it
  to check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI MUST recognise a **documentation file** as a file whose path starts with `docs/`
  and ends in `.md`, at any depth under `docs/`, and nothing else.
- **FR-002**: A path with `..`, a leading `/` or a backslash MUST never be recognised as
  documentation.
- **FR-003**: CI MUST add a **docs tier**, chosen when every changed file is either a
  documentation file or skip-safe, and at least one changed file is a documentation file. A
  change made only of skip-safe files keeps the skip-safe tier.
- **FR-004**: The tiers MUST be tried in this order, first match wins: skip-safe, docs,
  content-only, full. A change containing any file that is none of skip-safe, documentation or
  content runs the full gate, and a change that mixes documentation with content files runs the
  content-only tier.
- **FR-005**: On the docs tier CI MUST run the secret scan over the whole repository and the whole
  unit and component suite (`test:unit`), and MUST NOT run the lint, type-check, the worker tests,
  the build, the build tests, the end-to-end, accessibility, visual and budget tests, or the
  preview site check.
- **FR-006**: The docs tier MUST NOT depend on a list of which checks read files under `docs/`:
  running the whole unit and component suite covers every such check, including ones added later.
- **FR-008**: `verify` MUST report on every pull request and every push to `main`, on every tier.
  On the docs tier it MUST pass only when the change sorting, the secret scan and the unit and
  component suite all succeed and the skipped jobs and steps were skipped because the tier said
  so. Any failure, cancellation or unexpected skip MUST fail it.
- **FR-009**: A push to `main` MUST be sorted into a tier (skip-safe, docs, content-only or full)
  by the same rules as a pull request, from every file changed between the push's previous commit
  (`github.event.before`) and the pushed commit. CI MUST fetch enough history to compute that
  diff. If the previous commit is missing, all zeros or cannot be fetched, or the set of changed
  files is empty or cannot be worked out, the full gate MUST run.
- **FR-010**: Anything the change sorting cannot positively recognise, and any error while sorting,
  MUST run the full gate (fail closed). An error MUST never make `verify` pass.
- **FR-011**: The existing skip-safe and content-only tiers MUST keep their current rules and the
  checks they run, apart from now also applying to pushes to `main` (FR-009).
- **FR-012**: The change sorting MUST log which tier it chose, why, and the changed files, so a
  reader of the run can see why a job was skipped.
- **FR-013**: `docs/testing.md` ("Change tiers" and the CI job table) MUST describe the docs tier,
  what counts as documentation, which checks run, that pushes to `main` are now sorted too, and
  that runs on `main` are no longer cancelled by a later push.
- **FR-014**: A CI run for a push to `main` MUST NOT be cancelled by a later push to `main`. Pull
  request runs MUST keep cancelling an in-progress run for the same pull request.

### Key Entities

- **Documentation file**: a `.md` file under `docs/`, at any depth. The only kind of file that
  can put a change in the docs tier.
- **Change tier**: skip-safe, docs, content-only or full, chosen per pull request or push from the
  changed files; decides which jobs and steps run and which skips `verify` accepts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pull request that changes only Markdown under `docs/` gets a passing `verify` in
  under 2 minutes of CI time, against roughly 6 minutes for the full gate today.
- **SC-002**: A docs-only merge to `main` gets a passing `verify` on `main` in under 2 minutes.
- **SC-003**: 100% of changes that touch any file other than documentation, skip-safe or content
  files run the full gate, shown by the sorting checks covering each kind of path the edge cases
  list.
- **SC-004**: A docs-only change that breaks a check reading that documentation fails `verify`
  every time.
- **SC-005**: Every push to `main` ends with a completed `verify` run of its own; none is
  cancelled by a later push.

## Assumptions

- No part of the built site, the Worker or the end-to-end tests reads files under `docs/` at run
  time; code comments that mention `docs/` paths do not count. Checks that read `docs/` are unit
  checks, which run on the docs tier.
- Only `.md` files count. Images and other files under `docs/design/` are rare changes and are
  left on the full gate to keep the rule narrow; widening it is follow-up work.
- `README.md` and other Markdown outside `docs/` stay on the full gate; adding them is follow-up
  work if it proves useful.
- Production is deployed by Cloudflare Workers Builds on every push to `main`, not by this
  workflow, so sorting pushes to `main` does not change what gets deployed or when. A docs-only
  merge changes nothing on the site.
- Lint (`eslint`) does not check Markdown, and the type-check does not read `docs/`, so skipping
  them on the docs tier loses no coverage.
- The branch rule requires only the `verify` check, which reports on every tier, so the docs tier
  needs no change to the ruleset.
- The `launch-main-checks` setup check reads the newest `verify` on `main`; a passing docs-tier
  `verify` satisfies it as before.
