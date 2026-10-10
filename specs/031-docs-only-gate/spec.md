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

Some files under `docs/` are read by checks. Today these are `docs/setup.md`, `docs/launch.md`,
`docs/pages.md`, `docs/posts.md`, `docs/projects.md` and `docs/design-source.md`, read by unit
checks of the setup walkthrough, the launch runbook and the authoring guides. Others, such as
`docs/cutover-plan.md`, `docs/testing.md` and the design notes under `docs/design/`, are read by
no check. A docs-only change must still run every check that reads a documentation file, so a
broken guide or runbook is still caught.

**Major change (Constitution Principle III)**: this changes CI configuration, so it is a major
change and its pull request is flagged as one. Principle II ("checks are never skipped") is met
in the same way as the existing skip-safe tier: the only checks left out are ones that cannot
observe the change, and every check that reads a changed file still runs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A docs-only pull request gets a fast verify (Priority: P1)

Don or an agent opens a pull request that changes only documentation, for example ticking boxes
in the cutover plan. CI runs the secret scan and the checks that read documentation, skips the
lint, type-check, build, build tests and end-to-end tests, and reports `verify` as passed once
those checks pass. Don can approve and the pull request merges without waiting for the full gate.

**Why this priority**: It is the problem the issue names (PR #126 waited on the full gate for a
checklist edit), and the most frequent case during the cutover.

**Independent Test**: Open a pull request that changes only a Markdown file under `docs/` and
confirm that the docs checks and the secret scan run, the build, build tests and end-to-end
tests are skipped, and `verify` passes.

**Acceptance Scenarios**:

1. **Given** a pull request whose only change is `docs/cutover-plan.md`, **When** CI runs,
   **Then** the secret scan and the docs checks run, the lint, type-check, remaining unit checks,
   worker tests, build, build tests and end-to-end tests do not run, and `verify` passes.
2. **Given** a pull request that changes `docs/launch.md` so that a launch-runbook check fails,
   **When** CI runs, **Then** that check runs and fails, and `verify` fails.
3. **Given** a pull request that changes only documentation and skip-safe files (for example
   `docs/testing.md` and a file under `specs/`), **When** CI runs, **Then** it gets the docs
   tier, not the full gate.
4. **Given** a pull request that changes a documentation file and any file that is neither
   documentation nor skip-safe nor content, **When** CI runs, **Then** the full gate runs.

---

### User Story 2 - A docs-only push to `main` gets the same fast verify (Priority: P2)

When a pull request merges, or a commit lands on `main` some other way, CI sorts the push by the
files it changed against the previous state of `main`, using the same tiers as a pull request.
A merge that brought in only documentation runs the docs tier on `main` too.

**Why this priority**: Every merge today runs the full gate again on `main`, whatever it changed.
It matters less than the pull request case because nothing waits on it, but it doubles the cost
of every docs-only change.

**Independent Test**: Merge a docs-only pull request and confirm the `main` run takes the docs
tier and `verify` passes; merge a pull request that changes code and confirm the `main` run takes
the full gate.

**Acceptance Scenarios**:

1. **Given** a merge to `main` whose changes against the previous `main` are only documentation,
   **When** CI runs on the push, **Then** it runs the docs tier and `verify` passes once the docs
   checks and the secret scan pass.
2. **Given** a merge to `main` that brings in any code, configuration, dependency or test change,
   **When** CI runs on the push, **Then** the full gate runs.
3. **Given** a push to `main` whose changed files cannot be worked out (for example the previous
   commit is unknown), **When** CI runs, **Then** the full gate runs.

---

### User Story 3 - A new check that reads documentation cannot be missed (Priority: P3)

An agent adds a check that reads a file under `docs/`, but forgets to add it to the docs checks.
The gate refuses that change, so the docs tier never silently stops covering a documentation file
that a check depends on.

**Why this priority**: It keeps the docs tier honest over time, in the same way the content-only
tier is guarded today. Without it the tier is correct on the day it lands and drifts afterwards.

**Independent Test**: Add a scratch check that reads a `docs/` file and is not in the docs checks,
and confirm the guard fails and names it.

**Acceptance Scenarios**:

1. **Given** a check outside the docs checks that reads a file under `docs/`, **When** the guard
   runs, **Then** it fails and names that check and the file.
2. **Given** the docs checks name a check that no longer exists, **When** the guard runs, **Then**
   it fails and names the missing check.

### Edge Cases

- **Deleting a documentation file** that a check reads: the change is still docs-only, the docs
  checks run, and the check that reads it fails.
