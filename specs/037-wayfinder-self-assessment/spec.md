# Feature Specification: Wayfinder self-assessment

**Feature Branch**: `037-wayfinder-self-assessment`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description (GitHub issue #165, "Wayfinder self-assessment"): "The Systems
Leadership Wayfinder post has a short self-assessment. The reader answers a few questions for
each of the five mindset shifts and sees where they sit between "From" and "To" on each one,
shown as a chart. Each low score links to the matching section of the post and its practical
application. The reader can print a six-week plan shaped by their results, and retake the
assessment later to see how they have grown. It runs in the browser and stores nothing. It also
works as a live poll when Don gives a talk. Another approach to consider, on its own or combined
with the self-assessment: "What would you do?" scenarios. The reader works through a short
branching scenario, such as three departments that each define "readmission" differently while
the reader has no authority over any of them. They pick a response, see which mindset shift it
reflects, and read Don's commentary on it. Workers AI could optionally give feedback on a
free-text answer."

## Background

The post "The Systems Leadership Wayfinder: Five Mindset Shifts for Leading Complex Change"
describes five shifts, each written as a **From** and a **To**:

1. **See the Whole System** — from fixing individual problems in isolation, to understanding
   interconnections and root causes.
2. **Embrace Uncertainty** — from controlling outcomes through detailed planning, to
   experimenting and adapting through iterative learning.
3. **Listen Deeply** — from persuading others to accept your solution, to creating space for
   diverse perspectives and genuine understanding.
4. **Lead Without Authority** — from using position power to drive compliance, to building
   alignment and shared purpose across organizational boundaries.
5. **Balance Creative Tension** — from eliminating problems and resistance, to using the gap
   between current reality and future vision as fuel for change.

Each shift's section ends with a **Practical Application** paragraph. The post closes with a
**6-Week Development Plan**: weeks 1 to 5 each practise one shift in the order above, and week 6
is integration and reflection (this section was removed from the post on 2026-10-11; see
Clarifications). The post says the downloadable Wayfinder includes
"self-assessment frameworks for continued development", but the site offers no way to
assess yourself today.

The site is static by default (constitution Principle V): pages are prerendered, interactive
pieces are isolated islands, and the only server code is the two API endpoints the constitution
lists. A feature that needs shared state, such as a live poll, needs a new endpoint and so a
constitution amendment.

## Clarifications

### Session 2026-10-11

- Q: How should an earlier result be kept so a reader can compare a retake? → A: A results link.
  The versioned scores go in the URL fragment (never sent to the server) and are printed on the
  plan; nothing is stored by the site or the browser.
- Q: Is the live poll for talks part of this slice? → A: No, follow-up work as its own feature.
- Q: Are the "What would you do?" branching scenarios part of this slice? → A: No, follow-up
  work as their own feature, including any Workers AI feedback.
- Q: Should the fifteen statements be shown all on one page, or one shift at a time? → A: One
  form: five labelled groups of three five-point scales, then a "Show my results" button.
- Q: Where should the practical-application reminders and six-week plan activities live? → A:
  A single source. A validated data file holds the shifts, statements, reminders and week
  activities, and the post's "Practical Application" paragraphs are rendered from it through MDX
  components. (The post's 6-Week Development Plan was later removed; see the PR #176 decision
  below.)
- Q: When a reader opens the post through a results link, what should they see before
  retaking? → A: The earlier result right away (chart, summary, low-band links, print plan),
  marked "Earlier result from <date>", with an empty form below for the retake.
- Q: How should the text summary state each shift's position "in words"? → A: The score to one
  decimal plus a band phrase, e.g. "See the Whole System: 2.3 of 5, nearer 'From' (fixing
  problems in isolation)"; below 3 is nearer From, exactly 3 is in the middle, above 3 is
  nearer To.
- Q: For a low-scoring shift, is the results reminder the full Practical Application paragraph
  or a separate short line? → A: The full Practical Application paragraph, reused unchanged.
- Q: When results are on screen and the reader prints from the browser's own Print menu, what
  prints? → A: Once results exist, any print gives the plan only; without results, the post
  prints with the statements as a list.
