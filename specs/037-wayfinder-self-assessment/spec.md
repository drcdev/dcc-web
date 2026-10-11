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
is integration and reflection. The post says the downloadable Wayfinder includes
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
  activities, and the post's "Practical Application" paragraphs and 6-Week Development Plan are
  rendered from it through MDX components.

## Scope of this slice

In scope: the individual self-assessment inside the Wayfinder post (User Stories 1 to 4), and
moving the post's "Practical Application" paragraphs and 6-Week Development Plan into the
assessment's data file so both are rendered from one source.

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
   results, **Then** that shift shows a link to its section in the post and a short reminder of
   its practical application.
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
promises in its 6-Week Development Plan.

**Independent Test**: Complete the assessment, choose print, and confirm the print preview shows
only the plan, with weeks ordered by the reader's scores and the date and positions listed.

**Acceptance Scenarios**:

1. **Given** the reader has results, **When** they choose to print their plan, **Then** the
   printed page shows six weeks, weeks 1 to 5 each naming one shift with the post's activities
   for it, ordered from lowest score to highest, and week 6 as integration and reflection.
2. **Given** two shifts have the same score, **When** the plan is built, **Then** they keep the
   post's own order between them.
3. **Given** the reader prints, **When** the print preview appears, **Then** it holds the plan,
   the date and the five positions, and leaves out the site header, footer, share area and the
   rest of the post.

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

1. **Given** the reader opened the post through a results link, **When** they finish a retake, **Then**
   the chart shows the earlier and the new position for each shift, told apart by more than
   colour, and the text summary states the change for each shift.
2. **Given** the reader opened the post without a results link, **When** they finish the assessment,
   **Then** only the new result is shown, with no error.
3. **Given** the reader wants to start fresh, **When** they choose to clear their answers,
   **Then** every answer and the earlier result loaded from the link are removed from the page,
   and the results fragment is removed from the address bar.

---

### Edge Cases

- JavaScript is off or fails to load: the post still reads in full (including the Practical
  Application paragraphs and the 6-Week Development Plan, which are rendered at build time), and in place of the
  assessment the reader sees a short note that the self-assessment needs JavaScript, with the
  statements still readable as a list so the reader can reflect on them unaided.
- The reader answers every statement with the middle value: every shift sits in the middle, no
  shift is in the low band, and Story 2 scenario 3 applies.
- The reader answers every statement at the low end: all five shifts are low and all five show
  links; the plan keeps the post's own order (all tied).
- An earlier result (Story 4) was made against a different version of the statements: it is not
  compared, and the reader is told that the questions have changed since then.
- A results link whose fragment is malformed or altered: it is ignored and the reader is
  told it could not be read; nothing on the page breaks.
- The post is printed without results (the normal browser print): the assessment prints as its
  statements, not as an empty form with controls.
- Narrow phone screens: the five-point scales and the chart fit at 320 px wide without sideways
  scrolling.
- Dark mode: the chart and scales are legible in both themes.

## Requirements *(mandatory)*

### Functional Requirements

**Assessment**

- **FR-001**: The Wayfinder post MUST contain the self-assessment, placed after the five
  mindset-shift sections and before "The Systems Leadership Wayfinder" section, with a heading
  so it appears in the page's heading outline.
- **FR-002**: The assessment MUST have three statements per shift, fifteen in all. Each
  statement describes an everyday behaviour, worded so that agreeing places the reader nearer
  that shift's "To".
- **FR-003**: Each statement MUST be answered on a five-point scale from "Rarely" to "Almost
  always", with every point labelled.
- **FR-004**: The statements, the shift names, their "From" and "To" wording, the practical
  application text and the six-week plan activities MUST live in one validated data file in the
  site's content, so Don can edit them without changing code, and invalid content MUST fail the
  build with a clear error. This file is the single source: the post's five "Practical
  Application" paragraphs and its 6-Week Development Plan MUST be rendered from it through MDX
  components at build time, and that text MUST NOT also be written out in the post's prose.
- **FR-005**: A shift's score MUST be the mean of its three answers, shown on a scale from 1
  ("From") to 5 ("To"). A shift is in the **low band** when its score is below 3.

**Results**

- **FR-006**: Results MUST be shown only when all fifteen statements are answered. Otherwise the
  reader is told which statements remain and focus moves to the first unanswered one.
