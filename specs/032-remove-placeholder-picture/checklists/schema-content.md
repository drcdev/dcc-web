# Schema and Content Validation Checklist: Remove the project placeholder picture option

**Purpose**: Unit tests for the requirements on rejecting the removed setting and keeping published content unchanged.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 Are all picture locations that must reject `placeholder` enumerated (list picture `visual`, story `visuals` entries) for both kinds (image, diagram)? [Completeness, Spec §FR-001]
- [ ] CHK002 Is the required error content defined precisely enough (names the file and the setting) to be asserted without guessing wording? [Clarity, Spec §FR-002]
- [ ] CHK003 Does the spec say where the error must surface (build failure versus editor or type check) and which of these is in scope? [Gap, Spec §FR-002]
- [ ] CHK004 Is the behaviour for `placeholder: false` stated, and is it consistent with `placeholder: true`? [Consistency, Spec Edge Cases]
- [ ] CHK005 Is it stated what happens when a published project is found to still set `placeholder`? [Assumption, Spec Assumptions]

## Requirement Clarity and Consistency

- [ ] CHK006 Is "consistent with how other unknown settings fail" tied to a named existing behaviour that a reader can compare against? [Ambiguity, Spec §FR-002]
- [ ] CHK007 Do the plan's strict-object mechanism and the spec's "fails like any other unknown or removed setting" agree for every picture shape? [Consistency, Plan Summary]
- [ ] CHK008 Is "published project content builds and renders unchanged" defined measurably (which projects, which pages, compared to what)? [Measurability, Spec §FR-008]
- [ ] CHK009 Does SC-001 ("100% of project files") state how that population is bounded and observed? [Measurability, Spec §SC-001]

## Scenario and Edge Case Coverage

- [ ] CHK010 Are requirements defined for a file that sets `placeholder` alongside another invalid setting (which error is reported)? [Coverage, Gap]
- [ ] CHK011 Is the rule for broken fixtures that used `placeholder` stated so each still fails only for its intended reason? [Completeness, Spec §FR-005]
- [ ] CHK012 Is the decision not to add a new broken fixture justified against Story 1's independent test ("build with a project file that sets placeholder")? [Conflict, Plan Test placement]
- [ ] CHK013 Is the fate of the `data-visual-mark` style hook specified as a requirement rather than left to the plan? [Ambiguity, Spec Follow-up]
- [ ] CHK014 Are the type-level consequences (removed inferred property) bounded to a stated set of readers? [Dependency, Plan Risks]

## Constitution Alignment

- [ ] CHK015 Is invalid content failing the build with a clear message traceable to Principle VI in the plan? [Traceability, Plan Constitution Check]
- [ ] CHK016 Does the plan name the Astro documentation page supporting the schema approach, as Development Workflow requires? [Traceability, Plan Principle IV]
- [ ] CHK017 Is the test layer for each behaviour named once, with a written reason for any second layer? [Consistency, Plan Test placement]
- [ ] CHK018 Is the not-a-major-change classification supported by criteria from Principle III, one by one? [Completeness, Plan Principle III]
