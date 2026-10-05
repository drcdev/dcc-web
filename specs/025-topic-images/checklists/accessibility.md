# Accessibility Requirements Quality Checklist: Series Images and Dark-Mode Card Outlines

**Purpose**: Validate that the accessibility requirements (WCAG 2.2 AA) are complete, clear and measurable before tasks are written
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

## Non-Text Contrast of Outlines

- [ ] CHK001 Is the 3:1 non-text contrast threshold stated for every outline the feature adds (series tile, series banner, post card, lead story)? [Completeness, Spec §FR-012]
- [ ] CHK002 Is the background each outline is measured against defined (page background, not card fill) and the same in spec and plan? [Clarity, Spec §FR-012, Plan §Constitution X]
- [ ] CHK003 Are the contrast figures for the series 300 shades recorded as requirements rather than assumed ("already at least 3:1 as the marker")? [Assumption, Spec §FR-011]
- [ ] CHK004 Is "thin" quantified with a width, given the spec defers the width to the plan? [Ambiguity, Spec §FR-011]
- [ ] CHK005 Is it clear whether the 3:1 rule also applies to the text-only card's existing topic-colour border? [Gap, Spec §FR-010]
- [ ] CHK006 Is the outline-against-page contrast distinguished from any outline-against-card-fill contrast? [Clarity, Spec §FR-012]

## Text Contrast on Cards

- [ ] CHK007 Are 4.5:1 text requirements stated for every text-on-card pair, including the series eyebrow, description and "Read <series>" link? [Coverage, Spec §FR-012]
- [ ] CHK008 Is text contrast defined for any text that sits over or near the image strip? [Gap, Spec §FR-003]

## Decorative Images

- [ ] CHK009 Is the decorative classification consistent across tile and strip (empty alternative on both)? [Consistency, Spec §FR-006]
- [ ] CHK010 Is it specified that the images are not focusable, not links and not announced, in both placements? [Completeness, Spec §FR-006]
- [ ] CHK011 Is the behaviour defined when an image fails to load, for readers who rely on the surrounding text only? [Edge Case, Spec §Edge Cases]
- [ ] CHK012 Is the heading structure on series pages specified so the image strip does not change the `h1` or reading order? [Gap, Spec §US2]

## Forced Colours and Contrast Preferences

- [ ] CHK013 Is "visible edge" in forced-colours mode defined measurably (system colour, minimum width)? [Measurability, Spec §FR-014]
- [ ] CHK014 Is forced-colours behaviour specified for light and dark themes and for every outlined card type? [Coverage, Spec §FR-014]
- [ ] CHK015 Are requirements defined for the images themselves in forced-colours mode (kept, hidden or adjusted)? [Gap]
- [ ] CHK016 Are requirements stated for the `prefers-contrast: more` case, or is its exclusion recorded? [Gap]

## Layout Stability and Reflow

- [ ] CHK017 Is "reserve their space before they load" tied to a measurable layout-shift limit? [Measurability, Spec §FR-008]
- [ ] CHK018 Are 320 px reflow and no-horizontal-scroll requirements specified for tile and strip (WCAG 1.4.10)? [Coverage, Spec §FR-005]
- [ ] CHK019 Are text-resize and 200 percent zoom requirements defined for the tile and banner now that text sits in an inner padded block? [Gap]
- [ ] CHK020 Is the requirement that no information is carried by the image alone stated, so the images can be hidden by user settings? [Completeness, Spec §Assumptions]

## Verification Coverage

- [ ] CHK021 Are the page templates the automated accessibility checks must cover (landing, both series, series page 2, topic page) enumerated? [Traceability, Spec §SC-004]
