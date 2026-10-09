---
description: "Task list for redirecting old Ghost addresses"
---

# Tasks: Redirect old Ghost addresses

**Input**: `specs/030-ghost-redirects/` (plan.md, spec.md, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Each test task names its primary layer; every
test is written first and seen to fail before `public/_redirects` changes. No visual baseline,
accessibility or page change (FR-005, SC-003). No `[PREVIEW-CHECK]` tasks: the E2E runs against
the local `wrangler dev` runtime.

**Toolchain**: run pnpm, playwright and wrangler through
`/Users/doncoleman/.claude/jobs/41451155/tmp/run.sh <alarm-seconds> <cmd...>`.

## Phase 1: Redirect old Ghost addresses (US1 P1, US2 P2)

**Goal**: The 9 mapped Ghost addresses, each with and without the slash, answer one 301 to a
built page; unmapped Ghost addresses still answer 404.

**Independent test**: `redirects.test.ts` unit run plus the `pages.spec.ts` and
`not-found.spec.ts` E2E run pass.

### Tests first (write, run, see them fail)

- [X] T001 [US1] Unit test (primary layer: unit, cheapest that can parse the file) in `tests/unit/site/redirects.test.ts`: the five page rows (`/drift/`, `/convergence/`, `/news/`, `/contact-thank-you/`, `/cookie-policy/`) resolve to `/writing/drift/`, `/writing/convergence/`, `/writing/`, `/contact/`, `/privacy-policy/` with 301, with and without the trailing slash. Literals are allowed here (page and topic addresses, not posts).
- [X] T002 [US1] Unit test in `tests/unit/site/redirects.test.ts`: every source shaped `/(drift|convergence|news)/{yyyy}/{slug}` (with or without `/`) targets `/writing/{slug}/`, `{slug}` is a published real post (`realPosts` from `tests/helpers/content.ts`, not draft), and at least one such rule exists. No post names in the test (`docs/testing.md` "Real content in tests").
- [X] T003 [US1] Unit test in `tests/unit/site/redirects.test.ts`: every Ghost source appears in both slash forms with the same target, and every Ghost target is a built address (a page from `pages`, a published post address, `/writing/`, or `/writing/{series}/` for an existing series). This covers FR-002 at the unit layer.
- [X] T004 [US2] Unit test in `tests/unit/site/redirects.test.ts`: extend "does not touch any other address" with `/tag/x/`, `/author/x/`, `/rss/`, `/ghost/`, `/drift/2025/x/`, `/news/2024/x/`, `/topic/x/` and the targets `/privacy-policy/`, `/contact/`, `/writing/`. Widen the "only 301 rules with an absolute-path source and short-address target" invariant to admit the Ghost sources and targets; keep the 301-only, no-loop, Services/Speaking and limits tests unchanged.
- [X] T005 [US1] E2E test (primary layer: E2E, since only the real Cloudflare runtime shows 301 before `html_handling` and `not_found_handling`; write that reason in the test comment) in `tests/e2e/pages.spec.ts`, beside the Tempo redirect E2E: read the Ghost rules from `public/_redirects`, request each source with the `request` fixture and `maxRedirects: 0`, expect 301 and the target path as `Location`, then request the target and expect 200. Remove the `NOT_BUILT` constant and its loop (it asserts 404 for `/cookie-policy/`).
- [X] T006 [US2] E2E test in `tests/e2e/not-found.spec.ts` (existing layer, expectation change only): remove `/convergence/` and `/news/` from `RETIRED_ADDRESSES` and `/cookie-policy/` from `NOT_FOUND_ADDRESSES`; keep `/drift/2025/x/`, `/topic/x/` and all `GHOST_ADDRESSES`; update the file header comment to say mapped Ghost addresses now redirect (spec 030).
- [X] T007 Run `tests/unit/site/redirects.test.ts` and confirm T001-T004 fail for the right reason (rules missing); do not run the full gate.
- [X] T008 [P] Doc test first: in `tests/unit/site/design-source.test.ts` replace "Current live URLs: states there are no redirects" with a test that the doc does not contain "no redirects" and contains "redirect permanently" and `public/_redirects`. Confirm it fails.

### Implementation

- [X] T009 [US1] Add the 18 rules (9 rows x two slash forms, 301, every target ending in `/`, no splat) to the top of `public/_redirects` under a comment naming spec 030, before the `/writing/topics/*` rules. The mapping is in `specs/030-ghost-redirects/spec.md` "Mapping".
- [X] T010 [P] Update the sentence at `docs/design-source.md` line 127 ("There are no redirects — Don updates his own external links himself where a URL changes.") to say the old Ghost addresses redirect permanently (see `public/_redirects`).
- [X] T011 Run `tests/unit/site/redirects.test.ts` and `tests/unit/site/design-source.test.ts` and confirm they pass; then run `tests/e2e/pages.spec.ts` and `tests/e2e/not-found.spec.ts` against `wrangler dev` (port 4321; check with `lsof` that no sibling worktree holds it) and confirm they pass. Lint and typecheck the touched test files.
- [X] T012 Tick box 1b in `docs/cutover-plan.md` (line 44, `- [ ] **1b. ...`).

## Dependencies

T001-T006 and T008 (tests) before T009/T010; T007 after T001-T004; T011 after T009 and T010; T012 last.
Parallel: T008 and T010 touch different files from the redirect work and can run alongside it.

## Notes

- Layers: T001-T004 unit; T005 E2E (second layer for the same rules, reason given in T005);
  T006 E2E expectation update; T008 unit.
- Scope: `docs/design-source.md` and its test are added by the orchestrator (plan listed them as
  a follow-up); nothing else outside the plan's "Source code touched" list.
