# Chore plan: prune-restating-tests (issue #97)

Branch: `chore/prune-restating-tests`, at `main` (e3c9aeb, after #110 merged).
Issue: https://github.com/drcdev/dcc-web/issues/97. The PR body says `Closes #97`.

## Goal

[#97](https://github.com/drcdev/dcc-web/issues/97): some unit tests check wording or literal
values, not behaviour. Examples are the setup-walkthrough skill's phrasing, the copy on About and
Home, "adds script X" checks left from feature delivery, and security config tests that restate
the config text exactly. A wording, content or config edit then fails the gate and needs a
matching test edit, while a real regression can still pass. Every pull request now needs Don's
approving review (Principle III, PR #105), so a config change is reviewed anyway. This chore
removes those change-detectors and keeps every invariant the issue lists. It also deletes the
15 MB of Ghost reference screenshots, whose design has been replaced. No page, component, style,
script, Worker, workflow or site configuration value changes. `playwright.config.ts` changes
shape only: its project membership stays the same.

## Acceptance

Mechanical criteria, each checked by the review phase. "Before" was measured on e3c9aeb.

1. **Ghost reference gone.** `tests/reference/` does not exist (before: 15 files, 15 MB,
   `du -sh`). `package.json` has no `reference:capture` script.
   `git grep -n 'tests/reference\|reference:capture' -- ':!specs' ':!.specify/chores'` matches
   only `docs/design-source.md` (before: 5 files, namely `package.json`, `config-files.test.ts`,
   `reference-screenshots.test.ts` and the two files in `tests/reference/`).
2. **Files removed.** `tests/unit/site/reference-screenshots.test.ts` and
   `tests/unit/site/nav.test.ts` are deleted. `find tests/unit -name '*.test.ts' | wc -l` goes from
   124 to 122.
3. **Literal change-detectors gone.** Each `grep -c` reads 0 after (before in brackets):
   - `headers.test.ts` + `tests/e2e/headers.spec.ts`:
     `strict-origin-when-cross-origin|camera=\(\)|"same-origin"` [6]
   - `csp.test.ts`: `"img-src 'self' data:"|insertScriptResource` [2]
   - `config-files.test.ts` + `config-mdx.test.ts`:
     `dcc-web-preview|17 3 |4\.144\.0|reference:capture|"\./dist"|127\.0\.0\.1:4321|maxDiffPixelRatio|satteri` [16]
   - `workflows.test.ts`: `retention-days|fetch-depth|cancel-in-progress|\^name:` [4]
   - `drift.test.ts`: `Turnstile Sites Read|PUBLIC_TURNSTILE_SITE_KEY` [2]
   - `skill-behaviour.test.ts` (case-insensitive):
     `Western North America|Skip for now|registry length|dnssec|Problem:` [10]
   - `launch-content.test.ts` + `tests/e2e/pages.spec.ts` (case-insensitive):
     `cchl-ccls|about me|Recognition|intellectual property|past talks|what I do|I help` [20]
   - `playwright.config.ts`: `blog-pagination` appears once [2], and so does each of the other
     four fixture-site patterns.
4. **Invariants still checked.** These tests exist after the chore, by title or by an equivalent
   one the implementer names in the summary:
   - skill: mutating commands only in "shown for Don to run himself" blocks (both fenced-block
     tests), the forbidden commands, the allowed read-only commands, never signs in or changes DNS
     or handles credentials;
   - launch pages: each page exists, passes the page schema, has its draft flag and nav position;
     Home's nav label; no cookie policy page; only registered sections; the privacy policy block;
     Technology names no storage location;
   - CSP: no forbidden or development-only source (`'unsafe-inline'` among them), external origins
     only from the allow-list, the theme-script hash matches the file, no Web Analytics code;
   - headers: never a cookie, the header CSP has no script or style source, never `no-transform`,
     `robots.txt` has no Disallow, the noindex host rules, only `/_astro/*` sets Cache-Control and
     it is immutable, no `public/_astro/`, the SVG policy is sandboxed and minimal, every security
     header is present on `/*`;
   - config: invocation logs off, no secret-looking vars, production off workers.dev and version
     URLs, production never allows Turnstile testing keys, the e2e config never carries the flag,
     Worker only for `/api/*`, one DB per environment with a separate preview DB, two distinct real
     database ids, migrations applied by the deploy scripts, AI never remote, a cron in both
     environments, no adapter, Vitest includes unit and component tests, retries 0, snapshots never
     auto-update, every spec in exactly one Playwright project, the exact `verify` sequence,
     `verify:quick` members all run by `verify`, every Vitest and Playwright project covered by the
     scripts, `test:e2e` runs every project, `test:a11y` and `types:worker` exist, `.env.example`
     values empty, worker tsconfig strict, worker ESLint `no-floating-promises`, typecheck covers the
     worker, additive migrations, `.cache/` ignored, e2e env holds public test values only;
   - workflows: read-only permissions, actions pinned to a SHA (both files), `--frozen-lockfile`
     (both), no `continue-on-error` and only `GITHUB_TOKEN` (both), each verify member exactly once,
     `verify` always runs and needs every job, build tests fail closed to `test:build`, secretlint on
     every path, no `paths` filters, the baselines workflow never commits or pushes, the preview crawl
     sees only `GITHUB_TOKEN`;
   - drift: registry and docs one to one, every secret and variable name in the manifest (now also
     `secrets.required` of both environments), ruleset contexts, launch doc links.
5. **Real-content guard covers pages.** `no-real-content-in-tests.test.ts` builds page needles from
   `pages` (W4) and its self-test flags a page snippet. It passes over `tests/e2e`, `tests/build`
   and `tests/unit/content`.
6. **E2E headers.** `playwright test --list --project=e2e tests/e2e/headers.spec.ts` lists 2 tests
   (before: 16). The implementer records the before and after `--list` totals for each Playwright
   project (before: all projects 1540 tests in 31 files; `e2e` 667 in 21 files; `pages.spec.ts` 53).
7. **Unit counts.** The 12 in-scope unit files ran 329 tests before (all passing, `vitest run
   --project unit <files> --reporter=json`: workflows 36, launch-content 30, guard 77, config-files
   52, config-mdx 7, csp 20, headers 22, nav 5, navigation 17, reference-screenshots 27, drift 16,
   skill-behaviour 20). The summary records the after figure per file and for `--project unit` as
   a whole.
8. **Gates.** `pnpm run verify:quick` is green after every work item, and so are the targeted files
   of the item. W6 and W3 also run their Playwright specs. The full `pnpm run verify` is green before
   the PR (the orchestrator asks Don first).
9. **Diff scope.** `git diff --name-only main` lists only `tests/**`, `playwright.config.ts`,
   `package.json` (the one script line), `docs/testing.md`, `docs/design-source.md` and
   `.specify/chores/prune-restating-tests/**`. Nothing under `src/`, `public/`, `worker/`,
   `scripts/`, `.github/`, `.claude/` or `setup/`. No snapshot PNG changes.

## Scope

### How an assertion is handled

1. **Kept invariant.** A rule that must hold whatever the config says: no `'unsafe-inline'`, no
   cookie, read-only permissions, every spec in one project. Kept, or reworded so it no longer
   pins a literal (for example "the allow-list" becomes "a subset of the allow-list").
2. **Covered elsewhere.** The same guarantee is asserted at another layer. The mapping names it.
3. **Change-detector, no guarantee.** The test restates text, copy or a config value. A change to
   that text is a deliberate edit, and Don reviews every pull request, so the test catches nothing
   review does not. Deleted.

### In scope

| File | Change |
|---|---|
| `tests/unit/setup/skill-behaviour.test.ts` | keep the safety assertions only (W1) |
| `tests/reference/**`, `package.json` (`reference:capture`), `tests/unit/site/reference-screenshots.test.ts`, `config-files.test.ts` (the `reference:capture` test), `docs/design-source.md` | Ghost reference removal (W2) |
| `tests/unit/content/launch-content.test.ts`, `tests/e2e/pages.spec.ts` (copy checks only) | structure only (W3) |
| `tests/unit/content/no-real-content-in-tests.test.ts` | page needles (W4) |
| `tests/unit/site/csp.test.ts`, `tests/unit/site/headers.test.ts`, new `tests/helpers/headers.ts` | invariants only (W5) |
| `tests/e2e/headers.spec.ts` | one HTML page and one `/_astro/` asset (W6) |
| `tests/unit/site/config-files.test.ts`, `tests/unit/site/config-mdx.test.ts` (L12, L19 literal) | invariants only (W7) |
| `tests/unit/ci/workflows.test.ts`, `tests/unit/setup/drift.test.ts` | invariants only, one drift check widened (W8) |
| `playwright.config.ts`, `config-mdx.test.ts` (L31), `tests/unit/site/nav.test.ts`, `tests/unit/site/navigation.test.ts` | shared pattern constant, `isCurrent`/`isInSection` merge, tombstones (W9) |
| `docs/testing.md` | headers, About and Home rows, guard, a short rule (W10) |

`tests/e2e/pages.spec.ts` is not named in the issue. It is in scope because it repeats the About
and Home copy checks the issue removes from `launch-content.test.ts`, and the widened guard (W4)
would flag its CCHL links and its `"What I do"` heading. `config-mdx.test.ts` is not named either.
Its L31 regex reads the Playwright `testMatch` literal and would break on the W9 constant, and its
L12 `verify` and L19 `satteri` literals are the same "adds X" pattern.

### Out of scope

- `tests/unit/content/navigation.test.ts` (`mergeNavigation`): a different file from the issue's
  `navigation.test.ts`, which is `tests/unit/site/navigation.test.ts`.
- The navigation config literals in `tests/unit/site/navigation.test.ts` (exact primary, footer
  and social lists, `futureDestinations` equal to `[]`). The issue asks only for the `isCurrent`
  merge and tombstones there. Navigation is design identity (a Principle III criterion), so pruning
  its pins is a separate decision.
- `tests/unit/site/privacy-policy.test.ts`: it mirrors data handling (Principle VII) on purpose.
- `tests/unit/site/design-source.test.ts`: it restates `docs/design-source.md` prose (19 mapping
  rows, verbatim Flux names). W2 edits that doc and keeps the test green, and pruning it is listed
  below as a follow-up.
- Major-change gate tests: #85 (PR #105) deleted them. `git grep major-change tests scripts .github`
  is empty.
- `test:a11y` and `types:worker` stay in `package.json` (the issue: documented manual commands).

### Follow-ups for the PR body (not done here)

- **F1. Borderline tombstones left in place.** `tests/unit/site/deploy-preview.test.ts` L99 ("says
  dcc-web no longer builds non-production branches") and `tests/unit/setup/docs-structure.test.ts`
  L122 ("… and no longer says 18") assert documentation prose. `tests/unit/site/site-origin.test.ts`
  L25 ("no longer reads reviewHost") is behaviour (a main build ignores `reviewHost`), not a
  tombstone. The `projects-content.test.ts` L25 "removed settings" and `projects-guide.test.ts`
  L70 to L83 checks guard the schema and the guide. The `config-files.test.ts`
  `not.toHaveProperty` checks are live invariants. None of these is plainly a "no longer exports"
  tombstone, so they stay.
- **F2. `design-source.test.ts`** restates `docs/design-source.md` (row count, verbatim names,
  URL list). A follow-up can cut it to the headings and the `.reference` leak checks.
- **F3. Navigation config literals** in `tests/unit/site/navigation.test.ts` (see Out of scope).
- **F4. `docs-structure.test.ts`, `setup/items.test.ts` and `launch-doc.test.ts`** assert
  `docs/setup.md` and `docs/launch.md` prose in the same way the skill test did. They were not
  named in #97.
- **F5. Page draft flags.** The issue keeps "the expected draft flag" for each launch page, so
  publishing a page still needs a one-line edit in `launch-content.test.ts`. #55 removed that for
  posts and projects. A follow-up can read the flag through the helper the same way.
- **F6. `config-mdx.test.ts` remainder** (`@astrojs/mdx` and `@astrojs/rss` exact-version format,
  `mdx()` registered, `tests/build/**` included, `.cache/` ignored by ESLint) can fold into
  `config-files.test.ts` or go.

## Constitution Check

- **I. Test-First:** tests only. Pure deletions need no failing test. Each rewritten or new
  invariant (the CSP allow-list subset, header presence, the drift `secrets.required` check, the
  guard's page needles, the shared `_headers` reader) is seen to fail on a scratch edit before the
  item is done. The implementer reverts the edit and records it in the summary. Kept invariants
  satisfy Principle I's build-configuration tests.
- **II. Automated Release Gate:** this dedicated, reviewed chore is the separate change that
  Principle II asks for when a test is wrong. No check of a behaviour is skipped, disabled or
  weakened. Every removed assertion is mapped below to its new home or recorded as a
  change-detector. CI workflows are unchanged.
- **III. Human Review for Major Changes:** **none fire.** PR #105 retired the separate gate: every
  pull request needs Don's approval, and a major change is a classification flagged in the PR body.
  - No dependency, integration or service is added, removed or replaced. Removing
    `reference:capture` removes a manual script, not a dependency: it ran `@playwright/test`, which
    stays. No package changes in `package.json` `dependencies` or `devDependencies`.
  - Contact data handling is untouched.
  - No design-system, layout, navigation or visual change, and no baseline PNG change. The Ghost
    screenshots were a reference for the original port. They are not baselines, and nothing reads
    them except the test this chore deletes.
  - No running-cost change (slightly less CI time).
  - CI, deployment and infrastructure configuration are unchanged: `.github/`, `wrangler.jsonc`,
    `scripts/deploy/`, the `public/_headers` contract and `setup/github-ruleset.json` are not
    edited. `reference:capture` was never called by CI or a deploy. `playwright.config.ts` keeps
    exactly the same project membership. W9 checks this with `playwright test --list` per project
    before and after, and "every spec in exactly one project" stays.
  - The constitution is not amended.
- **IV. First-Party Before Custom:** no Astro or Cloudflare feature is chosen, so no Astro Docs
  MCP lookup is needed. Playwright's own array form of `testMatch`/`testIgnore` holds the shared
  constant. The launch pages are checked with the site's own `pageSchema`, as
  `page-schema.test.ts` does. Docs are cited below.
- **V. Static by Default:** no site change. The "no adapter" test stays.
- **VI. Content as Files:** strengthened. The guard now also stops tests from pinning page copy.
- **VII. Private Data:** no change. The privacy-policy data-handling assertions, invocation logs
  off, separate preview database and no secret-looking vars all stay.
- **VIII. Cloudflare Best Practices:** no change. Worker only for `/api/*`, production off
  workers.dev, `no-floating-promises` on the Worker and HTTPS-related headers stay asserted.
- **IX. Cost Ceiling:** no change. CI time drops a little (14 e2e header tests and about 120 unit
  tests fewer).
- **X. Accessible, Fast and Private:** the a11y, budget, CSP-violation and no-cookie checks stay.
  No tracking change.
- **XI. Spec Kit Workflow:** a `/chore` branch. The plan lives in
  `.specify/chores/prune-restating-tests/`.
- **Security Baseline:** the `_headers` contract keeps unit invariants and a served-response check.
  The ruleset and Dependabot are untouched.
- **Development Workflow, test placement:** each item names its layer. The e2e headers spec keeps
  only what only the real server shows (`_headers` applied by `wrangler dev`). The rule text
  lives at the unit layer. No behaviour gains a second layer.

## Work items

Order: the skill and the reference removal first (independent), then content (W3 before the
guard W4), security config, the e2e spec, config and CI, the Playwright constant and nav, and
docs last. Each item leaves `verify:quick` green, along with its targeted files:
`corepack pnpm exec vitest run --project unit <files>` for unit tests, and
`corepack pnpm exec playwright test <files> --project=e2e` after `corepack pnpm run build` for e2e.

### W1. Skill behaviour: safety assertions only (done)

- **Files:** `tests/unit/setup/skill-behaviour.test.ts`.
- **Test:** existing, pruned, **unit layer** (it reads one file). The file keeps reading
  `.claude/skills/setup-walkthrough/SKILL.md`, so `changed-paths.test.ts`'s READ_BY_CHECKS entry
  for that file stays true.
- **Keep:** L27 allowed read-only commands; L41 forbidden commands and debug or verbose flags; L79
  every mutating example lies in a block introduced as "shown for Don to run himself"; L133 the
  d1 create, d1 delete and secret put examples lie only in such blocks; L202 never signs in,
  changes DNS or handles credentials (a safety rule the issue's list implies; recorded as a
  judgment call).
- **Coverage mapping:**

| Removed (line) | Now |
|---|---|
| L11 confirms through `setup:check --json --item` | L27 requires `pnpm setup:check` among the allowed commands. The flag spelling is wording. |
| L15 mutating commands "shown for Don" somewhere | Covered by L79 (stricter: each block is introduced that way), and L133 asserts examples exist. |
| L49 three labelled parts in order, L58 three answers, L64 `Problem:` first, L70 rollback, L75 DNSSEC, L112 halt-rule phrasing, L120 registry length, L125 D1 region text, L159 `d1 list --json` text, L164 contact item order, L182 after-merge rule, L188 waiting step, L192 launch hand-over | Change-detector, no guarantee: skill wording and step order. The order of the items is `scripts/setup-check/items.ts`, checked by `setup/items.test.ts`. The launch hand-over ids are checked by `drift.test.ts` (launch doc ids are registry ids). Don reviews every skill edit. |

### W2. Ghost reference screenshots removed (done)

- **Files:** delete `tests/reference/` (`capture-ghost.spec.ts`, `playwright.config.ts`,
  `ghost/README.md` and 12 PNGs) and `tests/unit/site/reference-screenshots.test.ts`. Remove the
  `reference:capture` line from `package.json` and the "adds reference:capture" test (L416) from
  `config-files.test.ts`, in the same commit. Edit `docs/design-source.md`.
- **Test:** `no behaviour: n/a (deletes a design reference and its file-shape test; no site
  behaviour reads them)`. `design-source.test.ts` must stay green.
- **`docs/design-source.md`:** add one short paragraph at the end of "How to get Flux", before
  "Mapping". It must not go after "Accessibility adjustments", because `design-source.test.ts`
  reads that section to the end of the file and counts its table rows. It must not be a table row
  under "Mapping", because the test counts 19 rows. The paragraph says that the Ghost reference
  screenshots (home, a post and About at phone and desktop width, both themes) and their capture
  script lived in `tests/reference/` until #97, that the design they captured has been replaced,
  and that the last commit holding them is `e3c9aeb` (`git show e3c9aeb:tests/reference/ghost/README.md`).
- **Checks:** `git grep` from Acceptance 1; `vitest run tests/unit/site/design-source.test.ts
  tests/unit/site/config-files.test.ts`; `tsc`/`astro check` through `verify:quick` (the deleted
  `.ts` files were type-checked).
- **Coverage mapping:**

| Removed | Now |
|---|---|
| `reference-screenshots.test.ts` (12 PNGs exist, valid, widths) | Change-detector, no guarantee: it checked a frozen reference, not the site. |
| `config-files.test.ts` "adds reference:capture" | Deleted with the script. |

### W3. Launch pages: structure only; page copy out of the e2e pages spec (done)

- **Files:** `tests/unit/content/launch-content.test.ts`, `tests/e2e/pages.spec.ts`.
- **Test:** existing, pruned, **unit layer** for the page files (it reads files and builds
  nothing); `pages.spec.ts` stays **e2e** for what it keeps.
- **launch-content keeps:** the `LAUNCH` table (file, nav position, draft) and its loop (L33); Home
  is labelled Home (L45); no cookie policy page (L68); the "Privacy policy (FR-022, FR-022a)"
  block (L127 to L157, data handling); Technology asserts no storage location (L178, data handling,
  a judgment call); only registered sections (L202).
- **launch-content adds:** every `LAUNCH` page's front matter passes `pageSchema` (from
  `src/content/schemas/page.ts`, with `image: () => z.string()` as in `page-schema.test.ts`). The
  front matter is read through `pages` from `tests/helpers/content.ts`, matched by file, or the
  file's own parse if the implementer finds the helper's Date values clash with the schema. Seen to
  fail by a scratch edit that breaks one page's front matter (for example drops `title`), then
  reverted.
- **pages.spec removes:** "About shows the About me section and the Recognition links" (L114);
  in "the text below the card…" (L164) the `I help` and `what I do` lines go and the
  no-button-style-link check stays; "Recent writing comes after the body text" (L209) is rewritten
  so that `[data-recent-writing]` follows the body content in document order, with no heading
  text; in L221 the About half (two series links in About's body) goes and the Home Recent writing
  series links stay (they come from `src/config/topics.ts`, not copy).
- **Coverage mapping:**

| Removed | Now |
|---|---|
| launch-content L49 Home has no `<CallToAction` | Change-detector, no guarantee: an authoring choice. The intro card's call to action is checked by `pages.spec.ts` "the call to action navigates to /services/". |
| L53 Home intro keys, photo path, alt, CTA href | The new schema check (shape, alt required) and `pages.spec.ts` home introduction card (image, alt, links, CTA to /services/). |
| L62 Home body wording; Services L76, Speaking L85, About L97 to L124, Terms and Technology L162, L173, L182, Speaking Figure L209 | Change-detector, no guarantee: page copy. Draft pages show a review notice (`pages.spec.ts`), and Don reviews every page edit. |
| pages.spec About me and Recognition links (L114) | Change-detector, no guarantee: About copy. The page template's generic checks stay (one h1, landmarks, title and canonical, no sideways scroll). |
| pages.spec Home "I help", "what I do" | Change-detector, no guarantee. |
| pages.spec About links to both series | Change-detector, no guarantee: About copy. |

### W4. Real-content guard covers pages

- **Files:** `tests/unit/content/no-real-content-in-tests.test.ts`.
- **Test:** existing, widened, **unit layer**. New-first: the self-test gains a page snippet and is
  seen to fail before the needles are added.
- **Needles for pages** (from `pages` in the helper, so no upkeep):
  - each external link (`](https://…)`) in a page body, as a plain substring;
  - each body heading (`##` to `######`, `**` stripped) of two words or more, as a quoted string
    literal (`"…"`, `'…'`, `` `…` ``).
- **Not needles, with the reason in a comment:** page addresses, file names and titles. They are
  routes and navigation labels ("About", "Contact", "/privacy-policy/", "Don Coleman" as the site
  name). Navigation and shell tests use them as site configuration, and `navigation.test.ts`,
  `addresses.test.ts` and `launch-content.test.ts` use page file names as inline examples or as
  the launch list. Single-word headings ("Contact", "Security", "Site") are left out because they
  collide with labels and comments. Unquoted heading text is left out because comments use the
  same phrases ("The contact form", "Visitor statistics").
- **Self-test:** a snippet holding a quoted multi-word heading of a real page and one of its
  external links is flagged; a neutral snippet is not.
- **Scanned folders:** unchanged (`tests/e2e`, `tests/build`, `tests/unit/content`). After W3 no
  file there matches. If one does, the implementer either removes the copy assertion (the W3
  rules) or, when it is not copy, records why and narrows the needle.
- **Coverage mapping:** none removed.

### W5. CSP and `_headers` unit tests: invariants only

- **Files:** `tests/unit/site/csp.test.ts`, `tests/unit/site/headers.test.ts`, new
  `tests/helpers/headers.ts` (the `rules()` parser moved out of `headers.test.ts`, exported as
  `headerRules()`, with no Vitest or Playwright import so W6 can reuse it).
- **Test:** existing, pruned, **unit layer** (reads config and a text file). Rewritten tests are
  each seen to fail on a scratch edit (add `https://example.com` to `connect-src`; drop
  `X-Frame-Options` from `/*`), then reverted.
- **csp.test.ts keeps:** the theme-script hash (L104), forbidden or development-only sources
  (L111), no Web Analytics code (L152). **Rewrites:** L134 becomes "every external origin in the
  policy is in the allow-list (`https://static.cloudflareinsights.com`,
  `https://cloudflareinsights.com`)", a subset, not set equality.
- **headers.test.ts keeps:** SVG policy minimal and sandboxed (L51); no Cache-Control on any other
  rule (L71); no `public/_astro` (L79); no X-Robots-Tag on `/*` (L83); never a cookie (L121);
  header CSP without script or style sources (L126); never `no-transform` (L134); robots.txt
  (L145). **Rewrites:** L60 and L87 become "every host rule other than the live domain, and the
  question-source rule, sets `X-Robots-Tag: noindex`" (the value, not "and nothing else"); L67
  becomes "`/_astro/*` sets an immutable Cache-Control" (`toContain("immutable")`); L95 and L107
  become one test: `/*` sets each of the seven security headers (presence, by name; adding a
  header is allowed).
- **Coverage mapping:**

| Removed | Now |
|---|---|
| csp L60 exact equality of directives, resources, hashes and keys | Change-detector, no guarantee: the forbidden-source test, the allow-list subset and the hash test hold the safety rules. A widened policy is a reviewed config edit. |
| csp L78 per-directive exact sources | Same as above. |
| csp L97 questions panel reaches `/api/questions` through `connect-src 'self'` | `tests/e2e/questions.spec.ts` runs the panel against the real policy; the allow-list subset forbids any extra API host. |
| csp L167 and L173 Turnstile source text in `contact-csp.ts` and the page route | `tests/e2e/contact.spec.ts` L60 to L62: the served contact policy has the Turnstile script and frame sources, and Home's does not. |
| csp L178 only two files name the Turnstile host | `contact.spec.ts` L62 (Home keeps the site policy) and `tests/build/local-site.test.ts` "leaves every project page, the index and other pages on the site policy, with no frame source". |
| headers L39 exactly six rules in order | Change-detector, no guarantee: the rules' invariants are each kept. |
| headers L47 SVG rule equals one exact value | L51 (sandboxed, no script, no `'self'`, no `https:`). |
| headers L60, L87 "and nothing else" | Rewritten to the noindex value; L71 still forbids Cache-Control outside `/_astro/*`. |
| headers L67 exact Cache-Control | Rewritten to immutable; W6 checks the served header. |
| headers L95 seven exact values, L107 exact header set | Rewritten to presence of the seven headers. Values are a reviewed config edit; W6 checks that the served values equal the rule. |

### W6. E2E headers: one HTML page and one `/_astro/` asset

- **Files:** `tests/e2e/headers.spec.ts`.
- **Test:** existing, cut to 2 tests, **e2e layer**: only the real server shows that `wrangler dev`
  applies `public/_headers` to Astro's real output. The expected values come from
  `public/_headers` through `tests/helpers/headers.ts` (W5), so the spec restates no value.
- **Test 1, the home page `/`:** 200; every header of the `/*` rule is served with the rule's
  value; no `set-cookie`; no `x-robots-tag` (local host); Cache-Control not immutable. In the
  browser: one CSP meta tag; no `'unsafe-inline'` in it; the pre-paint theme script is the one
  script before the meta tag and its SHA-256 is in `script-src`; after load and a theme toggle,
  no CSP violation (`recordCspViolations`), no CSP console error and no page error.
- **Test 2, one asset:** the first `link[rel="preload"][as="font"]` on `/`, under `/_astro/fonts/`.
  It is a nested path, so it also shows the `/_astro/*` splat reaching below `/_astro/`. Checks:
  200; Cache-Control equals the `/_astro/*` rule; every `/*` header is served with its value; no
  `set-cookie`.
- **Checks:** `playwright test --list` shows 2 tests in the file; the spec passes against the
  built site.
- **Coverage mapping:**

| Removed | Now |
|---|---|
| RESPONSES loop over `/nope/`, `/projects/`, the picked story, `/robots.txt`, `/sitemap-index.xml`, `/og-default.png` | Change-detector of the host: `/*` matches every path by the `_headers` rules (Cloudflare docs). Test 1 shows the rule applied by the real server, and the unit test holds the rule. |
| First stylesheet asset test | Test 2 (a nested `/_astro/` path). |
| CSP meta loop over four pages | Test 1 on `/`. The meta comes from one config on every page: `csp.test.ts` checks the config, `local-site.test.ts` reads the built policy on several pages, and `recordCspViolations` runs in `blog.spec.ts`, `contact.spec.ts`, `analytics.spec.ts`, `projects-motion.spec.ts` and `projects-fixtures.spec.ts`. |
| `REQUIRED_DIRECTIVES` exact sources | Change-detector, no guarantee: the unit forbidden-source and allow-list tests. |
| Inter font and JetBrains Mono font tests, `content-type: font/woff2` | Test 2 for the immutable header on a font path. The MIME type is Cloudflare's mapping, not `_headers`: change-detector, no guarantee. `fonts.spec.ts` proves the faces load. |
| Every fingerprinted stylesheet and script on `/` and `/contact/` | Test 2 plus the unit rule (one splat for all of `/_astro/`). |
| Home HTML not immutable | Test 1. |

### W7. Config files: invariants only

- **Files:** `tests/unit/site/config-files.test.ts`, `tests/unit/site/config-mdx.test.ts` (L12 and
  the `satteri` literal in L19).
- **Test:** existing, pruned, **unit layer**. Rewritten tests are each seen to fail on a scratch
  edit, then reverted.
- **Keep as is:** L70 production off workers.dev and version URLs; L85 e2e generator never carries
  the flag; L94 Worker only for `/api/*`; L101 one DB per environment, preview named
  `<production>-preview`; L127 two distinct real database ids; L140 migrations applied by the
  deploy scripts and the e2e config; L174 invocation logs off; L179 no secret-looking vars; L195 no
  adapter; L203 Vitest includes unit and component tests; L270 retries 0; L303 snapshots never
  auto-update; L317 every spec in exactly one project; L336 the exact `verify` sequence; L392 and
  L400 every Vitest and Playwright project covered by the scripts; L442 `.env.example` values
  empty; L499 worker ESLint `no-floating-promises`; L528 additive migrations; L538 `.cache/`
  ignored; L543 e2e env holds public test values only.
- **Rewrite:** L80 to "production vars never set `ALLOW_TURNSTILE_TESTING`" (drop the preview
  value); L114 to "the AI binding is never remote in either environment"; L163 to "both
  environments have at least one cron trigger" (the retention job, Principle VII); L348 to
  "every `verify:quick` member is a defined script that `verify` also runs" (drop the exact string
  and member list); L370 to "`test:e2e` runs Playwright with no `--project` filter"; L374 to
  "`test:a11y` exists" (a documented manual command; the budget and visual scripts are covered by
  L400 and the visual-baselines workflow); L489 to "the worker tsconfig is strict" (drop the
  `types` list and root exclude); L515 to "`typecheck` covers the worker (`tsc -p worker`) and
  checks its generated types (`--check`)" plus "`types:worker` exists".
- **Delete:** L62, L66, L75, L121, L149, L159, L168, L186, L236, L275, L289, L294, L308, L342,
  L380, L412, L422, L426, L448, L466, L470, L484. L416 goes in W2. In `config-mdx.test.ts`:
  L12 (duplicate `verify` literal plus `build:fixtures` wiring) and the `satteri` exact
  version in L19 (keep the `@astrojs/rss` exact-format line).
- **Coverage mapping:**

| Removed (line) | Now |
|---|---|
| L62 name, L159 preview name, L66 `./dist`, L186 `404-page`, L75 preview workers.dev on | Change-detector, no guarantee: deploys and e2e use these values, and `not-found.spec.ts` checks the 404 page is served. |
| L121 ASSETS binding and `run_worker_first` again | `run_worker_first` stays in L94. The binding name is type-checked through `wrangler types --check` (L515 rewrite). |
| L149 e2e config without the ai binding | The e2e web server cannot start without it, so every e2e run observes it. |
| L168 three secrets in both environments | W8: `drift.test.ts` checks every `secrets.required` name in both environments against the manifest. |
| L236 4 workers in CI, L275 webServer command, L289 baseURL, L294 five Chromium projects, L308 screenshot defaults | Change-detector, no guarantee: runner tuning. L317, L400, L270 and L303 hold the invariants. |
| L342 `test:build:content` literal | `tests/unit/ci/content-tier.test.ts` checks the file list and the rule. |
| L380 per-layer scripts, L412 `test:visual:update`, L422 `deploy:preview` | L392 and L400 (projects covered). CI and the deploy fail on a missing script. Otherwise a change-detector. |
| L426 styling and sitemap dependencies listed | Change-detector, no guarantee: the build fails without them. |
| L448 `.env.example` names | `drift.test.ts` "every name in .env.example exists in the manifest" and "every local-env manifest entry appears in .env.example". |
| L466 workspace lists worker, L470 worker package devDeps, L484 Vitest 5 and wrangler pinned | Change-detector, no guarantee: `test:worker` fails without the workspace, and versions move with Dependabot and review. |
| config-mdx L12, `satteri` version | `verify` literal kept in L336; `build:fixtures` is run by the Playwright fixture web server. Change-detector otherwise. |

### W8. Workflows and drift: invariants only

- **Files:** `tests/unit/ci/workflows.test.ts`, `tests/unit/setup/drift.test.ts`.
- **Test:** existing, pruned, **unit layer**. The widened drift test is new-first and seen to fail
  on a scratch edit (add a name to `secrets.required` in a copy, or point the check at a fake
  name), then reverted. `.github/` and `wrangler.jsonc` themselves are not edited.
- **workflows keeps:** L67 and L256 `contents: read` (L256 trimmed to permissions only); L75 each
  verify member exactly once; L91 and L269 `--frozen-lockfile` (L269 trimmed to that); L95 and
  L261 actions pinned; L103 and L303 no `continue-on-error`, no `if: false`, only `GITHUB_TOKEN`;
  L150 build tests fail closed to `test:build`; L184 secretlint on every path; L207 `verify`
  always runs and needs every job; L229 no `paths` filters; L296 never commits or pushes; L327 the
  preview crawl sees only `GITHUB_TOKEN`. **Rewrite:** L218 to "no job grants a `write`
  permission" (drop the `checks: read` layout).
- **workflows deletes:** L45, L49, L61, L71, L112, L137, L141, L162, L168, L176, L190, L196, L237,
  L244, L250, L274, L282, L286, L318, L323.
- **drift keeps:** L27, L34, L45 to L100, L104, L121, L131. **Replace** L144 and L154 with one
  test: "every name in `secrets.required` of both environments in `wrangler.jsonc` is a `secret`
  in the manifest, and both environments require the same names". **Delete** L161.
- **Coverage mapping:**

| Removed | Now |
|---|---|
| L45 named CI, L49 job ids and names | The ruleset requires the `verify` context: `drift.test.ts` L104. Other names are a change-detector. |
| L61 triggers, L237 baselines triggers, L244 label guard, L250 head SHA, L323 crawl on pull_request | Change-detector, no guarantee: a missing trigger means the required `verify` check never reports, so the PR cannot merge (fails closed). The baselines workflow has read-only permissions and never pushes (kept). |
| L71 cancel in progress, L137 fetch depth, L141 change detection outputs, L162 needs changes, L168 and L176 job and step gates, L190 unconditional install, L196 Playwright install order, L318 crawl after budget | Change-detector, no guarantee: topology. `changed-paths.test.ts` tests the classifier, and L150 keeps the fail-closed rule. Any mistake turns `verify` red or skips nothing silently, since `verify` needs every job (L207). |
| L112 upload on failure, L274 build before update, L282 update script, L286 artifact name and retention | Change-detector, no guarantee: debugging artifacts. |
| L218 exact permission layout | Rewritten: no job grants write. |
| drift L144 three Worker secrets, L154 site-key variable | The new `secrets.required` drift test (stronger: derived from `wrangler.jsonc`, both environments). |
| drift L161 token permission wording in the manifest and `.env.example` | Change-detector, no guarantee: wording. The setup check confirms the token's real permissions. |

### W9. Shared Playwright patterns, navigation tests merged, tombstones

- **Files:** `playwright.config.ts`, `tests/unit/site/config-mdx.test.ts` (L31),
  `tests/unit/site/nav.test.ts` (deleted), `tests/unit/site/navigation.test.ts`.
- **Test:** existing; **unit layer** for the merge. The Playwright change is
  `no behaviour: n/a (same project membership, proven by playwright test --list per project
  before and after, and by config-files.test.ts "matches every … spec to exactly one project")`.
- **Playwright:** one module-level constant, for example
  `const FIXTURE_SITE_SPECS = [/sections\.spec\.ts$/, /blog-pagination\.spec\.ts$/,
  /blog-fixtures\.spec\.ts$/, /projects-fixtures\.spec\.ts$/, /questions\.spec\.ts$/]`, with a
  comment that these run on the fixture site. `sections` uses `testMatch: FIXTURE_SITE_SPECS` and
  `e2e` uses `testIgnore: [/a11y\.spec\.ts$/, /budget\.spec\.ts$/, /visual\.spec\.ts$/,
  ...FIXTURE_SITE_SPECS]`. The values stay RegExp arrays, so `config-files.test.ts` reads them at
  runtime unchanged. Delete `config-mdx.test.ts` L31 (it regex-matches the old literal text) in
  the same commit.
- **Navigation merge:** move `nav.test.ts`'s cases into `navigation.test.ts`'s `isCurrent` and
  `isInSection` blocks: same address with and without the trailing slash, a child address is not
  current, the section index and everything below it, look-alike addresses, `/` never holds
  every address. Use a neutral example address (`/projects/example-project/`) instead of a real
  project slug. Drop the cases already there. Delete `nav.test.ts`.
- **Tombstones deleted:** `navigation.test.ts` L27 ("no longer exports the seven-item
  primaryNavigation") and L71 ("no longer reserves /writing/ or /projects/").
- **Coverage mapping:**

| Removed | Now |
|---|---|
| `nav.test.ts` (5 tests) | The merged `isCurrent` and `isInSection` blocks in `navigation.test.ts`, every distinct case kept. |
| L27 tombstone | Change-detector, no guarantee: TypeScript fails any import of a removed export. |
| L71 tombstone | L67 `futureDestinations` equals `[]`, which already excludes both. |
| config-mdx L31 sections testMatch text | `config-files.test.ts` L317 (every spec in exactly one project, read from the loaded config); a fixture spec put in `e2e` would also fail against port 4321. Port 4322 and `build:fixtures` are the fixture web server, which every fixture spec needs to pass. |

### W10. docs/testing.md and the after-measurement

- **Files:** `docs/testing.md`, and the plan's item notes.
- **Test:** `no behaviour: n/a (documentation)`.
- **Edits:**
  - The fonts paragraph (L178 to L186): `headers.spec.ts` checks one HTML page and one font file
    under `/_astro/` against the rules in `public/_headers` (served by the real server).
    `headers.test.ts` checks the rules' invariants (one immutable `/_astro/*` rule, no other
    Cache-Control, the sandboxed SVG policy), not their exact text.
  - The visual-coverage table: the `home` row's "Introduction card and copy" becomes "Introduction
    card: `pages.spec.ts`. Copy: review only (#97)". The `about` row's "About sections and
    Recognition links: `pages.spec.ts`" becomes "Copy: review only (#97)".
  - "Real content in tests": the guard also builds needles from the pages (each external link
    in a page body and each heading of two or more words, quoted). Page addresses, file names and
    titles are routes and labels, so they are not needles.
  - A short rule under "Where a test goes", for example "Invariants, not mirrors": a test checks
    behaviour or a rule that must hold (no `'unsafe-inline'`, read-only permissions, every spec in
    one project). It does not restate wording, page copy or a literal config value, because Don
    reviews every pull request (#97).
  - Any other mention of a removed test that the implementer finds (`grep` for each deleted file
    and title).
- **After-measurement:** the implementer records Acceptance 1, 2, 3, 6 and 7 after the change
  in the summary.

## Docs citations (Principle IV)

- Playwright `testProject.testMatch` and `testProject.testIgnore` (a RegExp, a glob or an array
  of them, matched against the absolute file path):
  https://playwright.dev/docs/api/class-testproject#test-project-test-match and
  https://playwright.dev/docs/api/class-testproject#test-project-test-ignore.
- Playwright `--list`: https://playwright.dev/docs/test-cli.
- Cloudflare Workers static assets, custom headers (`_headers` rules, splats, how overlapping
  rules join): https://developers.cloudflare.com/workers/static-assets/headers/. Supports W6:
  the `/*` rule reaches every path, so one HTML response proves it is applied.
- Vitest `it.each` and `describe.each` (already used): https://vitest.dev/api/#test-each.
- No Astro choice is made. The page schema is the site's own (`src/content/schemas/page.ts`),
  used the way `page-schema.test.ts` uses it, so no Astro Docs MCP lookup is needed.

## Risks

- **Over-pruning an invariant.** Each work item keeps a list, and the review phase checks
  Acceptance 4 test by test. When unsure, an item keeps the assertion and records why.
- **The guard's page needles may hit something that is not copy.** W4 runs after W3 and records
  any hit. Single-word and unquoted headings are already left out for this reason.
- **`config-mdx.test.ts` L31 breaks on the Playwright constant.** W9 removes it in the same
  commit.
- **`design-source.test.ts` reads `docs/design-source.md` to the end of the file under
  "Accessibility adjustments" and counts 19 mapping rows.** W2 puts the new paragraph under "How to
  get Flux", as prose.
- **`changed-paths.test.ts` pins the setup-walkthrough SKILL.md as the one skill file a check
  reads.** W1 keeps the file reading it.
- **`content-tier.test.ts`** checks the `test:build:content` file names, which is why removing
  the config-files literal loses nothing. W7 does not touch the script.
- **A shared `_headers` reader in `tests/helpers/`** must load under both Vitest and Playwright:
  no runner import, plain `node:fs`, the pattern `tests/helpers/content.ts` already uses.
- **Parallel worktrees on ports 4321 and 4322** (memory). Rerun e2e when idle before treating
  mass `ECONNREFUSED` as a failure.
- **Page draft flags stay pinned** in `launch-content.test.ts`, as the issue asks (F5).
- **No `[PREVIEW-CHECK]` items.** Everything can be checked locally.
