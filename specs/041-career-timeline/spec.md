# Feature Specification: Interactive career timeline

**Feature Branch**: `041-career-timeline`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description (GitHub issue #163, "Interactive career timeline"): "The About page
shows Don's career as a timeline from Director, Data Infrastructure and
Architecture back to his early roles (newest first; see Clarifications, session 2026-10-15,
reverse order). Each step can be opened to show its scope, a key decision from that time, what
changed in how he worked, what he wishes he had known, and the skill that led to the next move.
Where there is writing or an award from that period, the step links to it. A filter can be used
to surface achievements, leadership themes, awards, etc. and their associated role/context.
Filtered items are collapsed and dithered, but still visible." (The filter's categories are now
Leadership, Recognition and Volunteer; see Clarifications, session 2026-10-19.)

## Background

The About page today is a short introduction, an "About me" list (current role, education,
leadership, volunteer work, values), a "Recognition" section with three awards and profiles
shown as images with captions, and a note about the writing. It says nothing about the roles
Don held before his current one or how he moved between them.

Don's job title appears in site copy only on the About page; this feature stays on the About
page, so naming the title there is allowed.

The site is static by default (constitution Principle V): the page is prerendered, its core
content must be readable with JavaScript turned off, and any interactive piece is an isolated
island. Public content lives in the repository as files validated by a schema (Principle VI).

## Clarifications

### Session 2026-10-14

- Q: How does Don's career content get into the site? → A: Don pastes his CV, which becomes a
  draft content source; a later clarify round interviews him on the gaps and on his current role
  (Director, Data Infrastructure and Architecture at Island Health since 2026), which the CV does
  not yet include. Nothing is invented.
- Q: Which categories does the filter offer? → A: Exactly three: Achievements, Leadership,
  Recognition. (Superseded in session 2026-10-19: Leadership, Recognition, Volunteer.)
- Q: Where does the timeline sit on the About page? → A: Directly after the "About me" list; the
  list's "Leadership" line is removed; "Recognition" stays as it is, and its awards are also
  linked from their matching steps.
- Q: Must every step have all five detail parts? → A: Scope is required; the other four parts
  are optional, and a part left out is simply not shown.
- Q: How do non-matching steps look when a category is chosen? → A: A dot (halftone) pattern
  over the collapsed step's background, made with CSS only; the text stays at full contrast and
  the treatment does not rely on colour alone. (Superseded in session 2026-10-15: the dot
  pattern is dropped.)
- Q: Which roles appear as steps? → A: Seven (six at first; see session 2026-10-19): the four Island Health roles on the CV, the CCHL
  Vancouver Island Chapter Treasurer and Vice Chair roles (volunteer), and the current Director role. Education and
  pre-2014 work are not steps.
