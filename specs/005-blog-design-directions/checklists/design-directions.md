# Design Directions Checklist: Design directions for the blog

**Purpose**: Validate that the requirements for the three directions, their decision document and prototype lifecycle are complete, clear and consistent
**Created**: 2026-09-29
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

## Distinct Directions

- [x] CHK001 Is "differ in structure, not only styling" defined with criteria (grouping, ordering, featuring, layout, topic presentation) that can be objectively judged? [Measurability, Spec §FR-003]
- [x] CHK002 Is the required number of directions stated consistently as exactly three across the spec, clarifications and success criteria? [Consistency, Spec §FR-001, §SC-001]
- [x] CHK003 Is there a defined way to record how each direction differs on each structural axis, so overlap can be detected? [Gap, Spec §FR-003]
- [x] CHK004 Is the constraint to use only the site's look and Flux patterns, with no outside references, stated unambiguously? [Clarity, Spec §FR-001]

## Screen and Variant Coverage

- [x] CHK005 Are landing, listing (all posts), listing (single topic) and post page each required for every direction? [Completeness, Spec §FR-002]
- [x] CHK006 Is every combination of two themes and two widths required for every screen, with the widths defined? [Completeness, Spec §FR-014, §SC-001]
- [x] CHK007 Are the featured-post requirements defined for the case where no post is featured? [Coverage, Spec §Edge Cases]
- [x] CHK008 Are edge-case presentations (no image, long title, many topics, single-post topic, first and last page) each required per direction? [Coverage, Spec §Edge Cases]
- [x] CHK009 Is the sample-post set required to cover all four starting topics, with a minimum count or distribution? [Clarity, Spec §FR-004]
- [x] CHK010 Is "realistic" sample writing defined well enough to be judged? [Ambiguity, Spec §US1 AC4]
- [x] CHK011 Is the block of "reader needs" (FR-006 to FR-012) traceable to each screen of each direction? [Traceability, Spec §SC-002]

## Addresses and Topics

- [x] CHK012 Is the requirement that a post address excludes topics stated in a testable way for every direction? [Measurability, Spec §FR-012]
- [x] CHK013 Are proposed addresses required for posts, topic pages, and listing pages including pagination, per direction? [Completeness, Spec §FR-012]
- [x] CHK014 Is the requirement to show that renaming, merging or splitting topics leaves post addresses unchanged specific about what evidence is expected? [Clarity, Spec §US4 AC3]
- [x] CHK015 Is topic presentation documented per direction, including how a reader moves between topics and back to all posts? [Completeness, Spec §FR-008, §FR-019]
- [x] CHK016 Is the topic introduction length ("one or two sentences") and its position required for each direction? [Clarity, Spec §FR-008]
- [x] CHK017 Is the relationship between prototype addresses and the reserved /writing/ address clear, including that redirects are excluded? [Clarity, Spec §Assumptions]

## Look and Palette

- [x] CHK018 Is "existing colours and typography" tied to a named source so a new colour or font can be recognised? [Clarity, Spec §FR-013]
- [x] CHK019 Is the explicit call-out required for any new colour or font placed in a defined location in the decision document? [Completeness, Spec §FR-013, §US3 AC5]
- [x] CHK020 Is the blog name "Drift & Convergence" required on every screen, and are the retired categories excluded? [Consistency, Spec §FR-022, §Context]

## Decision Document

- [x] CHK021 Are all required parts per direction (summary, preview links, both-theme pictures, topic presentation, addresses, trade-offs) enumerated once and consistently in FR-019 and US4? [Consistency, Spec §FR-019, §US4 AC1]
- [x] CHK022 Are trade-off dimensions defined (e.g. effort, reorganizing topics, maintenance, reader effect) so trade-offs are comparable across directions? [Gap, Spec §FR-019]
- [x] CHK023 Is the Decision section required to contain a chosen-direction line and a notes area, both left empty? [Completeness, Spec §FR-020, §SC-005]
- [x] CHK024 Is "enough pictures to compare after removal" quantified by screens, themes and widths? [Ambiguity, Spec §FR-021]
- [x] CHK025 Is the treatment of preview links in the merged document defined, given they will not resolve after removal? [Gap, Spec §US4 AC4]
- [x] CHK026 Is "Don can choose from the document and preview alone" given an observable confirmation step? [Measurability, Spec §SC-007]

## Prototype Lifecycle

- [x] CHK027 Is the requirement that prototypes are hidden from navigation, sitemap and indexing specific about mechanisms and scope (all prototype pages, including generated ones)? [Clarity, Spec §FR-017]
- [x] CHK028 Is the "must not be mistaken for the real blog" requirement measurable for human visitors as well as search engines? [Ambiguity, Spec §FR-017, §Edge Cases]
- [x] CHK029 Is the removal-before-merge requirement paired with a defined step, owner and verifiable end state in the plan? [Traceability, Spec §FR-018, §SC-006]
- [x] CHK030 Are requirements clear on what merges (document and pictures) versus what does not, including tests, sample data and capture tooling? [Clarity, Spec §FR-018]
- [x] CHK031 Is the ordering between preview review, Don's decision and removal consistent with the major-change rule? [Consistency, Spec §Context, Constitution §III]
- [x] CHK032 Are the shared-file and parallel-feature conflict requirements documented for this feature? [Dependency, Spec §Assumptions]
- [x] CHK033 Is the "two clicks from the directions index" navigation requirement consistent with the index and inter-screen link requirements? [Consistency, Spec §FR-005, §SC-004]
