# Accessibility (WCAG 2.2 AA) Checklist: Setup Walkthrough and Setup Check

**Purpose**: Validate that the requirements for the placeholder page and for the setup check's / walkthrough's human-readable output are complete, unambiguous and testable against WCAG 2.2 AA before implementation, per Constitution Principle X.
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the requirements as written in spec.md, plan.md and the constitution — it does not test the built page or CLI output. Evaluated 2026-09-28; gaps were closed in spec.md (see FR-026 to FR-039, the setup item table and SC-008).

## Requirement Completeness

- [x] CHK001 - Does FR-018 (deployable placeholder) itself state a WCAG 2.2 AA bar, or does the requirement rely entirely on Constitution Principle X without restating it? [Completeness, Spec §FR-018, Constitution X]
- [x] CHK002 - Are semantic-structure requirements (landmarks, heading levels, page `<title>`) specified anywhere for the placeholder page? [Gap]
- [x] CHK003 - Are color-contrast minimums specified for placeholder page text/background, given the Tailwind design system is explicitly deferred to a later feature? [Gap, Spec §Plan "Technology Constraints" Tailwind deferred]
- [x] CHK004 - Is a `lang` attribute / language requirement specified for the placeholder page? [Gap]
- [x] CHK005 - Are text-resize / reflow-at-200%-zoom requirements specified for the placeholder page? [Gap]
- [x] CHK006 - Are accessible-name/alt-text requirements defined for any non-text content on the placeholder page, or is the page explicitly required to carry none? [Gap]
- [x] CHK007 - Are accessibility requirements defined for the setup check's human-readable report output (terminal/CLI text), separate from the page requirements? [Gap, Spec §FR-001, FR-002]

## Requirement Clarity

- [x] CHK008 - Is "plain language" (Constitution "Development Workflow") specific enough to be verified for the report/walkthrough copy, or does it need an explicit readability criterion to satisfy WCAG's "Readable" success criteria? [Ambiguity, Constitution "Development Workflow"]
- [x] CHK009 - Does any requirement name the exact automated accessibility standard/ruleset level (WCAG 2.2 AA specifically, not just "accessibility checks") that the release gate enforces on the placeholder page? [Clarity, Constitution Principle X]

## Requirement Consistency

- [x] CHK010 - Are Constitution Principle X ("every page meets WCAG 2.2 AA") and Principle V ("no client-side JavaScript unless genuinely needed") reconciled in a requirement that keyboard/no-JS operability of the placeholder page is explicit rather than assumed? [Consistency, Constitution V, X, Spec §FR-018]
- [x] CHK011 - Is status communication (complete/missing/pending/could-not-check) in FR-001 required to be conveyed by more than color alone, consistent with WCAG's "use of color" success criterion? [Consistency, Spec §FR-001]

## Acceptance Criteria Quality

- [x] CHK012 - Does Success Criteria include a measurable, testable accessibility outcome (e.g., zero WCAG 2.2 AA violations on the placeholder page), or is accessibility only inferred from the constitution without an SC entry? [Measurability, Spec §Success Criteria]
- [x] CHK013 - Is there an acceptance scenario or requirement stating what happens when an automated accessibility check finds a violation — is that explicitly a release-gate failure, or only inferred via Principle II? [Gap]

## Scenario Coverage

- [x] CHK014 - Are focus-order / focus-visible requirements addressed for any interactive element reachable during the walkthrough's pause-and-confirm prompts (FR-009), given the walkthrough runs in Don's terminal session? [Gap, Spec §FR-009, Assumptions "Walkthrough form"] (n/a: the walkthrough's pause prompts are Claude Code's own terminal UI, not built by this feature; the feature adds no focusable UI of its own except the placeholder link, whose focus requirements are in FR-032; the answers themselves are specified in FR-009)
- [x] CHK015 - Does the spec address accessibility of the walkthrough's per-step explanation text (what/where/how, FR-008) — e.g., structured/navigable rather than an undifferentiated block — for a screen-reader or terminal-reader user? [Gap, Spec §FR-008]
- [x] CHK016 - Is there a requirement addressing how a non-visual/screen-reader terminal user distinguishes "could-not-check" from "missing" in the report output, beyond wording alone? [Gap, Coverage]

## Edge Case Coverage

- [x] CHK017 - Is the interaction between "no secret value ever shown" (FR-024) and accessible error messaging specified — must could-not-check / error text remain clear to assistive-technology users while still redacting values? [Gap, Coverage]
- [x] CHK018 - Does the spec define an accessibility requirement for the pre-launch review address (`new.doncoleman.ca`, FR-020) page itself, or is it assumed identical to the production placeholder without saying so? [Gap, Spec §FR-020]

## Notes

- Generated non-interactively (auto mode); no user interview was conducted. Scope was inferred from the caller's brief: WCAG 2.2 AA for (a) the placeholder page and (b) human-readable check/walkthrough output.
- Depth: standard: broad completeness/clarity/consistency sweep rather than an exhaustive WCAG success-criterion-by-success-criterion audit.
- Audience/timing: spec/plan authors and reviewer, before `/speckit-tasks`.
- Open risk: the spec currently relies on Constitution Principle X for the accessibility bar rather than restating it in FR-018 or Success Criteria — several items above (CHK001, CHK012) flag that this indirection may leave the bar untestable at the spec level.
