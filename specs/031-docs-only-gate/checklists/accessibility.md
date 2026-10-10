# Accessibility Checklist: Docs-only verify gate

**Purpose**: Validate that accessibility (WCAG 2.2 AA) requirements are correctly scoped for a CI-only change, and that the gate cannot skip accessibility checks for a change that could affect a page.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

## Scope and applicability

- [x] CHK001 Does the spec state explicitly that no page, component, template or visual output changes, so the page-level WCAG 2.2 AA requirements are not applicable? [Completeness, Spec Context, Plan Principle X]
- [x] CHK002 Is the claim "a docs-only change cannot change a page" supported by the same evidence as the "nothing reads docs/" assumption? [Assumption, Spec Assumptions]
- [x] CHK003 Is it stated which tiers still run the accessibility checks (content-only, full), and which skip them (skip-safe, docs)? [Clarity, Spec §FR-005, §FR-011]
- [x] CHK004 Are accessibility checks kept on any tier where a page template or content could change, with no change to their rules? [Consistency, Spec §FR-011]
- [x] CHK005 Is the docs tier's skipping of accessibility and visual checks consistent with Constitution Principle X ("every page meets WCAG 2.2 AA")? [Consistency, Constitution X]

## Documentation as content

- [x] CHK006 Are the files under `docs/` stated to be contributor documentation not published on the site, so site accessibility rules do not apply to them? [Assumption, Spec §FR-001]
- [x] CHK007 If any Markdown under `docs/` is ever rendered on the site, is there a requirement that moves it out of the docs tier? [Gap, Spec Assumptions]
- [x] CHK008 Is the updated `docs/testing.md` text required to use plain language and clear structure for the tier table? [Clarity, Spec §FR-013]

## CI output readability

- [x] CHK009 Is the changed-files and tier log (FR-012) required to be readable as plain text without relying on colour or layout alone? [Gap, Spec §FR-012]
- [x] CHK010 Is the PR body flag for the major change required to name the applicable criterion in text? [Completeness, Spec Context]
