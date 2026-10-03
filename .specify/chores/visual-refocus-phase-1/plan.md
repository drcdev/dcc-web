# Chore plan: visual-refocus-phase-1 (issue #40, phase 1)

Branch: `chore/visual-refocus-phase-1`, at `main`'s code (commit 7a24ab7, after #39 merged).
Issue: https://github.com/drcdev/dcc-web/issues/40. This run delivers phase 1 of the issue's
Plan only, so the PR body says `Part of #40` (phase 1).

## Goal

The `visual` Playwright project takes full-page snapshots of ten real content subjects: home,
about, contact, the writing landing, all-posts, topic, sample-post and Drift series pages, the
projects index and the Focus Pocus story. Any content edit changes their pixels by design, so a
content PR fails the gate until both platforms' baselines are refreshed. The constitution already
says accessibility and visual checks cover templates, not stories. Phase 1 refocuses the visual
project on the design system (V1, V2), adds a content-independent geometry smoke test to the
`e2e` project (V4), and makes the baseline guidance in CLAUDE.md and the four pipelines say the
same, shorter thing (V6). No page, component, style or script of the site changes.

Note on counts: the issue says "twelve" real-content subjects and "54 images per platform".
The spec has ten such subjects (V1 lists the same ten) and 58 images per platform (16 subjects;
`menu-open` has two). This plan works from the files. The PR body notes the discrepancy in one
line.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. `tests/e2e/visual.spec.ts` targets only the shell (`/` for header, footer and the open menu),
   the not-found page (`/nope/`) and the fixture site (`http://localhost:4322/sections/`).
   `grep -nE 'open\(page, "' tests/e2e/visual.spec.ts` shows no other path. A PR that only
   touches `src/content/**` therefore cannot change a snapshotted subject (issue acceptance 1).
   The not-found page and `/` share the shell. Its body copy comes from `src/pages/404.astro`,
   not from a content collection. `/` provides the header and footer element shots, not the
   page body.
2. `pnpm exec playwright test --project=visual --list` reports **18** tests (was 58).
3. `tests/e2e/visual.spec.ts-snapshots/` holds **36** PNGs: 18 `*-darwin.png` and 18
   `*-linux.png`, covering header 4, footer 4, menu-open 2, not-found 4 and sections 4. It
   held 116 before.
4. `pnpm exec playwright test --project=visual` passes on the kept 18 tests with no baseline
   refresh. The kept subjects' pixels do not change.
5. The new geometry spec passes in the `e2e` project: 18 templates x 2 widths = **36** tests.
   `--project=e2e --list` goes from 583 to 619 tests in 18 files.
6. `docs/testing.md` has one line for every removed subject saying where its coverage went
   (issue acceptance 2). The Visual row no longer says "The only guard on design regressions."
7. CLAUDE.md "Visual baselines" and the baselines step of `deliver`, `tweak`, `squash` and
   `chore` carry the same shared sentences. A new unit test enforces that (issue acceptance 3).
8. The existing guards stay green: `tests/unit/setup/*.test.ts`,
   `tests/unit/site/config-files.test.ts` and `tests/unit/ci/*.test.ts`.

**Before measurement** (CI run 37136029981, the push of #39 to `main` at 7a24ab7, full tier,
success):

| What | Before |
|---|---|
| `e2e` job | 473 s (7 min 53 s) |
| `test:e2e:parallel` step ("Run the end-to-end, accessibility, visual and sections projects") | 335 s (5 min 35 s) |
| Whole run (first job start to `verify` done) | 500 s (8 min 20 s) |
| Visual tests, local `--project=visual --list` | 58 |
| E2E tests, local `--project=e2e --list` | 583 in 17 files |

The after figures come from this PR's own CI run (W5). A PR run adds the preview site-check, so
the comparable number is the `test:e2e:parallel` step, not the whole `e2e` job. The PR body
gives both, labelled.

## Scope

**In:**

