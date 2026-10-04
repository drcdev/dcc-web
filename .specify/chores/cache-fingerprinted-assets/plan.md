# Chore plan: cache-fingerprinted-assets (issue #74)

Branch: `chore/cache-fingerprinted-assets`, from `main` at cf9c97c (after #72 merged).
Issue: https://github.com/drcdev/dcc-web/issues/74. The PR body says `Closes #74`.

## Goal

PR #72 gave the self-hosted font files a one-year immutable cache rule (`/_astro/fonts/*` in
`public/_headers`) because Astro puts a content hash in their names. Every other file Astro
emits under `/_astro/` (the page stylesheets, the bundled scripts such as the contact form
script, and the processed images) is named the same way but still gets Cloudflare's default
`Cache-Control: public, max-age=0, must-revalidate`, so a returning visitor revalidates each one.
This chore ([#74](https://github.com/drcdev/dcc-web/issues/74)) widens the one rule from
`/_astro/fonts/*` to `/_astro/*`, so every fingerprinted build file is cached for a year and a
repeat visit downloads nothing that has not changed. The pages look and behave exactly the same;
only the cache lifetime of hashed files changes.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Unit tests seen failing first.** The W1 edits to `tests/unit/site/headers.test.ts` fail
   against the current `public/_headers` and pass after W3. The implement summary records the
   red run.
2. **E2E test seen failing first.** The W2 rewrite of the stylesheet test in
   `tests/e2e/headers.spec.ts` fails against a build with the current `_headers` (the
   stylesheet has no `immutable`) and passes after W3 and a rebuild.
3. **One rule, exact text.** `public/_headers` has exactly four rules, in order: `/*`,
   `/_astro/*`, `https://:worker.:subdomain.workers.dev/*`, `https://new.doncoleman.ca/*`.
   The `/_astro/*` rule carries exactly one header,
   `Cache-Control: public, max-age=31536000, immutable`. No other rule sets `Cache-Control`.
   The `/*` and host rules are byte-identical to today.
4. **Served responses (wrangler dev, as production).** On `/` and `/contact/`, every
   `/_astro/` stylesheet and script URL returns 200 with
   `cache-control: public, max-age=31536000, immutable` and the full `/*` security header set.
   The font test still passes with its assertions unchanged. The HTML at `/` does not carry
   `immutable` (new assertion in W2, so an over-broad rule can never cache pages for a year).
5. **Nothing unhashed can sit under `/_astro/`.** `public/` has no `_astro` directory (new W1
   unit case), so the only files served under `/_astro/` are Astro's hashed build output.
6. **Scope of the diff:** `git diff --name-only main` lists only `public/_headers`,
   `tests/unit/site/headers.test.ts`, `tests/e2e/headers.spec.ts`, `docs/testing.md`,
   `specs/018-self-hosted-fonts/contracts/fonts.md`, `specs/018-self-hosted-fonts/spec.md`
   and `.specify/chores/cache-fingerprinted-assets/**`. No visual baseline, `astro.config.mjs`,
   `wrangler.jsonc`, worker code, CLAUDE.md or pipeline skill changes.
7. `pnpm run verify:quick` is green, then the full gate before the PR (after asking Don).

**Before measurement** (the live domain is not yet on this deployment, so the rule text is the
measurement; at cf9c97c):

| What | Before | After |
|---|---|---|
| `public/_headers` cache rule | `/_astro/fonts/*` → `Cache-Control: public, max-age=31536000, immutable` | `/_astro/*` → same value |
| `/_astro/` files with the immutable header | the 4 Inter `.woff2` files only | every file under `/_astro/` (CSS, JS, images, fonts) |
| `/_astro/` CSS, JS and images | Cloudflare default `public, max-age=0, must-revalidate` (one revalidation request each on a repeat visit) | `public, max-age=31536000, immutable` (no request on a repeat visit) |
| E2E `the page stylesheet is not marked immutable` | pins the default | replaced by the W2 test asserting immutable |
| Unit `has exactly four rules ...` | second rule `/_astro/fonts/*` | second rule `/_astro/*` |

Preview checks (on `br-chore-cache-fingerprinted-assets-dcc-web-preview.drc-dev.workers.dev`
once the PR exists):

- [ ] `curl -sI` of the `/_astro/*.css` URL linked from `/` shows `cache-control: public, max-age=31536000, immutable` [PREVIEW-CHECK]
- [ ] `curl -sI` of the `/_astro/*.js` URL on `/contact/` and of one `/_astro/` image shows the same header, plus `x-robots-tag: noindex` (the host rule still applies) [PREVIEW-CHECK]
- [ ] `curl -sI` of `/` still shows the default `cache-control` (no `immutable`) [PREVIEW-CHECK]

## Scope

**In:**

- `public/_headers`: the one rule path, `/_astro/fonts/*` → `/_astro/*`.
- `tests/unit/site/headers.test.ts`: rule constant, rule list, the cache-rule cases, the new
  `public/_astro` guard, comments.
- `tests/e2e/headers.spec.ts`: replace the "not immutable" stylesheet test; adjust the font
  test's comment.
- `docs/testing.md`: the Fonts paragraph (it says `headers.spec.ts` covers "the `immutable`
  cache header", which today means fonts only).
- `specs/018-self-hosted-fonts/contracts/fonts.md` rows F11 and F12, and the matching
  Follow-up bullet in `specs/018-self-hosted-fonts/spec.md`. **Decision: update them.** The
  test comments cite F10 to F12 by id so a search for the id finds the test; leaving F11 and F12
  stating the opposite of the code would make that search mislead. Each row keeps its id and
  text and gets a short "Superseded by #74:" note, rather than a rewrite, so the 018 history
  stays readable. The spec's Clarifications entry (`spec.md` line 50) is history and stays
  unchanged; the Follow-up bullet gets "(done in #74)".

**Out:**

- Any `astro.config.mjs` change (`build.assets`, `assetsPrefix`, Rollup file names). The default
  `_astro` directory is what the rule targets.
- Caching for HTML, `public/` files (`/og-default.png`, `/files/*`, `robots.txt`) or the
  sitemap. They are not fingerprinted, so they keep the default.
- A build-layer test that every file under `dist/_astro` carries a hash. Astro documents the
  hashed names (Docs citations) and the name patterns differ by kind (bundles, transformed
  images, Fonts API files), so a regex would be brittle and a build test is the most expensive
  layer. The `public/_astro` guard covers the one way an unhashed file could land there from
  this repo.
- The worker's `/api/*` `no-store` header (`worker/src/http.ts`): unchanged.

**Follow-ups for the PR body:** none required. Note that after launch a returning visitor's
browser keeps old `/_astro/` files for up to a year, which is harmless because new HTML points
at new hashed names.

## Constitution Check

- **I. Test-First:** W1 (unit) and W2 (E2E) are written and seen red before W3 changes the rule.
- **II. Automated Release Gate:** no check is skipped or weakened. The one removed assertion
  ("stylesheet not immutable") pinned the behaviour this chore deliberately changes and is
  replaced by a stronger one (W2 coverage mapping).
- **III. Human Review for Major Changes:** fires: **"changes CI, deployment or infrastructure
  configuration"**. `public/_headers` is deployment configuration for the Workers static assets
  and is listed in `.github/CODEOWNERS` under "Paths that are major changes by definition"
  (pinned by `tests/unit/setup/drift.test.ts`). No other criterion fires: no dependency,
  contact data, design, layout or constitution change, and no cost increase (fewer requests, if
  anything). Verdict: **major**. Label `major-change`, auto-merge off, Don reviews the preview
  (the `[PREVIEW-CHECK]` lines above) and approves.
- **IV. First-Party Before Custom:** the first-party option is used: one Cloudflare `_headers`
  rule over Astro's default `_astro` output directory. No worker code, build script or
  post-build header generation. Both docs are cited below; the Astro Docs MCP was available.
- **V. Static by Default:** unchanged; no page or script added.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged; no cookie or personal data in any header.
- **VIII. Cloudflare Best Practices:** follows Cloudflare's own guidance to cache fingerprinted
  assets as `immutable`; only `/api/*` runs Worker code; the rule stays in the committed
  `_headers`, deployed through CI.
- **IX. Cost Ceiling:** no new cost; fewer revalidation requests.
- **X. Accessible, Fast and Private:** faster repeat visits; no third-party script; budget and
  a11y projects untouched.
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/cache-fingerprinted-assets/` per
  `/chore`. `public/_headers` and `tests/e2e/headers.spec.ts` are not known to be edited by any
  sibling worktree.

## Work items

### W1: Unit tests for the widened rule (test first)

- [ ] W1 done
- **Files:** `tests/unit/site/headers.test.ts`.
- **Test:** unit over config, new-first. **Layer: unit**, the cheapest layer that can observe
  the rule text.
- **Edits:**
  - Replace `FONTS_RULE = "/_astro/fonts/*"` with `ASTRO_RULE = "/_astro/*"` and update every use.
  - Rename "has exactly four rules, in order: every path, the font files, workers.dev previews
    and the review host" to "... every path, the fingerprinted build files, workers.dev
    previews and the review host" and expect `["/*", ASTRO_RULE, WORKERS_DEV_RULE,
    REVIEW_HOST_RULE]`.
  - Rename "sets only the immutable year-long Cache-Control on /_astro/fonts/*" to "... on
    /_astro/*"; same expected entries. Comment: issue #74 widened F12/FR-015 from the font files
    to every content-hashed file Astro emits under `/_astro/`; one rule only, because
    overlapping `_headers` rules join the same header with a comma.
  - "sets Cache-Control on no other rule": exempt `ASTRO_RULE`.
  - New case: "public/ has no _astro directory, so only Astro's hashed build output is served
    under /_astro/" (`existsSync` on `public/_astro` is false).
- **Red run:** the four-rules, `/_astro/*` and no-other-rule cases fail against today's file;
  the new `public/_astro` case passes from the start (it is a guard on an invariant, not a
  behaviour change). Record this in the implement summary.

### W2: E2E test that served stylesheets and scripts are immutable (test first)

- [ ] W2 done
- **Files:** `tests/e2e/headers.spec.ts`.
- **Test:** new-first, replacing an existing test. **Layer: E2E (served response).** Second
  layer reason, written in the test comment: the unit test reads the rule text; only the
  response `wrangler dev` serves shows that the splat reaches Astro's real CSS and JS paths and
  replaces Cloudflare's default `Cache-Control` (the same reasoning as the existing font test).
- **Edits:**
  - Replace `the page stylesheet is not marked immutable` with "every fingerprinted stylesheet
    and script is immutable and carries the full security header set". For `/` and `/contact/`,
    collect the `href` of `link[rel="stylesheet"]` and the `src` of `script[src]` that start
    with `/_astro/`; require at least one `.css` and at least one `.js` URL across both pages
    (the contact form script is a bundled `/_astro/*.js` today); for each URL, `request.get`
    returns 200, `cache-control` is exactly `public, max-age=31536000, immutable`, and every
    entry of `HEADERS` matches.
  - In the same test (or a second short one), `request.get("/")` returns a `cache-control` that
    does not contain `immutable`, so a future over-broad rule cannot cache HTML for a year.
  - Font test: keep its assertions; change its head comment from "(F10, F11; ...)" to cite F10
    and #74, since F11 no longer means "other files are not immutable".
  - Reference issue #74 in comments; no `specs/` path literals (changed-paths drift guard) and
    no real post or project names (content literal guard).
- **Coverage mapping:** removed "the page stylesheet is not marked immutable" (asserted the
  default on `/`'s stylesheet) → its subject, the stylesheet on `/`, is now asserted immutable
  by the new test; its "not every response is immutable" intent moves to the new HTML
  assertion on `/`.
- **Red run:** with today's `_headers`, run `pnpm run build` and the E2E project for
  `headers.spec.ts` only (check `lsof -i :4321` first; sibling worktrees share the port). The new
  test fails on the stylesheet's header; the HTML assertion passes.

### W3: Widen the rule in `public/_headers`

- [ ] W3 done
- **Files:** `public/_headers`.
- **Test:** existing: W1 and W2 turn green (rebuild `dist` so the copied `_headers` updates;
  the fixture build copies `public/` too).
- **Edit:** change the line `/_astro/fonts/*` to `/_astro/*`. The header line stays
  `  Cache-Control: public, max-age=31536000, immutable`. Do not keep both rules: overlapping
  rules would comma-join the value into a duplicate. Nothing else in the file changes.
- This is the first-party option (Principle IV): one Cloudflare `_headers` rule, no worker or
  script change.

### W4: Docs and the 018 contract rows

- [ ] W4 done
- **Files:** `docs/testing.md`, `specs/018-self-hosted-fonts/contracts/fonts.md`,
  `specs/018-self-hosted-fonts/spec.md`.
- **Test:** no behaviour: n/a (documentation).
- **Edits:**
  - `docs/testing.md` Fonts paragraph: replace "and `headers.spec.ts` the `immutable` cache
    header" with a clause saying `headers.spec.ts` checks that the fonts and every other
    fingerprinted file under `/_astro/` (stylesheets and scripts) are served with the year-long
    `immutable` header (#74), and `headers.test.ts` checks the rule itself. Leave the "Where a
    test goes" bullets, the Visual coverage section and every CLAUDE.md-aligned sentence
    byte-identical.
  - `contracts/fonts.md`: F11 gets "Superseded by #74: every file under `/_astro/`, including
    the stylesheet, carries `Cache-Control: public, max-age=31536000, immutable`." F12 gets
    "Superseded by #74: the second rule is `/_astro/*` (only `Cache-Control`)." Keep the
    original text so the history reads.
  - `spec.md` Follow-up work: append "(done in #74)" to the `/_astro/` cache bullet.

## Docs citations

- Cloudflare, Workers static assets, Headers:
  https://developers.cloudflare.com/workers/static-assets/headers/ (fetched 2026-10-04).
  When a request matches several rules all their headers apply, and the same header in two
  rules is joined with a comma (so one `/_astro/*` rule, not two overlapping ones). A splat `*`
  greedily matches all characters, so `/_astro/*` also covers `/_astro/fonts/<hash>.woff2`.
  Static assets default to `Cache-Control: public, max-age=0, must-revalidate`, which a custom
  rule replaces. The page recommends `public, max-age=..., immutable` for fingerprinted assets.
  Limit: 100 rules (we keep four).
- Astro, Configuration Reference, `build.assets`:
  https://docs.astro.build/en/reference/configuration-reference/#build-options (via the Astro
  Docs MCP). `build.assets` defaults to `'_astro'`, "the directory in the build output where
  Astro-generated assets (bundled JS and CSS for example) should live"; this repo does not set
  it (`astro.config.mjs`).
- Astro, Recipes, Customize file names in the build output:
  https://docs.astro.build/en/recipes/customizing-output-filenames/ (via the Astro Docs MCP).
  "`astro build` ... outputs your built assets ... into an `_astro` directory with hashed
  filenames (e.g. `_astro/index.DRf8L97S.js`) which are excellent for long-term caching", and
  files from `public/` are copied as-is and not renamed (hence the W1 `public/_astro` guard).
  Transformed images are named `<base>_<hash><ext>` (Image and Assets API Reference,
  `propsToFilename()`, https://docs.astro.build/en/reference/modules/astro-assets/#propstofilename).
  An older local `dist/_astro` listing confirms the pattern (for example `pages.BTloIlDE.css`,
  `ContactForm.astro_astro_type_script_index_0_lang.CNsReVCF.js`, `don-coleman.D3lPlbnp_IqTy0.webp`).

## Risks

- **An unhashed file under `/_astro/` would be cached for a year.** Only a `public/_astro/`
  directory could put one there from this repo; the W1 guard fails if it appears.
  `prune-unreferenced-assets` only deletes files and never renames them.
- **Overlapping rule added later.** A future `/_astro/fonts/*` rule with `Cache-Control` would
  comma-join a duplicate value; the exact four-rule unit test catches it.
- **E2E port collisions** with sibling worktrees (4321/4322): run `headers.spec.ts` alone, check
  `lsof -i :4321` first, rerun on spurious `ECONNREFUSED`.
- **Contact page script inlined in a future Astro release.** The W2 test requires at least one
  `.js` URL across `/` and `/contact/`; if Astro inlines it, the test fails loudly and the
  requirement is revisited, not silently skipped.
- **Major-change process.** CODEOWNERS review and the `major-change` label are required; the PR
  is opened from `drc-agents`, with auto-merge off.
- **Visual baselines:** untouched (no shell, template or design change).
