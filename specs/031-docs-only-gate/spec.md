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
this workflow, so the CI run on `main` never gates a deploy (source: `docs/setup.md`, which
connects Workers Builds to the repository and stores no Cloudflare deploy token in GitHub). The
`main` ruleset (`setup/github-ruleset.json`) requires a pull request that is up to date with
`main` (`strict_required_status_checks_policy`) and has no bypass actors, so the tree that lands
on `main` is one CI already checked on its pull request. If that ever stopped holding (the
ruleset edited or disabled by hand), a push carrying code still sorts to the full tier and one
carrying content still runs the content-only tier, so nothing lands unchecked; only the
pull-request-level review is lost. Detecting ruleset drift is issue #86, outside this slice.

This slice changes CI configuration and its documentation only. No page, component, template,
style or other visual output changes, so the page-level WCAG 2.2 AA requirements (Constitution
Principle X) have nothing new to apply to. Accessibility, visual and budget checks keep running,
with unchanged rules, on every tier that can change a page (content-only and full); they are
skipped only on the skip-safe and docs tiers, whose files never reach the built site.

**Major change (Constitution Principle III)**: this changes CI configuration, so it is a major
change. Its pull request body flags it in text, naming the criterion "changes CI, deployment or
infrastructure configuration", and it needs Don's approving review like every pull request.
Principle II ("checks are never skipped") is met in the same way as the existing skip-safe tier,
and FR-017 states it as a rule: the only checks left out are ones that cannot observe the
change, and every unit check, including each one that reads a changed file, still runs.

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
- **Moving or renaming a file into or out of `docs/`**: the change is treated as a deletion plus
  an addition, and both the old and the new path count as changed files. The side outside
  `docs/` decides the tier, so moving a code file into `docs/`, or a doc out of it, runs the full
  gate unless the other side is itself skip-safe. A non-documentation file renamed out of
  `docs/` (for example `docs/design/x.png` to `src/x.png`) is non-documentation on both sides
  and runs the full gate.
- **A non-Markdown file under `docs/`** (an image such as the design images under `docs/design/`,
  a script, a data file): not documentation for this rule; the full gate runs.
- **A Markdown file outside `docs/`**, such as `README.md` or a `.md` file under `src/`: not
  documentation for this rule; the full gate runs.
- **Unusual paths** (containing `..`, starting with `/`, or containing a backslash): never
  documentation, skip-safe or content; the full gate runs.
- **Case and lookalike tricks**: `docs/a.MD`, `Docs/a.md`, `docs/a.mdx` and `docs/a.markdown` are
  not documentation. A path with non-ASCII characters (including Unicode lookalikes of `docs`) or
  a newline is printed by git in quoted, escaped form, so it does not start with `docs/` and is
  not documentation; the full gate runs.
- **A file name that looks like a git option** (for example `--help.md` under `docs/`): the
  file list is read from git's output and is never passed back to git or a shell as arguments,
  so the name is only ever compared as text.
- **A pull request from a fork**: sorted exactly like any other pull request. The sorting needs
  no secret and only the workflow's read-only token, both of which a fork run has. A fork that
  edits the workflow or the tier rules gets the full gate (FR-016) and still needs Don's review.
- **A force-push or other non-fast-forward push to `main`**: the ruleset forbids it and has no
  bypass actors. If one happened anyway, `before` may no longer be fetchable, which runs the full
  gate (FR-009); if it is fetchable, the comparison is between the two trees, so the tier still
  reflects every file that differs between them.
- **A doc that a unit check reads**: unit checks read files under `docs/` as text and compare
  them; none runs a doc's content as a command. Any such check runs on the docs tier as part of
  the unit and component suite with the same read-only token, so a docs-only change gains no
  path to run anything a full-gate change could not.
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
  full gate runs (FR-016).
- **An event other than a pull request or a push to `main`** (for example a manual or scheduled
  run, if one is ever added): the full gate runs.
