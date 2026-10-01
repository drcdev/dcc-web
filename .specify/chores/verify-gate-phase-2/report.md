# Review report: verify-gate-phase-2 (issue #26, phases 1 and 2)

Fresh-eyes review, round 1. Read-only on src/, tests/, scripts/, .github/, .claude/, docs/,
specs/. Reviewed git diff main...HEAD (7 commits, 107 files) file by file, including every
deleted test file and fixture. Every expect line of the 15 deleted or merged build files was
diffed against the new files, and every test title named in docs/testing.md was checked
against the code.

## Verdict

- Scope: no src/, .github/, .claude/, package.json, lockfile, wrangler.jsonc,
  vitest.config.ts, scripts/ or constitution change.
- Principle III verdict (not major): still right against the real diff.
- Pipeline skills: .claude/skills/ is untouched.
- Budget: the recount from the files matches docs/testing.md. Builds: local-site 5,
  drafts 2, blog-listing 1, indexing 2, page-validation 4, post-validation 3,
  project-validation 2 = 19. Syncs: page 3, post 4, project 3, fixture-site 2 = 12.
- All 59 mapped test titles exist.
- No skip, only or todo. The one skipped test is the preview row of the it.runIf(main)
  sitemap test in indexing.test.ts. It passes on the main-branch row, which is the one that
  matters, and is stronger than the old local-build check.
- Stale references: deleted file names remain only in historical specs records and in
  this chore's plan.
- Fixtures: every remaining broken fixture is referenced.

## Findings

### CRITICAL (2)

- C1 docs/testing.md:93. False call-site mapping for page row 14. The route passes two
  lists to assertUniqueAddresses (src/pages/[...slug].astro:23-28). Build e
  (tests/build/page-validation.test.ts:52-59) only exercises the page-file list, so it
  would still pass if the route-file list were empty. The unit test
  (tests/unit/content/address.test.ts:121-140) copies the route's file pattern instead of
  testing the route. The deleted 404.mdx build and the project-routes "/projects/" build
  used to prove it. Fix: add one page build with a route conflict (budget becomes 20, at
  the target), then update the budget table and the row 14 mapping.
- C2 tests/unit/content/project-address.test.ts:24-27. The "not in a subfolder"
  assertion from the deleted project-routes.test.ts:27 is no longer asserted anywhere.
  Fix: add one .toThrow("not in a subfolder").

### HIGH (0)

None. Every work item W1-W6 is done and every test the plan names is present. The whole
build project and the whole unit project pass.

### LOW (12)

- L1 src/lib/posts.ts:31. No build checks that the post and project file lists look in
  sub-folders (P14 and the row 26 nested file). Accepted under placement rule 3; follow-up.
- L2 tests/build/drafts.test.ts:6-10. The no-branch build is covered by the build-mode
  unit tests, astro-config.test.ts:95-101 and the production build's same call. Not
  observed: a full build completing with WORKERS_CI=1 and no branch. Acceptable.
- L3 tests/build/local-site.test.ts:112-116. The "does not leak" test checks only the
  sitemap origin, which a leaked main environment would also give. The real proof is the
  draft assertions at :477-491. Suggest adding a draft-page assertion inside the test.
- L4 tests/build/local-site.test.ts:494. The feed is read with written() (passes if the
  file is missing) where the old test used read(). Covered by the strict read at :200.
- L5 tests/unit/content/project-schema.test.ts:388. toContain("b") matches almost any
  text; use a distinctive option id.
- L6 tests/build/post-validation.test.ts:44-54. P21 now only runs sync; contract 013's
  "builds" rests on the blog-listing free-form build. Documented at docs/testing.md:133.
- L7 Quickstart edits beyond the plan's file list (specs/003 quickstart 42,58-60;
  specs/008 quickstart 24-25; specs/009 quickstart 25). Stale-reference fixes, noted in
  W6. specs/003 quickstart line 45 still says "the fixture site with only workshops.mdx
  added builds", which no longer describes local-site.test.ts.
- L8 docs/testing.md:127. P15 title paraphrased; the real title is "rejects the file
  name %s (P15)".
- L9 specs/013-writing-series/contracts/build-errors.md:3-4. Awkward line wrap.
- L10 tests/build/fixture-site.ts:46. Comment example names the deleted
  broken/P01-no-title.mdx.
- L11 W3 and W4 did not re-run the source files before deleting them; moot, since every
  moved assertion passes in the full build run.
- L12 beforeAll timeouts of 900 s (local-site.test.ts:86, drafts.test.ts:61) and 300 s
  (fixture-site.test.ts:32). Acceptable because each wraps batched builds; the whole
  build project took 184 s.

## Measurement (before / after)

| Measure | Before | After |
|---|---|---|
| Astro runs in the build project | 132 builds + 12 syncs (144) | 19 builds + 12 syncs (31) |
| Local build project | Not timed (load average 39+) | 3 min 05.6 s wall (vitest 184.4 s), about 1350 CPU-s; 9 files, 152 passed, 1 skipped, 0 failed; load at start 6.33 / 11.01 / 18.05 |
| Local unit project | Not timed | 7.6 s wall (vitest 6.40 s); 167 files, 2317 passed; load at start 58.35, left over from the build run |
| CI vitest stage | 23.7 min wall; build project 4162 CPU-s | Pending first CI run |
| CI verify job | 20 min 02 s (run 36911846057) | Pending first CI run |