- Q: What does the current step show? → A: The scope line from the About page ("Leads data
  warehousing, data modernization, and AI support and compliance for a regional health
  authority."); no key decision.
- Q: When did the Cloud Architect / IT Project Manager role end, and where do the awards link
  from? → A: It ended May 2026. The 2026 Celebration of Excellence links from Cloud Architect /
  IT Project Manager; the 2024 CCHL Chapter Award for Distinguished Service and the 2024 CCHL
  Member Profile link from the CCHL board step.
- Q: What is the key decision for Manager, Enterprise Systems Development? → A: "Organized
  database, web, integration and collaboration services into five cross-functional teams, each
  owning its 24/7 commitments."
- Q: How are the reflection parts filled in? → A: They are not, for now. The timeline ships with
  scope, the one key decision above, categorized items, awards and links; Don adds reflection
  parts to the content file later in small changes. No drafted reflection text.
- Q: With no filter chosen, does an opened step show its Achievements and Leadership items? →
  A: Yes, as labelled lists: scope and any reflection parts, then an "Achievements" list and a
  "Leadership" list (each only when the step has items), then writing and awards. A chosen
  category highlights its matching items inside these lists.

### Session 2026-10-15

Don reviewed the preview of PR #180.

- Q: Does the dot-pattern ("dither") treatment of non-matching steps stay? → A: No. It looks
  awkward on the page and is dropped. Non-matching steps are still collapsed and visibly
  de-emphasised, readable at full WCAG AA contrast and not marked by colour alone (FR-011).
- Q: Which muted treatment did Don pick after comparing the previews? → A: "Muted + side rule"
  (muted tint, dashed left rule, solid accent rule on matches), picked on 2026-10-15. The
  alternative was rejected and its commit reverted (research R8).
- Q: In which order does the timeline list the steps? → A: Reverse chronological, newest first
  (Don, 2026-10-15). The current role (Director, Data Infrastructure and Architecture, Jun
  2026 – present) is the first step and the earliest role (Leader, Systems Engineer, 2014) is the
  last. The current role is still the step with the latest start (FR-001a). Two steps with the
  same start month are ordered by file name, descending, so the whole list is exactly the
  reverse of the former earliest-first order and is deterministic. The list stays an ordered
  list (`<ol>`) in the same order on screen and in the markup, with no `reversed` attribute (the
  steps are not numbered).
- Q: Where does the expand/collapse marker sit? → A: Inline with the role title, on the same
  line, never on a line of its own above it (FR-007b).
- Q: Which treatment replaces the dot pattern? → A: Don compared two candidates on their own
  commit previews on 2026-10-15 and picked "Muted + side rule" (FR-011a): a non-matching step
  collapses; its row gets a soft muted background tint and a faint dashed left timeline rule; its
  text stays at full contrast. A matching step gets a solid accent left rule. The non-colour cue
  is the rule's style (dashed against solid).

### Session 2026-10-19

- Q: Is the CCHL Treasurer role still current? → A: No. It ended May 2026 (Sep 2022 – May 2026).
- Q: What new step is added? → A: Vice Chair (volunteer), Canadian College of Health Leaders –
  Vancouver Island Chapter, Jun 2026 – present, with the scope and the one achievement in
  FR-006a (rebuilt the mentorship program curriculum around action learning and realigned it to
  the new LEADS framework). Nothing else is added for it. It starts the same month as the
  Director role, so the file-name tie rule keeps Director first as the current role.
- Q: Does Achievements stay a filter category? → A: No (Don, 2026-10-19). Almost every step has
  achievements, so choosing it filters nothing. It is removed from the filter. Achievements are
  still shown as the labelled "Achievements" list in an opened step (FR-008 unchanged); they are
  no longer a category and are never highlighted.
- Q: What replaces it? → A: A Volunteer category that surfaces the two CCHL chapter steps
  (Treasurer and Director at Large; Vice Chair). The filter choices are All, Leadership, Recognition,
  Volunteer, in that order; single choice with "All" selected on load, as before. Volunteer is a
  step-level flag, not an item list: a step file MAY set `volunteer: true` (omitted means not a
  volunteer step), and only the two CCHL step files set it. Their role text keeps "(volunteer)".
  Choosing Volunteer opens the volunteer steps and mutes the others with the same treatment
  (FR-011a); a volunteer step has no items to highlight, so the match is the step itself, shown by
  its solid accent rule. The status line reads "2 of 7 roles are volunteer roles." (one match:
  "1 of N roles is a volunteer role."); the Leadership and Recognition wording is unchanged. A
  category no step uses is still not offered (FR-009).
- Q: What is the awards category called? → A: "Recognition" (Don, 2026-10-19). The filter
  button and the opened step's list heading read "Recognition", and the status line reads
  "M of N roles have recognition." (one match: "1 of N roles has recognition."). Only the visible
  wording changes: the step file field stays `awards`, and the internal category id stays
  `awards`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the career as a timeline (Priority: P1)

A visitor on the About page sees Don's career as an ordered timeline of steps, from his current
role, Director, Data Infrastructure and Architecture, back to his earliest listed role. Each step
shows at a glance the role, the organization and the period. The visitor opens any step to
read its detail: the scope of the role and, where Don has written them, a key decision from that
time, what changed in how he worked, what he wishes he had known, and the skill that led to the
next move.

**Why this priority**: This is the feature. Without it there is no timeline to filter or link
from. On its own it already tells the story the issue asks for.

**Independent Test**: Open the About page, confirm the steps appear newest first, starting with
the current role, open one step and read its detail parts, then close it.

**Acceptance Scenarios**:

1. **Given** the About page, **When** it loads, **Then** the timeline lists every career step in
   reverse chronological order, newest first, each showing its role, organization and period, and
   the first step is Director, Data Infrastructure and Architecture at Island Health.
2. **Given** a closed step, **When** the visitor opens it, **Then** it shows its scope and each
   other detail part the step has (key decision, what changed in how he worked, what he wishes
   he had known, the skill that led to the next move), each under its own label, followed by
   its "Achievements" and "Leadership" lists; a part or list the step does not have shows no
   label.
3. **Given** an open step, **When** the visitor closes it, **Then** only its summary line
   (role, organization, period) remains.
4. **Given** the current role (the first step), **When** it is opened, **Then** the "skill that
   led to the next move" part is never shown, because there is no next move yet.
5. **Given** JavaScript is turned off, **When** the visitor opens the About page, **Then** every
   step can still be opened and read.
6. **Given** a keyboard or screen reader user, **When** they move through the timeline, **Then**
   each step can be reached, opened and closed from the keyboard, and its open or closed state
   is announced.

---

### User Story 2 - Follow a step to its writing or award (Priority: P2)

Where Don wrote something or received an award during a step's period, the opened step links to
it. A visitor reading about a role can go straight to the post or the award that came out of
that time.

**Why this priority**: The links connect the timeline to the rest of the site and to evidence
of the work, but the timeline is useful without them.

**Independent Test**: Open a step that has a linked post or award and follow each link to its
destination.

**Acceptance Scenarios**:

1. **Given** a step with one or more related posts on this site, **When** it is opened, **Then**
   it lists each post by title, linking to the post.
2. **Given** a step with one or more awards, **When** it is opened, **Then** it lists each award
   by name and year, linking to the award's page where one exists.
3. **Given** a step with no related writing or awards, **When** it is opened, **Then** no empty
   "Writing" or "Recognition" heading appears.
4. **Given** a step names a post that does not exist or is a draft, **When** the site is built,
   **Then** the build fails with an error naming the step file and the post (FR-005a).

---

### User Story 3 - Filter the timeline by theme (Priority: P3)

A visitor uses a filter on the timeline to pick one theme: leadership, awards or volunteer
roles. The steps that match stay in place and open; for leadership and awards the matching
items are highlighted and each shows the role and context it belongs to. Every other step is collapsed and muted (visibly de-emphasised, with
its text still at full contrast) but stays visible in its place, so the visitor still sees where
the matching items sit in the whole career.

**Why this priority**: It adds a second way to read the career, but depends on the timeline
(Story 1) and its tagged content existing first.

**Independent Test**: Choose one filter value and confirm the matching items are shown with
their role, the other steps are collapsed and muted but still on screen, and clearing the
filter restores the timeline.

**Acceptance Scenarios**:

1. **Given** the timeline with no filter chosen, **When** it loads, **Then** "All" is selected
   and every step is shown normally (none muted).
2. **Given** the filter, **When** the visitor chooses Leadership or Recognition, **Then** each step
   holding at least one item of that category is opened with those items highlighted, and each
   highlighted item shows the role and organization of its step.
3. **Given** the filter, **When** the visitor chooses Volunteer, **Then** each volunteer step is
   opened and marked as matching (its own role and organization are its summary line), no item
   is highlighted, and every other step is collapsed and muted.
4. **Given** a category is chosen, **When** a step does not match it, **Then** the
   step is collapsed to its summary line and muted, stays in its place in the timeline, and
   can still be opened by the visitor.
5. **Given** a category is chosen, **When** the visitor chooses "All", **Then** no step is
   muted and every step is closed, including any step the visitor opened by hand (FR-012).
6. **Given** a category is chosen, **When** a screen reader user reaches the filter, **Then** the
   number of matching steps is announced, and muted steps are still readable (the muting is
   visual only and the text meets contrast requirements whether the step is closed or opened).
7. **Given** JavaScript is turned off, **When** the visitor views the page, **Then** the filter
   is not shown and the full timeline is readable.
8. **Given** a category that no step uses (no item of it, or for Volunteer no volunteer step),
   **When** the filter is built, **Then** that category is not offered.
9. **Given** the filter, **When** it is shown, **Then** it offers no Achievements choice, and an
   opened step still shows its "Achievements" list, never highlighted.

---

### Edge Cases

- A step with only some detail parts filled: it renders the scope and the parts it has, with no
  label for a missing part. A step with no scope fails the build, naming the step file.
- A step with scope only and no lists (the current role at launch): it is a valid step; opened,
  it shows only "Scope" and its text.
- The current role has a "skill that led to the next move" part: the build fails, naming the
  step file.
- Two steps that overlap in time (for example, a volunteer board role alongside a job): they
  are ordered by start date, newest first, and each shows its own period. Two steps with the same
  start month are ordered by file name, descending.
- A step whose period is still running: its period shows "present". Several steps may end
  "present" (the board role does); only the current role (FR-001a) must.
- The first step (the latest start) has an end month: the build fails, naming the step file (FR-001a).
- An award or post that falls in no step's period: it is not forced onto the timeline; it stays
  where it is on the site.
- A related post is later made a draft, renamed or deleted: the next build fails, naming the step
  file and the post (FR-005a).
- No career step files at all: the About page renders no timeline section (no heading, no
  filter). A step file that cannot be parsed fails the build, naming the file. A content test in
  the gate fails when the real site has no step files, so an empty timeline cannot reach the live
  page unnoticed. That test checks rules over whatever files exist (at least one step, the
  current-role rules, every listed post published), never the launch count or which parts are
  filled, so adding a step or a reflection part needs no test change (FR-005b).
- The visitor opens a step, then chooses a filter that does not match it: the step collapses
  and is muted like any other non-matching step.
- Filter changes and focus: see FR-013b.
- Printing the page: every step prints open and not muted, whatever the filter state (FR-018).
- Reduced motion: opening, closing and filtering never animate (FR-015), so nothing moves when
  the visitor's system asks for reduced motion.
- Narrow screens: the timeline reads as a single column at 320 CSS pixels wide with no
  horizontal scrolling (FR-017).
- Theme change while a category is chosen: the filter state is kept; the muted treatment and
  highlight use the colours of the new theme.
- A long role or organization in a step with the marker inline (FR-007b): the title wraps
  beside the marker; the marker stays on the title's first line.
- More steps in future: steps, the status count and the used categories all come from the
  content files, so adding a step needs no new requirement and no code change. The categories
  stay fixed at three (Leadership, Recognition, Volunteer). A new volunteer role is a new step file
  with `volunteer: true`.
- A volunteer step that also holds leadership items or awards: it matches Volunteer as a step,
  and it matches Leadership or Recognition through its items like any other step.
- Choosing Volunteer: no list item is highlighted in any step, because volunteer is a property of
  the step, not of its items; the matching step's solid accent rule is the cue.
- Achievements: every step may still have an "Achievements" list; choosing any category never
  highlights it.

## Requirements *(mandatory)*

### Functional Requirements

**Timeline content**

- **FR-001**: The About page MUST show a career timeline of steps ordered by start month,
  newest first, beginning with Don's current role, Director, Data Infrastructure and
  Architecture at Island Health, and ending with the earliest role. Steps with the same start
  month are ordered by file name, descending.
- **FR-001a**: The **current role** is the single step that comes first in the FR-001 order (the
  latest start; of two with the same latest start, the one whose file name sorts last). It MUST end "present", and it MUST NOT have the "skill that led to the next
  move" part. Every rule in this spec that names the current role means this step. Other steps
  MAY also end "present".
- **FR-002**: Each step MUST have a role title, an organization and a period. A period is a
  start month and an end month, or a start month and "present", written as year and month
  (month precision, no day). The end month MUST NOT be before the start month. The page shows a
  period as abbreviated month and year, for example "Oct 2014 – Sep 2016" or "Jun 2026 –
  present", and screen readers hear the dash as "to".
- **FR-003**: Each step MUST have a scope. Each step MAY also have any of these detail parts: a
  key decision from that time, what changed in how he worked, what he wishes he had known, and
  the skill that led to the next move. The last part MUST be absent for the current role
  (FR-001a). A part a step does not have is not shown.
- **FR-003a**: Text limits, enforced by the schema: role title and organization each at most 120
  characters; the scope and each detail part at most 300 characters; each categorized item and
  each award name at most 200 characters. Every text field is trimmed and MUST NOT be empty.
- **FR-003b**: Every text field is plain text. It is shown exactly as written, as text: Markdown
  and HTML characters are not interpreted, and content is never inserted into the page as
  markup. A line break inside a field is not kept.
- **FR-004**: Each step MAY list related posts on this site and related awards (name, year, and
  an optional link). It MAY also list achievement items and leadership items (FR-008, FR-009).
  - A **categorized item** is one short statement in the step's achievements or leadership list;
    the list it is written in decides what it is, and an item cannot be in two lists. Leadership
    items are the Leadership category; achievement items are shown but are not a filter category
    (Clarifications, session 2026-10-19).
  - The step's **awards list is the Recognition category**: an award is entered once, in that list,
    and is never repeated as an achievement. It is counted once.
  - An award link MUST be an absolute `https` address. Award and post links open in the same tab,
    like every other link on the About page.
  - A related post is named by its post file; the title and address shown come from that post,
    so they always match the published post.
  - Items, awards and posts show in the order they are written in the step file.
- **FR-004a**: Each step MAY be marked as a volunteer role with `volunteer: true`; a step without
  the flag is not a volunteer role. The flag is the Volunteer category (FR-009) and is a property
  of the whole step, not of an item. It adds no visible text: the role title says "(volunteer)"
  where Don wrote it.
- **FR-005**: The timeline content MUST live in the repository as files validated by a schema,
  one file per step. The file name (without extension) is the step's identity; it is unique
  because file names are, and it never appears on the page. Any field the schema does not know
  MUST fail the build. Invalid or incomplete content, a related post that does not exist or is
  a draft, or a category not in the allowed list MUST fail the build.
- **FR-005a**: Every build failure from career content MUST name the step file by its path in the
  repository, the field at fault and, where there is one, the offending value (for example the
  post's file name). "Names the step" in this spec always means this file path. The rejected
  cases are:
  - a missing or empty role title, organization or scope;
  - a text field over its FR-003a limit;
  - a start or end that is not a year and month (or "present" for the end), or an end month
    before the start month;
  - an unknown field, including any category other than the three;
  - a `volunteer` value that is not true or false;
  - an empty achievements, leadership, awards or posts list (leave the key out instead);
  - an award without a name or year, or with a link that is not `https`;
  - the same post listed twice in one step;
  - a related post that does not exist (including one renamed or deleted after it was listed),
    or that is a draft (including one made a draft later);
  - a current role (FR-001a) that does not end "present" or that has the next-move part;
  - a step file that cannot be parsed.
- **FR-005b**: Don adds or changes a reflection part, item, award, related post or volunteer flag by editing one
  step file only; no code change is needed, and the build proves the edit valid. A new role is a
  new file, placed by its start month.
- **FR-006**: The career content (which roles, organizations, periods, the text of each detail
  part, related posts, awards and categorized items) MUST come from Don and MUST NOT be
  invented. Its source is Don's CV and his clarify-round answers (Clarifications, session
  2026-10-14). The launch content is exactly the seven steps in FR-006a; nothing else is added
  without Don.
- **FR-006a**: The timeline MUST launch with these seven steps, in this order (start date; listed here earliest first for reading, shown on the page newest first per FR-001). Each
  step's scope is the text given. Only the Manager, Enterprise Systems Development step has a
  key decision; no step has "what changed", "wish I'd known" or "skill to the next move" at
  launch (Don adds them later).

  | # | Role | Organization | Period | Scope |
  |---|------|--------------|--------|-------|
  | 1 | Leader, Systems Engineer | Island Health | Oct 2014 – Sep 2016 | Led integration projects that redeveloped 70+ HL7 interfaces and Oracle database integrations, and built proactive monitoring and analytics tools. |
  | 2 | Manager, Enterprise Systems Development | Island Health | Sep 2016 – Jan 2022 | Led five cross-functional teams (20+ direct reports) running database, web, integration and collaboration services under 24/7 service commitments, and managed real-time and batch clinical data integration pipelines. |
  | 3 | Project Director, Enabling Technologies | Island Health | Jan 2022 – Mar 2023 | Coordinated technology for the pandemic response and aligned technology investment with executive committees, clinical leads and provincial stakeholders. |
  | 4 | Treasurer and Director at Large (volunteer) | Canadian College of Health Leaders – Vancouver Island Chapter | Sep 2022 – May 2026 | Chapter finances (budget, reporting, taxation, investment plan), executive governance and the mentorship program. |
  | 5 | Cloud Architect / IT Project Manager | Island Health | Apr 2023 – May 2026 | Architected the Microsoft 365 governance framework for 36,000 users, led cloud migrations with disaster recovery planning, and managed vendors and cloud budgets using FinOps practices. |
  | 6 | Vice Chair (volunteer) | Canadian College of Health Leaders – Vancouver Island Chapter | Jun 2026 – present | Executive officer and acting chair when the chair is away, in line to become chapter chair. Supports the chair, chapter planning and member events, sits on the executive nominating committee and chairs nominations for College awards and honours. |
  | 7 | Director, Data Infrastructure and Architecture | Island Health | Jun 2026 – present | Leads data warehousing, data modernization, and AI support and compliance for a regional health authority. |

  Vice Chair (6) and Director (7) both start Jun 2026. They tie on start month, so the file-name rule (FR-001) applies: Director shows first as the current role and Vice Chair second, although it also ends present.
  Key decision (step 2 only): "Organized database, web, integration and collaboration services
  into five cross-functional teams, each owning its 24/7 commitments."

  Categorized items, awards and related posts per step:

  | # | Achievements | Leadership | Recognition | Related posts | Volunteer |
  |---|--------------|------------|--------|---------------|-----------|
  | 1 | 70+ HL7 interfaces redeveloped; proactive monitoring reduced reactive troubleshooting | – | – | – | – |
  | 2 | On-call incidents cut by 40% through ITIL-based incident management; COVID-19 vaccine rollout integration delivered with zero deployment delays | Built and led five teams, 20+ direct reports | – | – | – |
  | 3 | Surge-response plan and rapid deployment of 9 immunization clinics; access to COVID-19 data for clinical and operational reporting; business case approved for a permanent patient-facing Contact Centre | Coordinated executive committees, clinical leads and provincial stakeholders | – | – | – |
  | 4 | Mentorship program supporting 102 health leaders (2023); chapter social media engagement up 62% | – | 2024 CCHL Chapter Award for Distinguished Service (link: the CCHL article used on the About page); 2024 CCHL Member Profile (link: the CCHL profile article used on the About page) | – | yes |
  | 5 | Governance framework for 36,000 users; adoption program starting with 80 teams and 50+ enablement proposals; adoption and usage dashboards | Led the ADKAR-based change program from pilot to governed operation | 2026 Celebration of Excellence, "Leading our C.A.R.E. Values" (no link) | Starting something new; Self-contained development for Ghost themes; Building Focus Pocus: What I Learned About AI Coding and Integration; The Systems Leadership Wayfinder: Five Mindset Shifts for Leading Complex Change | – |
  | 6 | Rebuilt the mentorship program curriculum around action learning and realigned it to the new LEADS framework | – | – | – | yes |
  | 7 | – | – | – | – | – |

  Notes on the launch content:

  - Every fact in these two tables comes from Don's CV or his clarify answers; the
    number-bearing claims (70+, 40%, 20+, 9, 36,000, 80, 50+, 102, 62%) are Don's figures as
    given and change only when Don changes them.
  - Step 7 has a scope only: no key decision, no items, no awards, no posts. That is a valid step
    (FR-003, FR-008).
  - Steps 4 and 6 (the two CCHL chapter roles) set `volunteer: true` (FR-004a); no other step
    sets it.
  - Step 7's scope is the About page's "Current role" sentence with "Leads" in place of
    "leading". The step file is the only source of the timeline's text; the "About me" list's
    "Current role" line stays separate page copy, and Don edits both when his role changes.
  - Step 4's links: the CCHL Chapter Award for Distinguished Service links to
    `https://cchl-ccls.ca/news_article/2024-chapter-awards-for-distinguished-service/`; the CCHL
    Member Profile links to
    `https://cchl-ccls.ca/news_article/don-coleman-expresses-the-importance-of-exercising-curiosity-for-healthcare-leaders/`.
    These are the addresses the About page's "Recognition" section uses for the same awards.
  - Award names in step files leave out the year, which is its own field and shows after the
    name: "CCHL Chapter Award for Distinguished Service (2024)", "CCHL Member Profile (2024)",
    "Celebration of Excellence, “Leading our C.A.R.E. Values” (2026)". The wording otherwise
    matches the "Recognition" section.
  - Step 5's related posts are named by their post files; the titles in the table are the
    titles of those published posts, and the page always shows the post's own title (FR-004).

**Opening and closing**

- **FR-007**: Every step MUST start closed and not muted in the page as served, showing only
  its summary line, and MUST be openable and closable by mouse, touch and keyboard (Tab to the
  summary line, Enter or Space to toggle). It MUST use the browser's native disclosure, so its
  expanded or collapsed state is exposed to assistive technology without script. This MUST work
  with JavaScript turned off.
- **FR-007a**: The summary line is the step's control. Its accessible name is the role title, the
  organization and the period, in that order. Steps are items of one ordered list, so a screen
  reader hears the number of steps and each step's position.
- **FR-007b**: The disclosure (expand/collapse) marker MUST sit inline with the role title, on
  the same line as the title's first line, at every width, in every state (idle, matching,
  muted, open, closed) and with JavaScript off. It MUST NOT sit on a line of its own above the
  title. It keeps the 3:1 contrast and target-size rules of FR-017 and is not part of the
  summary's accessible name (FR-007a).
