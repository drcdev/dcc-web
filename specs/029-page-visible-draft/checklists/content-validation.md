# Content Model and Build Validation Checklist: Page visibility and draft flags

**Purpose**: Unit tests for the requirements on the page content model (`visible`, `draft`, `nav.location`/`position`/`label`, landing files) and build-time errors
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md), [contracts/page-settings.md](../contracts/page-settings.md)

## Settings and Defaults

- [x] CHK001 Are the defaults for `visible` and `draft` stated once and consistently across the spec, data model and contract? [Consistency, Spec §FR-001]
- [x] CHK002 Is the meaning of "not true or false" defined for edge inputs (quoted strings, null, empty value, numbers)? [Clarity, Spec §Edge Cases]
- [x] CHK003 Is the allowed range of `position` specified (whole number from 1, no zero, negative, fractional or very large values)? [Clarity, Contract §Page file]
- [x] CHK004 Is the empty-`nav` case (`nav:` with no keys) covered by a named error or an explicit rule? [Gap, Contract §V3]
- [x] CHK005 Is the `label` rule (label if given, else title) defined for an empty or whitespace-only label? [Edge Case, Gap]
- [x] CHK006 Is the precedence when a page sets `visible: false` and `draft: true` stated for every build type, not only production? [Completeness, Spec §US2-4]
- [x] CHK007 Is "header is the default" in the original request reconciled with the clarified "no location means no menu" in every place that mentions it? [Conflict, Spec §Clarifications]

## Build Errors

- [x] CHK008 Does every error scenario in Edge Cases and FR-010 map to exactly one numbered row V1 to V10 (no orphan, no duplicate)? [Traceability, Contract §Build errors] (the contract now runs to V12: V11 duplicate link text and V12 landing file in the footer were added; Edge Cases cite each row)
- [x] CHK009 Is "plain-language error naming the file" made measurable (required parts: file path, offending key, what to do)? [Measurability, Spec §FR-010]
- [x] CHK010 Is the error for two pages sharing a menu position required to name both files, the menu and the position, and is the order of the names defined? [Clarity, Spec §FR-009]
- [x] CHK011 Is the behaviour defined when more than two pages clash on one position? [Edge Case, Gap]
- [x] CHK012 Is the not-visible home page error required on every build, and is it also required when the home page is merely a draft? [Clarity, Spec §FR-010]
- [x] CHK013 Is the order of precedence defined when one file has several mistakes (all reported, or first only)? [Gap]
- [x] CHK014 Are errors that fire in the schema versus in `generateId` versus the menu build distinguished in a way the writer can rely on (same wording style, same fail-fast behaviour)? [Consistency, Contract §Detected by]

## Landing Page Files

- [x] CHK015 Is "title and navigation settings only" defined precisely, including whether `nav.label` is allowed and whether unknown nav keys fail? [Clarity, Spec §FR-008]
- [x] CHK016 Are the reserved names of the two landing files and their relationship to the catch-all page route unambiguous, including the amendment to row 14 of the older contract? [Consistency, Contract §Build errors]
- [x] CHK017 Is a landing file placed in the footer (`location: footer`) allowed or prohibited? [Gap]
- [x] CHK018 Is the title of a landing file required to match the heading kept in code, or are the two allowed to differ? [Ambiguity, Spec §FR-008]

## Preview Versus Production

- [x] CHK019 Is the definition of "production build" (versus preview, local dev, CI and test servers) written in the spec itself, not only in the contract? [Completeness, Spec §Assumptions]
- [x] CHK020 Is the rule for detecting a production build stated as a requirement, with a defined result when the signal is missing or ambiguous? [Gap]
- [x] CHK021 Are image-exclusion requirements for not-visible pages measurable (which output folder, which images, shared images used by a visible page)? [Measurability, Spec §FR-002]
- [x] CHK022 Is "same as before" for today's content defined by a comparable artefact (header, footer, sitemap, notices) and a baseline source? [Measurability, Spec §FR-011]

## Scope and Dependencies

- [x] CHK023 Are posts and project stories explicitly unaffected, including their use of any shared draft or visibility helper? [Scope, Spec §FR-012]
- [x] CHK024 Are content files outside the repository's pages collection (for example the Tempo privacy page and its redirects) addressed by the settings rules? [Coverage, Spec §US4]
- [x] CHK025 Is the requirement that the old fixed lists are removed testable (what counts as removed, and where)? [Measurability, Spec §FR-005]
