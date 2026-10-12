# Home Page Content and UX Checklist: Home page with a Now section and Start here reading paths

**Purpose**: Validate the clarity, completeness and consistency of the content and layout requirements for the reworked home page
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md), [contracts/home-sections.md](../contracts/home-sections.md)

**Note**: These items test the quality of the written requirements, not the built page.

## Page Structure and Hierarchy

- [x] CHK001 Is the section order (intro, Now, Start here, Recent writing) stated once and identically in the spec and the contract? [Consistency, Spec §FR-001, §FR-007, §US3]
- [x] CHK002 Are the relative visual weights of Now, Start here and Recent writing specified, or is "equal sections" an unstated assumption? [Gap]
- [x] CHK003 Is the requirement that a first-time visitor finds the three answers "without clicking" (SC-001) measurable, for example by a position on a stated viewport? [Measurability, Spec §SC-001]
- [x] CHK004 Is the fate of the intro's existing call to action, now that the Now "open to" line also links to contact, specified to avoid two competing calls? [Ambiguity, Spec §Assumptions, §FR-016]
- [x] CHK005 Is it clear that removing the "What I do" section removes the only description of services, and is that loss accepted in the spec? [Assumption, Spec §FR-016]

## Now Section Content

- [x] CHK006 Are the four topic labels given as exact required text, in a fixed order, in the spec itself? [Clarity, Spec §FR-003]
- [x] CHK007 Is the date line's wording ("Updated ...") and format specified as a requirement and not only as an example? [Clarity, Spec §FR-002, §US1-AS1]
- [x] CHK008 Are the draft launch texts in FR-021 identified as editable in review, with a stated way to flag that they are unreviewed? [Assumption, Spec §FR-021]
- [x] CHK009 Is the "open to" line's exact text fixed (FR-021) and consistent with the user story wording (speaking and mentoring only)? [Consistency, Spec §FR-021, §US1-AS2]
- [x] CHK010 Is an acceptable length for each Now topic stated so the section stays short on a phone? [Gap, Spec §FR-003]
- [x] CHK011 Are requirements defined for how a topic with nothing to say is handled, given every topic is required? [Edge Case, Spec §FR-006]
- [x] CHK012 Is the staleness behaviour (old date still shown, no warning) stated with the trade-off acknowledged? [Assumption, Spec §Edge Cases]

## Start here Content

- [x] CHK013 Is the path description rule ("who it is for") given a stated tone or pattern so descriptions read consistently? [Clarity, Spec §FR-008]
- [x] CHK014 Are item display requirements consistent between posts and projects, including what differs (only the "Project" label)? [Consistency, Spec §FR-009, §FR-010]
- [x] CHK015 Is the visible form of the reading time defined for all cases ("N min read", the 1 minute floor)? [Clarity, Spec §Edge Cases]
- [x] CHK016 Is the layout of one, two, three and four paths specified (columns, wrapping, an odd number of paths)? [Coverage, Spec §FR-014]
- [x] CHK017 Is the layout stated for paths of unequal length so cards do not look unbalanced or leave gaps? [Gap]
- [x] CHK018 Is the single-item path presentation defined, since an ordered list of one reads oddly? [Edge Case, Spec §Edge Cases]
- [x] CHK019 Is the meaning of the order in a path stated to the reader (read in this order) or left implicit? [Gap, Spec §FR-008]

## Responsive and Theming

- [x] CHK020 Are breakpoints and column behaviour for the Now definition list and path grid specified beyond "one column on a phone"? [Clarity, Contracts/home-sections]
- [x] CHK021 Are light and dark theme requirements stated for the new sections, consistent with Recent writing? [Consistency, Spec §FR-015]
- [x] CHK022 Is the visual treatment of the new sections required to reuse the site's existing section tokens, and is that traceable to a requirement? [Traceability, Spec §FR-015]

## Non-Functional and Constraints

- [x] CHK023 Is "within the performance budget" tied to a named budget and the metrics it covers, for the home page template? [Measurability, Spec §FR-019, §SC-004]
- [x] CHK024 Are "no client-side JavaScript" and "readable with JavaScript off" distinct, testable requirements or overlapping ones? [Clarity, Spec §FR-017, §SC-005]
- [x] CHK025 Is plain-language copy (no hype or filler) defined with criteria a reviewer can apply to the new copy? [Measurability, Spec §FR-020]
- [x] CHK026 Is the Island Health role wording required exactly as written in a single place, so the Now text and intro cannot diverge? [Consistency, Spec §FR-020, §FR-021]
- [x] CHK027 Are SEO and social metadata for the home page (title, description, preview image) stated as unchanged or changed given the removed paragraphs? [Gap]
- [x] CHK028 Is the scope boundary with the contact form and API stated (the slice links to /contact/ and changes nothing there)? [Assumption, Spec §Assumptions]
- [x] CHK029 Are visual-baseline impacts (home page, fixture site) noted as a requirement or dependency of the change? [Dependency, Gap]
