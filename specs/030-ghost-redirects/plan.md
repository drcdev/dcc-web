# Implementation Plan: Redirect old Ghost addresses

**Branch**: `030-ghost-redirects` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/030-ghost-redirects/spec.md`

## Summary

Add 18 permanent (301) rules to `public/_redirects`: the 9 Ghost addresses in the spec's mapping
table, each with and without the trailing slash. Cloudflare Workers static assets apply the file
before any asset lookup, so no Worker code, page or configuration changes. Tests follow the
existing house pattern: a unit test that parses `public/_redirects` and resolves request paths
against it, plus an E2E check against `wrangler dev` that the real runtime answers 301 with the
right `Location` and that the target loads. `/cookie-policy/`, `/convergence/` and `/news/` leave
the E2E not-found lists because they now redirect. Cutover plan box 1b is ticked when the pull
request opens.

## Technical Context

**Language/Version**: TypeScript (strict) for tests; `_redirects` is Cloudflare's plain-text format

**Primary Dependencies**: none added. Astro (current stable, static output), Cloudflare Workers
static assets, Vitest, Playwright

**Storage**: N/A

**Testing**: Vitest unit test on the file (`tests/unit/site/redirects.test.ts`); Playwright E2E
against `wrangler dev` on port 4321 (`tests/e2e/pages.spec.ts`, `tests/e2e/not-found.spec.ts`)

**Target Platform**: Cloudflare Workers static assets (`wrangler.jsonc` `assets`,
`not_found_handling: "404-page"`, `run_worker_first: ["/api/*"]`)

**Project Type**: static web site

**Performance Goals**: one hop per old address (no redirect chain)

**Constraints**: Cloudflare limits of 2,000 static and 100 dynamic rules and 1,000 characters per
line (the existing unit test keeps a stricter 100/100 check; 18 + 4 static rules stay well under);
tests must not name real posts (`tests/unit/content/no-real-content-in-tests.test.ts`)

**Scale/Scope**: 18 new lines in one file; edits to three test files and one checkbox in
`docs/cutover-plan.md`

## Design decisions

### D1. `public/_redirects`, not Astro's `redirects` config

- **Chosen**: add the rules to `public/_redirects`, next to the existing `/writing/topics/*` and
  Tempo privacy rules.
- **Docs**: Astro's Cloudflare integration guide, "Cloudflare Platform > Redirects"
  (https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-platform):
  "Declare custom redirects for static assets by adding a `_redirects` file in your Astro
  project's `public/` folder. This file will be copied to your build output directory."
  Cloudflare: Workers static assets, Redirects
  (https://developers.cloudflare.com/workers/static-assets/redirects/): redirects "are always
  followed, regardless of whether or not an asset matches the incoming request", run before
  `_headers`, top-most matching rule wins.
- **Rejected: Astro `redirects` config**
  (https://docs.astro.build/en/reference/configuration-reference/#redirects and
  https://docs.astro.build/en/guides/routing/#configured-redirects). For a static site with no
  adapter writing a host file, Astro emits HTML pages with a `<meta http-equiv="refresh">` tag
  and "does not support status codes", so FR-001's 301 cannot be met. The docs also note that
  `'/product1/', '/product1'` (both trailing-slash forms) "is not supported". It would also add
  18 built pages and split redirects across two mechanisms.
- **Rejected: Cloudflare Bulk Redirects / Redirect Rules.** Dashboard configuration, against
  Principle VIII (configuration is committed and applied through CI); only recommended above
  2,100 rules.

### D2. Both trailing-slash forms as explicit static rules

- Cloudflare matches a `_redirects` source against the request path as written; its own
  examples treat `/trailing` and `/trailing/` as different sources
  (https://developers.cloudflare.com/workers/static-assets/redirects/). The house pattern
  already lists both forms (the two Tempo privacy lines).
- Nothing upstream normalises the slash for these paths: Astro's `trailingSlash: "ignore"`
  (`astro.config.mjs`) governs the dev server and built routes only, not the Cloudflare runtime;
  Cloudflare's `html_handling` (default `auto-trailing-slash`,
  https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) only
  adds or drops the slash for paths that match a built asset, and no old Ghost path is built.
  Redirects run before asset handling in any case.
- So each row is two static lines (18 in total), every target ending in `/`, which is the built
  page's canonical address, so there is no second hop.
- No splat: `/drift/*` and similar would turn unmapped old posts into redirects, against FR-003.

### D3. Rule order

The new Ghost block goes at the top of `public/_redirects`, under a comment naming spec 030,
before the existing dynamic `/writing/topics/*` rules. Cloudflare advises static rules before
dynamic ones. None of the new sources overlaps an existing rule, and no target is itself a
source (no loop), which the existing "has no loop" unit test enforces.

### D4. Tests (Principle I, test placement)

Every test is written first and seen to fail before `public/_redirects` changes.

- **Unit, primary layer** (`tests/unit/site/redirects.test.ts`, extends the existing file):
  - The five page rows (`/drift/`, `/convergence/`, `/news/`, `/contact-thank-you/`,
    `/cookie-policy/`) resolve to their targets with 301, with and without the slash. These are
    page and topic addresses, not post addresses, so they may be literals.
  - Ghost post rules are checked as a rule, not by name, because tests may not name real posts
    (`docs/testing.md` "Real content in tests"): every source shaped
    `/(drift|convergence|news)/{yyyy}/{slug}` (with or without `/`) targets `/writing/{slug}/`,
    and `{slug}` is a published real post (`realPosts` from `tests/helpers/content.ts`, not
    draft). At least one such rule exists.
  - Every Ghost source appears in both slash forms with the same target.
  - Every Ghost target is a built address: a page address from `pages`, a published post
    address, `/writing/` or `/writing/{series}/` for a series that exists. This covers FR-002 at
    the cheapest layer.
  - "Does not touch any other address" gains the unmapped Ghost addresses (`/tag/x/`,
    `/author/x/`, `/rss/`, `/ghost/`, `/drift/2025/x/`, `/news/2024/x/`, `/topic/x/`) and the
    targets themselves (`/privacy-policy/`, `/contact/`, `/writing/`).
  - The "only 301 rules with an absolute-path source and a short-address target" invariant is
    widened to admit the Ghost sources and targets; the 301-only rule, the no-loop rule, the
    Services/Speaking rule and the limits test stay as they are.
- **E2E, second layer** (`tests/e2e/pages.spec.ts`, beside the existing Tempo redirect E2E).
  Reason, written in the test comment: only the real Cloudflare runtime (`wrangler dev`) shows
  that it matches both slash forms and answers 301 before `html_handling` and
  `not_found_handling` run. The test reads the Ghost rules from `public/_redirects` (no post
  names in the test), requests each source with `maxRedirects: 0`, expects 301 and the rule's
  target as the `Location` path, then requests the target and expects 200 (FR-002, SC-001). It
  uses the `request` fixture, not a browser page, so it stays cheap.
- **E2E not-found lists** (`tests/e2e/not-found.spec.ts`): `/convergence/` and `/news/` leave
  `RETIRED_ADDRESSES`, and `/cookie-policy/` leaves `NOT_FOUND_ADDRESSES` (around line 28).
  `/drift/2025/x/`, `/topic/x/` and every `GHOST_ADDRESSES` entry stay, so US2 / FR-003 /
  SC-002 keep their existing coverage. The file header comment ("no redirect") is updated to say
  mapped Ghost addresses now redirect (spec 030).
- **`tests/e2e/pages.spec.ts` `NOT_BUILT`**: it holds only `/cookie-policy/` and asserts 404,
  which a followed 301 to `/privacy-policy/` would break. The constant and its loop are removed;
  the new redirect E2E covers the address. `tests/e2e/seo.spec.ts` ("never the cookie policy" in
  the sitemap) and `tests/unit/content/launch-content.test.ts` (no `cookie-policy.mdx`, no link
  to it) are unaffected and stay.
- No accessibility or visual test changes: no page changes (FR-005, SC-003).

## Constitution Check

*GATE: checked before design and again after it. Result: pass, no exceptions.*

- **I. Test-First**: pass. The unit and E2E tests in D4 are written and seen to fail first; each
  names its layer, and the E2E second layer has a written reason.
- **II. Automated Release Gate**: pass. No check is skipped or weakened. Moving three addresses
  out of the not-found lists and removing `NOT_BUILT` follow a spec change (the behaviour
  changed), not a test being loosened; the replacing redirect tests are stricter.
- **III. Human Review for Major Changes**: pass, not a major change. Against each criterion: no
  dependency, integration or service is added (the `_redirects` file is already in use); contact
  data handling is untouched (`/contact-thank-you/` only points at the contact page); no design
  system, layout, navigation or visual change; no cost change (static rules are free and
  unmetered as assets); no CI, deployment or infrastructure configuration changes (`public/_redirects`
  is site content shipped in the build, like the existing rules; `wrangler.jsonc` and workflows
  are untouched); the constitution is not amended. **Acknowledged override**: the `/tweak`
  triage rule (condition 3) excludes redirect changes, and Don explicitly chose `/tweak` for this
  one (spec Context, 2026-10-09). That is a pipeline choice, not a Principle III criterion, so the
  PR needs no major-change flag but should mention the override.
- **IV. First-Party Before Custom**: pass. Cloudflare's own `_redirects` file, as Astro's
  Cloudflare guide directs; Astro `redirects` considered and rejected (D1). Astro Docs MCP was
  used for every Astro citation.
- **V. Static by Default**: pass. No server-side code, no JavaScript; redirects are served by the
  asset layer, and `run_worker_first` stays `["/api/*"]`.
- **VI. Content as Files**: pass. The rules are a committed file; no content changes.
- **VII. Private Data**: pass. No personal data is touched.
- **VIII. Cloudflare Best Practices**: pass. Platform feature, committed, deployed through CI,
  within the documented limits; no endpoint changes.
- **IX. Cost Ceiling**: pass. $0 added.
- **X. Accessible, Fast and Private**: pass. No page changes; one-hop 301s to canonical
  addresses add no chain; no scripts or tracking.
- **XI. Spec Kit Workflow**: pass. Spec Kit branch and directory; one feature on this branch.
  `public/_redirects` and the three test files may also be touched by a parallel worktree; if
  so, the later PR merges `origin/main` and keeps both sets of lines.
- **Security Baseline**: pass. `_headers` untouched; redirects run before headers and send only
  same-site relative targets, so no open redirect.

## Project Structure

### Documentation (this feature)

```text
specs/030-ghost-redirects/
├── spec.md
├── plan.md          # this file
├── quickstart.md    # how to check the redirects locally and on the preview
└── checklists/
```

`research.md`, `data-model.md` and `contracts/` are not produced: there are no unknowns left, no
entities, and the only interface is the mapping table already in the spec.

### Source code touched

```text
public/_redirects                     # + 18 lines (D2, D3)
tests/unit/site/redirects.test.ts     # Ghost rule invariants (D4)
tests/e2e/pages.spec.ts               # runtime 301 + target 200; NOT_BUILT removed
tests/e2e/not-found.spec.ts           # /convergence/, /news/, /cookie-policy/ leave the 404 lists
docs/cutover-plan.md                  # tick box 1b when the PR opens
```

**Structure Decision**: existing single-site layout; no new files outside the spec directory.

## Risks and follow-ups

- **Stale doc**: `docs/design-source.md` line 127 says "There are no redirects", and
  `tests/unit/site/design-source.test.ts` pins that phrase. It describes the old site as a design
  source, so it is left alone here (scope); a follow-up can reword it to point at spec 030.
- **Spec 011 text** still says old addresses are not redirected; the spec records the reversal
  and leaves 011 unamended (spec Out of Scope).
- **Sibling worktrees** may hold ports 4321/4322 during the E2E run; see the gate notes.

## Complexity Tracking

No violations to justify.
