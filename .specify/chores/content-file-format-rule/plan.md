# Chore plan: content-file-format-rule (issue #200)

Branch: `chore/content-file-format-rule`. Closes [#200](https://github.com/drcdev/dcc-web/issues/200)
"One file format rule for content". First of the four content-structure issues (#200, then #199,
then #203; #201 any time).

## Goal

Content under `src/content/` uses three file formats with no stated rule, and most collections
accept two extensions. Settle one rule and enforce it in every collection: **a file with a body is
`.mdx`; a file without one is `.yaml`.** The Now note moves from `now.md` to `now.mdx`; pages,
landing files and projects stop accepting `.md`; career steps, reading paths and assessments stop
accepting `.yml`. A file in the wrong format fails the build with a message that names the file
and says what to rename it to, as posts already do. The docs and the `/content` skill describe
only the rule. No page changes for a reader
([#200](https://github.com/drcdev/dcc-web/issues/200)).

## Acceptance

**Before** (measured 2026-10-25 on `b5092042`):

- Loader patterns in `src/content.config.ts`: `pages` `**/*.{md,mdx}`, `landing`
  `{writing,projects}.{md,mdx}`, `posts` `*.{md,mdx}`, `projects` `**/*.{md,mdx}`, `now` `*.md`,
  `career` `*.{yaml,yml}`, `readingPaths` `*.{yaml,yml}`, `assessments` `*.yaml`.
- Loader patterns that match two extensions: **6 of 8**. Collections that turn files of two
  extensions into entries: **5 of 8** (pages, landing, projects, career, readingPaths); posts
  matches `.md` but rejects it at build through `assertPostFiles`. A `.yml` assessment is silently
  ignored, and so would be a `.mdx` Now file.
- Files: `src/content` holds 1 `.md` (`now/now.md`), 22 `.mdx`, 10 `.yaml`, 0 `.yml`.
  `tests/fixtures` holds 6 `.md` files: `now/now.md`, four Now files under
  `reading-paths/broken/`, and `posts/broken/p13-markdown-file.md` (the deliberate P13 fixture).
- Rendered Now section of the real home page (`astro build`, `dist/index.html`, the
  `<section … data-now …>` element): SHA-256 `ae032a5de8190f71d6cc7f1c211ec890ae256a855c1f8b23e78b3161919f2eeb`.
  A spike (renamed to `now.mdx`, loader pattern and id changed, built, reverted) showed one
  difference only: the Markdown renderer writes a newline between `</p>` and `</div>` at the end
  of the "open to" block, and MDX does not. That newline is a whitespace-only text node at the end
  of a block container and renders nothing, so it is not a visible change.

**After:**

1. Every collection turns files of exactly one extension into entries: `pages`, `landing`,
   `posts`, `projects` and `now` `.mdx`; `career`, `readingPaths` and `assessments` `.yaml`. A
   loader pattern matches the wrong extension only so that the file is rejected: each of the seven
   loaders other than `posts` calls `assertFileFormat` first in its `generateId`, and `posts` keeps
   `assertPostFiles`, which now calls the same helper.
2. Each wrong-format file fails `astro sync` with `<Kind> file <path>: … must be an .mdx file, so
   rename it to .mdx.` or `… must be a .yaml file, so rename it to .yaml.`, proven by one sync
   wiring test per call site (7 new runs): a `.md` page, a `.md` landing file, a `.md` project, a
   `now.md`, a `.yml` career step, a `.yml` reading path and a `.yml` assessment. P13 still passes
   unchanged.
3. `find src/content tests/fixtures \( -name '*.md' -o -name '*.yml' \)` prints only
   `tests/fixtures/posts/broken/p13-markdown-file.md`.
4. The rendered Now section after W2, extracted the same way, differs from the before capture
   only by that one newline: `diff <(tr -d '\n' < before) <(tr -d '\n' < after)` is empty. The
   existing `home-sections.test.ts` "builds a valid Now entry …" and the N03, N06 and N07 runs
   pass on the `.mdx` fixtures.
5. Entry ids are unchanged for every real file and fixture (the new data `generateId` returns the
   file name without `.yaml`, which equals the github-slugger id for every current name: all are
   lower-case letters, digits and hyphens). Shown by the build tests and `pnpm run build` passing
   with no reading-path, career or assessment reference error.
6. `grep -nE '\.yml|plain `\.md`|now\.md|State today\. All paths' docs/pages.md docs/projects.md .claude/skills/content/SKILL.md`
   prints nothing, and the skill's Collection guide states the rule once.
7. The full gate passes (the change touches `src/`, so the tier is full).

## Scope

**In:** W1 to W4 below.

**Out (follow-ups for the PR body):**

- Moving the posts `.md` rejection from `assertPostFiles` (build time) into `generateId` (sync
  time), like the other seven collections. It would change P13 and P17 and the post twin check;
  the message already comes from the shared helper after W1.
- #199 (content-only tier for data files), which depends on this rule and edits
  `scripts/ci/changed-paths.ts` and the skill's "Gate" section. This chore does not touch either.
- The "Build budget" table in `docs/testing.md` was last counted on 2026-10-01 and is already out
  of date (it omits several later files). W4 adds a line for this chore's 7 syncs; a full recount
  is not done here.

**Not changed:** `specs/**` contracts (history), `scripts/ci/changed-paths.ts`, any component,
schema or visual baseline.

## Decision: landing files stay `.mdx`

The two landing files (`pages/writing.mdx`, `pages/projects.mdx`) have no body (the build requires
it empty), so the rule as worded would make them `.yaml`. The issue does not name them. Don chose
(2026-10-25) to keep them `.mdx`: the `landing` loader matches `{writing,projects}.{md,mdx}` and
rejects `.md` like any page. They sit in the pages folder beside the pages they configure and use
the same `title`/`nav` front matter, so no doc or test moves. The skill and `docs/pages.md` say
the pages folder holds only `.mdx`, landing files included. Moving them to `.yaml` was considered
and not chosen.

## Constitution Check

- I Test-First: every work item writes its unit and sync tests first and sees them fail before the
  loader or helper change.
- II Release Gate: no check is skipped or weakened; seven new build-error paths are added.
- III Human Review: normal PR from `drc-agents`, auto-merge armed, Don approves.
- IV First-Party: uses the glob loader's documented `pattern` and `generateId` options (cited
  below). Astro has no option to reject a matched file; narrowing the pattern alone (first-party)
  was considered and falls short because a wrong-format file is then silently ignored instead of
  failing with a rename message. The check is one small function in the hook Astro documents for
  per-file work, where the twin, image and date checks already run.
- V Static: no runtime or endpoint change.
- VI Content as Files: content stays in Git as MDX plus YAML data files, validated by schemas;
  invalid content (now including the wrong format) fails the build with a clear error.
- VII Private Data: N/A.
- VIII Cloudflare: N/A.
- IX Cost: no cost.
- X Accessible/Fast/Private: no visible change (Acceptance 4); no baseline moves.
- XI Spec Kit: chore flow on `chore/<slug>`, plan in `.specify/chores/<slug>/`.

## Work items

Each item leaves the suite green on its own. Run tests through the Local toolchain rules in
`CLAUDE.md` (`node -v`, `nvm use` in the same command if needed).

### W1 (done) One format check; pages, landing and projects reject `.md`

**Files:** new `src/lib/content/file-format.ts`; `src/lib/content/addresses.ts`
(`assertPostFiles` calls the helper; `assertNoTwin` narrowed); `src/lib/content/errors.ts`
(`ErrorKind` gains `"assessment"`, used in W3; added here so the table is complete);
`src/content.config.ts` (`pages`, `landing`, `projects`); new unit test
`tests/unit/content/file-format.test.ts`; `tests/unit/content/addresses.test.ts`;
`tests/build/page-validation.test.ts`; `tests/build/project-validation.test.ts`.

**Helper.** `assertFileFormat(kind: ErrorKind, file: string): void`, with one table that *is* the
rule: `page`, `post`, `project`, `now` → `.mdx`; `career step`, `reading path`, `assessment` →
`.yaml`. On a mismatch it throws
`contentError(kind, file, "<noun> must be <an .mdx|a .yaml> file, so rename it to <ext>.")` with
nouns `a page`, `a post`, `a project`, `the Now file`, `a career step`, `a reading path`,
`an assessment`. The post message stays exactly "a post must be an .mdx file, so rename it to
.mdx.", so `assertPostFiles` replaces its own `.mdx` line with a call to the helper and P13 is
unchanged.

**Loaders.** `pages`, `landing` and `projects` keep their `{md,mdx}` patterns and call
`assertFileFormat("page" | "project", "<dir>/" + entry)` first in `generateId`.

**Twin check.** With `.md` rejected, a `.md` twin can no longer exist, and keeping it in the
twin list would make the message depend on which file the loader reaches first. So:
`assertNoTwin` checks `${id}.mdx` and `${id}/index.mdx` for pages and keeps `${id}.md`/`${id}.mdx`
for posts (unchanged; posts reject `.md` only at build, after sync). For projects the twin check
has nothing left to find (flat folder, one extension), so the `projects` loader stops calling it
and `assertNoTwin` takes `kind: "page" | "post"`.

**Tests (new-first; primary layer unit, plus one sync wiring run per call site, the layer that
proves `generateId` calls it, per docs/testing.md "Build, `sync`"):**

- Unit, `file-format.test.ts`: for each kind, the right extension passes; `.md` for each `.mdx`
  kind and `.yml` for each `.yaml` kind throws, naming the file and the target extension. See it
  fail (module missing) first.
- Sync, `page-validation.test.ts`: "a `.md` page fails, naming the file and saying to rename it
  to .mdx" (fixture `visible-page.mdx` copied `to: "visible-page.md"`); "a `.md` landing file
  fails …" (`broken/24-landing-no-nav.mdx` copied `to: "writing.md"`; the real `writing.mdx` stays,
  and the format check runs before the schema, so the message is the rename one and
  deterministic, because the narrowed twin check no longer pairs `writing.mdx` with `writing.md`).
- Sync, `project-validation.test.ts`: "a `.md` project fails …" (`minimal.mdx` copied
  `to: "minimal.md"`).

**Coverage mapping (moved or changed assertions):**

| Was | Now |
|---|---|
| `addresses.test.ts` page twin `about.md` + `about.mdx` (row 13) | `about.md` is a format error: `file-format.test.ts` and the new page sync run. Row 13 keeps its `x.mdx` + `x/index.mdx` unit case and sync run. |
| `addresses.test.ts` project twin `x.md` + `x.mdx` (row 26) | Format error: `file-format.test.ts` and the new project sync run. |
| `project-validation.test.ts` "row 26: generateId runs the twin check" (`x.mdx` + `x.md`) | Replaced by the new project `.md` sync run; same fixture pair, now expects "rename it to .mdx". One sync run, not two. |
| `addresses.test.ts` post twin and P13 cases | Unchanged. |

### W2 Now note moves to `now.mdx`

**Files:** `src/content/now/now.md` → `now.mdx` (`git mv`, content unchanged);
`src/content.config.ts` (`now`: pattern `*.{md,mdx}`, `generateId` calls
`assertFileFormat("now", …)` then `assertNowDate`, id `entry.replace(/\.mdx$/, "")`; comment);
`src/lib/now.ts` (message "there must be exactly one Now file, now.mdx." and the fallback path);
`src/lib/content/now-file.ts` and `src/components/sections/Now.astro` (comments only);
fixtures `tests/fixtures/now/now.md`, `tests/fixtures/reading-paths/broken/{future-now,now-no-contact}/now.md`
and `two-now/{now.md,now-extra.md}` → `.mdx` (`git mv`); `scripts/build-fixture-site.ts:178`;
`tests/build/fixture-site.ts` (doc comment, `now === false` removal path and the `to:` name);
`tests/helpers/content.ts:164-166`; `tests/build/home-sections.test.ts`;
`tests/build/fixture-site.test.ts` (lines 31, 90, 91, 136, 137); `tests/unit/content/now-body.test.ts:5`.

**Tests:**

- Existing (build layer, unchanged in intent): `home-sections.test.ts` valid Now, N03, N06, N07
  (two files, no file) on the renamed fixtures, with the message expectation changed to
  `now.mdx`. N07's second file now comes from `two-now/now-extra.mdx` (read in its `write`), so the
  renamed `two-now/` fixtures are used rather than left as dead files. Update first and see them
  fail against the `.md` loader.
- New, sync (wiring, `home-sections.test.ts`): "a `now.md` fails, naming the file and saying to
  rename it to .mdx" using `now: false` plus `write: { "src/content/now/now.md": <fixture text> }`.
- Proof the rendered Now is unchanged (Acceptance 4): before the rename, `astro build` and save
  the `<section … data-now …>` element from `dist/index.html` to the scratchpad (the before hash
  is above); after W2, build again and compare with newlines removed. Record the result in the
  review. No test is added for this: it is a one-off migration check, and the existing build test
  already asserts the section renders with its date.

### W3 Career, reading paths and assessments reject `.yml`

**Files:** `src/content.config.ts` (`career`, `readingPaths`, `assessments`: pattern
`*.{yaml,yml}`, and a `generateId` that calls `assertFileFormat("career step" | "reading path" |
"assessment", "src/content/<dir>/" + entry)` and returns `entry.replace(/\.yaml$/, "")`, the
custom-id form in the Astro docs); `tests/build/career-timeline.test.ts`;
`tests/build/home-sections.test.ts`; `tests/build/post-validation.test.ts` (assessment describe).

**Tests (unit rows already in W1's `file-format.test.ts`; new sync wiring runs, one per call
site):**

- `career-timeline.test.ts`: "a `.yml` career step fails, naming the file and saying to rename it
  to .yaml" (`career: [{ from: "valid/01-first-role.yaml", to: "01-first-role.yml" }]`).
- `home-sections.test.ts`: the same for a reading path (`harness/minimal-path.yaml` copied to
  `.yml`).
- `post-validation.test.ts`: the same for an assessment (`valid/sample.yaml` copied to `.yml`).

No new fixture files: the harness's `{ from, to }` copies give the wrong extension.

### W4 Docs and the `/content` skill describe only the rule

**Files:** `docs/pages.md` (line 18: pages are `.mdx`, a `.md` file fails with a rename message;
line 183: `now.mdx`; line 224: the twin example becomes `about.mdx` and `about/index.mdx`, plus a
bullet for a `.md` file); `docs/projects.md` (line 21 drop the `.md`/`.mdx` pair sentence, line
233 the error bullet says a `.md` file must be renamed); `.claude/skills/content/SKILL.md`
"Collection guide" (replace the "State today" sentence, including #200/#202, with the rule and the
landing-file note from the decision above; keep "All paths are under `src/content/`…" and "Every schema is
strict"; `pages` row `pages/**/*.mdx` with `.md` rejected; `career` and `readingPaths` rows
`*.yaml`, `.yml` rejected; `assessments` row notes `.yml` rejected; `now` row `now/now.mdx`);
`docs/testing.md` (row 13 cell, the project row 26 coverage, N07 message, a new "File format" row
group naming `file-format.test.ts` and the seven sync runs, and one line under "Build budget"
for the 7 added syncs).

**Test:** no behaviour: n/a (documentation and skill text). Acceptance 6 is the check.

## Docs citations

- Astro, Content Loader API, "`glob()` loader": `pattern` (string or array, micromatch syntax) and
  `generateId({ entry, base, data })` called per file; default ids come from github-slugger.
  https://docs.astro.build/en/reference/content-loader-reference/#glob-loader
- Astro, Content collections, "Defining custom IDs": `generateId: ({ entry }) =>
  entry.replace(/\.json$/, "")` is the documented custom-id form W3 follows for `.yaml`.
  https://docs.astro.build/en/guides/content-collections/#build-time-collection-loaders
- Astro, Content collections API, `CollectionEntry.body`: the raw, uncompiled body for Markdown and
  MDX alike, so `checkNowBody` reads the same text after the rename.
  https://docs.astro.build/en/reference/modules/astro-content/#astrocontent-types

All three were retrieved through the Astro Docs MCP (`search_astro_docs`) on 2026-10-25.

## Risks

- **MDX syntax in the Now note.** As MDX, a future `{` or `<` in the "open to" line is parsed as
  code. The current text has neither and built identically in the spike. Posts and pages carry the
  same constraint and their docs cover it; no new doc text.
- **Data entry ids.** W3 replaces the default slugger id with the file name minus `.yaml`. They
  match for every current file and fixture; a future file with capitals or spaces would keep them
  in its id instead of being slugified. Accepted: the reading-path and career docs already name the
  file as the id, and a mismatched reference fails the build.
- **Twin-check narrowing.** If `assertNoTwin` kept `.md` names, the error for an `x.md`/`x.mdx`
  pair would depend on loader order. W1 removes them for pages and projects so the rename message
  is the only outcome; posts keep theirs because their `.md` rejection runs later, at build.
- **Sibling worktrees on ports 4321/4322** can fail local Playwright runs; the build tests used
  here run `astro sync`/`build` only and are not affected. CI is the gate.
- **Parallel content-structure issues** (#199, #201, #203) edit `.claude/skills/content/SKILL.md`
  in other sections; merge conflicts there are text-only and resolved on whichever lands second.
