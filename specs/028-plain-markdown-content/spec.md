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
4. **Given** the rewritten page, **When** all headings in the page's main content are read in
   order, starting from the page title, **Then** no level is skipped: the page title is the only
   level 1 heading, section headings are level 2 and each topic or kind of work under them is
   level 3 (FR-005).
5. **Given** a browser with JavaScript turned off, **When** a reader opens a heading's address,
   **Then** the page still opens at that heading (FR-006).

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
   side images, the contact form and the recent writing list (FR-008).
2. **Given** the page authoring guide, **When** an author looks for how to write a titled block
   or a list of offerings, **Then** it shows the Markdown way (a `##` heading followed by text,
   and `###` headings for each item), not a component (FR-008).
3. **Given** the post authoring guide, **When** it lists the page components that also work in
   posts, **Then** it no longer names the removed sections (FR-009).
4. **Given** a page or post written with plain Markdown headings, paragraphs, lists, tables,
   quotes, links and emphasis, **When** it is built, **Then** each element is styled by the
   site's typography with no component, as the About page and the sample post already show
   (FR-007).

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
   section, and lists the sections that are (FR-002).
2. **Given** a page or post file containing `<Offerings>` or `<Offering>`, **When** the site
   builds, **Then** the build fails the same way (FR-002).
3. **Given** the removed tag written inside a code example (fenced or inline code), **When** the
   site builds, **Then** the build does not fail, the same as for any other example tag
   (FR-002, "outside code").
4. **Given** the remaining components, **When** they are used as the guide shows, **Then** they
   build and render as before (FR-003, FR-008).

---

### Edge Cases

- Project story files have never had page sections available; a project that uses any page
  section tag, removed or not, fails the build as it does today. The plain-Markdown rule applies
  to projects through the guide, not through a new check. The project guide (`docs/projects.md`)
  already says project bodies are plain Markdown only, so it needs no change.
- The Offering link option (`href`) goes away with the section. An item that should link
  somewhere puts the link in its Markdown heading or text instead (for example
  `### [Workshops](/contact/)` or a link in the paragraph). No current content uses it.
- The list of available sections shown in build error messages, and in the guides, no longer
  includes the removed names.
- **Removed tag forms**: a removed tag fails the build in any form that starts with a capital
  letter, including self-closing (`<TextBlock />`), with or without attributes, and nested inside
  another section (for example `<Offering>` inside `<Lead>`). A different capitalisation such as
  `<Textblock>` is also not a section and fails the same way. When a file has several unknown
  tags, the build reports the first one in the file; fixing it and rebuilding reports the next.
- **Duplicate heading text**: two headings on one page with the same text get distinct
  addresses, as Markdown headings already do elsewhere on the site: the first keeps the plain
  address and later ones get `-1`, `-2` and so on in page order (for example `#consulting`, then
  `#consulting-1`). The Work with me page has no repeated heading text; each of its twelve
  headings is distinct.
- **Punctuation in headings**: addresses are formed by the Markdown processor's standard rule
  (lower case, spaces to hyphens, most punctuation dropped), so "What I don't do" becomes
  `#what-i-dont-do`. The spec does not fix each address; it requires only that every one exists
  and is unique on the page.
- **Headings inside components**: headings belong in the body, outside components. None of the
  remaining components puts a heading on the page, and the guide shows headings only outside
  components. A heading written inside a component is not checked by the build and is not
  covered by FR-006.
- The Work with me page is a draft today; it stays a draft (same draft notice and settings as
  today) and keeps its menu position. Draft pages are built in every build, so the page is
  checked by the same automated tests locally and in CI. Don's clarification that no preview
  check is needed applies to this draft page as it stands.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The text block section (`TextBlock`) and the offerings sections (`Offerings` and
  `Offering`) MUST be removed from the set of sections available to page and post files.
- **FR-002**: The build MUST fail when a page or post file uses `TextBlock`, `Offerings` or
  `Offering` outside code, with a message that names the file and the tag and lists the
  sections that remain. The existing "not a section" error is reused unchanged; it gives no
  hint for each removed tag. The message has three parts: the file (prefixed "Page file" or
  "Post file"), "`<Tag>` is not a section", and "The sections are:" followed by the eight names
  in the fixed order of FR-003. Project files keep failing the build on any section tag, as
  today, with the project rules' own message; that is the same outcome (the build stops and
  names the file), not a conflicting one.
  - **"Outside code"** means anywhere in the body except fenced code blocks (opened with three
    or more backticks or tildes) and inline code spans (text between backticks). Those two are
    the ways content shows an example tag, so a post or page that documents a tag in code never
    trips the check.
    The settings block (frontmatter) is not part of the body. Everything else is checked,
    including MDX comments (`{/* … */}`); MDX has no indented code blocks or HTML comments, so
    those cases do not arise.
