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
- Q: How should the "Retired" pill look different from the theme pills beside it? → A: Filled mauve: mauve-50 background, mauve-800 border, mauve-950 text; in dark mode a filled mauve-800/900 background with mauve-100 text. Theme pills stay white-filled. AA contrast in both themes.
- Q: What exact wording should the fixed retired note use? → A: "**Retired.** I no longer use or maintain this project." plus " It was replaced by <name>." when there is a replacement.
- Q: Should a retired project record when it was retired and show that date? → A: No. No retired date is recorded or shown.

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
- A retired project's replacement is malformed (both a project and a name, neither, an
  address beside a project reference, an address that is not https, an unknown setting, an
  empty or whitespace-only name, or an empty `replacedBy` with no value): the build fails with
  a clear message naming the file and the setting.
- One file breaks more than one rule (for example a replacement on a project that is not
  retired and that also names itself): the build fails. The content-format checks run first
  and stop the build, so the file's format errors are reported (possibly several at once)
  and the cross-project checks (missing or self reference) are reported only once the format
  is valid.
- A retired project's replacement is itself a retired project: allowed. It is linked or
  named exactly like any other replacement; the site does not follow the chain.
- Two projects name each other as replacements (A replaced by B, B replaced by A), or a
  longer chain loops back: allowed and not a build error. Each replacement is only a
  reference shown in one project's note and nothing walks the chain, so a loop cannot break
  the build or a page; whether the content makes sense is Don's call.
- A retired project names a replacement project that is a draft: in a build that shows drafts
  the link works; in the production build, where the draft has no page, the replacement is
  named by its title without a link rather than linking to a page that does not exist. The
  production build does not fail.
- A retired project that is also a draft: the draft notice and the retired note both show
  outside production, and the project is left out of production as any draft is. The draft
  notice comes first, then the story header with the retired note inside it.
- A retired draft whose replacement is also a draft: in a build that includes drafts both
  pages exist and the note links to the replacement; in the production build neither page
  exists, so no note is shown anywhere. The replacement check still runs over both files
  and still fails the build if the reference is missing or self.
- The page is read with JavaScript turned off: the status and the retired note are still
  shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project content format MUST accept "retired" as a project status, alongside
  the existing statuses (shipped, experiment, in progress). The value is spelled exactly
  `retired` (lower case), like the existing values `shipped`, `experiment` and `in-progress`,
  which keep their meaning and labels; no existing project's status changes except Tempo's
  (FR-009).
- **FR-002**: A project marked retired MUST stay on the projects index, in the same order and
  under the same theme filtering as any other published project.
- **FR-003**: A retired project's story page MUST be built and shown in full, with nothing
  removed because of the status.
- **FR-004**: Wherever a project's status is shown (index row and story header), a retired
  project MUST show the label "Retired" in the shared status pill using a new filled mauve
  tone used only for Retired: a mauve-50 background, mauve-800 border and mauve-950 text in
  the light theme, and a mauve-800 background, mauve-300 border and mauve-100 text in the
  dark theme (mauve-800 is the choice within the clarify answer "mauve-800/900", because
  mauve-900 would barely differ from the dark page; the mauve-300 border follows the other
  tones' dark borders). The fill sets it apart from the white-filled neutral theme pills
  beside it and from the sage, lavender and rust tones. The status is told apart by its
  word, never by hue: every status pill carries its own label ("Retired", "Shipped",
  "Experiment", "In progress"), so a reader who cannot tell the tones apart loses nothing.
  It MUST meet WCAG 2.2 AA in both themes: the label text at least 4.5:1 against the pill's
  fill, and the border at least 3:1 against the page background, so the pill's edge is
  visible even where the dark fill is close to the dark page. Adding this tone is a
  design-system change (see Assumptions).
- **FR-004a**: The contrast of the pill and of the retired note (text, link and any
  decorative edge) MUST be computed from the design tokens for both themes and recorded in
  the plan's research notes before implementation, and the rendered pages MUST pass the
  site's automated accessibility check (which measures rendered text contrast) with a
  retired project shown, in both themes. The computed colours of the rendered pill MUST be
  checked against the tokens, since a pixel check cannot name a token. In forced-colours
  (high-contrast) mode no special styling is required: the system replaces the colours, the
  border stays drawn, and the label text still carries the status.
- **FR-005**: A retired project's story page MUST show a short plain-language note inside
  the story header, so it is read before the story, saying the project is retired and no
  longer used or maintained. The note is exactly "**Retired.** I no longer use or maintain
  this project." followed by " It was replaced by <name>." when a replacement is named (the
  name linked as FR-007 says); projects cannot supply their own note text. Reading order on
  the page is: the draft notice (only for a draft outside production), the title, the
  problem, the status and theme pills, the retired note, then the story's parts. The bold
  "Retired." is inline emphasis within the paragraph: it is not a heading and carries no
  status role, and the note is one ordinary paragraph. The note appears only on the story
  page; the index row shows the Retired pill and no note.
- **FR-006**: A retired project MAY name the project that replaced it; the replacement is
  optional and leaving it out entirely means "no replacement". When present, the replacement
  MUST be exactly one of these forms and nothing else:
  - a reference to another project on the site: that project's file name without the
    `.mdx` extension, matched exactly as the file is named (lower case, as project file
    names are), with draft project files counting as projects (checked at build time);
  - a name for a replacement off the site: plain text, required, not empty or only spaces
    once trimmed, with no maximum length; it is shown as text, so any markup in it is shown
    literally rather than interpreted;
  - a name, as above, with an address: a full `https://` URL with a host (any other scheme
    is rejected); an address is only allowed together with a name, never with a project
    reference.

  The replacement accepts no other settings; an unknown setting fails the build. An empty
  replacement (written with no value, or with no fields) is invalid and fails the build
  rather than being treated as absent.
