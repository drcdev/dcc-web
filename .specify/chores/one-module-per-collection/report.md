# Review report: one-module-per-collection (issue #203)

Reviewed 2026-10-25 on `8397b92b` against `main` (`d49aa321`), fresh eyes, read-only on code.
Saved by the orchestrator (the review subagent could not write this file); L2 and L4 were fixed by
the orchestrator in the same commit, as comment-only edits within W9's scope.

## Verdict

W1 to W10 are done as planned. The review found no CRITICAL or HIGH findings and 7 LOW ones.
Every code line of the old schema and check modules is in the new rules modules, apart from
whitespace and `export` added to `kindOf`, `Replacement` and `Replaceable`, as W4 and W6 planned.
The only new code lines are the planned `checkLandingFiles`, `checkNowFiles` and
`checkBlockHeading` wrappers. No user-visible behaviour changes.

## Checks made

- **Rule bodies and messages.** Line-set diff of all 21 old modules against the new tree:
  nothing missing except the three planned `export` additions. Line-set diff of the new rules
  modules and view helpers against `main`: nothing new except the three planned wrapper functions.
  String-literal diff over `src/**/*.{ts,astro}`: every error message is byte-identical. The one
  textual change is V9's `` `src/content/pages/${id}.mdx` `` becoming `` `${PAGES_DIR}/${id}.mdx` ``
  with `PAGES_DIR = "src/content/pages"`, which gives the same string.
- **Moved rules run at the same point with the same effect.**
  - V9: `getNavigation()` calls `checkLandingFiles(landingPages, landing.map((e) => e.id))` in place
    of the inline loop. `present.includes(id)` is equivalent to `landing.some((e) => e.id === id)`.
  - Now: `checkNowFiles(entries.length)` throws the same `contentError` when the count is not 1.
    The extra `if (!entry) throw new Error("unreachable…")` cannot fire after a passing check.
  - Assessment finders and `checkBlockTargets`: bodies are verbatim.
  - Post-route heading check: `checkBlockHeading({ file, title, slug: assessmentHeading, headings })`
    sits on the same line, after `checkBlockTargets`, with the same condition and message.
