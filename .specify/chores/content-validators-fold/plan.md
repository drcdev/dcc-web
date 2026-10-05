# Chore plan: content-validators-fold (issue #99)

Branch: `chore/content-validators-fold`, from `main` at 87a8389 (after #104 merged).
Issue: https://github.com/drcdev/dcc-web/issues/99. The PR body says `Closes #99`.

## Goal

[#99](https://github.com/drcdev/dcc-web/issues/99): pages, posts and projects each have their own
module for slugs and addresses. Two near-identical modules check that front-matter images exist,
and six near-identical constructors build the errors. Together that is 316 lines of custom checks.
This chore folds them into one address helper keyed by collection, one image-exists helper and one
`contentError(kind, files, problem)`. It also turns on Astro's own conflict check
(`prerenderConflictBehavior: 'error'`) and proves with a build test that a page clashing with a code
route fails the build through Astro. Every build error the contracts list keeps its wording. Custom
code stays where Astro's check does not meet the requirement: an error that names the page file and
the route file, prefix claims, reserved slugs and the naming rules. The plan says why for each.
Nothing a reader sees changes. Valid content builds the same pages, and invalid content still fails
with the same messages.

Note: the issue says "spec 004", but the page rows are in
`specs/003-standalone-pages/contracts/build-errors.md` (004 is drop-fly-refs).

## What the spike showed (plan phase, fixture builds, 2026-10-04)

The plan phase ran a throwaway build test (`tests/build/zz-spike-conflict.test.ts`, deleted before
this commit). It used `buildFixtureSite` with an `astro.config.mjs` override that adds
`prerenderConflictBehavior: "error"`. Astro 7.3.5. The runs:

| Run | Setup | Result |
|---|---|---|
| A | `404.mdx` page, custom route check bypassed (`routeFiles: []`), build | fails: ``Could not render `/404` from route `/[...slug]` as it conflicts with higher priority route `/404`.`` Hint: ``Ensure `/[...slug]` and `/404` don't generate the same static paths.`` **It names routes, not files.** Neither `src/content/pages/404.mdx` nor `src/pages/404.astro` appears. |
| E | page `projects/zzz.mdx` (no such project), custom route check bypassed, build | **builds** (`ok: true`). Astro does not cover the dynamic-prefix rule. |
| B, G | `x.mdx` + `x/index.mdx`, custom checks kept, sync and build | fail **at sync** with Astro's `DuplicateContentEntrySlugError`: ``**pages** contains multiple entries with the same slug: `x`. Slugs must be unique. Entries: - src/content/pages/x.mdx - src/content/pages/x/index.mdx``. The order of the two entries differed between B and G. **This pre-empts the custom row-13 message**, which never runs. |
| C, I | posts `x.mdx` + `x.md`, sync / build | sync passes; build fails with the custom P17 message (unchanged). |
| D, J, K1 to K3, F | projects `x.mdx` + `x.md` (same and different content), sync / build | sync passes every time; build fails with the custom row-26 message (unchanged). |
| H | real posts and projects, `'error'` on, build | **builds** (`ok: true`): the real site has no conflict today. |

Why B differs from C and D: `node_modules/astro/dist/content/loaders/glob.js` (lines 85 to 125)
reads `store.get(id)` before it awaits parsing and rendering. Ten files are processed at once
(`pLimit(10)`). Two deferred-render `.mdx` files reach the check one after the other, so the second
sees the first. A `.md` file renders before `store.set`, so a `.md`/`.mdx` pair passes the check
unseen. That is a timing race, not a rule. With `'warn'` (today) the same check only logs, which is
why row 13's custom message wins now. The Astro docs for `prerenderConflictBehavior` describe only
the route case and do not mention that it also controls the glob loader's duplicate-id check.
(`glob.js:118` and `file.js:65` read the same setting.)

Two more findings:

- The existing row-13 build test asserts `"x.mdx"`, `"x/index.mdx"` and `"/x/"`. Astro's message
  passes all three, because `/x/` is a substring of `src/content/pages/x/index.mdx`. The test cannot
  tell the two messages apart, so W5 tightens it.
- The row-14 custom check (route file list) runs inside the pages route's `getStaticPaths`. That
  runs before Astro's conflict loop in `generate.js`, so with the custom check kept, row 14 keeps
  its wording and Astro's check is a backstop.

## Decisions

### D1: Row 13's wording once `prerenderConflictBehavior: 'error'` is on (decided: A)

**Don's answer: A.** Turn on `'error'` and move the duplicate-file check into `generateId` as a
per-entry "twin on disk" check, so the custom message fires first (at sync) with unchanged wording
for rows 13, P17 and 26. The route-level duplicate loops and `assertUniqueProjectFiles` go. The
work items are written for A. The options as they were put to him:

The issue asks for two things that the spike shows conflict. One is "astro.config.mjs sets
`prerenderConflictBehavior: 'error'`". The other is "every error message ... still fires with the
same wording". With `'error'` on, `x.mdx` + `x/index.mdx` (row 13) fails at sync with Astro's
duplicate-slug message, not with "Page files … and …: both make the address /x/. Keep one of them."
Astro's message names both files but gives the slug `x`, not the address `/x/`, so it also misses
the contract's "both file names, the address" column. For `.md`/`.mdx` pairs (rows 13, P17, 26) it
fires or not by timing.

- **A. Turn on `'error'` and move the duplicate-file check into `generateId` (recommended).** Each
  entry's `generateId` already calls the address helper. Given the entry path and the collection's
  base folder, the helper checks on disk for the other file names that would make the same id
  (pages: `x.md`, `x.mdx`, `x/index.md`, `x/index.mdx`; posts and projects: `x.md`, `x.mdx`). It
  throws the existing message, with the two paths sorted so the text is the same whichever twin is
  loaded first. `generateId` runs before the loader's duplicate check (`glob.js:85`), so the custom
  message always wins, and it wins at sync rather than at build. The route-level duplicate loops
  (pages, posts, and all of `assertUniqueProjectFiles` with the projects route's
  `import.meta.glob`) go. Wording is unchanged for every row. The issue's config item is met. Cost:
  rows 13, P17 and 26 move from the route to `generateId`, so their call-site build runs change
  from `build` to `sync`, which is faster. The rule moves; it does not grow.
- **B. Turn on `'error'` and accept Astro's message for duplicate files.** Amend contract rows 13
  (and P17 and 26, where the timing race lets Astro win) to allow Astro's
  `DuplicateContentEntrySlugError`. Keep the custom duplicate checks for the cases Astro misses.
  This is a spec change, two messages for one row, and a result that depends on timing.
- **C. Leave the default (`'warn'`).** Fold the modules as planned and record in the plan and PR
  body why Astro's option falls short: its route message names no files, it misses the prefix rule,
  and it pre-empts row 13. The issue's first done item is dropped. Smallest diff, and
  `astro.config.mjs` is not touched (no code-owner path).

**Chosen: A** (it was also the recommendation). It is the only option that meets both of the
issue's done items. It also keeps every message deterministic, and the duplicate check gets
simpler: one per-entry twin check instead of three list-based loops.

### Judgment calls made in this plan (no decision needed unless Don disagrees)

- **J1: Keep the custom route-file check for row 14, including exact collisions.** The issue
  removes the route parsing "only if that build test proves Astro covers the case". Run A shows
  Astro catches the collision, but its message names `/[...slug]` and `/404` and neither file.
  Row 14 requires "page file, route file". The exact, generated-stem and dynamic-prefix rules share
  one function (`claimFromRouteFile`) and one loop. Dropping only the exact case saves about three
  lines and would leave the user with a worse message. So the route-file glob and the claim logic
  stay, and Astro's check is defence in depth behind them. It catches route-against-route
  collisions that no custom check sees.
- **J2: Keep the `PageContentError` class and its name.** Five project components and
  `components/sections/validate.ts` call `new PageContentError(...)` directly, for messages with no
  file prefix. `contentError` returns a `PageContentError`. Renaming the class would touch six more
  files for no gain.
- **J3: Keep per-kind wording.** Pages and posts say "the image S does not exist … (it is relative
  to the page|post file)". Projects say "the file S does not exist … (it is relative to the project
  file)". The project visuals can be SVG diagrams, so "file" is deliberate. The unified helper keeps
  both texts.
- **J4: Keep the exported helper names that callers outside the module use.** These are
  `postHref` (feed, posts), `idFromPath` and `addressFromPath` (tests helper),
  `slugFromPostPath`, `slugFromPath` and `assertPostFiles`. W3 makes them thin per-collection entry
  points over one keyed core, so `src/lib/feed.ts`, `src/lib/posts.ts`, `tests/helpers/content.ts`
  and `tests/unit/site/fixture-posts.test.ts` only change their import path. A breaking rename of
  every call site is not needed to fold the logic.
- **J5: Update the "Check" column of the four contract rows whose call site moves.** These
  are 003 row 13 (still "address check"), 008 P17 ("post file check" → generateId), 009 row 26
  ("route check" → generateId) and 014 S11 ("route" → generateId). The wording columns do not
  change. This is a note on where the check runs, so a later agent is not misled. The changed-paths
  drift guard treats `specs/` as skip-safe.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Config.** `astro.config.mjs` has `prerenderConflictBehavior: "error"`.
   `tests/unit/site/astro-config.test.ts` has a case for it, seen failing first.
2. **Astro's check is proven.** A build test in `tests/build/page-validation.test.ts` builds a
   `404.mdx` page with the custom route check bypassed and fails with Astro's
   `conflicts with higher priority route` and `/404`. Before: no such test, and the option defaults
   to `"warn"` (`node_modules/astro/dist/core/config/schemas/defaults.js:54`).
3. **Modules folded.** `src/lib/content/address.ts`, `post-address.ts`, `project-address.ts`,
   `images.ts`, `project-images.ts` and `errors.ts` are replaced by `addresses.ts`, `images.ts` and
   `errors.ts` in `src/lib/content/`. `git ls-files src/lib/content | grep -E
   'post-address|project-address|project-images|/address\.ts'` prints nothing.
4. **Lines removed.** `wc -l` of the replacement modules totals **≤ 190** (before: **316** =
   97 + 65 + 39 + 43 + 35 + 37), which removes at least 126 lines, inside the issue's 120 to 150
   estimate.
5. **One error constructor.** `errors.ts` exports `PageContentError` and `contentError` only.
   `grep -rnE '(page|post|project)Files?Error' src tests` prints nothing.
6. **Wording unchanged.** Each problem text below appears, byte for byte, in `src/lib/content/`.
   It is built with `contentError` and the same `Page file(s)` / `Post file(s)` / `Project file(s)`
   prefix (checked with `grep -F` on the fixed parts):
   - pages: "file and folder names may use only lower-case letters, digits and hyphens. Rename the
     file."; "both make the address ${address}. Keep one of them."; "the address ${address} is
     already used by ${claim.file}. Rename the page file."; "the address ${address} is reserved for
     a later feature. Rename the page file."
   - posts: "both make the address ${postHref(slug)}. Keep one of them."; "posts cannot be in a
     sub-folder. Move the file to src/content/posts/."; "a post must be an .mdx file, so rename it
     to .mdx."; "the file name may use only lower-case letters, digits and hyphens. Rename the
     file."; "the address … is reserved for the series page|a listing page. Rename the file."
   - projects: "project files must sit directly in the projects folder, not in a subfolder. Move
     the file."; "file names may use only lower-case letters, digits and hyphens (up to 64
     characters). Rename the file."; "both make the slug ${slug}. Keep one of them."
   - images: "the image ${src} does not exist. Add the file, or fix the path (it is relative to the
     ${kind} file)." (page, post); "the file ${src} does not exist. Add the file, or fix the path
     (it is relative to the project file)." (project).
   - The other callers of the old constructors (`navigation.ts`, `post-dates.ts`, `body.ts`,
     `project-story.ts`, `project-replacement.ts`, `sections/validate.ts`, `ProjectPart.astro`,
     `PartPicture.astro`) produce the same strings. Their existing unit tests pass unchanged except
     for import lines.