- Q: When a reader finishes the assessment, should the address bar change to their results
  link? → A: Yes. Showing results replaces the address-bar fragment with the new result's
  fragment, adding no history entry; a retake replaces it again, so the newest result is the one
  compared next time.
- Q: When the post is opened through a results link, where does the page open? → A: At the top
  as usual, with a short "Your earlier result is below" link near the title that leads to the
  earlier result.
- Q: If a results link was made with an older version of the statements, is that earlier result
  still shown? → A: Yes, on its own (chart, summary, date), marked "made with an earlier set of
  questions"; after a retake the two are shown separately with no change per shift.
- Decision 2026-10-11 (Don, review of PR #176): the article was too long. The post now ends
  with its "Printable Resources" section; the "Practical First Steps" section, its "Immediate Actions (This Week)"
  and "6-Week Development Plan" subsections and the `DevelopmentPlan` component are removed. The
  week activities and the integration week stay in the data file and appear only in the reader's
  printed plan (User Story 3, FR-010). The post's reading time drops accordingly.

## Scope of this slice

In scope: the individual self-assessment inside the Wayfinder post (User Stories 1 to 4),
moving the post's "Practical Application" paragraphs and the six-week plan activities into the
assessment's data file so they live in one source, keeping the critical-thinking
questions' source for the post complete after that move (FR-021), and one paragraph in the
privacy policy about the assessment (FR-016a).

Out of scope (follow-up work, each its own feature): the live poll for talks (FR-019) and the
"What would you do?" scenarios, including any Workers AI feedback (FR-020). This slice needs no
constitution amendment.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take the self-assessment and see where I sit (Priority: P1)

A reader of the Wayfinder post reaches the self-assessment. For each of the five mindset shifts
they answer three short statements about how they usually act, on a five-point scale. All
fifteen statements are on one form, in five labelled groups (one per shift), followed by a "Show
my results" button. When they finish, they see a chart that places them between the shift's "From" and "To" on each of the
five shifts, with the same result also written out in text.

**Why this priority**: This is the core of the feature. On its own it turns the post's
framework into something a reader can apply to themselves.

**Independent Test**: Open the Wayfinder post, answer all fifteen statements, and confirm the
chart and the text summary show one position per shift that matches the answers given.

**Acceptance Scenarios**:

1. **Given** the Wayfinder post is open with JavaScript on, **When** the reader reaches the
   self-assessment, **Then** they see a short introduction and one form with five labelled
   groups, one per shift by name, each holding three statements with a five-point answer scale,
   followed by a "Show my results" button.
2. **Given** the reader has answered every statement, **When** they ask to see their results,
   **Then** a chart shows one position per shift on a line from that shift's "From" wording to
   its "To" wording, and a text summary lists the same five positions in words.
3. **Given** the reader has left one or more statements unanswered, **When** they ask to see
   their results, **Then** no results are shown and the reader is told which statements still
   need an answer, with focus moved to the first one.
4. **Given** the reader has seen their results, **When** they change an answer and ask again,
   **Then** the chart and summary update to match.
5. **Given** the reader uses only a keyboard or a screen reader, **When** they take the
   assessment and read the results, **Then** every statement can be answered and every result
   can be read without a pointer or sight of the chart.

---

### User Story 2 - Go from a low score to what to practise (Priority: P2)

For each shift where the reader scores low, the results point them to the part of the post that
covers that shift and to its practical application, so they know what to read and try next.

**Why this priority**: It connects the score to the post's own advice. It needs Story 1's
results but adds the step from "where am I" to "what do I do".

**Independent Test**: Answer so that two shifts score low and three do not; confirm exactly the
two low shifts show links, and that each link lands on the matching section of the post.

**Acceptance Scenarios**:

1. **Given** a result where a shift scores in the low band, **When** the reader views the
   results, **Then** that shift shows a link to its section in the post and its Practical
   Application paragraph.
2. **Given** the reader follows a shift's link, **When** the page moves, **Then** the matching
   mindset-shift heading is in view and not hidden under the site header.
3. **Given** no shift scores in the low band, **When** the reader views the results, **Then**
   the results say so and suggest the shift with the lowest score as the next one to practise.

---

### User Story 3 - Print a six-week plan shaped by my results (Priority: P2)

From the results, the reader prints a six-week development plan. The plan uses the post's
weekly activities but orders weeks 1 to 5 from the reader's lowest-scoring shift to their
highest, and keeps week 6 as integration and reflection. The printout also records the date and
the reader's five positions.

**Why this priority**: It gives the reader something to keep and act on, which the post already
promises in its self-assessment frameworks for continued development.

**Independent Test**: Complete the assessment, choose print, and confirm the print preview shows
only the plan, with weeks ordered by the reader's scores and the date and positions listed.

**Acceptance Scenarios**:

1. **Given** the reader has results, **When** they choose to print their plan, **Then** the
   printed page shows six weeks, weeks 1 to 5 each naming one shift with the data file's activities
   for it, ordered from lowest score to highest, and week 6 as integration and reflection.
2. **Given** two shifts have the same score, **When** the plan is built, **Then** they keep the
   post's own order between them.
3. **Given** the reader prints, by the "Print my plan" button or the browser's own Print menu,
   **When** the print preview appears, **Then** it holds the plan, the date and the five
   positions, and leaves out the site header, footer, share area and the rest of the post.

---

### User Story 4 - Retake later and see how I have grown (Priority: P3)

Weeks later the reader comes back through the results link they kept (FR-012), takes the
assessment again, and sees their new positions beside their earlier ones, so they can tell which
shifts have moved.

**Why this priority**: It turns a one-off quiz into a development tool, but it relies on the
reader keeping their results link.

**Independent Test**: Take the assessment, copy the results link, open it in a fresh browser
session, retake with different answers, and confirm the chart and text show both results with
the change per shift.

**Acceptance Scenarios**:

1. **Given** the reader opens the post through a results link, **When** the page loads,
   **Then** the page opens at the top as usual with a short "Your earlier result is below" link
   near the title that leads to the earlier result (FR-012), and the earlier result is shown at once (chart, text summary, low-band links and print
   plan), marked "Earlier result from <date>", with an empty form below for the retake.
2. **Given** the reader opened the post through a results link, **When** they finish a retake, **Then**
   the chart shows the earlier and the new position for each shift, told apart by more than
   colour, and the text summary states the change for each shift.
3. **Given** the reader opened the post without a results link, **When** they finish the assessment,
   **Then** only the new result is shown, with no error.
4. **Given** the reader wants to start fresh, **When** they choose to clear their answers,
   **Then** every answer and the earlier result loaded from the link are removed from the page,
   and the results fragment is removed from the address bar.
5. **Given** the reader finishes the assessment or a retake, **When** the results appear,
   **Then** the address-bar fragment is replaced by the new result's fragment without adding a
   history entry, so reloading shows that result as the earlier result.

---

### Edge Cases

- JavaScript is off or fails to load: the post still reads in full (including the Practical
  Application paragraphs, which are rendered at build time), and in place of the
  assessment the reader sees a short note that the self-assessment needs JavaScript, with the
  statements still readable as a list so the reader can reflect on them unaided.
- The reader answers every statement with the middle value: every shift sits in the middle, no
  shift is in the low band, and Story 2 scenario 3 applies.
- The reader answers every statement at the low end: all five shifts are low and all five show
  links; the plan keeps the post's own order (all tied).
- An earlier result (Story 4) was made against a different version of the statements: it is
  still shown on its own (chart, summary, date), marked "made with an earlier set of
  questions"; after a retake the two results are shown separately, with no change per shift.
- A results link whose fragment is malformed or altered: it is ignored and the reader is
  told it could not be read; nothing on the page breaks. The message is the assessment's
  status line, "This results link could not be read.", announced politely (FR-009) and shown
  as text above the form; no earlier result is shown, the title-card link keeps its "Take the
  self-assessment" wording, and the fragment stays as it is until results are shown or
  cleared.
- The post is printed without results (the normal browser print): the assessment prints as its
  statements, not as an empty form with controls. Once results are on screen, any print
  (button or browser menu) gives the plan only (FR-011).
- Narrow phone screens: the five-point scales and the chart fit at 320 px wide without sideways
  scrolling.
- Dark mode: the chart and scales are legible in both themes.

## Requirements *(mandatory)*

### Functional Requirements

**Assessment**

- **FR-001**: The Wayfinder post MUST contain the self-assessment, placed after the five
  mindset-shift sections and before "The Systems Leadership Wayfinder" section, with a heading
  so it appears in the page's heading outline. The heading outline MUST skip no level: the
  assessment heading is a second-level heading (like the post's other sections); inside it, each
  shift group (in the form, and in the statement list shown without JavaScript), the results
  ("Your results") and the earlier result each have a third-level heading, and nothing inside
  the block goes deeper than a fourth level.
- **FR-002**: The assessment MUST have three statements per shift, fifteen in all. Each
  statement describes an everyday behaviour, worded so that agreeing places the reader nearer
  that shift's "To".
- **FR-003**: Each statement MUST be answered on a five-point scale from "Rarely" to "Almost
  always", with every point labelled. Each shift's three statements form a group named by the
  shift; each statement is a group of five choices whose accessible name is the statement text;
  each choice's accessible name is its visible label, and the label text is part of the
  choice's click target. Only one choice per statement can be selected.
- **FR-004**: The statements, the shift names, their "From" and "To" wording, the anchors of the
  shift headings, the five answer labels, the assessment's title and introduction, the practical
  application text, the week 1 to 5 activities and the week 6 integration name and activities
  MUST live in one validated data file in the site's content, so Don can edit them without
  changing code, and invalid content (a missing or empty field, an unknown field, other than
  five shifts or three statements per shift, a repeated shift id or anchor, scale ends other
  than "Rarely" and "Almost always") MUST fail the build with a clear error naming the file and
  the field. This file is the single source: the post's five "Practical Application" paragraphs
  MUST be rendered from it through MDX components at build time, and that text MUST NOT also be
  written out in the post's prose; the build MUST fail, naming the post file, if any of the data
  file's practical application texts also appears verbatim in the post's prose. The week texts
  and the integration week appear only in the printed plan (FR-010); the post has no six-week
  plan section (Clarifications, PR #176 decision). The shift names (in the post's mindset-shift
  headings) and the
  "From" and "To" lines stay in the post's prose, where they belong to the argument; the build
  MUST fail, naming the post file and the shift, if a shift's "From" or "To" wording in the
  data file does not match the post's "From" or "To" line for that shift, so the two cannot
  drift apart. The statement list shown without JavaScript, the results reminders and the
  printed plan are all built from the same data file fields, so every rendering of a text
  matches the file exactly.
- **FR-005**: A shift's score MUST be the mean of its three answers, shown on a scale from 1
  ("From") to 5 ("To"). A shift is in the **low band** when its score is below 3.

**Results**

- **FR-006**: Results MUST be shown only when all fifteen statements are answered. Otherwise the
  reader is told which statements remain and focus moves to the first unanswered one. The
  message is an error summary above the "Show my results" button that states how many
  statements need an answer and lists each one as a link to it; each unanswered statement is
  also marked invalid to assistive technology and shows a visible "Choose an answer" message
  tied to it; answering a statement removes its message. Focus moves to the first choice of
  the first unanswered statement, so a screen reader announces that statement.
- **FR-007**: Results MUST include a chart placing the reader on each of the five shifts between
  its "From" and "To", and a text summary giving the same five positions in words. The text
  summary is the accessible equivalent of the chart, and it MUST be complete in every state:
  everything the chart shows (each position, and when an earlier result is shown, each earlier
  position and the change) is also in the text. The chart itself is a single image to
  assistive technology whose name points to the text summary. Each line gives the shift name,
  the score to one decimal ("2.3 of 5") and a band phrase quoting the nearer wording: "nearer
  'From' (<From wording>)" below 3, "in the middle" at exactly 3, "nearer 'To' (<To wording>)"
  above 3. Low-band shifts are marked in the summary by the band phrase, not by colour alone.
- **FR-008**: Each shift in the low band MUST show a link to that shift's section heading in the
  post and that shift's Practical Application paragraph, reused unchanged from the data file. If no shift is in the
  low band, the results MUST say so and name the lowest-scoring shift as the one to practise
  next. Each shift's heading anchor in the data file MUST be checked at build against the ids of
  the post's rendered headings; renaming a mindset-shift heading without updating its anchor
  MUST fail the build, naming the post file and the shift. Following the link moves focus to
  the heading and leaves the address-bar fragment unchanged (FR-012).
- **FR-009**: Results MUST be announced to assistive technology when they appear or change,
  through one polite status message (it does not interrupt): "Your results are ready below."
  when they first appear, "Your results are updated." when they change, the error summary's
  count when statements are missing (FR-006), "Your answers have been cleared." after clearing
  (FR-015), and "This results link could not be read." for an unreadable link (Edge Cases).
  Focus rules: after results appear or update (first take or retake), focus stays on the "Show
  my results" button and the results follow it in reading order; after clearing, focus moves
  to the first choice of the first statement; after following a low-band link or the "Your
  earlier result is below" link, focus moves to the target heading. Any scrolling these cause
  is smooth only when the reader has not asked for reduced motion, and instant otherwise.

**Printable plan**

- **FR-010**: From the results the reader MUST be able to print a six-week plan: weeks 1 to 5
  are the five shifts ordered from lowest score to highest (ties keep the post's order), each
  with the data file's activities for that shift; week 6 is the data file's integration and
  reflection week. The printout includes the date and the five positions. The printed plan reads in this
  order: the assessment title, the date, the five positions (the same lines as the text
  summary, in the data file's shift order), the results link, then weeks 1 to 6 in plan order,
  each with its week number, shift name and activities. The week texts come from the data file
  (FR-004); the post itself does not show them.
- **FR-011**: Once results are on screen, printing by the "Print my plan" button or by the
  browser's own Print menu MUST give the plan only. The printed plan MUST leave out the site header, footer, share area and the rest
  of the post, and fit on A4 and US Letter paper. Without results, the printed post shows the
  assessment as its statement list (each shift name followed by its three statements, in the
  data file's order), the same list shown without JavaScript, and no form controls.

**Retake and growth**

- **FR-012**: The reader MUST be able to compare a retake with an earlier result through a
  results link. The results show a link to the post whose URL fragment holds the five scores, the
  date taken and the statement set version, and nothing else: no individual answers, no
  identifier, no other reader data. The reader can copy it ("Copy link"; if copying fails the
  link stays visible and selectable), and the printed plan includes it. Beside the link, one
  plain sentence tells the reader that anyone they share the link with can see these scores,
  and that the site does not keep a copy. Opening the post through such a link loads that
  result as the earlier result and shows it at once (chart, text summary, low-band links and
  print plan), marked "Earlier result from <date>", with an empty form below for the retake.
  The page opens at the top as usual, with a short "Your earlier result is below" link near the
  post title that leads to it.
  The earlier-result link: the post's title card holds one short link line, just after the post
  summary, on every post that renders the assessment, built into the page. It reads "Take the
  self-assessment" and leads to the assessment heading (this also works with JavaScript off).
  When the page was opened through a readable results link, the assessment code changes its
  text to "Your earlier result is below" and makes it lead to the earlier result's heading. The
  line's height is reserved in the built page for one line at every width from 320 px, and both
  wordings fit on one line, so changing the text moves nothing on the page (FR-018a). Its
  accessible name is its visible text; it is in the normal tab order after the post summary;
  activating it moves focus to its target heading and leaves the address-bar fragment unchanged.
  Whenever results are shown, the address-bar fragment is replaced with the new result's
  fragment without adding a history entry; a retake replaces it again, so the newest result is
  the one compared next time.
  The site stores nothing in the browser: no cookies, local storage, session storage,
  IndexedDB, Cache Storage or service worker, and no data in the history entry's state. The
  only place a result persists is the page address itself, which the reader controls: like any
  address, the reader's own browser may keep it in its history, and the reader can copy, share,
  bookmark or print it. That is the "stores nothing" of the issue: the site and its code keep
  no copy. The fragment is never sent to the server (FR-016).
- **FR-013**: When an earlier result is available, the chart MUST show earlier and new positions
  told apart by more than colour: the new position is a filled circle, the earlier one a hollow
  diamond, with a text legend naming both. Both shapes, the tracks and the legend MUST stay
  visible in light and dark themes and in forced-colours mode. The text summary MUST give, for
  each shift, the new position, the earlier position and the change ("up 0.7", "down 0.3" or
  "no change").
- **FR-014**: Each result MUST record which version of the statements it was made with, and a
  result from a different version MUST NOT be compared. Such an earlier result is still shown
  on its own (chart, text summary, date), marked "made with an earlier set of questions"; after
  a retake the two results are shown separately, each with its own chart and complete text
  summary, with no change per shift. The version is computed at build from the shift order and
  the fifteen statement texts, so it changes automatically whenever Don edits any statement's
  wording (even a typo) or reorders shifts or statements, and only then; editing the reminders,
  week activities, shift names, "From" and "To" wording, labels, title or introduction does not
  change it. Don does not set it by hand.
- **FR-015**: The reader MUST be able to clear their answers and the earlier result loaded from
  a results link; clearing also removes the results fragment from the address bar without
  adding a history entry, and removes the plan from print. Clearing acts on the page and its
  address only: a link the reader has already copied, shared or printed keeps working, because
  the site holds no copy it could revoke. The results area says so in the same sentence that
  explains sharing (FR-012).

**Privacy, performance and accessibility**

- **FR-016**: Answers and results MUST NOT leave the reader's browser: the site sends them to no
  server, writes them to no log, and uses no analytics event for them. Answers are not personal
  data the site collects (constitution Principle VII stays as written). This covers every
  request the page makes while a result is in the address, by any means (fetch, XHR, beacon,
  image, script, style or font load, navigation, prefetch, WebSocket), including the `Referer`
  header: browsers never put the fragment in `Referer`, and the site's referrer policy
  (`strict-origin-when-cross-origin`) sends other sites only the origin. It also covers the
  Cloudflare Web Analytics beacon that the edge adds to production pages, which the site does
  not control: no page-view record it sends may contain the fragment. The current beacon
  removes the fragment and query from the page address and referrer before sending (research
  R14), and FR-016b states the release check and the fallback if that ever changes.
- **FR-016a**: The privacy policy MUST gain one short paragraph saying that the Wayfinder
  self-assessment runs only in the reader's browser, that the site never receives or stores the
  answers or scores, and that the results link holds the scores in the page address, so anyone
  the reader shares it with can see them.
- **FR-016b**: After release, Don MUST check one production page view of the Wayfinder post
  opened through a results link (PREVIEW-CHECK, post-release): in the browser's network panel,
  the Web Analytics beacon request's payload is inspected. **Pass**: no field of the payload
  contains `#`, `result=` or any part of the fragment. **Fail**: any field contains them. On a
  fail, Don the same day adds a Web Analytics rule that excludes the Wayfinder post's path from
  the beacon (a dashboard setting, which leaves the feature working and the rest of the site
  measured), and a follow-up issue records the fix. The check is repeated after any change to
  the Web Analytics setup.
- **FR-017**: The assessment MUST be an isolated interactive piece that loads only on the
  Wayfinder post and no earlier than the reader is likely to reach it; other pages ship no
  extra script. "Likely to reach it" means the assessment block comes within one viewport
  height of the visible area; the code also loads at once when the page address holds a
  results fragment, because the earlier result is shown at once (FR-012). The post MUST stay
  readable in full with JavaScript off (see Edge Cases).
- **FR-018**: The assessment and results MUST meet WCAG 2.2 AA in both light and dark themes
  and keep the post within the site's performance budget. In particular:
  - every control (each answer choice, "Show my results", "Clear my answers", "Print my plan",
    "Copy link", the low-band links, the error-summary links and the title-card link) can be
    reached and operated by keyboard alone, with a visible focus indicator that is never fully
    hidden by other content (2.4.7, 2.4.11);
  - each answer choice, with its label, and each button is a target at least 24 by 24 CSS
    pixels (2.5.8);
  - text meets 4.5:1 contrast, and chart tracks, markers, focus indicators and the boundaries
    of the answer controls meet 3:1 against their background, checked separately in the light
    and the dark theme (1.4.3, 1.4.11); nothing, including the low band, is marked by colour
    alone (1.4.1);
  - at 320 px wide nothing scrolls sideways: the scales, the chart rows, long band phrases
    and the results link (which wraps anywhere) all fit (1.4.10); the form and results still
    work at 200% zoom and with the WCAG text-spacing overrides applied, with no text cut off
    or overlapping (1.4.4, 1.4.12).
- **FR-018a**: Layout shift: the assessment MUST add no layout shift that counts toward
  Cumulative Layout Shift. On a page opened through a results link, the CLS recorded before the
  reader's first input is 0 at 320 px and at 390 px wide (the title-card line is reserved,
  FR-012, and the earlier result is inserted far below the visible area while the page is at
  the top, with the browser's scroll anchoring keeping visible content still if the reader has
  already scrolled). Results, error messages and the chart appear only in response to the
  reader's own action, in the same update, so their movement is input-driven and does not
  count. The post still meets the budget's CLS limit (below 0.1) at load and after scrolling.
- **FR-018b**: Budget figures: the Wayfinder post MUST stay within the site's existing budget,
  measured as the budget check does (transferred, compressed bytes; simulated mobile on slow 4G
  with 4x CPU slowdown at 390 by 844): LCP at most 2.5 s, CLS below 0.1, at most 200 ms of
  long-task blocking time, at most 10 KB of JavaScript and at most 150 KB in total. The budget
  check measures the post twice under those same conditions: at load, and after scrolling to
  the assessment, answering every statement and showing results, so the lazily loaded code,
  scoring and chart drawing all count. The post today loads no separate script file (its small
  scripts are inside the page), so the assessment's code file has the whole 10 KB JavaScript
  allowance and targets 6 KB compressed, leaving 4 KB of headroom. The assessment's styles,
  including its print styles, ship only on posts that render it; its markup and styles count
  toward the 150 KB total, with no separate limit.

**Critical-thinking questions**

- **FR-021**: Moving text into the data file MUST NOT shrink what the existing critical-thinking
  questions feature reads for this post. The post's question source MUST be built from the post
  with each `PracticalApplication` component expanded back into the text it renders
  ("Practical Application: …"), in place, so it holds the same post text the reader sees, and
  questions about the practical applications stay possible as they are today. The 6-Week
  Development Plan was removed from the post (Clarifications, PR #176 decision), so its week
  texts are no longer part of the question source. The assessment block
  (its title, introduction and statements) is not part of the post's argument and is left out,
  as other component tags are today. Acceptance: the question source for every post that uses
  these components contains each practical application text it renders, and no component tag. The source is still only the site's own committed content (the data file is
  site content under Principle VI), so the questions API rule that it reads only the site's own
  posts holds. The question source's version hash covers the expanded text, so an edit to the
  data file also counts as a changed post.

**Related approaches**

- **FR-019**: The live poll for talks is NOT part of this slice. It is follow-up work as its own
  feature (it needs a new API endpoint, shared state and a constitution amendment).
- **FR-020**: The "What would you do?" scenarios, including the "readmission" scenario and any
  Workers AI feedback on free text, are NOT part of this slice. They are follow-up work as their
  own feature.

### Key Entities

- **Mindset shift**: one of the five shifts, held in the single assessment data file. Has a
  name, a "From" and a "To" wording, the anchor of its section in the post, its practical
  application text (rendered in the post and reused as the results reminder) and its six-week
  plan activities (shown only in the printed plan). Order matches the post.
- **Integration week**: the week 6 integration and reflection activities, held in the same data
  file and shown only in the printed plan.
- **Statement**: one of three per shift. Has the text the reader rates and the shift it belongs
  to.
- **Statement set version**: identifies the current wording of all fifteen statements, so
  results from different wordings are not compared.
- **Answer**: the reader's 1–5 rating of one statement. Exists only in the reader's browser.
- **Result**: the five shift scores, the date taken and the statement set version. Exists only
  in the page and in the results link's URL fragment (FR-012).
- **Six-week plan**: the five shifts ordered by score plus the integration week, with the date,
  positions and results link, built from a result for printing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can finish all fifteen statements and see their results in under 5
  minutes. This is a usability target, not a performance one: Don checks it on the preview
  deployment by taking the assessment once without hurrying (PREVIEW-CHECK); the speed of the
  page itself is covered by SC-005 and FR-018b.
- **SC-002**: For any set of answers, the five positions shown in the chart and in the text
  summary match the mean of each shift's three answers, and the low-band links appear for
  exactly the shifts scoring below 3.
- **SC-003**: The printed plan fits on at most two pages of A4 or US Letter and contains no
  site navigation, footer or share area.
- **SC-004**: No request leaves the browser carrying answers or results: zero network requests
  are triggered by answering, viewing results, following a low-band link, copying the link,
  printing or clearing; and across a whole journey opened through a results link, no request of
  any kind (FR-016) has the fragment, `result=` or any answer in its URL, headers or body. An
  automated browser test records every request and checks both. The Web Analytics beacon,
  which exists only on production, is covered by the release check in FR-016b.
- **SC-005**: Pages other than the Wayfinder post load no additional script: their built HTML
  holds neither the assessment's loader nor any reference to its code file, and the scripts they
  share with every page are unchanged in content. The Wayfinder post still meets the budget in
  FR-018b and the "good" Core Web Vitals thresholds on mobile, and FR-018a's layout-shift
  requirement holds on a page opened through a results link.
- **SC-006**: The assessment and results pass the site's automated accessibility checks with no
  violations, in light and dark themes, in each of these states: the empty form, the form with
  errors shown, results shown, a comparison with an earlier result, two separate results
  (different statement versions), and the unreadable-link message; and can be completed by
  keyboard alone. Manual review on the preview (PREVIEW-CHECK) covers what automated checks
  cannot: that the text summary says everything the chart shows, the reading order of the
  printed plan and the no-JavaScript list, and a screen reader pass through errors and results.

## Assumptions

- The statement wording is drafted during implementation from the post's own text and the
  Common Pitfalls list, and Don edits it in review; this spec does not fix the wording.
- A five-point frequency scale and a low band below 3 are reasonable defaults for a
  self-reflection tool; this is not a validated psychometric instrument, and the introduction
  says so in plain language.
- The six-week plan reuses the post's former week activities and practical-application text,
  moved unchanged into the data file; no new activity copy is written. The post's own 6-Week
  Development Plan section was removed on 2026-10-11, so the week activities now appear only in
  the printed plan.
- Only the Wayfinder post gets the assessment. Reuse on other posts in the series is follow-up
  work.
- The chart is drawn by the site itself; no third-party script is added (constitution Principle
  X).
- No form or API on the site asks for a results link or scores. The contact form has no field
  for them; if a reader chooses to paste a link into a contact message, it is part of that
  message and is handled like any contact message under Principle VII.
- Changing the post's body changes its question-source hash once, as any post edit does
  (FR-021): the cached question set for this post is regenerated on its next request, drawing
  one generation from the site-wide token bucket. This is a one-off cost within the free plan
  and the existing bucket, with no change to the questions API.

## Follow-up work

- Live poll for talks (FR-019): needs an API endpoint, shared state and a constitution
  amendment.
- "What would you do?" branching scenarios (FR-020), including the "readmission" scenario and
  Don's commentary.
- Optional Workers AI feedback on free-text scenario answers: needs a constitution amendment,
  since reader-supplied text would reach the AI binding.
- A self-assessment for the later posts in the systems leadership series.
- Updating the downloadable Wayfinder PDFs to point to the online self-assessment.
