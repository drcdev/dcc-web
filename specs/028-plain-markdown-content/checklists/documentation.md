# Documentation Checklist: Plain Markdown for standard content

**Purpose**: Unit tests for the requirements on the page and post authoring guides and any other text that names the removed sections
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

**Depth**: Standard. **Audience**: PR reviewer (Don). Requirements quality only.

## Completeness

- [x] CHK001 Is every document that names `TextBlock`, `Offerings` or `Offering` identified, not only the page and post guides? [Completeness, Spec §FR-008, FR-009]
- [x] CHK002 Is it specified where the rule is stated, and that it is stated in one place only? [Clarity, Spec §SC-004]
- [x] CHK003 Does the spec require the guide to list the eight remaining components by name, with the props each takes? [Completeness, Spec §FR-003, FR-008]
- [x] CHK004 Are the two Markdown replacements (titled passage, list of items) specified with the heading levels to use and when to choose `###` over `##`? [Clarity, Spec §FR-008]
- [x] CHK005 Is guidance required for how an item that should link somewhere is written in Markdown? [Gap, Spec §Edge Cases]
- [x] CHK006 Is guidance required for how an author finds a heading's address (the rule for how the address is formed, including duplicates)? [Gap, Spec §Edge Cases]
- [x] CHK007 Is the project story guide's position on the rule (applies through the guide, not a new check) required to appear in a guide? [Gap, Spec §Edge Cases]
- [x] CHK008 Are other agent-facing instructions (skill files, `CLAUDE.md`, shared pipeline wording) covered or explicitly excluded from the update scope? [Gap, Scope]

## Clarity and Consistency

- [x] CHK009 Is "everything Markdown can express" bounded by an explicit list that matches FR-007 (headings, paragraphs, lists, tables, quotes, links, emphasis)? [Clarity, Spec §US2, FR-007]
- [x] CHK010 Do the guides' component list and the error message's component list come from requirements that agree on names and order? [Consistency, Spec §Edge Cases]
- [x] CHK011 Is the wording rule (plain language, no hype or filler) applied to the new guide text as a requirement? [Traceability, Constitution §Development Workflow]
- [x] CHK012 Is the required guide example for each remaining component consistent with how the build accepts it? [Consistency, Spec §US3 Scenario 4]

## Measurability and Traceability

- [x] CHK013 Can SC-004 ("exactly the eight remaining components") be checked objectively, including examples inside code blocks? [Measurability, Spec §SC-004]
- [x] CHK014 Does each guide acceptance scenario in US2 map to a numbered requirement? [Traceability, Spec §US2]
- [x] CHK015 Is it stated whether guide examples that contain removed tags in code (to show what not to write) are allowed or forbidden? [Ambiguity, Spec §US2 Scenario 2]

## Edge Cases and Dependencies

- [x] CHK016 Is the status of earlier specs under `specs/` that describe the removed sections stated as history, and is that stated where reviewers will see it? [Assumption, Spec §Assumptions]
- [x] CHK017 Is the PR description requirement (one-line not-major classification) recorded in the spec or plan so it is not lost? [Gap, Plan §Major-change classification]
