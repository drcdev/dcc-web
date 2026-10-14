# Content and Build Validation Checklist: Interactive career timeline

**Purpose**: Validate that the content, schema and build-failure requirements are complete, unambiguous and consistent with the launch content table
**Created**: 2026-10-14
**Feature**: [spec.md](../spec.md)

**Note**: Each item tests the quality of the written requirements, not the implementation.

## Schema completeness

- [ ] CHK001 Are all required and optional fields of a step listed with types and length limits ("short piece of plain text" quantified)? [Ambiguity, Spec §FR-003]
- [ ] CHK002 Is the period format defined (date precision, month and year, how "present" is represented, how a start after an end is treated)? [Gap, Spec §FR-002]
- [ ] CHK003 Is "plain text" defined for detail parts (are Markdown, links or line breaks allowed or rejected)? [Clarity, Spec §FR-003]
- [ ] CHK004 Is the shape of a categorized item defined (text, one category, whether an item may have more than one category)? [Gap, Spec §FR-004, Key Entities]
- [ ] CHK005 Is the relationship between the Awards category and the separate awards list defined, so one award is not entered twice or counted twice? [Ambiguity, Spec §Key Entities, §FR-009]
- [ ] CHK006 Is the shape of an award link defined (internal, external, allowed schemes), and is the treatment of external links stated? [Gap, Spec §FR-004, Assumptions]
- [ ] CHK007 Is the rule for ordering two steps with the same start date defined? [Edge Case, Gap, Spec §FR-001]
- [ ] CHK008 Is the file naming and identity rule for a step (slug, uniqueness) specified? [Gap, Spec §FR-005]

## Build failures

- [ ] CHK009 Is each build-failure condition listed with the exact information the error must carry (step file, field, offending value)? [Completeness, Spec §FR-005, §SC-006]
- [ ] CHK010 Is "names the step" defined as the file name, the role title, or both, consistently across stories and edge cases? [Consistency, Spec §US2-4, §Edge Cases]
- [ ] CHK011 Are all rejected cases enumerated: missing scope, unknown category, missing post, draft post, next-move part on the current role, bad period? [Coverage, Spec §FR-005, §Edge Cases]
- [ ] CHK012 Is "the current role" defined objectively (the step with no end date, the last step, or both) so the next-move rule has one trigger? [Ambiguity, Spec §FR-003, §Edge Cases]
- [ ] CHK013 Is behaviour specified when two steps have no end date, or when the last step by start date has an end date? [Edge Case, Gap]
- [ ] CHK014 Is behaviour specified for an empty collection or a step file that fails to parse (must fail, not render an empty timeline)? [Edge Case, Gap, Spec §FR-005]
- [ ] CHK015 Is behaviour specified for a post that becomes a draft or is renamed after a step references it? [Edge Case, Gap, Spec §US2-4]
- [ ] CHK016 Is the unused-category rule ("not offered") stated as a derived output of content, with the all-unused case defined? [Edge Case, Spec §US3-7, §FR-009]
- [ ] CHK017 Are unknown or extra fields in a step file required to be rejected or ignored? [Gap, Spec §FR-005]

## Launch content fidelity

- [ ] CHK018 Is every launch fact in the FR-006a tables traceable to Don's CV or interview, with nothing outside them allowed? [Traceability, Spec §FR-006, §FR-006a]
- [ ] CHK019 Do the six periods in FR-006a agree with the Clarifications (Cloud Architect ended May 2026; Director from Jun 2026)? [Consistency, Spec §FR-006a, §Clarifications]
- [ ] CHK020 Is the current-role scope in FR-006a identical to the About page sentence it quotes, and is the single source of that sentence defined? [Consistency, Spec §Clarifications]
- [ ] CHK021 Do the first-page "Related posts" titles match the real published post titles, and is the source of truth for the match stated? [Assumption, Spec §FR-006a]
- [ ] CHK022 Is it specified which of step 4's two awards link to which About page article, so the links are not swapped? [Clarity, Spec §FR-006a]
- [ ] CHK023 Is the empty-state rule for step 6 (no items, no key decision, scope only) stated so it is a valid step? [Edge Case, Spec §FR-006a, §FR-008]
- [ ] CHK024 Are number-bearing claims (70+, 40%, 36,000, 102, 62%) flagged as Don-verified, so they cannot drift in later edits? [Assumption, Spec §FR-006a]

## Page and copy constraints

- [ ] CHK025 Is the removal of the "Leadership" line from "About me" specified with what replaces its content and what happens to other references to it? [Completeness, Spec §FR-016]
- [ ] CHK026 Is "Recognition stays as it is" defined precisely enough that its awards and the step awards cannot diverge in wording? [Ambiguity, Spec §FR-016]
- [ ] CHK027 Is the job-title rule scoped to say whether the career step file counts as "the About page" for FR-019? [Conflict, Spec §FR-019]
- [ ] CHK028 Is "plain language" (FR-020) tied to the project's voice guide so labels and messages can be judged objectively? [Measurability, Spec §FR-020]
- [ ] CHK029 Are requirements stated for how Don adds a reflection part later (file edit only, no code change, build proves it)? [Completeness, Spec §Clarifications]
- [ ] CHK030 Is it stated that the item order within a list is the file order, and that this is stable? [Gap, Spec §FR-008]
- [ ] CHK031 Are requirements for search indexing, feed and sitemap impact of the new content stated, or explicitly out of scope? [Gap]
