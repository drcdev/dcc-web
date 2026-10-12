# Accessibility Checklist (WCAG 2.2 AA): This site as a project story

**Purpose**: Validate that accessibility requirements for the story's pictures, diagram, text and structure are complete and testable
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md)

## Alt Text and Pictures

- [x] CHK001 Is "alt text" for the list picture defined by what it must convey (the home page, light mode), not only that it exists? [Clarity, Spec §FR-006]
- [x] CHK002 Is it specified whether the list picture, reused beside Problem, carries the same alt text in both places or is decorative in one? [Ambiguity, Spec §FR-014]
- [x] CHK003 Are alt text requirements stated for the diagram separately from its text description? [Completeness, Spec §FR-006]
- [x] CHK004 Is the length and style of alt text bounded (short, no "image of")? [Gap, Spec §FR-006]
- [x] CHK005 Is text inside the home page screenshot treated as non-essential, or does the alt text need to carry it? [Gap, WCAG 1.4.5]

## Diagram

- [x] CHK006 Is the "text description" of the diagram required to hold every step and relationship the diagram shows, and where it sits relative to the picture? [Clarity, Spec §FR-006]
- [x] CHK007 Are text contrast requirements for diagram labels and shapes stated for both light and dark themes? [Gap, WCAG 1.4.3, 1.4.11]
- [x] CHK008 Is a minimum on-screen text size for diagram labels specified for phone width? [Gap, WCAG 1.4.4]
- [x] CHK009 Is it specified that the diagram conveys nothing by colour alone? [Gap, WCAG 1.4.1]
- [x] CHK010 Is a requirement defined for how the diagram looks if the embedded font fails to load? [Edge Case, Gap]

## Structure and Text

- [x] CHK011 Is the heading order defined (one h1, the four parts as h2, any sub-parts as h3 with no skipped level)? [Clarity, Spec §FR-002]
- [x] CHK012 Is the Options comparison table required to have header cells and a caption or equivalent so it reads in a screen reader? [Gap, Spec §FR-002]
- [x] CHK013 Does the table requirement say how it must behave at phone width without two-way scrolling? [Gap, WCAG 1.4.10]
- [x] CHK014 Is link text required to be meaningful out of context for the source link and the Cadence link? [Gap, Spec §FR-005, §FR-008]
- [x] CHK015 Is the invitation link's purpose and accessible name specified? [Gap, Spec §FR-013]
- [x] CHK016 Is the page's reading level or plain-language requirement tied to an accessibility criterion rather than only style? [Consistency, Spec §FR-009]

## Verification Coverage

- [x] CHK017 Does the spec name which template and which story the automated accessibility check runs against, given the story is a draft? [Coverage, Spec §SC-005]
- [x] CHK018 Are requirements for keyboard focus and visible focus on the new links stated, or inherited explicitly from the template? [Gap, WCAG 2.4.7, 2.4.11]
- [x] CHK019 Is the no-JavaScript reading requirement extended to the pictures and their alt text? [Coverage, Spec §SC-006]
- [x] CHK020 Is dark-mode readability of the light-mode screenshot addressed (contrast of the picture against the dark page)? [Edge Case, Gap, Spec §FR-014]
