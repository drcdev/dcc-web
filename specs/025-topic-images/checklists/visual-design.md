# Visual Design and Dark-Mode Consistency Requirements Checklist: Series Images and Dark-Mode Card Outlines

**Purpose**: Validate that the visual and dark-mode requirements are complete, consistent and unambiguous
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

## Scope of the Outline

- [ ] CHK001 Is the full list of cards that gain an outline enumerated, with each excluded surface (topic banners, home, projects, post title card) named? [Completeness, Spec §FR-010]
- [ ] CHK002 Is "post cards (wherever they appear)" reconciled with "cards outside the writing pages are not changed"? [Conflict, Spec §FR-010, Spec §Out of Scope]
- [ ] CHK003 Is it defined which post cards count as "text-only" versus "with a feature image"? [Ambiguity, Spec §FR-010]
- [ ] CHK004 Are related-post and other reused card placements (post pages) addressed for the new neutral edge? [Coverage, Spec §Out of Scope]

## Outline Style Consistency

- [ ] CHK005 Is the outline colour for tiles and banners tied to a single named source (the series marker's dark outline) in both spec and plan? [Consistency, Spec §FR-011]
- [ ] CHK006 Is the outline width stated as a number and consistent across tile, banner, post card and lead story? [Clarity, Spec §FR-011]
- [ ] CHK007 Is the neutral outline colour for post cards and lead story specified by token, not only by contrast ratio? [Clarity, Spec §FR-010]
- [ ] CHK008 Is the "no second outline" rule for text-only cards specified for hover, focus and active states too? [Edge Case, Spec §Edge Cases]
- [ ] CHK009 Are hover and focus-visible states for the tile's link and for outlined cards defined so they do not clash with the new outline? [Gap]
- [ ] CHK010 Is the interaction between the outline and the rounded-corner clipping specified (outline inside or outside the clip)? [Gap, Spec §FR-002]

## Joined Strip and Banner

- [ ] CHK011 Are the strip and banner requirements stated as one joined card with exact corner treatment (top corners rounded on strip, square on banner)? [Clarity, Spec §FR-003]
- [ ] CHK012 Is "about 4:1" given a tolerance so it can be verified objectively? [Measurability, Spec §FR-003]
- [ ] CHK013 Is the crop anchor ("centred") defined, and is the crop's effect on each image's focal content confirmed acceptable? [Assumption, Spec §Clarifications]
- [ ] CHK014 Is the spacing between the joined card and the first post card stated as unchanged? [Gap]
- [ ] CHK015 Is the joined-card requirement consistent between the user story, FR-003, key entities and edge cases? [Consistency]

## Tiles

- [ ] CHK016 Is the tile's internal layout (image, then padded text) specified for both stacked and side-by-side arrangements? [Completeness, Spec §FR-002]
- [ ] CHK017 Is tile height behaviour defined when two columns hold text of different lengths? [Gap]
- [ ] CHK018 Is the tile order (Convergence first) retained as a requirement? [Consistency, Spec §Context]

## Light Mode and Palette

- [ ] CHK019 Is "look as they do today in light mode" objectively defined (pixel-identical apart from images)? [Measurability, Spec §FR-013, Spec §SC-003]
- [ ] CHK020 Is the major-change classification consistent between spec assumptions and plan, and is the design doc update a stated requirement? [Consistency, Plan §Major change]
- [ ] CHK021 Is "only existing palette colours" verifiable against a named list of tokens? [Measurability, Spec §FR-015]
- [ ] CHK022 Are the pictures' own colours against the lavender and sage fills addressed in both themes? [Gap]

## Baselines

- [ ] CHK023 Are the visual baselines expected to change, and those required not to change, enumerated with reasons? [Completeness, Plan §Visual baselines]
- [ ] CHK024 Is a requirement stated that both platforms' baselines are refreshed together? [Completeness, Spec §Assumptions]
