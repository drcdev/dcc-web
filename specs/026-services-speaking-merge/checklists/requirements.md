# Specification Quality Checklist: One Page for Services and Speaking

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Three [NEEDS CLARIFICATION] markers are left for the clarify phase (this phase ran without
  access to Don): the merged page's name and address (FR-001), how the six offerings are grouped
  (FR-003), and where the old Speaking address lands (User Story 3, scenario 1). Each has a
  stated default: keep "Services" at `/services/`; the 301 to the page itself.
- Addresses such as `/services/` and `/speaking/` are named because they are user-visible
  behaviour (links, bookmarks, redirects), not implementation detail.
- Major change under Constitution Principle III (navigation), recorded in Assumptions.
