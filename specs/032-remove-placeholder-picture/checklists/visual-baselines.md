# Visual Regression and Baselines Checklist: Remove the project placeholder picture option

**Purpose**: Unit tests for the requirements on which baselines change, on which platforms, and how they are refreshed.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [x] CHK001 Is the exact set of baselines expected to change named (story-template, 4 per platform) with the reason for each? [Completeness, Plan Visual baselines]
- [x] CHK002 Is the set expected not to change named, with the reason for each group? [Completeness, Plan Visual baselines]
- [x] CHK003 Does the spec's "project-row shots" wording (Story 3, FR-007) agree with the plan's finding that they do not change? [Conflict, Spec §FR-007]
- [x] CHK004 Is the refresh procedure for both platforms referenced, including the CI-label fallback if Docker output differs? [Dependency, Plan Risks]

## Clarity and Measurability

- [x] CHK005 Is "visually identical before and after" for published pages defined with a comparison method and tolerance? [Ambiguity, Spec §SC-004]
- [x] CHK006 Is there a rule that any diff outside the predicted set is a regression rather than a baseline to refresh? [Clarity, Plan Visual baselines]
- [x] CHK007 Is "baselines whose pixels do not change are left as they are" reconciled with the update tool's threshold behaviour? [Assumption, Spec §FR-007]
- [x] CHK008 Is it stated how the changed story-template shots are confirmed as showing only the removal (three blocks, layout shift below)? [Measurability, Gap]

## Scenario Coverage

- [x] CHK009 Are all four theme and viewport combinations (desktop, phone, light, dark) covered for the story-template shots? [Coverage, Plan Visual baselines]
- [x] CHK010 Are requirements defined for pages whose layout could shift indirectly (lazy image loading, page height) in other shots? [Coverage, Gap]
- [x] CHK011 Is the risk of Docker-versus-CI divergence for Linux baselines addressed with a stated fallback? [Edge Case, Plan Risks]
- [x] CHK012 Is the order of baseline refresh relative to sibling worktree runs and fixture edits specified? [Dependency, Gap]