7. **Every contract row still has a primary assertion.** Each row in the coverage mapping (W6) is
   asserted by a named unit test, and every row with a call-site run still has one. That covers
   003 rows 6, 13, 14 and 17; 008 P9, P13 to P17 and P25; 009 rows 26 and 27; 014 S09 to S11.
   `docs/testing.md` "Contract-row mapping" names the new test files and titles.
8. **Unit tests consolidated.** `tests/unit/content/address.test.ts`, `post-address.test.ts` and
   `project-address.test.ts` are replaced by `addresses.test.ts`, and `images.test.ts` covers all
   three kinds. Their combined `wc -l` is **≤ 320** (before: **334** = 141 + 86 + 51 + 56, 40 `it`
   rows: 15 + 13 + 7 + 5). Every removed assertion has a home in the W6 mapping.
9. **Deterministic duplicate messages (A).** The row-13 build run asserts "both make the address
   /x/. Keep one of them." and passes in `sync` mode. The row-26 run asserts "both make the slug x.
   Keep one of them." in `sync` mode.
10. **Nothing a reader sees changes.** No file under `src/pages/` changes except
    `[...slug].astro` and `projects/[slug].astro` (imports and the removed duplicate call). No file
    in `src/components/` changes except imports and `contentError` calls. No visual baseline
    changes. `tests/build/local-site.test.ts` and the e2e suite pass unchanged.
