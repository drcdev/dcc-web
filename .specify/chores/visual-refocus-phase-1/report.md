# Review report: visual-refocus-phase-1 (issue #40, phase 1)

Reviewed `main...HEAD` at ca19f03 (commits 3617b74, f5e012e, 3ebbc6b, ee528ca, ca19f03). This phase was read-only on everything except this report. The review subagent could not write this file itself; the orchestrator saved its returned text here verbatim.

## Summary

W1 to W4 are done as planned. Nothing changed in `src/`, `.github/`, `package.json`, `playwright.config.ts` or `wrangler.jsonc`.

The one off-plan change adds `CLAUDE.md` to `READ_BY_CHECKS`. The planned guard made it necessary, but it changes the CI tier classifier. The plan said CI was untouched, and that is no longer true.

Two coverage-mapping lines in `docs/testing.md` claim coverage that does not exist. One CI unit test case stopped testing anything when `CLAUDE.md` changed tier.

**Findings:** CRITICAL 0, HIGH 3, LOW 6.

## Checks re-run in this review

| Check | Result |
|---|---|
| `vitest run --project unit tests/unit/setup tests/unit/ci tests/unit/site/config-files.test.ts` | 61 files, 945 passed, exit 0 |
| `playwright test --project=visual --list` | 18 tests in 1 file (was 58) |
| `playwright test --project=e2e --list` | 619 tests in 18 files (was 583 in 17) |
| `tests/e2e/visual.spec.ts-snapshots/` | 36 PNGs (18 darwin, 18 linux). 80 deletions in the diff, all `D`. |
| Orphan PNGs | None. Every remaining file name matches a `toHaveScreenshot` name in the spec: `header-`, `footer-` and `not-found-` for each width and theme, `menu-open-phone-` for each theme, and `sections-` for each width and theme. |
| `grep 'open(page, "' visual.spec.ts` | Only `/`, `/nope/` and `http://localhost:4322/sections/` (acceptance 1) |
| `updateSnapshots` | Still `"none"` at `playwright.config.ts:44`, unchanged |
| `pnpm run test:e2e:parallel` (timed) | 1316 passed, 2 skipped, exit 0, 116 s |

## Work items

- **W1, `tests/e2e/geometry.spec.ts`:** matches the plan.
  - It sits in the E2E layer and loops over every `TEMPLATES` entry, 18 including the fixture-site `writing-post-text-only`.
  - Each template runs at 390x844 and 1280x800 with reduced motion and `document.fonts.ready`, giving 36 tests.
  - All three assertions are present.
  - The head comment documents the skip rule (lines 12 to 22) and the reason for a second layer (lines 7 to 10).
- **W2, `visual.spec.ts`:**
  - The three real-content loops are removed.
  - The three kept loops are byte-for-byte unchanged.
  - The head comment is rewritten (18 images per platform, V1 and V2).
  - 80 PNGs are removed.
- **W3, the guard and the shared wording:**
  - The guard `tests/unit/setup/pipeline-visual-baselines.test.ts` asserts that S1, S2 and S3 each appear exactly once in all five files, and that the stale phrase appears in none.
  - CLAUDE.md and all four baselines steps carry S1, S2 and S3 verbatim.
  - The three trigger clauses (the deliver and tweak tasks rows and the squash fix row) changed only in that clause.
  - The Test placement bullet, the verify wording, the PR author block and "Inner loop and gate" are untouched, and their guards are green.
  - The CLAUDE.md alignment-list bullet is updated and matches reality.
- **W4, `docs/testing.md`:**
  - The Visual row no longer says "the only guard".
  - The E2E row gains layout geometry.
  - A new `### Visual coverage` section has ten mapping rows and a gap sentence.
  - The `#37` references are updated.
  - The dated "Measured gate times" entry has correct before figures (473 s and 335 s, run 37136029981), and its after time cells read `pending (#40 phase 1 PR run)`.
