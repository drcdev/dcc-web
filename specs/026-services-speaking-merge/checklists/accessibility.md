# Accessibility Checklist: One Page for Services and Speaking

**Purpose**: Validate that WCAG 2.2 AA, performance and no-JavaScript requirements for the merged page are complete and measurable
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md)

## WCAG 2.2 AA

- [ ] CHK035 - Is WCAG 2.2 AA stated as a requirement for the merged page and tied to a measurable check? [Measurability, Spec §FR-012, §SC-006]
- [ ] CHK036 - Are heading-structure requirements (single h1, ordered sub-headings for two groups) specified for assistive technology navigation? [Coverage, Spec Edge Cases]
- [ ] CHK037 - Are the two offering groups' titles required to be programmatically distinguishable as separate groups? [Gap, Spec §FR-003]
- [ ] CHK038 - Is the photo's alt text requirement defined, including that it is preserved from the Speaking page? [Completeness, Spec §FR-002]
- [ ] CHK039 - Is the single call to action's link text required to be descriptive out of context? [Clarity, Spec §FR-005]
- [ ] CHK040 - Is the current-page indication in the menu required to be exposed non-visually, not by colour alone? [Gap, Spec §User Story 2]
- [ ] CHK041 - Are keyboard and focus requirements for the menu with the changed entry list defined or inherited explicitly? [Coverage, Spec §FR-012]
- [ ] CHK042 - Are reflow and text-resize requirements specified for the longer "Work with me" label at phone widths? [Gap]
- [ ] CHK043 - Is the draft notice's accessibility and position on the merged page specified? [Completeness, Spec §FR-011]
- [ ] CHK044 - Is colour contrast addressed for any new or changed text (no new styling asserted)? [Assumption, Spec §Assumptions]

## Performance and No-JavaScript

- [ ] CHK045 - Is the performance budget for the merged page defined, given it combines two pages and one photo? [Clarity, Spec §FR-012]
- [ ] CHK046 - Are Core Web Vitals "good" thresholds on mobile referenced for the larger page, including the image's layout stability? [Coverage, Spec §SC-006]
- [ ] CHK047 - Is the requirement that all content is readable with JavaScript off complete (content, menu, call to action)? [Completeness, Spec §User Story 1]
- [ ] CHK048 - Is the per-template check coverage requirement explicit that old templates are removed and the new one added? [Clarity, Spec §FR-012]
- [ ] CHK049 - Are visual-regression requirements for the changed menu and merged page stated, given every page's header changes? [Gap]
