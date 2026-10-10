# Chore plan: remove-old-site-refs

Branch: `chore/remove-old-site-refs`, from `main` at 508587c (after #139 merged).
Closes #140.

## Goal

Issue [#140](https://github.com/drcdev/dcc-web/issues/140) asks for the repository's current docs,
skills, scripts, code comments and test names to describe the site as it is now. The old Ghost site
is gone, so nothing outside `specs/` and `.specify/` should mention the launch, the cutover, the
domain switch, the review host, or the Ghost, Mailgun, Supabase or Squarespace setup that came
before. Earlier slices under `specs/` and `.specify/` stay as the record. Published writing and
project stories about Ghost stay (`src/content/**`), and so do the redirects from old Ghost
addresses (`public/_redirects`, `tests/unit/site/redirects.test.ts`, `tests/e2e/pages.spec.ts`)
and the not-found checks for old Ghost paths (`tests/e2e/not-found.spec.ts`). No page changes:
every edit is to docs, developer tooling output, code comments that do not render, or tests.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Primary grep.** From the worktree root:

   ```sh
   git grep -n -i -E 'ghost|mailgun|supabase|squarespace|cutover|launch|waiting for the switch|domain switch|(^|[^p])review (address|host|domain)' -- . ':!specs' ':!.specify' ':!src/content' ':!pnpm-lock.yaml' ':!worker/worker-configuration.d.ts' ':!public/_redirects' ':!tests/e2e/not-found.spec.ts' ':!tests/e2e/pages.spec.ts' ':!tests/unit/site/redirects.test.ts' | grep -v -E 'chromium.launch|browser launch|launches a browser|is launched|browser is'
   ```

   Before: **62** lines. After: exactly the **allowed residue** below (4 lines), nothing else.

   Allowed residue:
   - `VOICE.md` "**Technical Tutorial** (Ghost themes):" — names the published post "Ghost themes"
     as a style example; the post is content and stays.
   - `tests/e2e/blog.spec.ts` comment naming the "Ghost themes" post in the related-posts order —
     the same published post, which the test's ordering depends on.
   - `.claude/skills/speckit-analyze/SKILL.md` and `.claude/skills/speckit-converge/SKILL.md`
     "post-launch outcome metrics" — generic Spec Kit wording, not about this site.

2. **Secondary grep** (old-site references the primary pattern misses), same pathspec exclusions:

   ```sh
   git grep -n -i -E 'web3forms|jsdelivr|mymagic|current site|new build|this rebuild|retired with|Subscribe/Account' -- . ':!specs' ':!.specify' ':!src/content' ':!pnpm-lock.yaml' ':!worker/worker-configuration.d.ts' ':!public/_redirects' ':!tests/e2e/pages.spec.ts' ':!tests/unit/site/redirects.test.ts'
   ```

   Before: **12** lines (`docs/design-source.md` x4, `docs/design/blog.md:271`,
   `src/components/SiteFooter.astro:4`, `src/components/SiteHeader.astro:5`,
   `tests/e2e/a11y.spec.ts:14`, `tests/e2e/not-found.spec.ts:10`,
   `tests/unit/setup/dns-baseline-schema.test.ts:86`, `tests/unit/site/csp.test.ts:68-69`).
   After: 0.
   (`not-found.spec.ts` is included here on purpose: only its comment changes, its assertions stay.)

3. **Nothing a visitor sees changes.** Every `src/` edit is inside an Astro frontmatter `---`
   fence (a JS comment, never rendered). `git diff main -- src/` shows only `//` comment lines.
   No `public/`, `src/content/`, `src/styles/` or config edit. Visual baselines do not change.

4. **Tests.** Every touched test file passes; the new-first CSP case (W6) is seen to bite on a
   scratch policy before the vendor strings are removed; the report wording case (W4) is seen to
   fail before `report.ts` changes. The full `pnpm run verify` gate is green (this chore touches
   `scripts/`, `src/` and `tests/`, so it runs the full tier, not the docs tier).

5. **Removed assertions are mapped** (each work item lists its mapping) and the review phase
   confirms each mapping holds.

## Scope

In scope:

- Docs: `docs/design-source.md` (rewrite, W1), `docs/setup.md:561`, `docs/design/blog.md:271`.
- Code comments: setup-check and site-check script headers citing `011-launch` specs;
  `ContactForm.astro`, `SiteHeader.astro`, `SiteFooter.astro` frontmatter comments naming dropped
  Ghost/Supabase pieces.
- Setup-check human summary wording "waiting for the switch".
- Test names, comments and branch-name fixtures that mention the launch, Ghost, the review host
  or retired providers.
- Test assertions that guard against leftovers of the Ghost era (removed or recast, each mapped).

Out of scope (no change):

- `specs/**`, `.specify/**` (the record), `src/content/**` (content), `public/_redirects` and
  its tests, the not-found checks' assertions (only one comment is repointed).
- Flux as the live design reference (`.reference/flux`, the `port of Flux ...` comments in
  components, `.gitignore`, `eslint.config.js`, `CLAUDE.md`): Flux is current tooling.
- D1 "migrations", theme "switch", `gh auth switch`, Playwright `chromium.launch`: unrelated noise.

Follow-ups for the PR body:

- The `waiting` setup-check status is dead (`scripts/setup-check/types.ts:36`: no check produces
  it). Removing it from types, schemas, report and the check-report JSON schema is a separate
  chore; this one only rewords its summary line.
- The constitution's Technology Constraints still says the design baseline is "the existing
  Tailwind theme from Don's current site". Rewording it is a constitution amendment (major
  change, via `speckit-constitution`), so it is not done here.
- `tests/unit/setup/schemas.test.ts` and the dns-baseline test file are untouched beyond W7;
  no further consolidation.

## Constitution Check

- **I. Test-First:** the two behaviour-bearing edits start from a test: W4 (report wording) and
  W6 (CSP host-source allow-list) are new-first; all other test edits are renames, comment
  edits, fixture swaps or mapped removals.
- **II. Automated Release Gate:** the full verify gate runs; no check is skipped or loosened. The
  CSP guarantee is kept in a stronger neutral form (W6), not weakened.
- **III. Human Review for Major Changes:** not a major change. No dependency, integration or
  service change; no contact data handling change; no design, layout, navigation or visual
  change; no cost change; no CI, deployment or infrastructure configuration change (only test
  files, comments, docs and one developer CLI string); no constitution amendment. Criteria that
  fire: **none**.
- **IV. First-Party Before Custom:** no new code paths; n/a.
- **V. Static by Default:** no page, endpoint or client script changes.
- **VI. Content as Files:** `src/content/**` untouched.
- **VII. Private Data:** contact handling untouched; only a comment in `ContactForm.astro`.
- **VIII. Cloudflare Best Practices:** Worker, D1, `_headers` and `wrangler.jsonc` untouched.
- **IX. Cost Ceiling:** no cost effect.
- **X. Accessible, Fast and Private:** no rendered output changes; CSP assertion strengthened.
- **XI. Spec Kit Workflow:** chore pipeline on its own branch and worktree.
- **Security Baseline:** `_headers` contract and CSP unchanged; the CSP test keeps "no third-party
  origin except Web Analytics" and now checks it for scheme-less host sources too.

## Work items

### [x] W1 Rewrite `docs/design-source.md` to describe the current design source

> Review H1: the negative Ghost/Supabase guard described under Test below was removed on review. Mapping: the doc's shape is pinned by the required-headings test, the Flux name literals and the 19-row count; reintroduced history is caught in review.

Judgment: rewrite, not delete. Most of the doc still guides future work: how to clone Flux (the
live design reference), the Flux-to-component mapping, the Content structure table (cited by
`src/components/Pill.astro` and tested by `docs-content-structure.test.ts`), Flux deviations and
the Accessibility adjustments table. Only the port history goes.

Files: `docs/design-source.md`, `tests/unit/site/design-source.test.ts`,
`tests/e2e/not-found.spec.ts` (comment only).

- Intro: describe the doc as where the design comes from and how the build is laid out; drop
  "first artifact of the site foundation feature", "current live URLs" and "new build".
- How to get Flux: call Flux the theme the design was ported from; drop "existing Ghost theme"
  and "Flux's site is retired with Ghost ..."; delete the paragraph on reference screenshots of
  the original Ghost site (`e3c9aeb`).
- Mapping: keep all 19 rows and the Flux file names. Reword cells that name Ghost or Supabase:
  the `accent-*` row (`--ghost-accent-color` becomes "Flux's accent colour setting"), the
  `ui-share.hbs` row ("Flux's `#/share` link is not ported"), the contact row (drop the two
  `supabase/...` paths), the CSP row (drop "remove Web3Forms, jsDelivr, Supabase").
- Delete the "What doesn't carry over" and "Current live URLs" sections.
- `tests/e2e/not-found.spec.ts:10-12` comment: repoint from the deleted doc sections to
  `public/_redirects` (its header comment says unmapped old addresses stay 404). Drop "this
  rebuild". Assertions untouched.

Test (existing, edited first so it fails against the old doc, then the doc is rewritten):

- heading test: five headings become three (How to get Flux, Mapping, Accessibility
  adjustments), plus a new negative assertion that the doc contains neither "Ghost" nor
  "Supabase" (case-insensitive) — this is what fails first. Layer: unit (reads the doc file).
- `requiredFluxNames`: drop `supabase/functions/contact/index.ts`. Row count stays 19.
- Remove `doesntCarryOverPhrases` (23 cases), `currentUrlPatterns` (14 cases) and "Current live
  URLs: states the old Ghost addresses redirect".

Coverage mapping for removed assertions:

- "What doesn't carry over" phrases: they asserted the doc recorded port history that no longer
  guides any change. Guards a state that can no longer arise (there is no Ghost theme to port
  from); no replacement.
- "Current live URLs" patterns and the redirect statement: the behaviour is covered by
  `tests/unit/site/redirects.test.ts` (every mapped address, 301) and `tests/e2e/pages.spec.ts`;
  unmapped old paths by `tests/e2e/not-found.spec.ts`. The documentation of the rule lives in the
  `public/_redirects` header comment.
- `supabase/functions/contact/index.ts` mapping name: Supabase is not a source of anything
  current; the contact row is still checked through `ui-contact-form.hbs` and `contact-form.js`.

`docs-content-structure.test.ts` and `changed-paths.test.ts` keep passing unchanged (the doc
path and the Content structure section stay).

### [x] W2 Other docs

Files: `docs/setup.md:561`, `docs/design/blog.md:271`.

- `docs/setup.md`: "made by hand on 2026-10-09, right after the domain switch, for issue #91"
  becomes "made by hand on 2026-10-09 for issue #91".
- `docs/design/blog.md`: delete the "Addresses from the current site are not redirected."
  bullet. It names the old site and is no longer true (old addresses do redirect).

`VOICE.md:114` stays (allowed residue: names a published post).

Test: `no behaviour: n/a (prose only; setup-check tests read docs/setup.md item text, and the
edited paragraph is under "Edge protections", which the doc says is not a setup item — run
tests/unit/setup-check to confirm)`.

### [x] W3 Script and component comments

Files and edits (comments only):

- `scripts/setup-check/checks/mail-records.ts:1`, `scripts/setup-check/checks/preview-noindex.ts:1`,
  `scripts/setup-check/providers/http.ts:19`, `scripts/site-check/crawl.ts:1`,
  `scripts/site-check/preview.ts:2`: drop the `011-launch ...` spec citations; keep the
  description of what the file does (keep item numbers and FR ids only if they still read
  correctly without the spec name; otherwise drop them too).
- `src/components/sections/ContactForm.astro:7`: delete "Dropped from Flux: the Ghost member
  pre-fill, Supabase and its auth bridge."
- `src/components/SiteHeader.astro:4-5`: drop "Flux's search, Subscribe/Account ... left out
  (FR-004)"; keep the logo-image note only if it reads on its own.
- `src/components/SiteFooter.astro:4`: drop "Flux's Subscribe/Account link and Facebook/X icons
  are left out (FR-004)".

All three `.astro` edits are inside the frontmatter fence (confirmed: lines 1-15 sit between
`---` markers), so rendered HTML is identical. `src/components/Pill.astro` cites the
"Content structure" section, which W1 keeps: no change.

Test: `no behaviour: n/a (comments; tsc/eslint in the gate and the component tests confirm
nothing else moved)`.

### [x] W4 Setup-check summary wording

Files: `scripts/setup-check/report.ts:134`, `tests/unit/setup-check/report.test.ts:277-282`,
`tests/unit/setup-check/redact.test.ts:7,12`.

- New-first: change the report test to expect "2 waiting" and not "for the switch"; rename it
  "adds '<w> waiting' to the summary line". See it fail. Then change the summary fragment to
  `${report.counts.waiting} waiting`.
- `redact.test.ts`: the sample summary "Waiting for the switch: nothing here" becomes "Waiting:
  nothing here"; the comment "no launch output" becomes "no setup-check output".

Layer: unit (the string is produced by a pure formatter). This is developer CLI output, not site
behaviour. Removing the dead `waiting` status is a follow-up (see Scope).

### [x] W5 Test names, comments and branch fixtures

Files and edits (no assertion changes):

- `tests/e2e/site-links.spec.ts:1`: drop the `011-launch contracts/site-check.md` citation.
- `tests/unit/ci/workflows.test.ts:181`: describe name drops "(011-launch FR-001a, FR-002a)".
- Branch fixtures, value only, expected output moves with it:
  `tests/component/Seo.test.ts:166`, `tests/unit/site/build-env.test.ts:22`
  (`"011-launch"` becomes a neutral numbered branch such as `"042-sample-feature"`), and
  `tests/unit/site-check/preview.test.ts:80-81` (same branch; expected
  `https://br-042-sample-feature-dcc-web-preview.drc-dev.workers.dev`). Confirm
  `previewAlias` maps the new name to itself before relying on that URL.
- `tests/build/local-site.test.ts:144,149`: "the launch navigation" becomes "unchanged"; "a draft
  launch page's" becomes "a draft page's".
- `tests/unit/content/site-pages.test.ts:23,34,74`: rename `LAUNCH` to `SITE_PAGES` (not
  `pages`, which is already imported).
- `tests/unit/setup-check/checks/dns-records-parity.test.ts:118`: name becomes "compares the
  whole zone".
- `tests/unit/setup-check/providers/http.test.ts:31-37`: `?launch-check=1` becomes `?check=1`
  in all three places.
- `tests/unit/site/headers.test.ts:78`: "(#93, FR-010d reopened once Ghost was retired)" becomes
  "(#93)".
- `tests/e2e/headers.spec.ts:28`: "workers.dev previews and the review host" becomes "the
  workers.dev preview host" (`public/_headers` has only that host rule).
- `tests/e2e/a11y.spec.ts:12-14`: drop the "Deliberately dropped ... link to the current site"
  note (it records checks from the old placeholder).

Test: existing; each file runs green after its edit (renames and fixture swaps do not change
what is asserted).

### [x] W6 CSP forbidden vendor names become a host-source allow-list

Files: `tests/unit/site/csp.test.ts:62-88`.

Today "contains no forbidden or development-only source" lists `web3forms`, `jsdelivr` and
`supabase`: the third-party origins the Ghost-era policy carried. The next test, "allows an
external origin only from the Web Analytics allow-list", already rejects any `scheme://` origin
outside the allow-list, but it only matches sources with a scheme, so a scheme-less host source
(for example `x.supabase.co`) would pass both tests if the vendor names went alone.

- New-first: widen the allow-list test so every source that is not a quoted keyword or hash
  (`'self'`, `'none'`, `'sha256-...'`) and not a bare scheme source (`data:`, `blob:`) must be an
  allow-listed origin. Prove it bites: on a scratch copy of the policy map with `x.supabase.co`
  and `cdn.jsdelivr.net` added to `script-src`, the widened test fails (scratch check in the
  test run or a throwaway assertion, not committed). Then remove the three vendor names from the
  forbidden list. The rest of the forbidden list (`unsafe-*`, localhost, `ws:`, `http:` and so on)
  stays.

Layer: unit (reads `astro.config.mjs` `security.csp`).

Coverage mapping: `web3forms`, `jsdelivr`, `supabase` substrings are covered by the widened
allow-list test, which rejects every external host, with or without a scheme, other than the two
Web Analytics origins. Net coverage goes up, not down.

### [x] W7 Ghost-leftover guards in shell and setup tests

Files: `tests/component/SiteHeader.test.ts:194-199`, `tests/component/SiteFooter.test.ts:110-115`,
`tests/unit/setup/dns-baseline-schema.test.ts:47-49,84-88`, `tests/unit/setup/schemas.test.ts:24-26`.

- SiteHeader: describe becomes "SiteHeader has no account or search controls"; remove the
  `data-ghost-search|data-portal|#\/portal` regex; keep the visible-text check (Subscribe, Sign
  in, Account, Search) and the inline-handler test.
- SiteFooter: describe becomes "SiteFooter leaves out unused pieces"; drop `#\/portal` from the
  link regex (keep `facebook.com|twitter.com|x.com`); keep the text check and the inline-handler
  test.
- dns-baseline-schema: in "rejects a record carrying a source or a reason" swap the fixture value
  `"squarespace"` for a neutral `"example"` (the test is about the `source` key, not the value).
  Remove "names no retired Ghost, Mailgun or Squarespace record".
- schemas.test: remove "accepts a config with only the keys the checks read (no review host or
  Ghost marker)"; without the parenthetical it is the same assertion on the same object as
  "accepts a valid config" directly below.