- **Off-plan change made in W3:**
  - `scripts/ci/changed-paths.ts` adds `"CLAUDE.md"` to `READ_BY_CHECKS`.
  - `tests/unit/ci/changed-paths.test.ts` moves `CLAUDE.md` from `SAFE` to `UNSAFE`, and swaps it for `.specify/feature.json` in three `decide()` cases.
  - `docs/testing.md:60` (the Skip-safe tier row) is updated to match.
  - The Principle III section below covers this change.

## Findings

### HIGH

1. **The `contact` mapping at `docs/testing.md:127` claims coverage that does not exist.**
   - The row says "The section components: the `sections` fixture snapshot."
   - The contact page's only section is `<ContactForm />` (`src/content/pages/contact.mdx:10`).
   - The sections fixture (`tests/fixtures/pages/sections.mdx`) renders `Lead`, `TextBlock`, `Offerings`, `CallToAction`, `Figure`, `WideImage` and `FullImage`, but not `ContactForm`.
   - So the contact form's pixels now have no snapshot.
   - Fix: say "Form pixels: no snapshot (gap)", or add the form to the fixture in phase 2 and say so.

2. **The mapping at `docs/testing.md:128` (and rows 129 and 130, which point to it) and the gap sentence at line 136 overstate what phase 2 adds.**
   - Row 128 says "Card and lead-story templates: phase 2 fixture template shots".
   - #40 V3 adds only a fixture post and a fixture story. Neither renders `PostCard`, `LeadStory`, the series banner or the projects index rows.
   - The gap sentence names only the post and story templates.
   - Pixels actually left unguarded:
     - until V3 lands: the post and story templates;
     - with no planned replacement: the listing cards and lead story, the series banner, the projects index rows, the home intro card (`HomeIntro`) and the contact form.
   - This is the case the review was asked to flag: a mapping that is aspirational, not asserted.
   - Fix: label these as gaps in the mapping, widen the gap sentence, and either widen V3 or record the gaps as accepted.

3. **The push-forces-full case at `tests/unit/ci/changed-paths.test.ts:149` no longer tests anything.**
   - `expect(decide({ event, files: ["CLAUDE.md"] }).full).toBe(true)` was the only assertion that push, `workflow_dispatch` and `pull_request_target` run the full gate even when every changed file is skip-safe.
   - `CLAUDE.md` is no longer skip-safe, so the case passes for any event. The second half of the test uses a content file, which is never skip-safe either.
   - The implementer swapped `CLAUDE.md` for `.specify/feature.json` in three other cases but missed this one. This weakens a check.
   - Fix: use `.specify/feature.json` here. Line 162 could take the same swap for clarity.

### LOW

4. **Dead allowlist entry at `scripts/ci/changed-paths.ts:13`.**
   - `SKIP_SAFE_FILES` still lists `"CLAUDE.md"`, but `READ_BY_CHECKS` now always overrides it (that check runs first, at line 37).
   - The comment at line 24 ("Files under a skip-safe prefix...") no longer fits `CLAUDE.md`, which sits under no prefix.
   - Harmless as it stands.

5. **S1 and acceptance 1 overclaim slightly.**
   - S1 says "a content edit cannot fail it".
   - The header navigation is built from the content pages: `404.astro:12` and the layout use `getNavigation` from `src/lib/pages.ts`.
   - So a content edit that adds, renames or reorders a navigation entry moves the header, menu and not-found pixels.
   - That is a navigation change, which is major under Principle III anyway, so failing the snapshot is the right outcome. The sentence just isn't literally true.
   - Optional fix: "a content edit to a page body cannot fail it".

6. **S2 conflicts with `/tweak` and `/squash` if read literally** (`tweak/SKILL.md:216` onwards, `squash/SKILL.md:183` onwards).
   - S2 says any change to the shell, a template or the design system "is a major change under Principle III in any case".
   - The constitution's test is narrower: a change to "the design system, site-wide layout, navigation or visual identity".
   - `/tweak` may never carry a major change, yet it explains how to refresh baselines.
   - Don ticked this wording in V6, so it stands. He should know that, read literally, any tweak or bug fix that moves a baseline is now major.

