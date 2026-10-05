# Chore plan: shared-helpers-dead-plumbing (issue #98)

Branch: `chore/shared-helpers-dead-plumbing`, at `main` (5f65379, after #112 merged).
Issue: https://github.com/drcdev/dcc-web/issues/98. The PR body says `Closes #98`.

## Goal

[#98](https://github.com/drcdev/dcc-web/issues/98): small helpers exist as copies, and some
plumbing is dead. The Worker has two verbatim copies of `readCapped`, and they have drifted: only
the contact endpoint rejects early on `Content-Length`. Three JSONC readers exist, and the E2E
Worker config script imports its reader from a setup-check module. Seventeen test files each
define a recursive directory walker. An empty `futureDestinations` list still runs through the
page address check, two skipped E2E tests and four other test files, and `addressOfProject` has
no callers. This chore moves the body reader and a JSON-object parser into `worker/src/http.ts`,
moves `stripJsonc` into `scripts/lib/jsonc.ts`, replaces the walkers with Node's own recursive
`readdirSync` behind one thin helper in `tests/helpers/`, and deletes the dead plumbing. Each
endpoint keeps its status codes, error codes and log outcomes. The built site, its navigation and
every response a visitor can get stay the same. The only runtime difference is that the questions
endpoint now refuses an oversized body from its declared `Content-Length` instead of after
reading 1,024 bytes of it, with the same 413 `too_large` response and the same `invalid` log line.

## Acceptance

Mechanical criteria, each checked by the review phase. "Before" was measured on 5f65379.

1. **One body reader.** `git grep -n "function readCapped" -- worker/src` matches only
   `worker/src/http.ts` (before: 2, `contact/submit.ts` and `questions/handler.ts`).
   `git grep -n "JSON.parse" -- worker/src/contact/submit.ts worker/src/questions/handler.ts`
   is empty (before: 2). `git grep -n "Content-Length" -- worker/src` matches only `http.ts`
   (before: 1, `contact/submit.ts`).
2. **Error codes unchanged.** Contact still answers `413 too_large` and `400 invalid_json`; questions
   still answers `413 too_large` and `400 invalid`. The existing worker tests for these
   (`contact.test.ts` "413 when Content-Length is over 10,240", "413 when a streamed body without
   Content-Length grows past 10,240 bytes", the `invalid_json` cases; `questions.test.ts` Q04,
   the "not an object" cases, Q24 outcomes `["invalid", "invalid", "invalid"]`) pass unedited.
3. **Questions rejects early.** A new `questions.test.ts` case sends a streamed body with a declared
   `Content-Length` over 1,024 and gets 413 `too_large` without the stream being pulled. It fails
   on 5f65379 (the stream is read).
4. **No `SourceFile`.** `git grep -n "SourceFile" -- worker` is empty (before: 2 lines). The guard
   narrows to `Pick<QuestionSource, "title" | "summary" | "text" | "hash">`, imported type-only
   from `src/lib/questions/source.ts`, so the runtime check is the same four string keys.
   `tsc -p worker` passes (spiked in the plan phase: a type-only import of that file typechecks
   in the Worker program).
5. **One JSONC reader.** `git grep -nE "function strip(Jsonc|JsonComments)" -- scripts tests`
   matches only `scripts/lib/jsonc.ts` (before: 3, in `contact-shared.ts`, `drift.test.ts`,
   `config-files.test.ts`). `git grep -n "contact-shared" -- scripts/e2e-wrangler-config.ts tests/unit/setup-check/checks/strip-jsonc.test.ts`
   is empty. The generated `wrangler.e2e.json` is byte-identical: `node scripts/e2e-wrangler-config.ts`
   then `shasum -a 256 wrangler.e2e.json` starts `187732139410de23` before and after.
6. **No hand-written walkers in tests.** `git grep -n "isDirectory()" -- tests` matches only
   `tests/e2e/blog-fixture.a11y.spec.ts` (a static file server, not a walker) (before: 18 lines in
   18 files, 17 of them walkers). The helper uses `readdirSync(dir, { recursive: true,
   withFileTypes: true })` and no recursion of its own. Every converted call site returns the same
   files as before (the implementer diffs each list on 5f65379 against the new one with a scratch
   script and records "same" per site; `tests/helpers/content.ts` must also keep its order).
7. **Dead plumbing gone.** `git grep -n "futureDestinations" -- src tests docs scripts` is empty
   (before: 8 files). `git grep -n "reserved" -- src/lib/content/addresses.ts` matches only the
   post-slug rules (before: 7 lines, 5 for the page `reserved` input). `git grep -n "until their
   features arrive\|Phase 7 (T054)" -- src` is empty (before: 2). `git grep -n "addressOfProject"
   -- src tests` is empty (before: 1), and `git grep -nE 'projects/\$\{' -- src tests/helpers`
   matches only `fileOf`/`fileOfProject` file paths (before: 2 address literals in `src`, 1 in
   `tests/helpers/content.ts`).
8. **`SiteOriginEnv` aliases `BuildEnv`.** `src/lib/site-origin.ts` declares
   `export type SiteOriginEnv = BuildEnv;` (imported type-only from `./build-mode.ts`).
9. **E2E list.** `playwright test --list tests/e2e/shell.spec.ts tests/e2e/not-found.spec.ts`
   goes from 111 tests to 109 (the two skipped future-destination tests).
10. **Navigation identical.** No visual baseline PNG changes, and `tests/e2e/shell.spec.ts`'s
    navigation tests pass unedited. `contact.mdx` gains no `nav:` (the optional move is skipped).
11. **Gates.** `pnpm run verify:quick` is green after every work item, and so are the item's
    targeted files (`vitest run --project unit <files>`, `pnpm run test:worker`, the named build
    tests, the named Playwright specs after a build). The full `pnpm run verify` is green before
    the PR (the orchestrator asks Don first).
12. **Diff scope.** `git diff --name-only main` lists only `worker/src/http.ts`,
    `worker/src/contact/submit.ts`, `worker/src/questions/handler.ts`, `worker/test/**`,
    `scripts/lib/jsonc.ts`, `scripts/e2e-wrangler-config.ts`,
    `scripts/setup-check/checks/contact-shared.ts`, `src/config/navigation.ts`,
    `src/pages/[...slug].astro`, `src/lib/content/addresses.ts`, `src/lib/projects.ts`,
    `src/lib/content/project-replacement.ts`, `src/components/project/ProjectRow.astro`,
    `src/components/project/ReadingProgress.astro`, `src/lib/site-origin.ts`, `tests/**`,
    `docs/testing.md` and `.specify/chores/shared-helpers-dead-plumbing/**`. Nothing under
    `public/`, `.github/`, `setup/`, `wrangler.jsonc`, `package.json` or `src/content/`.

## Scope

### In scope

| Area | Change |
|---|---|
| Worker body reader (W1, W2) | `readCapped(request, maxBytes)` and `parseJsonObject(raw)` in `worker/src/http.ts`; both endpoints call them; `QuestionSource` type replaces `SourceFile` |
| JSONC (W3) | `scripts/lib/jsonc.ts`; `contact-shared.ts`, `e2e-wrangler-config.ts`, `drift.test.ts`, `config-files.test.ts`, `strip-jsonc.test.ts` import it |
| Test walkers (W4) | `tests/helpers/files.ts` over `readdirSync` recursive; 17 walkers replaced |
| Dead plumbing (W5) | `futureDestinations`, the page `reserved` input, the two skipped shell tests, the not-found spread, the stale comment |
| Small items (W6) | `addressOfProject` → `projectHref` beside `postHref`, used at all three inline sites; `SiteOriginEnv = BuildEnv`; ReadingProgress comment |
| Docs (W7) | `docs/testing.md` row 14 |

### Judgment calls

- **`readCapped` owns the early `Content-Length` check.** It returns `null` when the declared
  length is over the cap, before reading, and also when the streamed bytes pass the cap. Each
  caller already maps `null` to 413 `too_large`, so contact's separate check folds in with the same
  response and the same `too_large` log outcome, and questions gains it with the same 413 and the
  same `invalid` outcome it logs today. A missing or non-numeric header is ignored, as contact does
  now (`Number(null)` is 0, `NaN` is not finite).
- **`parseJsonObject(raw): Record<string, unknown> | null`** is a pure parser of the text (not a
  second reader of the request). `null` for invalid JSON, `null`, an array or a primitive. Contact
  maps `null` to 400 `invalid_json`, questions to 400 `invalid`. Both differ today only in that
  code, and both already treat a parse failure and a non-object alike.
- **`isSource` keeps its four keys.** The question-source file also carries `slug`, but the Worker
  never checked it. The guard narrows to `Pick<QuestionSource, "title" | "summary" | "text" |
  "hash">`, so a file that passed before still passes. `generate()` takes `PostText`, which the
  pick satisfies.
- **`addressOfProject`: replaced by `projectHref(id)` in `src/lib/content/addresses.ts`, used at
  every inline site.** Using `addressOfProject` itself is not possible at the replacement site:
  it lives in `src/lib/projects.ts`, which imports `astro:content`, while
  `src/lib/content/project-replacement.ts` is a pure module unit-tested without it. `postHref` already
  lives in `addresses.ts`, so the project address goes next to it. It is used in `ProjectRow.astro`,
  `project-replacement.ts` and `tests/helpers/content.ts` (a third inline copy the issue does not
  name). One place builds the address, so a change lands once. This is a rename and move, not a new
  helper.
- **One thin helper for walkers, not a custom walker.** Node 24's
  `readdirSync(dir, { recursive: true, withFileTypes: true })` does the walking. The helper
  `filesUnder(dir)` keeps the files (`isFile()`) and joins `parentPath` and `name` to absolute
  paths. That is three lines, but 17 sites would repeat them, which is the duplication the issue
  removes. Each site keeps its own filter (`.mdx`, `.svg`, `images/` skipped, `_` files skipped,
  extension lists) as a `.filter` on the result. Sites that need relative paths use
  `path.relative`. The one site with `existsSync` before walking (`design-source.test.ts`) keeps
  that guard.
- **The Contact `nav:` move is skipped.** Contact is already a fixed primary entry, and the move
  cannot improve anything while risking a navigation change (a Principle III criterion). Recorded
  as optional and not done.
- **`strip-jsonc.test.ts` stays where it is** and imports the new module. Moving it would only
  rename a file.
- **`specs/` is not edited.** Its 38 mentions of `futureDestinations` and `readCapped` are the
  historical record of earlier features.

### Out of scope

- Walkers outside `tests/`: `scripts/fonts/embed-diagram-fonts.ts` (`svgFilesUnder`) and
  `src/lib/prune-unreferenced-assets.ts` (`walk`). The issue names test walkers only.
- `docs/pages.md` "Menu positions and reserved addresses": still true after W5. `/writing/` and
  `/projects/` are claimed by route files and `/contact/` is the contact page, so no edit.
- Any change to error wording, status codes, rate limits, Turnstile or the stored data.

### Follow-ups for the PR body (not done here)

- **F1. Script and site walkers.** `scripts/fonts/embed-diagram-fonts.ts` and
  `src/lib/prune-unreferenced-assets.ts` can use `readdirSync` recursive too.
- **F2. Contact `nav:` front matter.** Optional in #98 and skipped (see Judgment calls).

## Constitution Check

- **I. Test-First:** new behaviour gets a failing test first: the questions early-reject case (W2)
  and the `http.ts` helpers (W1) and `projectHref` (W6). Moves keep their existing tests green
  (`strip-jsonc.test.ts`, the contact and questions endpoint tests). Pure deletions of dead code
  need no failing test; their coverage mapping is in W5.
- **II. Automated Release Gate:** no check of a live behaviour is skipped or weakened. The deleted
  tests check a feature that no longer exists (an empty list); W5 maps each one. CI is unchanged.
- **III. Human Review for Major Changes:** **one criterion fires: "touches how contact data is
  collected".** The body reader is how the contact endpoint reads a submission, and the issue says
  to treat it as major when in doubt. Constitution 2.3.0 has no separate gate, so the PR body
  flags it with this criterion; it merges on Don's approval like any PR. The others do not fire:
  no dependency or service is added or removed (`scripts/lib/jsonc.ts` is code moved, not a
  library); navigation, layout and visuals are unchanged (`navigation.ts` loses an empty export
  and a comment only, no baseline changes, the Contact move is skipped); no running-cost increase;
  CI, deployment and infrastructure configuration are unchanged (`e2e-wrangler-config.ts` changes
  one import and its output is byte-identical, acceptance 5); the constitution is not amended.
- **IV. First-Party Before Custom:** Node's recursive `readdirSync` replaces 17 hand-written
  walkers. The Worker reads the body with the platform's `ReadableStream` reader and the standard
  `Content-Length` header. No Astro choice is made, so no Astro Docs MCP lookup is needed. Docs
  are cited below.
- **V. Static by Default:** no change; only `/api/*` runs Worker code.
- **VI. Content as Files:** no content change. `tests/helpers/content.ts` keeps reading
  `src/content/**`, with the same files in the same order.
- **VII. Private Data:** unchanged. The reader still never logs the body, and the log lines carry
  outcomes only. No new field is collected or stored.
- **VIII. Cloudflare Best Practices:** improved. Both endpoints now refuse an oversized body
  before reading it, and the body cap lives in one reader. Same-origin checks, Turnstile and the
  bucket are untouched.
- **IX. Cost Ceiling:** no change (marginally less Worker CPU on oversized question bodies).
- **X. Accessible, Fast and Private:** no page change.
- **XI. Spec Kit Workflow:** a `/chore` branch; the plan lives in
  `.specify/chores/shared-helpers-dead-plumbing/`.
- **Security Baseline:** `_headers`, the ruleset and Dependabot are untouched. The Worker security
  headers in `http.ts` are unchanged.
- **Development Workflow, test placement:** each item names its layer below. Only W2 tests at two
  layers, for two different behaviours (the helper's logic, and the endpoint's wiring of it).

## Work items

Order: the Worker helpers first (W1, then W2 which uses them), then JSONC, the walkers, the dead
plumbing, the small items and docs last. Each item leaves `verify:quick` green with its targeted
files. Run every toolchain call through `/Users/doncoleman/.claude/jobs/b807dd0b/tmp/run.sh`.

### [x] W1. `readCapped` and `parseJsonObject` in `worker/src/http.ts`

- **Files:** `worker/src/http.ts`; new `worker/test/http.test.ts`.
- **Shape:** `readCapped(request: Request, maxBytes: number): Promise<string | null>`: `null` when
  the declared `Content-Length` is a finite number over `maxBytes` (body not read), or when the
  streamed bytes pass `maxBytes` (reader cancelled); `""` when there is no body; otherwise the
  decoded text. `parseJsonObject(raw: string): Record<string, unknown> | null`.
- **Test:** new-first, **worker unit layer** (`worker/test/http.test.ts` under the worker Vitest
  config; pure helpers, no endpoint needed). Cases: under the cap returns the text; no body returns
  `""`; a declared length over the cap returns `null` without pulling the stream (a
  `ReadableStream` whose `pull` sets a flag); a stream with no declared length that grows past the
  cap returns `null`; exactly `maxBytes` is accepted; `parseJsonObject` returns the object for
  `{"a":1}` and `null` for `[1]`, `null`, `"x"`, `1` and `not json`. Seen failing (no exports)
  before the helpers are written.

### [x] W2. Both endpoints use the shared reader; `QuestionSource` replaces `SourceFile`

- **Files:** `worker/src/contact/submit.ts` (delete local `readCapped` and the inline
  `Content-Length` check, call `readCapped(request, BODY_MAX_BYTES)` and `parseJsonObject`, map
  `null` to 413 `too_large` / 400 `invalid_json`, logs unchanged); `worker/src/questions/handler.ts`
  (delete local `readCapped` and `SourceFile`, call the helpers, map `null` to 413 `too_large` /
  400 `invalid` with the `invalid` outcome, `isSource` typed with
  `Pick<QuestionSource, "title" | "summary" | "text" | "hash">` from a type-only import of
  `../../../src/lib/questions/source.ts`); `worker/test/questions.test.ts` (one new case).
- **Test:** new-first for the questions early reject, **worker endpoint layer**
  (`questions.test.ts`): a POST with `Content-Type: application/json`, `Content-Length: 2048` and a
  `ReadableStream` body whose `pull` sets a flag returns 413 `{ ok: false, error: "too_large" }`,
  logs `invalid`, and never pulls the stream. Seen failing on the current handler. Second layer
  reason: W1 tests the helper; only the endpoint test shows that the questions handler wires the
  helper in before reading. Contact needs no new test: its early-reject and streamed-overflow tests
  already exist and must pass unedited. Existing: every contact and questions test passes unedited
  (acceptance 2). If workerd drops a hand-set `Content-Length` on a streamed `Request` in the test
  pool, the implementer notes it, uses a fixed-length body whose header disagrees instead, and
  says which in the summary.
- **Visitor-visible check:** the early 413 has the same status, body and log outcome as the
  post-read 413 it replaces, and only bodies already rejected reach it (a real request's
  `Content-Length` equals its body length). The order of checks is unchanged: method, origin and
  content type come first, as in contact.

### [x] W3. `stripJsonc` in `scripts/lib/jsonc.ts`

- **Files:** new `scripts/lib/jsonc.ts` (the string-aware `stripJsonc` moved verbatim from
  `contact-shared.ts`, erasable TypeScript only, since `node scripts/e2e-wrangler-config.ts`
  runs it with Node's type stripping); `scripts/setup-check/checks/contact-shared.ts` (delete the
  function, import it for its own use at L83); `scripts/e2e-wrangler-config.ts`;
  `tests/unit/setup/drift.test.ts` and `tests/unit/site/config-files.test.ts` (delete
  `stripJsonComments`, import `stripJsonc`); `tests/unit/setup-check/checks/strip-jsonc.test.ts`
  (import path and header comment).
- **Test:** existing, **unit layer**: `strip-jsonc.test.ts` follows the move and stays green; it
  is seen to fail once on the old import path removed and pass on the new one. `drift.test.ts` and
  `config-files.test.ts` stay green (the shared reader is strictly more capable: string-aware and
  trailing commas). Acceptance 5's hash check shows the E2E config output is unchanged.

### [x] W4. One walker helper in `tests/helpers/files.ts`

- **Files:** new `tests/helpers/files.ts` (`filesUnder(dir): string[]`, absolute file paths from
  `readdirSync(dir, { recursive: true, withFileTypes: true })`; imports neither Vitest nor
  Playwright, like `headers.ts`, so specs can use it). Replace the walker in:
  `tests/unit/ci/changed-paths.test.ts`, `tests/unit/ci/content-tier.test.ts`,
  `tests/unit/site/csp.test.ts`, `tests/unit/site/diagram-fonts.test.ts`,
  `tests/unit/site/design-source.test.ts`, `tests/unit/site/font-coverage.test.ts`,
  `tests/unit/site/font-files.test.ts`, `tests/unit/content/content-helper.test.ts`,
  `tests/unit/content/no-real-content-in-tests.test.ts`,
  `tests/unit/content/projects-content.test.ts`, `tests/helpers/content.ts`,
  `tests/build/fixture-site.ts`, `tests/build/drafts.test.ts`,
  `tests/build/question-source.test.ts`, `tests/build/indexing.test.ts`,
  `tests/build/local-site.test.ts`, `tests/e2e/diagram-fonts.spec.ts`.
  (`tests/unit/content/sample-posts.test.ts`, named in the exploration, reads one folder flat and is
  not a walker; it is left alone.)
- **Per-site filters kept:** `changed-paths` keeps its extension regex and its `anyExt` mode, and
  filters out any path with a `node_modules`, `dist` or `.astro` segment (its roots hold none
  today, checked in the plan phase, but the skip stays a rule); `content-tier` and
  `content-helper` drop paths with an `images` segment; `content-helper` and `content.ts` drop
  `_`-prefixed files and `content.ts` also drops `broken/`; `content.ts` keeps its sorted,
  relative-to-`dir` output exactly (sort per segment as before, or prove with the scratch diff that
  a plain sort of the relative paths gives the same order for every collection and fixture folder).
- **Test:** `no behaviour: n/a (test plumbing; each converted site must yield the same file list,
  checked by the scratch diff in acceptance 6, and its own tests stay green)`. Targeted runs: the
  10 unit files plus `pnpm run test:unit` (every user of `tests/helpers/content.ts`),
  `vitest run --project build <file>` for the four build test files (which exercise
  `fixture-site.ts`), and
  `playwright test tests/e2e/diagram-fonts.spec.ts` after a build.

### [x] W5. Remove `futureDestinations` and the page `reserved` input

- **Files:** `src/config/navigation.ts` (delete `futureDestinations` and its comment; the
  `fixedPrimaryNavigation` comment becomes "Primary entries whose pages are built by code routes,
  not page files" or similar); `src/pages/[...slug].astro` (drop the import and the argument);
  `src/lib/content/addresses.ts` (drop `reserved` from `AddressInputs`, its check and the doc
  comment's "or reserved for a later feature"); tests below; `docs/testing.md` row 14 (W7).
- **Test:** existing tests updated; deleted cases mapped. **Unit layer** for the address rule,
  build layer for the call-site wiring as now.

| Removed | Now |
|---|---|
| `addresses.test.ts` "fails for reserved address %s" (`/writing/`, `/projects/`, `/contact/`) | `/writing/` and `/projects/` are claimed by the route files `writing/index.astro` and `projects/index.astro`. The "row 14: page addresses against the real route files" test gains `writing.mdx` and `projects.mdx`, each expected to throw naming the route file (they pass on today's code too, so this keeps the guarantee rather than adding behaviour). `/contact/` is the contact page itself (`contact.mdx`), so no other page can take it: a second file at that address is caught by the duplicate-id check in `generateId`. |
| `addresses.test.ts` `reserved: ["/writing/"]` in "accepts distinct addresses", the `reserved` default in `check`, `reserved: futureDestinations` in row 14 | Inputs only; the assertions stay. |
| `tests/unit/site/navigation.test.ts` `describe("futureDestinations")` (2 tests) | The guarantee is gone with the feature: there is no list to keep empty or disjoint from built pages. |
| `tests/unit/content/navigation.test.ts` L85 `expect(futureDestinations).not.toContain("/writing/")` | Gone with the feature; the rest of that test (Writing is a fixed entry at `/writing/`, position 4) stays. |
| `tests/e2e/shell.spec.ts` "a future destination is an ordinary link that serves the not-found status" and "… loads the not-found page" (both skipped since the list emptied), the `NO_FUTURE` constant and the import | Gone with the feature: no header link points to an unbuilt page. Not-found status and page for unknown addresses stay in `not-found.spec.ts`. |
| `tests/e2e/not-found.spec.ts` `...futureDestinations` in `NOT_FOUND_ADDRESSES` | Spread of an empty list; the addresses checked are unchanged. The header comment's "unbuilt nav destinations" is dropped. |
| `tests/build/page-validation.test.ts` needle `assertPageAddressesFree({ pageFiles, routeFiles, reserved` | Needle becomes `assertPageAddressesFree({ pageFiles, routeFiles` and the replacement `assertPageAddressesFree({ pageFiles, routeFiles: []`; the `patched` assertion still proves the override matched. |

### [x] W6. Small items

- **Files:** `src/lib/content/addresses.ts` (add `projectHref(id: string): string` beside
  `postHref`); `src/lib/projects.ts` (delete `addressOfProject`); `ProjectRow.astro`,
  `project-replacement.ts`, `tests/helpers/content.ts` (use `projectHref`);
  `src/lib/site-origin.ts` (`export type SiteOriginEnv = BuildEnv;`);
  `src/components/project/ReadingProgress.astro` (comment: the fill is a CSS scroll-driven
  animation in `portfolio.css`, hidden where `animation-timeline` is unsupported).
- **Test:** `projectHref`: new-first, **unit layer**, in `tests/unit/content/addresses.test.ts`
  next to the `postHref` test (`projectHref("x")` is `/projects/x/`). Existing project row,
  replacement and indexing tests stay green, showing the rendered hrefs are unchanged.
  `SiteOriginEnv`: `no behaviour: n/a (type alias; typecheck and site-origin.test.ts cover it)`.
  The `| undefined` that `BuildEnv` adds changes nothing, since the project does not set
  `exactOptionalPropertyTypes`; if typecheck disagrees, the implementer says so and keeps the alias by adjusting the call
  site, not the interface. ReadingProgress: `no behaviour: n/a (comment)`.

### [x] W7. Docs

- **Files:** `docs/testing.md` row 14 ("Address used by a route" only; drop "or reserved" and the
  "fails for reserved address %s" test name; name the widened row 14 real-route test).
- **Test:** `no behaviour: n/a (docs)`. `docs-*.test.ts` files that read `docs/testing.md` stay
  green.

## Docs citations (Principle IV)

- Node.js `fs.readdirSync(path, { recursive, withFileTypes })`:
  https://nodejs.org/docs/latest-v24.x/api/fs.html#fsreaddirsyncpath-options. `recursive` lists
  every nested entry; it does not prune, so filters run on the result. Confirmed in the plan phase
  on Node v24.4.1 (the `.nvmrc` major; `engines` is `>=24`).
- Node.js `Dirent.parentPath`:
  https://nodejs.org/docs/latest-v24.x/api/fs.html#direntparentpath (the directory of each entry
  when listing recursively; used instead of the deprecated `dirent.path`).
- Node.js TypeScript type stripping (why `scripts/lib/jsonc.ts` stays erasable syntax):
  https://nodejs.org/docs/latest-v24.x/api/typescript.html.
- Workers `Request` (the body is a `ReadableStream`, headers include `Content-Length` when the
  client sends one): https://developers.cloudflare.com/workers/runtime-apis/request/.
- Workers Streams, `ReadableStream.getReader()` and `cancel()`:
  https://developers.cloudflare.com/workers/runtime-apis/streams/readablestream/.
- Workers request body limits (the platform cap sits far above both endpoint caps, so the
  Worker's own cap is what applies): https://developers.cloudflare.com/workers/platform/limits/#request-limits.
- MDN `Content-Length` (it is the body's size in bytes, so a declared length over the cap means
  the body is over the cap): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Length.

## Risks

- **Worker program pulls in `src/lib/questions/source.ts`.** A type-only import still adds the file
  to `tsc -p worker`, and that file imports `node:crypto`. The plan-phase spike typechecked clean,
  but a later change to `source.ts` could break the Worker typecheck. Mitigation: the import is
  `import type`, so nothing reaches the bundle; `verify:quick` runs `tsc -p worker`.
- **Recursive listing does not prune.** A walker root that one day holds `node_modules` would be
  listed in full. Today's roots hold none (checked). `changed-paths` keeps its segment filter.
- **Order of `readEntries`.** `tests/helpers/content.ts` sorted per directory level. A plain sort of
  relative paths can order `a/x.mdx` and `a-b.mdx` differently. The scratch diff (acceptance 6)
  catches it; keep segment-wise ordering if it differs.
- **workerd and a hand-set `Content-Length`.** If the test pool rewrites the header for a streamed
  body, the W2 test needs the fallback named there.
- **Parallel worktrees** collide on ports 4321/4322 during Playwright and build tests. Check
  `lsof -i :4321` before the E2E runs and rerun once on mass `ECONNREFUSED`.
