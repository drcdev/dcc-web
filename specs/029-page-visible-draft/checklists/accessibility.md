# Accessibility Checklist: Page visibility and draft flags

**Purpose**: Unit tests for the WCAG 2.2 AA requirements touched by menus and the draft notice
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md), constitution Principle X

## Navigation Landmarks and Order

- [ ] CHK001 Are landmark requirements (header navigation, footer navigation, accessible names for each) stated for menus built from page files? [Gap, Constitution §X]
- [ ] CHK002 Is it specified that the reading and focus order of menu links follows the position order? [Completeness, Spec §FR-006]
- [ ] CHK003 Is the current-page indication for menu links required to be exposed to assistive technology, not colour alone? [Gap]
- [ ] CHK004 Are link text requirements defined (label or title) so a link name is unique and descriptive when two pages have similar titles? [Clarity, Spec §US3-1]
- [ ] CHK005 Are requirements preserved for the header on narrow screens (small-viewport menu, touch target size of at least 24 by 24 CSS pixels) when the entry count changes? [Coverage, Gap]
- [ ] CHK006 Is the not-found page required to meet the same landmark and heading requirements as other pages? [Consistency, Spec §Edge Cases]
- [ ] CHK007 Is the behaviour for a missing or empty menu defined so no empty navigation landmark is rendered? [Edge Case, Gap]

## Draft Notice

- [ ] CHK008 Is the draft notice's content specified in plain language (what it says and why), not only that it is "visible"? [Clarity, Spec §FR-003]
- [ ] CHK009 Is the notice's semantic role defined (static text versus live region or alert) so screen reader users learn the page is a draft without interruption? [Gap]
- [ ] CHK010 Is the notice's position in reading order and in the focus order specified relative to the page heading? [Gap]
- [ ] CHK011 Are colour contrast requirements (4.5:1 text, 3:1 for UI boundaries) stated for the notice in light and dark themes? [Measurability, Constitution §X]
- [ ] CHK012 Is the notice required to work with JavaScript off and to carry no information through colour alone? [Completeness, Constitution §V]
- [ ] CHK013 Are the notice requirements identical for visible draft pages and for not-visible pages on non-production builds, or is the difference stated? [Consistency, Spec §FR-002, §FR-003]

## Coverage

- [ ] CHK014 Is the requirement for automated accessibility checks on every page template extended to the new landing page files' routes and the footer variants? [Coverage, Constitution §I]
- [ ] CHK015 Is WCAG 2.2 AA named as the pass criterion in this spec or its success criteria, rather than left to the constitution alone? [Traceability, Gap]
- [ ] CHK016 Are keyboard operability and visible focus requirements stated for menu links, including links that appear or disappear by build? [Coverage, Gap]
- [ ] CHK017 Is the page title and language of the not-found page required to remain correct when a not-visible address is requested? [Edge Case, Gap]