7. **The specify row at `tweak/SKILL.md:163` is slightly out of date.** It still asks "whether any rendered page changes appearance (that decides the visual-baseline step)". After this change, the question is whether the shell, a template or the design system changes.

8. **Lines too long.** `CLAUDE.md:25` and the first line of each pipeline's baselines step (`chore/SKILL.md:288`, `deliver/SKILL.md:243`, `squash/SKILL.md:183`, `tweak/SKILL.md:216`) run past the 100-column wrap. Cosmetic only.

9. **Geometry spec robustness.** The rule is sound for today's site, with two latent weak spots.
   - **Why it works today:**
     - No top-level wrapper (`body`, `.page-container`, `main#main`) sets `overflow-x`.
     - So the ancestor skip only exempts children of real scroll or clip containers (`global.css:134`, `:340`, `:361`, `portfolio.css:104`, and the `overflow-hidden` cards).
     - Those containers are still checked themselves.
   - **Weak spot 1:** if a future change puts `overflow-x: hidden` or `clip` on `.page-container` or `#main`, the walk would silently exempt the whole page body. Asserting that those two compute `visible`, or stopping the ancestor walk at `#main`, would make that failure loud.
   - **Weak spot 2:** `client:visible` islands that hydrate after the reads could shift layout. No flake has been seen yet.
   - **Overlap check:** correct for the normal-flow `body > header`, `#main` and `body > footer` (`BaseLayout.astro:34-43`).
   - **Failure messages:** they name the offending element as `tag#id.classes (left, right)`, or name the box that overlaps.

## Coverage mapping check

| Removed subject | What the mapping claims | Verified? |
|---|---|---|
| all ten | Shell snapshots | True. Header and footer at both widths and themes, and menu-open at phone width in both themes, all on `/` (`visual.spec.ts:62-84`). |
| all ten | Geometry test | True. Every `TEMPLATES` entry at 390 and 1280. |
| all ten | `a11y` contrast in both themes | True. `a11y.spec.ts:57-70` runs axe with all WCAG A and AA tags per template, at both widths and in both themes, and asserts the theme class. No `disableRules` anywhere in `tests/e2e`. |
| `home` | Intro card and copy in `pages.spec.ts` | True (`pages.spec.ts:192-269`). The card's pixels are unguarded (finding 2). |
| `about` | `pages.spec.ts` About sections and Recognition | True (`pages.spec.ts:120`). |
| `contact` | `contact.spec.ts` and the sections fixture | `contact.spec.ts` is true. The sections fixture is **false** (finding 1). |
| `writing-landing`, `writing-all`, `writing-topic` | blog, fixtures and pagination specs, plus phase 2 card shots | The specs exist. The phase 2 card shots are **not in V3** (finding 2). |
| `writing-post` | Code and table scroll, Copy button, a11y, forced colours, plus a phase 2 post shot | True (`blog.spec.ts:31-140` and the named specs). Phase 2 is labelled as a gap. |
| `writing-series` | `blog.spec.ts` | True (`blog.spec.ts:204-231` and `569-587`). |
| `projects` | `projects.spec.ts` rows and `projects-fixtures.spec.ts` | True (`projects.spec.ts:248`). The row pixels are unguarded (finding 2). |
| `project-story` | Parts, comparison, invitation, motion, forced colours, no-JS, plus a phase 2 story shot | True (`projects.spec.ts:83-136`, and the named specs exist). Phase 2 is labelled as a gap. |

## Principle III

**What the real diff touches:**
- No `.github/`, `package.json`, lockfile, `playwright.config.ts` or `wrangler.jsonc` change.
- No dependency, service, contact-data, cost or constitution change.
- No rendered pixel moves.
- `scripts/ci/changed-paths.ts` **did** change. `.github/workflows/ci.yml:37` runs it to pick the gate tier.
- With this change, a PR that touches only `CLAUDE.md` moves from the skip-safe tier (secretlint only) to the full gate.

