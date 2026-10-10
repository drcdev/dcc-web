# Accessibility Checklist: Remove the project placeholder picture option

**Purpose**: Unit tests for the accessibility requirements (WCAG 2.2 AA, forced colours) of removing the picture mark.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Is WCAG 2.2 AA stated as the conformance level for the affected story pages, tied to Principle X? [Traceability, Plan Principle X]
- [ ] CHK002 Are alt text requirements for images stated as unchanged and testable? [Completeness, Spec §FR-004]
- [ ] CHK003 Is the diagram requirement (visible description associated with the figure) precise enough to check the association? [Clarity, Spec §FR-004]
- [ ] CHK004 Is it specified that nothing conveyed only by the removed mark needs a replacement for screen reader users? [Gap, Spec Story 2]

## Forced Colours

- [ ] CHK005 Does the spec name which elements must keep borders in forced-colours mode after the selector is removed? [Clarity, Spec Story 2 scenario 2]
- [ ] CHK006 Is "keep their borders as before" measurable, with a defined reference for before? [Measurability, Spec Story 2]
- [ ] CHK007 Is it required that the forced-colours selector list stays valid when one selector is deleted? [Edge Case, Plan Structure]
- [ ] CHK008 Is any requirement stated for how forced-colours is checked, given the visual shots do not run in that mode? [Gap, Coverage]

## Layout and Reading Order

- [ ] CHK009 Are reading-order and heading requirements stated as unchanged once the mark paragraphs are removed? [Consistency, Gap]
- [ ] CHK010 Are focus, keyboard and reflow requirements (320 px, zoom) confirmed as unaffected for story pictures? [Coverage, Gap]
- [ ] CHK011 Is the automated accessibility check on the story template named as the layer covering these, per test placement? [Traceability, Plan Test placement]
- [ ] CHK012 Is contrast of the picture border and caption text in light and dark themes covered by an existing requirement? [Coverage, Gap]
- [ ] CHK013 Is the first-eager, rest-lazy loading rule recorded as unchanged and free of accessibility impact? [Consistency, Spec §FR-004]
