# Headers and CSP Requirements Quality Checklist: Self-hosted Inter web fonts

**Purpose**: Validate the requirements for the Cache-Control rule, same-origin font loading and the unchanged Content Security Policy.
**Created**: 2026-10-03
**Feature**: [spec.md](../spec.md)

## Content Security Policy

- [ ] CHK001 - Is the requirement that the CSP is not loosened stated against a specific current policy so a change can be detected? [Measurability, Spec §FR-009]
- [ ] CHK002 - Is the assumption that `font-src 'self'` already permits the fonts validated against the committed headers file? [Assumption, Spec §Assumptions]
- [ ] CHK003 - Are the CSP directives that affect fonts (font-src, style-src, default-src, and any inline font-face styles) all identified? [Completeness, Spec §FR-009]
- [ ] CHK004 - Is "no policy violation" defined as observable in a browser on every page template? [Clarity, Spec §User Story 2 Scenario 5]
- [ ] CHK005 - Is the prohibition on third-party font or stylesheet requests consistent with the policy's own directives? [Consistency, Spec §FR-004, §SC-003]

## Cache-Control Rule

- [ ] CHK006 - Is the exact header value specified once and repeated identically wherever referenced? [Consistency, Spec §FR-015]
- [ ] CHK007 - Is the path pattern the rule applies to defined so it covers the four fonts and nothing else under `/_astro/`? [Clarity, Spec §FR-015, §Clarifications]
- [ ] CHK008 - Is the interaction between the new rule and existing header rules (precedence, duplicated headers) specified? [Gap]
- [ ] CHK009 - Is it defined how the header is confirmed on the preview and production deployments, not only locally? [Gap, Spec §SC-009]
- [ ] CHK010 - Are the other security headers required to remain unchanged on font responses? [Gap]
- [ ] CHK011 - Is the effect on font responses of cross-origin requirements (CORS) stated, given same-origin loading only? [Assumption]

## Privacy and Governance

- [ ] CHK012 - Is the no-third-party-request requirement verifiable on every page, including error pages? [Coverage, Spec §SC-003]
- [ ] CHK013 - Is it stated that the change touches no contact form, data collection or secrets? [Assumption, Spec §FR-014]
- [ ] CHK014 - Is the licence requirement (SIL OFL included with the files) specific about location and what must be included? [Clarity, Spec §FR-013]
- [ ] CHK015 - Is the major-change classification and the headers/CI configuration impact recorded consistently with Principle III? [Traceability, Spec §Background]
