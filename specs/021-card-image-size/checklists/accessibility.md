# Accessibility Checklist: Right-size listing card images

**Purpose**: Validate that the accessibility requirements around card images (WCAG 2.2 AA) are complete, clear and measurable. Tests the requirements, not the implementation.
**Created**: 2026-10-04
**Feature**: [spec.md](../spec.md)

## Text Alternatives

- [ ] CHK001 Is the requirement that card images keep their current alternative text stated for every card that has an image? [Completeness, Spec §FR-005]
- [ ] CHK002 Is it specified that alternative text is unaffected by the change of width versions and quality? [Clarity, Spec §FR-005]
- [ ] CHK003 Is the text-only card (no feature image) requirement defined so that no empty or placeholder image is introduced? [Edge Case, Spec §Edge Cases]
- [ ] CHK004 Are requirements stated for what a reader gets if a card image fails to load (alt text still conveys the image's purpose)? [Gap, Edge Case]

## Layout Stability

- [ ] CHK005 Is the requirement to keep intrinsic width and height attributes quantified so that the dropped 480 version and new 400 version cannot cause layout shift? [Clarity, Spec §FR-005]
- [ ] CHK006 Is the 16:9 shape and crop requirement stated consistently for all three versions (320, 400, 640)? [Consistency, Spec §FR-001, §FR-005]
- [ ] CHK007 Is the existing layout-shift limit named as a gate this feature must still pass, with its threshold referenced? [Measurability, Spec §SC-003]
- [ ] CHK008 Is the corrected phone display width requirement defined so it changes only which file is picked, not the drawn size of the card? [Ambiguity, Spec §FR-002]

## Meaning Independent of Image Quality

- [ ] CHK009 Is "no visible artefacts at the size the card is drawn" defined with an objective, reviewable criterion rather than a subjective one? [Ambiguity, Spec §FR-003, §SC-004]
- [ ] CHK010 Is it specified that nothing needed to understand a card (title, summary, date, topics) depends on the image? [Gap, Spec §Background]
- [ ] CHK011 Are requirements defined for images containing text or fine detail that a lower quality could make illegible? [Gap, Edge Case]

## Display Modes and Assistive Contexts

- [ ] CHK012 Are dark mode, forced colours and JavaScript-off behaviours stated as unchanged with enough specificity to be checked? [Coverage, Spec §Edge Cases]
- [ ] CHK013 Is lazy loading retained as a requirement, and is its effect on reading order and focus stated or intentionally excluded? [Coverage, Spec §FR-005]
- [ ] CHK014 Is the requirement for the automated accessibility check to keep passing on every template that shows cards stated, covering all five card locations? [Coverage, Spec §Assumptions, §SC-003]

## Scope and Consistency

- [ ] CHK015 Do the accessibility requirements stay consistent between the card images (changed) and the lead story, hero and project images (unchanged)? [Consistency, Spec §FR-006]
- [ ] CHK016 Is the visual-baseline refresh limited to the predicted listing-cards subject, with any other diff declared a regression? [Traceability, Spec §Assumptions]
