# Chore plan: svg-csp-link-schema (issue #95)

Branch: `chore/svg-csp-link-schema`, from `main` at 87a8389 (after #104 merged).
Issue: https://github.com/drcdev/dcc-web/issues/95 (repo `drcdev/dcc-web`, confirmed with
`git remote get-url origin`). The PR body says `Closes #95`.

## Goal

Close three small hardening gaps from the 2026-10-04 security review
([#95](https://github.com/drcdev/dcc-web/issues/95), scope as Don trimmed it in the issue
comments). The site's real Content Security Policy is a `<meta>` tag, so it only covers HTML
pages. An authored SVG diagram served from `/_astro/` gets only the thin header policy, and
when someone opens it directly it runs as a same-origin document. A path-scoped `_headers`
rule now gives `/_astro/*.svg` a locked-down policy with `sandbox`. The policy still allows
what the diagrams need: inline styles and the `data:` Inter glyph subsets. The shared
`linkTarget` schema is meant to accept "internal or https" addresses, but it also accepts
protocol-relative `//host` addresses. It now rejects them, and the section schemas' copy of
the same regex gets the same fix. Research for feature 002 lists `upgrade-insecure-requests`,
which the code has never sent, so that line is removed and research matches the code. Readers
see no change: every diagram renders the same, and no committed content uses a `//` address.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **SVG rule present.** `public/_headers` has exactly six rules, in this order: `/*`,
   `/_astro/*`, `/_astro/*.svg`, `/writing/*/question-source.json`, the workers.dev host rule
   and the `new.doncoleman.ca` host rule. `/_astro/*.svg` sets exactly one header:
   `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; font-src data:; sandbox`.
   Every other rule is byte-identical to today's.
2. **Test first.** The new and changed cases in `tests/unit/site/headers.test.ts` are seen
   failing before `public/_headers` changes, then pass.
3. **The SVG policy is minimal.** The unit test checks that the value has no `script-src`, no
   `'unsafe-eval'`, no `allow-` sandbox token, no `https:` and no `'self'`. It also checks that
   `default-src 'none'` and a bare `sandbox` are present.
4. **The served rule reaches real SVGs (one-off check, not a committed test).** After
   `pnpm run build`, `dist/_astro/` holds at least one `*.svg` (a project diagram). Under
   `wrangler dev`, `curl -sI` on that path returns a `content-security-policy` value that holds
   both the `/*` policy and the SVG policy, joined by `, `. A CSS or JS file under `/_astro/`
   still returns exactly the `/*` policy. Record the output in the implement summary.
5. **No visual change.** Opening a served diagram directly in Chromium under `wrangler dev`
   shows Inter text and no CSP console errors. Record this in the implement summary.
   `pnpm run test:visual` passes and no baseline file changes.
6. **Link schema.** `linkTarget` rejects `//example.com` and `/\example.com`, and still accepts
   `/services/`, `/` and `https://example.com/`. The new cases in
   `tests/unit/content/page-schema.test.ts` and `tests/unit/content/section-schemas.test.ts`
   are seen failing first. `src/components/sections/schemas.ts` imports `linkTarget` and has
   no regex of its own.
7. **Research matches the code.** `grep -rn "upgrade-insecure-requests"` over the repository
   (excluding `node_modules` and `.reference`) finds nothing.
8. **Scope of the diff.** `git diff --name-only main` lists only `public/_headers`,
   `tests/unit/site/headers.test.ts`, `src/content/schemas/shared.ts`,
   `src/components/sections/schemas.ts`, `tests/unit/content/page-schema.test.ts`,
   `tests/unit/content/section-schemas.test.ts`, `specs/002-site-foundation/research.md`,
   `docs/testing.md` and `.specify/chores/svg-csp-link-schema/**`.
9. `pnpm run verify:quick` is green, then the full gate before the PR.

## Scope

**In:**

- `public/_headers`: one new rule for `/_astro/*.svg` (W2).
- `tests/unit/site/headers.test.ts`: six rules, plus the SVG rule's exact value and its
  minimality (W1).
- `src/content/schemas/shared.ts` `linkTarget` regex and message. `src/components/sections/schemas.ts`
  reuses it instead of its duplicate `address` regex. Both schema tests are updated (W3, W4).
- `specs/002-site-foundation/research.md`: drop `upgrade-insecure-requests` from the R8
  directives list (W5).
- `docs/testing.md`: one sentence saying `headers.test.ts` also covers the SVG policy (W5).

**Out:**

- `/files/*` (PDFs) keeps the site-wide policy. A `sandbox` CSP breaks Chrome's PDF viewer
  (Don, issue comment).
- A separate questions database or binding. The D1 rename is already merged as #102.
- A served-header E2E test for the SVG rule. The issue says "One test covers the rule", so the
  unit test over `_headers` is the only committed layer. Acceptance 4 checks the served
  response once by hand.
- Any change to `astro.config.mjs` `security.csp`, to the `/*` rule or to the SVG files and
  `scripts/fonts/diagram-fonts.ts`.
- The inline SVG icons in `src/icons/`. Astro inlines them as components, so they are never
  served as documents.

**Follow-ups for the PR body:**

- A diagram that later needs more than inline styles and `data:` fonts will be blocked when
  opened directly. An embedded raster `<image>` would need `img-src data:`. The diagram-font
  unit tests (`diagram-fonts.test.ts`) already forbid external references, so this would show
  up when the diagram is authored.
- Other non-HTML documents under `/_astro/` (none today besides SVG) would still get only the
  thin policy. Revisit if Astro ever emits HTML-capable files there.

## Constitution Check

- **I. Test-First:** each behaviour change has a failing test first (W1 before W2; the schema
  cases in W3 and W4 before the regex change). The research edit is `no behaviour: n/a`.
- **II. Automated Release Gate:** no check is skipped or weakened. The headers test grows
  stricter (one more rule pinned exactly).
- **III. Human Review for Major Changes:** **fires**: "changes CI, deployment or infrastructure
  configuration". `public/_headers` is the deployment and security header configuration for
  Workers static assets. `.github/CODEOWNERS` lists it under "Paths that are major changes by
  definition", the same verdict as the `cache-fingerprinted-assets` chore (#74). No other
  criterion fires: no dependency, contact data, design, layout, navigation or constitution
  change, and no cost. Verdict: **major**. Auto-merge off, Don checks the preview (the
  `[PREVIEW-CHECK]` in W2) and approves.
- **IV. First-Party Before Custom:** the fix uses Cloudflare's own `_headers` file, one rule
  with no Worker code. The schema fix uses Zod's `regex` through `astro/zod`. A meta CSP inside
  the SVG was considered: an SVG `<meta>` is not a supported CSP carrier, and `sandbox` is
  header-only (MDN), so only the header works.
- **V. Static by Default:** unchanged. No Worker code is touched; the rule applies to static
  assets.
- **VI. Content as Files:** strengthened. An invalid `//host` link now fails the build.
- **VII. Private Data:** not touched.
- **VIII. Cloudflare Best Practices:** follows the documented `_headers` behaviour for static
  assets (splat, comma-joined overlapping rules). The issue cites VIII as permitting the rule.
- **IX. Cost Ceiling:** no cost.
- **X. Accessible, Fast and Private:** no rendering change, so no accessibility or performance
  change. The policy only tightens privacy and security.
- **XI. Spec Kit Workflow:** a chore on `chore/svg-csp-link-schema`, planned under
  `.specify/chores/`. No other worktree edits these files.

## Work items

### W1: Unit tests for the SVG rule (test first)

- [x] W1 done
- **Files:** `tests/unit/site/headers.test.ts`.
- **Test:** unit over config, new-first. **Layer: unit**, the cheapest layer that can observe
  the rule text. No second layer (the issue's "one test"; the served check is acceptance 4,
  done by hand once).
- **Edits:**
  - Add `const SVG_RULE = "/_astro/*.svg";` and
    `const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; sandbox";`.
  - Rename "has exactly five rules ..." to "has exactly six rules, in order: every path, the
    fingerprinted build files, the SVG documents, the question source files, workers.dev
    previews and the review host". Expect
    `["/*", ASTRO_RULE, SVG_RULE, QUESTION_SOURCE_RULE, WORKERS_DEV_RULE, REVIEW_HOST_RULE]`.
  - New case (#95): "sets only the sandboxed SVG Content-Security-Policy on /_astro/*.svg". The
    rule's entries equal `[["content-security-policy", SVG_CSP]]`. Comment: an SVG opened
    directly is a document, and the page's meta policy does not reach it. Overlapping
    `_headers` rules join the same header with a comma, so the browser enforces both this
    policy and the `/*` policy. The inline `<style>` and the `data:` Inter faces are what the
    diagrams need.
  - New case: "keeps the SVG policy minimal". Split the value on `;` into directives and
    require `default-src 'none'` and a `sandbox` directive with no tokens. Forbid `script-src`,
    `unsafe-eval`, `allow-`, `https:` and `'self'`.
  - The existing "keeps the header-only CSP free of script and style sources" stays scoped to
    `/*` (`starRule()`). Its comment gains one clause: the SVG rule's `style-src` applies only
    to SVG documents.
  - No `specs/` path literals (changed-paths drift guard). The comment cites issue #95.
- **Red run:** the six-rules case and both SVG cases fail against today's file; every other
  case passes.

### W2: Add the `/_astro/*.svg` rule

- [x] W2 done
- **Files:** `public/_headers`.
- **Test:** existing: W1 turns green.
- **Edit:** insert after the `/_astro/*` block:

  ```
  /_astro/*.svg
    Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; font-src data:; sandbox
  ```

  Nothing else in the file changes. Do not detach (`! Content-Security-Policy`) the `/*`
  policy. Keeping both is simpler, and the two are compatible (the `/*` policy has no fetch
  directives).
- **One-off checks (acceptance 4 and 5):** run `pnpm run build`, then `wrangler dev` (check
  `lsof -i :4321` first; sibling worktrees share the port). `curl -sI` one
  `/_astro/*.svg` and one `/_astro/*.css` and record both CSP values. Open the SVG URL in
  Playwright Chromium (a scratch script, not committed) and confirm the text renders in Inter
  with no CSP console error. Record the results in the implement summary.
- [PREVIEW-CHECK] On the PR preview, open a project page with a diagram and confirm it looks
  unchanged. Open the diagram's `/_astro/….svg` URL directly and confirm it renders with
  Inter text. In DevTools, the response's `content-security-policy` holds both policies.

### W3: `linkTarget` rejects protocol-relative addresses (test first, then fix)

- [x] W3 done
- **Files:** `tests/unit/content/page-schema.test.ts`, then `src/content/schemas/shared.ts`.
- **Test:** new-first. **Layer: unit (schema)**, the cheapest layer that can observe a schema
  rule. No second layer.
- **Test edit:** add a case "rejects a cta address that is protocol-relative (#95)" that
  rejects `href: "//example.com/"` and `href: "/\\example.com/"`. Also add an accepts case for
  `/`, `/services/` and `https://example.com/`. Use neutral example data only.
- **Fix:** `z.string().regex(/^(\/(?![/\\])|https:\/\/)/, "use an address that starts with a single / or with https://")`.
  Update the doc comment to say that `//host` is not internal. Judgment call: also reject
  `/\host`, because browsers treat a backslash after the scheme-less `/` as `//` for http(s)
  URLs, so it is the same off-site link.
- **Red run:** the reject cases fail before the regex changes. The accept cases pass
  throughout.

### W4: Section schemas reuse `linkTarget` (test first, then fix)

- [x] W4 done
- **Files:** `tests/unit/content/section-schemas.test.ts`, then
  `src/components/sections/schemas.ts`.
- **Test:** new-first. **Layer: unit (schema).** No second layer.
- **Test edit:** in the `CallToAction` and `Offering` cases, `//example.com` and
  `/\example.com` are rejected as `href`.
- **Fix:** delete the local `address` const and
  `import { linkTarget } from "../../content/schemas/shared.ts"`. `Offering.href` becomes
  `linkTarget.optional()` and `CallToAction.href` becomes `linkTarget`. Judgment call: the
  issue names only `linkTarget`, but this file holds a copy of the same regex for the same
  "internal or https" meaning, so leaving it would keep the gap open in section props.
- **Red run:** the new rejects fail before the import swap.

### W5: Research and testing docs

- [x] W5 done
- **Files:** `specs/002-site-foundation/research.md`, `docs/testing.md`.
- **Test:** `no behaviour: n/a (documentation only; the code never sent upgrade-insecure-requests)`.
- **Edits:**
  - research.md R8 (around line 220): remove `, "upgrade-insecure-requests"` from the
    `directives` list. Add one sentence after the `_headers` bullet: `upgrade-insecure-requests`
    is not used, because every source is `'self'` and HSTS is on (#95). Leave the rest of R8
    unchanged.
  - docs/testing.md, the fonts paragraph sentence "while `headers.test.ts` checks the rule
    itself": add that `headers.test.ts` also pins the sandboxed CSP on `/_astro/*.svg` (#95),
    checked only at the unit layer.

## Docs citations

- **Cloudflare Workers static assets, Headers**
  (https://developers.cloudflare.com/workers/static-assets/headers/, fetched 2026-10-04):
  "If a header is applied twice in the `_headers` file, the values are joined with a comma
  separator." Detach exists: "prepending the header name with an exclamation mark and space
  (`! `)". The page also says: "You may only include a single splat in the URL", and it "will
  greedily match all characters". There are at most 100 rules and 2,000 characters per line.
  `_headers` does not apply to Worker-generated responses (irrelevant here: only `/api/*`
  runs Worker code). The page does not say whether a splat may sit mid-path. The installed
  asset worker answers that: `node_modules/.pnpm/miniflare@5.20260926.1-alpha…/miniflare/dist/src/workers/assets/assets.worker.js`
  (`../workers-shared/asset-worker/src/utils/rules-engine.ts`) builds each rule as
  `rule.split("*").map(escapeRegex).join("(?<splat>.*)")`, anchored `^…$`, so `/_astro/*.svg`
  matches `^/_astro/.*\.svg$`. `attachCustomHeaders` applies matches in file order: the first
  match `set`s a header and later matches `append` to it. That confirms the comma join, and
  the order is `/*` first, then `/_astro/*.svg`. Acceptance 4 confirms it on a served
  response.
- **MDN, CSP `sandbox`**
  (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox):
  it "enables a sandbox for the requested resource similar to the `<iframe>` `sandbox`
  attribute ... preventing the execution of plugins and scripts, and enforcing a same-origin
  policy". With no values it is the most restrictive sandbox. "This directive is not supported
  in the `<meta>` element or by the `Content-Security-Policy-Report-Only` header field", so a
  response header is the only carrier.
- **CSP multiple policies** (CSP Level 3, "Enforcing multiple policies"): a comma-separated
  header value is several policies, and a resource must pass all of them. The `/*` policy
  (`frame-ancestors`, `object-src`, `base-uri`) has no fetch directive, so it adds no
  restriction the SVG policy would have to work around.
- **Astro images** (Astro Docs MCP, `guides/images`): images in `src/` are processed and
  emitted under `/_astro/` with a content hash (example output `/_astro/my_image.hash.webp`).
  Imported SVG components are inlined into the HTML, so the icons in `src/icons/` are not
  served as files.
- **Zod via `astro/zod`**: `z.string().regex(re, message)` is the existing pattern. No new Zod
  feature is used.

## Risks

- **The splat may not reach the real output path.** If Astro emitted diagrams somewhere other
  than `/_astro/<name>.<hash>.svg`, the rule would match nothing and the unit test would still
  pass. Acceptance 4 checks this once on the real build, by hand, in place of a second
  committed layer, as the issue asks.
- **Browsers rendering an SVG through `<img>`.** CSP applies to documents. An SVG drawn as an
  image is already script-free, and Chromium does not apply the image response's CSP to it.
  If any browser did apply it, the policy already allows everything the diagrams use (one
  inline `<style>`, `data:font/woff2` faces, same-document `url(#arrow)` markers), so the
  rendering is the same either way. No visual change is expected. The visual project does not
  snapshot real diagrams anyway.
- **`sandbox` gives a directly opened SVG an opaque origin.** That blocks nothing the diagrams
  use: `data:` fonts load, and fragment references are not fetches.
- **Port collisions** with sibling worktrees during the one-off `wrangler dev` check (4321).
  Check `lsof -i :4321` first.
- **A protocol-relative link in future content** now fails the build. That is intended
  (Principle VI). Today no content uses `//` or `/\`.
- **Major change.** `public/_headers` is a CODEOWNERS path. The PR needs the major-change
  flow, auto-merge off and Don's review of the preview.
