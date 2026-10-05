# Navigation and Links Checklist: One Page for Services and Speaking

**Purpose**: Validate that the information architecture, menu and link requirements are complete, clear and consistent
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md)

## Menu Requirements

- [ ] CHK001 - Is the exact menu order specified for every entry, including which positions are reserved? [Completeness, Spec §FR-006]
- [ ] CHK002 - Is the treatment of the freed position 3 stated unambiguously (left empty, no reserved position moves)? [Clarity, Spec Edge Cases]
- [ ] CHK003 - Are the menu label and page title requirements consistent ("Work with me" in FR-001, FR-006, SC-002)? [Consistency]
- [ ] CHK004 - Are current-page marking requirements defined for the merged entry on desktop and mobile menus? [Coverage, Spec §User Story 2]
- [ ] CHK005 - Is it specified that no other entry is marked current while on the merged page? [Clarity, Spec §User Story 2]
- [ ] CHK006 - Is the longer label's effect on the mobile and narrow-desktop menu layout addressed in requirements? [Gap]
- [ ] CHK007 - Is the editor guidance for menu positions (free position 3) specified precisely enough to be written without interpretation? [Clarity, Spec §FR-013]

## Link Requirements

- [ ] CHK008 - Is the scope of "internal links" defined (content, components, docs, config, runbook, tests)? [Ambiguity, Spec §FR-009]
- [ ] CHK009 - Are all known referrers of the old addresses enumerated, with the home page button called out? [Completeness, Spec §Context]
- [ ] CHK010 - Is the assumption that only the home page links to the old addresses validated for both `/services/` and `/speaking/`? [Assumption, Spec §Assumptions]
- [ ] CHK011 - Are links to removed pages in docs and runbook treated consistently with links in built pages? [Consistency, Spec §FR-009, §FR-010]
- [ ] CHK012 - Is the call to action's destination and wording requirement clear, including that wording is Don's to review? [Clarity, Spec §FR-005]
- [ ] CHK013 - Is the optional stable id on the Talk topics heading defined well enough that either choice is acceptable and testable? [Ambiguity, Spec §FR-003]

## Launch Configuration

- [ ] CHK014 - Are the launch check and configuration changes specified for both the page list and the expected addresses? [Completeness, Spec §FR-010]
- [ ] CHK015 - Is the runbook wording change specified (one page instead of two) with the copy to be replaced named? [Clarity, Spec §FR-010]
- [ ] CHK016 - Is the major-change classification (navigation) and the preview checks Don must make stated as requirements? [Traceability, Spec §Assumptions]
- [ ] CHK017 - Are requirements stated for tests that name both old menu entries or count seven links? [Gap, Spec §Context]
