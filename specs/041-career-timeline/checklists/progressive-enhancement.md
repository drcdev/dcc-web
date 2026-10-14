# Progressive Enhancement and Filter Behaviour Checklist: Interactive career timeline

**Purpose**: Validate that the no-JavaScript baseline, the enhanced filter and the state transitions between them are fully and consistently specified
**Created**: 2026-10-14
**Feature**: [spec.md](../spec.md)

**Note**: Each item tests the quality of the written requirements, not the implementation. Performance items test the budget requirement, not measured results.

## Baseline without JavaScript

- [x] CHK001 Is the no-JS baseline defined as a complete set of requirements, not only "readable"? [Completeness, Spec §FR-007, §FR-014]
- [x] CHK002 Is it specified how the filter is absent without JS, and what a visitor sees where the filter would be (nothing, no dead control, no layout gap)? [Clarity, Spec §FR-014]
- [x] CHK003 Is the failure case "script fails to load or errors after the page renders" covered, so the page stays usable? [Edge Case, Gap, Spec §FR-014]
- [x] CHK004 Is the moment the filter becomes visible specified, to prevent a flash or layout shift when it is revealed? [Gap, Spec §FR-017, §SC-005]
- [x] CHK005 Is it specified that the server-rendered state of every step is closed and undithered, consistent with FR-007 and FR-012? [Consistency, Spec §FR-007, §FR-012]

## Filter state model

- [x] CHK006 Is the complete state model defined (All, each category, the open or closed state of each step), including the rule for steps opened by hand? [Completeness, Spec §FR-010, §FR-012]
- [x] CHK007 Is the outcome of choosing the same category twice, or "All" when already on "All", defined? [Edge Case, Gap]
- [x] CHK008 Is the outcome defined for a hand-opened non-matching step that is then followed by another category change (does it close, stay, or re-collapse)? [Edge Case, Spec §FR-011]
- [x] CHK009 Is a matching step that the visitor closes by hand while filtered defined (stays closed, or reopens on next change)? [Edge Case, Gap, Spec §FR-010]
- [x] CHK010 Is "returns to closed" in FR-012 consistent with a visitor's hand-opened steps being collapsed on return to "All"? [Conflict, Spec §FR-012, §US3-4]
- [x] CHK011 Is the requirement "one category at a time" stated as a rule of the control, not only as an assumption? [Ambiguity, Spec §Assumptions]
- [x] CHK012 Is it specified that the filter state is neither persisted, nor in the address, nor restored by back or forward navigation or a reload? [Clarity, Spec §Assumptions]
- [x] CHK013 Is the case "category chosen, zero steps match" excluded by FR-009, and is the behaviour if it happened anyway defined? [Edge Case, Spec §FR-009, §US3-7]
- [x] CHK014 Is a step whose only matching item is an award (Awards category) defined consistently with items in the Achievements and Leadership lists? [Consistency, Spec §FR-008, §FR-010]
- [x] CHK015 Is "highlight" defined as a distinct, measurable state for items, with its relation to the dither on other steps? [Clarity, Spec §FR-010]

## Page-level consistency

- [x] CHK016 Is the page behaviour defined when the user prints, or toggles reduced motion or dark mode, while a category is chosen? [Edge Case, Spec §FR-015, §FR-018]
- [x] CHK017 Are the requirements for the 320 px, mid and wide layouts all stated, or only the narrow one? [Coverage, Spec §FR-017]
- [x] CHK018 Is the placement of the filter relative to the first step, and its behaviour on scroll (no sticky or overlapping requirement), stated? [Gap, Spec §FR-016]
- [x] CHK019 Is the long-list case defined (more steps than six in future), including whether the filter scales without new requirements? [Edge Case, Gap]

## Performance and security of the enhancement

- [x] CHK020 Is the performance requirement for the new script quantified against the named CI budget (script size, layout shift, interaction latency), not just "stays within"? [Measurability, Spec §FR-017, §SC-005]
- [x] CHK021 Is Core Web Vitals "good" tied to concrete thresholds and the filter's effect on layout shift and interaction responsiveness? [Clarity, Spec §SC-005]
- [x] CHK022 Is it stated that the feature adds no third-party script, cookie, storage or network request? [Completeness, Spec §Assumptions, constitution X]
- [x] CHK023 Are the content-security-policy implications of the new script and the dither styles stated as requirements or assumptions? [Assumption, Gap]
- [x] CHK024 Is the treatment of the content shown by the filter (text from content files only, never injected as markup) specified as a requirement? [Gap]
- [x] CHK025 Are the visual regression expectations (which states and themes are baselines) stated as requirements rather than left to the plan? [Gap, Spec §SC-003]
