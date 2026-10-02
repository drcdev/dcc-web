# Chore plan: verify-gate-phase-4 (issue #26, phase 4)

Branch: `chore/verify-gate-phase-4`. Part of https://github.com/drcdev/dcc-web/issues/26, phase 4.
The PR body says `Part of #26`, because phase 5 (D7) remains.

## Goal

Phases 1 to 3 shipped in PRs #29, #30 and #31. CI `verify` on `main` is now about 7.5 min, under
the issue's 10 min target. This run delivers **phase 4** of the plan in
[issue #26](https://github.com/drcdev/dcc-web/issues/26), under two ticked decisions:

- **D5**: the changed-paths guard gets a **content-only tier**. A pull request that only touches
  content files (`.mdx` files and content images under `src/content/pages|posts|projects/`),
  optionally with skip-safe files, no longer runs the fixture half of the `build` Vitest
  project. Everything else runs as today. Anything not positively recognised still runs the full
  gate (fail closed).
- **D6**: a `verify:quick` package script for the inner loop of the implement and fix phases.
  The full `pnpm run verify` stays the only gate that counts before a PR. The four pipeline
  skills (`/deliver`, `/tweak`, `/squash`, `/chore`) say exactly this, in identical words.

One judgment call narrows D5, recorded here because it departs from the ticked text ("skip the
`build` vitest project"). Two build-project files assert on the repository's **real** content
by name:

- `tests/build/indexing.test.ts` holds the exact sitemap list, the published posts, the draft
  pages' robots meta, `launch.expectedPaths` in the production sitemap and the origin of every
  site address.
- `tests/build/local-site.test.ts` asserts that `services` is still a draft, that the About
  entry comes from `about.mdx`'s `nav` setting, and compares against `about`'s script count.

Skipping them on a content-only PR would let Don's next expected content PR (flipping the
launch pages' `draft` flags) pass PR CI and then turn `main` red on the push run. Principle II
forbids weakening a check, so on a content-only PR the `build-tests` job runs exactly those two
files, through a new script `test:build:content`. It skips the other seven fixture files (13 of
20 builds, all 12 syncs). A unit guard keeps that list honest. `tests/build/focus-pocus.test.ts`
reads only files and builds nothing, so it moves to the `unit` project and runs in `static` on
every non-skip-safe change.

No user-visible behaviour changes. `src/` and the visual baselines are not touched.

## Acceptance

**Before (source):** run 37040715545 (workflow "CI", push to `main`, merge commit `d8eee9c` of
PR #31, success):

| Job | Started | Completed | Duration |
|---|---|---|---|
| `changes` | 17:26:32 | 17:26:41 | 9 s |
| `static` | 17:26:44 | 17:28:08 | 1 min 24 s |
| `build-tests` | 17:26:47 | 17:33:20 | **6 min 33 s**; the "Run the build tests" step took 6 min 02 s |
| `e2e` | 17:26:44 | 17:33:51 | **7 min 07 s**, the long pole |
| `verify` | 17:33:55 | 17:34:02 | 7 s |
| **Workflow wall time** | | | **7 min 30 s** |

Local figures (explore phase, macOS, node 24): `pnpm run test:unit` took 8 s wall (168 files,
2349 tests) and `pnpm run test:worker` took 6 s wall (12 files, 132 tests). Local full
`pnpm run verify` was 5 min 17 s (issue status comment). Lint, typecheck and `build` were not
timed.

**What D5 can and cannot buy.** On a content-only PR, `e2e` still runs and stays the long pole
at about 7 min, so **the wall time of a content-only PR does not drop**. The gain is runner
minutes: `build-tests` skips 13 builds and 12 syncs, and it stops being a near-long-pole that
can flake. Its time on a content-only PR is bounded by `local-site.test.ts` (5 serial builds).
The plan states this up front so the review does not expect a wall-time cut.

**Targets.** The review checks each one. Items marked `[PREVIEW-CHECK]` can only be seen on a
real CI run.

1. **Tier decision (mechanical).** `decide()` in `scripts/ci/changed-paths.ts` returns:
   - `contentOnly: true` (with `full: true`) exactly when every changed file is content-only or
     skip-safe and at least one is content-only;
   - `full: false, contentOnly: false` when every file is skip-safe;
   - `full: true, contentOnly: false` in every other case. That includes a non-PR event, a null
     or empty diff, and any unrecognised path.

   `toOutput()` writes both lines. The unit tests in W1 prove it.
2. **Workflow wiring (mechanical).** `changes` exposes `content_only`. `build-tests` runs
   exactly one of `pnpm run test:build` or `pnpm run test:build:content`, on complementary
   `if:` expressions. An unset or garbled output runs the full `test:build`. The job-level
   `if:`, the `verify` needs and `scripts/ci/verify-needs.ts` are unchanged.
   `tests/unit/ci/workflows.test.ts` proves it (W4).
3. **No coverage lost (mechanical).** On a content-only PR, every build-project assertion that
   reads real content by name still runs. A guard test fails when a `tests/build/*.test.ts` file
   outside `test:build:content` names a real content entry (W3). `focus-pocus.test.ts` keeps
   all its assertions in the `unit` project (W2). `docs/testing.md` maps every skipped file to
   where its guarantee lives (W5).
4. **`verify:quick` exists and `verify` is unchanged (mechanical).** `verify:quick` is
   exactly `pnpm run lint:secrets && pnpm run lint && pnpm run typecheck && pnpm run test:unit && pnpm run test:worker && pnpm run build`.
   The `verify` string stays byte-identical. `tests/unit/site/config-files.test.ts` asserts
   both (W3).
5. **Pipelines agree (mechanical).** All four `SKILL.md` files contain the identical "Inner loop
   and gate" paragraph and the identical inner-loop sentence. The old "There is no scoped or
   tiered E2E in this project" sentence is gone. A new alignment test proves it (W6).
6. **`verify:quick` is quick (measured once by the review).** Time `pnpm run verify:quick`
   once under the perl alarm. Expect about 2 min or less, against the 5 min 17 s of the full
   `verify`. This is recorded, not gated.
7. **Full `pnpm run verify` is green locally**, and the PR's CI run is green (Principle II).
   This PR is not content-only, so its CI run takes the full path. The wall time should stay
   ≤ 10 min, close to the 7 min 30 s before. `[PREVIEW-CHECK]`
8. **First content-only PR after merge.** On that PR, `build-tests` runs the
   `test:build:content` step and skips the `test:build` step, and `verify` is green. Record the
   `build-tests` duration against 6 min 33 s. `[PREVIEW-CHECK]` This is a follow-up
   observation; this PR cannot show it.

## Scope

**In:**

- `scripts/ci/changed-paths.ts`: the content-only tier, a second output `content_only`, and a
  corrected fail-closed comment (W1).
- `tests/build/focus-pocus.test.ts` moves to `tests/unit/content/focus-pocus.test.ts` (W2).
- `package.json` scripts `test:build:content` and `verify:quick`. The tests in
  `config-files.test.ts`, and a content-tier guard (W3).
- `.github/workflows/ci.yml`: the `changes` output and the two complementary steps in
  `build-tests`. Also `tests/unit/ci/workflows.test.ts` (W4).
- `docs/testing.md` (W5).
- The four pipeline skills, a new alignment test, and the CLAUDE.md alignment list (W6).

**Out:**

- `scripts/ci/verify-needs.ts` and its tests are not changed. `build-tests` is never skipped on
  a content-only PR, so the aggregate needs no new skip rule. Its tests must stay green.
- `src/`, `tests/e2e/**`, `vitest.config.ts`, `playwright.config.ts` and the visual baselines
  are not touched.
- `tests/build/**` changes only by the removal of `focus-pocus.test.ts`. The fixture tests'
  content is not touched.
- Phase 5 of #26 (**D7**, governance cross-reference) and **D8** (the e2e and a11y matrices)
  are not part of this run.
- Follow-ups for the PR body:
  - From #30: make the fixture web server conditional for the budget-only run.
  - From #30: make local `test:e2e` mirror CI.
  - From #30: move the preview crawl to its own job.
  - New: make `local-site.test.ts` assert the draft page and the page-sourced nav entry on
    fixture pages instead of the real `services.mdx` and `about.mdx`. A content-only PR would
    then run only `indexing.test.ts` (2 builds). This is the lever if `build-tests` on content
    PRs is worth trimming further.
  - New: observe target 8 on the first content-only PR.

## Constitution Check

- **I. Test-First:**
  - Every work item names its test, written first and seen to fail: the tier cases (W1), the
    script strings and the content-tier guard (W3), the workflow structure (W4) and the
    pipeline alignment (W6).
  - The focus-pocus move (W2) adds the destination before it removes the source.
- **II. Automated Release Gate:** no check is weakened. A content-only PR still runs:
  - secretlint, lint, typecheck, every unit and worker test, the real `astro build` and every
    Playwright project;
  - every build-project file that asserts on real content.

  The skipped fixture files test the build machinery with fixture files, and a content-only
  path cannot change that machinery. Pushes to `main` always run the full gate. `verify` stays
  the only gate before a PR; `verify:quick` never replaces it.
- **III. Human Review for Major Changes:** the criterion **"changes CI, deployment or
  infrastructure configuration"** fires. This run changes `.github/workflows/ci.yml` and
  `scripts/ci/changed-paths.ts`, which decide what the required `verify` check runs, and
  `package.json` scripts (all three are @drcdev CODEOWNERS paths). The other criteria were
  checked:
  - No dependency is added.
  - Contact data, design and layout are not touched.
  - Costs do not rise: the change removes runner minutes on content PRs, and the repository is
    public.
  - The constitution is not amended.

  Verdict: **MAJOR**. Don's approval is needed, with no auto-merge.
- **IV. First-Party Before Custom:** the run extends existing tested code rather than adding a
  tool.
  - The first-party option considered is the GitHub Actions `paths` / `paths-ignore` workflow
    filter. It falls short for three reasons:
    - it skips whole workflows, not one step;
    - a required check in a path-filtered workflow stays pending;
    - `workflows.test.ts` already forbids it.
  - Third-party path-filter actions would add a dependency (major) for what 30 tested lines do.
  - Step-level `if:` on a job output, Vitest's CLI file filter and pnpm scripts are all
    first-party.
  - No Astro usage changes, so the Astro Docs MCP is not needed.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** strengthened. Content PRs (the files Principle VI governs) get a
  cheaper gate with the same real-content checks.
- **VII. Private Data:** unaffected. There is no new secret, and ci.yml still references only
  `GITHUB_TOKEN`.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected or lower (fewer runner minutes; $0 on a public repository).
- **X. Accessible, Fast and Private:** the a11y, budget and visual layers run unchanged on
  every tier except skip-safe.
- **XI. Spec Kit Workflow:** the chore pipeline, on a `chore/` branch, with the plan in
  `.specify/chores/verify-gate-phase-4/`.

## Design decisions (made in this plan)

**The content-only tier.** A path is content-only when all of these hold:

- it passes the same safety checks as `isSkipSafe`: no `..`, no leading `/`, no `\`;
- it matches either of these, exported as constants:
  - `CONTENT_FILE = /^src\/content\/(pages|posts|projects)\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.mdx$/`
  - `CONTENT_IMAGE = /^src\/content\/(pages|posts|projects)\/images\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(avif|gif|jpe?g|mp4|png|svg|webm|webp)$/`

Everything else fails closed. That includes:

- `src/content/schemas/**` and `src/content.config.ts`;
- `.md` posts, which are a build error by design;
- any other extension or directory;
- `public/**`;
- names with spaces or other characters.

A deleted or renamed content file is still content-only, because `--no-renames` lists both
paths and each is checked.

**Decision order in `decide()`:**

1. The event is not `pull_request`: `{ full: true, contentOnly: false }`.
2. The diff is null or empty after trimming: `{ full: true, contentOnly: false }`.
3. Every file is skip-safe: `{ full: false, contentOnly: false }`. This is unchanged.
4. Every file is skip-safe or content-only: `{ full: true, contentOnly: true }`. The reason
   reads `content-only change (<n> file(s)), running the build tests that read real content only`.
5. Otherwise: `{ full: true, contentOnly: false }`, and the reason names the first file that
   is neither.

Invariant: `contentOnly` implies `full`.

**Outputs.** The two lines are `full=true|false` and `content_only=true|false`. The job output
is named `content_only`, an underscore name, so `needs.changes.outputs.content_only` needs no
bracket syntax.

**Wiring in `build-tests`.** The two steps use complementary conditions on one literal:

- `if: needs.changes.outputs.content_only != 'true'` on `pnpm run test:build`;
- `if: needs.changes.outputs.content_only == 'true'` on `pnpm run test:build:content`.

GitHub compares strings case-insensitively, and the two operators are exact complements, so for
any value (unset, empty, garbled) exactly one step runs. Every value except `true` runs the full
`test:build` (fail closed). The job-level `if: needs.changes.outputs.full != 'false'` is
unchanged. On a content-only PR `full` is `true`, so `build-tests` runs and succeeds, and
`verify-needs.ts` needs no new rule.

**`test:build:content`.** The value is
`vitest run --project build tests/build/indexing.test.ts tests/build/local-site.test.ts`.
Vitest treats positional CLI arguments as file filters. This script is the single source of
truth for "build tests that read real content". The guard in W3 reads its file list from
`package.json`.

## Work items

### W1 Content-only tier in `scripts/ci/changed-paths.ts`

- [x] W1 done

**Files:** `scripts/ci/changed-paths.ts`, `tests/unit/ci/changed-paths.test.ts`.

**Test:** new-first unit tests in `changed-paths.test.ts`, seen to fail before the code
changes. The existing `isSkipSafe` lists and the drift guard stay as they are.
`src/content/pages/about.mdx` stays in `UNSAFE`, because it is still not skip-safe.

Code:

- Export `CONTENT_FILE` and `CONTENT_IMAGE` (see Design decisions) and
  `isContentOnly(path: string): boolean`.
- `ChangeDecision` gains `contentOnly: boolean`.
- `decide()` follows the five-step order above.
- `toOutput()` returns `` `full=${full}\ncontent_only=${contentOnly}\n` ``, using the strings
  `"true"` and `"false"`.
- `main()` logs `full=<x> content_only=<y>: <reason>`.
- Fix the stale comment in `main()`'s catch, phase 3 review finding L1. The new text: an unset
  output runs every check, and the `verify` aggregate fails closed on the missing `full`.
- Update the header comment to name the three tiers.

New and changed cases:

| Case | Expected |
|---|---|
| `isContentOnly` true: `src/content/pages/about.mdx`, `src/content/pages/legal/index.mdx`, `src/content/posts/starting-something-new.mdx`, `src/content/projects/focus-pocus.mdx`, `src/content/pages/images/about-feature.webp`, `src/content/posts/images/wayfinder-hero.jpg`, `src/content/posts/images/focus-pocus-hero.png`, `src/content/projects/images/focus-pocus/architecture.svg`, `src/content/projects/images/clip.webm` | true |
| `isContentOnly` false: `src/content/schemas/post.ts`, `src/content.config.ts`, `src/content/posts/x.md`, `src/content/pages/about.ts`, `src/content/pages/images/x.ts`, `src/content/pages/images/notes.txt`, `src/content/other/x.mdx`, `src/content/x.mdx`, `src/content/../pages/x.mdx`, `/src/content/pages/a.mdx`, `src\content\pages\a.mdx`, `src/content/pages/a b.mdx`, `public/og-default.png`, `src/pages/index.astro`, `tests/build/indexing.test.ts`, `CLAUDE.md` | false |
| PR, `["src/content/posts/starting-something-new.mdx"]` | `full: true, contentOnly: true` |
| PR, a content `.mdx`, a content image, `CLAUDE.md` and `.specify/chores/x/plan.md` | `full: true, contentOnly: true` |
| PR, a content `.mdx` plus `src/content/schemas/post.ts` | `full: true, contentOnly: false`, and the reason contains `src/content/schemas/post.ts` |
| PR, skip-safe files only | `full: false, contentOnly: false` (extend the existing case) |
| `push`, `workflow_dispatch` and `pull_request_target` with a content file | `full: true, contentOnly: false` |
| null, `[]` and `["", "  "]` | `contentOnly: false` (extend the existing fail-closed case) |
| Every decision in this describe | `!contentOnly \|\| full` |
| `toOutput` | `full=true\ncontent_only=false\n`, `full=false\ncontent_only=false\n`, `full=true\ncontent_only=true\n` (replaces the two one-line expectations) |

**Coverage mapping:** the existing `toOutput()` case changes from one line to two. The same
guarantee, that the `full` line is rendered, is still asserted as the first line of each
expected string.

No test literal may name a `.claude/`, `.specify/` or `specs/` path that is skip-safe, because
of the drift guard. `changed-paths.test.ts` is itself excluded from that scan, but keep the
practice.

### W2 Move `focus-pocus.test.ts` to the `unit` project

- [ ] W2 done

**Files:** `tests/build/focus-pocus.test.ts` (removed),
`tests/unit/content/focus-pocus.test.ts` (new).

**Test:** existing assertions, moved. Copy the file to `tests/unit/content/focus-pocus.test.ts`
and change `root` to `new URL("../../../", import.meta.url)`. Keep the header comment and add
one line: it moved from the build project because it reads files and builds nothing (issue
#26 phase 4). Run it with `pnpm exec vitest run --project unit tests/unit/content/focus-pocus.test.ts`
and see all 5 tests pass. Then delete the source, and confirm
`pnpm exec vitest run --project build tests/build/focus-pocus.test.ts` finds no file.

**Coverage mapping:**

| Source (`tests/build/focus-pocus.test.ts`) | Destination (`tests/unit/content/focus-pocus.test.ts`) |
|---|---|
| "exists, is published (draft: false) and has all seven chapters in order" | same title, same assertions |
| "marks every chapter as a draft" | same |
| "marks every placeholder visual with placeholder: true" | same |
| "has a stand-in address and chooses JXA behind an MCP server" | same |
| "has no file under src/components, layouts, pages, lib or styles, nor astro.config.mjs, that names focus-pocus" | same |

The `unit` project's include (`tests/unit/**`) picks the file up. `config-files.test.ts`'s check
that every test file is matched by exactly one project must stay green.

### W3 Scripts `test:build:content` and `verify:quick`, and the content-tier guard

- [ ] W3 done

**Files:** `package.json`, `tests/unit/site/config-files.test.ts`,
`tests/unit/ci/content-tier.test.ts` (new).

**Test:** unit over config, new-first. The new assertions fail before the scripts exist.

`package.json` scripts, added next to `test:build` and `verify`:

| Script | Value |
|---|---|
| `test:build:content` | `vitest run --project build tests/build/indexing.test.ts tests/build/local-site.test.ts` |
| `verify:quick` | `pnpm run lint:secrets && pnpm run lint && pnpm run typecheck && pnpm run test:unit && pnpm run test:worker && pnpm run build` |

`verify`, `test`, `test:build` and every other script stay unchanged.

In `config-files.test.ts`, "package.json scripts" describe:

- `it("adds test:build:content, running only the build tests that read real content")`:
  exact string.
- `it("adds verify:quick: the gate without the build-fixture tests and Playwright")`:
  - the exact string;
  - every `pnpm run <name>` in it is a defined script;
  - its `pnpm run` members are exactly `lint:secrets`, `lint`, `typecheck`, `test:unit`,
    `test:worker` and `build`: no `test` (which includes the build project), no `test:build`
    and no `test:e2e*`;
  - each member is also run by `verify`, directly (`lint:secrets`, `lint`, `typecheck`,
    `build`) or through `test`, whose value is `vitest run && pnpm run test:worker`
    (`test:unit` is the `unit` half of `vitest run`). Assert this from the script strings.
- The existing `verify` exact-string case and the Vitest project-coverage guard are unchanged.
  The guard reads only `test:unit` and `test:build`, so `test:build:content` does not disturb
  it.

New `tests/unit/ci/content-tier.test.ts` ("content-only tier guard"):

1. Parse the `tests/build/...` arguments of `pkg.scripts["test:build:content"]`. Expect at
   least one, each existing on disk, each ending in `.test.ts`, each under `tests/build/`.
2. Collect the real content entries by walking `src/content/{pages,posts,projects}` for
   `*.mdx`, skipping `images/`. Each entry's slug is its path relative to the collection
   directory, minus `.mdx`, with a trailing `/index` removed. Leave out the slug `index` (the
   home page): `index.html` is generic text in every build test. The home page's real-content
   assertions live in `indexing.test.ts`, which is in the list.
3. For every `tests/build/*.test.ts` **not** in the list, its text must not contain
   `` `${slug}.mdx` ``, `` `${slug}/index.html` `` or `` `/${slug}/` `` for any slug. On
   failure, name the file and the slug, with the message "add this file to test:build:content
   or stop naming real content".
4. A sanity case that the guard would catch something: the slug list is non-empty, and
   `indexing.test.ts` (in the list) does contain `/about/`.

Run before W3's script exists and see case 1 fail. After W2, cases 2 and 3 must pass on the
current tree. Before writing, grep `tests/build/*.test.ts` for the slugs. If any file outside
the list matches, stop and report it rather than widening the pattern rules. The planning grep
found matches only in `indexing.test.ts` and `local-site.test.ts`, plus `focus-pocus.test.ts`,
which W2 moves out.

The test file must not contain a quoted `.claude/`, `.specify/`, `specs/` or `CLAUDE.md`
literal (drift guard).

### W4 Wire the tier into `ci.yml` and its workflow tests

- [ ] W4 done

**Files:** `.github/workflows/ci.yml`, `tests/unit/ci/workflows.test.ts`.

**Test:** change the workflow tests first, see them fail on today's file, then edit the YAML.

YAML changes. Only these; the rest of the file is byte-identical:

```yaml
  changes:
    ...
    outputs:
      full: ${{ steps.changes.outputs.full }}
      content_only: ${{ steps.changes.outputs.content_only }}
```

```yaml
  build-tests:
    ...
      - name: Run the build tests
        if: needs.changes.outputs.content_only != 'true'
        run: pnpm run test:build

      - name: Run the build tests that read the real content
        if: needs.changes.outputs.content_only == 'true'
        run: pnpm run test:build:content
```

Test changes in `workflows.test.ts`, "change detection and job topology" describe:

- "detects changes in changes, after setup-node, and exposes the full output" is renamed to
  "...exposes the full and content_only outputs". It adds
  `toMatch(/^\s+content_only:\s*\$\{\{\s*steps\.changes\.outputs\.content_only\s*\}\}\s*$/m)`
  on the `changes` job. The existing `full` regex stays.
- New: `it("runs exactly one build-test step in build-tests, chosen by content_only and failing closed to test:build")`:
  - `stepBlock(buildTests, "run: pnpm run test:build\n")` contains
    `if: needs.changes.outputs.content_only != 'true'`;
  - `stepBlock(buildTests, "run: pnpm run test:build:content")` contains
    `if: needs.changes.outputs.content_only == 'true'`;
  - `runCount(contents, "pnpm run test:build:content")` is 1;
  - `count(contents, "needs.changes.outputs.content_only")` is 2, so no other job reads it;
  - neither `static` nor `e2e` contains `content_only`.
- "runs every verify member exactly once" is unchanged. `pnpm run test:build` stays a whole
  line once, in `build-tests`.
- "gates build-tests and e2e at job level on full != 'false'" and "makes verify the aggregate"
  are unchanged and must stay green.
- `tests/unit/ci/verify-needs.test.ts`, `tests/unit/setup/drift.test.ts` and
  `tests/unit/setup-check/checks/github-ci-workflow.test.ts` must stay green, unchanged.

**Coverage mapping:** no assertion is removed. The one renamed case keeps its assertions and
adds one.

### W5 `docs/testing.md`: the content-only tier and `verify:quick`

- [ ] W5 done

**Files:** `docs/testing.md`.

**Test:** no behaviour: n/a (documentation only; W1, W3 and W4 assert what it names).

Changes:

- **Intro:** add one sentence. Phase 4 of #26 added the content-only tier and `verify:quick`.
- **Layers table:**
  - the "Real `astro build`" row: say that `indexing.test.ts` also runs on content-only
    changes, through `pnpm run test:build:content`;
  - the "Unit and schema" row: no change. Its glob already covers the moved focus-pocus file.
- **CI jobs table:**
  - `changes`: "Always. Decides the tier: skip-safe, content-only or full, and writes the
    outputs `full` and `content_only`."
  - `build-tests`: scripts "`pnpm run test:build`; on a content-only change
    `pnpm run test:build:content` instead"; when it runs: "Unless the change is skip-safe."
  - The `static`, `e2e` and `verify` rows: unchanged.
- **New subsection "Change tiers"** under "CI jobs":
  - A table of the three tiers, with columns *what counts*, *what runs* and *what is skipped*:
    - skip-safe: the existing allowlist;
    - content-only: the two patterns in words; `.md`, schemas, `content.config.ts` and
      `public/` are not content-only;
    - full: everything else, every push to `main`, and any detection failure.
  - The fail-closed rule: anything unrecognised runs the full gate, and an unset `content_only`
    runs the full `test:build`.
  - **Coverage on a content-only change.** Each skipped file, and where its guarantee lives:

    | Skipped on content-only | Why the guarantee holds |
    |---|---|
    | `drafts.test.ts`, `blog-listing.test.ts`, `page-validation.test.ts`, `post-validation.test.ts`, `project-validation.test.ts` | They test the schema, loader, route and render machinery with fixture files. That machinery lives in `src/content/schemas/**`, `src/content.config.ts`, `src/lib/**`, components and pages. None of those is content-only, so a change to them runs the full gate. That the real content still builds is proven by `pnpm run build` in `e2e`. |
    | `fixture-site.test.ts` | Harness tests (`tests/build/fixture-site.ts`, not content-only). Its S2 sync of the real posts is covered by the real `pnpm run build` in `e2e`. |

  - The build tests that read real content by name are listed in `test:build:content`.
    `tests/unit/ci/content-tier.test.ts` fails when another build test names a real content
    entry.
  - Residual risk, stated plainly. Fixture builds copy the real `src/`, so real pages and
    projects are present in them. A content edit whose text collides with a fixture
    assertion's string would only show on the push run on `main`, which always runs the full
    gate.
- **The `verify` bullet** ("passes when every job succeeded, or when..."): add that on a
  content-only change `build-tests` runs and must succeed. Only the skip-safe tier skips jobs.
- **New subsection "Inner loop: `verify:quick`"** after "CI jobs":
  - what it runs (the exact members);
  - what it leaves out: the `build` Vitest project and every Playwright project;
  - that implement and fix subagents run it after a change, and that only the full
    `pnpm run verify` counts before a PR.
- **Build budget table:**
  - remove the `focus-pocus.test.ts` row (0 and 0). The totals stay 20 and 12;
  - add one sentence: on a content-only change the project runs only `indexing.test.ts` (2) and
    `local-site.test.ts` (5), which is 7 builds and 0 syncs;
  - note that `focus-pocus.test.ts` moved to `tests/unit/content/` in phase 4.

### W6 Pipeline wording: four skills, alignment test and CLAUDE.md list

- [ ] W6 done

**Files:**

- `.claude/skills/deliver/SKILL.md`, `.claude/skills/tweak/SKILL.md`,
  `.claude/skills/squash/SKILL.md` and `.claude/skills/chore/SKILL.md`;
- `tests/unit/setup/pipeline-verify-wording.test.ts` (new);
- `CLAUDE.md` (the "Orchestration skills" alignment list).

**Test:** new-first unit test, `pipeline-verify-wording.test.ts`, modelled on
`pipeline-pr-author.test.ts`. It uses the same `pipelines` list and a `skillText(name)` that
reads `` `../../../.claude/skills/${name}/SKILL.md` ``, with the names as quoted literals so the
drift guard expands to the four READ_BY_CHECKS files. It holds the two canonical texts below as
constants and flattens whitespace (`/\s+/g` to `" "`) on both sides. For each pipeline:

- the paragraph appears exactly once;
- the sentence appears exactly once;
- the text no longer contains `There is no scoped or tiered E2E in this project`.

An alignment describe asserts the same for all four together, in the style of the PR-author
test. A last case asserts that `package.json` defines `verify:quick`, so the wording cannot
name a missing script. See it fail before the skills change.
`tests/unit/setup/pipeline-pr-author.test.ts` must stay green: the PR author block is not
touched.

**Canonical paragraph P.** Paste it verbatim. Line wrapping may differ per file, because the
test flattens whitespace.

> **Inner loop and gate.** `pnpm run verify:quick` runs secret lint, lint, type check, the unit
> and component tests, the worker tests and the real `astro build`. It is the inner-loop check
> for implement and fix subagents. It leaves out the build-fixture tests and every Playwright
> project, so it never counts as the gate. The full `pnpm run verify` runs the whole gate
> (secret lint, lint, type check, unit, component, build-fixture and worker tests, build, and
> every Playwright project — E2E, accessibility, sections, performance budget and visual), and
> it is the only check that counts before a PR. There is no scoped or tiered local gate: a
> `src/` change means the whole suite runs again. CI runs the same gate as parallel jobs and
> narrows it only by the changed paths, as `docs/testing.md` describes.

**Canonical sentence S:**

> Then run `pnpm run verify:quick` under the perl alarm as the inner-loop check; only the full
> `pnpm run verify`, which the orchestrator runs before the PR, counts as the gate.

Placement:

| Skill | P goes | S goes |
|---|---|---|
| `chore` | `## Verify`: replace the paragraph "There is no scoped or tiered E2E in this project: ... runs again." with P. Keep the following sentence "A chore that changes the gate itself still proves itself with the gate as it is **after** the change." as its own sentence after P. | Phase 3 step 2's quoted subagent prompt, right after "Run the targeted vitest files or Playwright projects for the changed paths, under the perl alarm." |
| `tweak` | `## Verify`: replace the "There is no scoped or tiered E2E..." paragraph with P. | Phase 5 `implement` table row, after "then implement until they pass." |
| `squash` | `## Verify`: replace the "There is no scoped or tiered E2E..." paragraph with P. | Phase 3 `fix` table row, after "Run the targeted vitest files or Playwright specs for the changed paths." |
| `deliver` | "Long-running suites" list: add P as a new bullet (`- ` + P) right after the E2E bullet. Shorten that E2E bullet's last sentence to "There are no device tiers." (drop "; a `src/` change simply means the whole suite runs again", which P now says). | Phase 7 step 2's quoted subagent prompt, right after "then implement until they pass." |

S contains no `|` and no `"`, so it is safe inside the table rows and the quoted prompts. Do
not touch the "Local toolchain" sections, the release-gate bullets, the pre-PR pause, the
`[PREVIEW-CHECK]` wording, the visual-baselines step or the PR author block.

`CLAUDE.md`, "Orchestration skills": add one bullet to the "A change to any of these goes into
all four together" list:

> - the "Inner loop and gate" paragraph and the `verify:quick` sentence in the implement or fix
>   phase (a unit test checks both are identical in all four).

## Docs citations (Principle IV)

GitHub Actions (docs.github.com):

- Job outputs from a step's `GITHUB_OUTPUT`, several outputs per job, read as
  `needs.<job_id>.outputs.<name>`:
  https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs
  and https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idoutputs
- Setting an output (`echo "name=value" >> "$GITHUB_OUTPUT"`; the script appends the same
  `name=value` lines):
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-an-output-parameter
- Step-level conditions, which imply `success()`:
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsif
- Expression operators `==` and `!=`; GitHub compares strings case-insensitively. That is why
  the plan uses exact complements on one literal:
  https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#operators
- The `needs` context:
  https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context
- The first-party alternative considered and rejected, `on.pull_request.paths` /
  `paths-ignore`:
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore
  Required checks in a path-skipped workflow stay pending:
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks#handling-skipped-but-required-checks

Vitest 5 (vitest.dev):

- Positional CLI arguments filter test files, combined with `--project`:
  https://vitest.dev/guide/filtering#cli and https://vitest.dev/guide/cli#project

pnpm (pnpm.io):

- `pnpm run`, and scripts that call other scripts with `&&`: https://pnpm.io/cli/run

Git: `git diff --name-only --no-renames` lists both sides of a rename. This is unchanged.
https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---no-renames

## Risks

- **Small payoff.** On a content-only PR, `e2e` stays the long pole at about 7 min, so wall
  time does not change. `build-tests` still runs `local-site.test.ts`'s 5 serial builds. The
  win is runner minutes and a smaller flake surface. This is stated in Acceptance; the named
  follow-up (fixture pages in `local-site.test.ts`) is the next lever.
- **A real-content build assertion escapes the guard.** The guard matches slug literals. A
  dynamic read, like `fixture-site.test.ts`'s `realPostNames`, escapes it. That one is
  harness-only and is documented in W5. A future dynamic real-content read in a fixture file
  would only fail on the `main` push run, which runs the full gate. Mitigation: the docs rule
  that real-content build assertions belong in `test:build:content`.
- **Fixture builds include the real pages and projects** (the harness copies `src/`). A content
  edit whose text collides with a fixture assertion's string surfaces only on `main`. This is
  accepted and documented. Such a collision is a test-isolation flaw to fix, not a gate gap
  for the real content.
- **Case-insensitive expressions.** `TRUE` equals `true` in Actions. The steps use exact
  complements, so exactly one runs for any value. The script only writes lower case.
- **A wrong tier pattern lets a machinery file through.** The patterns are anchored, admit
  only `.mdx` and media extensions under the three collection folders, and are unit-tested
  against schemas, the content config, `.ts` and `.txt` neighbours and path tricks.
- **`verify:quick` mistaken for the gate.** The wording says it never counts. The Verify
  sections still require the full `pnpm run verify`, and CI is unchanged for non-content PRs.
- **Editing four SKILL.md files runs the full gate**, because they are in READ_BY_CHECKS. This
  PR runs the full gate anyway.
- **Drift guard.** New tests must not embed skip-safe `.claude/`, `.specify/`, `specs/` or
  `CLAUDE.md` literals. W6's test uses the same placeholder pattern as the PR-author test.

## [PREVIEW-CHECK] items

- `[PREVIEW-CHECK]` On this PR's CI run (full tier), `verify` is green. Wall time from the first
  job's start to `verify`'s completion is ≤ 10 min. Record each job against the before-table.
- `[PREVIEW-CHECK]` Follow-up, after merge: on the first content-only PR, `changes` logs
  `content_only=true`, `build-tests` runs only the `test:build:content` step, and `verify` is
  green. Record the `build-tests` duration against 6 min 33 s.
