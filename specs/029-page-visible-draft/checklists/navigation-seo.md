# Navigation and SEO/Indexing Checklist: Page visibility and draft flags

**Purpose**: Unit tests for the requirements on menu assembly, sitemap, noindex and production exclusion
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md), [contracts/page-settings.md](../contracts/page-settings.md)

## Menu Assembly

- [x] CHK001 Is the rule for which pages enter each menu complete (visible, location, position) and stated once without contradiction between FR-005, FR-006 and the contract? [Consistency, Spec §FR-005, §FR-006]
- [x] CHK002 Is tie-breaking defined where order could be ambiguous, given positions are unique only within a menu? [Gap, Spec §FR-009]
- [x] CHK003 Is the footer composition defined for where the unchanged social links sit relative to page links? [Clarity, Contract §What each build produces]
- [x] CHK004 Is the current-page indication in each menu (active link) specified for pages that appear in the menu and for pages that do not? [Gap]
- [x] CHK005 Is the header behaviour defined for an empty menu (all header pages not visible)? [Edge Case, Gap]
- [x] CHK006 Is the not-found page's use of the same header and footer defined for production, where some pages are absent? [Consistency, Spec §Edge Cases]
- [x] CHK007 Are landing-page header entries (Writing, Projects) required to link to the address built by the code route, and is a mismatch between file and route addressed? [Completeness, Spec §US3-4]
- [x] CHK008 Is the rule that links to Contact from other pages are the author's responsibility documented as a limitation, not an implied guarantee? [Assumption, Spec §Edge Cases]

## Production Exclusion

- [x] CHK009 Is "not served, returns the not-found page" specified precisely (status code, which page body) for a not-visible address? [Clarity, Spec §US1-1]
- [x] CHK010 Are redirects, aliases or old addresses pointing at a not-visible page addressed? [Gap]
- [x] CHK011 Are other generated outputs (feed, search index, structured data, social image) covered by "left out entirely"? [Coverage, Spec §FR-002]
- [x] CHK012 Is the requirement that a not-visible page is absent from the sitemap stated for both production and non-production builds, and consistent with the contract table? [Consistency, Spec §FR-002]

## Indexing and Sitemap

- [x] CHK013 Is the noindex instruction specified by mechanism (page meta, response header or both) and consistent between spec and contract? [Clarity, Spec §FR-003]
- [x] CHK014 Is a non-draft visible page on a non-production build required to carry noindex, and does the spec explain how that squares with FR-004's "no noindex instruction"? [Conflict, Contract §What each build produces]
- [x] CHK015 Is the sitemap rule for a visible draft page consistent with how the sitemap handles draft posts and projects? [Consistency, Spec §FR-012]
- [x] CHK016 Are canonical URL and robots.txt requirements stated for draft and not-visible pages? [Gap]
- [x] CHK017 Is SC-003's "0 reachable, linked or listed" backed by a defined way to enumerate reachable addresses? [Measurability, Spec §SC-003]
- [x] CHK018 Is SC-004's "100% of visible draft pages" scoped to a named set of pages and builds? [Measurability, Spec §SC-004]

## Transitions and Regression

- [x] CHK019 Is the transition of a page from draft to published (and from not visible to visible) specified in terms of the next production deploy only, with no stale artefacts? [Completeness, Spec §US1, §US2]
- [x] CHK020 Is parity with today's menu order and sitemap (Home, Work with me, Writing, Projects, About, Contact; Privacy policy, Terms of use, Technology) listed as exact expected values? [Measurability, Spec §US3-7]
- [x] CHK021 Is the major-change classification under Principle III recorded with the criterion that applies (navigation) and no others missed? [Traceability, Spec §Assumptions]
