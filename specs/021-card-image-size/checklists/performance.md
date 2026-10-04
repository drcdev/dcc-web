# Performance and Budget Checklist: Right-size listing card images

**Purpose**: Validate that the performance and page-budget requirements are complete, quantified, consistent and measurable. Tests the requirements, not the implementation.
**Created**: 2026-10-04
**Feature**: [spec.md](../spec.md)

## Budget Requirements

- [x] CHK001 Is the 150 KB total-transfer budget stated as unchanged and applied to every page template, not only card pages? [Completeness, Spec §FR-007, §SC-003]
- [x] CHK002 Is it clear whether the budget is measured as compressed transfer size and under which conditions (viewport, network, cache state)? [Clarity, Spec §Assumptions]
- [x] CHK003 Is the headroom expected for a full 12-card page quantified, or is "clear headroom" left undefined? [Ambiguity, Spec §User Story 3, §SC-003]
- [x] CHK004 Is the requirement that no page becomes heavier than today stated explicitly, including pages with few cards or the lead story? [Gap]
- [x] CHK005 Are the other existing limits (LCP, layout shift, long tasks, JavaScript) named as still applying? [Completeness, Spec §SC-003]

## Width Versions and Selection

- [x] CHK006 Is the exact set of widths (320, 400, 640) stated consistently across the requirements, clarifications and scenarios? [Consistency, Spec §FR-001, §Clarifications]
- [x] CHK007 Is "about 400 pixels" in SC-001 defined with a tolerance so the phone-width check has an unambiguous pass line? [Ambiguity, Spec §SC-001]
- [x] CHK008 Is the phone range ("up to about 430 pixels") defined with a precise upper bound and the margin assumption (screen width minus 2rem)? [Clarity, Spec §FR-002]
- [x] CHK009 Are requirements defined for phone widths between the budget viewport (390 px) and the point where selection moves to 640? [Coverage, Spec §FR-002]
- [x] CHK010 Is it specified which version a phone at 2x or 3x density picks, and that it may be wider than 400? [Gap, Spec §FR-004]
- [x] CHK011 Are tablet and desktop selection requirements stated so that wide 1x screens download no more than today? [Clarity, Spec §FR-004]
- [x] CHK012 Does "widest version not narrower than today (640)" agree with "narrowest stays at 320" and the dropped 480 version? [Consistency, Spec §FR-001, §FR-004]
- [x] CHK013 Is behaviour defined for a source image narrower than 400 or 640 pixels (no enlargement, reduced version set)? [Edge Case, Spec §Edge Cases]

## Quality Setting

- [x] CHK014 Is the quality range (60 to 70) bounded and the selection method (file sizes and appearance on named fixture and convergence images) reproducible? [Measurability, Spec §FR-003]
- [x] CHK015 Is the chosen quality required to be recorded in the plan with its supporting comparison? [Traceability, Spec §FR-003]
- [x] CHK016 Is the scope of the lower quality limited to post card images, with an explicit list of excluded images? [Completeness, Spec §FR-006]
- [x] CHK017 Is the image format (WebP) requirement consistent between the assumptions and FR-005? [Consistency, Spec §FR-005, §Assumptions]

## Success Criteria Quality

- [x] CHK018 Is SC-002 clearly marked as a reported measurement with before and after figures in the PR body, and not a gate? [Clarity, Spec §SC-002]
- [x] CHK019 Is the SC-002 baseline (79 KB of 122 KB) reproducible, with how it is measured before and after stated? [Measurability, Spec §SC-002, §Assumptions]
- [x] CHK020 Are the 40% reduction and below-100 KB figures consistent with each other and with the stated baseline? [Consistency, Spec §SC-002]
- [x] CHK021 Is a requirement defined for what happens if the reported figures miss SC-002 (accept, retune quality, or follow-up)? [Gap, Spec §SC-002]

## Coverage and Scope

- [x] CHK022 Are all five card locations (writing landing latest and featured, all posts, topic, series, home recent writing) each covered by an observable requirement? [Coverage, Spec §Background, §FR-002]
- [x] CHK023 Is the test layer for each behaviour named, with versions and quality observable without a browser and downloaded width and bytes observable only in a browser? [Traceability, Spec §FR-008]
- [x] CHK024 Is the fixture-content rule consistent with the convergence page used as the SC-002 baseline? [Conflict, Spec §FR-008, §SC-002]
- [x] CHK025 Are out-of-scope items (lead story, hero, project images, pagination count, budget value) stated as boundaries? [Completeness, Spec §Out of Scope]
