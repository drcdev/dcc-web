# Review report: content-validators-fold (issue #99)

Fresh-eyes review of `chore/content-validators-fold` against `plan.md`, 2026-10-04.
Diff read as `git diff origin/main...HEAD` (commits 948f0bb to 7143706).

## Verdict

All six work items (W1 to W6) are done as planned, and nothing outside the plan's scope changed.
Every removed unit assertion has a home. Every contract message is still produced byte for byte,
and no check is weaker.

Targeted tests are green:

- unit, `tests/unit/content` and `tests/unit/site`: 64 files, 1374 tests;
- unit, the tests that read `docs/testing.md` or `CLAUDE.md` (`tests/unit/ci/changed-paths.test.ts`,
  `tests/unit/setup`): 57 files, 819 tests;
- build, `tests/build/{page,post,project}-validation.test.ts`: 3 files, 25 tests, 88 s.

The full gate and Playwright were not run in this phase.

There is one HIGH: the Principle III verdict, a process call for Don. There is no code defect at
HIGH or CRITICAL. The missed line targets are LOW.

## Findings

### CRITICAL

None.

### HIGH

1. **The Principle III verdict conflicts with the gate contract** (`plan.md` lines 226 to 233).
   - The plan says "not major" and that auto-merge can be armed.
   - `.github/CODEOWNERS` line 1 says its paths are "Paths that are major changes by definition
     (constitution Principle III)".
   - `specs/001-setup-walkthrough/contracts/ci-and-gates.md` line 40 lists `/astro.config.mjs`
     among the "Principle III majors that are visible as paths".
   - The constitution says: "When in doubt, treat the change as major."
   - The edit is small and only makes the build stricter (`astro.config.mjs` lines 47 to 49), but
     it is in doubt.
   - Recommendation: put it to Don at the pre-PR pause, with "major by path, auto-merge off" as the
     recommended option. Either way the native code-owner review blocks the merge until Don
     approves. The PR body should say which way he chose.

### LOW

1. **Line targets missed because the estimate was wrong, not the work.**
   - Source: 223 lines against a planned ≤ 190. The 190 left out `assertNoTwin`
     (`src/lib/content/addresses.ts` lines 60 to 77, 18 new lines that replace three list loops).
   - Tests: 358 lines against a planned ≤ 320. The 320 left out the plan-required `assertNoTwin`
     block (`tests/unit/content/addresses.test.ts` lines 93 to 149, 57 lines) and the S09 project
     cases (`tests/unit/content/images.test.ts` lines 57 to 76).
   - The code is close to as lean as is reasonable. The remaining trims (LOW 2 and 3) come to about
     15 lines and would reach neither target.
2. **The folder table is duplicated.**
   - `src/lib/content/images.ts` lines 11 to 15 repeat the `DIRS` table from `addresses.ts` lines 10
     to 14. The plan wants one table keyed by collection.
   - Fix: export it once (`errors.ts`, next to `ContentKind`, suits both modules). Saves 5 lines.
   - Optional: `images.ts` lines 27 to 39 (`imageProblem` plus `KINDS.problem`) could become one
     template expression that keeps the J3 wording. Saves about 7 lines.
3. **One test cannot fail.**
   - `addresses.test.ts` lines 145 to 148, "does not treat a template file as a twin of anything",
     repeats the assertions on lines 141 and 142. No entry can produce `_template.mdx` as a
     candidate twin.
   - The page fixture `_t.mdx` (line 105) is never used.
   - Delete the case (4 lines) or make it test something real.
   - Optional: `errors.test.ts` lines 5 to 23 could be one `it.each` over kind × file count (saves
     about 5 lines).
4. **The P17 build run does not assert the full message.**
   - `tests/build/post-validation.test.ts` lines 42 to 53 assert "Post files", `x.md`, `x.mdx` and
     `/writing/x/`. That is enough to tell it apart from Astro's duplicate-slug message.
   - The row-13 and row-26 runs also assert "both make the … Keep one of them."
   - For symmetry, add "both make the address /writing/x/. Keep one of them."
5. **docs/testing.md does not list the new Astro backstop build run.**
   - The run is `tests/build/page-validation.test.ts` lines 67 to 87, "Astro's
     prerenderConflictBehavior: 'error' fails a page that clashes with a code route (custom check
     bypassed)".
   - It is missing from the page build bullets (`docs/testing.md` lines 274 to 278) and from row 14.
   - Every other title in the mapping matches a real test title, checked case by case.
