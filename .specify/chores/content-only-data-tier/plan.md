# Chore plan: content-only-data-tier (issue #199)

Branch: `chore/content-only-data-tier`. Closes [#199](https://github.com/drcdev/dcc-web/issues/199)
"Content-only verify tier for data collections". Second of the four content-structure issues
(#200 merged in PR #207, which made data files `.yaml` and the Now note `now.mdx`).

## Goal

An edit to a career entry, a reading path, the Now note or an assessment runs the full verify
gate today, because `scripts/ci/changed-paths.ts` recognises only `.mdx` files and images under
`src/content/pages`, `posts` and `projects` as content-only. These are plain data edits, so they
should get the cheaper content-only tier like any other content change. That is safe because the
content-only tier still builds the real site (`tests/build/indexing.test.ts` runs `astro build`,
which runs every schema and every build-time check that reads that data), still runs the unit
tests that read the real data files and the real `pnpm run build` in `e2e`. The build tests it
skips build the fixture site only and never read real content. Add exact, anchored patterns for
the data files, and bring the docs and the `/content` skill into line
([#199](https://github.com/drcdev/dcc-web/issues/199)). No page changes for a reader.

## Acceptance

**Before** (measured 2026-10-25 on `f7f62cd8`):

- `isContentOnly()` returns `false` for every data file: `src/content/career/*.yaml` (7 files),
  `src/content/reading-paths/*.yaml` (2), `src/content/assessments/wayfinder.yaml` and
  `src/content/now/now.mdx` (checked with a one-off `node` import of `isContentOnly`). A diff of
  only those files therefore prints `tier=full`.
- `tests/unit/ci/changed-paths.test.ts`: 165 tests pass.
- `docs/testing.md` line 62 names only `.mdx` files and images under pages, posts and projects;
  `.claude/skills/content/SKILL.md` lines 115-117 hold the "State today" paragraph naming #199.

**After:**

1. `isContentOnly()` returns `true` for `src/content/career/<name>.yaml`,
   `src/content/reading-paths/<name>.yaml`, `src/content/assessments/<name>.yaml` and
   `src/content/now/now.mdx`, and `decide()` returns `content-only` for a diff of only such files
   (alone or with docs or skip-safe files). Proven by new `it.each` rows and `decide()` cases.
2. These still give `full` (new cases): a file under `src/content/schemas/`; a `.yml` and a `.md`
   file in a data folder; a data file in a sub-folder (for example
   `src/content/career/old/x.yaml`); a Now file other than `now.mdx` (for example
   `src/content/now/other.mdx`); an image in a data folder; and a data file in the same diff as a
   code change (`src/lib/now.ts`). The existing malformed-path rows (`..`, leading `/`, `\`,
   spaces) still return `false`.
3. The new patterns are anchored at both ends and name each folder; there is no broad
   `src/content/` prefix and no image pattern for the data folders.
4. The header comment in `changed-paths.ts`, the content-only row and the coverage table in
   `docs/testing.md`, and the `/content` skill "Gate" section describe the new rule;
   `grep -n "#199\|State today: a YAML" .claude/skills/content/SKILL.md` prints nothing.
5. `pnpm run test:unit` passes. The local tier for this branch is full (it changes
   `scripts/ci/`), so CI runs the full gate; locally only the tier checks the pipeline names.

## Scope

**In:** W1 and W2 below.

**Out (follow-ups for the PR body):**

- None required. `tests/unit/ci/content-tier.test.ts` walks pages, posts and projects only and
  needs no change: no build test in `test:build:content` names a real data entry, and no build
  test outside it does either (the career, home-sections, assessment and question build tests use
  `tests/fixtures`).
- `.claude/skills/_shared/verify-gate.md` says "content-only or full runs the full
  `pnpm run verify`" and does not list file kinds, so it stays correct and is not edited.

**Not changed:** `.github/workflows/ci.yml`, `package.json` (`test:build:content` keeps its four
files), any schema, loader, component, page, fixture or visual baseline.

## Constitution Check

- I Test-First: W1 adds the new `isContentOnly` and `decide()` cases first and sees the `true`
  rows fail before the patterns are added.
- II Release Gate: no check is removed; a data edit still runs lint, type check, unit, worker,
  e2e (real `pnpm run build`) and the real-content build tests. The skipped build files are
  fixture-only, and their machinery (schemas, `content.config.ts`, `src/lib/**`, components)
  stays full tier. The rule still fails closed: anything not matched exactly runs full.
- III Human Review: normal PR from `drc-agents`, auto-merge armed, Don approves.
- IV First-Party: no Astro, Cloudflare, Vitest, Playwright or Actions feature use changes; the
  change is two regular expressions in an existing script.
- V Static: no runtime or endpoint change.
- VI Content as Files: unchanged; invalid data still fails the real build on the content-only
  tier through `indexing.test.ts` and `pnpm run build`.
- VII Private Data: N/A.
- VIII Cloudflare: N/A.
- IX Cost: no cost; slightly fewer CI minutes on data edits.
- X Accessible/Fast/Private: no visible change; the budget and accessibility checks still run on
  content-only.
- XI Spec Kit: chore flow on `chore/<slug>`, plan in `.specify/chores/<slug>/`.

## Work items

Run tests through the Local toolchain rules in `CLAUDE.md` (`node -v`, `nvm use` in the same
command if needed).

### W1 — Data files are content-only in `changed-paths.ts` [x]

**Files:** `scripts/ci/changed-paths.ts`; `tests/unit/ci/changed-paths.test.ts`.

**Change.** Add one exported pattern (name it `CONTENT_DATA`) next to `CONTENT_FILE` and
`CONTENT_IMAGE`:

```ts
export const CONTENT_DATA =
  /^src\/content\/(?:(?:career|reading-paths|assessments)\/[A-Za-z0-9._-]+\.yaml|now\/now\.mdx)$/;
```

(two alternatives in one anchored expression, or two constants if that reads better; either way
no sub-folders, `.yaml` only, and `now.mdx` by exact name). `isContentOnly()` keeps its
`isMalformed` guard first and ORs in the new pattern. Update the header comment so content-only
reads "an `.mdx` file or an image under pages, posts or projects, or a data file (a `.yaml` file
directly under career, reading-paths or assessments, or `now/now.mdx`)".

**Tests (new-first; primary layer unit, the cheapest layer that can observe a pure function of a
path list):**

- `CONTENT_TRUE` gains one real-shaped path per data folder plus `src/content/now/now.mdx`.
- `CONTENT_FALSE` gains `src/content/schemas/career.ts`, `src/content/career/x.yml`,
  `src/content/reading-paths/x.md`, `src/content/career/old/x.yaml`,
  `src/content/assessments/sub/x.yaml`, `src/content/now/other.mdx`, `src/content/now/now.md`,
  `src/content/career/images/x.png` and `src/content/career/x.yaml.ts`.
- `decide()` cases: a diff of data files only (one of each kind) is `content-only`; a data file
  plus a `docs/` Markdown file is `content-only`; a data file plus `src/lib/now.ts` is `full`;
  a data file plus a `src/content/schemas/` file is `full`.
- See the `true` rows and the `content-only` decide cases fail before the pattern is added.

No test moves or is removed. Use made-up entry names in the new literals (Real content in tests,
`docs/testing.md`), so the test stays independent of content.

### W2 — Docs and the `/content` skill match [x]

**Files:** `docs/testing.md`; `.claude/skills/content/SKILL.md`.

- `docs/testing.md` line 62, Content-only row: "… or an image or video file under
  `src/content/pages`, `src/content/posts` or `src/content/projects`, or a data file: a `.yaml`
  file directly under `src/content/career`, `src/content/reading-paths` or
  `src/content/assessments`, or `src/content/now/now.mdx`." Keep ".md files, schemas,
  `src/content.config.ts` and `public/` are not content-only".
- `docs/testing.md` "Coverage on a content-only change" table: add a row for
  `career-timeline.test.ts`, `home-sections.test.ts`, `assessment-scripts.test.ts` and
  `question-source.test.ts` (skipped today but not listed): they test the timeline, home
  sections, assessment scripts and question source with fixture files; their machinery is not
  content-only; the real data is parsed by `indexing.test.ts` and `pnpm run build`, and the unit
  tests under `tests/unit/content/` that read the real data still run. Check lines 87 and 186
  stay accurate.
- `.claude/skills/content/SKILL.md` "Gate": delete the "State today" paragraph (lines 115-117).
  Check that the rest of "Gate" does not imply data collections run full.

**Test:** no behaviour: n/a (documentation and skill text). Acceptance 4 is the check; the docs
tier's unit tests that read `.claude/skills/` still pass.

## Docs citations

None. Principle IV does not apply: no Astro, Vitest, Playwright, Wrangler or GitHub Actions
feature is newly used or used differently. The change is regular expressions in an existing
script and prose.

## Risks

- **A future data check outside the real build.** If someone adds a build test that reads real
  data by name outside `test:build:content`, a data edit would skip it. `content-tier.test.ts`
  only knows pages, posts and projects slugs, so it would not catch a career or reading-path name.
  Accepted: the same risk already stands for the four fixture-only data build tests, and the
  "Real content in tests" rule forbids naming real entries. Note it in the coverage table.
- **A new data collection or a sub-folder layout.** Anything not matched exactly runs full, so a
  new collection or nested file is slower, never unsafe (fail closed).
- **Parallel content-structure issues** (#201, #203) edit other sections of
  `.claude/skills/content/SKILL.md`; conflicts are text-only and resolved by whichever lands
  second.
- **Sibling worktrees on ports 4321/4322** do not affect this chore's local checks (unit tests
  only); CI is the gate.
