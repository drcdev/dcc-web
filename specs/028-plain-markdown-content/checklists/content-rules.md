# Content Authoring and Build Validation Checklist: Plain Markdown for standard content

**Purpose**: Unit tests for the requirements on which components remain, how removed ones are rejected, and how the Work with me page is rewritten
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

**Depth**: Standard. **Audience**: PR reviewer (Don). Requirements quality only; nothing here evaluates the implementation.

## Requirement Completeness

- [x] CHK001 Is the set of remaining components enumerated identically in FR-003, Key Entities, SC-004 and the plan's data model? [Consistency, Spec §FR-003]
- [x] CHK002 Are requirements stated for content other than pages and posts that could contain the removed tags (project stories, fixtures, MDX in other collections)? [Coverage, Spec §Edge Cases]
- [x] CHK003 Is the fate of the `Offering` `href` option specified, including what an author writes instead? [Completeness, Spec §Edge Cases]
- [x] CHK004 Is it specified what happens to the section `content` summary and schema counters tied to the removed sections? [Gap, Plan §Source Code]
- [x] CHK005 Are requirements defined for the fixture page that exercises sections, given it loses two blocks? [Completeness, Plan §Summary]
- [x] CHK006 Is the treatment of earlier feature specs and docs that mention the removed sections stated (history vs. updated)? [Completeness, Spec §Assumptions]

## Requirement Clarity

- [x] CHK007 Is "outside code" defined for FR-002 (fenced code, inline code, indented code, HTML comments, frontmatter)? [Ambiguity, Spec §FR-002]
- [x] CHK008 Is "the existing 'not a section' error, reused unchanged" precise enough to name the exact message parts it must contain (file, tag, list of sections)? [Clarity, Spec §FR-002]
- [x] CHK009 Is the order of the section list in the error message specified or declared irrelevant? [Ambiguity, Data model §Validation rules]
- [x] CHK010 Is "Their behaviour and appearance MUST NOT change" measurable for the eight remaining components? [Measurability, Spec §FR-003]
- [x] CHK011 Is "says the same things in the same order" defined strictly enough to decide whether whitespace, punctuation or emphasis changes are allowed? [Clarity, Spec §US1 Scenario 3, FR-005]
- [x] CHK012 Is "looks the same before and after" for other pages tied to a defined comparison (which pages, which viewports, which tolerance)? [Measurability, Spec §SC-005]

## Requirement Consistency

- [x] CHK013 Do FR-002 (page and post files fail on removed tags) and the project-file edge case describe the same failure for projects without conflict? [Consistency, Spec §FR-002, Edge Cases]
- [x] CHK014 Does the clarification "no hint for each removed tag" agree with the User Story 3 wording that the message "lists the components that are still available"? [Consistency, Spec §Clarifications, US3]
- [x] CHK015 Do FR-010 ("no other page, post or project uses the removed sections") and SC-002 ("zero content files") state the same claim, and is the claim backed by a stated way to confirm it? [Consistency, Assumption]
- [x] CHK016 Is the lead paragraph and call-to-action retention on Work with me consistent between FR-004, US1 Scenario 3 and the data model's body order? [Consistency]
- [x] CHK017 Is the page's draft status and menu position requirement consistent with the assumption that no preview check is needed? [Consistency, Spec §Edge Cases, Assumptions]

## Scenario and Edge Case Coverage

- [x] CHK018 Are requirements defined for a removed tag used inside another section (for example `<Offering>` inside `<Lead>`)? [Coverage, Gap]
- [x] CHK019 Are requirements defined for a removed tag in self-closing, mixed-case or attribute-less forms? [Edge Case, Gap]
- [x] CHK020 Is the case of multiple removed tags in one file specified (first error only, or all)? [Edge Case, Gap]
- [x] CHK021 Are requirements defined for duplicate heading text on the Work with me page, including which headings (for example repeated "Consulting") get which addresses? [Edge Case, Spec §Edge Cases]
- [x] CHK022 Is the heading address for a heading containing punctuation or an apostrophe ("What I don't do") specified, or deliberately left to the generator? [Ambiguity, Plan §Risks]
- [x] CHK023 Are requirements defined for headings inside a component (for example a heading within `<Lead>` or `<SideImage>`) and whether they get addresses? [Coverage, Gap]
- [x] CHK024 Is the Markdown-in-component rule specified for the remaining components that hold text (blank-line handling, inline emphasis)? [Gap] (n/a: the remaining components keep their existing Markdown-in-component rule, already documented in docs/pages.md; FR-003 says their behaviour does not change)

## Acceptance Criteria Quality

- [x] CHK025 Can SC-001 ("100% of headings ... can be linked to") be objectively measured, given "headings in the body" excludes the page title and any component-internal headings? [Measurability, Spec §SC-001]
- [x] CHK026 Can SC-003 ("fails the build every time") be verified for each of the three tags and for both pages and posts? [Measurability, Spec §SC-003]
- [x] CHK027 Does every acceptance scenario in US3 map to a requirement ID (US3 Scenario 3 to FR-002's "outside code")? [Traceability, Spec §US3]
- [x] CHK028 Is there an acceptance criterion for FR-007 (typography styles apply to plain Markdown elements) beyond the Work with me page? [Gap, Spec §FR-007]

## Dependencies and Assumptions

- [x] CHK029 Is the assumption that Markdown headings already get ids validated against the actual Markdown processor in use, and is the dependency recorded in the plan? [Assumption, Spec §Assumptions, Plan R1]
- [x] CHK030 Is the assumption that "not a major change" holds recorded with the criteria that justify it, including the baseline changes to the sections fixture? [Assumption, Plan §Major-change classification]
- [x] CHK031 Is the requirement for refreshing visual baselines (platforms, files affected, and that no other image changes) stated as a requirement and not only as a task note? [Gap, Plan §Visual baselines]
- [x] CHK032 Are out-of-scope items (heading level enforcement, heading link control, other components) listed so they are not silently expected? [Completeness, Spec §Follow-up]