- **FR-007**: When a retired project names a replacement, the retired note MUST name it; it
  MUST link to the replacement's story page when the replacement is a project with a page in
  the current build, link to its address when it is an off-site replacement with an address,
  and otherwise name it without a link. A replacement project that is a draft is linked in
  builds that include drafts and named by its title without a link in the production build.
  "The production build" is the one build that leaves drafts out (a Cloudflare Workers
  Builds build of `main`, as for draft projects and posts today); every other build
  (branch previews, local and CI builds, the test servers) includes drafts. In the
  production build a draft replacement contributes only its title to the note: no link,
  address, file name, problem text or other detail of the draft appears in the page, its
  metadata or anywhere else in the build.
- **FR-008**: Content that names a replacement on a project not marked retired, names a
  missing project, names itself as its replacement, or gives a malformed replacement (any
  form FR-006 does not allow) MUST fail the build with a clear error that names the file,
  the setting at fault, and what to change. These checks run in every build, including the
  production build and a build that publishes no project pages, and cover draft projects
  too. The text each error must contain is fixed per case in the build-errors contract.
- **FR-009**: Tempo's content MUST be changed to the retired status with Cadence named as its
  replacement in plain text (an off-site name with no address), so the note names Cadence
  without a link until a Cadence project story exists.
- **FR-010**: The status and the retired note MUST be readable with JavaScript turned off:
  the word "Retired" in the pill (on both the index row and the story header) and the full
  note text are present in the page's prerendered HTML and depend on no script. Both MUST be
  exposed to assistive technology as ordinary text, not only as colour: the pill's word and
  the note's sentences are the accessible content, with no added role, label, live region
  or hiding from assistive technology.
- **FR-011**: The content template for new projects MUST document the retired status and the
  replacement field so Don or Claude Code can use them without reading code. The
  documentation is complete when it gives: the status value `retired` and what it means;
  that the replacement is optional and allowed only on a retired project; each form of the
  replacement (a project on the site by file name, a name, a name with an https address);
  and that the note's wording is fixed and cannot be customised.
- **FR-012**: The replacement link in the note MUST:
  - use the replacement's title or name as its only link text (no "click here" or "here");
  - look like the site's other inline text links in a story: the note's text colour,
    underlined, so it is told apart from the surrounding text by the underline rather than
    by colour, with the text at least 4.5:1 against the page background in both themes;
  - show the site's existing visible focus outline when focused by keyboard;
  - open in the same tab, whether on or off the site, with no new-tab behaviour or
    external-link marker, like the existing Build links;
  - be a normal inline link within the sentence, which WCAG 2.2's target size rule exempts
    as inline text.

  A name-only replacement (no link) MUST be plain text in the sentence: not underlined, not
  coloured or styled like a link, and not a link element.
- **FR-013**: The pill and the note MUST reflow at narrow widths (down to 320 CSS pixels and
  at 200% zoom) as the rest of the story header does: the pill wraps within the row of status
  and theme pills and the note's text wraps, with no horizontal scrolling and no text cut
  off.

### Key Entities

- **Project**: an existing content entry with a title, problem, themes, status, date and
  story. Gains the status value "retired". No retired date is recorded; a retired project's
  date stays the project's own date.
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
  unknown project, self-reference, malformed replacement) is rejected by the build with an
  error naming the file.
- **SC-004**: The story page and the projects index still pass the site's automated
  accessibility checks in both themes and at both the phone and desktop widths, with a
  retired project shown on each (the retired fixture project's story, and the index listing
  its row).
- **SC-005**: After the change, Tempo shows as retired in favour of Cadence on the live site.

## Assumptions

- **Cadence has no project page yet.** There is no Cadence entry in the projects collection
  and no public Cadence address is known, so Tempo names Cadence in plain text without a link
  (confirmed in clarify). Once a Cadence project exists, Tempo's replacement is switched to
  point to it (follow-up).
- The retired note sits inside the story header, after the status and theme pills, so it is
  seen before the story (FR-005); its wording is fixed, for Tempo: "**Retired.** I no longer use or
  maintain this project. It was replaced by Cadence."
- No retired date is recorded or shown (confirmed in clarify).
- **This is a major change.** The "Retired" status gets a new filled mauve pill tone used
  only for Retired. A new tone changes the design system, so under Constitution Principle III the PR
  needs Don's explicit approval after he has looked at the preview deployment, and
  auto-merge stays off.
- Visual baselines need refreshing only if the shell, not-found or fixture-site snapshots
  change. The fixture site MUST gain a published retired fixture project, so the visual and
  accessibility checks render the new tone and the note and cannot pass by never showing
  them. The plan predicts the baseline change up front: new images for the retired row and
  the retired story header in each theme, width and platform, and no existing image
  changed.
- Index order is unchanged: retired projects are ordered the same way as all other projects,
  not moved to the end. No filter by status is added.
- The story page's metadata (title, description, social preview) is unchanged by the status.
- Test coverage for the replacement cases is a complete set: on-site link, on-site draft
  target (linked with drafts, title only in production), off-site with an address, name
  only, and none are each covered where the cheapest layer can see them (the resolver and
  the note component for every case; the real build for the draft target, by pointing the
  retired fixture's replacement at the draft fixture; the browser for following the
  on-site link). One published retired fixture project (replaced by an existing fixture
  project) and one broken fixture (a retired draft naming a missing project) are added; no
  other fixture changes. Real content is checked only for Tempo's status. Each
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
- Updating the MDX comment in Tempo's body (it still says a retired status is issue #50); left as is by instruction, so reword it when Cadence gets a project story.
