# Feature Specification: This site as a project story

**Feature Branch**: `038-this-site-project-story`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "The dcc-web site itself appears as a project story, told in the same
four parts as the others. It covers the agent pipelines that take a change from spec to pull
request, the constitution that governs them, the single-approval review rule, and the work that
cut the verification gate from about 31 minutes to about 6. It links to the public repository."
(GitHub issue #169)

## Context

The projects section tells five stories (Tempo, the first drc.dev portfolio, Focus Pocus, Flux and
Cadence), each in four parts: Problem, Options, Build and Lessons. The site they sit on is itself
the most complete example of the way Don now works, and it has no story. Cadence's story ends by
saying the pipelines built for it "now build this website", so a reader who follows that thread
finds nothing.

This feature adds one new project story about the site. It is a content change: a new story file,
its pictures, and nothing else. Publishing a story needs no test edit, because the tests derive
the published list from the content (#55). The repository, `drcdev/dcc-web`, was confirmed
public on 2026-10-11, so the story can link to it as its source.

## Clarifications

### Session 2026-10-11

- Q: How should the story's copy be written? → A: From an interview with Don. The interview runs inside the clarify phase, and its answers are recorded in this spec under "Story source material"; the copy is written from those answers and checked against the repository record.
- Q: Should the story go live when the pull request merges, or merge as a draft? → A: Merge as a draft (`draft: true`); Don publishes it in a later, separate change.
- Q: What should the story's title be? → A: "doncoleman.ca".
- Q: What should the list picture show? → A: A screenshot of the doncoleman.ca home page in light mode, at the same size as the other stories' list pictures.
- Q: Which themes and invitation should the story carry? → A: Themes [Agentic development, Web, Static sites], reusing existing theme names, with a Cadence-style invitation aimed at teams weighing agent-driven delivery with human review.

## Story source material

Filled by the story interview with Don during the clarify phase. The story's Problem, Options
and Lessons copy, and Don's reasons anywhere in Build, are written only from what is recorded
here; facts (dates, counts, timings, rules) are still checked against the repository record
(FR-004).

- **Why rebuild the site**: *(to be filled by the interview)*
- **Constraints that mattered**: *(to be filled by the interview)*
- **Routes weighed and why the chosen one won**: *(to be filled by the interview)*
- **What was hardest**: *(to be filled by the interview)*
- **What he learned**: *(to be filled by the interview)*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read how the site is built (Priority: P1)

A visitor (a prospective client, a hiring manager or another engineer) opens the projects list,
sees a story about the site they are reading, and opens it. The story explains in four parts why
Don rebuilt his site, what routes he weighed, how the agent pipelines, the constitution and the
review rule work, how the verification gate was cut from about 31 minutes to about 6, and what he
learned.

**Why this priority**: This is the whole feature. Without a readable story there is nothing else.

**Independent Test**: Open the projects list on a preview deployment, open the new story, and read
it end to end with JavaScript on and off.

**Acceptance Scenarios**:

1. **Given** the projects list, once Don has published the story (FR-011), **When** a visitor
   views it, **Then** the site's story appears alongside the other published stories, with its title, one-line problem, themes, status and
   list picture.
2. **Given** the story page, **When** a visitor reads it, **Then** it has exactly the four parts
   Problem, Options, Build and Lessons, in that order, like every other story.
3. **Given** the Build part, **When** a visitor reads it, **Then** it covers: the agent pipelines
   that take a change from spec to pull request; the constitution that governs them; the rule
   that every pull request needs one approving review from Don, with agents opening pull
   requests from a separate account so his approval counts; and the work that cut the
   verification gate from about 31 minutes to about 6.
4. **Given** the Options part, **When** a visitor reads it, **Then** it states the constraints
   that mattered, compares the routes in a table whose columns match those constraints, and says
   why the chosen route won.

---

### User Story 2 - Go to the source (Priority: P2)

A technical reader who wants to see the pipelines, constitution and specs for themselves follows
the story's source link to the public repository.

**Why this priority**: The repository is the evidence behind the story; the story still stands
without it, so it ranks after the story itself.

**Independent Test**: On the story page, follow the source link and confirm it opens the public
`drcdev/dcc-web` repository without signing in.

**Acceptance Scenarios**:

1. **Given** the story page, **When** a visitor follows the source link, **Then** it opens
   `https://github.com/drcdev/dcc-web` and the repository is readable without signing in.

---

### User Story 3 - Follow the thread from Cadence (Priority: P3)

A visitor who has just read the Cadence story, which says its pipelines now build this website,
can reach the site's story from the projects list, and the site's story names Cadence as where
the pipelines came from.

**Why this priority**: It connects two stories but is not needed for either to make sense.

**Independent Test**: Read the Cadence story, return to the projects list, open the site's story,
and confirm it links back to Cadence where it mentions the pipelines' origin.

**Acceptance Scenarios**:

1. **Given** the site's story, **When** it mentions where the pipelines came from, **Then** it
   links to the Cadence story on this site.

---

### Edge Cases

- The repository later becomes private: the source link would fail. The story records in its
  notes comment that the repository was confirmed public on 2026-10-11; making it private again
  would be a reviewed change that removes the link (as Flux's story does for its private
  repository).
- Figures go stale: the gate time and other counts change as work continues. Every figure is
  stated with the date or pull request it comes from, or rounded ("about 31 minutes", "about 6"),
  so it stays true as a statement about that work.
- A link to the site's own host at another origin: the build already rejects links to the site's
  own host, so the story has no stand-in or demo link to the site itself (the reader is already
  on it).
- Older copy calls Don a Cloud Architect: the story must not repeat that; where it names his role
  it uses Director, Data Infrastructure and Architecture at Island Health.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST have one new project story about the site itself, in the projects
  collection, following the existing story template and schema with no schema change.
- **FR-002**: The story MUST be told in the four parts Problem, Options, Build and Lessons, as
  plain headed text, with the Options part holding a constraint list and a comparison table that
  the existing build checks accept.
- **FR-003**: The Build part MUST cover the agent pipelines (feature, small-change, bug and
  maintenance) that take a change from spec to pull request; the constitution that governs them;
  the single-approval review rule; and the verification-gate work that cut CI from about 31
  minutes to about 6 minutes.
- **FR-004**: Every factual claim in the story (dates, counts, timings, rules) MUST match the
  repository's own record (the constitution, the chore and spec records, the pull requests), and
  the story's notes comment MUST name where the facts come from, as the other stories do.
- **FR-005**: The story MUST set its source link to the public repository,
  `https://github.com/drcdev/dcc-web`.
- **FR-006**: The story MUST have a list picture and at least one picture in the story, each with
  alt text; the Build part SHOULD have a diagram of the pipeline, with a text description, as
  Cadence and Flux have for their architecture.
- **FR-007**: The story MUST give a status of `shipped` (the site has been live on doncoleman.ca
  since 2026-10-09) and a date of 2026-09-28, the day the constitution was ratified and the
  repository began.
- **FR-008**: The story MUST link to the Cadence story where it says where the pipelines came
  from.
- **FR-009**: The story's copy MUST be plain language with no hype or filler (constitution,
  Development Workflow), in Don's first-person voice like the other stories.
- **FR-010**: The story's copy MUST be written from Don's interview answers recorded under
  "Story source material", as every published story has been; no reason, option or lesson is
  invented beyond them.
- **FR-011**: The story MUST merge as a draft (`draft: true`). Don publishes it in a later,
  separate change; publishing is not part of this feature.
- **FR-013**: The story's title MUST be "doncoleman.ca", its themes MUST be
  [Agentic development, Web, Static sites], and it MUST carry an invitation in the style of
  Cadence's, aimed at teams weighing agent-driven delivery with human review.
- **FR-014**: The list picture MUST be a screenshot of the doncoleman.ca home page in light
  mode, at the same size as the other stories' list pictures.
- **FR-012**: No other story, page, schema, component or test changes in this feature, except
  where adding a published story requires it by design.

### Key Entities

- **Project story**: one story file with its details (title, one-line problem, description, up to
  four themes, status, date, list picture, story pictures, source link, optional invitation,
  draft flag) and four headed parts.
- **Pictures**: a list picture and story pictures stored with the story, each with alt text, and
  a diagram with a text description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After merge the projects list on production still shows the five existing
  published stories and leaves the new draft story out, while preview builds (which include
  drafts) show it for Don to read; once Don publishes it in a later
  change, the list shows six.
- **SC-002**: A reader can find each of the four required topics (pipelines, constitution,
  single-approval rule, gate from about 31 to about 6 minutes) in the Build part in one read.
- **SC-003**: 100% of the figures in the story can be traced to a named record in the repository.
- **SC-004**: The source link opens the public repository for a signed-out visitor.
- **SC-005**: The story page passes the existing accessibility, performance-budget and visual
  checks for the project story template with no check changed.
- **SC-006**: The story is readable with JavaScript turned off.

## Assumptions

- The repository `drcdev/dcc-web` is public (checked 2026-10-11 with the GitHub CLI: visibility
  PUBLIC).
- The gate figures come from `.specify/chores/verify-gate-phase-6/report.md`: CI `verify` on
  `main` went from 31 minutes (run 36814114154, 2026-10-01) to 6 minutes 15 seconds (run
  37090465334), with later `main` runs between 6:15 and 7:59.
- Status `shipped` follows Cadence's precedent: a project in daily use that is still gaining
  changes is shipped, not in progress.
- The date is the first commit and constitution ratification, 2026-09-28.
- There is no demo or stand-in link: the reader is already on the site, and the build rejects
  links to the site's own host.
- The list picture is a light-mode screenshot of the home page (FR-014), and the Build picture is
  a pipeline diagram; the plan decides how they are made, within the existing picture rules and size budget.
- The single-approval rule is described as it now stands (constitution 4.0.0 Principle III and
  the `main` ruleset), not as it was in earlier versions.
- Adding a published story needs no test edit (#55); any visual baseline that lists the projects
  may change, and is refreshed by the normal baseline process.

## Out of Scope

- Changes to other stories, including adding a link from Cadence to this story (a possible
  follow-up).
- Any change to the project story template, schema, components or checks.
- A blog post about the same work.
