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
sets it fails the build with a clear message naming the setting, the same way the settings
removed earlier (`order`, `demo.embed`, `comparison`) and any other unknown setting already fail.

**Why this priority**: This is the whole change. Removing an option nobody uses keeps the project
file format small and leaves one less thing to document and test.

**Independent Test**: Validate a project file whose picture sets `placeholder` against the project
file format, for each picture location and kind; validation fails and the error names
`placeholder`. That the build runs this same validation on real files and names the file is
already proven by the existing build check of the project file format, so no new deliberately
broken fixture or extra build run is added. Build the real site; it succeeds with every published
project unchanged.

**Acceptance Scenarios**:

1. **Given** a project file whose list picture (`visual`) sets `placeholder`, **When** the site is
   built, **Then** the build fails with an error naming the file and the `placeholder` setting.
2. **Given** a project file whose story picture (an entry in `visuals`) sets `placeholder`,
   **When** the site is built, **Then** the build fails with an error naming the file and the
   `placeholder` setting.
3. **Given** the real site content, **When** the site is built, **Then** the build succeeds and
   every published project page and index row is built from unchanged content files.

---

### User Story 2 - Pictures in a story no longer show a "Placeholder" mark (Priority: P2)

A reader of a project story sees each picture beside the part it belongs to. The visible
"Placeholder" label above a picture, and the styles that only existed for it, are gone. Pictures
otherwise look and behave as before: images keep their alt text, diagrams keep their visible
description. The mark was plain visible text that only flagged a stand-in picture; no published
page shows it, so a screen reader user loses nothing that needs a replacement.

**Why this priority**: It follows directly from removing the setting; without it the mark could
never appear, so leaving its markup and styles behind would be dead code.

**Independent Test**: Render a project picture whose data still carries the old key; no
"Placeholder" text and no mark hook appear (component layer). Build the fixture site; no story
page contains the mark (build layer, replacing the end-to-end check that asserted the mark, since
the behaviour it covered is removed). Images and diagrams still render with their alt text and
description.

**Acceptance Scenarios**:

1. **Given** a project story with an image and a diagram beside its parts, **When** a reader opens
   it, **Then** no "Placeholder" text appears on any picture, the image has its alt text and the
   diagram has its visible description, associated with the picture as its description.
2. **Given** a reader using forced colours (high-contrast mode), **When** they open a project
   story, **Then** the story pictures, invitation blocks, draft mark, status pill and options
   table keep their borders exactly as they do on `main` before this change; only the border rule
   for the removed mark goes.

---

### User Story 3 - Fixtures, docs and visual baselines match the new format (Priority: P3)

The test fixture projects stop setting `placeholder`, the project authoring guide stops
describing it, and the one set of fixture visual baselines whose pixels show the mark is
refreshed so the gate compares against the new look.

**Why this priority**: Needed for the release gate to pass and for the guide to stay accurate,
but it carries no reader-visible behaviour of its own.

**Independent Test**: No fixture project, test data or authoring guide sets or describes the
`placeholder` picture setting, and the visual check passes on both platforms with only the
story-template baselines refreshed.

**Acceptance Scenarios**:

1. **Given** the fixture projects (valid and deliberately broken ones) and the component and
   schema test data, **When** they are searched for the `placeholder:` setting, **Then** none sets
   it. No fixture is added to prove rejection; that is proven by the format validation tests
   (Story 1).
2. **Given** the project authoring guide, **When** Don reads it, **Then** it no longer describes a
   `placeholder` picture setting or a "Placeholder" mark.
3. **Given** the fixture story-template screenshots (desktop and phone, light and dark), **When**
   the visual check runs, **Then** it passes against refreshed baselines that show no
   "Placeholder" mark, and every other baseline, including the project-row shots, is unchanged.

### Edge Cases

- A deliberately broken fixture currently sets `placeholder` but exists to test a different
  error: after the change it must still fail for its intended reason only, not for the removed
  setting. The existing build check asserts each fixture's intended message, so a fixture failing
  on the removed setting instead shows up as a message mismatch.
- A project file sets `placeholder: false`: it fails the build like `placeholder: true`, because
  the setting itself no longer exists.
- A project file sets `placeholder` alongside another invalid setting: the error must name
  `placeholder`; the other problem may be reported in the same error. No order between the two is
  required. Removing the key from a fixture gives no fixture a second error, so no existing error
  message moves.
- The word "placeholder" appears elsewhere in the site for unrelated reasons (the draft page
  notice, form field hints, code comments, post text): those are untouched.
- Fixture alt text such as "A placeholder picture for ..." is alt text, not the setting. It is
  kept, so no assertion that depends on fixture alt text or on fixture order moves, and searches
  for the setting look for the `placeholder:` key, not the bare word.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project file format MUST NOT accept a `placeholder` setting on any picture,
  whether the list picture or a story picture, of either kind (image or diagram), with any value.
- **FR-002**: A project file that sets `placeholder` on a picture MUST fail the build with an
  error whose text contains the file's name and the word `placeholder`, through the same
  unknown-setting check that already rejects the removed `order`, `demo.embed` and `comparison`
  settings. The exact wording is the build tool's own. The build is where this failure is
  required; editor hints are out of scope.
