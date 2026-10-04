# Accessibility Requirements Quality Checklist: Self-hosted Inter web fonts

**Purpose**: Validate that the accessibility requirements for the font change are complete, clear and measurable (WCAG 2.2 AA).
**Created**: 2026-10-03
**Feature**: [spec.md](../spec.md)

## Text Rendering and Fallback

- [ ] CHK001 - Is the readable-fallback requirement specific about what the visitor sees before Inter loads and when it fails? [Clarity, Spec §FR-005]
- [ ] CHK002 - Is "text is visible immediately" defined, including whether any invisible-text period is allowed? [Ambiguity, Spec §User Story 2 Scenario 3]
- [ ] CHK003 - Are requirements defined for characters outside the shipped set so they stay legible in the fallback stack? [Coverage, Spec §Edge Cases]
- [ ] CHK004 - Is the rule that Inter text never uses a synthesized face stated separately from the rule that fallback text may synthesize? [Consistency, Spec §FR-003, §FR-017]
- [ ] CHK005 - Is it specified how emphasis (italic, bold, bold italic) stays distinguishable in every state: Inter loaded, loading and failed? [Completeness, Spec §FR-003]
- [ ] CHK006 - Are requirements for unshipped weights (500, 600, 800) clear about which headings or labels lose visible weight contrast? [Clarity, Spec §FR-017]
- [ ] CHK007 - Does the plan list every component whose weight changes, so a loss of hierarchy cues can be assessed? [Traceability, Spec §Assumptions]
- [ ] CHK008 - Is the requirement that code and preformatted blocks keep the body font reconciled with legibility needs for code (for example distinguishing similar characters)? [Gap, Spec §FR-008]

## Contrast, Colour and Modes

- [ ] CHK009 - Is "contrast unchanged" stated as a measurable requirement rather than an assumption? [Measurability, Spec §Edge Cases]
- [ ] CHK010 - Is it specified that Inter's different glyph weight and width must not require colour or size changes to keep contrast ratios compliant? [Gap]
- [ ] CHK011 - Are forced-colours and dark-mode requirements defined for the new font, not just stated as unaffected? [Coverage, Spec §Edge Cases]
- [ ] CHK012 - Is focus indicator visibility required to be unchanged where text width changes layout? [Gap, Spec §Edge Cases]

## Zoom, Reflow and Spacing

- [ ] CHK013 - Are 200% zoom and 320 CSS px reflow requirements stated for pages whose text is now wider or narrower than before? [Gap, Spec §FR-010]
- [ ] CHK014 - Are text-spacing override requirements (WCAG 1.4.12) defined for the new font and fallback faces? [Gap]
- [ ] CHK015 - Is it specified that user font-size and browser minimum-size settings still apply to Inter and the fallback faces? [Gap]
- [ ] CHK016 - Is the effect of metric-adjusted fallback faces on line height and text size defined so it cannot undercut user text-size settings? [Clarity, Spec §FR-005]

## Acceptance and Scope

- [ ] CHK017 - Is the accessibility success criterion tied to every page template and to a named tool or rule set? [Measurability, Spec §SC-005]
- [ ] CHK018 - Is the accessibility requirement consistent between FR-010, SC-005 and the User Story 2 acceptance scenarios? [Consistency]
- [ ] CHK019 - Is the scope exclusion for text inside images (SVG diagrams, og image) paired with a requirement that those images keep their alt text and legibility? [Gap, Spec §FR-001]
- [ ] CHK020 - Are JavaScript-off requirements for font application and readability defined? [Coverage, Spec §FR-012]
- [ ] CHK021 - Is the screen-reader impact of the change (none expected) stated as an assumption and not left implicit? [Assumption]
- [ ] CHK022 - Is the character coverage limit (Latin-1 plus listed punctuation) assessed against the site's actual content, including names with other diacritics? [Assumption, Spec §FR-002]