- `tests/e2e/geometry.spec.ts` (new).
- `tests/e2e/visual.spec.ts`: remove the ten subjects, fix the stale head comment.
- `tests/e2e/visual.spec.ts-snapshots/`: `git rm` the 80 orphaned PNGs.
- `tests/unit/setup/pipeline-visual-baselines.test.ts` (new).
- `CLAUDE.md`: the "Visual baselines" section and the alignment-list bullet.
- `.claude/skills/{deliver,tweak,squash,chore}/SKILL.md`: the baselines step, and the
  one-clause baseline condition in the deliver/tweak tasks rows and the squash fix row.
- `docs/testing.md`: the Visual row, a coverage-mapping subsection, a dated
  "Measured gate times" entry, and the two stale `#37` references (see W4).
- This plan, and the review report later.

**Out:**

- Phase 2 of #40: V3, the fixture post and story snapshots on the fixture site, and V5, the
  computed theme-token checks on the sections fixture. These are the next `/chore`.
- Phase 3 of #40: recording the before and after `e2e` times on the issue.
- `playwright.config.ts`, `package.json` scripts, `.github/workflows/*`,
  `scripts/visual-baselines-linux.sh`. V6 keeps the baseline toolchain as it is, and
  `config-files.test.ts` and `workflows.test.ts` pin them.
- Any baseline refresh (no Docker run; the kept images are untouched).
- The constitution. Its "visual checks cover page templates" wording already matches.

**Follow-ups for the PR body:**

1. #40 phase 2 (V3, V5): fixture post and story snapshots plus computed-token checks, with
   baselines generated once on both platforms. This phase's coverage mapping points the post
   and story templates' visual coverage at it.
2. #40 phase 3: record the before and after `e2e` job times on the issue.
3. Noticed: the "Change tiers" table still lets a content-only change run the whole `e2e` job,
   including `visual`. After this phase that costs time but can no longer fail on content
   pixels. Narrowing `e2e` for content-only changes is a CI change (Principle III) and is not
   part of #40.
4. Noticed: the geometry test overlaps the no-JS spec's horizontal-scroll check (JS off) and the
   a11y reflow check (320 px). If phase 3's timings show the `e2e` job still long, folding them
   together is a candidate.

## Constitution Check

- **I. Test-First:** W1 and W3 write their tests first and see them run (W1: green on the
  current site is the expected outcome for a smoke test; see W1 "Seen to fail"). W2 removes
  tests, and a line-by-line coverage mapping (W2, mirrored in `docs/testing.md` by W4) shows
  where each guarantee now lives.
- **II. Automated Release Gate:** this removes checks, which Principle II forbids only "to get a
  change through". Here the removal is its own reviewed change, decided in #40 (V1 ticked), with
  a coverage mapping and a replacement geometry check. No check is skipped or disabled for any
  other change. The full gate runs locally (orchestrator) and in CI, because `tests/` and the
  `SKILL.md` files are full-tier paths.
- **III. Human Review for Major Changes:** no criterion fires.
  - No dependency, integration or service is added or removed.
  - No contact data is touched.
  - The design system, layout, navigation and visual identity of the site are unchanged; not one
    rendered pixel moves. What changes is which pages the test suite pixel-matches. The guard on
    visual identity (the shell, not-found and sections fixture snapshots) is kept whole and
    blocking (V2). The removed shots guarded content, not identity.
  - No running-cost change.
  - CI, deployment and infrastructure configuration are untouched: no `.github/`, no
    `playwright.config.ts`, no `package.json`, no `wrangler.jsonc`.
  - The constitution is not amended.

  Verdict: **not major**, so auto-merge applies. Judgment call: "when in doubt, treat as major"
  was weighed. Reducing visual coverage could be read as weakening a guard on visual identity.
  It is not a doubt case, because the identity subjects stay blocking on both platforms and Don
  ticked V1 and V2 in the issue. The orchestrator re-checks the verdict against the real diff at
  Finish, and the pre-PR pause puts it to Don anyway.