Test: existing, edited in place; layer unchanged (component, unit).

Coverage mapping:

- Header/footer Ghost attribute and `#/portal` regexes: guard markup from the Ghost theme, which
  the repository no longer contains; the header and footer are built from
  `src/config/navigation.ts`. Any account, portal or search control would still show as visible
  text, which the kept text assertions reject.
- dns-baseline "no retired provider record": `setup/dns-baseline.json` is a reviewed file and the
  `dns-records-parity` setup item compares it with the live zone; a retired provider's record
  could only return through a reviewed edit to that file. The must-exist tests in the same file
  still pin the mail and security records. Guards a state that can no longer arise unattended.
- schemas.test duplicate: covered exactly by "accepts a valid config" (same input, same
  assertion).

## Docs citations

None. No Astro or Cloudflare approach is chosen; the change edits docs, comments and tests only.

## Risks

- **Doc test coupling.** `design-source.test.ts` and `docs-content-structure.test.ts` read the
  doc by heading and literal. Rewriting cells in the Mapping table must keep every remaining
  `requiredFluxNames` literal and the 19-row count, and the Content structure heading must stay
  `## Content structure`.
- **Preview alias fixture.** If `previewAlias` truncates or rewrites branch names, the new
  fixture's expected URL must follow the function, not be hand-built. Check before editing.
- **CSP widening false positive.** The policy may hold a source form not anticipated above (for
  example a `'strict-dynamic'` keyword or a hash entry without quotes from `entryValue`). Classify
  by the parsed `policy` map, run the test before removing the vendor names, and keep the test
  green on the real policy.
- **Grep drift.** Edits elsewhere on `main` before merge could add new hits; re-run both greps
  after merging `origin/main`.
- **Drift guard.** Do not put `specs/` path literals in tests (changed-paths drift guard).
- **Parallel gates.** The full gate is slow and port-bound (4321/4322); ask before running it
  and run it in the background per the local toolchain notes.
