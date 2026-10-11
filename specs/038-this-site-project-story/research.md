# Research: This site as a project story

No `NEEDS CLARIFICATION` remained in the Technical Context; the clarify phase settled title,
themes, draft state, the list picture and the story source material. These notes record the
choices the spec left to the plan.

## R1. File name and address

- **Decision**: `src/content/projects/doncoleman-ca.mdx`, so the address is
  `/projects/doncoleman-ca/`; pictures in `src/content/projects/images/doncoleman-ca/`.
- **Rationale**: The file name is the address (`docs/projects.md`); lower-case letters, digits
  and hyphens only, so the dot in the title becomes a hyphen. It reads as the title does.
- **Alternatives**: `this-site` or `dcc-web` (the repository name). Rejected: the first is vague
  in a shared link, the second is an internal name readers never see.

## R2. Frontmatter values

- **Decision**: `title: doncoleman.ca`; `themes: [Agentic development, Web, Static sites]`;
  `status: shipped`; `date: 2026-09-28`; `source: https://github.com/drcdev/dcc-web`; no `demo`
  or `standIn`; a Cadence-style `invitation`; `draft: true`; no `image` (the site's default
  sharing picture is used, as for the other stories).
- **Rationale**: FR-005, FR-007, FR-011, FR-013. The first commit and the constitution's
  ratification are both 2026-09-28 (`git log --reverse`, constitution footer). `demo` only
  accepts drc.dev and the build rejects links to the site's own host, so neither `demo` nor
  `standIn` applies.
- **Alternatives**: none open; each value is fixed by the spec.

## R3. List picture: how the screenshot is made

- **Decision**: A one-off Playwright script in the scratchpad (not committed) opens
  `https://www.doncoleman.ca/` in Chromium with `colorScheme: "light"`, a 1280 x 800 viewport
  and `deviceScaleFactor: 1.25`, waits for fonts and images, and saves a viewport (not
  full-page) PNG of 1600 x 1000. sharp then re-encodes it with no metadata. Saved as
  `images/doncoleman-ca/index.png`.
- **Rationale**: FR-014 asks for "the same size as the other stories' list pictures". The
  existing ones vary (1600 x 736, 1200 x 750, 1920 x 1080, 782 x 359), but every one renders in
  the same row slot, which `ProjectRow` fills through `<Image widths={[480, 800]}>`. 1600 px
  wide matches Cadence, comfortably covers the 800 w variant, and 16:10 matches the other
  home-page screenshot (drcdev, 1200 x 750). The production address is used because it is the
  page readers know; the `www` host is the main address since #154. A 1280 px viewport shows
  the desktop layout. Metadata is stripped because the docs ask for it and sharp is already a
  dependency (the Focus Pocus and Cadence stories did the same).
- **Alternatives**: Screenshot the local build (would show the same page, but a local build
  includes drafts and test-only content elsewhere; production is the honest picture). Cloudflare
  Browser Rendering (first-party, but needs an API token and account call for a one-off image;
  Playwright is already the repository's browser tool). A full-page screenshot (too tall for
  the row slot).

## R4. The Build diagram

- **Decision**: One SVG, `images/doncoleman-ca/pipeline.svg`, 1200 x 480 like the other
  architecture diagrams, `font-family="Inter, sans-serif"`, `role="img"` with an `aria-label`.
  Content: an issue or request flows through one of four pipelines (feature, small change, bug,
  maintenance), whose phases run in fresh subagents (plan, tests, implement, verify; the first
  three pipelines start from a spec, `/chore` from a plan, so no label claims every pipeline
  has a spec phase), to a pull request opened from a separate account, to Don's one approving review, to
  `main` and production. A band labels the constitution as governing every phase. Labels wrap
  rather than shrink, with 16 units of clear space plus 8 units of slack each side
  (`docs/projects.md` "Text in a diagram"). Then `pnpm run fonts:diagrams -- <file>` embeds the
  Inter subset. `alt`, `aria-label` and `description` say the same thing in words.
- **Rationale**: FR-006 (MUST have a pipeline diagram with a text description), matching the
  Cadence and Flux convention. The exact box labels are settled in implementation from the
  repository record; the plan fixes only the shape and the rules.
- **Alternatives**: A screenshot of a pull request (would show account names and change over
  time) or no diagram (FR-006 requires one).

## R5. The new story becomes the picked story