- **FR-007**: Results MUST include a chart placing the reader on each of the five shifts between
  its "From" and "To", and a text summary giving the same five positions in words. The text
  summary is the accessible equivalent of the chart.
- **FR-008**: Each shift in the low band MUST show a link to that shift's section heading in the
  post and a one- or two-sentence reminder of its practical application. If no shift is in the
  low band, the results MUST say so and name the lowest-scoring shift as the one to practise
  next.
- **FR-009**: Results MUST be announced to assistive technology when they appear or change.

**Printable plan**

- **FR-010**: From the results the reader MUST be able to print a six-week plan: weeks 1 to 5
  are the five shifts ordered from lowest score to highest (ties keep the post's order), each
  with the post's activities for that shift; week 6 is the post's integration and reflection
  week. The printout includes the date and the five positions.
- **FR-011**: The printed plan MUST leave out the site header, footer, share area and the rest
  of the post, and fit on A4 and US Letter paper.

**Retake and growth**

- **FR-012**: The reader MUST be able to compare a retake with an earlier result through a
  results link. The results show a link to the post whose URL fragment holds the five scores, the
  date taken and the statement set version; the reader can copy it, and the printed plan
  includes it. Opening the post through such a link loads that result as the earlier result.
  Nothing is stored by the site or the browser (no cookies, local storage or other browser
  storage), and the fragment is never sent to the server.
- **FR-013**: When an earlier result is available, the chart MUST show earlier and new positions
  told apart by more than colour, and the text summary MUST state the change per shift.
- **FR-014**: Each result MUST record which version of the statements it was made with, and a
  result from a different version MUST NOT be compared.
- **FR-015**: The reader MUST be able to clear their answers and the earlier result loaded from
  a results link; clearing also removes the results fragment from the address bar.

**Privacy, performance and accessibility**

- **FR-016**: Answers and results MUST NOT leave the reader's browser: the site sends them to no
  server, writes them to no log, and uses no analytics event for them. Answers are not personal
  data the site collects (constitution Principle VII stays as written).
- **FR-017**: The assessment MUST be an isolated interactive piece that loads only on the
  Wayfinder post and no earlier than the reader is likely to reach it; other pages ship no
  extra script. The post MUST stay readable in full with JavaScript off (see Edge Cases).
- **FR-018**: The assessment and results MUST meet WCAG 2.2 AA in both light and dark themes,
  work at 320 px wide without sideways scrolling, and keep the post within the site's
  performance budget.

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
  plan activities. Order matches the post.
- **Integration week**: the week 6 integration and reflection activities, held in the same data
  file and rendered in the post's 6-Week Development Plan.
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
  minutes.
- **SC-002**: For any set of answers, the five positions shown in the chart and in the text
  summary match the mean of each shift's three answers, and the low-band links appear for
  exactly the shifts scoring below 3.
- **SC-003**: The printed plan fits on at most two pages of A4 or US Letter and contains no
  site navigation, footer or share area.
- **SC-004**: No request leaves the browser carrying answers or results (zero network requests
  triggered by answering, viewing results, printing or clearing).
- **SC-005**: Pages other than the Wayfinder post load no additional script, and the Wayfinder
  post still meets the site's performance budget and the "good" Core Web Vitals thresholds on
  mobile.
- **SC-006**: The assessment and results pass the site's automated accessibility checks with no
  violations, in light and dark themes, and can be completed by keyboard alone.

## Assumptions

- The statement wording is drafted during implementation from the post's own text and the
  Common Pitfalls list, and Don edits it in review; this spec does not fix the wording.
- A five-point frequency scale and a low band below 3 are reasonable defaults for a
  self-reflection tool; this is not a validated psychometric instrument, and the introduction
  says so in plain language.
- The six-week plan reuses the post's existing week activities and practical-application text,
  moved unchanged into the data file; no new activity copy is written.
- Only the Wayfinder post gets the assessment. Reuse on other posts in the series is follow-up
  work.
- The chart is drawn by the site itself; no third-party script is added (constitution Principle
  X).

## Follow-up work

- Live poll for talks (FR-019): needs an API endpoint, shared state and a constitution
  amendment.
- "What would you do?" branching scenarios (FR-020), including the "readmission" scenario and
  Don's commentary.
- Optional Workers AI feedback on free-text scenario answers: needs a constitution amendment,
  since reader-supplied text would reach the AI binding.
- A self-assessment for the later posts in the systems leadership series.
- Updating the downloadable Wayfinder PDFs to point to the online self-assessment.