11. `pnpm run verify:quick` is green after each work item; the full gate is green before the PR.

## Scope

**In:**

- `astro.config.mjs` (one line and a comment) and its unit test (W1).
- `src/lib/content/errors.ts` → `contentError` (W2), and every caller of the six old constructors.
- `src/lib/content/addresses.ts` (new, replaces `address.ts`, `post-address.ts` and
  `project-address.ts`) (W3); `src/content.config.ts`, `src/pages/[...slug].astro`,
  `src/pages/projects/[slug].astro`, `src/lib/posts.ts`, `src/lib/feed.ts`,
  `tests/helpers/content.ts` and `tests/unit/site/fixture-posts.test.ts` (imports and call sites).
- `src/lib/content/images.ts` (one helper for three kinds; `project-images.ts` deleted) (W4).
- Unit tests in `tests/unit/content/` (W2 to W4), build tests `tests/build/page-validation.test.ts`,
  `post-validation.test.ts` and `project-validation.test.ts` (W5), `docs/testing.md` mapping (W6),
  and the "Check" column of four contract rows (J5).

**Out:**

- Narrowing the content globs to `*.mdx` (the issue rules it out; it changes the spec).
- Renaming `PageContentError` (J2).
- Changing any message wording, any schema, or the `futureDestinations` / reserved lists.
- Moving the post sub-folder, `.md`, naming or reserved checks (P13 to P16) out of the posts route.
  The posts glob is top level only, so sub-folder files never reach `generateId`.