- **The preview site check on pull requests**: it runs inside the end-to-end job, so it is skipped
  on a docs-only change. Documentation does not reach the built site, so there is nothing for it
  to check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI MUST recognise a **documentation file** as a file whose path starts with `docs/`
  and ends in `.md`, at any depth under `docs/`, and nothing else. The comparison is exact and
  case-sensitive: `.MD`, `.mdx` and `.markdown` files, a `Docs/` path and the bare path `docs`
  are not documentation.
- **FR-002**: A path with `..`, a leading `/` or a backslash MUST never be recognised as
  documentation, skip-safe or content (the existing skip-safe and content rules already refuse
  them, and keep doing so).
- **FR-003**: CI MUST add a **docs tier**, chosen when every changed file is either a
  documentation file or skip-safe, and at least one changed file is a documentation file. A
  change made only of skip-safe files keeps the skip-safe tier.
- **FR-004**: The tiers MUST be tried in this order, first match wins: skip-safe, docs,
  content-only, full. A change containing any file that is none of skip-safe, documentation or
  content runs the full gate, and a change that mixes documentation with content files runs the
  content-only tier. No path falls to a narrower tier by default: a path is admitted to a narrow
  tier only by matching that tier's rule.
- **FR-005**: On the docs tier CI MUST run the secret scan over the whole repository and the whole
  unit and component suite (`test:unit`), and MUST NOT run the lint, type-check, the worker tests,
  the build, the build tests, the end-to-end, accessibility, visual and budget tests, or the
  preview site check.
- **FR-006**: The docs tier MUST NOT depend on a list of which checks read files under `docs/`:
  running the whole unit and component suite covers every such check, including ones added later.
- **FR-008**: `verify` MUST report on every pull request and every push to `main`, on every tier:
  the workflow has no path filter or other workflow-level skip, and the `verify` job runs whatever
  the other jobs did. It MUST pass only when the change sorting succeeded with a recognised tier,
  every job and step the tier requires (FR-015) succeeded, and every job or step that did not run
  is one FR-015 lets that tier skip. Any failure, cancellation or other skip MUST fail it. In
  particular `verify` MUST fail when the change sorting job fails, is cancelled or is skipped, and
  when its tier result is missing, empty or not one of the four tiers.
- **FR-009**: A push to `main` MUST be sorted into a tier (skip-safe, docs, content-only or full)
  by the same rules as a pull request, from every file changed between the push's previous commit
  (`github.event.before`) and the pushed commit, compared as two trees so a multi-commit push or a
  merge commit counts every file that differs. CI MUST fetch enough history to compute that diff
  (the previous commit itself, fetched by id, beside the shallow checkout). The previous commit
  MUST be validated before it is used in any git command. If it is missing, all zeros, not
  exactly 40 lowercase hexadecimal characters, or cannot be fetched, or the fetch or the diff
  fails (including a failure caused by the shallow history), or the set of changed files is empty
  or cannot be worked out, the full gate MUST run, never a narrower tier.
- **FR-010**: Anything the change sorting cannot positively recognise, and any error while sorting,
  MUST run the full gate (fail closed). The errors covered are: the event is neither a pull
  request nor a push; git cannot fetch or diff; the changed files cannot be computed; and the
  sorting step crashes or writes no tier. Where the sorting step writes a tier, the outcome is the
  full tier; where it writes none (a crash), every job runs as on the full tier and `verify`
  fails (FR-008). An error MUST never make `verify` pass.
- **FR-011**: The existing skip-safe and content-only tiers MUST keep their current rules and the
  checks they run, apart from now also applying to pushes to `main` (FR-009) and content-only now
  also admitting documentation files (FR-004).
- **FR-012**: The change sorting MUST log which tier it chose, why (the first file that forced the
  full gate, or the count of files of each kind), and the changed files, one per line, as plain
  text that reads correctly without colour or layout, so a reader of the run can see why a job was
  skipped.