- **IV. First-Party Before Custom:** Playwright's own APIs throughout (`--list`,
  `toHaveScreenshot`, `locator.boundingBox()`, `page.evaluate`, `page.emulateMedia`). First-party
  option considered for the element-width check: `expect(locator).toBeInViewport()`. It falls
  short because it asserts intersection with the viewport, not containment within its width, and
  elements below the fold fail it. So a short DOM walk inside `page.evaluate` is the custom part.
  No Astro decision is made, so no Astro docs page is cited. No new package.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected. This change makes content edits cheaper to land.
- **VII. Private Data:** unaffected. No secrets are read or printed.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected.
- **X. Accessible, Fast and Private:** unaffected. The `a11y` project (axe on every template at
  both widths and themes) and the `budget` project are untouched, and axe stays the contrast
  guard.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/visual-refocus-phase-1/` and the `after_chore_*` commits.

## Work items

Order: W1 and W2 are independent. W3 writes its unit test before its prose edits. W4 depends on
W1 and W2 (it describes them). W5 is the orchestrator's.

### W1 Geometry smoke test (new, `e2e` project)

- [x] W1 done

**Files:** `tests/e2e/geometry.spec.ts` (new). No config change: the `e2e` project's
`testIgnore` does not match it, so `e2e` picks it up.

**Test:** new-first. **Layer: E2E.** Layout geometry only a real browser can compute. This is
the cheapest layer that can observe it, and it runs on real pages because it reads no content.
It goes in `e2e`, not `visual`, so it never needs baselines. Second-layer reason, in the spec's
head comment: `no-js.spec.ts` already asserts no horizontal page scroll per template at 390 and
1280 with JavaScript **off**, and `a11y.spec.ts` asserts it at 320 px for reflow. This spec
asserts it with JavaScript **on** (the menu button, theme switch and islands are present), next
to the two checks nothing else makes. The extra assertion costs no extra page load.

**Shape:**

- Import `TEMPLATES` from `./templates.ts`. Loop `for (const template of TEMPLATES)` and
  `for (const size of WIDTHS)`, with `WIDTHS` = phone 390x844 and desktop 1280x800, the same
  objects the other specs use. Test title:
  `${template.name} at ${size.name} width keeps its layout inside the viewport`. That gives one
  test per template and width, 36 in all, each with one page load.
- **The fixture entry** (`writing-post-text-only`, an absolute `http://localhost:4322/...`
  path): keep it. `page.goto` takes an absolute URL, and both web servers start for every
  Playwright run. `no-js.spec.ts` and `shell.spec.ts` already visit it from the `e2e` project.
  No `startsWith("http")` branch is needed.
- `test.fixme(!template.built, NOT_FOUND_PENDING)`, matching the other TEMPLATES loops. All are
  `built: true` today, so this is inert.
- Before `goto`: `page.setViewportSize(size)` and
  `page.emulateMedia({ reducedMotion: "reduce" })`. The Focus Pocus story's chapter motion uses
  transforms that can sit off-screen mid-animation, and reduced motion puts every chapter in its
  final state, as the removed `project-story` snapshot did. Motion behaviour itself stays with
  `projects-motion.spec.ts`. Theme: the default (dark), no `localStorage` set. Layout does not
  depend on the theme, and the a11y matrix already loads both themes.
- After `goto`: `await page.evaluate(() => document.fonts.ready)`, so web-font metrics are
  final before boxes are read.

**Assertions:**

1. **No horizontal page scroll:**
   `document.documentElement.scrollWidth <= document.documentElement.clientWidth`, read in one
   `page.evaluate`, exactly as the other specs do.
