# Release Gate Safety Checklist: Docs-only verify gate

**Purpose**: Validate that the requirements for the docs tier, push sorting and `verify` are complete, unambiguous and fail closed. Depth: formal, for PR review of a major change (CI configuration).
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

## Fail-closed classification

- [x] CHK001 Is "positively recognise" defined so every path not matching a tier rule maps to the full gate, with no implicit default to a narrower tier? [Clarity, Spec §FR-010]
- [x] CHK002 Are the tier order and first-match rule specified for every combination of skip-safe, docs, content and other files? [Completeness, Spec §FR-004]
- [x] CHK003 Is the definition of a documentation file exact about case (`.MD`), `.mdx`, nested depth, and a `docs` path with no trailing segment? [Clarity, Spec §FR-001]
- [x] CHK004 Are unusual-path rules (`..`, leading `/`, backslash) stated as applying to every tier test, not only the docs test? [Consistency, Spec §FR-002]
- [x] CHK005 Are rename and move requirements defined (both sides of the rename counted as changed paths), including a rename out of `docs/` of a non-doc file? [Coverage, Spec Edge Cases]
- [x] CHK006 Is the behaviour for an unknown event type (neither pull request nor push) specified? [Gap, Plan Tests §1]
- [x] CHK007 Is "error while sorting" enumerated (git failure, script crash, missing output) with the required outcome for each? [Completeness, Spec §FR-010]
- [x] CHK008 Is it stated that a sorting error can never produce a passing `verify`, including when the `changes` job itself fails or is cancelled? [Clarity, Spec §FR-008, §FR-010]

## verify job semantics

- [x] CHK009 Is "unexpected skip" defined precisely: which jobs may be skipped on which tier, and that any other skip fails `verify`? [Ambiguity, Spec §FR-008]
- [x] CHK010 Are the required statuses of `changes`, `static`, `build-tests` and `e2e` tabulated per tier, with no tier left unspecified? [Completeness, Spec §FR-008, contracts/ci-tiers.md]
- [x] CHK011 Is the required handling of an unknown, empty or missing `tier` output stated, and is the removal of the old `full` / `content_only` outputs covered? [Coverage, Plan Design]
- [x] CHK012 Do the spec and the plan agree on which skips are accepted on skip-safe versus docs, with no tier allowing a skipped job the other forbids without a reason? [Consistency, Spec §FR-005, Plan Design]
- [x] CHK013 Is the requirement that `verify` reports on every pull request and push (no path filters, no workflow-level skip) measurable as written? [Measurability, Spec §FR-008]
- [x] CHK014 Is the step-level skipping (lint, type-check, worker tests) tied to the tier by an exact condition, so a step cannot be skipped for another reason and still pass? [Gap, Spec §FR-008, Plan Design]

## Push to main diffs

- [x] CHK015 Are the conditions for a usable `github.event.before` listed completely (missing, all zeros, wrong length, non-hex, unfetchable)? [Completeness, Spec §FR-009]
- [x] CHK016 Is the diff base for multi-commit pushes and merge commits specified unambiguously (all files between `before` and the pushed commit)? [Clarity, Spec §FR-009, Edge Cases]
- [x] CHK017 Are force-push and non-fast-forward cases on `main` addressed, given the ruleset forbids them? [Assumption, Gap]
- [x] CHK018 Is the history depth to fetch stated, and is a shallow-clone failure required to run the full gate rather than a narrow one? [Clarity, Spec §FR-009]
- [x] CHK019 Is the empty-diff outcome identical for pull requests and pushes? [Consistency, Spec §FR-009, Edge Cases]
- [x] CHK020 Does the spec accept and document the lost full-gate backstop for content-only merges on `main`, and say who reviews that trade-off? [Assumption, Plan Risks, Spec §FR-011]
- [x] CHK021 Is the claim that the tree landing on `main` was already checked on its PR backed by the ruleset's up-to-date requirement, and is the case where that does not hold (admin merge, ruleset drift) addressed? [Assumption, Spec Context]

## Concurrency

- [x] CHK022 Are concurrency group keys specified so a `main` push and a pull request run never share a group? [Clarity, Spec §FR-014]
- [x] CHK023 Is "cancel in progress" defined separately for pull requests and `main`, including the queued (not yet started) run on `main` when a third push arrives? [Gap, Spec §FR-014]
- [x] CHK024 Is SC-005 ("none cancelled") measurable given GitHub may replace a pending run in the same group? [Measurability, Spec §SC-005]

## Success criteria and scope

- [x] CHK025 Is the "under 2 minutes" target defined as CI time versus wall time, with queueing excluded or included? [Ambiguity, Spec §SC-001, §SC-002]
- [x] CHK026 Is SC-003 ("100%") tied to a concrete enumerated set of path kinds that the sorting checks must cover? [Measurability, Spec §SC-003]
- [x] CHK027 Is the claim that skipped checks cannot observe `docs/` supported by a stated evidence method, and is the process for noticing a future check that reads `docs/` outside the unit project defined? [Assumption, Spec Assumptions]
- [x] CHK028 Are requirements stated for what happens when the workflow file or tier rules change (full gate), and is that self-referential case covered as a requirement? [Coverage, Spec Edge Cases]
- [x] CHK029 Is the logging requirement specific about content (tier, reason, changed files) and about its use when diagnosing a skip? [Clarity, Spec §FR-012]
- [x] CHK030 Is the documentation update (`docs/testing.md`, `docs/setup.md`) scoped to named sections so stale "pushes always run full" statements cannot remain? [Completeness, Spec §FR-013, Plan Docs]
- [x] CHK031 Does the `launch-main-checks` dependency on the newest `verify` on `main` hold when that run is docs-tier, and is that stated as a requirement? [Dependency, Spec Assumptions]
- [x] CHK032 Is the Principle II reconciliation ("checks are never skipped") written as a testable rule rather than only an argument? [Consistency, Spec Context]
