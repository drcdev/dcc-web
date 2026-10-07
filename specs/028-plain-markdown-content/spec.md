# Feature Specification: Plain Markdown for standard content

**Feature Branch**: `028-plain-markdown-content`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Write standard content as plain Markdown; keep components for custom elements only (GitHub issue #117). Page, post and project files use plain Markdown for everything Markdown can express: headings, paragraphs, lists, tables, quotes, links and emphasis. The site's typography styles handle how these look, so authors write `##` and `###` headings directly and pick the heading levels themselves. Components are only for things Markdown has no syntax for: the lead paragraph, calls to action, captioned, wide, full-width and side images, the contact form and the recent writing list. The text block and offerings sections are removed, because they only wrapped headings and paragraphs. The Work with me page is rewritten in plain Markdown, so its headings can be linked to like every other heading on the site. The page authoring guide is updated to describe this rule, and the build rejects the removed components."

## Clarifications

### Session 2026-10-07

- Q: When the build fails because someone used `<TextBlock>`, `<Offerings>` or `<Offering>`, should the error also say what to write instead? → A: No. Keep the existing "not a section" error, which names the file and the tag and lists the remaining sections; no hint for each removed tag.
- Q: Should Don check the rewritten Work with me page on the preview before merge? → A: No. It merges as usual: auto-merge on, no [PREVIEW-CHECK] item.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Link to any heading on the Work with me page (Priority: P1)

A reader, or Don sharing the page, wants to point someone at one part of the Work with me page,
such as "Speaking topics", "Consulting" or one kind of work. Today those headings come from
sections that print the heading themselves, so they have no address to link to. After this
change every heading on the page is ordinary Markdown and can be linked to the same way as a
heading in a post or on any other page.

**Why this priority**: It is the one reader-visible gain the issue names, and it proves the
rewrite of the only page that uses the removed sections.

**Independent Test**: Build the site and open `/work-with-me/`. Every heading on the page has
an address, and opening the page with that address scrolls to the heading.

**Acceptance Scenarios**:

1. **Given** the built site, **When** a reader opens `/work-with-me/` followed by the address of
   the "Consulting" heading, **Then** the page opens at that heading.
2. **Given** the built Work with me page, **When** its headings are listed, **Then** every heading
   in the body has an address, the same as headings on other pages and posts.
3. **Given** the rewritten page, **When** it is compared with the current page, **Then** it says
   the same things in the same order: the lead paragraph, Speaking topics with its three topics,
   Past talks, Consulting, Kinds of work with its three kinds, How I work, What I don't do, and
   the call to action.
4. **Given** the rewritten page, **When** its headings are read in order, **Then** no level is
   skipped: section headings are level 2 and each topic or kind of work under them is level 3.

---

### User Story 2 - Write standard content as plain Markdown (Priority: P1)

Don, or an agent, writes a page, post or project and uses plain Markdown for headings,
paragraphs, lists, tables, quotes, links and emphasis, choosing `##` and `###` directly. The
site's typography styles make it look right. Components are used only for things Markdown has
no syntax for: the lead paragraph, a call to action, a captioned, wide, full-width or side
image, the contact form and the recent writing list.

**Why this priority**: It is the rule the issue sets. Without it the removed sections would be
reinvented or kept by habit.

**Independent Test**: Read the page authoring guide. It states the rule, lists the components
that remain, and shows standard content written as plain Markdown. No guide shows the text
block or offerings sections.

**Acceptance Scenarios**:

1. **Given** the page authoring guide, **When** an author reads it, **Then** it says to write
   headings, paragraphs, lists, tables, quotes, links and emphasis as plain Markdown, and to
   use components only for the lead paragraph, calls to action, captioned, wide, full-width and
   side images, the contact form and the recent writing list.
2. **Given** the page authoring guide, **When** an author looks for how to write a titled block
   or a list of offerings, **Then** it shows the Markdown way (a `##` heading followed by text,
   and `###` headings for each item), not a component.
3. **Given** the post authoring guide, **When** it lists the page components that also work in
   posts, **Then** it no longer names the removed sections.

---

### User Story 3 - The build rejects the removed sections (Priority: P2)

An author, or an agent working from an old example, writes `<TextBlock>`, `<Offerings>` or
`<Offering>` in a page, post or project. The build stops with a clear message that names the
file and lists the components that are still available, instead of rendering the content.

**Why this priority**: It keeps the rule from drifting back in, but the rule and the rewrite
deliver value without it.

**Independent Test**: Put a `<TextBlock>` in a page file and build. The build fails with a
message that names the file and the tag.

**Acceptance Scenarios**:

1. **Given** a page file containing `<TextBlock title="...">`, **When** the site builds,
   **Then** the build fails and the message names the file, says `<TextBlock>` is not a
   section, and lists the sections that are.
2. **Given** a page or post file containing `<Offerings>` or `<Offering>`, **When** the site
   builds, **Then** the build fails the same way.
3. **Given** the removed tag written inside a code example (fenced or inline code), **When** the
   site builds, **Then** the build does not fail, the same as for any other example tag.
4. **Given** the remaining components, **When** they are used as the guide shows, **Then** they
   build and render as before.

---

### Edge Cases

- Project story files have never had page sections available; a project that uses any page
  section tag, removed or not, fails the build as it does today. The plain-Markdown rule applies
  to projects through the guide, not through a new check.
- The Offering link option (`href`) goes away with the section. An item that should link
  somewhere puts the link in its Markdown heading or text instead. No current content uses it.
- The list of available sections shown in build error messages, and in the guides, no longer
  includes the removed names.
- Two headings on one page with the same text get distinct addresses, as Markdown headings
  already do elsewhere on the site.
- The Work with me page is a draft today; it stays a draft and keeps its menu position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The text block section (`TextBlock`) and the offerings sections (`Offerings` and
  `Offering`) MUST be removed from the set of sections available to page and post files.
- **FR-002**: The build MUST fail when a page or post file uses `TextBlock`, `Offerings` or
  `Offering` outside code, with a message that names the file and the tag and lists the
  sections that remain. The existing "not a section" error is reused unchanged; it gives no
  hint for each removed tag. Project files keep failing the build on any section tag, as today.
- **FR-003**: The remaining sections MUST be exactly: the lead paragraph, the call to action,
  the captioned image, the wide image, the full-width image, the side image, the contact form
  and the recent writing list. Their behaviour and appearance MUST NOT change. Elements the site
  applies automatically to Markdown (such as code blocks and scrolling tables in posts) are not
  sections and are unaffected.
- **FR-004**: The Work with me page MUST be rewritten so that every heading, paragraph, list and
  emphasis is plain Markdown. Only the lead paragraph and the call to action remain components.
- **FR-005**: The rewritten Work with me page MUST keep the current wording, order and meaning
  of its content. Section headings are level 2, and the individual speaking topics and kinds of
  work are level 3 under their section heading.
- **FR-006**: Every heading in the body of the Work with me page MUST have an address that can
  be linked to, in the same way as headings written in Markdown elsewhere on the site.
- **FR-007**: Plain Markdown headings, paragraphs, lists, tables, quotes, links and emphasis on
  pages, posts and projects MUST be styled by the site's existing typography styles; no
  component is needed for them to look right.
- **FR-008**: The page authoring guide MUST state the rule (plain Markdown for everything
  Markdown can express; components only for the elements listed in FR-003), MUST stop
  documenting the removed sections, and MUST show how to write a titled passage and a list of
  items with `##` and `###` headings.
- **FR-009**: Other authoring guides that name the removed sections (the post guide's list of
  page sections that work in posts) MUST be updated to match.
- **FR-010**: Existing content other than the Work with me page MUST keep rendering as it does
  today. No other page, post or project uses the removed sections.

### Key Entities

- **Component (section)**: a named element an author can use in a page or post file without
  an import. After this change the set is the eight listed in FR-003; anything else fails the
  build.
- **Heading address**: the link target a Markdown heading gets on the built page, so a link to
  the page plus that address opens at the heading.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of headings in the body of the Work with me page can be linked to directly
  (today 0 of them can).
- **SC-002**: Zero content files on the site use the text block or offerings sections.
- **SC-003**: A content file that uses any of the three removed sections fails the build every
  time, with a message naming the file.
- **SC-004**: The page authoring guide documents exactly the eight remaining components and
  states the plain-Markdown rule in one place.
- **SC-005**: Every page other than Work with me looks the same before and after the change.

## Assumptions

- Headings written in Markdown already get linkable addresses from the site's Markdown
  processing; the rewrite relies on that rather than adding anything new. The plan confirms
  this against the built page.
- The Work with me page's look changes from the offerings list layout to ordinary headings and
  paragraphs styled by the typography styles. This is the intended outcome of the issue, the
  page is still a draft, and no new styles are added. Whether this counts as a major change
  under Principle III (design system or layout) is decided in the plan; the working assumption
  is that it does not, because the site's design system and layout are unchanged and only one
  draft page's content changes. The new look of the page needs no preview check before merge: the PR merges as usual,
  with auto-merge on and no [PREVIEW-CHECK] item.
- "Build rejects the removed components" reuses the existing check that fails the build on any
  tag that is not a known section; no separate list of banned names is required.
- Tests, fixtures and earlier feature specs that describe the removed sections are updated or
  left as history as the plan decides. Earlier specs under `specs/` are records and are not
  rewritten.
- Wording on the Work with me page stays as it is; the issue asks for a change of form, not of
  copy.

## Follow-up (out of scope)

- A build check that heading levels in a content body never skip (for example `##` straight
  to `####`). The issue says authors pick levels themselves; it does not ask for enforcement.
- A visible "link to this heading" control next to headings. The issue asks only that the
  headings be linkable like every other heading, which needs an address, not a new control.
- Reviewing whether any other component could also be replaced by plain Markdown. The issue
  names the set to keep.