- **FR-013**: `docs/testing.md` MUST describe, in plain language with the tiers as a table: the
  docs tier, what counts as documentation, which checks run on each tier, that pushes to `main`
  are now sorted too, that runs on `main` are no longer cancelled by a later push, and the
  accepted risks listed under Assumptions. The sections to update are "Change tiers", the CI job
  table, the `verify` description, the residual-risk paragraph and the measurement method, and no
  statement that pushes to `main` always run the full gate may remain. `docs/setup.md` (the branch
  protection item that says pushes to `main` always run the full gate) MUST be updated the same
  way.
- **FR-014**: A CI run for a push to `main` MUST NOT be cancelled by a later push to `main`,
  whether it is running or still waiting to start. Each push to `main` MUST be in a concurrency
  group of its own, never shared with another push or with a pull request run. Pull request runs
  MUST keep cancelling an older run for the same pull request.
- **FR-015**: The jobs and steps per tier MUST be exactly these; nothing else may be skipped:

  | Check | skip-safe | docs | content-only | full (and unknown) |
  |---|---|---|---|---|
  | change sorting | run | run | run | run |
  | secret scan, whole repository (no condition) | run | run | run | run |
  | unit and component suite | skip | run | run | run |
  | lint, type-check, worker tests | skip | skip | run | run |
  | build tests (whole project) | skip | skip | skip | run |
  | build tests that read real content | skip | skip | run | skip |
  | end-to-end, accessibility, visual, budget, preview site check | skip | skip | run | run |
  | `verify` | run | run | run | run |

  Each skip MUST come from a condition that names the tier, so a check cannot be skipped for any
  other reason and still let `verify` pass, and an unset or unknown tier MUST run the heavier
  side. The secret scan covers the whole repository, including every file under `docs/`, on every
  tier, and a failing scan MUST fail `verify` on every tier.
- **FR-016**: A change to the workflow, the change-sorting or `verify` scripts, or the tests that
  pin them is never documentation, skip-safe or content, so it always runs the full gate. A pull
  request cannot weaken the gate while being sorted as documentation.
- **FR-017**: (Principle II) On the docs tier every check that can read a file under `docs/` MUST
  run. A check may be skipped on the docs tier only if it reads no file under `docs/`; the skipped
  set in FR-015 rests on the evidence under Assumptions. If a later change makes the build, the
  Worker, the lint, the type-check, or a worker, build or end-to-end test read a file under
  `docs/`, or renders one on the site, that change MUST, in the same pull request, narrow the
  documentation definition or make the docs tier run that check.
- **FR-018**: The change sorting MUST treat every input an outside party can influence as
  untrusted: changed file paths, branch names and `github.event.before`. `github.event.before`
  MUST reach the sorting script through an environment variable and MUST NOT be interpolated
  into a shell command line. Changed file paths are read from git's output and MUST NOT be passed
  to git or a shell as arguments.
- **FR-019**: No job MAY gain write permissions or a secret, and the existing test that checks job
  permissions stays in force. The push diff uses the workflow's existing read-only token
  (`contents: read`) through the existing checkout; no new token is added.
- **FR-020**: The slice MUST add no dependency, action or service. The only actions used are the
  ones the workflow already pins.

### Key Entities

- **Documentation file**: a `.md` file under `docs/`, at any depth. The only kind of file that
  can put a change in the docs tier.
- **Change tier**: skip-safe, docs, content-only or full, chosen per pull request or push from the
  changed files; decides which jobs and steps run and which skips `verify` accepts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pull request that changes only Markdown under `docs/` gets a passing `verify` in
  under 2 minutes, against roughly 6 minutes for the full gate today. The time is wall time from
  the first job of the run starting to `verify` completing; time spent waiting for GitHub to
  assign a first runner is excluded, because no tier controls it. Pick-up gaps between later jobs
  are included.
- **SC-002**: A docs-only merge to `main` gets a passing `verify` on `main` in under 2 minutes,
  measured the same way as SC-001.
