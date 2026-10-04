# Performance and Visual Parity Requirements Quality Checklist: Self-hosted Inter web fonts

**Purpose**: Validate that the budget, layout shift, font loading, caching, Docker-to-CI parity and baseline requirements are complete, clear and measurable.
**Created**: 2026-10-03
**Feature**: [spec.md](../spec.md)

## Budget

- [x] CHK001 - Is the 150 KB (153,600 bytes) limit stated with one definition of "total transfer" and the same measurement conditions everywhere it appears? [Consistency, Spec §FR-007, §D3, §SC-004]
- [x] CHK002 - Is the superseded 100 KB figure in feature 002 (SC-004, FR-003) explicitly reconciled so no two budgets conflict? [Conflict, Spec §Background]
- [x] CHK003 - Are the unchanged LCP, CLS, long-task and JavaScript limits each listed with their numeric value and conditions? [Completeness, Spec §FR-007]
- [x] CHK004 - Is the stop-and-report rule for a page that still exceeds the budget unambiguous about who is told and what halts? [Clarity, Spec §Edge Cases]
- [x] CHK005 - Is the headroom claim (121,654 of 153,600 bytes on the heaviest page) tied to a stated measurement method that can be repeated? [Measurability, Spec §SC-004]
- [x] CHK006 - Is the byte cost of each of the four faces specified or bounded? [Gap, Spec §FR-002]
- [x] CHK007 - Is it clear whether the budget is raised permanently or revisited after the card-image follow-up? [Ambiguity, Spec §Follow-up work]

## Layout Shift and Font Loading

- [x] CHK008 - Is the fallback swap behaviour (display strategy) specified precisely enough to be implemented one way only? [Clarity, Spec §FR-005, §FR-006]
- [x] CHK009 - Is the requirement for metric-adjusted fallbacks measurable beyond the CLS budget, for example a per-page shift threshold? [Measurability, Spec §FR-006]
- [x] CHK010 - Are requirements defined for visitors who lack the system fonts the adjusted fallbacks derive from? [Edge Case, Spec §FR-005]
- [x] CHK011 - Is the permitted reordering of the fallback stack bounded so the families offered stay identical to today's? [Clarity, Spec §FR-005]
- [x] CHK012 - Are preload requirements for the faces stated, including which faces and why, given their effect on LCP and bytes? [Gap]
- [x] CHK013 - Is the number of font requests per page specified when a page uses only some of the four faces? [Gap, Spec §Assumptions]
- [x] CHK014 - Is the behaviour when a font file fails to load or is blocked defined for each face separately? [Coverage, Spec §Edge Cases]

## Caching

- [x] CHK015 - Is the cache requirement's scope (four Inter files only) consistent between FR-015, the Edge Cases and SC-009? [Consistency]
- [x] CHK016 - Is the fingerprinted-filename requirement defined well enough to know what happens to the old URL when a face changes? [Gap, Spec §FR-015]
- [x] CHK017 - Is "downloads zero font bytes on a second view" defined for a cold versus warm browser cache and for reloads? [Ambiguity, Spec §SC-009]
- [x] CHK018 - Is it stated how the cache rule is matched to the hashed filenames so it cannot silently miss them after a rename? [Gap, Spec §FR-015]

## Visual Parity and Baselines

- [x] CHK019 - Is the "first run" pass criterion for Docker-generated Linux baselines defined against a named threshold and subject list? [Measurability, Spec §SC-001]
- [x] CHK020 - Are the escalation steps when Docker still differs from CI ordered and bounded before work stops? [Clarity, Spec §FR-011]
- [x] CHK021 - Is the prohibition on landing CI-artifact baselines consistent with the CLAUDE.md fallback guidance? [Conflict, Spec §FR-011]
- [x] CHK022 - Is the count of 132 baselines (66 per platform) tied to a source so it stays correct if subjects change? [Assumption, Spec §FR-011, §SC-006]
- [x] CHK023 - Is "no other visual diff appears" defined so unrelated pixel changes can be told apart from font-caused ones? [Ambiguity, Spec §SC-006]
- [x] CHK024 - Is the requirement that macOS and Linux both pass stated with how each platform's baselines are produced? [Completeness, Spec §User Story 3]
- [x] CHK025 - Are the uncovered-character guard's subject scope and explicit-exclusion mechanism defined precisely? [Clarity, Spec §FR-016]
- [x] CHK026 - Is the character set in FR-002 consistent with the characters the visual subjects actually draw? [Consistency, Spec §FR-002, §FR-016]
- [x] CHK027 - Is the requirement that Inter text uses real italic and bold faces expressed in a form that can be observed in rendering, not just in CSS? [Measurability, Spec §SC-002]
- [x] CHK028 - Are rendering flags or Docker image font differences named as in-scope causes to investigate? [Coverage, Spec §FR-011]
