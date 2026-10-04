# Review report: cache-fingerprinted-assets (issue #74)

Fresh-eyes review of `chore/cache-fingerprinted-assets` against `plan.md`, the constitution and
`CLAUDE.md`. Reviewed `git diff main...HEAD` (commits c79fc99, 8556c3e, dc5c829, e61fb89,
1994322).

## Verdict

Ready for the full verify gate and the PR. No CRITICAL or HIGH findings. Principle III verdict
stands: **major** (deployment configuration; `public/_headers` is listed in
`.github/CODEOWNERS` line 11). Label `major-change`, auto-merge off, Don checks the preview.

## Checks

| Check | Result |
|---|---|
| Scope: changed files | `public/_headers`, `tests/unit/site/headers.test.ts`, `tests/e2e/headers.spec.ts`, `docs/testing.md`, `specs/018-self-hosted-fonts/contracts/fonts.md`, `specs/018-self-hosted-fonts/spec.md`, `.specify/chores/cache-fingerprinted-assets/plan.md`: exactly Acceptance 6. No baseline, `astro.config.mjs`, `wrangler.jsonc`, worker, CLAUDE.md or skill change. |
| W1 unit | `ASTRO_RULE = "/_astro/*"`, four-rule order, `/_astro/*` cache case, no-other-rule exemption, new `public/_astro` guard; all as planned. Re-run: 19/19 green. |
| W2 E2E | "the page stylesheet is not marked immutable" replaced by "every fingerprinted stylesheet and script is immutable and carries the full security header set" (`/` and `/contact/`, at least one `.css` and one `.js`, exact Cache-Control, full `HEADERS`) plus "the home page HTML is not marked immutable". Font test assertions unchanged, comment cites F10 and #74. Re-run: 15/15 green. |
| W3 rule | `public/_headers` has four rules `/*`, `/_astro/*`, workers.dev host, review host; only the path line changed; value unchanged `public, max-age=31536000, immutable`; `/*` set and both noindex host rules byte-identical. |
| W4 docs | `docs/testing.md` Fonts paragraph updated; "Where a test goes" bullets untouched; F11/F12 keep original text plus "Superseded by #74"; 018 Follow-up bullet marked "(done in #74)". |
| Layers and comments | Unit is the primary layer for the rule text; E2E second-layer reason is in the test comment (`tests/e2e/headers.spec.ts` lines 154-158), per "Where a test goes". The `public/_astro` guard comment gives its reason. |
| Coverage mapping | Removed assertion's subject (stylesheet on `/`) is now asserted immutable by the new test; its "not everything is immutable" intent lives in the new HTML test (`headers.spec.ts` line 185). Font immutable guarantee still asserted (line 140 test, unchanged assertions). True as stated. |
| Drift and content guards | No `specs/` path literals in either test file; no real post or project names in the new test code (only `/` and `/contact/`). |
| No weakened check | Cache-Control value unchanged; security header set and host rules unchanged; the one removed test has a mapped, stronger replacement. |
| `_headers` semantics | One rule, no overlap (so no comma-joined duplicate Cache-Control); the greedy splat `/_astro/*` covers `/_astro/fonts/<hash>.woff2`, confirmed by the green font E2E test against `wrangler dev`. |
| Alignment rule | n/a: no file under `.claude/` or CLAUDE.md in the diff. |

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. `tests/e2e/headers.spec.ts` line 159: the served-response test covers stylesheets and
   scripts only; Astro-processed images under `/_astro/` are covered by the splat semantics and
   the unit rule test, and served-checked only by the second `[PREVIEW-CHECK]`. This matches the
   plan (images were never in W2), so no change is needed; noted so the preview check is not
   skipped.
2. `tests/e2e/headers.spec.ts` line 185: the HTML-not-immutable assertion checks `/` only. One
   page is enough to catch an over-broad rule such as `/*` carrying the header, which is the
   risk the plan names; no change needed.

## Measurement

Same measurement as the plan's Acceptance section (rule text, plus the served responses from
`wrangler dev` over the production build). Ports 4321/4322 were free before the E2E run.

| What | Before (main, cf9c97c) | After (this branch) |
|---|---|---|
| `public/_headers` cache rule | `/_astro/fonts/*` → `public, max-age=31536000, immutable` | `/_astro/*` → same value |
| Served `/_astro/` stylesheet | `public, max-age=0, must-revalidate` (Cloudflare default; red run in W2) | `public, max-age=31536000, immutable` |
| Served `/_astro/` scripts | default `public, max-age=0, must-revalidate` | `public, max-age=31536000, immutable` |
| Served font files | immutable | immutable (unchanged) |
| `/` HTML | default, no `immutable` | default, no `immutable` (new assertion) |
| Unit `tests/unit/site/headers.test.ts` | n/a | 19 passed |
| E2E `tests/e2e/headers.spec.ts --project=e2e` | new stylesheet test red | 15 passed (20.7 s), after `pnpm run build` |

## PREVIEW-CHECK lines for the PR body

On `br-chore-cache-fingerprinted-assets-dcc-web-preview.drc-dev.workers.dev`:

- [ ] `curl -sI` of the `/_astro/*.css` URL linked from `/` shows `cache-control: public, max-age=31536000, immutable` [PREVIEW-CHECK]
- [ ] `curl -sI` of the `/_astro/*.js` URL on `/contact/` and of one `/_astro/` image shows the same header, plus `x-robots-tag: noindex` (the host rule still applies) [PREVIEW-CHECK]
- [ ] `curl -sI` of `/` still shows the default `cache-control` (no `immutable`) [PREVIEW-CHECK]

## Follow-ups for the PR body

None required. Note: after launch a returning visitor's browser keeps old `/_astro/` files for
up to a year, which is harmless because new HTML points at new hashed names.