- **Finding**: `tests/helpers/content.ts` `pickStory()` chooses the newest project with a
  `source`, `demo` or `standIn` link, counting drafts because the E2E server is a local build.
  Today that is Cadence (2026-07-18, demo). The new story (2026-09-28, source) takes over, so
  the template-level checks (a11y, budget, headers, forced colours, no-JS, layout) run on it.
- **Decision**: Accept this; it is how the helper is designed, and it means the new page is
  checked by every template test. The story must therefore fit the budget (150 KB total
  transfer): the PNG is served through `<Image>` as a resized WebP and lazy where the template
  says so; the SVG is capped at 16 KB.
- **Risk**: the problem-part picture. Cadence's story already loads a screenshot plus a diagram
  and passes, so a similar pair should too. If the budget run fails, shrink the PNG or move the
  screenshot out of the story (keep it as the list picture only); never raise the budget.

## R6. The real-content guard and the title "doncoleman.ca"

- **Finding**: `tests/unit/content/no-real-content-in-tests.test.ts` builds needles from every
  project's quoted title, drafts included, and scans `tests/e2e`, `tests/build` and
  `tests/unit/content`. `tests/build/indexing.test.ts` line 29 has `host === "doncoleman.ca"`.
  Adding the story makes the guard fail on that line. (`".doncoleman.ca"` on the next line is
  not a match; the setup-check unit tests are outside the scanned folders.)
- **Decision**: Change the line to compare against `setupConfig.zone`, which that file already
  reads from `setup/config.json` (value `doncoleman.ca`). The host rule under test is unchanged.
- **Rationale**: The guard is a design rule (#55) and must not be loosened; the title is fixed
  by FR-013. Reading the host from configuration is also better practice than a literal.
- **Alternatives**: Change the title (contradicts FR-013); exempt the line in the guard
  (loosens a check, Principle II).

## R7. Red-first evidence

- **Decision**: Order the work so existing tests go red before they go green:
  1. Add the story file and pictures with the raw diagram (no font block): the diagram font unit
     test fails naming the file; the guard test fails naming `indexing.test.ts`.
  2. Run `fonts:diagrams`, then change the `indexing.test.ts` literal: both go green.
- **Rationale**: Principle I asks for tests seen to fail first. No new test is needed, because
  the content-derived tests already describe every behaviour the spec requires that a test can
  observe (`docs/testing.md` "Real content in tests").

## R8. Visual baselines and drafts

- **Finding**: `tests/e2e/visual.spec.ts` shoots the fixture project rows and the fixture story
  template on the fixture site (port 4322), which holds fixture projects only. No real home or
  projects page is shot.
- **Decision**: No baseline changes are expected. If one does change, refresh it through
  `.claude/skills/_shared/visual-baselines.md` (macOS and Linux via Docker).
- **Draft visibility**: Production omits the story (SC-001); the branch preview shows it marked
  as a draft. Wording, facts, pictures in both themes and the signed-out source link are
  `[PREVIEW-CHECK]` items for Don.

## R9. Facts to check against the repository record (FR-004)

Each figure in the copy is traced before it is written, and the notes comment names the source:

| Claim | Record |
|---|---|
| Started 2026-09-28; constitution ratified the same day | `git log --reverse`; constitution footer |
| Live on doncoleman.ca since 2026-10-09 | `specs/011-launch/tasks.md` (live checks passed, closed out 2026-10-09 in #101, PR #138), as in the spec's Fact sources |
| Four pipelines: `/deliver`, `/tweak`, `/squash`, `/chore`; first three ported from Cadence | `.claude/skills/`, `CLAUDE.md` "Orchestration skills" |
| Constitution: eleven principles, version 4.0.0 | `.specify/memory/constitution.md` |
| One approving review from Don; agents open PRs from `drc-agents`; auto-merge armed | Constitution Principle III; `CLAUDE.md` "Merging"; PR #105, issue #143 |
| CI `verify` on `main`: 31 min (run 36814114154, 2026-10-01) to 6 min 15 s (run 37090465334) | `.specify/chores/verify-gate-phase-6/report.md` |
| Pruned tests and content-derived tests | Issues #55 (PR #67) and #97 (PR #111) |
| Repository public | Checked 2026-10-11 (spec Assumptions) |
| Don's role, if named: Director, Data Infrastructure and Architecture at Island Health | Spec edge cases |

Counts that will change (specs, chores, pull requests) are given with a date or left out.
