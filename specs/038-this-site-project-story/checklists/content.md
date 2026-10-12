# Content Accuracy and Voice Checklist: This site as a project story

**Purpose**: Validate that the requirements for the story's facts, sources and voice are complete, clear and traceable
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md)

## Factual Traceability

- [x] CHK001 Is each figure the story may state (31 minutes, about 6 minutes, 6:15, run ids, dates) tied to a named repository record? [Traceability, Spec §Assumptions, §SC-003]
- [x] CHK002 Is "about 31" and "about 6" defined against the exact recorded values (31 min, 6 min 15 s) so rounding is unambiguous? [Clarity, Spec §FR-003]
- [x] CHK003 Does the spec say which record is authoritative if the chore report, the PRs and the CI runs disagree? [Gap, Spec §FR-004]
- [x] CHK004 Is the list of "agent pipelines (feature, small-change, bug and maintenance)" matched to a named source so the count and names can be checked? [Traceability, Spec §FR-003]
- [x] CHK005 Is the single-approval rule pinned to a specific constitution version and ruleset file rather than "as it now stands"? [Clarity, Spec §Assumptions]
- [x] CHK006 Is the requirement that the notes comment names its fact sources specified with the form the other stories use? [Completeness, Spec §FR-004]
- [x] CHK007 Is the "since 2026-10-09" live date and the 2026-09-28 start date each traced to a record? [Traceability, Spec §FR-007]
- [x] CHK008 Are requirements defined for how a figure is dated or rounded so it stays true as the work continues? [Coverage, Spec §Edge Cases]

## Interview Fidelity

- [x] CHK009 Is it clear which parts of the copy must come only from the interview answers and which may come from the record? [Clarity, Spec §FR-010, §Story source material]
- [x] CHK010 Is "close to verbatim" for Don's quoted lesson measurable (exact wording kept, or allowed edits stated)? [Measurability, Spec §Story source material]
- [x] CHK011 Are the four Options columns required to match the four recorded constraints by name and order? [Consistency, Spec §FR-002, §Story source material]
- [x] CHK012 Is the requirement that the rebuild is not framed as an agent experiment stated as a testable copy rule, not only as a note? [Gap, Spec §Story source material]
- [x] CHK013 Is the Cadence-linked pipeline-origin sentence consistent with the claim in Cadence's own story ("now build this website")? [Consistency, Spec §FR-008]

## Voice and Wording

- [x] CHK014 Is "plain language with no hype or filler" backed by criteria a reviewer can apply (no adjectives of praise, no filler openers, short sentences)? [Ambiguity, Spec §FR-009]
- [x] CHK015 Are the markers of AI-sounding copy Don cuts (from the work-with-me precedent) listed or referenced? [Gap, Spec §FR-009]
- [x] CHK016 Is first-person voice defined for the invitation as well as the four parts? [Completeness, Spec §FR-009, §FR-013]
- [x] CHK017 Is the role wording rule (Director, Data Infrastructure and Architecture, not Cloud Architect) stated as a requirement, not only an edge case? [Consistency, Spec §Edge Cases]
- [x] CHK018 Is the invitation's audience ("teams weighing agent-driven delivery with human review") specific enough to write one call to action? [Clarity, Spec §FR-013]

## Links, Status and Metadata

- [x] CHK019 Is the repository-visibility assumption given an owner and a review trigger if it changes? [Assumption, Spec §Edge Cases]
- [x] CHK020 Are requirements consistent between "no link to the site's own host" and the title "doncoleman.ca" appearing as plain text? [Consistency, Spec §Edge Cases, §FR-013]
- [x] CHK021 Is the one-line problem and description requirement defined, since the schema fields are named but their content is not? [Gap, Spec §Key Entities]
- [x] CHK022 Is the draft-at-merge requirement consistent with acceptance scenario 1, which assumes publication? [Consistency, Spec §FR-011, §US1]