- **FR-003**: The remaining sections MUST be exactly: the lead paragraph, the call to action,
  the captioned image, the wide image, the full-width image, the side image, the contact form
  and the recent writing list, in that order wherever they are listed (`Lead`, `CallToAction`,
  `Figure`, `WideImage`, `FullImage`, `SideImage`, `ContactForm`, `RecentWriting`). Their
  behaviour and appearance MUST NOT change: their props, rendered HTML and styles stay the same,
  their existing component tests pass without edits, and their existing accessibility criteria
  (from the features that introduced them) still apply unchanged. None of them adds a heading
  to the page. Elements the site
  applies automatically to Markdown (such as code blocks and scrolling tables in posts) are not
  sections and are unaffected.
- **FR-004**: The Work with me page MUST be rewritten so that every heading, paragraph, list and
  emphasis is plain Markdown. Only the lead paragraph and the call to action remain components.
  The "What I don't do" items stay a Markdown list, so they are announced as a list. The unnamed
  wrapper regions the removed sections printed are not landmarks, so removing them takes away
  nothing a screen reader relies on.
- **FR-005**: The rewritten Work with me page MUST keep the current wording, order and meaning
  of its content: every word, punctuation mark and bold passage stays as it is; only line
  wrapping, blank lines and the wrapping tags change. The page title is the only level 1
  heading; section headings are level 2, and the individual speaking topics and kinds of work
  are level 3 under their section heading. Across the whole main content, starting from the
  page title, no heading level is skipped.
- **FR-006**: Every heading in the body of the Work with me page MUST have an address that can
  be linked to, in the same way as headings written in Markdown elsewhere on the site. Each
  address is non-empty, unique on the page and present in the built HTML, so it works without
  JavaScript and opens the page at the heading with the browser's normal jump (no smooth
  scrolling is added, so there is nothing to adjust for reduced motion). "Headings in the body"
  means every level 2 to 6 heading in the main content after the page title.
- **FR-007**: Plain Markdown headings, paragraphs, lists, tables, quotes, links and emphasis on
  pages, posts and projects MUST be styled by the site's existing typography styles; no
  component is needed for them to look right. Those styles already give Markdown links an
  underline (so a link is not told apart by colour alone) and a visible focus indicator, and
  meet the site's contrast requirements in light and dark themes; this feature relies on them
  and adds no styles.
- **FR-008**: The page authoring guide MUST state the rule (plain Markdown for everything
  Markdown can express; components only for the elements listed in FR-003), MUST stop
  documenting the removed sections, and MUST show how to write a titled passage and a list of
  items with `##` and `###` headings. In detail:
  - The rule is stated once, in `docs/pages.md`; other guides refer to it rather than restate
    it. "Everything Markdown can express" means exactly the list in FR-007: headings,
    paragraphs, lists, tables, quotes, links and emphasis.
  - It names the eight remaining components in the FR-003 order, gives the props each takes,
    and has one example of each that the build accepts as written.
  - A titled passage is a `##` heading followed by its text. A list of items is a `##` heading
    for the group and a `###` heading for each item; `###` is used only under a `##`, never
    straight after the page title, and levels are not skipped.
  - An item that should link somewhere puts a Markdown link in its heading or text.
  - It says every heading gets an address formed from its text (lower case, spaces to hyphens,
    most punctuation dropped; a repeated heading gets `-1`, `-2`), so an author can link to
    `/page/#heading-text`.
  - It says headings go in the body, not inside a component.
  - It contains no `<TextBlock`, `<Offerings` or `<Offering`, not even inside code as an example
    of what not to write, so "documents exactly the eight" can be checked by a text search.
  - New guide text follows the constitution's plain-language rule (no hype, no filler).
- **FR-009**: Other authoring guides that name the removed sections MUST be updated to match.
  The update scope is `docs/pages.md` (FR-008) and `docs/posts.md` (its list of page sections
  that work in posts, which then names `Lead` and `CallToAction` only). Any other guide, skill
  file, `CLAUDE.md` or shared pipeline wording is updated only if it names a removed section;
  at the time of writing none does. `docs/projects.md` already requires plain Markdown in
  project bodies and is not changed. Earlier specs under `specs/` and chore reports under
  `.specify/chores/` are records and are not edited.
- **FR-010**: Existing content other than the Work with me page MUST keep rendering as it does
  today. No other page, post or project uses the removed sections. This is confirmed by the
  build itself: once the sections are removed, any remaining use fails the build (FR-002).