- **Issue "Done when".**
  - One rules module per collection: `src/content/collections/` holds exactly the eight
    `*-rules.ts` files, and `src/content/schemas/` is gone.
  - No reader holds a rule: the plan's rule-holding-reader command prints nothing.
  - `src/content.config.ts` imports only rules modules, `lib/content/{addresses,file-format,images}.ts`,
    `astro:*`, `astro/loaders` and `node:*`. A separate transitive walk of its graph (scratch
    script, not the branch's guard) reaches only `src/content/collections/*`, `src/lib/content/`
    (`addresses`, `dates`, `errors`, `file-format`, `images`, `parts`, `schema-fields`, `themes`)
    and `src/config/topics.ts`. It reaches no reader, component or page. `satteri` is now in the
    graph, as W4 planned.
  - Docs name the new files, and Acceptance 6 and 8 print nothing.
- **Duplicate names.** No basename is shared within `src/lib` plus `src/content`, so the three
  reader-versus-checks pairs the issue names (`career`, `now`, `reading-paths`) are gone. Pairs
  left anywhere under `src/`:
  - `src/config/navigation.ts` and `src/lib/content/navigation.ts`;
  - `src/config/projects.ts` and `src/lib/projects.ts`;
  - `src/components/sections/index.ts` and `src/components/assessment/index.ts`;
  - framework route names (`[slug].astro`, `[...page].astro`, `index.astro`).

  Read literally ("no two modules share a name across folders"), the issue is not fully met. The
  plan scopes the config pairs out on purpose as a follow-up (finding L1).
- **Tests kept what they check.** Every non-import line of every moved, split or modified test on
  `main` is present in the branch's tests, except the planned path-literal swaps in
  `changed-paths.test.ts` (expected tiers unchanged: still `full`, still not content-only, and the
  reason still names the file) and `docs-content-structure.test.ts` (same check, renamed path).
  One test title changed in the W5 split (finding L3). Assertions in the split files are unchanged.
- **New tests at the planned layer.** `boundaries.test.ts` is a unit test that reads sources. The
  two `checkBlockHeading` tests are unit tests in `assessment-checks.test.ts`. The plan's coverage
  mappings hold:
  - V9 is reached by `build/page-validation.test.ts` "V9" through `getNavigation()`.
  - "Exactly one Now file" is reached by `build/home-sections.test.ts` through `getNow()`.
  - `docs/testing.md` rows V5, V8, RP04/RP05, R04 to R07 and T08 to T11 name the new paths.
- **Skill.** `.claude/skills/content/SKILL.md`:
  - the #203 sentence and "State today." are gone;
  - each Collection guide row names its `collections/<name>-rules.ts`;
  - "Where the rules live" names the rules module and the reader;
  - the Gate line names `src/content/collections/`;
  - no `_shared/` wording is restated.
- **Toolchain.** `astro check` gives 0 errors and `eslint .` passes.
  `node scripts/ci/changed-paths.ts --base main` gives `tier=full`, as expected.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

- **L1:** some basenames are still shared, so the issue's wording is not met literally.
  - **Where:** `src/config/navigation.ts` with `src/lib/content/navigation.ts`;
    `src/config/projects.ts` with `src/lib/projects.ts`; the two `components/*/index.ts`
    registries.
  - **Why it is LOW:** plan.md "Out" scopes the config pairs out, and the W10 guard only covers
    `src/content/collections/` and `src/lib/`. The pairs the issue names are fixed.
  - **Action:** name this in the PR body so Don can accept the scope, or open the config-rename
    follow-up.
- **L2 (fixed):** stale comment in `tests/build/home-sections.test.ts:2` named
  `tests/unit/content/now-schema.test.ts, now-body.test.ts`, which moved to
  `tests/unit/content/collections/`.
- **L3:** the W5 split changed one test title, against the plan's "keeps its describe/it titles".
  - **What changed:** "C3 and C4 related posts › accepts live posts and resolves them to title and
    address in step order (newest first)" became two tests:
    `tests/unit/content/collections/career.test.ts:57` "accepts live posts" (`checkCareer` not
    throwing) and `tests/unit/content/career-view.test.ts:62` "buildTimeline › resolves related
    posts to title and address in step order (newest first)".
  - **Why it is LOW:** both assertions are kept with equivalent fixtures. The split itself is
    planned (Acceptance 7, the +1).
- **L4 (fixed):** stale header in `src/lib/assessment/lookup.ts:1-3` still described the finders,
  which now live in `assessment-rules.ts`.
- **L5:** `src/lib/content/career-view.ts:4` and `src/lib/content/reading-path-view.ts:4`
  value-import from rules modules that import `reference` from `astro:content`, so the view helpers
  now reach `astro:content` transitively.
  - **Mismatch with the plan:** plan.md "Names" gives keeping `astro:content` out of unit tests as
    one reason for the view helpers.
  - **Why it is LOW:** no client script imports either helper. The CareerTimeline `<script>`
    imports only `career-filter.ts`, which has no imports. The unit tests pass, so bundles are
    unchanged.
  - **Optional tidy-up:** move `orderSteps` and `kindOf` to a non-`astro:content` helper.
- **L6:** plan.md contradicts itself.
  - "Out" (lines 129-131) says the heading check gets no test and that adding one is a follow-up,
    but Acceptance 7 (line 61) and the code add two `checkBlockHeading` tests.
  - The common rules (line 163, "still 2911 tests") and W10 (lines 449 and 454, "2914") disagree
    with Acceptance 7's final 2925.
  - These are historical text left after the count reconciliation in `8397b92b`. Nothing in the
    code is wrong.
- **L7:** `tests/unit/content/collections/boundaries.test.ts:48,55,62` exports three helper
  functions (`outsideAllowedFolders`, `duplicateBasenames`, `readersImportingErrors`) from a test
  file. Nothing imports them. Harmless, but unusual for this repository.

## Before and after measurement

`npx vitest run --project unit` under `perl -e 'alarm 600; exec @ARGV'`, node v24.4.1:

|                                  | Files   | Tests    | Result   |
| -------------------------------- | ------- | -------- | -------- |
| Before (`main` `d49aa321`, plan) | 190     | 2911     | all pass |
| After (`8397b92b`, this review)  | **196** | **2925** | all pass |

**Count reconciliation, checked independently.** Method: JSON-reporter runs of the full unit
project on this branch and on a temporary `git worktree` of `main` (now removed), compared per
file and by test full name.

Generated "no real content named in tests" cases went from 102 to 110 (+8):

- +5 split files: `career-view`, `draft-pages`, `reading-path-view`,
  `collections/project-replaced-by`, `collections/topic-near-miss`;
- +2 assessment files moved into the guard's scope: `collections/assessment-checks`,
  `collections/assessment-schema`;
- +1 for `collections/boundaries.test.ts`.

Static tests went up by 6:

- +1 from the W5 career split (15 tests became 8 + 8);
- +2 new `checkBlockHeading` tests (`assessment-checks` went from 9 to 11);
- +3 `boundaries` tests.

The other splits keep their counts:

| Split                 | Before | After |
| --------------------- | ------ | ----- |
| `page-flags`          | 5      | 4 + 1 |
| `project-replacement` | 11     | 6 + 5 |
| `topic-ids`           | 13     | 7 + 6 |
| `reading-paths`       | 10     | 5 + 5 |

Total: +8 + 6 = **+14 tests**. Files: +5 split files and +1 guard file = **+6**. This matches the
implementers' breakdown exactly. Every other full name lost on `main` reappears renamed: the 3
changed-paths and 1 docs-structure path-literal swaps, plus the L3 title.

## Follow-ups for the PR body

- Rename the config-versus-lib basename pairs (`src/config/navigation.ts`, `src/config/projects.ts`).
  `scripts/build-fixture-site.ts` rewrites `src/config/projects.ts` by name (L1).
- `src/lib/assessment/question-text.ts` repeats the A4/A5 errors with different wording. Making it
  call `findAssessment`/`findShift` would change a message (plan "Out").
- Unit tests for V9 (`checkLandingFiles`) and "exactly one Now file" (`checkNowFiles`). Both are
  covered by build tests only.
- `ProjectPart.astro` and `PartPicture.astro` keep their render-time `contentError` prop checks
  (plan "Out").
- Optional: move `orderSteps` and `kindOf` so the view helpers do not reach `astro:content` (L5).
