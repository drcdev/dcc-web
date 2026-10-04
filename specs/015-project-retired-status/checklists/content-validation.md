# Content Validation and Build Errors Checklist: Retired status for projects

**Purpose**: Validate that the `status`/`replacedBy` content rules, the build-time failures RP01 to RP05 and the draft-replacement behaviour are complete, unambiguous and consistent across the spec and contracts (Constitution Principles I and VI). Reviewer (PR) use, standard depth.
**Created**: 2026-10-03
**Feature**: [spec.md](../spec.md), [contracts/build-errors.md](../contracts/build-errors.md), [contracts/project-file.md](../contracts/project-file.md)

## Field Forms

- [x] CHK001 Are the permitted forms of `replacedBy` enumerated exhaustively (project reference, name, name with https href) with a single rule for exactly-one-of? [Completeness, Spec §FR-006]
- [x] CHK002 Is "a reference to another project" defined by what it matches (file name without extension, case, draft files included)? [Clarity, contracts/project-file.md]
- [x] CHK003 Are the constraints on `name` (empty, whitespace-only, maximum length, markup or special characters) specified? [Gap, contracts/build-errors.md RP03]
- [x] CHK004 Is "https address" defined (scheme only, or also host required, credentials, length)? [Ambiguity, Spec §FR-006]
- [x] CHK005 Is the unknown-key rule for `replacedBy` stated in the spec as well as in the contract, or deliberately left to the contract only? [Consistency, Spec §FR-006, contracts/build-errors.md RP03]
- [x] CHK006 Does the spec say that `replacedBy` is optional on a retired project, and whether `replacedBy: {}` or null is invalid rather than treated as absent? [Edge Case, Gap]
- [x] CHK007 Is the new status value's spelling (`retired`) fixed, and are existing projects' status values confirmed unaffected? [Completeness, Spec §FR-001]

## Build Errors RP01 to RP05

- [x] CHK008 Does every failing case in FR-008 and the edge cases map to exactly one contract row (RP01 to RP05), with none unmapped? [Traceability, Spec §FR-008, contracts/build-errors.md]
- [x] CHK009 Is "a clear error that names the file" defined by required message content in each row, not only by intent? [Measurability, Spec §SC-003]
- [x] CHK010 Are RP01 and RP02 message texts consistent with the existing "Project file <path>: <problem>" and Astro schema-error conventions? [Consistency, contracts/build-errors.md]
- [x] CHK011 Is it specified which error is reported when one file breaks two rules (for example a replacement on a non-retired project that also names itself)? [Edge Case, Gap]
- [x] CHK012 Is the changed unknown-status row S02 required to list all four allowed values, and is it clear that it replaces the earlier S02 wording? [Clarity, contracts/build-errors.md]
- [x] CHK013 Is the stage at which each check runs (schema validation versus the story route's static path generation) stated, so a failure cannot be skipped in a build that renders no story pages? [Assumption, contracts/build-errors.md]
- [x] CHK014 Are cyclic replacements (A replaced by B, B replaced by A) and chains of retired replacements addressed as allowed or invalid? [Gap, Edge Case]
- [x] CHK015 Is a replacement project that is itself retired addressed (allowed, warned or rejected)? [Gap, Edge Case]

## Draft Replacement and Production

- [x] CHK016 Is the production-build rule for a draft replacement stated identically in FR-007, the edge cases and the contract's "Not an error" list? [Consistency, Spec §FR-007]
- [x] CHK017 Is "a build that includes drafts" defined by a named condition, so the link-versus-plain-text choice is unambiguous? [Clarity, Spec §FR-007]
- [x] CHK018 Is it specified that the draft replacement's title (not its id) is used for the plain-text name? [Completeness, Spec §FR-007]
- [x] CHK019 Is it required that a draft replacement leaks nothing else (slug, problem text) into a production page or its metadata? [Gap, Constitution §VI]
- [x] CHK020 Is the case of a retired draft whose replacement is also a draft, in both build modes, covered? [Coverage, Spec Edge Cases]

## Template, Tempo and Test Placement

- [x] CHK021 Is the content of the template documentation required to include each form of `replacedBy` and the status value, so FR-011 can be judged complete? [Measurability, Spec §FR-011]
- [x] CHK022 Is Tempo's exact target content (status, off-site name without href) fixed so FR-009 and the note's text in User Story 3 agree? [Consistency, Spec §FR-009]
- [x] CHK023 Is the single primary test layer for each RP row named, with a written reason for any second layer, as Principle I and `docs/testing.md` require? [Traceability, Constitution Development Workflow]
- [x] CHK024 Is fixture coverage for the replacement cases (on-site, off-site with address, name only, none, draft target) specified as a complete set, with the impact on the visual project predicted? [Completeness, Spec Assumptions]