- Fixing the `index/index.mdx` edge case: `addressFromPath` gives `/index/`, `idFromPath` gives
  `index`, the same id as the home page. It exists today, is not in any contract, and is noted as a
  follow-up.

**Follow-ups for the PR body:**

- Astro's docs for `prerenderConflictBehavior` do not say that it also turns the glob loader's
  duplicate-id warning into an error. The loader's duplicate check misses `.md`/`.mdx` pairs by
  timing. Both are worth an upstream docs or issue note.
- `index/index.mdx` shares the home page's id (above).
- Astro's `PrerenderRouteConflict` names routes, not files. If it ever names the source files,
  J1's exact-collision branch could go.

## Constitution Check

- **I. Test-First:** every work item writes or moves its tests first and sees them fail: the config
  case (W1), `contentError` (W2), the twin check and the keyed helper (W3), and the project image
  kind (W4). Moved tests keep their assertions (W6 mapping).
- **II. Automated Release Gate:** no check is skipped or weakened. The build gets stricter
  (`'error'`), and the full gate runs before the PR.
- **III. Human Review for Major Changes:** none of the criteria fire. No dependency, integration
  or service is added or removed. There is no contact-data change, no design, layout or navigation
  change, and no cost change. `astro.config.mjs` is build configuration, but the change only makes
  the build stricter: it fails on what was a warning, and the real site has no such conflict (spike
  run H). That is not CI, deployment or infrastructure configuration, and the issue says so too.
  There is no constitution amendment. Verdict: **not major**. `astro.config.mjs` is a CODEOWNERS
  path, so Don's code-owner review is requested automatically; auto-merge can be armed once nothing
  else needs him.
