# Accessibility Checklist: Design directions for the blog

**Purpose**: Validate that the accessibility requirements (WCAG 2.2 AA) for the prototype screens are complete, clear, consistent and measurable
**Created**: 2026-09-29
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

## Contrast and Themes

- [x] CHK001 Is the WCAG 2.2 AA contrast requirement stated for body text, links, topic labels, pagination controls and captions in both themes? [Completeness, Spec §US3, §FR-014]
- [x] CHK002 Is "meet contrast minimums" quantified with the actual ratios (text, large text, UI components)? [Clarity, Spec §US3 AC1]
- [x] CHK003 Are contrast requirements defined for text placed over or beside images and SVG illustrations? [Gap]
- [x] CHK004 Is the treatment of palette shades that fail AA on dusk backgrounds defined as a requirement, not only a plan risk? [Gap, Plan §Risks]
- [x] CHK005 Are focus indicator visibility and contrast requirements specified for both themes? [Gap]
- [x] CHK006 Is it specified that colour is never the only means of distinguishing topics, featured posts or the current page? [Gap]

## Keyboard and Focus

- [x] CHK007 Are keyboard-operability requirements stated for every interactive element (topic navigation, pagination, related links, code and table scrollers)? [Coverage, Spec §US3]
- [x] CHK008 Is a logical focus order required for each direction's differing layouts (e.g. featured versus newest regions)? [Gap]
- [x] CHK009 Is a skip-link or equivalent bypass requirement defined for the prototype pages? [Gap]
- [x] CHK010 Are focus requirements defined for horizontally scrollable code samples and tables, which must be keyboard reachable? [Gap, Spec §Edge Cases]
- [x] CHK011 Is the target size requirement (WCAG 2.2 minimum) stated for pagination and topic controls at phone width? [Gap]

## Headings, Landmarks and Semantics

- [x] CHK012 Are heading-level requirements (one h1, no skipped levels) defined for each of the three screens? [Gap]
- [x] CHK013 Are landmark requirements defined, including labelled navigation regions for topics, pagination and related posts? [Gap]
- [x] CHK014 Is the current page or current topic required to be exposed programmatically, not just visually? [Gap, Spec §US2 AC3]
- [x] CHK015 Are requirements defined for how dates, reading time and topics are exposed to assistive technology? [Gap, Spec §FR-009]
- [x] CHK016 Are link-text requirements defined so that "read more" style links are distinguishable out of context? [Gap]

## Reflow and Responsive

- [x] CHK017 Is the 320 CSS pixel reflow requirement stated explicitly, rather than only "does not scroll sideways"? [Clarity, Spec §US3 AC2]
- [x] CHK018 Is "phone width" tied to a specific pixel value consistent with the 320 px reflow criterion? [Ambiguity, Spec §Assumptions]
- [x] CHK019 Are text-resize and zoom (200 percent, 400 percent) requirements defined? [Gap]
- [x] CHK020 Are long-title and many-topic overflow requirements measurable? [Measurability, Spec §Edge Cases]

## Motion and Interaction

- [x] CHK021 Are reduced-motion requirements defined for any transition or animation, including view transitions? [Gap]
- [x] CHK022 Is it stated whether any motion, hover-only or pointer-gesture behaviour is allowed in the prototypes? [Gap]

## Images, Captions and Media

- [x] CHK023 Are alt text requirements defined for feature images, decorative images and the post-page image? [Gap, Spec §FR-010]
- [x] CHK024 Is the caption requirement specified as programmatically associated with its image? [Clarity, Spec §FR-010]
- [x] CHK025 Are requirements defined for how a post without an image is presented to assistive technology? [Coverage, Spec §Edge Cases]

## Code Samples and Tables

- [x] CHK026 Are accessibility requirements defined for code samples (accessible name, scroll region, contrast of syntax colours in both themes)? [Gap, Spec §FR-010]
- [x] CHK027 Are table accessibility requirements defined (caption, header cells, scope) for the sample table? [Gap, Spec §FR-010]
- [x] CHK028 Is the requirement that a wide table or long code line is readable without page-level sideways scroll specific about the mechanism? [Clarity, Spec §Edge Cases]

## Language, No-JavaScript and Verification

- [x] CHK029 Is page language and title uniqueness required for each prototype page? [Gap]
- [x] CHK030 Is the "readable with JavaScript turned off" requirement defined for all interactive elements, not only content? [Clarity, Spec §FR-015]
- [x] CHK031 Is the automated-check scope (which pages, themes, widths) traceable from FR-014 to SC-003? [Traceability, Spec §SC-003]
- [x] CHK032 Does the spec acknowledge which WCAG criteria automated checks cannot cover, and how those are reviewed? [Gap]
- [x] CHK033 Is the accessibility requirement consistent across FR-014, SC-003 and Constitution Principle X? [Consistency]