- **FR-003**: Project story pictures MUST NOT render a "Placeholder" mark. The markup for the
  mark, its `data-placeholder` and `data-visual-mark` hooks, the style rule for
  `[data-visual-mark]` and the `[data-placeholder]` entry in the forced-colours border list MUST
  be removed; nothing else uses them. The forced-colours selector list MUST remain valid and keep
  every other entry.
- **FR-004**: Pictures MUST otherwise render as before: images with their alt text, diagrams with
  their visible description linked to the picture as its accessible description, the first picture
  on a page loaded eagerly and the rest lazily. Loading order has no accessibility effect and does
  not change.
- **FR-005**: Fixture projects and test data MUST NOT set `placeholder`, and each broken fixture
  MUST still fail for the reason it was written to test. The setting is removed from: the valid
  fixtures `every-part` (4 uses) and `every-setting` (2), the draft fixture (1), the seven broken
  fixtures `17-missing-image` (missing image file), `26-duplicate-slug` (two files with the same
  address), `27-bad-file-name` (file name not a valid address), `R01-removed-order` (removed
  `order` setting, and reused as the invalid-`status` draft check), `RP04-missing-replacement`
  (retired project naming a missing replacement), `story-malformed-table` (options table answer
  not yes, partly or no) and `story-mdx-element` (MDX element in plain Markdown), one use each, and
  the picture test data in the component and schema tests. No fixture project is added or
  removed, so the fixture site's fixed project counts and row shots stay as they are. Real project
  content is not edited.
- **FR-006**: The project authoring guide MUST NOT describe the `placeholder` setting or the
  "Placeholder" mark.
- **FR-007**: Visual baselines MUST be refreshed only where their pixels change. The expected set
  is the eight `story-template` baselines: desktop and phone, light and dark, on macOS and Linux,
  because the shot covers the fixture story where three pictures carry the mark today and removing
  it shifts the content below. Expected unchanged: the project-row baselines (the index row never
  renders the mark), the retired story header and lead story shots (their fixtures never set the
  setting), and every other shot (no other page renders a fixture story picture). Any diff outside
  the expected set is a regression to fix, not a baseline to refresh. Baselines are refreshed by
  the shared visual baselines procedure (macOS locally, Linux via Docker, the `visual-baselines`
  label as fallback if Docker output differs from CI), after all fixture, component and style
  edits are in place and while no sibling worktree's browser tests are running. Because the update
  rewrites only images past the comparison threshold, after the refresh the changed images MUST be
  exactly the expected set, and a reviewer confirms each refreshed image differs from the old one
  only by the three marks gone and the content below moving up.
- **FR-008**: Published project content MUST build and render unchanged: no file under the real
  project content changes, no real project uses the setting, and the real-site build succeeds.
- **FR-009**: Affected story pages MUST still meet WCAG 2.2 AA (Principle X). The mark was
  non-interactive text, so headings, reading order, focus, keyboard use, reflow at 320 px and 400%
  zoom, and the colours and contrast of picture borders and captions in light and dark themes are
  unchanged. The existing automated accessibility check on the fixture story template (which
  includes the 320 px reflow check) and the existing forced-colours project checks are the layer
  that covers this; no new accessibility test is needed because no remaining element's markup or
  style changes.

### Key Entities

- **Project picture**: a picture in a project file, either the list picture shown on the project
  index or a named story picture shown beside a part. Kinds: image (source, alt text) or diagram
  (source, alt text, visible description). After this change it has no placeholder setting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every tested case of a project file setting `placeholder` fails validation with an
  error naming the setting: the list picture and a story picture, each as an image and as a
  diagram, plus `placeholder: false`. The build names the file through the existing build check.
- **SC-002**: Zero "Placeholder" marks appear on any project story page, real or fixture.
- **SC-003**: A search of the fixtures, test data and authoring guide for the `placeholder:`
  setting (excluding historical spec and design records, and alt text that only uses the word)
  finds zero matches.
- **SC-004**: Every published project page and index row is built from content files unchanged by
  this feature, the visual check changes only the eight story-template baselines at its configured
  threshold, and the full release gate passes.

## Assumptions

- No published project sets `placeholder` (stated in the issue); if one is found during
  implementation, the setting is removed from it, since it has no other effect.
- Removing the setting needs no migration or deprecation period: the content lives in this
  repository and every use is changed in the same pull request.
- Not a major change under Principle III: no dependency, data, cost, CI or constitution change,
  and removing an unused label from a component is not a change to the design system, site-wide
  layout, navigation or visual identity. The plan confirms this classification criterion by
  criterion.
- The project-row baselines do not change: the plan checked the index row component and it never
  renders the mark. The issue expected them to change; FR-007 overrides that.
- Only the story picture component reads the setting today; the type check catches any other
  reader that would break when the setting disappears.
- The historical design notes (`docs/design/portfolio.md`) describe the original design
  explorations, including "labelled placeholder" demo panels; they are a record, not the
  authoring guide, and are left as they are.

## Follow-up (out of scope)

- Any wider review of other project settings that may now be unused is a separate change.