6. **The index/index.mdx edge case now fails, but its message depends on load order.**
   - `index/index.mdx` next to `index.mdx` gives two files with id `index`, and the twin check now
     catches it.
   - The files in the message are sorted, but the address comes from the entry (`addresses.ts`
     line 74): `/` from `index.mdx`, `/index/` from `index/index.mdx`.
   - No contract covers this case, and it is better than before (only a warning on main). Update the
     follow-up text in the PR body.
7. **The spec edits are allowed in a chore.**
   - The four `specs/*/contracts/build-errors.md` edits (003 row 13, 008 P17, 009 row 26, 014 S11)
     change only the "Check" column, which says where a check runs.
   - The rule and the required message content are unchanged, so this is not a spec change. A
     stale column would mislead later agents (J5).
   - Accepted as is, noted for the record.

## Checks made

- **Work items.** W1 to W6 are present as planned:
  - the config case "sets prerenderConflictBehavior to error";
  - the Astro backstop build run, which asserts that its override matched;
  - `contentError` as the only constructor (the acceptance-5 grep and the old-module grep come back
    empty);
  - `assertUniqueProjectFiles` and the projects route glob are gone;
  - `src/pages/` and `src/components/` change only imports, the calls and the removed duplicate
    call.
- **Coverage mapping.** Each case of the deleted `address.test.ts` (15 rows), `post-address.test.ts`
  (13) and `project-address.test.ts` (7) maps 1:1:
  - The duplicate cases became `assertNoTwin` cases with exact messages, checked from both entries.
  - The "Post files" prefix is now covered by the exact P17 twin message.
  - "Names both files whatever order" became "from either entry".
  - The "project errors" cases moved to `errors.test.ts` (6 cases).
  - "Accepts distinct slugs" became the no-twin case.
- **Wording.** Every acceptance-6 text is unchanged against main, compared side by side with the
  deleted modules. The per-kind image wording (J3) is kept.
- **No check weakened.**
  - `claimFromRouteFile` keeps the exact, generated-stem (`robots.txt.ts` → `/robots/`) and
    dynamic-prefix rules unchanged (`addresses.ts` lines 87 to 98), and their unit cases are kept.
  - Reserved page addresses (line 122) and reserved post and series slugs (lines 140 to 143) are
    kept.
  - A `.md`/`.mdx` twin still fails for pages (unit), posts (unit and sync P17) and projects (unit
    and sync row 26).
  - `x.mdx` + `x/index.mdx` still fails with the custom wording, now at sync.
  - With `'error'` on, the build is stricter.
- **Layers.** Each test sits at the layer the plan names: unit, sync or build.

## Measurement

|                                                                                                                                                                                           | Before (main)       | After                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------- |
| Modules: `address.ts` 97, `post-address.ts` 65, `project-address.ts` 39, `images.ts` 43, `project-images.ts` 35, `errors.ts` 37 → `addresses.ts` 145, `images.ts` 55, `errors.ts` 23 | 316                 | 223 (−93, −29 %)                      |
| Unit tests: `address.test.ts` 141, `post-address.test.ts` 86, `project-address.test.ts` 51, `images.test.ts` 56 → `addresses.test.ts` 281, `images.test.ts` 77                        | 334                 | 358 (+24)                             |
| The same, plus the new `errors.test.ts` (24)                                                                                                                                            | 334                 | 382                                   |
| `it` / `it.each` rows (like for like)                                                                                                                                                   | 40 (15 + 13 + 7 + 5) | 40 (33 + 7); 42 with `errors.test.ts` |

## Follow-ups for the PR body

- Principle III: whether Don treated the `astro.config.mjs` edit as major by path (HIGH 1), and
  auto-merge set to match.
- Astro's `prerenderConflictBehavior` docs do not say that it also turns the glob loader's
  duplicate-id warning into an error. That loader check also misses `.md`/`.mdx` pairs because of
  load timing. Worth an upstream docs note or issue.
- `index/index.mdx` next to `index.mdx` now fails at sync, but the address in the message depends
  on which file loads first (LOW 6). A fix could take the address from the first file in sorted
  order.
- Astro's `PrerenderRouteConflict` names routes, not files. If it ever names source files, the
  exact-collision branch of the row-14 check could go (J1).
- Optional tidy-ups if the implement phase is reopened: LOW 2 to 5.
