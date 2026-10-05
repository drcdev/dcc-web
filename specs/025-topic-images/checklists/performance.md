# Performance Requirements Quality Checklist: Series Images and Dark-Mode Card Outlines

**Purpose**: Validate that image budgets, LCP and CLS requirements are quantified and measurable
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [research.md](../research.md)

## Image Weight

- [ ] CHK001 Is "a small fraction of its 1.5 MB source" replaced by a number in the plan that SC-005 can be checked against? [Clarity, Spec §SC-005]
- [ ] CHK002 Are the per-file cap (25 KB) and per-phone-download cap (8 KB) defined with the device width and pixel density they assume? [Clarity, Plan §Performance Goals]
- [ ] CHK003 Are delivered widths and formats for each placement (tile, strip) specified, with the reason each suffices for large and high-density screens? [Completeness, Spec §FR-007]
- [ ] CHK004 Is acceptable image quality (visible degradation) defined, not only byte size? [Gap, Spec §FR-007]
- [ ] CHK005 Is the requirement that the 1.5 MB source is never served stated so it can be checked in the built output? [Measurability, Spec §FR-007]
- [ ] CHK006 Are the source files' repository weight and storage location specified, given they add about 3 MB? [Assumption, Plan §Cost]

## Budget

- [ ] CHK007 Are the existing budget limits (total bytes, JS, long tasks) restated per affected template with current baseline figures? [Completeness, Spec §SC-004]
- [ ] CHK008 Is the expected byte increase per template documented with a margin to the 150 KB limit? [Measurability, Plan §Budget expectations]
- [ ] CHK009 Is it specified which templates the budget check covers (landing, both series pages, later series pages)? [Coverage, Gap]
- [ ] CHK010 Is recording before and after figures in the PR stated with the metrics to record? [Traceability, Plan §Budget expectations]

## Largest Contentful Paint

- [ ] CHK011 Is the LCP target on mobile stated for `/writing/` and the series pages with the throttling profile it assumes? [Clarity, Plan §Performance Goals]
- [ ] CHK012 Is the expected LCP element on each template identified, including the move from lead story to tile image on `/writing/`? [Completeness, Plan §Budget expectations]
- [ ] CHK013 Are loading priority rules specified for one image only, so two images do not compete at the top? [Clarity, Plan §Design]
- [ ] CHK014 Is the fallback lever if LCP tightens defined with a trigger threshold? [Edge Case, Plan §Budget expectations]
- [ ] CHK015 Is the loading behaviour of the second tile, which can sit below the fold when tiles stack, specified? [Gap]

## Layout Shift

- [ ] CHK016 Is the CLS limit (below 0.1) tied to these templates and to the images specifically? [Measurability, Spec §FR-008]
- [ ] CHK017 Is the space reservation requirement independent of whether CSS or the image loads first? [Clarity, Spec §FR-008]
- [ ] CHK018 Is reserved-space behaviour defined for the cropped strip as the viewport narrows? [Coverage, Spec §Edge Cases]
- [ ] CHK019 Is layout behaviour specified when an image fails to load (space kept or collapsed)? [Edge Case, Spec §Edge Cases]

## Cost and Delivery

- [ ] CHK020 Are zero added running cost and platform-native image delivery stated as requirements for Principle IX? [Completeness, Plan §Constitution Check]
- [ ] CHK021 Is a caching requirement for the generated image files stated or deliberately deferred to the existing header contract? [Gap]