- **IV. First-Party Before Custom:** Astro's `prerenderConflictBehavior: 'error'` is used (W1). The
  custom code that stays is named with the first-party option considered and why it falls short:
  - The row-14 route claims stay. Astro's `PrerenderRouteConflict` names neither file (run A) and
    does not cover dynamic prefixes (run E) or generated stems (`/robots.txt` and `/robots/` are
    different paths).
  - Duplicate files: Astro's `DuplicateContentEntrySlugError` gives the slug, not the address, and
    misses `.md`/`.mdx` pairs by timing (runs C, D, K).
  - Reserved slugs: Astro has no notion of them.
  - Naming rules: the glob loader's default `generateId` slugifies names instead of rejecting them.
  - Front-matter image existence: Astro's `image()` error names only the image (spec 003 research,
    unchanged).
  Astro Docs MCP consulted; citations below.
- **V. Static by Default:** unchanged. Every page is still prerendered, and the stricter conflict
  check applies to prerendered routes.
- **VI. Content as Files:** strengthened, not changed. Invalid content still fails the build with
  the same clear error, and duplicates now fail earlier (at sync).
- **VII. Private Data:** unchanged; no contact code is touched.
- **VIII. Cloudflare Best Practices:** unchanged; no Worker or wrangler change.
- **IX. Cost Ceiling:** unchanged.
- **X. Accessible, Fast and Private:** unchanged; the built output is the same (acceptance 10).
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/content-validators-fold/` per
  `/chore`. Parallel risk: `src/content.config.ts`, `docs/testing.md` and
  `tests/helpers/content.ts` are shared files; merge `origin/main` before the gate.

## Work items

### W1: Turn on Astro's conflict check (test first)

- [ ] W1 done
- **Files:** `tests/unit/site/astro-config.test.ts`, `astro.config.mjs`,
  `tests/build/page-validation.test.ts`.
- **Test, unit (new-first, unit over config):** add "sets prerenderConflictBehavior to error"
  beside "sets trailingSlash to ignore", in the same style. See it fail, then add
  `prerenderConflictBehavior: "error"` after `trailingSlash` in `astro.config.mjs`, with a
  two-line comment citing the configuration reference and saying the custom route check still
  runs first so its message names the files (J1). **Layer: unit**, the cheapest layer that can see
  the configured value.
- **Test, build (new):** in `page-validation.test.ts`, add "Astro's prerenderConflictBehavior:
  'error' fails a page that clashes with a code route (custom check bypassed)". It uses
  `buildFixtureSite([broken("14-route-conflict.mdx", "404.mdx")], { mode: "build", overrides: {
  "src/pages/[...slug].astro": (t) => t.replace(<the routeFiles argument>, "routeFiles: []") } })`.
  Assert `ok` is false and the message contains `conflicts with higher priority route` and
  `` `/404` ``. Also assert that the override text matched, by checking that the patched file
  differs from the source, so a later edit to the route cannot make the test pass for the wrong
  reason. **Layer: build.** Reason for the second layer (comment in the test): the unit test sees
  only the config value; only the real build shows that Astro raises its own error (docs/testing.md
  "Astro's own errors"). This run needs `'error'` from W1, so it fails before W1 (the default
  `'warn'` builds) and passes after.
- Confirm the existing row-14 run still shows the custom message. The custom check runs first in
  `getStaticPaths`.

### W2: One error constructor, `contentError(kind, files, problem)`

- [ ] W2 done
- **Files:** `src/lib/content/errors.ts`; callers `src/lib/content/{navigation,post-dates,body,
  project-story,project-replacement}.ts`, `src/components/sections/validate.ts`,
  `src/components/project/{ProjectPart,PartPicture}.astro`; tests
  `tests/unit/content/navigation.test.ts`, new `tests/unit/content/errors.test.ts`. The callers
  being folded in W3 and W4 switch in those items.
- **Shape:** `type ContentKind = "page" | "post" | "project"`;
  `contentError(kind, files: string | readonly [string, string], problem): PageContentError`. One
  file gives `<Kind> file <path>: <problem>`; two files give `<Kind> files <a> and <b>: <problem>`,
  with `Kind` capitalised. Keep `PageContentError` (J2). `body.ts` and the image helper pass their
  `kind` straight through instead of choosing a constructor.
- **Test (new-first):** `errors.test.ts` covers the six prefixes: three kinds by one or two files.
  It asserts the exact message (`toBe`) and `toBeInstanceOf(PageContentError)`. This moves the two
  "project errors" cases from `project-address.test.ts` and generalises them. **Layer: unit.** The
  old constructors stay until W3 and W4 remove their last callers, so each step stays green.
  Delete them at the end of W4 and run acceptance 5's grep.
- `navigation.test.ts` builds expected messages with `pageFileError` / `pageFilesError`. Switch it
  to `contentError("page", …)`. The assertions are otherwise unchanged (existing test).

### W3: One address helper keyed by collection (`addresses.ts`)

- [ ] W3 done
- **Files:** new `src/lib/content/addresses.ts`; delete `address.ts`, `post-address.ts`,
  `project-address.ts`; `src/content.config.ts`, `src/pages/[...slug].astro`,
  `src/pages/projects/[slug].astro`, `src/lib/posts.ts`, `src/lib/feed.ts`,
  `tests/helpers/content.ts`, `tests/unit/site/fixture-posts.test.ts`; new
  `tests/unit/content/addresses.test.ts` replaces the three old test files.
- **Shape (A):**
  - One table keyed by collection: the folder (`src/content/pages|posts|projects`), the error kind,
    the name rule and its message, and how a path becomes an id and an address.
  - Per-collection entry points over it (J4): `addressFromPath` / `idFromPath` (pages),
    `slugFromPostPath` / `postHref` (posts), `slugFromPath` (projects).
  - New `assertNoTwin(collection, base, entry)`. It lists the other file names that would make the
    same id (pages: `<stem>.md`, `<stem>.mdx`, `<stem>/index.md`, `<stem>/index.mdx`, where the
    stem is the address path; posts and projects: `<slug>.md`, `<slug>.mdx`), minus the entry
    itself. For the first one that exists on disk, it throws `contentError(kind, [a, b].sort(), …)`
    with the existing "both make the address … / both make the slug …" text.
  - `src/content.config.ts`: each `generateId` calls the id function and then `assertNoTwin` (and
    the image helper from W4). For posts, the twin check runs before the dates check, so a
    duplicate is reported first, as today.
  - `assertUniqueAddresses` keeps only the route claims and reserved addresses (J1), and is renamed
    `assertPageAddressesFree`. `assertPostFiles` keeps only sub-folder, `.mdx`, name and reserved,
    in today's order. `assertUniqueProjectFiles` and the projects route's `import.meta.glob` are
    deleted.
- **Tests (new-first for `assertNoTwin`; moved for the rest):**
  - `addresses.test.ts` moves every case in the W6 mapping, renaming only imports and helper names.
  - New `assertNoTwin` cases, using a temporary folder as `images.test.ts` does: `about.md` +
    `about.mdx`, `x.mdx` + `x/index.mdx` (checked from both entries, giving the same message), post
    `x.mdx` + `x.md` (P17), and project `x.md` + `x.mdx` (row 26). There is also a no-twin case
    for each collection, and a case where a twin is a template file (`_template.mdx` is not a twin
    of anything).
  - **Layer: unit**, the cheapest layer that can observe it: a pure function of a path and a folder
    on disk. The call-site runs are W5.
  - `tests/helpers/content.ts` changes its imports only. `no-real-content-in-tests.test.ts` must
    stay green: new cases use made-up names (`about`, `x`, `a-post`), never real slugs.

### W4: One image-exists helper for pages, posts and projects

- [ ] W4 done
- **Files:** `src/lib/content/images.ts` (rewritten), delete `src/lib/content/project-images.ts`,
  `src/content.config.ts` (project `generateId`), `tests/unit/content/images.test.ts`.
- **Shape:** `assertImagesExist(kind, root, file, data)`. A per-kind source picker covers pages and
  posts (`image`, `featureImage`, `intro.photo`) and projects (`visual`, `image`, every
  `visuals.*`). Only paths starting with `.` are checked. The message text is per kind (J3). Errors
  go through `contentError`. After this item, delete the six old constructors (W2).
- **Test (new-first for the project kind; existing for page and post):** extend `images.test.ts`.
  Add "names the project file, with the project wording, when a visual is missing (S09)", covering
  `visual`, `image` and a `visuals.<name>`, plus an all-present case. Today S09 has no unit test of
  its own (`docs/testing.md` says so), so this adds its primary assertion. The page and post cases
  move as they are. **Layer: unit**; the call-site run stays build row 17 (sync), unchanged.

### W5: Build call-site runs follow the moved checks

- [ ] W5 done
- **Files:** `tests/build/page-validation.test.ts`, `post-validation.test.ts`,
  `project-validation.test.ts` (titles, comments, modes, assertions); fixtures unchanged.
- **Row 13 (A):** move the run into the `sync` describe, retitled "row 13: generateId runs the twin
  check (x.mdx and x/index.mdx)". Add the assertion `"both make the address /x/. Keep one of
  them."`. This fails before W3 with `'error'` on, because Astro's message wins (spike B), and
  passes after it. It is the test that would have caught the pre-emption.