2. **No element wider than the viewport.** One `page.evaluate` walks `document.body`'s
   descendants and returns the offenders as short descriptors
   (`tag#id.class1.class2`, plus the rect's `left`/`right`). Expect `[]`, so a failure names the
   elements. The rule:
   - `vw = document.documentElement.clientWidth`; tolerance `1` px for sub-pixel rounding.
   - For each element, `r = el.getBoundingClientRect()` with the page at `scrollX = 0` (assertion
     1 guarantees no horizontal scroll, and `goto` leaves it at 0).
   - **Skip** the element if any of these hold:
     - `r.width === 0 || r.height === 0`. Covers `display: none`, the closed mobile menu list
       (`js:max-md:hidden`), and empty wrappers.
     - Its computed `visibility` is `hidden` or `collapse`.
     - It or an ancestor is visually hidden: the computed `clip` is `rect(0px, 0px, 0px, 0px)`
       or `clip-path` is `inset(50%)`. Covers Tailwind `sr-only` and the unfocused skip link.
     - **Any ancestor** (from its parent up to, but not including, `body`) has a computed
       `overflow-x` other than `visible` (`hidden`, `clip`, `auto` or `scroll`). Its painted
       extent is clipped by, or scrolls inside, that ancestor. This covers code blocks, tables
       in `overflow-x: auto` wrappers (`portfolio.css` line 104, the post table region), the
       comparison region, and `overflow-hidden` cards. The scroll container itself is still
       checked, so a wrapper wider than the viewport fails.
   - **Offender** if `r.left < -1 || r.right > vw + 1`.
   - Write the skip rule as a comment block at the top of the spec, so a later reader knows why
     an element is exempt.
3. **Header and footer do not overlap the main content.** Read boxes for
   `page.locator("body > header")`, `page.locator("#main")` and
   `page.locator("body > footer")` with `boundingBox()`. Use `body > footer`, not `footer`:
   since #39 a story has an inner `<footer>`. Assert
   `header.y + header.height <= main.y + 1` and `footer.y >= main.y + main.height - 1`. Each
   `boundingBox()` must be non-null, so assert that first. All three are in normal flow in
   `BaseLayout.astro` (`body > header`, `div.page-container > main#main`, `body > footer`), and
   every template on the list uses that layout, so vertical separation is the right reading of
   "do not intersect".

**Seen to fail:** a smoke test over the current site is expected to pass, so "seen to fail" is
shown on purpose. Before committing, temporarily make each assertion fire once and confirm the
message names the element:
- add `style="width:2000px"` to an element via `page.evaluate` in a scratch run;
- move `#main` up with `margin-top:-200px`.

Then remove the scratch code and do not commit it. Record this in the implement summary.

**If it fails on the real site:** a real offender is a layout bug. Do **not** fix the site here
(a chore changes no user-visible behaviour). Stop and report the element, template and width.
If the offender is an intentional scroll or clip container the rule above misses, tighten the
skip rule with a commented reason. Never add a per-template exemption.

**Run:** `run.sh 900 pnpm exec playwright test tests/e2e/geometry.spec.ts --project=e2e`,
then `run.sh 120 pnpm exec playwright test --project=e2e --list | tail -1`. Expect 619 tests in
18 files. Check port 4321 with `lsof -i :4321` first. A sibling worktree's server can cause
spurious failures; if that happens, wait and rerun.

### W2 Remove the ten real-content snapshot subjects and their baselines

- [x] W2 done

**Files:** `tests/e2e/visual.spec.ts`; `tests/e2e/visual.spec.ts-snapshots/` (80 deletions).

**Test:** existing (removal). **Layer: visual** (unchanged for what stays). Edits:

- Delete the "pages" loop (home, about, contact; lines 76 to 90), the writing loop (lines 113
  to 140) and the projects loop (lines 142 to 157). Keep the header/footer/not-found loop, the
  menu-open loop and the sections-fixture loop byte-for-byte, so the 18 kept tests keep their
  titles and snapshot names.
- `settleImages` stays: the not-found page and the sections fixture are full-page shots with
  images.
- Rewrite the head comment (lines 1 to 6, which say "14 images per platform"). New text: the
  project snapshots the design system only (header, footer and the open mobile menu from `/`,
  the full not-found page, and the sections fixture page on the fixture site, port 4322). It
  covers phone (390) and desktop (1280) widths, dark and light (the menu at phone width only),
  18 images per platform. It never snapshots real content, so a content edit cannot fail it
  (issue #40, V1 and V2). Keep the sentence on comparison settings and `updateSnapshots`
  "none".
- `git rm` the 80 PNGs whose subject prefix is one of `home`, `about`, `contact`,
  `writing-landing`, `writing-all`, `writing-topic`, `writing-post`, `writing-series`,
  `projects` or `project-story`, for both `-darwin` and `-linux`. Use explicit prefixes with
  the `-phone-`/`-desktop-` suffix, so `projects-*` does not catch `project-story-*` by
  accident and nothing kept is matched. Example:
  `git rm tests/e2e/visual.spec.ts-snapshots/home-*.png`, one command per prefix. Playwright
  does not fail on orphan baselines, so this has to be done by hand.

**Coverage mapping** (also W4's `docs/testing.md` content). For each removed subject, where its
guarantee now lives:

| Removed subject (4 images per platform) | Where its coverage lives now |
|---|---|
| `home` | Header, footer and menu: the kept shell snapshots, taken on `/`. Layout breakage: the geometry test (W1). Contrast in both themes: `a11y` (axe on every template, both widths and themes). Introduction card and copy: `pages.spec.ts` and the build tests. Content pixels: deliberately unguarded (V1). |
| `about` | Shell snapshots; geometry test; `a11y`; About sections and Recognition links: `pages.spec.ts`. |
| `contact` | Shell snapshots; geometry test; `a11y`; the form and its states: `contact.spec.ts`. The section components: the `sections` fixture snapshot. |
| `writing-landing` | Shell snapshots; geometry test; `a11y`; listing behaviour: `blog.spec.ts` and the `sections` project's `blog-fixtures.spec.ts` / `blog-pagination.spec.ts`. Card and lead-story templates: phase 2 fixture shots (V3) and the build tests. |
| `writing-all` | As `writing-landing`. Pagination: `blog-pagination.spec.ts`. |
| `writing-topic` | As `writing-landing`. |
| `writing-post` | Shell snapshots; geometry test (includes the code block and table scroll containers); `a11y` (`blog.a11y.spec.ts`, `blog-fixture.a11y.spec.ts`); Copy button and table region: `blog.spec.ts`; forced colours: `blog-forced-colors.spec.ts`. Post template pixels: phase 2 fixture post snapshot (V3). |
| `writing-series` | Shell snapshots; geometry test; `a11y`; series intro and links: `blog.spec.ts`. |
| `projects` | Shell snapshots; geometry test; `a11y`; two-column/one-column rows: `projects.spec.ts`; fixture listings: `projects-fixtures.spec.ts`. |
| `project-story` | Shell snapshots; geometry test (reduced motion, final state); `a11y`; part layout at 390/1280, comparison region and invitation: `projects.spec.ts`; motion: `projects-motion.spec.ts`; forced colours: `projects-forced-colors.spec.ts`; no-JS: `projects-no-js.spec.ts`. Story template pixels: phase 2 fixture story snapshot (V3). |

Between this PR and phase 2, the post and story templates' pixels are guarded by review alone.
That gap is accepted in #40's Plan ordering. W4 states it in `docs/testing.md` so it is not
silent.

**Run:** `run.sh 120 pnpm exec playwright test --project=visual --list | tail -1` (expect 18
tests in 1 file), then `run.sh 600 pnpm exec playwright test --project=visual`. All 18 pass
against the untouched baselines. Count the remaining PNGs: `ls tests/e2e/visual.spec.ts-snapshots | wc -l`
(expect 36). Then `run.sh 120 pnpm exec vitest run --project unit tests/unit/site/config-files.test.ts tests/unit/ci`.
`workflows.test.ts` pins the snapshot upload path and `visual-baselines.yml`, both unchanged.

### W3 One baselines text in CLAUDE.md and the four pipelines, with a guard

- [ ] W3 done

**Files:** `tests/unit/setup/pipeline-visual-baselines.test.ts` (new); `CLAUDE.md`;
`.claude/skills/deliver/SKILL.md`, `.claude/skills/tweak/SKILL.md`,
`.claude/skills/squash/SKILL.md`, `.claude/skills/chore/SKILL.md`.

**Test:** new-first. **Layer: unit** (a text read of five files; nothing needs a browser or a
build). Recommendation: **yes, add the guard.** CLAUDE.md already lists "the visual-baselines
step" as an item kept aligned in all four, and issue acceptance 3 requires it. The PR-author
block and the verify wording, the other aligned items, already have such guards. Model it on
`pipeline-verify-wording.test.ts`: the same `skillText` and `flat` helpers, plus a `claudeText()`
for `CLAUDE.md`. Assert that each of the three shared sentences below appears **exactly once**
in each of the four `SKILL.md` files and in `CLAUDE.md`. Also assert the stale phrase
`"compares each snapshotted page"` appears in none of the five. Write it first and run it: it
fails on the current text. Then do the edits.

**Shared sentences** (verbatim; line wrapping is free, because the test flattens whitespace):

- S1: `The visual project snapshots only the shell (header, footer and open mobile menu), the not-found page and the fixture site, never real content, so a content edit cannot fail it.`
- S2: `Its per-platform baselines change only when the shell, a template or the design system changes, which is a major change under Principle III in any case.`
- S3: `A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.`

S3 replaces the old "the spec did not predict", because a chore has no spec. "Fixture site" in
S1 already covers phase 2's fixture post and story shots, so phase 2 does not need to reword it.

**CLAUDE.md "Visual baselines"** becomes, in this order:

1. S1 and S2, then one sentence: "The baselines are committed in
   `tests/e2e/visual.spec.ts-snapshots/`, and a change to them refreshes both sets."
2. The existing two-item list (macOS `pnpm run test:visual:update`; Linux
   `pnpm run test:visual:update:linux` with Docker Desktop and the label-and-artifact fallback).
   Shorten the Linux item to its essentials: what CI compares against, the Docker image matching
   `@playwright/test`, and the `visual-baselines` label → `update-baselines` run →
   `visual-baselines-linux` artifact via `gh run download` → commit.
3. S3.

In the alignment list, change the bullet `the visual-baselines step;` to
`the visual-baselines step and the "Visual baselines" section above (a unit test checks their shared sentences are identical in all five);`.

**Each pipeline's baselines step** (deliver lines 243 to 259, tweak lines 216 to 231, squash
lines 183 to 200, chore lines 288 to 306): keep the bold label and list position. The new text:

1. S1, then S2.
2. The pipeline's own lead-in, kept short:
   - **deliver/tweak:** "If the slice (tweak: change) altered one of those on purpose, the
     implement phase updated the macOS baselines (`pnpm run test:visual:update`)."
   - **squash:** "A bug fix rarely changes one of those; if the fix phase reported an intended
     change, it updated the macOS baselines."
   - **chore:** "A chore changes none of them by definition. The one exception is a chore about
     the baselines themselves, a Playwright or browser upgrade, where the plan said so up front
     and the implement phase updated the macOS baselines."
3. The Linux steps, shortened but complete, because CLAUDE.md "Local toolchain" requires them.
   Regenerate with `pnpm run test:visual:update:linux` (Docker Desktop). If `docker info` fails,
   ask Don to start it with an `AskUserQuestion` whose question text carries the instruction.
   Commit and push before opening the PR. Fallback only if Docker cannot be started: the
   `visual-baselines` label, then the `visual-baselines-linux` artifact via `gh run download`,
   commit and push. `verify` is red on visual only until then, so say so in the PR body.
4. S3.

Also align the three one-clause conditions that trigger the step:
- the deliver tasks row ("If the slice alters what a snapshotted page looks like");
- the tweak tasks row ("If the change alters what a snapshotted page looks like");
- the squash fix row ("If the fix changes what a snapshotted page looks like").

Each becomes "If the slice (change / fix) alters the shell, a template or the design system
(what the visual project snapshots)". Leave the rest of those rows alone. They contain the
guarded test-placement phrase and the `verify:quick` sentence, so edit only the clause.

**Do not touch:** the "Test placement" bullet, the "Inner loop and gate" paragraph, the
`verify:quick` sentence or the "PR author account" block. Their guards must stay green.

**Run:** `run.sh 120 pnpm exec vitest run --project unit tests/unit/setup`. It runs the new
test (red before the edits, green after), `pipeline-test-placement`, `pipeline-verify-wording`
and `pipeline-pr-author`. Then run `tests/unit/ci/changed-paths.test.ts` (the `SKILL.md` files
are in `READ_BY_CHECKS`) and `run.sh 120 pnpm run lint`.

### W4 `docs/testing.md`: Visual row, coverage mapping, gate-time entry

- [ ] W4 done

**Files:** `docs/testing.md`.

**Test:** `no behaviour: n/a (documentation; pipeline-test-placement.test.ts reads this file and must stay green)`.

**Edits:**

- **Layers table, Visual row:**
  - "What only it can show" becomes "Pixel baselines of the design system: the shell (header,
    footer, open mobile menu), the not-found page and the sections fixture on the fixture site.
    Never real content."
  - Verdict becomes "Keep, blocking. A diff is a design-system change (Principle III).
    Real-content shots removed in #40 phase 1; see 'Visual coverage'."
  - Delete "The only guard on design regressions."
- **Layers table, E2E row:**
  - "What only it can show" gains ", layout geometry per template (no sideways scroll, no
    element wider than the viewport, header and footer clear of the main content)".
  - Verdict: replace "review matrices (#37, from D8 in #26)" with "review matrices (#40)".
    #37 is closed and #40 replaces it.
  - Make the same `#37` → `#40` replacement in the "Measured gate times" target cell, as
    "the 4 min target moved to #37, now replaced by #40". This keeps the record truthful
    without rewriting history. Judgment call: it is in scope because #40 says it replaces #37,
    and a dangling closed-issue pointer in the file this PR edits would be stale.
