# Performance Budget Checklist: This site as a project story

**Purpose**: Validate that the requirements for picture and diagram weight and the story page budget are complete and measurable
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md)

## Budget Definition

- [x] CHK001 Is the 150 KB page budget stated in the spec itself, not only in the plan, with the measure (total transfer, which viewport, which theme)? [Gap, Spec §SC-005]
- [x] CHK002 Is "passes the existing performance-budget checks" measurable without naming the check that applies to this page? [Measurability, Spec §SC-005]
- [x] CHK003 Is it specified that the story page, not only the list page, must stay in budget, given the list picture is reused beside Problem? [Coverage, Spec §FR-006, §FR-014]
- [x] CHK004 Is the Core Web Vitals "good" threshold for mobile applied to this page as a requirement? [Gap, Constitution X]

## Pictures

- [x] CHK005 Is "the same size as the other stories' list pictures" given exact dimensions and aspect ratio? [Clarity, Spec §FR-014]
- [x] CHK006 Is a maximum file size or encoded weight set for the screenshot source and for the delivered variants? [Gap, Spec §FR-006]
- [x] CHK007 Are requirements stated for which pictures load lazily and which (the largest above-the-fold image) must not? [Gap]
- [x] CHK008 Is the number of pictures on the story page bounded ("at least one" has no upper limit)? [Ambiguity, Spec §FR-006]
- [x] CHK009 Is screenshot metadata stripping a requirement in the spec, or only a plan detail? [Gap, Spec §FR-014]

## Diagram

- [x] CHK010 Is the diagram size cap (16 KB) a spec requirement with its source, since FR-006 only says "SHOULD have a diagram"? [Gap, Spec §FR-006]
- [x] CHK011 Is it clear whether the diagram's font handling may add a font request, given the no third-party-asset rule? [Ambiguity, Constitution X]
- [x] CHK012 Is the fallback if the diagram would break the budget defined (drop the diagram, shrink it)? [Edge Case, Gap]

## Scripts and Layout Stability

- [x] CHK013 Is "no client-side JavaScript added" stated as a requirement for the story page? [Gap, Constitution V]
- [x] CHK014 Are image width and height requirements defined to prevent layout shift? [Gap, Spec §FR-006]
- [x] CHK015 Is the draft state's effect on build output (production excludes the story and its images) specified so the production budget is unaffected? [Coverage, Spec §SC-001]