- **Row 26 (A):** move to `sync`, retitled "row 26: generateId runs the twin check". Assert
  `"both make the slug x. Keep one of them."` as well as the two file names.
- **P17 (A):** add a `sync` run "P17: generateId runs the twin check" with
  `valid/minimal.mdx` → `x.mdx` and `valid/long-title.mdx` → `x.md`. Assert "Post files",
  `x.md`, `x.mdx`, "/writing/x/". Today P17's only call-site run is the P13 run (same
  `assertPostFiles` call). That call no longer holds the duplicate check, so P17 needs its own run.
  Reason for the build layer: it shows that `generateId` wiring in `src/content.config.ts` runs
  the check, which only Astro's loader shows.
- **Row 14** and **P13** stay in `build` (the route still runs those checks); update comments that
  name `assertUniqueAddresses`.
- Header comments that say "the logic of each row is asserted in a unit test (… project-address …)"
  name the new files.
- **Layer: build** for all of them (call-site wiring, docs/testing.md). Each is the second layer
  for a unit-tested rule, which the file headers already justify.

### W6: Coverage mapping and docs

- [ ] W6 done
- **Files:** `docs/testing.md` ("Contract-row mapping", lines ~263 to 400, and the build bullets at
  ~275 and ~304); the "Check" column of `specs/003-standalone-pages/contracts/build-errors.md`
  row 13, `specs/008-blog/contracts/build-errors.md` P17,
  `specs/009-portfolio/contracts/build-errors.md` row 26 and
  `specs/014-project-four-part-story/contracts/build-errors.md` S11 (J5).
