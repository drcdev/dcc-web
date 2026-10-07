# Accessibility Checklist (WCAG 2.2 AA): Plain Markdown for standard content

**Purpose**: Unit tests for the accessibility requirements around heading structure, linkable headings, target size and focus
**Created**: 2026-10-07
**Feature**: [spec.md](../spec.md)

**Depth**: Standard. **Audience**: PR reviewer (Don). Requirements quality only. Principle X requires WCAG 2.2 AA on every page.

## Heading Structure

- [ ] CHK001 Is the heading hierarchy of the rewritten page specified end to end, including the page title level (h1) above the body's h2 and h3? [Completeness, Spec §US1 Scenario 4, FR-005]
- [ ] CHK002 Is "no level is skipped" stated for the whole page and not only for the body, and can it be measured? [Measurability, Spec §US1 Scenario 4]
- [ ] CHK003 Are heading level requirements defined for other pages and posts, given authors now pick levels freely, or is the lack of enforcement explicitly accepted? [Gap, Spec §Follow-up]
- [ ] CHK004 Is it specified that heading text on the rewritten page stays unique enough to be understandable out of context (for example repeated "Consulting")? [Ambiguity, Spec §Edge Cases]
- [ ] CHK005 Are requirements stated for heading structure inside the remaining components (lead paragraph, call to action, side image)? [Coverage, Gap]
- [ ] CHK006 Is the removal of the unnamed wrapper regions addressed as a landmark and structure requirement (nothing a screen reader relied on is lost)? [Completeness, Plan §Constitution Check X]

## Linkable Headings

- [ ] CHK007 Is the requirement that every heading has an address accompanied by a requirement that the address is stable and valid as an in-page link target (unique, non-empty, not starting with a digit if relevant)? [Clarity, Spec §FR-006]
- [ ] CHK008 Is the behaviour on opening a heading address specified, including that focus or scroll position lands at the heading and the sticky header does not cover it? [Gap, Spec §US1 Scenario 1]
- [ ] CHK009 Is the no-JavaScript case required for heading addresses, consistent with Principle V? [Coverage, Gap]
- [ ] CHK010 Are requirements defined for reduced-motion users when a heading address triggers scrolling? [Gap]
- [ ] CHK011 Is the decision not to add a visible "link to this heading" control recorded so that the absence of a focusable control is intentional? [Assumption, Spec §Follow-up]

## Target Size (2.5.8) and Focus (2.4.7, 2.4.11)

- [ ] CHK012 Are target size requirements stated for the call to action, and is the exemption for inline links in running text recorded where the spec relies on it? [Clarity, Plan §Constitution Check II]
- [ ] CHK013 Are focus visibility requirements defined for inline Markdown links now used in place of the offering link option? [Gap, Spec §Edge Cases]
- [ ] CHK014 Is a requirement stated that focused elements are not obscured by the sticky header when tabbing through the rewritten page? [Gap]
- [ ] CHK015 Is the link appearance requirement (distinguishable from surrounding text, not by colour alone) stated for Markdown links styled by typography? [Gap, Spec §FR-007]
- [ ] CHK016 Is the tab order requirement stated for the rewritten page (document order, no new tab stops from headings)? [Gap]

## Content and Contrast

- [ ] CHK017 Are contrast requirements stated for text in the typography styles that now carry the page (body text, bold note, list, links) in light and dark themes? [Coverage, Spec §FR-007]
- [ ] CHK018 Are list semantics required for the "What I don't do" items so they are announced as a list? [Clarity, Spec §FR-004]
- [ ] CHK019 Is reflow at narrow widths and 200% zoom required for the new layout, given the offerings layout is gone? [Gap, Spec §Assumptions]

## Verification Coverage

- [ ] CHK020 Is it stated which automated accessibility checks must cover the rewritten page and the sections fixture, given the page is a draft? [Traceability, Plan §Constitution Check X]
- [ ] CHK021 Is it stated whether automated checks run on the draft page in all environments, or only where drafts render? [Ambiguity, Spec §Edge Cases]
- [ ] CHK022 Are accessibility requirements for the remaining sections' unchanged behaviour referenced to existing criteria rather than restated or lost? [Traceability, Spec §FR-003]
