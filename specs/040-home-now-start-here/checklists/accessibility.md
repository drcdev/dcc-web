# Accessibility (WCAG 2.2 AA) Checklist: Home page with a Now section and Start here reading paths

**Purpose**: Validate that the accessibility requirements for the reworked home page are complete, clear and measurable
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md), [contracts/home-sections.md](../contracts/home-sections.md)

**Note**: These items test the quality of the written requirements, not the built page.

## Structure and Headings

- [x] CHK001 Is the required heading order stated for every level (one page heading, "Now" and "Start here" as section headings, path names as path headings) and is it consistent between FR-018 and the markup contract? [Consistency, Spec §FR-018]
- [x] CHK002 Is it specified which element carries the single page heading now that the intro card is the only content above the sections? [Gap, Spec §FR-016]
- [x] CHK003 Are landmark and region-labelling requirements stated for the Now, Start here and per-path sections, rather than left to the contract sketch alone? [Gap, Spec §FR-018]
- [x] CHK004 Is the path name heading level required to stay correct when only one path is visible after drafts are removed? [Coverage, Spec §FR-013]
- [x] CHK005 Are the semantics of the four Now topics (label and text pairing) required in the spec, not only shown in the contract markup? [Gap, Spec §FR-003]
- [x] CHK006 Is the ordered nature of a reading path required to be conveyed to assistive technology, not just visually? [Gap, Spec §FR-008]

## Content Alternatives and Text

- [x] CHK007 Is the machine-readable date requirement (FR-002) specific about the format and about what a screen reader announces? [Clarity, Spec §FR-002]
- [x] CHK008 Is the "Project" label requirement specified as text, so the kind of page does not depend on colour or an icon alone? [Clarity, Spec §FR-010]
- [x] CHK009 Are link-purpose requirements defined for the reading path links and the "Get in touch" link, including how the link text reads out of context? [Gap, Spec §FR-009, §FR-021]
- [x] CHK010 Is the reading time text format ("N min read") required to be perceivable to assistive technology, including how the number and unit are announced? [Clarity, Spec §Edge Cases]
- [x] CHK011 Is the content of the Now topics (plain text in front matter) constrained so it cannot introduce links or markup that break the label/text structure? [Assumption, Spec §FR-005]

## Keyboard, Focus and Targets

- [x] CHK012 Are keyboard operability and visible focus requirements stated for every new link, including a focus indicator that meets WCAG 2.2 focus appearance and not-obscured criteria? [Gap]
- [x] CHK013 Is a minimum target size requirement (WCAG 2.2 AA 2.5.8) stated for the reading path links, which sit in a list with a trailing reading time? [Gap]
- [x] CHK014 Is the tab order required to follow the visual order of intro, Now, Start here and Recent writing at every breakpoint? [Coverage, Spec §US3]
- [x] CHK015 Is it specified that the two-column path layout does not reorder items away from the DOM and reading order? [Gap, Spec §FR-008]

## Colour, Contrast and Theming

- [x] CHK016 Are text and non-text contrast requirements stated for the new sections in both light and dark themes? [Gap, Spec §FR-018]
- [x] CHK017 Is it specified that the reading time and "Project" label (secondary text) must meet the same contrast ratio as body text? [Clarity]
- [x] CHK018 Are forced-colours or high-contrast mode requirements addressed, or explicitly out of scope? [Gap]

## Reflow and Zoom

- [x] CHK019 Is the 320 px reflow requirement measurable, with what counts as "no sideways scrolling" defined (page and sections)? [Measurability, Spec §Edge Cases]
- [x] CHK020 Are 200% zoom and text-spacing-override requirements stated for the Now topics and path lists? [Gap]
- [x] CHK021 Are long unbroken strings (a long post title, a 200-character topic line) addressed so they cannot cause overflow or clipping? [Edge Case, Gap]

## Verification of Requirements

- [x] CHK022 Is the automated accessibility requirement (SC-004, "no violations") scoped to named states of the page (with paths, without paths, both themes, narrow width)? [Measurability, Spec §SC-004]
- [x] CHK023 Is the home page required to meet the same bar with JavaScript off as with it on, for accessibility as well as readability? [Consistency, Spec §FR-017, §SC-005]
- [x] CHK024 Are requirements for the date and reading-time wording written in plain language that a reader using a screen reader can parse (no abbreviations without expansion)? [Clarity, Spec §FR-020]