- **FR-011**: The rewritten Work with me page MUST meet WCAG 2.2 AA (Principle X), checked by
  the existing automated accessibility tests that already cover `/work-with-me/` at phone and
  desktop widths in light and dark themes (no violations, no horizontal scroll at phone width).
  Draft pages are built for these tests, so the check runs locally and in CI. In particular:
  headings are not focusable and add no tab stops, so the tab order is the document order of
  the page's links and the call to action; the call to action keeps its current target size;
  links inside running text rely on the inline exception of WCAG 2.5.8 (target size) and keep
  the focus indicator and underline of FR-007. Keeping focused elements and heading targets
  clear of the sticky header (WCAG 2.4.11) is handled on this page exactly as on every other
  page and post today; this feature adds no new focusable element and does not change that
  behaviour (see Follow-up).
- **FR-012**: The test page that shows every section MUST stop using the removed sections and
  keep at least one plain Markdown link in running text, so link focus and underline stay
  tested. Its screenshot baselines MUST be refreshed for every platform the visual tests keep
  (macOS and Linux, phone and desktop, light and dark), and no other screenshot baseline may
  change.

### Key Entities

- **Component (section)**: a named element an author can use in a page or post file without
  an import. After this change the set is the eight listed in FR-003, in that order; anything
  else fails the build.
- **Heading address**: the link target a Markdown heading gets on the built page, so a link to
  the page plus that address opens at the heading. It is formed from the heading text by the
  Markdown processor; repeated text gets `-1`, `-2` suffixes (Edge Cases).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of headings in the body of the Work with me page (the twelve level 2 and 3
  headings after the page title, read from the built page) can be linked to directly (today 0
  of them can).
- **SC-002**: Zero content files on the site use the text block or offerings sections.
- **SC-003**: A content file that uses any of the three removed sections fails the build every
  time, with a message naming the file; this holds for each of the three tags in a page file
  and in a post file.
- **SC-004**: The page authoring guide documents exactly the eight remaining components (one
  example of each, and no occurrence of the three removed tag names anywhere, code included) and
  states the plain-Markdown rule in one place.
- **SC-005**: Every page other than Work with me looks the same before and after the change:
  every existing screenshot baseline other than the sections test page's (FR-012) passes
  unchanged at the visual tests' existing widths, themes and tolerance.

## Assumptions

- Headings written in Markdown already get linkable addresses from the site's Markdown
  processing; the rewrite relies on that rather than adding anything new. The plan confirms
  this against the built page.
- The Work with me page's look changes from the offerings list layout to ordinary headings and
  paragraphs styled by the typography styles. This is the intended outcome of the issue, the
  page is still a draft, and no new styles are added. Whether this counts as a major change
  under Principle III (design system or layout) is decided in the plan; the working assumption
  is that it does not, because the site's design system and layout are unchanged and only one
  draft page's content changes. The sections test page's screenshots change only because that
  test page stops using the removed sections. The plan records the criterion-by-criterion
  classification, and the PR description says in one line that the change is classified as not
  major and why, so Don can overrule it. The new look of the page needs no preview check before
  merge: the PR merges as usual, with auto-merge on and no [PREVIEW-CHECK] item.
- "Build rejects the removed components" reuses the existing check that fails the build on any
  tag that is not a known section; no separate list of banned names is required.
- Tests, fixtures and earlier feature specs that describe the removed sections are updated or
  left as history as the plan decides. Earlier specs under `specs/` are records and are not
  rewritten; this feature's content-rules contract states that it replaces their section list
  for current behaviour, so a reviewer reading either sees which is current. The internal
  content counters used only by the removed sections go with them (plan, research R2).
- Wording on the Work with me page stays as it is; the issue asks for a change of form, not of
  copy.

## Follow-up (out of scope)

- A build check that heading levels in a content body never skip (for example `##` straight
  to `####`). The issue says authors pick levels themselves; it does not ask for enforcement.
  The lack of enforcement on other pages and posts is accepted: the guide tells authors not to
  skip levels, the build already rejects a level 1 heading in the body, and the automated
  accessibility tests check the built pages.
- A visible "link to this heading" control next to headings. The issue asks only that the
  headings be linkable like every other heading, which needs an address, not a new control.
  Leaving it out is deliberate: headings stay unfocusable and add no tab stops.
- Keeping heading targets and focused elements clear of the sticky header on pages and posts
  (WCAG 2.4.11, Focus Not Obscured). Today only project pages set a scroll margin for targets
  and focused elements; ordinary pages such as About and the posts do not, so a linked heading
  can open just under the header. This feature matches the existing behaviour of other pages
  and adds no new focusable element; a site-wide scroll margin is a separate follow-up.
- Reviewing whether any other component could also be replaced by plain Markdown. The issue
  names the set to keep.
