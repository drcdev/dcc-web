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
- Q: Why did you rebuild doncoleman.ca instead of staying on Ghost with the Flux theme? → A: To own it in a repo, for cheaper and simpler hosting, and to make room for consulting work; not as an agent experiment.
- Q: Which constraints decided the route? → A: Agents know the stack well, static by default, under $13 a month, keeps the Flux look.
- Q: Which routes did you weigh, and why did the chosen one win? → A: Stay on Ghost/Flux, Astro on GitHub Pages or Vercel, or Astro on Cloudflare Workers; Workers won because one free plan serves the static pages and runs the contact and AI-question APIs.
- Q: What was hardest? → A: Gate speed and parallel runs: CI took about 31 minutes, and parallel worktrees collided on ports and failed under machine load.
- Q: What did you learn? → A: Tests should check what matters (#55, #97); the gate sets the pace (about 31 to about 6 minutes); and, in Don's words, "Agents will happily overcomplicate things and I had to work at keeping decisions pragmatic and testing focused on what is important."

## Story source material

Filled by the story interview with Don during the clarify phase. The story's Problem, Options
and Lessons copy, and Don's reasons anywhere in Build, are written only from what is recorded
here; facts (dates, counts, timings, rules) are still checked against the repository record
(FR-004).

- **Why rebuild the site**: Three reasons. (1) Own it in a repo: move off hosted Ghost on Magic
  Pages so the content, theme and hosting all sit in one repository Don controls. (2) Cheaper,
  simpler hosting: a static site on a free plan instead of paying for hosted Ghost plus a separate
  Supabase backend. (3) Room for consulting work: the site needed project stories, a contact form
  and work-with-me pages, which were awkward to build inside a Ghost theme. The rebuild is **not**
  framed as an experiment in agent-driven development.
- **Constraints that mattered**: Four, which become the Options table columns: agents know the
  stack well; pages are static by default; it costs under $13 a month; it keeps the Flux look.
- **Routes weighed and why the chosen one won**: Three routes: stay on Ghost with the Flux theme;
  Astro on GitHub Pages or Vercel; Astro on Cloudflare Workers. Workers won because one free plan
  serves the static pages and also runs the small contact and AI-question APIs.
- **What was hardest**: The speed of the verification gate and parallel runs. CI took about 31
  minutes, and parallel worktrees collided on the same ports and failed under machine load.
- **What he learned**: (1) Tests should check what matters: tests that only restate
  configuration cost time without catching anything, so they were pruned and replaced by tests
  derived from the content (#55, #97). (2) The gate sets the pace: cutting verify from about 31
  minutes to about 6 did more for throughput than any single feature. (3) In Don's words, to be
  kept close to verbatim: "Agents will happily overcomplicate things and I had to work at keeping
  decisions pragmatic and testing focused on what is important."

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
  notes comment that the repository was confirmed public on 2026-10-11. Don owns the
  repository's visibility; changing it to private triggers a reviewed change, in the same
  sitting, that removes the source link (as Flux's story does for its private repository).
- Figures go stale: the gate time and other counts change as work continues. Every figure is
  stated with the date or pull request it comes from, or rounded ("about 31 minutes", "about 6"),
  so it stays true as a statement about that work.
- A link to the site's own host at another origin: the build already rejects links to the site's
  own host, so the story has no stand-in or demo link to the site itself (the reader is already
  on it). The title and any mention of "doncoleman.ca" in the copy are plain text, never a link.
- Older copy calls Don a Cloud Architect: FR-015 rules this out.
- The page goes over budget once its pictures are added: shrink the screenshot first; if it is
  still over, drop the screenshot beside Problem and keep it as the list picture only. A diagram
  over 16 KB is simplified (fewer or shorter labels). The budget is never raised (FR-020).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST have one new project story about the site itself, in the projects
  collection, following the existing story template and schema with no schema change.
- **FR-002**: The story MUST be told in the four parts Problem, Options, Build and Lessons, as
  plain headed text, with the Options part holding a constraint list and a comparison table that
  the existing build checks accept. The constraint labels, in the list and as the table's
  columns, MUST be the four recorded constraints in the recorded order (agents know the stack
  well; static by default; under $13 a month; keeps the Flux look). A label may be shortened but
  must keep its meaning, and the list and table use identical wording.
- **FR-003**: The Build part MUST cover the agent pipelines (feature, small-change, bug and
  maintenance) that take a change from spec to pull request; the constitution that governs them;
  the single-approval review rule; and the verification-gate work that cut CI from about 31
  minutes to about 6 minutes. The pipelines are the four named in `CLAUDE.md` "Orchestration
  skills": `/deliver` (feature), `/tweak` (small change), `/squash` (bug) and `/chore`
  (maintenance); the first three came from Cadence and `/chore` was added for this site.
- **FR-004**: Every factual claim in the story (dates, counts, timings, rules) MUST match the
  repository's own record, as listed under "Fact sources" below. Where records disagree, the
  primary record wins (the GitHub Actions run over the chore report, the merged pull request
  over a spec), and the copy follows it. The story's notes comment MUST name where the facts
  come from in the form the other stories use: a `{/* ... */}` comment first in the body,
  starting "Written from Don's interview answers (2026-10-11).", then the facts and their
  records, the 2026-10-11 public check of the repository, and why there is no demo link.
- **FR-005**: The story MUST set its source link to the public repository,
  `https://github.com/drcdev/dcc-web`.
- **FR-006**: The story MUST have a list picture and exactly two story pictures, each with alt
  text: the list picture shown again beside Problem, and a pipeline diagram beside Build with a
  text description, as Cadence and Flux have for their architecture. FR-014, FR-017 and FR-020
  set the picture rules.
- **FR-007**: The story MUST give a status of `shipped` (the site has been live on doncoleman.ca
  since 2026-10-09) and a date of 2026-09-28, the day the constitution was ratified and the
  repository began.
- **FR-008**: The story MUST link to the Cadence story where it says where the pipelines came
  from. The link text names Cadence (not "here" or "this story"), and the sentence agrees with
  Cadence's own story, which says its deliver, tweak and squash pipelines now build this site.
- **FR-009**: The story's copy MUST be plain language with no hype or filler (constitution,
  Development Workflow), in Don's first-person voice like the other stories, including the
  invitation. A reviewer checks it against these markers of the AI-sounding copy Don cuts
  (feature 026 precedent): no praise adjectives ("powerful", "seamless", "robust"); no filler
  openers or closers ("It's worth noting", "In the end"); no "not just X, but Y" turns; no
  rhetorical questions; no lists of three for rhythm; short sentences that state one thing. This
  is a style rule from the constitution, not a reading-level target: the WCAG reading-level
  criterion (3.1.5) is AAA, beyond the AA the site must meet.
- **FR-010**: The story's copy MUST be written from Don's interview answers recorded under
  "Story source material", as every published story has been; no reason, option or lesson is
  invented beyond them. Problem, Options, Lessons and any reason given in Build come only from
  those answers; Build's account of how the pipelines, constitution, review rule and gate work
  comes from the repository record (FR-004). No sentence presents the rebuild as an experiment in
  agent-driven development or gives that as a reason for it. Don's quoted lesson keeps every
  word in his order; only punctuation and capitalisation may change.
- **FR-011**: The story MUST merge as a draft (`draft: true`). Don publishes it in a later,
  separate change; publishing is not part of this feature. Production builds leave the story
  and its pictures out entirely, so production pages and their budget are unchanged.
- **FR-013**: The story's title MUST be "doncoleman.ca", its themes MUST be
  [Agentic development, Web, Static sites], and it MUST carry an invitation in the style of
  Cadence's: one first-person sentence ending "tell me about it", aimed at teams weighing
  whether agents should deliver their changes with a person approving every merge. The
  invitation link itself is the template's ("Tell me about a problem like doncoleman.ca", to the
  contact form), unchanged.
- **FR-014**: The list picture MUST be a screenshot of the doncoleman.ca home page in light
  mode, 1600 x 1000 pixels (16:10), with its metadata stripped and the file under 500 KB. It
  stays a light-mode picture in both themes; Don checks how it sits on the dark page on the
  preview.
- **FR-015**: Where the story names Don's role it MUST use "Director, Data Infrastructure and
  Architecture at Island Health", never "Cloud Architect".
- **FR-016**: The story's `problem` MUST be one sentence of at most 140 characters, ending with
  a full stop, drawn from the "Why rebuild the site" answer. Its `description` MUST be one
  sentence summing up the story for search results and link previews.
- **FR-017**: Picture text alternatives:
  - Each alt text is one sentence that says what the picture shows, without opening with
    "Image of", "Picture of" or "Screenshot of".
  - The list picture's alt names the doncoleman.ca home page in light mode and what is visible
    on it (its heading and main sections). The words inside the screenshot are not carried in
    full: the screenshot shows how the page looks, which is the essential presentation (WCAG
    1.4.5 exception). The same picture beside Problem carries the same alt text.
  - The diagram's alt is short and names its parts (the pipelines, the review, `main`). Its
    text description is longer and states every step and arrow the diagram shows, in words, so
    nothing in the diagram is only in the picture. The description is shown as a visible
    caption directly under the diagram.
  - The diagram is drawn on its own opaque light background, so it looks the same in both
    themes. Label text has at least 4.5:1 contrast with its box, and boxes and arrows at least
    3:1 with the background. Nothing is shown by colour alone; every distinction has a label.
  - Labels have a font size of at least 24 units in a 1200-unit-wide diagram, like the other
    diagrams. At
    phone width they draw small, so the visible description carries every label.
  - The Inter letters are embedded in the SVG; if they fail to render, labels fall back to the
    system sans-serif and still fit, because each label has 8 units of slack beyond the 16
    units of clear space the diagram test needs.
- **FR-018**: Page structure, links and focus come from the unchanged template, which the story
  MUST not work around: one h1 (the title), the four parts as h2, anything smaller as h3 with no
  skipped level; the Options table with header cells and a caption, inside its own scrolling,
  keyboard-focusable region, so at phone width only the table scrolls sideways, never the page
  (a data table is allowed two-way scrolling under WCAG 1.4.10); the source link reading "Source
  code for doncoleman.ca"; the site's visible focus outline on every link.
- **FR-019**: The story page MUST add no client-side JavaScript.
- **FR-020**: The story page MUST stay within the existing performance budget, checked by
  `tests/e2e/budget.spec.ts` on the project story template: on simulated mobile (390 x 844
  viewport, slow 4G, default light theme), LCP at most 2.5 seconds and CLS under 0.1 (Core Web
  Vitals "good"), total transfer at most 150 KB, and the existing JavaScript and long-task
  limits. Pictures are served resized (480 and 800 px wide) with their width and height set so
  nothing shifts; the first picture on the page loads eagerly and the rest lazily, as the
  template does. The diagram file stays under 16 KB (`docs/projects.md`, enforced by
  `tests/unit/site/diagram-fonts.test.ts`) and makes no font request of its own.
- **FR-012**: No other story, page, schema, component or test changes in this feature, except
  where adding a published story requires it by design.

### Fact sources

| Claim | Record |
|---|---|
| Repository began and constitution ratified on 2026-09-28 | First commit (`git log --reverse`); constitution footer |
| Live on doncoleman.ca since 2026-10-09 | `specs/011-launch/tasks.md` (live checks passed, closed out 2026-10-09 in #101, PR #138) |
| The four pipelines, and which came from Cadence | `CLAUDE.md` "Orchestration skills"; `.claude/skills/` |
| The constitution: eleven principles | `.specify/memory/constitution.md`, version 4.0.0 |
| One approving review from Don; agents open pull requests from a separate account; auto-merge | Constitution 4.0.0 Principle III and `setup/github-ruleset.json`, as of 2026-10-11; `CLAUDE.md` "Merging" |
| CI `verify` on `main` from about 31 minutes to about 6 | `.specify/chores/verify-gate-phase-6/report.md`: 31 min (run 36814114154, 2026-10-01; 31 min 46 s wall) to 6 min 15 s (run 37090465334) |
| Pruned tests and content-derived tests | #55 (PR #67) and #97 (PR #111) |
| Repository is public | Checked 2026-10-11 (Assumptions) |

"About 31 minutes" stands for the recorded 31 minutes and "about 6" for 6 minutes 15 seconds.
The story uses those rounded forms or the exact recorded values, and no other rounding. A count
that keeps changing (specs, chores, pull requests) is given with its date or left out.

### Key Entities

- **Project story**: one story file with its details (title, one-line problem, description, up to
  four themes, status, date, list picture, story pictures, source link, optional invitation,
  draft flag) and four headed parts.
- **Pictures**: a list picture (also shown beside Problem) and a pipeline diagram (beside
  Build) stored with the story, each with alt text, the diagram also with a text description.

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
- **SC-005**: The story page passes the existing accessibility (`tests/e2e/a11y.spec.ts`),
  performance-budget (`tests/e2e/budget.spec.ts`, FR-020) and visual checks for the project
  story template with no check changed. The accessibility and budget checks run on the "picked
  story": the newest project with a source, demo or stand-in link, drafts included, because the
  test builds include drafts. This story (2026-09-28, source link) becomes the picked story, so
  those checks run against it while it is still a draft. The visual check shoots the fixture
  story template, not this story.
- **SC-006**: The story is readable with JavaScript turned off, including both pictures, their
  alt text and the diagram's description.

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
- The single-approval rule is described as it stands on 2026-10-11 (constitution 4.0.0
  Principle III and `setup/github-ruleset.json`), not as it was in earlier versions.
- Adding a published story needs no test edit (#55); any visual baseline that lists the projects
  may change, and is refreshed by the normal baseline process.

## Out of Scope

- Changes to other stories, including adding a link from Cadence to this story (a possible
  follow-up).
- Any change to the project story template, schema, components or checks.
- A blog post about the same work.
