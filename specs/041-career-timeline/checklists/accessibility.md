# Accessibility Checklist: Interactive career timeline

**Purpose**: Validate that the accessibility requirements (WCAG 2.2 AA) for the timeline, filter, disclosure, muted (non-matching) steps, focus, motion and no-JS behaviour are complete, clear and measurable
**Created**: 2026-10-14
**Feature**: [spec.md](../spec.md)

**Note**: Each item tests the quality of the written requirements, not the implementation.

## Disclosure (details/summary)

- [x] CHK001 Is the accessible name of each step's disclosure control specified (which of role, organization and period it contains, and in what order)? [Clarity, Spec §FR-002, §FR-007]
- [x] CHK002 Is "open or closed state is announced" defined as a measurable property rather than an assumption about assistive-technology output? [Measurability, Spec §US1-6]
- [x] CHK003 Are heading levels for the timeline section, step summaries and the labelled detail parts specified so the page outline stays valid? [Gap, Spec §FR-008]
- [x] CHK004 Is the semantic structure of the step list (ordered list of steps, labelled sub-lists for Achievements and Leadership) required, so the order and counts are available to a screen reader? [Completeness, Spec §FR-001, §FR-008]
- [x] CHK005 Are the labels for detail parts required to be programmatically associated with their text, not only visible? [Gap, Spec §FR-003]
- [x] CHK006 Is the accessible treatment of the "present" end of a period (and period date ranges generally) specified for screen readers? [Gap, Spec §FR-002]
- [x] CHK007 Are link-text requirements defined for related posts and awards so each link name is meaningful out of context? [Clarity, Spec §FR-008]
- [x] CHK008 Is the plain-text rendering of an award without a link distinguished from linked items in a way that does not rely on colour? [Gap, Spec §FR-008]

## Filter controls

- [x] CHK009 Are the role and state semantics of the filter (group label, single choice, current choice exposed) specified? [Completeness, Spec §FR-009]
- [x] CHK010 Is the filter's accessible name and group label defined in plain-language wording? [Gap, Spec §FR-020]
- [x] CHK011 Is the wording and format of the announcement of "the number of matching steps" specified, including zero, one and plural cases? [Ambiguity, Spec §FR-013]
- [x] CHK012 Is it specified when the announcement fires (every change, including a return to "All") and how it avoids repeating or interrupting? [Clarity, Spec §FR-013, §US3-5]
- [x] CHK013 Is "matching steps" defined consistently as steps, not items, in the announcement and in the filter outcome? [Consistency, Spec §FR-010, §FR-013]
- [x] CHK014 Are keyboard operation requirements (Tab order, activation keys, arrow-key behaviour or its absence) defined for the filter? [Gap, Spec §FR-009]
- [x] CHK015 Is the tab order between the filter and the steps below it specified? [Gap]
- [x] CHK016 Are requirements stated for how "highlighted" matching items are conveyed to assistive technology, not just visually? [Gap, Spec §FR-010]
- [x] CHK017 Is the visual and non-visual indication of the highlight required not to rely on colour alone? [Coverage, Spec §FR-010, §FR-011]
- [x] CHK018 Is the requirement that each highlighted item shows its role and organization defined for assistive technology, not only sighted users? [Completeness, Spec §FR-010]

## Muted steps and contrast

- [x] CHK019 Is the muted treatment's effect on text contrast quantified with the WCAG 2.2 AA thresholds that apply (4.5:1 body text, 3:1 large text and UI components)? [Measurability, Spec §FR-011]
- [x] CHK020 Is the contrast requirement stated for every state: closed, open, hover, focus, filtered, muted and idle? [Coverage, Spec §FR-011]
- [x] CHK021 Is contrast required in both the light and dark themes, and in forced-colours mode? [Gap, Spec §FR-011]
- [x] CHK022 Is the contrast measurement basis defined for a muted step (the solid colour actually behind the text, with patterns, background images and opacity ruled out)? [Ambiguity, Spec §FR-011]
- [x] CHK023 Is "must not rely on colour alone" translated into a specific non-colour cue for a muted step under each candidate treatment (rule style, size or layout), and is the cue itself required to be perceivable, including in forced-colours mode? [Clarity, Spec §FR-011]
- [x] CHK024 Are non-text contrast requirements (3:1) defined for the muted-step cue (rule or edge), the summary affordance and the filter buttons? [Gap]
- [x] CHK025 Is it specified that a muted step is not exposed to assistive technology as disabled or hidden? [Clarity, Spec §FR-011, §US3-5]
- [x] CHK026 Is behaviour specified for text zoom to 200% and 400% reflow with muted steps present (including a compact one-line muted row)? [Gap, Spec §FR-017]

## Focus

- [x] CHK027 Are focus-visible requirements defined for summaries, filter buttons and links, including contrast of the indicator (WCAG 2.4.7, 2.4.11, 2.4.13)? [Gap]
- [x] CHK028 Is focus behaviour specified when a filter change collapses the step that holds focus? [Edge Case, Gap, Spec §FR-010, §FR-011]
- [x] CHK029 Is focus retention required on the filter button after a choice, so a keyboard user is not moved by the page reflow? [Gap, Spec §FR-010]
- [x] CHK030 Is the minimum target size for summaries and filter buttons specified (WCAG 2.5.8, 24 CSS px) for the 320 px layout? [Gap, Spec §FR-017]
- [x] CHK031 Is it specified that the muted treatment or highlight must not obscure the focus indicator? [Gap]

## Motion, zoom and print

- [x] CHK032 Is "does not animate" defined to cover every transition (opening, closing, muting change, highlight, scroll) under reduced motion? [Clarity, Spec §FR-015]
- [x] CHK033 Is the default (no reduced-motion preference) motion behaviour specified, or is "no motion at all" the intended requirement? [Ambiguity, Spec §FR-015]
- [x] CHK034 Is reflow at 320 CSS px defined with the filter row, long organization names and the longest award title included? [Coverage, Spec §FR-017]
- [x] CHK035 Are print requirements for accessibility of printed output (not muted, text contrast, link visibility) defined, not only "open"? [Completeness, Spec §FR-018]
- [x] CHK036 Is the print state defined for a page where a filter was chosen before printing, and for how the filter control itself prints? [Edge Case, Spec §FR-018]

## No-JavaScript and measurability

- [x] CHK037 Are the assistive-technology requirements with JavaScript off (native disclosure semantics, no orphaned filter, no dead controls) stated separately from the JS-on requirements? [Coverage, Spec §FR-007, §FR-014]
- [x] CHK038 Is "no violations" in SC-004 tied to a named rule set and tags (WCAG 2.2 AA) and to the exact page states checked (idle, each category, dark theme)? [Measurability, Spec §SC-004]
- [x] CHK039 Are the page states that must be checked for accessibility enumerated (no filter, each of three categories, a step opened by hand while filtered, both themes)? [Coverage, Spec §SC-004]
- [x] CHK040 Is the requirement for the page's skip-to-content, landmark and heading order unchanged by the new section stated, or is its absence intentional? [Gap]
- [x] CHK041 Are the language and reading-level requirements (plain language) for the filter labels and status messages measurable? [Measurability, Spec §FR-020]

## Review round 2026-10-15

- [x] CHK042 Is the position of the disclosure marker relative to the role title specified (same line, every width and state, JavaScript on or off) with its contrast, target size and accessible-name rules? [Clarity, Spec §FR-007b, §FR-017]
- [x] CHK043 Is each candidate muting treatment specified with its own non-colour cue and contrast basis, so either one can be checked against the same AA rules? [Consistency, Spec §FR-011, §FR-011a]