- **FR-008**: An opened step MUST show, in this order: each detail part under its own visible
  label; an "Achievements" list and a "Leadership" list of its categorized items; then its
  related writing and awards, each as a link (an award without a link shows as plain text).
  This holds with no filter chosen and without JavaScript. Sections with no items MUST NOT
  appear.
- **FR-008a**: Structure and labels:
  - The timeline is headed "Career", one heading level below "About me" (the same level as
    "Recognition"). The steps are not headings. The "Achievements", "Leadership", "Writing" and
    "Recognition" list headings are one level below "Career". The page keeps its skip link, landmarks
    and unbroken heading order; the timeline sits inside the main content.
  - The detail-part labels are, in order: "Scope", "Key decision", "What changed in how I
    worked", "What I wish I'd known", "The skill that led to the next move". Each label is tied
    to its text in the markup as a term and its description, not only placed next to it.
  - Achievements, leadership items, writing and awards are each a real list.
  - Each post link's text is the post title and each award link's text is the award name, so
    every link makes sense on its own. Links are underlined, so a linked award differs from a
    plain-text award by more than colour.

**Filter**

- **FR-009**: The timeline MUST offer a filter whose choices are "All" plus each category used
  by at least one step, in the fixed order Leadership, Recognition, Volunteer. The categories MUST
  come from one fixed list of exactly three: Leadership, Recognition, Volunteer. A step uses
  Leadership when it has a leadership item, Recognition when it has an award, and Volunteer when it is
  marked as a volunteer role (FR-004a). Leadership is one category, not a set of named themes.
  Achievements is not a category: the filter never offers it (Clarifications, session
  2026-10-19). Which categories are offered is worked out from the content at build time; when
  no category is used, no filter and no status line are rendered.
