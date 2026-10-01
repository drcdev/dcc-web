# Chore plan: verify-gate-phase-2 (issue #26, phases 1 and 2)

Branch: `chore/verify-gate-phase-2`. Part of https://github.com/drcdev/dcc-web/issues/26.

## Goal

The `verify` gate spends most of its time in the vitest `build` project: about 150 Astro runs,
most of them a full `astro build` of a copied fixture site to prove one error message or one
page. This run delivers **phases 1 and 2** of the plan in
[issue #26](https://github.com/drcdev/dcc-web/issues/26). Phase 1 is `docs/testing.md`: the
layer table, the rule for where a test goes, and where every row of the `build-errors.md`
contracts is asserted. Phase 2 cuts the build layer down under the two ticked decisions:
**D1** moves each contract row to the cheapest layer that can observe it (schema and
check-function unit tests) and keeps build-level runs only where the real build is the only
thing that can show the behaviour. **D2** builds each fixture set once per file in `beforeAll`
and runs many assertions against it, merges files that build the same set, and uses `sync`
mode where no HTML is read. No user-visible behaviour changes: only `tests/`, `docs/`, test
fixtures and the intro lines of the four contract files change. `src/` is not touched.

## Acceptance

**Before (sources):**

- Issue #26 figures: vitest stage **23.7 min** CI wall; build project **4162 CPU-s**; **~150**
  Astro runs.
- Latest green CI `verify` job: **20 min 02 s**, run 36911846057 (workflow "CI").
- Recount for this plan (static call sites plus `it.each` / `describe.each` / per-`it` helper
  expansion): **144 runs = 132 full builds + 12 syncs** (blog-listing 2, code-highlighting 4,
  every-block 1, fixture-site.test 2 builds + 12 syncs, indexing 2 real `astro build`s,
  launch-paths 1, one-file-page 3, one-file-post 2, one-file-project 2, page-validation 19,
  post-summaries 5, post-validation 38, production-drafts 4, project-clips 3, project-csp 1,
  project-drafts 4, project-routes 3, project-story 3, project-validation 32).
- Local build-project time: not measured. The machine was under heavy load (load average
  above 40). The review phase times it.

**Targets (each checked by the review phase):**

1. **≤ 20 full builds** across the whole `build` project. Count each `buildFixtureSite(` call
   in `mode: "build"` (the default) and each real `astro build` in `indexing.test.ts`, with
   `it.each` / `describe.each` rows and per-`it` helper calls expanded. Planned: **19** (table
   under W6). `sync` runs are counted separately and capped at **≤ 12** (planned 12). A sync
   took about 1.2 s each in a probe run during planning, against tens of seconds for a build.
2. **Every contract row is asserted somewhere.** That covers rows 1–17 (003), P1–P22 (008),
   01–32 (009) and P23–P26 plus changed P6/P21 and the three must-build cases (013). Each row
   names its file, its phrase and the layer in the mapping table in `docs/testing.md`. Each
   row appears exactly once as the primary assertion in a unit, component, sync or build test,
   and the test title or a comment carries the row id so a grep for the row id finds it.
3. **Vitest stage well under 23.7 min** on the PR's CI `verify` run. The aim is ≤ 12 min, and
   it must not be above the before figure. The review phase records CI wall time, and the
   local build-project time when the machine allows it.
4. `pnpm run verify` green (Principle II). No assertion is weakened: every removed assertion
   is in a mapping below.

## Scope

**In:**

- `docs/testing.md` (new): the layer table, the placement rule, the contract-row mapping and the
  build/sync budget table.
- `tests/build/**`: rewrite the three validation files, merge files that build the same
  fixture set into shared-build files, and delete files that end up empty.
- `tests/unit/content/**`: add the message assertions that the moved rows need, plus a few new
  unit cases (listed per work item). `tests/unit/site/**`: one config assertion (W5).
- `tests/fixtures/**`: delete broken fixtures that no test references any more, and add the
  combined valid fixture lists.
- **Contract intro lines: in scope (decided: yes).** Each intro line names a
  `tests/build/*-validation.test.ts` path as the home of every row (003 line 8, 008 line 8,
  009 line 6, 013 line 4). Each becomes one sentence that points at the mapping in
  `docs/testing.md`. It is a one-line edit per contract and keeps traceability honest.
  `specs/**/*.md` edits are skip-safe for the drift guard, so they do not change the gate. The
  rows themselves (mistake, detector, message) are not edited.
- Stale comment references to deleted test files: `docs/design-source.md:76`,
  `tests/component/project/Visual.test.ts:31`. Comments only. `scripts/build-fixture-site.ts:150`
  still names `project-validation.test.ts`, which keeps existing, so it is left alone.

**Out (later phases of #26 and follow-ups for the PR body):**

- D3–D8: e2e/a11y/visual trimming, CI job split or sharding, vitest pool or worker tuning,
  the Playwright budget, and the governance cross-reference (D7). The constitution is **not**
  edited. A cross-reference from Principle I to `docs/testing.md`, and naming the build layer
  there, is deferred to D7.
- No `vitest.config.ts` change. No `globalSetup` build sharing (considered under W4 and not
  used). No `pool`, `maxWorkers` or `fileParallelism` tuning.
- Follow-up, existing gap: contract 009 row 17 says "frontmatter or body". Only the frontmatter
  case has ever been tested. A missing body image in a project is Astro's MDX image import, the
  same mechanism as P22. This run does not add it; the PR body names it.
- Follow-up: a guard test that keeps the build count at or under budget (for example a unit
  test that counts `buildFixtureSite(` call sites) belongs with D7.

## Constitution Check

- **I. Test-First:** every work item names its test. Moved rows gain their destination
  assertion before the source is removed (add, run, then delete). No production code changes.
- **II. Automated Release Gate:** no check is weakened. Every removed build assertion has a
  row-level mapping below, and `pnpm run verify` must be green.
- **III. Human Review for Major Changes:** none of the criteria fire. No dependency, no contact
  data, no design or layout change, no cost increase. No CI, deploy or infrastructure
  configuration changes: `.github/`, `wrangler` config and `vitest.config.ts` are untouched.
  The constitution is not amended. Verdict: **not major**.
- **IV. First-Party Before Custom:** uses Astro's own `sync()` / `build()` programmatic API
  (already in `run-astro.ts`) and Vitest's own `beforeAll(fn, timeout)`, `describe`, `test.each`
  and file-level sequencing. No custom runner or cache. Docs are cited below.
- **V. Static by Default:** unaffected (no `src/` change).
- **VI. Content as Files:** strengthened in traceability. Every invalid-content error still
  fails the build, and the mapping shows where each one is proven.
- **VII. Private Data:** unaffected. The project canary check (no environment value in a
  message) is kept on every remaining project failure run.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected (CI minutes go down).
- **X. Accessible, Fast and Private:** unaffected (a11y, visual and budget layers untouched).
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/verify-gate-phase-2/`.

## Placement rule used by every work item

For each row or claim:

1. **Logic** (does this input produce this message?) goes in the unit test of the function or
   schema that decides it. These are plain functions under `src/lib/content/`,
   `src/content/schemas/` and `src/components/sections/validate.ts`, or a component test when
   the check lives in a component.
2. **Wiring** (is that function actually run by Astro on real files, and does its message
   reach the build output with the file name?) gets one failing run per distinct call site:
   - **`sync`** for call sites in `src/content.config.ts`: the collection schema and the glob
     loader's `generateId`. During planning, a probe confirmed that `sync` runs `generateId`.
     Page row 17, page row 6, post P4 and project 27 each failed under `sync` with the
     `Page file` / `Post file` / `Project file` message in about 1.2 s.
   - **`build`** for call sites in route `getStaticPaths()` (`src/pages/[...slug].astro`,
     `src/pages/projects/[slug].astro`, `src/lib/posts.ts#getCheckedPosts`), in render-time
     component checks, and for errors raised by Astro itself (MDX body image import). The
     same probe showed that post P13 and project row 09 **pass** `sync`. They need a build.
3. A row whose function is wired at a call site already proven by another row's run is mapped
   to that run. The run proves the call site; the unit test proves the row.
4. The build stops at the first error, so each failing run holds exactly one broken file.

Message format at the unit layer: Astro formats a schema failure as
`**<collection> → <id>** data does not match collection schema.` followed by one line per
issue, `  **<path.join(".")>**: <message>` (`InvalidContentEntryDataError` in
`node_modules/astro/dist/core/errors/errors-data.js`). Astro's `errorMap` is not a public
export, so unit tests format zod's issues the same way, `${path.join(".")}: ${message}`, and
assert the row's phrase against that text. The file name in a schema error comes from Astro
and is proven once per collection by its schema sync run.

## Work items

### W1 Page validation: unit moves and wiring runs

- [x] W1 done

**Files:** `tests/build/page-validation.test.ts` (rewrite),
`tests/unit/content/page-schema.test.ts`, `tests/unit/content/address.test.ts`, and unused
fixtures in `tests/fixtures/pages/broken/` (delete those no test references afterwards).

**Test:** new-first unit assertions, then the rewritten build file (existing behaviour, which
must stay green). Run `vitest run --project unit tests/unit/content/page-schema.test.ts
tests/unit/content/address.test.ts` and then the page-validation file on its own.

**Unit additions:**

- `page-schema.test.ts`: add an `issueText()` helper as described above, and one case per
  schema row asserting the phrase:
  - row 1: `title`
  - row 2: `description`
  - row 3: `position` (for `nav.position: "second"`)
  - row 4: `titel` (exists)
  - row 5: `alt`, for both `image` and `featureImage`
  Titles carry "row N".
- `address.test.ts`: a new case, "page addresses against the real route files (row 14,
  /projects/ prefix)". It lists `src/pages/` with `fs.globSync` / `readdirSync` using the same
  pattern as the route's `import.meta.glob("./**/*.{astro,md,mdx,ts,js}")`, minus
  `[...slug].astro`, and asserts that:
  - `assertUniqueAddresses` rejects `404.mdx` naming `src/pages/404.astro` and `/404/`;
  - it rejects `projects/workshops.mdx` naming `src/pages/projects/[slug].astro`;
  - it accepts the real `src/content/pages/` list.
  This replaces the build-level proof that the real route set is the one checked.

**New `page-validation.test.ts`:** 3 syncs and 4 builds, one broken file each. Each `it` names
the rows it proves at this layer.

| Run | Mode | Fixture | Proves (call site) | Asserts |
|---|---|---|---|---|
| a | sync | broken/01-no-title.mdx | pages schema wired, Astro names the file (row 1) | `01-no-title`, `title` |
| b | sync | broken/06-missing-image-frontmatter.mdx | `generateId` → `assertFrontmatterImagesExist` (row 6) | `Page file`, `06-missing-image-frontmatter`, `does-not-exist.png` |
| c | sync | broken/17-bad-file-name.mdx → `About_Me.mdx` | `generateId` → `idFromPath` (row 17) | `About_Me.mdx`, "lower-case letters, digits and hyphens" |
| d | build | broken/07-missing-image-body.mdx | Astro MDX body image import (row 7) | `does-not-exist.png` |
| e | build | broken/13 a+b → `x.mdx`, `x/index.mdx` | route `assertUniqueAddresses` over the file-system page list (row 13) | `x.mdx`, `x/index.mdx`, `/x/` |
| f | build | broken/16-level-one-heading.mdx | route `validatePageBody` (row 16) | `Page file`, `16-level-one-heading`, `use ##` |
| g | build | broken/11-section-missing-prop.mdx | section `checkSection` + `Astro.locals.pageFile` (row 11) | `11-section-missing-prop`, `CallToAction`, `href` |

**Coverage mapping (removed build case → where it lives now):**

| Row | Removed from build | Now asserted in |
|---|---|---|
| 1 | build `01-no-title` | unit page-schema "row 1" (key) + sync a (file) |
| 2 | build `02-no-description` | unit page-schema "row 2"; file name via sync a (same schema call site) |
| 3 | build `03-wrong-type` | unit page-schema "row 3" (`position`); file via sync a |
| 4 | build `04-misspelled-key` | unit page-schema "names the misspelled key" (`titel`); file via sync a |
| 5 | build `05-image-no-alt` | unit page-schema "row 5" (`alt`); file via sync a |
| 6 | build | unit images.test "names the page file and the image path" + sync b |
| 7 | build | build d (kept: Astro-only behaviour) |
| 8 | build `08-empty-alt` | unit body.test "rejects an image with empty alt text" (FILE, `alt text`); call site via build f |
| 9 | build `09-empty-body` | unit body.test "rejects an empty body" (FILE, `no content`); call site via build f |
| 10 | build `10-unknown-section` | unit body.test "rejects an unknown capitalised tag…" (FILE, `Callout`, every section name); call site via build f |
| 11 | build | component CallToAction.test "throws naming the section and the missing or invalid prop" + build g (page file) |
| 12 | build `12-image-section-no-image` | component sections/Images.test "throws naming the section when there is no image" (section, `image`) + unit section-schemas "says an image is needed"; page-file wiring is the same `checkSection` path as build g |
| 13 (about.md + about.mdx) | build | unit address.test "fails for two page files with the same address" (both files, `/about/`) + build e |
| 13 (x + x/index) | build | build e |
| 14 (route) | build `404.mdx` | unit address.test "fails for a page against a route file" + new unit over real route files |
| 14 (reserved) | build with `futureDestinations` override | unit address.test "fails for reserved address %s" (file, `reserved`, address); call site via build e. The real reserved list is empty, so nothing is lost. |
| 15 | build `15-nav-position-a/b` | unit navigation.test "fails when two pages use the same position…" (both files, `2`); wiring via the W4 local-site assertion that the header holds the page-sourced About entry |
| 16 | build | build f |
| 17 | build | unit address.test `addressFromPath` it.each (path, phrase) + sync c |

### W2 Post validation: unit moves and wiring runs

- [ ] W2 done

**Files:** `tests/build/post-validation.test.ts` (rewrite),
`tests/unit/content/post-schema.test.ts`, and unused fixtures in `tests/fixtures/posts/broken/`.

**Test:** new-first unit assertions, then the rewritten build file. Run the post-schema unit
file, then post-validation on its own.

**Unit additions (`post-schema.test.ts`):**

- P4: an `it.each` over the four contract inputs (`next tuesday`, `"2026-08-27"`,
  `27/08/2026`, `2026-02-30`) through `assertPostDates`. It asserts the file, `date` and the
  value as found: `next tuesday`, `quotes`, `27/08/2026`, `2026-02-30`. These are the phrases
  the build cases asserted. Today the unit test checks file, `date` and `YYYY-MM-DD` but not
  the value found.
- P8: confirm the case asserts both `alt` and `alt text` in the issue text. Add `alt` if it is
  missing.
- Keep every existing P1–P11 and P23–P26 assertion. Add the row id to titles where it is
  missing.

**New `post-validation.test.ts`:** 4 syncs and 3 builds.

| Run | Mode | Fixture | Proves | Asserts |
|---|---|---|---|---|
| a | sync | p23-both-series as `draft-both.mdx` with `draft: true` (existing FR-012a case) | posts schema wired for drafts too; Astro names the file (P23, FR-012a) | `draft-both`, `one series` |
| b | sync | broken/p04-date-impossible.mdx | `generateId` → `assertPostDates` (P4) | `p04-date-impossible`, `date`, `2026-02-30` |
| c | sync | broken/p09-image-missing.mdx | `generateId` → `assertFrontmatterImagesExist(…, "post")` (P9) | `Post file`, `p09-image-missing`, `./images/missing.png` |
| d | sync | p21-removed-topic.mdx with the `topics.ts` override | P21 (changed): a removed controlled id is accepted as free-form | `ok === true` |
| e | build | broken/p22-body-image-missing.mdx | Astro MDX body image import (P22) | `p22-body-image-missing`, `./images/missing.png` |
| f | build | broken/p13-markdown-file.md | `getCheckedPosts` → `assertPostFiles` (P13) | `Post file`, `p13-markdown-file.md`, `rename it to .mdx` |
| g | build | broken/p20-empty-body.mdx | `getCheckedPosts` → `validatePageBody(…, "post")` (P20) | `Post file`, `p20-empty-body`, `no content` |

P21 under `sync` instead of a build: the changed row's guarantee is that validation accepts
the id. Rendering a free-form topic page is proven by blog-listing "builds a plain banner and
listing for a free-form id named by a visible post". The "things that are not errors" case
(unknown-language) and the three must-build cases move to the W4 local site.

**Coverage mapping:**

| Row | Removed from build | Now asserted in |
|---|---|---|
| P1 | build | unit post-schema "rejects a missing, empty or blank %s, naming the key" (title); file via sync a |
| P2 | build | same it.each (summary); file via sync a |
| P3 | build | unit "rejects a missing date, naming date"; file via sync a |
| P4 ×4 | 4 builds | new unit it.each (file, `date`, found value) + sync b |
| P5 ×2 | 2 builds | unit "rejects a missing or empty topics list, naming topics"; file via sync a |
| P6 | build | unit "rejects a near-miss of a controlled id, naming it, the intended id and every controlled id in list order (P6)"; file via sync a |
| P7 | build | unit "rejects the same topic twice, naming topics"; file via sync a |
| P8 | build | unit "rejects a feature image without alt…, saying alt text"; file via sync a |
| P9 | build | unit images.test "names the post file … (P9)" + sync c |
| P10 | build | unit "rejects updated earlier than date, naming updated"; file via sync a |
| P11 | build | unit "rejects an unknown or misspelled setting, naming it"; file via sync a |
| P12 | build | unit body.test "keeps the same rules: … alt text" + "starts every message with Post file and names the file"; call site via build g |
| P13 | build | unit post-address "(P13)" + build f |
| P14 | build | unit post-address "(P14)"; call site via build f |
| P15 | build | unit post-address it.each "(P15)"; call site via build f |
| P16 ×2 | 2 builds | unit post-address it.each "(P16)" (file, address, `reserved`); call site via build f |
| P17 | build | unit post-address "(P17)" (both files, address); call site via build f |
| P18 | build | unit body.test post "use ##"; call site via build g |
| P19 | build | unit body.test post "unknown section with the list" (`Callout`, every section name); call site via build g |
| P20 | build | unit body.test post "says the post has no content" + build g |
| P21 (changed) | build | sync d |
| P22 | build | build e (kept) |
| P23 | build | unit "(P23)" + sync a |
| P24 | build | unit it.each "(P24)" (id, `Did you mean`); file via sync a |
| P25 ×2 | 2 builds | unit post-address it.each "(P25)"; call site via build f |
| P26 ×2 | 2 builds | unit "(P26)" (both rules); file via sync a |
| FR-012a drafts | build | sync a |
| unknown language, must-build ×3 | 4 builds | W4 local site (same assertions) |

### W3 Project validation: unit moves and wiring runs; absorb project failure builds

- [ ] W3 done

**Files:** `tests/build/project-validation.test.ts` (rewrite);
`tests/build/project-routes.test.ts` (delete);
`tests/build/project-story.test.ts`, `tests/build/project-drafts.test.ts` and
`tests/build/project-clips.test.ts` (remove only their "broken" describes, since W4 and W5
move the rest); `tests/unit/content/project-schema.test.ts`,
`tests/unit/content/project-body.test.ts`, `tests/unit/content/project-clips.test.ts`; unused
fixtures in `tests/fixtures/projects/broken/`.

**Test:** new-first unit assertions, then the rewritten build file. Run the three unit files,
then project-validation on its own.

**Unit additions:**

- `project-schema.test.ts`: an `issueText()` helper and one case per schema row asserting the
  contract phrase. Titles carry "row NN".
  - row 01: `title`
  - row 02: `problem`
  - row 03: `status` plus `shipped`, `experiment`, `in-progress`
  - row 04: `themes`, for none, more than four and a duplicate
  - row 05: `visual` / `alt`
  - row 06: `order`, for `first`, 0, -1 and 1.5
  - row 07: `titel`
  - row 08: `problem` plus "one sentence of at most 140 characters"
  - row 12: "exactly one option must be chosen"
  - row 13: `reason`
  - row 14: the option id and the constraint id
  - row 15: `comparison`, for no options and for no constraints
  - row 18: `alt` / `description`
  - row 19: `description` on a clip
  - row 20: `href` plus `drc.dev`
  - row 21: `source` / `standIn.href` plus `https://`
  - row 22: "demo or standIn, not both"
  - row 31: `comparison` plus the id, for the unknown fit constraint `ghost`, a reason on an
    unchosen option and a duplicate id
  - row 32: `visuals` plus `Bad_Name`, the reserved `demo`, and a clip as the index visual
  Use the same inputs as the broken fixtures, so the asserted phrases match the deleted build
  cases.
- `project-body.test.ts`: an `it.each` over rows 09, 10, 11, 16, 23, 24, 25, 28, 29, 30
  (Invitation) and 30 (Demo). Each case asserts **both** `FILE` and the contract phrase:
  - row 09: `is missing the chapter` + `lessons`
  - row 10: `out of order` + the stage
  - row 11: `more than once` + the stage
  - row 16: `OptionComparison`
  - row 23: `<Timeline>` + every block name
  - row 24: `ghost`
  - row 25: `embed`
  - row 28: `use ### for headings`
  - row 29: `alt text`
  - row 30: `Invitation`, and `Demo` with `hasDemoLinks: true`
  Today only one case asserts `FILE`.
- `project-clips.test.ts` (unit, for `assertProjectImagesExist`): add "names the project file
  and the path of a missing image (row 17)" for `visual.src: ./images/nope.png`, asserting
  `Project file src/content/projects/p.mdx` and `./images/nope.png`.

**New `project-validation.test.ts`:** 3 syncs and 2 builds. Every run keeps
`env: { PROJECT_VALIDATION_CANARY }` and the assertion that the message does not contain the
canary.

| Run | Mode | Fixture | Proves | Asserts |
|---|---|---|---|---|
| a | sync, production env (`WORKERS_CI=1`, branch `main`) | draft.mdx with `status: nonsense` | projects schema wired for a draft; Astro names the file (row 03; project-drafts "invalid setting") | `draft`, `status`, `shipped`, `experiment`, `in-progress`, no canary |
| b | sync | broken/17-missing-image.mdx | `generateId` → `assertProjectImagesExist` (row 17, clip check of row 19) | `17-missing-image`, `./images/nope.png`, no canary |
| c | sync | broken/27-bad-file-name.mdx → `Bad Name.mdx` | `generateId` → `slugFromPath` (row 27, nested file) | `Bad Name.mdx`, "lower-case letters, digits and hyphens", no canary |
| d | build | broken/26-duplicate-slug.mdx → `x.mdx` + `x.md` | route `assertUniqueProjectFiles` (row 26) | `x.md`, `x.mdx`, `slug x`, no canary |
| e | build, production env | draft.mdx with `<Chapter stage="lessons">` → `stage="bogus"` | route `validateProjectBody` runs on drafts before the production filter (rows 09–11 call site, FR-073) | `draft`, `stage`, no canary |

**Coverage mapping:**

| Row / case | Removed from build | Now asserted in |
|---|---|---|
| 01–08, 12–15, 18, 20–22, 31, 32 | 1 build each | unit project-schema "row NN" (phrase) + sync a (file name and canary for the schema call site) |
| 09, 10, 11, 16, 23, 24, 25, 28, 29, 30 ×2 | 1 build each | unit project-body it.each (FILE + phrase) + build e (call site) |
| 17 | build | new unit project-clips "row 17" + sync b |
| 19 (description) | build | unit project-schema "row 19"; file via sync a |
| 19 (missing clip / over 5 MB) | project-clips.test "a broken clip" ×2 builds | unit project-clips "names the file and the path of a missing clip" / "…over 5 MB"; call site via sync b (same function) |
| 26 (x.md + x.mdx) | project-routes build | unit project-address "names both files when .md and .mdx share a slug" + build d |
| 26 (nested) | project-routes build | unit project-address "rejects a nested file" + sync c (same `slugFromPath` call in `generateId`) |
| 27 | build | unit project-address it.each + sync c |
| page under /projects/ | project-routes build | unit address.test "fails for a page file under the projects story route's prefix" + W1's new real-route-files unit; call site via W1 build e |
| project-story "a broken project body" (minimal, bogus stage) | build | unit project-body (stage) + build e |
| project-story / project-drafts "broken draft" ×2 | 2 builds | build e (production env: the stricter case) |
| project-drafts "invalid setting in a draft, production" | build | sync a (schema validation does not depend on env; env is still set) |
| canary (no env value in any message) | on 32 builds | on all 5 runs a–e |

### W4 Local fixture site: one shared default-env build set (D2)

- [ ] W4 done

**Files:** new `tests/build/local-site.test.ts`. Delete `one-file-page.test.ts`,
`one-file-post.test.ts`, `one-file-project.test.ts`, `code-highlighting.test.ts`,
`project-csp.test.ts`, `every-block.test.ts` and `project-story.test.ts` (its valid part),
moving every `it` across unchanged in substance. Also move the valid part of
`project-clips.test.ts` (including the no-build "committed clip fixture is tiny") and delete
that file. Move from `post-summaries.test.ts` the two default-env cases ("includes drafts and
reading time…", "sorts newest first"). Move from `post-validation.test.ts` the
"things that are not errors" and "posts that must build" describes. Move from
`production-drafts.test.ts` the `local` build's describe. Move from `fixture-site.test.ts` the
"does not leak WORKERS_CI" case.

**Test:** existing assertions must keep passing (`no new behaviour`). Run the new file on its
own, and also run each source file before deleting it to record a green baseline.

**Shared builds** (sequential in one `beforeAll(fn, 900_000)` at the top of the file;
`afterAll` cleans up):

- **L1** (default env). Pages: `workshops.mdx` and `../posts/valid/code-spike.mdx` →
  `code-spike.mdx`. Posts: `valid/published.mdx`, `valid/draft.mdx`, `valid/text-only.mdx`,
  `valid/unknown-language.mdx`, `valid/untagged.mdx`, `valid/free-form-only.mdx`,
  `valid/series-and-free-form.mdx`, and `published.mdx` → `future-post.mdx` dated
  `2099-01-01`. Projects: `minimal.mdx`, `every-setting.mdx`, `every-block.mdx`. Override:
  `src/pages/summaries.json.ts` (the post-summaries route). While L1 builds, the file sets
  `process.env.WORKERS_CI=1` and `WORKERS_CI_BRANCH=main` and restores them in `finally`. L1
  still showing the draft post and the `Draft` label then proves the harness does not leak the
  runner's environment (replaces fixture-site "does not leak").
- **L2**: L1 with `workshops.mdx` `replace: ["ordinary", "plain"]`. Used by "changes only its
  own HTML file when one word in it changes", which compares L1 with L2.
- **L3**: L1 plus `every-setting.mdx` → `brand-new.mdx`. Used by "publishes the story and lists
  it on the index, touching no other page", which compares L1 with L3. The expected changed
  set stays `projects/brand-new/index.html` and `projects/index.html`.
- **Code baseline**: `[code-spike]` with the `shikiConfig` line removed from `astro.config.mjs`.
  The CSP comparison now compares the baseline's `code-spike/index.html` with L1's.
- **Code broken colour**: `[code-spike]` with the `shiki-theme.ts` override. Asserts failure
  with `#0a0b0c`. Kept: whether a throwing transformer fails the build or is swallowed is only
  visible in a build. `shiki-classes.test.ts` covers the transformer logic.

**One added assertion** (the wiring for page row 15): L1's `workshops/index.html` header list
contains the `About` entry, which comes only from `src/content/pages/about.mdx`'s `nav`
setting, ordered between the fixed `Projects` and `Contact` entries.

**Builds: 5** (was one-file-page 3 + one-file-post 2 + one-file-project 2 +
code-highlighting 4 + project-csp 1 + every-block 1 + project-story valid 1 + project-clips
valid 1 + post-summaries 2 + post-validation valid 4 + production-drafts local 1 +
fixture-site leak 1 = 23).

**Coverage mapping:** every moved `it` keeps its assertions word for word, apart from swapping
its own result variable for L1/L2/L3. Two assertions read differently:

- one-file-page test 1 and the "first" build of test 2 are now both L1.
- code-highlighting's "configured" build is L1.

**Considered and not used:** Vitest `globalSetup` with `provide`/`inject` could share builds
across files without merging them. It needs a `vitest.config.ts` change and was not the ticked
option (D2: merge files). Merging keeps the config untouched.

### W5 Environment builds: drafts, blog listing, indexing, harness (D2)

- [ ] W5 done

**Files:** new `tests/build/drafts.test.ts`, merging what is left of `production-drafts.test.ts`
with the valid part of `project-drafts.test.ts`; delete both sources.
`tests/build/blog-listing.test.ts` (drop `previewSite`; add the production summaries case).
Delete `tests/build/post-summaries.test.ts` once its last three cases have moved.
`tests/build/indexing.test.ts` (absorbs `launch-paths.test.ts`; delete that file).
`tests/build/fixture-site.test.ts` (D2: two syncs). `tests/unit/site/build-mode.test.ts`, or
`astro-config.test.ts` if that is where env fields are already checked: add one unit-over-config
assertion.

**Test:** existing assertions keep passing. The one new unit assertion is written first. Run
each changed file on its own.

**Builds:**

- `drafts.test.ts` (`beforeAll(fn, 900_000)`, 2 builds):
  - **production** (`WORKERS_CI=1`, `main`): posts `[valid/draft.mdx]`; projects `minimal.mdx`
    and `draftWithAssets`; override `summaries.json.ts`.
  - **preview** (`WORKERS_CI=1`, `some-branch`): posts `[valid/published.mdx, valid/draft.mdx]`;
    projects the same; override `summaries.json.ts`.
- `blog-listing.test.ts`: 1 build (the `site`, production), with `summaries.json.ts` added.
- `indexing.test.ts`: 2 real builds (unchanged). launch-paths' three cases run against the
  main-branch build's `dist` (`sitemap-0.xml`) and the repository files.
- `fixture-site.test.ts`: 2 syncs.
  - **S1**: page `workshops.mdx` → `legal/index.mdx` and `workshops.mdx`; posts
    `valid/minimal.mdx` and a `to`-renamed post with a `replace`; projects `minimal.mdx`,
    `every-setting.mdx`, `draft.mdx`; default `realPosts`. It asserts every former placement,
    copy and replace case against S1, then `cleanup()` removes the root.
  - **S2**: `realPosts: true`.

**Coverage mapping:**

| Removed | Now asserted in |
|---|---|
| production-drafts `noBranch` build (describe.each row: 9 HTML assertions) | Logic: unit `tests/unit/site/build-mode.test.ts` "fails safe: leaves drafts out when Workers Builds gives no branch" and `tests/unit/content/build-mode.test.ts` "fails safe: is true when Workers Builds gives no branch". Wiring: the drafts **production** build runs the same `includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH })` call. The one build-only factor, `astro:env` handing over `undefined` for a missing branch, gets a **new** unit-over-config assertion that `astro.config.mjs` declares `WORKERS_CI_BRANCH` as `envField.string({ … optional: true })` with no `default`. |
| production-drafts `local` build | W4 L1 |
| post-summaries production | blog-listing site + summaries route: the visible slugs equal the 16 visible posts newest first; no `draft: true`; `free-form-draft` and every `sample-*` draft absent (same strength as the old exact `["published", "text-only"]`) |
| post-summaries preview | drafts preview: `some(p => p.draft)` and `draft` present |
| post-summaries noBranch | unit (as for noBranch above) + drafts production: summaries `[]` while `valid/draft.mdx` is in the input |
| blog-listing `previewSite` "holds no draft on a preview build, and is a valid empty channel when nothing is published" | drafts preview: the feed holds `/writing/published/` and not `/writing/draft/` or `sample-*`; `writing/index.html` contains `Draft`. drafts production: the feed has 0 items and matches the closed `<channel>…</channel></rss>` shape. |
| launch-paths fixture build | indexing main-branch build (real repository content in the production environment) |
| fixture-site 12 syncs | S1/S2 (placement, copy, replace, real-post drop and keep, cleanup) |
| fixture-site "reports a broken page/post/project file…" ×3 syncs | W1 sync a, W2 sync a, W3 sync a (same harness path, same assertions: file and key) |
| fixture-site "sets environment variables (WORKERS_CI)" build | drafts production: `sitemap-0.xml` contains `https://doncoleman.ca/`, and drafts are hidden |
| fixture-site "does not leak WORKERS_CI" build | W4 L1 (env set during the build; drafts still shown) |
| project-drafts production / preview builds | drafts production / preview (same assertions; posts added to those builds are disjoint by title, slug and file name) |

**Budget after W5:** 19 builds and 12 syncs (table in W6).

### W6 `docs/testing.md`, contract cites, stale references, budget check

- [ ] W6 done

**Files:** new `docs/testing.md`; the intro line of `specs/003-standalone-pages/contracts/build-errors.md`
(line 8), `specs/008-blog/contracts/build-errors.md` (line 8),
`specs/009-portfolio/contracts/build-errors.md` (line 6) and
`specs/013-writing-series/contracts/build-errors.md` (line 4); `docs/design-source.md:76`;
`tests/component/project/Visual.test.ts:31` (comment).

**Test:** `no behaviour: n/a (documentation and comments)`. Checks run by the item:

- every row id in the four contracts appears in the `docs/testing.md` mapping, using a
  one-off grep that is not committed;
- every file under `tests/fixtures/*/broken/` is referenced by some test;
- the build and sync counts match the budget table, counted by the rule in Acceptance 1;
- `tests/unit/ci/changed-paths.test.ts` and `tests/unit/setup/docs-structure.test.ts` stay
  green with the new doc. Run both.

**`docs/testing.md` contents:**

1. **Layer table.** Columns: layer | tool and command | what only it can show | depth | verdict
   (the verdicts as in issue #26). Rows: secretlint/lint/typecheck, unit + schema, component,
   build (`sync`), build (`build`), worker integration, real `astro build` (indexing), e2e,
   a11y, visual, budget, preview site-check.
2. **Placement rule.** Every behaviour gets one primary layer: the cheapest one that can
   observe it. E2e is for journeys and browser-only behaviour. Build tests are for what only
   the real build shows: call-site wiring, Astro's own errors, cross-page output. A11y and
   visual cover templates, not stories. A second layer must be justified in the test's
   comment.
3. **Check functions vs call sites.** The rule from this plan's "Placement rule": `sync` for
   `content.config.ts` call sites, `build` for routes, components and Astro's own errors, one
   broken file per run.
4. **Contract-row mapping.** One table per contract (003, 008, 009, 013). Columns: row |
   primary assertion (file and test title) | call-site run (file and run). The content is the
   mapping tables of W1–W3 as implemented, plus 013's must-build cases → `local-site.test.ts`.
5. **Build budget.** A table of the 19 builds and 12 syncs, and the counting rule. Adding a
   build means updating this table.

**Contract intro lines:** replace "Each row has one broken fixture in … and one test case in
`tests/build/…-validation.test.ts`" with "Where each row is asserted (unit, sync or build) is
listed in `docs/testing.md`, 'Contract-row mapping'." 013 gets the same. The statement in 003
and 008 that the build stops at the first error stays.

**Planned budget table (for checking):**

| File | Builds | Syncs |
|---|---|---|
| local-site.test.ts | 5 (L1, L2, L3, code baseline, code broken colour) | 0 |
| drafts.test.ts | 2 | 0 |
| blog-listing.test.ts | 1 | 0 |
| indexing.test.ts (+ launch-paths) | 2 (real `astro build`) | 0 |
| page-validation.test.ts | 4 | 3 |
| post-validation.test.ts | 3 | 4 |
| project-validation.test.ts | 2 | 3 |
| fixture-site.test.ts | 0 | 2 |
| focus-pocus.test.ts | 0 | 0 |
| **Total** | **19** | **12** |

## Docs citations (Principle IV)

Astro, retrieved through the Astro Docs MCP (`astro-docs`):

- Programmatic `sync()` and `build()`, and `AstroInlineConfig` (experimental API, already used
  by `tests/build/run-astro.ts`):
  https://docs.astro.build/en/reference/programmatic-reference/#sync and
  https://docs.astro.build/en/reference/programmatic-reference/#astro-types
- `astro sync` (run by `astro build`; sets up `astro:content`):
  https://docs.astro.build/en/reference/cli-reference/#astro-sync
- `glob()` loader and `generateId()`, which receives `entry`, `base` and unvalidated `data`. It
  runs in the content layer, so under `sync` (confirmed by a planning probe):
  https://docs.astro.build/en/reference/content-loader-reference/#glob-loader
- Collection schema validation ("If any file violates its collection schema, Astro will provide
  a helpful error"): https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema
- The schema error, `InvalidContentEntryDataError`:
  https://docs.astro.build/en/reference/errors/invalid-content-entry-data-error/
- Missing body image in Markdown/MDX, `ImageNotFound` (rows 7 and P22 stay build-level):
  https://docs.astro.build/en/reference/errors/image-not-found/ and
  https://docs.astro.build/en/guides/images/#images-in-mdx-files

Vitest 5 (vitest.dev; no MCP, so the published docs):

- `beforeAll(body, timeout?)` / `afterAll`. Hooks run in stack order, sequentially:
  https://vitest.dev/api/hooks#beforeall
- `describe` and `test.each` / `describe.each`: https://vitest.dev/api/test and
  https://vitest.dev/api/describe
- `testTimeout` / `hookTimeout` (the build project keeps 180 000 ms; merged `beforeAll`s pass
  their own timeout, as the existing files do): https://vitest.dev/config/testtimeout and
  https://vitest.dev/config/hooktimeout
- `fileParallelism` (default `true`; "doesn't affect tests running in the same file") explains
  why the builds are split across several files rather than one, so the files still run in
  parallel. Not tuned: https://vitest.dev/config/fileparallelism

## Risks

- **Merged fixture sets change exact-count assertions.** Adding posts, pages or projects to one
  site can break an assertion that assumed a smaller site: sitemap entries, `toEqual` on
  changed files, iframe counts or home-page sections. Mitigation: before deleting a source
  file, run it against the merged build. If an assertion depended on the exact set, keep its
  meaning (for example by filtering to the slugs it is about) and note the change in the
  implement summary. Never loosen it. If that is impossible, give that file its own build and
  update the budget. The ≤ 20 target leaves room for one.
- **The summaries route in shared builds.** `src/pages/summaries.json.ts` might appear in the
  sitemap or change a "files in dist" assertion. Check in W4 and W5. Fallback: keep
  post-summaries as its own file with 2 builds (budget 21 would then fail). Before reaching
  for that, drop the code-baseline build by comparing L1's code-spike CSP with L1's about-page
  CSP, as a decision recorded in the summary.
- **launch-paths on the real repository build.** If `launch.expectedPaths` lists a page that is
  a draft in production, the main-branch sitemap will not hold it, although the old local
  fixture build did. Check in W5. Fallback: keep launch-paths on its own fixture build (20
  builds).
- **A long serial chain in `local-site.test.ts`** (5 builds) becomes the critical path of the
  build project. If CI wall time does not drop as expected, move the two code builds into
  their own file. The CSP comparison then needs its own configured build: +1, total 20.
- **Dropping the `noBranch` build** is the one place where a build-level case is replaced by
  unit plus a config assertion rather than by another run. The mapping in W5 states why.
  The review phase should confirm it.
- **The drift guard** (`tests/unit/ci/changed-paths.test.ts`): new tests must not contain
  `specs/` path string literals. Cite contracts by row id only.
- **Load on the machine.** Run single files only. The full gate is the orchestrator's call, and
  Don is asked before it. Parallel worktree runs collide on port 4321 (e2e only, not this
  project).