**Off-plan change: necessary, not scope creep.**
- Acceptance 7 requires a unit test that reads `CLAUDE.md`.
- The drift guard (`changed-paths.test.ts:228-249`) fails whenever a test reads a path that the allowlist calls skip-safe.
- Without the change, a PR touching only `CLAUDE.md` would skip the very test that guards it.
- The change only makes CI stricter (it fails closed), and the doc and test edits are the minimum needed to match. The PR body should name it.

**The verdict:**
- By the letter of Principle III, this is a change to CI configuration.
- The plan's reason for "not major" no longer holds, and "when in doubt, treat the change as major" applies.
- Recommendation for the pre-PR question to Don: treat it as **major**, leave auto-merge off, and have him approve after looking at the preview.
- The alternative: Don rules that a change which only tightens the tier classifier is not "CI configuration" in the Principle III sense. In that case, auto-merge as planned.
- Either way, the PR body must name the `changed-paths.ts` change and what it does.

## Checks weakened

Only finding 3 weakens a check.
- The kept visual snapshots still block: no skip, no `fixme`, no threshold change, config untouched.
- `updateSnapshots` is still `"none"`.
- No other test is skipped or loosened.
- Every removed snapshot has a mapping row, though two of the rows are wrong (findings 1 and 2).

## Measurement

**CI before** (run 37136029981, the push of #39 to `main` at 7a24ab7; can't be reproduced locally):

| Measure | Time |
|---|---|
| `e2e` job | 473 s |
| `test:e2e:parallel` step | 335 s |
| Whole run | 500 s |

**CI after:** comes from this PR's first CI run. The orchestrator fills it in (W5).

**Local after:** on this branch, on the Mac in the agent shell.
- Setup: `dist/` was already present; ports 4321 and 4322 were free at the start; the command was `/usr/bin/time -p run.sh 590 pnpm run test:e2e:parallel`.
- Result: real 115.96 s (Playwright reported 1.9 m), 1316 passed, 2 skipped, exit 0.

| Measure | Before | After | Source |
|---|---|---|---|
| `e2e` job | 473 s | pending (PR run) | CI |
| `test:e2e:parallel` step | 335 s | pending (PR run) | CI |
| Visual tests | 58 | 18 | local `--list` |
| E2E-project tests | 583 in 17 files | 619 in 18 files | local `--list` |
| Local `test:e2e:parallel` | not measured on `main` | 116 s | local |

`docs/testing.md` has no earlier local `test:e2e:parallel` time. The nearest local figure is "Playwright (all projects, including `budget`) 1388 passed, 144 s", from inside `pnpm run verify` at 75e73fc on 2026-10-02. That is a different command on a different commit, so it is context only, not a before figure.

## Follow-ups for the PR body

1. Fix HIGH 1 to 3 before merge: two mapping rows and the gap sentence in `docs/testing.md`, and one case in `changed-paths.test.ts`.
2. Principle III: name the `scripts/ci/changed-paths.ts` change (a PR touching only `CLAUDE.md` now runs the full gate) and record Don's ruling on major or not.
3. #40 phase 2 (V3, V5): fixture post and story snapshots plus the computed-token checks, with baselines generated once on both platforms. Consider widening V3 to the cards and lead story, series banner, projects rows, home intro card and contact form, or record them as accepted gaps.
4. #40 phase 3: record the before and after `e2e` job times on the issue.
5. Counts discrepancy: the issue says twelve subjects and 54 images per platform, but the files had ten real-content subjects and 58 images per platform.
6. Noticed: content-only changes still run the whole `e2e` job, including `visual`. Narrowing that is a CI change under Principle III and is not part of #40.
7. Noticed: the geometry test overlaps the no-JS check (no sideways scroll with JS off) and the 320 px reflow check. Fold them together if phase 3 shows `e2e` is still long.
8. The LOW items (4 to 9).
