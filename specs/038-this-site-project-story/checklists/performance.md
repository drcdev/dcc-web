# Performance Budget Checklist: This site as a project story

**Purpose**: Validate that the requirements for picture and diagram weight and the story page budget are complete and measurable
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md)

## Budget Definition

- [ ] CHK001 Is the 150 KB page budget stated in the spec itself, not only in the plan, with the measure (total transfer, which viewport, which theme)? [Gap, Spec §SC-005]
- [ ] CHK002 Is "passes the existing performance-budget checks" measurable without naming the check that applies to this page? [Measurability, Spec §SC-005]
- [ ] CHK003 Is it specified that the story page, not only the list page, must stay in budget, given the list picture is reused beside Problem? [Coverage, Spec §FR-006, §FR-014]
- [ ] CHK004 Is the Core Web Vitals "good" threshold for mobile applied to this page as a requirement? [Gap, Constitution X]

## Pictures

- [ ] CHK005 Is "the same size as the other stories' list pictures" given exact dimensions and aspect ratio? [Clarity, Spec §FR-014]
- [ ] CHK006 Is a maximum file size or encoded weight set for the screenshot source and for the delivered variants? [Gap, Spec §FR-006]
- [ ] CHK007 Are requirements stated for which pictures load lazily and which (the largest above-the-fold image) must not? [Gap]
- [ ] CHK008 Is the number of pictures on the story page bounded ("at least one" has no upper limit)? [Ambiguity, Spec §FR-006]
- [ ] CHK009 Is screenshot metadata stripping a requirement in the spec, or only a plan detail? [Gap, Spec §FR-014]

## Diagram

- [ ] CHK010 Is the diagram size cap (16 KB) a spec requirement with its source, since FR-006 only says "SHOULD have a diagram"? [Gap, Spec §FR-006]
- [ ] CHK011 Is it clear whether the diagram's font handling may add a font request, given the no third-party-asset rule? [Ambiguity, Constitution X]
- [ ] CHK012 Is the fallback if the diagram would break the budget defined (drop the diagram, shrink it)? [Edge Case, Gap]

## Scripts and Layout Stability

- [ ] CHK013 Is "no client-side JavaScript added" stated as a requirement for the story page? [Gap, Constitution V]
- [ ] CHK014 Are image width and height requirements defined to prevent layout shift? [Gap, Spec §FR-006]
- [ ] CHK015 Is the draft state's effect on build output (production excludes the story and its images) specified so the production budget is unaffected? [Coverage, Spec §SC-001]