- **FR-009a**: The filter is a single choice: exactly one choice is selected at any time, and
  "All" is selected when the page loads. It is a labelled group of buttons, labelled "Show",
  each exposing whether it is the selected one. Each button is its own Tab stop and is chosen
  with Enter or Space; arrow keys do nothing special. The filter sits directly under the
  "Career" heading, above the first step, so Tab reaches it before the steps. It scrolls with
  the page (not sticky) and overlaps nothing.
- **FR-010**: Choosing a category MUST open each matching step and mark it with the solid accent
  rule (FR-011a). For Leadership and Recognition it MUST also highlight the matching items inside the
  step's Leadership or Recognition list (FR-008) and show the role and organization each matching
  item belongs to.
  - A step "matches" Leadership or Recognition when it holds at least one item of that category, and
    matches Volunteer when it is marked as a volunteer role (FR-004a). Matching is counted in
    steps, never in items, in the outcome and in the status line alike.
  - The matching items are all the items in the chosen category's list (for Recognition, every award
    in the step's awards list). The highlight is a left border, bold text and a light tint, so it
    is not colour alone. Assistive technology learns the match from the list's own heading
    ("Leadership" or "Recognition"), which names the chosen category, and from the status line; no
    extra hidden text is added. The "Achievements" list is never highlighted.
  - Volunteer has no items, so choosing it highlights no list item; the match is the step
    itself, opened, with its role and organization as its summary line. Assistive technology
    learns the match from the status line.
  - The role and organization of a highlighted item are the summary line of the opened step that
    holds it, directly above the lists; a screen reader reaches the item inside that step's
    disclosure, whose name carries the role and organization (FR-007a).
  - Muted steps hold no matching items by definition, so a step is never both muted and
    highlighted.