- **Test:** no behaviour: n/a (documentation of where each assertion lives; acceptance 7 is checked
  by reading it against the test titles).
- **Coverage mapping** (removed assertion → where it now lives; titles may change only as shown):

  | Removed from | Assertion | Now in |
  |---|---|---|
  | `address.test.ts` "addressFromPath" `it.each` maps (9) and rejects (6) | path → address; bad names name the file and the rule (row 17) | `addresses.test.ts` "pages: addressFromPath", same tables |
  | `address.test.ts` "idFromPath" | id from path | `addresses.test.ts` "pages: idFromPath" |
  | `address.test.ts` "accepts distinct addresses" | no false positive | `addresses.test.ts` "assertPageAddressesFree accepts distinct addresses" (route and reserved parts) plus "assertNoTwin: no twin" per collection |
  | `address.test.ts` "fails for two page files with the same address …" and "fails for x.mdx together with x/index.mdx" (row 13) | both files named, address, "Page files" | `addresses.test.ts` "assertNoTwin (row 13): about.md and about.mdx" and "… x.mdx and x/index.mdx, from either file" |
  | `address.test.ts` route cases: 404, robots.txt.ts, index.astro, variable prefix, projects prefix, ignores the pages route (row 14) | page and route files named | `addresses.test.ts` "assertPageAddressesFree (row 14)", same six cases |
  | `address.test.ts` "fails for reserved address %s" (row 14) | reserved, address | `addresses.test.ts` same `it.each` |
  | `address.test.ts` "reports an invalid file name before checking for conflicts" | order of checks | `addresses.test.ts`, same case on `assertPageAddressesFree` |
  | `address.test.ts` "row 14: page addresses against the real route files" | real `src/pages` list | `addresses.test.ts`, same case |
  | `post-address.test.ts` slug/href (3) | slug and address | `addresses.test.ts` "posts: slugFromPostPath and postHref" |
  | `post-address.test.ts` accepts, P13, P14, P15 (`it.each`), P16, P25, "listing page", "Post file(s)" prefix | each rule and prefix | `addresses.test.ts` "assertPostFiles", same cases. The prefix case uses a single-file rule for "Post file" and the twin check for "Post files". |
  | `post-address.test.ts` P17 and "names both files whatever order" | both files, address, order-independent | `addresses.test.ts` "assertNoTwin (P17)", called from each twin, same message |
  | `project-address.test.ts` slugFromPath maps, rejects, nested (row 27, S10) | slug and rules | `addresses.test.ts` "projects: slugFromPath", same cases |
  | `project-address.test.ts` assertUniqueProjectFiles (row 26, S11) | both files named in sorted order, "slug x" | `addresses.test.ts` "assertNoTwin (row 26)", asserting `Project files src/content/projects/x.md and src/content/projects/x.mdx` |
  | `project-address.test.ts` "project errors" (2) | message format | `errors.test.ts` (W2) |
  | `images.test.ts` page and post cases (5) | rows 6 and P9 | `images.test.ts`, unchanged titles, new signature |
  | (none before) | S09 project image | `images.test.ts` new project case (W4) |
  | `build/*-validation` rows 13 and 26 (build mode) | call site | same files, sync mode (W5) |

