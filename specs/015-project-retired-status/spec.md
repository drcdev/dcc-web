# Feature Specification: Retired status for projects

**Feature Branch**: `015-project-retired-status`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Add a retired status for projects (GitHub issue #50). A project can be marked retired when it is no longer used or maintained, for example when a newer project replaces it. A retired project stays on the projects index and keeps its story, and its page says it is retired and links to the project that replaced it, if there is one. Tempo is the first project to use it: it was retired in favour of Cadence."

This feature implements GitHub issue #50.

## Clarifications

### Session 2026-10-03

- Q: When Tempo's retired note names Cadence, what should "Cadence" link to? → A: Name Cadence in plain text with no link until a Cadence project story exists (follow-up).
- Q: What forms should a retired project's replacement be allowed to take in content? → A: Either a reference to another project on the site (checked at build time), or a name with an optional https address for anything off the site.
- Q: Which colour should the "Retired" status pill use? → A: A new muted tone (for example a mauve or grey border and background, AA contrast in both light and dark themes) used only for Retired. This is a design-system change and so a major change under Principle III.
- Q: In the production build, what should a retired project's note do when its replacement is a draft project with no page there? → A: Name the replacement by its title without a link in production; link it in builds that include drafts.
- Q: Should the retired note's wording be one fixed sentence or per-project text? → A: One fixed template sentence plus the replacement clause when there is one; no per-project note text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader sees that a project is retired (Priority: P1)

A reader browsing the projects index or opening a project story can tell at a glance that the
project is retired, so they do not mistake an old, unmaintained project for current work. The
retired project still appears on the index in its usual place and its full story still reads
as before.

**Why this priority**: This is the core of the issue. Without it, a retired project such as
Tempo looks like a current "Shipped" project.

**Independent Test**: Mark one project retired with no replacement and check that the index
row and the story page both show the "Retired" status, that the project is still listed, and
that the story's parts are all still there.

**Acceptance Scenarios**:

1. **Given** a published project marked retired, **When** a reader opens the projects index,
   **Then** the project is listed in the same order position it would have with any other
   status, and its row shows the status "Retired".
2. **Given** a published project marked retired, **When** a reader opens its story page,
   **Then** the page shows the status "Retired" where other stories show their status, and
   every part of the story is shown as it would be for any other status.
3. **Given** a published project marked retired, **When** a reader opens its story page,
   **Then** the page carries a short plain-language note saying the project is retired and
   no longer used or maintained.
4. **Given** the theme filter on the projects index, **When** a reader filters by a theme the
   retired project has, **Then** the retired project is included like any other project.

---

### User Story 2 - A reader follows the link to the project that replaced it (Priority: P2)

When a retired project was replaced by a newer one, the retired note on its story page names
the replacement and links to it, so a reader interested in the idea can go straight to the
current work.

**Why this priority**: It adds value on top of the status, but a retired project with no
replacement is still a complete, useful result.

**Independent Test**: Mark a fixture project retired with a replacement that is another
project on the site, open its story page, and follow the link to the replacement's story.

**Acceptance Scenarios**:

1. **Given** a retired project whose replacement is another published project on the site,
   **When** a reader opens the retired project's story, **Then** the retired note names the
   replacement by its title and links to the replacement's story page.
2. **Given** a retired project whose replacement is somewhere off the site, **When** a reader
   opens the retired project's story, **Then** the retired note names the replacement and
   links to its address.
3. **Given** a retired project whose replacement is named but has no page or address yet,
   **When** a reader opens the retired project's story, **Then** the retired note names the
   replacement in plain text with no link.
4. **Given** a retired project with no replacement, **When** a reader opens its story, **Then**
   the retired note says it is retired and mentions no replacement.

---

### User Story 3 - Don marks Tempo retired (Priority: P3)

Don records in Tempo's content that it is retired and was replaced by Cadence, and the site
shows this from then on.

**Why this priority**: It is the first real use and the reason for the issue, but it depends
on stories 1 and 2.

**Independent Test**: Build the site and check that Tempo's index row and story show
"Retired" and that the retired note names Cadence.

**Acceptance Scenarios**:

1. **Given** Tempo's content marks it retired in favour of Cadence, **When** a reader opens
   the projects index, **Then** Tempo's row shows "Retired" instead of "Shipped".
2. **Given** the same content, **When** a reader opens Tempo's story, **Then** the retired
   note names Cadence. Because Cadence has no project page on the site yet, Cadence is named
   without a link (see Assumptions).

---

### Edge Cases

- A project names a replacement but is not marked retired: the content is invalid and the
  build fails with a clear message, since only a retired project has a replacement.
- A retired project names, as its replacement, a project on the site that does not exist: the
  build fails with a clear message naming the file and the missing project.
- A retired project names itself as its replacement: the build fails with a clear message.
- A retired project names a replacement project that is a draft: in a build that shows drafts
  the link works; in the production build, where the draft has no page, the replacement is
  named by its title without a link rather than linking to a page that does not exist. The
  production build does not fail.
- A retired project that is also a draft: the draft notice and the retired note both show
  outside production, and the project is left out of production as any draft is.
- The page is read with JavaScript turned off: the status and the retired note are still
  shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project content format MUST accept "retired" as a project status, alongside
  the existing statuses (shipped, experiment, in progress).
- **FR-002**: A project marked retired MUST stay on the projects index, in the same order and
  under the same theme filtering as any other published project.
- **FR-003**: A retired project's story page MUST be built and shown in full, with nothing
  removed because of the status.
- **FR-004**: Wherever a project's status is shown (index row and story header), a retired
  project MUST show the label "Retired" in the shared status pill using a new muted tone (for
  example a mauve or grey border and background) that is used only for Retired, is distinct
  from the existing neutral, sage, lavender and rust tones, and meets AA contrast in both
  light and dark themes. Adding this tone is a design-system change (see Assumptions).
- **FR-005**: A retired project's story page MUST show a short plain-language note near the
  top of the story saying the project is retired and no longer used or maintained. The note
  is one fixed sentence from the template, followed by a replacement clause when a
  replacement is named; projects cannot supply their own note text.
- **FR-006**: A retired project MAY name the project that replaced it. The replacement MUST be
  exactly one of: a reference to another project on the site (checked at build time), or a
  name with an optional https address for a replacement off the site.
- **FR-007**: When a retired project names a replacement, the retired note MUST name it; it
  MUST link to the replacement's story page when the replacement is a project with a page in
  the current build, link to its address when it is an off-site replacement with an address,
  and otherwise name it without a link. A replacement project that is a draft is linked in
  builds that include drafts and named by its title without a link in the production build.
- **FR-008**: Content that names a replacement on a project not marked retired, names a
  missing project, or names itself as its replacement MUST fail the build with a clear error
  that names the file.
- **FR-009**: Tempo's content MUST be changed to the retired status with Cadence named as its
  replacement in plain text (an off-site name with no address), so the note names Cadence
  without a link until a Cadence project story exists.
- **FR-010**: The status and the retired note MUST be readable with JavaScript turned off and
  MUST be exposed to assistive technology as text, not only as colour.
- **FR-011**: The content template for new projects MUST document the retired status and the
  replacement field so Don or Claude Code can use them without reading code.

### Key Entities

- **Project**: an existing content entry with a title, problem, themes, status, date and
  story. Gains the status value "retired".
- **Replacement**: an optional part of a retired project naming what replaced it: either a
  reference to another project on the site, or a name with an optional off-site https
  address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every retired project on the site shows "Retired" on both its index row and its
  story page, and no retired project is missing from the index (checked across all
  published projects in the production build).
- **SC-002**: A reader can get from a retired project's story to its replacement's story in
  one click whenever the replacement has a page on the site.
- **SC-003**: 100% of invalid replacement content (replacement without retired status,
  unknown project, self-reference) is rejected by the build with an error naming the file.
- **SC-004**: The story and index templates still pass the site's automated accessibility
  checks in both themes with a retired project shown.
- **SC-005**: After the change, Tempo shows as retired in favour of Cadence on the live site.

## Assumptions

- **Cadence has no project page yet.** There is no Cadence entry in the projects collection
  and no public Cadence address is known, so Tempo names Cadence in plain text without a link
  (confirmed in clarify). Once a Cadence project exists, Tempo's replacement is switched to
  point to it (follow-up).
- The retired note sits with the story header (status, problem, themes) so it is seen before
  the story; its wording is one fixed sentence in the site's voice plus the replacement
  clause when there is one, for example "Retired.
  I no longer use or maintain this project. It was replaced by Cadence."
- **This is a major change.** The "Retired" status gets a new muted pill tone used only for
  Retired. A new tone changes the design system, so under Constitution Principle III the PR
  needs Don's explicit approval after he has looked at the preview deployment, and
  auto-merge stays off.
- Visual baselines need refreshing only if the shell, not-found or fixture-site snapshots
  change. The fixture site may need a retired fixture project so the visual project
  exercises the new tone; the plan decides this, and any baseline change it causes must be
  predicted up front.
- Index order is unchanged: retired projects are ordered the same way as all other projects,
  not moved to the end. No filter by status is added.
- The story page's metadata (title, description, social preview) is unchanged by the status.
- Tests use the existing fixture projects to cover the replacement cases (on-site link,
  off-site link, name only, none); real content is checked only for Tempo's status. Each
  behaviour gets one primary test layer as `docs/testing.md` ("Where a test goes") sets out:
  schema rules at the unit layer, rendered status and note at the cheapest layer that can see
  them, and link-following and no-JS reading in the browser only where a browser is needed.

## Out of Scope / Follow-up Work

- Rewriting Tempo's story text. Its Lessons part already says Tempo is retired and Cadence is
  its successor; any wording change is separate content work.
- Adding a Cadence project story to the site, and then pointing Tempo's replacement at it
  (the comment in Tempo's content already notes this).
- A status filter on the projects index, or moving retired projects to a separate section.
- Marking any other project retired.