- **SC-003**: 100% of changes that touch any file other than documentation, skip-safe or content
  files run the full gate, shown by sorting checks that cover each of these path kinds: a code
  file (`src/`), a workflow or tier-rule file, a non-Markdown file under `docs/`, a `.mdx`, `.MD`
  or `.markdown` file under `docs/`, Markdown outside `docs/` (`README.md`, `src/**/*.md`), the
  bare path `docs`, paths with `..`, a leading `/` or a backslash, documentation mixed with a
  code file, an empty or blank diff, a diff that cannot be computed, an unknown event, and each
  unusable `github.event.before` listed in FR-009.
- **SC-004**: A docs-only change that breaks a check reading that documentation fails `verify`
  every time.
- **SC-005**: Every push to `main` ends with a completed `verify` run of its own; none is
  cancelled by a later push, whether it was running or still waiting to start. Measured by three
  pushes to `main` in quick succession each showing a completed (not cancelled) `verify`, and
  checked in advance by the concurrency settings giving each push its own group (FR-014).

## Assumptions

- No part of the built site, the Worker or the end-to-end tests reads files under `docs/` at run
  time; code comments that mention `docs/` paths do not count. Checks that read `docs/` are unit
  checks, which run on the docs tier. Evidence: a search for `docs/` over `src/`, `worker/`,
  `scripts/`, `tests/e2e`, `tests/build` and `tests/worker` finds only comments and hint strings
  that name a guide as text (plan research R8). The same evidence supports "a docs-only change
  cannot change a page": nothing that builds or serves a page reads `docs/`.
- Files under `docs/` are contributor documentation (guides, runbooks, plans, design notes). They
  are not published on the site, so the site's accessibility rules do not apply to them; if one is
  ever rendered on the site, FR-017 takes it out of the docs tier in that same change.
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
  `verify` satisfies it as before, and it needs no change.

### Accepted risks and follow-up

- **Content-only merges lose the full-gate backstop on `main`.** Don chose (Clarifications) to
  sort pushes to `main` into every tier, so a merge of only content runs the content-only tier on
  `main` too, not the full gate. A content edit that collides with a fixture-build assertion is no
  longer caught by a full run on `main`; it shows on the next full-tier run instead.
  `docs/testing.md` says so plainly (FR-013), and Don accepts the trade-off by approving this
  major-change pull request.
- **No automatic way to notice a future non-unit check that reads `docs/`.** Don chose
  (Clarifications) no list of docs-reading checks and no drift guard. FR-017 makes it the
  responsibility of the change that adds such a reader to adjust the docs tier, and pull request
  review checks it; nothing in CI enforces it. A guard that fails when a build, worker or
  end-to-end test, or site code, reads `docs/` is possible follow-up work if this ever slips.
- **Runner queueing** can push a docs-tier run past 2 minutes; SC-001 and SC-002 exclude the
  wait for the first runner for that reason.

### Post-merge verification (follow-up)

This pull request edits the workflow, so its own run always sorts to the full tier (FR-016), and
a docs-only pull request or a push to `main` can only show the new tiers once it has merged.
These checks need neither the preview deployment nor Don's review before merge, so they do not
hold auto-merge; they are done after the merge and their results noted on issue #127
(quickstart.md, "On GitHub"):

1. A docs-only pull request (for example a cutover-plan edit) logs `tier=docs`, runs only the
   secret scan and the unit and component suite, skips `build-tests` and `e2e`, and passes
   `verify` in under 2 minutes (SC-001); the log shows tier, reason and one file per line
   (FR-012).
2. A pull request changing a `docs/` file and a `src/` file logs `tier=full` naming the `src/`
   file (User Story 1, scenario 4).
3. The `main` push run for a docs-only merge logs `tier=docs`, lists the files from `before` to
   the pushed commit, and passes `verify` in under 2 minutes (SC-002); a code merge runs the full
   gate.
4. Merges in quick succession each end with a completed, not cancelled, `verify` (SC-005).
5. `pnpm setup:check --item launch-main-checks` still reports complete after a docs-tier `main`
   run.

If any of these fails, the fix is its own reviewed change.