### Wrap-up (in the implement phase)

- Delete the old constructors (end of W4), then run acceptance 3 to 6 greps and `wc -l` and record
  the after numbers in the implement summary.
- `pnpm run verify:quick`, then the full gate (ask first, per the pipeline).

## Docs citations

Astro (Astro Docs MCP, `search_astro_docs`, 2026-10-04):

- `prerenderConflictBehavior` (`'error' | 'warn' | 'ignore'`, default `'warn'`, added in
  astro@6.0; `error` fails the build when two routes generate the same prerendered URL):
  https://docs.astro.build/en/reference/configuration-reference/#prerenderconflictbehavior
- `PrerenderRouteConflict` (message names the pathname and the two routes):
  https://docs.astro.build/en/reference/errors/prerender-route-conflict/
- `DuplicateContentEntrySlugError` (collection contains multiple entries with the same slug):
  https://docs.astro.build/en/reference/errors/duplicate-content-entry-slug-error/. The docs do
  not say that `prerenderConflictBehavior` controls it; the source does
  (`node_modules/astro/dist/content/loaders/glob.js:118`).
- `glob()` loader and `generateId({ entry, base, data })`, which returns a unique id per entry and
  is where the name rules, the twin check and the image check run:
  https://docs.astro.build/en/reference/content-loader-reference/#glob-loader and
  https://docs.astro.build/en/guides/content-collections/#defining-custom-ids
- Route priority order (why `/404` from `404.astro` beats `[...slug]`):
  https://docs.astro.build/en/guides/routing/#route-priority-order
- Programmatic `build()` / `sync()` used by the build tests (unchanged):
  https://docs.astro.build/en/reference/programmatic-reference/

## Risks

- **Moving duplicate checks to sync (A).** `astro sync`, `astro check` and dev now report
  duplicates too. That is earlier, not different. In dev, `generateId` runs on file change, so
  adding a twin while dev runs reports at once. This only shows to the author.
- **Twin check on disk vs the glob.** The check uses `existsSync`. A twin file the glob would
  ignore (a `_`-prefixed project) is never a twin, because names starting with `_` cannot match a
  valid slug. Page twins must match the pages glob (`**/*.{md,mdx}`), which they do. Unit cases
  cover both.
- **Astro upgrades.** If Astro moves its duplicate-id check before `generateId`, or makes
  `PrerenderRouteConflict` fire before `getStaticPaths` checks, the row-13 and row-14 runs (with
  their exact wording assertions) fail the gate rather than letting the wording drift silently.
- **The W1 build test patches route source text.** If `[...slug].astro` changes shape, the
  `replace` would silently not match. The test asserts that the patch applied.
- **Shared files with sibling worktrees** (`src/content.config.ts`, `docs/testing.md`,
  `tests/helpers/content.ts`). Merge `origin/main` before the gate.
- **Load-sensitive gate.** Build tests are about 4 s each here (spike: 7 runs in 28 s), but sibling
  worktrees share ports 4321/4322 for Playwright. Check `lsof -i :4321` before the full gate.
