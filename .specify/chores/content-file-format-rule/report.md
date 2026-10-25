# Review: content-file-format-rule (issue #200)

Fresh-eyes review of `git diff main...HEAD` (commits `a0cb52b0`..`b654c0bb`) against `plan.md` and issue #200. Reviewed 2026-10-25.

## Verdict

W1 to W4 match the plan, with one gap: the `/content` skill still mentions #202 (HIGH-1). No check is weakened, every coverage mapping holds, and every named test exists at the layer the plan names and passes.

## Tests run

- `vitest run --project unit`: 190 files, 2893 tests passed.
- `vitest run --project build` on the six touched build-test files (`page-validation`, `project-validation`, `home-sections`, `career-timeline`, `post-validation`, `fixture-site`): 76 tests passed (184 s).
- Red check after the fact (the implementer had not seen W1 fail): the five new sync runs in `page-validation`, `project-validation`, `career-timeline` and `post-validation` were run against the pre-change code (`60206aed`) in a throwaway worktree. All five **fail** on their assertions: "the sync should fail: expected true to be false", and the `.md` landing file gives the old twin message instead of the rename message. They detect the change. `file-format.test.ts` cannot load before W1 because the module does not exist yet.
- `astro build` of the real site succeeded with no reading-path, career or assessment reference error (Acceptance 5).

## Findings

### CRITICAL

None.

### HIGH

1. **`.claude/skills/content/SKILL.md:36-38` still points to #202.** It says "#202 will merge the three small site-data collections (Now, reading paths, assessment), so re-read the schema before trusting a row." #202 is closed as not planned. The issue says to delete the "State today" sentence "including its mention of #202", and plan W4 says to replace it "including #200/#202". The new text dropped #200 but kept #202 as a promise that will not happen. Fix: delete the #202 clause.

### LOW

1. **Acceptance 6 grep cannot pass as written.** The grep matches the "`.yml` is rejected" notes and `now.mdx`, which the same plan tells the skill and docs to contain. It prints 6 lines (`docs/pages.md:183`, `SKILL.md:34, 46-49`), and every one describes the rule. Apart from HIGH-1, the intent is met.
2. **Fixtures left unused.** `tests/fixtures/projects/broken/26-duplicate-slug.mdx` lost its only user (the replaced row 26 sync run). `tests/fixtures/reading-paths/broken/two-now/now.mdx` is unused because N07 reads only `two-now/now-extra.mdx` (it was unused before the rename too).
3. **Test edit outside the plan's file list.** `tests/unit/content/projects-guide.test.ts:93` moved from the "two files with the same address" text to "a `.md` project file … rename it to `.mdx`", a direct consequence of W4's planned `docs/projects.md` edit. Not weakened.
4. **Test-first was not observed during W1 (Principle I, process).** The tests were written before the code but not run red. The red check above shows they fail on the old code, so the gap is in the record, not in the tests.
5. **Data loaders still glob two extensions, unlike the issue's wording.** The plan (Acceptance 1) keeps `*.{yaml,yml}` on purpose so that a `.yml` file fails with a rename message instead of being skipped silently, which also meets the issue's "a `.yml` file … fails" bullet. Each collection turns files of exactly one extension into entries. Exception: a `.md` post still becomes an entry at sync and fails only at build (`assertPostFiles`); the plan records this as a follow-up.
6. **Rendered Now section hash (Acceptance 4).** The plan's SHA-256 (`ae032a5d…`) does not match the before capture (`53b0c4e4…`), probably a capture-method difference. The before/after comparison is the test that counts, and it holds.

### Checks that passed

- **Page twin coverage (row 13):** `about.md` + `about.mdx` is now a format error, asserted by `file-format.test.ts` ("rejects .md for page") and `page-validation.test.ts` ("a .md page fails …"). Row 13 keeps its `x.mdx` + `x/index.mdx` unit case and sync run.
- **Project twin coverage (row 26 / S11):** `file-format.test.ts` has the `project` row and `project-validation.test.ts` has "a .md project fails …". With `.md` rejected first, two project files can no longer share a slug.
- **Posts:** the post twin and P13 tests are unchanged, and `file-format.test.ts` pins the post message exactly.
- **Sync runs:** seven new sync wiring runs, one per call site, as planned.
- **`docs/testing.md`:** new "File format: issue #200" table, updated rows 13, S11 and N07, project call-site list and a Build budget line.
- **Scope:** no `_shared/` block restated in the skill; nothing changed in `specs/**`, `scripts/ci/changed-paths.ts`, any schema or any visual baseline; the only component change is the planned comment.

## Measurement

| | Before (`b5092042`) | After (`b654c0bb`) |
|---|---|---|
| `pages` | `**/*.{md,mdx}`, both load | `.mdx` loads, `.md` fails at sync (`assertFileFormat`) |
| `landing` | `{writing,projects}.{md,mdx}`, both load | `.mdx` loads, `.md` fails at sync |
| `posts` | `*.{md,mdx}`, `.md` fails at build | unchanged; `.md` fails at build through the shared helper |
| `projects` | `**/*.{md,mdx}`, both load | `.mdx` loads, `.md` fails at sync |
| `now` | `*.md`; `.mdx` silently ignored | `*.{md,mdx}`, `.mdx` loads, `.md` fails at sync |
| `career` | `*.{yaml,yml}`, both load | `.yaml` loads, `.yml` fails at sync |
| `readingPaths` | `*.{yaml,yml}`, both load | `.yaml` loads, `.yml` fails at sync |
| `assessments` | `*.yaml`; `.yml` silently ignored | `*.{yaml,yml}`, `.yaml` loads, `.yml` fails at sync |
| Collections turning two extensions into entries | 5 of 8 | 0 of 8 (posts: a `.md` file is an entry at sync but fails the build) |
| Wrong-format file ignored without an error | 2 | 0 |
| `src/content` files | 1 `.md`, 22 `.mdx`, 10 `.yaml`, 0 `.yml` | 0 `.md`, 23 `.mdx`, 10 `.yaml`, 0 `.yml` |
| `.md`/`.yml` under `src/content` and `tests/fixtures` | 7 files | only `tests/fixtures/posts/broken/p13-markdown-file.md` |
| Rendered Now section (`dist/index.html`) | 1814 bytes | 1813 bytes; with newlines removed `diff` is empty (one newline between `</p>` and `</div>`) |

## Follow-ups for the PR body

- Move the posts `.md` rejection from build (`assertPostFiles`) into `generateId` at sync, like the other seven collections. This changes P13, P17 and the post twin check; the plan put it out of scope.
- #199 (content-only tier for data files) builds on this rule.
- Recount the "Build budget" table in `docs/testing.md`, last counted on 2026-10-01.

## Round 2 fixes

- HIGH-1: removed the "#202 will merge the three small site-data collections" sentence from `.claude/skills/content/SKILL.md`; no #202 mention remains in the skill.
- LOW-2: deleted the unused fixtures `tests/fixtures/projects/broken/26-duplicate-slug.mdx` and `tests/fixtures/reading-paths/broken/two-now/now.mdx` after confirming nothing reads them (only `two-now/now-extra.mdx` is read, by the N07 test; `docs/testing.md` does not reference them).