changed-paths and docs-structure unit tests: 97 passed.

## Follow-ups for the PR body

1. C1 and C2, if not fixed in this PR (C1 costs one build, bringing the total to 20).
2. Project row 17, body-image half: never tested, before or after this change.
3. Sub-folder coverage of the post and project file lists (L1).
4. A guard test that keeps the build count at or under budget (D7).
5. Constitution Principle I cross-reference to docs/testing.md (deferred to D7).
6. prettier --check fails on docs/testing.md as on every existing doc; prettier is not a
   repository tool.
7. scripts/build-fixture-site.ts:150 names project-validation.test.ts, which still
   exists; correct as is.
8. tests/build/fixture-site.ts:46 comment example (L10).
9. The two fixture-site.test.ts syncs remain; they could fold into the validation syncs
   later.
10. If CI time does not drop as expected, local-site.test.ts (5 sequential builds) is the
    likely bottleneck; the plan's fallback is to split out the two code builds (+1 build).

## Fix round 1

- C1: added `row 14` build to `tests/build/page-validation.test.ts` (restored fixture `14-route-conflict.mdx` as `404.mdx`, asserts `404.mdx`, `404.astro`, `/404/`); `docs/testing.md` row 14 mapping and budget (page-validation 5, total 20 builds + 12 syncs) and plan.md W6 note updated. Test result: page-validation build file 8 passed.
- C2: added `.toThrow("not in a subfolder")` to `tests/unit/content/project-address.test.ts` "rejects a nested file"; mapping noted in `docs/testing.md` row 26. Test result: unit files 44 passed.

## Review round 2

Fresh eyes on the fix commit e81c667 (`git log -3`, `git show HEAD`, `git diff main...HEAD`).

### Status of round 1 findings

- **C1: closed.** `tests/build/page-validation.test.ts:61-62` "row 14: the route checks addresses
  over the src/pages route-file list (404.mdx against 404.astro)" builds one page at `404.mdx`
  (fixture `tests/fixtures/pages/broken/14-route-conflict.mdx`, byte-identical to the one on
  main) and asserts the build fails with `404.mdx`, `404.astro` and `/404/`. These are the same
  three strings as `git show main:tests/build/page-validation.test.ts:70-71`. It exercises the
  route-file half: there is only one page file, `src/pages/404.astro` exists, and
  `futureDestinations` is empty (`src/config/navigation.ts:48`). So only the `routeFiles` list
  passed at `src/pages/[...slug].astro:26-29` can raise the error. The row 14 line at
  `docs/testing.md:93` names it as "row 14", the same short form the table uses for row 7. That
  short form is a prefix of the real title. The reserved-address half is still unit-only, as it
  was after round 1.
- **C2: closed.** `tests/unit/content/project-address.test.ts:27` adds
  `expect(() => slugFromPath("x/y.mdx")).toThrow("not in a subfolder")`. `slugFromPath` is the
  function that raises that phrase (`src/lib/content/project-address.ts:12`). The row 26 line at
  `docs/testing.md:186` names the real title, "rejects a nested file".

### Budget recount

Counted from the files, with `beforeAll`, `it.each` and `describe.each` expanded:

- **Builds:** local-site 5 (l1, l2, l3, codeBaseline, codeBroken), drafts 2, blog-listing 1,
  indexing 2 (`describe.each` over 2 environments, a real `astro build`), page-validation 5,
  post-validation 3, project-validation 2. Total 20.
- **Syncs:** page 3, post 4 (P23, P4, P9, P21), project 3, fixture-site 2. Total 12.

This matches the table in `docs/testing.md` (20 + 12) and the plan's W6 note. 20 is at the
target, not over it.

### Scope and weakening

- The fix commit touches only `plan.md`, `report.md`, `docs/testing.md`,
  `page-validation.test.ts`, the restored fixture and `project-address.test.ts`.
- `git diff main...HEAD` shows no change to `src/`, `.github/`, `.claude/`, `scripts/`,
  `package.json`, the lockfile, `vitest.config.ts`, `wrangler.jsonc` or the constitution.
- No assertion was removed or loosened. The commit adds one build case and one `expect`.
- Principle III verdict (not major) still holds. The commit adds tests and docs only: no
  dependency, CI, deployment, design or contact-data change.

### New findings

- **CRITICAL (0):** none.
- **HIGH (0):** none.
- **LOW (1):**
  - L13 `docs/testing.md:74-76`. The "Call-site runs" list of build titles for page files
    still names four builds and leaves out the new row 14 build. The table row at line 93
    does name it. Fix: add "row 14: the route checks addresses over the src/pages
    route-file list" to the list.

### Test results

Node v24.4.1 (`.nvmrc` 24). Load average at start: 10.08 / 15.69 / 20.46.

- `corepack pnpm vitest run --project build tests/build/page-validation.test.ts` (under a
  600 s alarm): 1 file, 8 passed, 74.5 s.
- `corepack pnpm vitest run --project unit tests/unit/content` (under a 300 s alarm):
  26 files, 594 passed, 1.2 s.
