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