- **Moving a file into or out of `docs/`**: the change is treated as a deletion plus an addition.
  The side outside `docs/` decides the tier, so moving a code file into `docs/`, or a doc out of
  it, runs the full gate unless the other side is itself skip-safe.
- **A non-Markdown file under `docs/`** (an image, a script, a data file): not documentation for
  this rule; the full gate runs.
- **A Markdown file outside `docs/`**, such as `README.md` or a `.md` file under `src/`: not
  documentation for this rule; the full gate runs.
- **Unusual paths** (containing `..`, starting with `/`, or containing a backslash): never
  documentation; the full gate runs.
- **Documentation plus content files**: the content-only tier runs (the whole gate with the
  narrower build tests), and the docs checks run as part of the unit checks.
- **An empty diff** or a diff that cannot be computed, on a pull request or a push: the full gate
  runs.
- **A push to `main` of several commits at once**: the tier is decided by every file changed
  across the whole push, not only the last commit.
- **The workflow file, the tier rules or the docs checks themselves change**: those are not
  documentation, so the full gate runs.
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
- **FR-005**: On the docs tier CI MUST run the secret scan over the whole repository and the
  **docs checks**, and MUST NOT run the lint, type-check, the other unit and component checks, the
  worker tests, the build, the build tests, the end-to-end, accessibility, visual and budget
  tests, or the preview site check.
- **FR-006**: The **docs checks** MUST be every automated check that reads a file under `docs/`,
  named in one place. At the time of writing they are the checks that read `docs/setup.md`,
  `docs/launch.md`, `docs/pages.md`, `docs/posts.md`, `docs/projects.md` and
  `docs/design-source.md`.
- **FR-007**: A guard MUST fail when a check outside the docs checks reads a file under `docs/`,
  or when the docs checks name a check that does not exist. The guard runs as part of the unit
  checks, so it runs on every change that is not skip-safe or docs-only, including any change to
  the checks themselves.
- **FR-008**: `verify` MUST report on every pull request and every push to `main`, on every tier.
  On the docs tier it MUST pass only when the change sorting, the secret scan and the docs checks
  all succeed and the skipped jobs were skipped because the tier said so. Any failure, cancellation
  or unexpected skip MUST fail it.
- **FR-009**: A push to `main` MUST be sorted into a tier by the same rules as a pull request,
  from every file changed between the previous state of `main` and the pushed commit. If that
  set cannot be worked out, or is empty, the full gate MUST run.
- **FR-010**: Anything the change sorting cannot positively recognise, and any error while sorting,
  MUST run the full gate (fail closed). An error MUST never make `verify` pass.
- **FR-011**: The existing skip-safe and content-only tiers MUST keep their current rules and the
  checks they run, apart from now also applying to pushes to `main` (FR-009).
- **FR-012**: The change sorting MUST log which tier it chose, why, and the changed files, so a
  reader of the run can see why a job was skipped.
- **FR-013**: `docs/testing.md` ("Change tiers" and the CI job table) MUST describe the docs tier,
  what counts as documentation, which checks run, and that pushes to `main` are now sorted too.

### Key Entities

- **Documentation file**: a `.md` file under `docs/`. The only kind of file that can put a change
  in the docs tier.
- **Docs checks**: the named set of automated checks that read files under `docs/`, kept complete
  by the guard.
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
- **SC-005**: Adding a check that reads `docs/` without adding it to the docs checks fails the
  gate every time.

## Assumptions

- No part of the built site, the Worker or the end-to-end tests reads files under `docs/` at run
  time; code comments that mention `docs/` paths do not count. If that ever changes, the file it
  reads stops being safe to skip for, and the guard (FR-007) is the place to catch it.
- Only `.md` files count. Images and other files under `docs/design/` are rare changes and are
  left on the full gate to keep the rule narrow; widening it is follow-up work.
- `README.md` and other Markdown outside `docs/` stay on the full gate; adding them is follow-up
  work if it proves useful.
- The production deployment is triggered by its own platform build on `main`, not by this
  workflow, so sorting pushes to `main` does not change what gets deployed. A docs-only merge
  changes nothing on the site.
- Lint does not check Markdown, and the type-check does not read `docs/`, so skipping them on
  the docs tier loses no coverage.
- The branch rule requires only the `verify` check, which reports on every tier, so the docs tier
  needs no change to the ruleset.
- Choices made without asking (the spec phase cannot interview Don): documentation means `.md`
  under `docs/` only; pushes to `main` use all tiers, not only the docs tier; mixed docs and
  content changes take the content-only tier. Each is open to change in `/speckit-clarify`.