- **FR-011**: Choosing a category MUST collapse every step that does not match it (FR-010) to its
  summary line and **mute** it: visibly de-emphasise it while keeping it visible in its place in
  the timeline and readable at full WCAG AA contrast. Muting is made with CSS only and uses no
  dot, halftone or other pattern (Clarifications, session 2026-10-15).
  - Text MUST meet WCAG 2.2 AA (4.5:1, or 3:1 for large text) in every state (idle, filtered,
    muted, closed, open, hover, focus), in the light and dark themes, and in forced-colours
    mode, measured against the solid colour actually behind it (the page colour, or the muted
    row's solid tint). Muting never uses `opacity` or a background image behind
    text.
  - Muting MUST NOT rely on colour alone. The non-colour cue is the step's left timeline rule,
    which turns from solid (as on a matching step) to dashed; in forced colours the dashed rule
    stays, in `CanvasText`.
  - Any rule, edge or tint boundary that carries the cue has at least 3:1 contrast against the
    page background (WCAG 1.4.11).
  - A muted step is not disabled or hidden: assistive technology reads it like any other step,
    and it can still be opened. Opening it does not remove the muting; the next filter change
    decides its state. Opened, its content shows at full size and full contrast.
- **FR-011a**: Exactly one muting treatment ships, "Muted + side rule": a muted step's row has a
  soft muted background tint and a faint dashed left timeline rule; its text stays at full
  contrast. A matching step has a solid accent left rule. The code carries no runtime switch.
- **FR-012**: Choosing "All" MUST remove all muting and highlights and close every step,
  including steps the visitor opened or closed by hand. This is deliberate: "All" is the reset
  to the timeline as first served (FR-007).
- **FR-012a**: Every filter change is applied fresh to every step, whatever the visitor did by
  hand before it: on choosing a category, matching steps open and all others close and are
  muted. Between filter changes the visitor may open or close any step freely; a matching
  step closed by hand stays closed until the next filter change. Choosing the choice that is
  already selected changes nothing and announces nothing.
- **FR-013**: After every filter change, including a return to "All", the number of matching
  steps MUST be announced to assistive technology through a polite status message, which does
  not interrupt speech and is not repeated. Nothing is announced when the page loads. The
  status text is, with N the number of steps and M the number of matching steps:
  - "All": "Showing all N roles."
  - Leadership or Recognition, M is 1: "1 of N roles has <category>." (for example "1 of 7 roles has
    awards.")
  - Leadership or Recognition, M is not 1: "M of N roles have <category>." The category is in lower
    case.
  - Volunteer, M is 1: "1 of N roles is a volunteer role."
  - Volunteer, M is not 1: "M of N roles are volunteer roles." (at launch "2 of 7 roles are
    volunteer roles.")
  A category with no matching step is never offered (FR-009), so M is never 0; if it were, the
  text would read "0 of N roles have <category>." or "0 of N roles are volunteer roles."
- **FR-013a**: Focus after a filter change stays on the button just chosen. The filter never
  moves focus and never scrolls the page.
- **FR-013b**: If keyboard focus is inside a step's opened content when a filter change closes
  that step, focus moves to that step's summary line, so it is never left on hidden content.
- **FR-014**: Without JavaScript, the timeline MUST be complete and usable on its own: every
  step is listed in order, closed and not muted, and can be opened and read in full with its
  native disclosure (FR-007, FR-008). The filter and the status line MUST NOT be shown, MUST NOT
  be exposed to assistive technology, and MUST leave no gap and no dead control. The filter is
  revealed only by its own script, after that script is ready to work, so if the script fails
  to load or errors the page stays in this no-JavaScript state.
- **FR-014a**: The filter's appearance when its script runs MUST keep the page within the
  layout-shift budget (FR-017).
- **FR-014b**: The filter choice is kept only while the page is open. It is not written to the
  address, cookies or storage, and a reload starts again from "All" with every step closed. (The
  browser's back-forward cache may restore the page as the visitor left it; that is allowed.)
- **FR-015**: Filtering, opening and closing MUST NOT animate, whatever the visitor's motion
  setting, and nothing on the page scrolls on its own. Any animation added later MUST be off
  when the visitor prefers reduced motion.

**Page and site**

- **FR-016**: The timeline MUST sit on the About page directly after the "About me" list. The
  list's "Leadership" line MUST be removed, because the timeline replaces it: its content (leading
  teams, pandemic response planning, digital transformation) is told by steps 2, 3 and 5. No
  other page refers to that line. The "Recognition" section MUST stay as it is, word for word;
  its awards are also linked from their matching steps (FR-004), with the names given in FR-006a.
- **FR-017**: The page MUST meet WCAG 2.2 AA and the site's performance budget, and the timeline
  MUST read as one column at every width.
  - At 320 CSS pixels (and at 400% zoom of a 1280 pixel window) nothing scrolls sideways: the
    filter buttons wrap onto more lines, and long organization names, award names and post
    titles wrap. At 200% text zoom no text is clipped or overlapped, muted steps included.
  - Summary lines and filter buttons are at least 24 by 24 CSS pixels (WCAG 2.5.8).
  - Summary lines, filter buttons and links show the site's visible focus ring, with at least
    3:1 contrast, never hidden by the muted treatment, the highlight or other content (WCAG 2.4.7 and
    2.4.11; the AAA rule 2.4.13 is not required). The disclosure marker and the filter buttons'
    edges have at least 3:1 contrast against the background.
  - Performance budget, measured on `/about/` by the CI budget check on a throttled phone:
    largest contentful paint at most 2,500 ms, cumulative layout shift at most 0.1, blocking
    time from long tasks at most 200 ms, JavaScript at most 10 KB and total transfer at most
    150 KB. A filter change responds within 200 ms on a phone (Core Web Vitals "good"
    interaction); the budget's long-task limit stands in for this in CI.
- **FR-017a**: The feature adds no third-party script, cookie, storage, network request or new
  page. Its one script is processed by Astro and covered by the site's existing content
  security policy; its styles set no inline `style` attributes, so the policy needs no change.
- **FR-018**: When printed, the page MUST show the plain timeline whatever the filter state:
  every step open, no muting (no tint, dashed rule or compact row), no highlight, and no filter
  or status line. Printed text keeps its
  normal contrast and links stay underlined.
- **FR-019**: Don's job title MUST appear only on the About page; this feature MUST NOT add it
  anywhere else on the site. The career step files count as part of the About page for this
  rule: their only rendering is the timeline on `/about/`, so the current role's title in its
  step file is allowed. Nothing else on the site may read the career files.
- **FR-020**: Copy for labels and messages MUST be plain language, in the site's voice
  (`VOICE.md`), with no hype or filler. The complete set of labels and messages this feature
  adds is: the heading "Career"; the filter label "Show" and its choices "All",
  "Leadership", "Recognition", "Volunteer"; the detail labels in FR-008a; the list headings
  "Achievements", "Leadership", "Writing", "Recognition"; the status messages in FR-013; and the
  period word "present". Any other wording needs a spec change.
- **FR-021**: The visual checks MUST cover the timeline with a category chosen that highlights
  items (Leadership), so one opened step with highlighted items and one muted step are both shown, at phone and desktop widths,
  in the light and dark themes. The baselines show the muted treatment of FR-011a.

### Key Entities

- **Career step**: one role in Don's career. Has a role title, organization, period (start, end
  or present), a required scope, up to four optional detail parts (never the "skill that led to
  the next move" for the current role), optional related posts, awards and categorized items,
  and an optional volunteer flag (FR-004a). Ordered by start date, newest first.
- **Related post**: a reference from a step to a published post on this site, shown by its
  title.
- **Award**: a recognition received during a step: name, year, optional link.
- **Categorized item**: a short statement attached to a step, an achievement or a leadership
  theme, given by the list it is written in. Leadership items are the Leadership category;
  achievements are shown but are not a filter category. Recognition count as items of the Recognition
  category; each award is entered once, in the step's awards list (FR-004).
- **Category**: one value in the fixed list the filter offers: Leadership, Recognition or Volunteer
  (FR-009). Leadership and Recognition are matched through a step's items; Volunteer through the
  step's volunteer flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can find what Don did in any listed role (and, once Don adds it, why he
  moved on) in two actions or fewer from arriving at the About page (scroll to the step, open it).
- **SC-002**: 100% of steps are readable, with every detail part they have, with JavaScript
  turned off.
- **SC-003**: Choosing a category leaves 100% of steps on screen, with every non-matching step
  muted, every matching step open, and (for Leadership and Recognition) every matching item showing
  its role and organization.
- **SC-004**: The About page passes the automated accessibility checks (axe with the WCAG 2.0,
  2.1 and 2.2 A and AA rule tags the site already uses) with no violations, in the light and dark
  themes, in each of these states: no filter chosen; each offered category chosen; and a category
  chosen with a muted step opened by hand. These states are checked with JavaScript on; with
  JavaScript off the page is the idle state without the filter.
- **SC-005**: The About page stays within the site's performance budget and meets Core Web
  Vitals "good" thresholds on mobile.
- **SC-006**: Every broken reference to a post, or incomplete step, is caught by the build
  (zero such errors reach the live page).

## Assumptions

- "Muted" means a non-matching step collapsed and visibly de-emphasised with CSS only, by one
  of the two candidate treatments (FR-011, FR-011a); exact tints, rule widths and sizes are a
  design decision for the plan, within the site's design system and contrast rules. The issue's
  word "dithered" is read as this de-emphasis; the earlier dot-pattern reading was dropped on
  2026-10-15 (Clarifications).
- "Filtered items are collapsed and dithered" refers to the steps that do not match the chosen
  category (muted, in this spec's terms); matching items are the ones surfaced.
- Only one category can be chosen at a time (FR-009a). Multi-select is out of scope.
- The filter choice is not kept in the address or between visits (FR-014b).
- The timeline adds no page, so the sitemap is unchanged (`/about/` is already in it), no feed
  carries career content, and search engines see the timeline as part of `/about/`.
- The three items in "Recognition" (2026 Celebration of Excellence, 2024 CCHL Chapter Award for
  Distinguished Service, 2024 CCHL Member Profile) stay there and are also linked from the
  steps named in FR-006a (FR-016).
- Writing links point to posts on this site; links to outside writing are treated like award
  links (name, year, link).
- The timeline needs no server code, stores nothing and collects no personal data.
- The current role is a single step. The two CCHL chapter roles (Treasurer, then Vice Chair) are the
  volunteer steps; education is not a step (FR-006a). Two steps end present (Director and Vice
  Chair); only the first in order, Director, is the current role, and the file-name tie rule puts
  it first. The Treasurer role overlaps the Island Health steps from Sep 2022 and is ordered by
  its start date (newest first).

## Out of scope

- Writing or inventing any of Don's career history; the content comes from Don's CV and
  interview (FR-006).
- A timeline anywhere other than the About page (home page, project stories, writing).
- Sharing a filtered view by link.
- Showing Don's job title anywhere but the About page.
