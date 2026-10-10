# Feature Specification: Remove the project placeholder picture option

**Feature Branch**: `032-remove-placeholder-picture`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Project stories no longer need placeholder pictures. No published project uses the `placeholder` picture option, and the launch readiness check that looked for it is gone (#101). The option is removed from the project schema, along with the "Placeholder" mark on pictures and its styles. The fixture stories drop it as well, so the fixture story and project-row screenshots are refreshed. Split out of #101 because it changes the fixture visual baselines." (GitHub issue #137)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A project file can no longer mark a picture as a placeholder (Priority: P1)

Don (or an agent) writes and edits project stories as files. The `placeholder` setting on a
project picture was a stand-in marker for pictures that were not yet real. No published project
uses it, and nothing checks for it any more, so the setting is removed. A project file that still
sets it fails the build with a clear message naming the setting, the same way any other unknown
or removed setting does.

**Why this priority**: This is the whole change. Removing an option nobody uses keeps the project
file format small and leaves one less thing to document and test.

**Independent Test**: Build the site with a project file whose picture sets `placeholder`; the
build fails naming the file and the setting. Build the real site; it succeeds with every
published project unchanged.

**Acceptance Scenarios**:

1. **Given** a project file whose list picture (`visual`) sets `placeholder`, **When** the site is
   built, **Then** the build fails with an error naming the file and the `placeholder` setting.
2. **Given** a project file whose story picture (an entry in `visuals`) sets `placeholder`,
   **When** the site is built, **Then** the build fails with an error naming the file and the
   `placeholder` setting.
3. **Given** the real site content, **When** the site is built, **Then** the build succeeds and
   every published project page and index row looks as it did before.

---

### User Story 2 - Pictures in a story no longer show a "Placeholder" mark (Priority: P2)

A reader of a project story sees each picture beside the part it belongs to. The visible
"Placeholder" label above a picture, and the styles that only existed for it, are gone. Pictures
otherwise look and behave as before: images keep their alt text, diagrams keep their visible
description.

**Why this priority**: It follows directly from removing the setting; without it the mark could
never appear, so leaving its markup and styles behind would be dead code.

**Independent Test**: Open a fixture project story that shows pictures; no picture carries a
"Placeholder" mark, and images and diagrams still render with their alt text and description.

**Acceptance Scenarios**:

1. **Given** a project story with an image and a diagram beside its parts, **When** a reader opens
   it, **Then** no "Placeholder" text appears on any picture, the image has its alt text and the
   diagram has its visible description.
2. **Given** a reader using forced colours (high-contrast mode), **When** they open a project
   story, **Then** pictures and the other project elements keep their borders as before.

---

### User Story 3 - Fixtures, docs and visual baselines match the new format (Priority: P3)

The test fixture projects stop setting `placeholder`, the project authoring guide stops
describing it, and the fixture visual baselines that showed the mark are refreshed so the gate
compares against the new look.

**Why this priority**: Needed for the release gate to pass and for the guide to stay accurate,
but it carries no reader-visible behaviour of its own.

**Independent Test**: No fixture project or authoring guide mentions the `placeholder` picture
setting, and the visual check passes against the refreshed baselines on both platforms.

**Acceptance Scenarios**:

1. **Given** the fixture projects (valid and deliberately broken ones), **When** they are
   searched, **Then** none sets the `placeholder` picture setting, except a fixture added
   specifically to prove the setting is now rejected.
2. **Given** the project authoring guide, **When** Don reads it, **Then** it no longer describes a
   `placeholder` picture setting or a "Placeholder" mark.
3. **Given** the fixture story and project-row screenshots, **When** the visual check runs,
   **Then** it passes against baselines that show no "Placeholder" mark.

### Edge Cases

- A deliberately broken fixture currently sets `placeholder` but exists to test a different
  error: after the change it must still fail for its intended reason only, not for the removed
  setting.
- A project file sets `placeholder: false`: it fails the build like `placeholder: true`, because
  the setting itself no longer exists.
- The word "placeholder" appears elsewhere in the site for unrelated reasons (the draft page
  notice, form field hints, code comments, post text): those are untouched.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project file format MUST NOT accept a `placeholder` setting on any picture,
  whether the list picture or a story picture, of either kind (image or diagram).
- **FR-002**: A project file that sets `placeholder` on a picture MUST fail the build with an
  error that names the file and the setting, consistent with how other unknown settings fail.
- **FR-003**: Project story pictures MUST NOT render a "Placeholder" mark, and the markup and
  styles that existed only for that mark MUST be removed.
- **FR-004**: Pictures MUST otherwise render as before: images with their alt text, diagrams with
  their visible description, the first picture on a page loaded eagerly and the rest lazily.
- **FR-005**: Fixture projects MUST NOT set `placeholder`, and each broken fixture MUST still fail
  for the reason it was written to test.
- **FR-006**: The project authoring guide MUST NOT describe the `placeholder` setting or the
  "Placeholder" mark.
- **FR-007**: The fixture visual baselines affected by the change (the fixture story template and
  the project-row shots) MUST be refreshed on both platforms; baselines whose pixels do not change
  are left as they are.
- **FR-008**: Published project content MUST build and render unchanged.

### Key Entities

- **Project picture**: a picture in a project file, either the list picture shown on the project
  index or a named story picture shown beside a part. Kinds: image (source, alt text) or diagram
  (source, alt text, visible description). After this change it has no placeholder setting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of project files that set `placeholder` on a picture fail the build, each with
  a message naming the file and the setting.
- **SC-002**: Zero "Placeholder" marks appear on any project story page, real or fixture.
- **SC-003**: Zero fixture projects and zero authoring-guide passages mention the `placeholder`
  picture setting (apart from a fixture that proves it is rejected).
- **SC-004**: Every published project page and index row is visually identical before and after
  the change, and the full release gate passes.

## Assumptions

- No published project sets `placeholder` (stated in the issue); if one is found during
  implementation, the setting is removed from it, since it has no other effect.
- Removing the setting needs no migration or deprecation period: the content lives in this
  repository and every use is changed in the same pull request.
- Not a major change under Principle III: no dependency, data, cost, CI or constitution change,
  and removing an unused label from a component is not a change to the design system, site-wide
  layout, navigation or visual identity. The plan confirms this classification.
- The project-row baselines may turn out not to change, because the index row may not show the
  mark; FR-007 then leaves them as they are. The issue names them as expected to change, so the
  plan checks this rather than assuming.
- The historical design notes (`docs/design/portfolio.md`) describe the original design
  explorations, including "labelled placeholder" demo panels; they are a record, not the
  authoring guide, and are left as they are.

## Follow-up (out of scope)

- Any wider review of other project settings that may now be unused is a separate change.
- The `data-visual-mark` style hook is shared wording for picture marks; if, after removal, no
  other element uses it, the plan decides whether it goes with the placeholder mark (it is in
  scope only as part of "its styles").
