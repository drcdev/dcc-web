# Accessibility Requirements Quality Checklist: Retired status for projects

**Purpose**: Validate that the accessibility requirements for the Retired pill, the retired note and the replacement link are complete, clear and measurable (WCAG 2.2 AA, Constitution Principle X). Reviewer (PR) use, standard depth.
**Created**: 2026-10-03
**Feature**: [spec.md](../spec.md), [contracts/pages-dom.md](../contracts/pages-dom.md)

## Colour and Contrast

- [x] CHK001 Are the exact colour pairs for the Retired pill (background, border, text) stated for both light and dark themes? [Completeness, Spec §FR-004]
- [x] CHK002 Is "AA contrast" tied to specific thresholds (4.5:1 for the label text, 3:1 for the border as a non-text component) rather than left as a bare phrase? [Clarity, Spec §FR-004]
- [x] CHK003 Are contrast requirements stated for the replacement link against the note's surrounding text and page background in both themes? [Gap, Spec §FR-007]
- [x] CHK004 Is it specified how contrast is to be measured (computed from the design tokens versus a rendered check) and where the result is recorded? [Measurability, Spec §SC-004]
- [x] CHK005 Are the dark-theme border colour in the DOM contract (mauve-300) and the dark-theme values in FR-004 (fill mauve-800/900, text mauve-100) consistent, with no border colour left unstated in the spec? [Consistency, Spec §FR-004, contracts/pages-dom.md]
- [x] CHK006 Is the requirement that the pill be distinguishable from the sage, lavender and rust tones defined without relying on hue alone (for example for colour-blind readers)? [Clarity, Spec §FR-004]
- [x] CHK007 Are forced-colours and high-contrast mode expectations for the filled pill and its border addressed or explicitly excluded? [Gap]

## Semantics and Reading Order

- [x] CHK008 Is it required that the status is conveyed by the text "Retired" and never by colour alone, in both the index row and the story header? [Completeness, Spec §FR-010]
- [x] CHK009 Is "exposed to assistive technology as text" defined precisely enough to say whether a role, label or live region is needed or forbidden? [Ambiguity, Spec §FR-010]
- [x] CHK010 Is the retired note's position in the reading order stated relative to the title, problem, status pills and theme pills? [Clarity, Spec §FR-005]
- [x] CHK011 Does the spec reconcile "near the top of the story" (FR-005) with "sits with the story header" and its placement after the meta block in the DOM contract? [Consistency, Spec §FR-005, contracts/pages-dom.md]
- [x] CHK012 Is the bold "Retired." lead-in's semantic purpose (emphasis versus decoration) defined so it is not announced as a heading or a duplicate status? [Clarity, Spec §FR-005]
- [x] CHK013 Is the reading order defined for the case where the draft notice and the retired note both show? [Coverage, Spec Edge Cases]
- [x] CHK014 Is the requirement that the note appears only on the story page, and not on the index, stated for assistive technology users? [Gap, contracts/pages-dom.md]

## Replacement Link

- [x] CHK015 Are the link's accessible name requirements defined (the replacement title or name as link text, and no "click here" wording)? [Completeness, Spec §FR-007]
- [x] CHK016 Are keyboard focus and visible focus indicator requirements for the replacement link specified, or inherited from a named existing link style? [Gap]
- [x] CHK017 Is it stated whether an off-site link is marked as leaving the site, and whether it opens in the same tab? [Ambiguity, Spec §FR-007, contracts/pages-dom.md]
- [x] CHK018 Are the requirements for a name-only replacement (no link) clear that no inert, link-styled text is produced? [Edge Case, Spec §FR-007]
- [x] CHK019 Is the target size requirement (WCAG 2.2 target size minimum) addressed for an inline link in the note? [Gap]

## Scope and Verification

- [x] CHK020 Is the set of templates that must pass automated accessibility checks with a retired project shown named (story page, index, both themes)? [Coverage, Spec §SC-004]
- [x] CHK021 Is a fixture that exercises the retired states required in the accessibility checks, so the checks cannot pass by never rendering the new tone? [Gap, Spec Assumptions]
- [x] CHK022 Are reflow and zoom expectations for the pill and note on narrow screens specified or inherited from existing requirements? [Gap, Constitution §X]
- [x] CHK023 Is the no-JavaScript reading requirement stated measurably for both the pill and the note? [Measurability, Spec §FR-010, Spec Edge Cases]