- **New subsection `### Visual coverage`**, placed directly after `## Where a test goes`'s
  bullets and before `### Check functions and call sites`. It is a new `###` under an existing
  `##`, and no heading is renamed or moved. Content:
  - one sentence on what the visual project covers;
  - one sentence on what replaced the real-content shots;
  - W2's coverage-mapping table, one row per removed subject (issue acceptance 2);
  - the gap sentence: until #40 phase 2 adds fixture post and story snapshots, the post and
    story templates' pixels are guarded by review alone.
- **"Measured gate times":** append a dated entry, `### Visual refocus, #40 phase 1 (2026-10-03)`.
  Keep the existing record intact; the section's own method says "add a dated row rather than
  overwrite". Contents:
  - a small table with rows `e2e` job, `test:e2e:parallel` step, visual tests (58 → 18) and
    E2E tests (583 → 619), and columns Before (run 37136029981, `main` push of #39) and After;
  - one line: "After figures are from this PR's CI run, which adds the preview site-check; the
    `test:e2e:parallel` step is the comparable number."
  - The implementer fills the After cells for the two counts and writes the two time cells as
    `pending (#40 phase 1 PR run)`. W5 replaces them.
- Leave every other line alone. House style: plain sentences, no em dashes in new text, pipe
  tables.

**Run:** `run.sh 120 pnpm exec vitest run --project unit tests/unit/setup tests/unit/ci`,
`grep -n '^## \|^### ' docs/testing.md`. The heading list is the same as on `main`, plus
`### Visual coverage` and `### Visual refocus, #40 phase 1 (2026-10-03)`.

### W5 `[ORCHESTRATOR]` After-measurement and PR body

- [ ] W5 done

**Files:** `docs/testing.md` (two cells). **Test:** n/a (records a measurement).

- After the PR's first CI run goes green, read `gh run view <id> --json jobs` and take two
  figures: the `e2e` job time, and the "Run the end-to-end, accessibility, visual and sections
  projects" step time.
- Write both into W4's two `pending` cells, commit
  (`docs(testing): record #40 phase 1 e2e times`) and push.
- That push re-runs CI. The recorded figures stay those of the first run; say so in the commit
  body.
- Do not leave `pending` in the merged file. Only after this push does auto-merge go on.
- PR body:
  - `Part of #40` (phase 1);
  - the before/after table;
  - the counts discrepancy line (ten subjects, 58 images per platform, not twelve and 54);
  - the Scope follow-ups;
  - the Principle III verdict (not major, auto-merge);
  - "no baselines refreshed; 80 orphaned PNGs removed".
- Open the PR from `drc-agents` per CLAUDE.md Merging.

## Docs citations

Playwright (the only tool whose usage this change relies on):

- Test CLI, `--list` and `--project`: https://playwright.dev/docs/test-cli
- Visual comparisons, per-platform snapshot names and `toHaveScreenshot`:
  https://playwright.dev/docs/test-snapshots and
  https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1
- `locator.boundingBox()` (coordinates relative to the main frame viewport):
  https://playwright.dev/docs/api/class-locator#locator-bounding-box
- `page.evaluate`: https://playwright.dev/docs/api/class-page#page-evaluate
- `page.emulateMedia({ reducedMotion })`:
  https://playwright.dev/docs/api/class-page#page-emulate-media
- Parameterised tests by loop: https://playwright.dev/docs/test-parameterize
- `toBeInViewport` (considered, rejected under Principle IV):
  https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-in-viewport
- Web platform, used inside `page.evaluate`: `Element.getBoundingClientRect()`
  (https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) and
  `document.fonts.ready`
  (https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready).

No Astro decision is made, so the Astro Docs MCP is not consulted.

## Risks

- **Geometry false positives on real pages.** Wide tables and code blocks inside `overflow-x:
  auto` wrappers, the comparison region, `overflow-hidden` cards and `sr-only` text would all
  trip a naive check. Mitigation: the ancestor-overflow and visually-hidden skips in W1, a 1 px
  tolerance, and an offender list that names the element. A real offender is a site bug that
  this chore reports and does not fix.
- **Motion and late layout.** Mid-animation transforms on the story and late web-font swaps
  could move boxes. Mitigation: reduced motion, and `document.fonts.ready` before reading.
- **Over-broad `git rm`.** `projects-*` and `project-story-*` share a stem. Mitigation: explicit
  prefixes, and Acceptance 3's count of exactly 36 remaining with the kept names listed.
- **Aligned-text drift.** The four pipelines' baselines steps differ today. Mitigation: three
  verbatim shared sentences and a unit test over all five files. The pipeline-specific lead-ins
  stay free text.
- **Port 4321 collisions** with sibling worktrees (spurious ECONNREFUSED or 404 mid-run).
  Mitigation: `lsof -i :4321` before Playwright runs; wait and rerun when idle. Ask Don before
  any full `pnpm run verify` (orchestrator).
- **Local verify must stay green.** The only Playwright changes are a new passing spec and fewer
  visual tests, so the gate gets shorter. Nothing in `verify`'s scripts changes.
- **Coverage gap until phase 2.** The post and story templates have no pixel guard between this
  PR and phase 2. It is accepted in #40's ordering and stated in `docs/testing.md`.
