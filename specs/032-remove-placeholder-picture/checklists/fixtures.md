# Fixture Integrity Checklist: Remove the project placeholder picture option

**Purpose**: Unit tests for the requirements on fixture projects, broken fixtures and their test data.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Completeness

- [ ] CHK001 Is every fixture file that sets `placeholder` listed (valid, draft, broken, component and schema test data) with counts? [Completeness, Plan Summary]
- [ ] CHK002 Is a closing check defined that no fixture or test data still sets the setting (search scope and exclusions stated)? [Measurability, Spec §SC-003]
- [ ] CHK003 Is the exception for a fixture proving rejection reconciled with the plan's decision to add none? [Conflict, Spec Story 3 vs Plan R3]
- [ ] CHK004 Is the retained "A placeholder picture for ..." alt text distinguished from the setting in a way a search-based check can honour? [Ambiguity, Plan Left untouched]

## Broken Fixtures

- [ ] CHK005 Is the intended failure reason of each of the eight broken fixtures stated so removal of the key cannot change it? [Clarity, Spec §FR-005]
- [ ] CHK006 Is it defined how to tell a fixture now failing for the wrong reason (message mismatch versus unknown key)? [Measurability, Plan Risks]
- [ ] CHK007 Are fixtures whose error ordering could change (multiple errors in one file) identified? [Coverage, Gap]

## Fixture Site and Tests

- [ ] CHK008 Is the removed e2e test's behaviour shown to be covered at a cheaper layer rather than dropped? [Consistency, Plan Principle II]
- [ ] CHK009 Is the fixture-site rule (fixed expectations) confirmed for project counts and row shots? [Consistency, Gap]
- [ ] CHK010 Are the assertions that depend on fixture alt text or ordering identified so none move silently? [Dependency, Plan R6]
- [ ] CHK011 Does the plan state that real content under `src/content/projects` is outside the fixture edits? [Scope, Spec §FR-008]
