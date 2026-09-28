# Setup-Check Requirements Quality Checklist: Setup Walkthrough and Setup Check

**Purpose**: Validate that the requirements defining each setup item's status states, next actions, the walkthrough's pause/confirm behaviour, and documentation/drift coverage are complete, unambiguous, consistent and testable before implementation.
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the requirements in spec.md (and, where cited, plan.md/data-model.md) — it does not test the setup check's code or output. Items are unchecked; evaluation happens in a separate pass.

## Requirement Completeness

- [ ] CHK001 - Does every one of the 18 setup items (FR-013–FR-022) state a precise, objective pass condition for "complete", rather than a general description of the item? [Completeness, Spec §FR-013–FR-022]
- [ ] CHK002 - Are criteria for "could-not-check" specified per setup item (which items can legitimately be unreachable), or only stated once as a general principle (Acceptance Scenario 4) without enumerating which of the 18 items it applies to? [Gap, Spec §User Story 1 Scenario 4]
- [ ] CHK003 - Is it specified whether the walkthrough's initial "full list of steps in order" (Acceptance Scenario 1) shows titles only or full what/where/how detail, so the two levels of detail aren't conflated? [Gap, Spec §User Story 2 Scenario 1]
- [ ] CHK004 - Does the spec require a numbering/ID scheme for setup items and walkthrough steps that FR-002, FR-008 and Story 3 all reference consistently, or is cross-referencing ("matching walkthrough and documentation step") left implicit? [Gap, Traceability]

## Requirement Clarity

- [ ] CHK005 - Is the boundary between "missing" and "pending" defined generically enough to apply to every setup item, or only illustrated for the DNS-nameserver case (Edge Cases "Nameserver change in progress")? [Ambiguity, Spec §Edge Cases]
- [ ] CHK006 - Does FR-002 define a minimum required content for "next action" (e.g., must name both what to do and where), or is "what to do" left free-form per item? [Clarity, Spec §FR-002]
- [ ] CHK007 - Is it specified whether "next action" text must be static/pre-written per item, or may vary with the specific failure detail (e.g., "which ruleset rule is missing", Edge Cases "Partially configured branch protection")? [Ambiguity, Spec §Edge Cases]
- [ ] CHK008 - Does Edge Cases "Partially configured branch protection" specify a closed list of rule names the check must be able to name individually, or leave "exactly which rule is missing" as open-ended prose? [Clarity, Spec §Edge Cases]
- [ ] CHK009 - Does the spec define precisely what "pause" requires of the walkthrough (FR-009) — must output halt entirely pending Don's response, or may later steps be prepared speculatively? [Ambiguity, Spec §FR-009]

## Requirement Consistency

- [ ] CHK010 - Is FR-010 ("same confirmation logic" for walkthrough and check) testable as written — does the spec define how "sameness" will be verified (shared implementation vs. only equivalent behaviour), consistent with FR-001–FR-003? [Measurability, Spec §FR-010]
- [ ] CHK011 - Are SC-003 ("100% of setup items ... documented step and walkthrough step") and FR-023 (documentation audit) consistent on how that 100% coverage is verified — automated drift test vs. manual review only? [Consistency, Spec §SC-003, FR-023]
- [ ] CHK012 - Does Edge Cases "Sole maintainer approval" leave ambiguous which of "the check or the walkthrough" is responsible for explaining that Don's own-account approval won't count, risking the behaviour being implemented in neither or both inconsistently? [Ambiguity, Spec §Edge Cases "Sole maintainer approval"]

## Acceptance Criteria Quality

- [ ] CHK013 - Is SC-001 ("under 90 minutes, excluding time waiting for DNS changes to take effect") measurable as written — is "excluding time waiting" defined precisely enough (e.g., clock-time minus a named pending interval) to be verified in a single test run? [Measurability, Spec §SC-001]
- [ ] CHK014 - Is SC-002 ("under 30 seconds") specific about which run conditions count (cold vs. warm, network-dependent items included or not), so the measurement is repeatable? [Clarity, Spec §SC-002]
- [ ] CHK015 - Does the spec define a retry or escalation requirement for User Story 2 Scenario 3 (Don says "done" but confirmation fails) beyond the first failure — e.g., behaviour after repeated failures? [Gap, Spec §User Story 2 Scenario 3]

## Scenario Coverage

- [ ] CHK016 - Is the walkthrough's resumability requirement (FR-011, "starts at the first incomplete one") specific about how "first incomplete" is determined when items have dependencies (`dependsOn` in the design), including out-of-order completion? [Gap, Spec §FR-011]
- [ ] CHK017 - Does the spec define required behaviour if the walkthrough reaches a step whose dependency item is not yet complete (attempted out of the documented safe order)? [Gap, Coverage]
- [ ] CHK018 - Is CI-vs-local skip behaviour (Edge Cases "Check run in CI versus locally") measurable — does the spec define, even generically, which category of items is expected to be skippable in CI, or only that the check "must say which items it skipped and why"? [Gap, Spec §Edge Cases]

## Edge Case Coverage

- [ ] CHK019 - Is the secret-name drift requirement (Edge Cases "Secret names drift") paired with a defined pass/fail consequence — does drift block CI/the verify gate, or only produce a warning? [Ambiguity, Spec §Edge Cases "Secret names drift"]
- [ ] CHK020 - Does the spec state whether documentation drift (a check item with no matching doc section, or vice versa) is enforced automatically as part of the verify gate, or only verified manually via Story 3's "Independent Test"? [Gap, Spec §FR-023, User Story 3]
- [ ] CHK021 - Is the relationship between an incomplete setup item and constitution-defined "major change" PR labelling addressed, or are the two requirement sets (setup-item status and major-change gating) fully independent with no cross-reference needed? [Ambiguity, Cross-cutting]

## Dependencies & Assumptions

- [ ] CHK022 - Is the assumption that "'major' is identified when a PR carries a 'major' label or touches paths that are major by definition" validated against the setup check's own requirements — e.g., must the check confirm the label and required-path rules exist, and is that traced to a specific FR? [Assumption, Spec §Assumptions "Marking a change as major", FR-014]

## Notes

- Generated non-interactively (auto mode); no user interview was conducted. Scope was inferred from the caller's brief: unambiguous status/next-action definitions per setup item, walkthrough pause/confirm behaviour, and documentation/drift coverage.
- Depth: standard, covering all 18 setup items collectively (FR-013–FR-022) rather than one checklist row per item, since the underlying ambiguity (status definitions, next-action content) repeats across items rather than being item-specific.
- Audience/timing: spec/plan authors and reviewer, before `/speckit-tasks`, since several gaps here (CHK002, CHK005, CHK009, CHK016) affect how the setup-item registry and walkthrough control flow should be designed.
- Open risk: "next action" content rules (CHK006, CHK007) and the missing/pending boundary (CHK005) are the most consequential gaps — they affect all 18 items uniformly, so resolving them once (in plan.md or via `/speckit-clarify`) is cheaper than discovering the ambiguity per item during implementation.
