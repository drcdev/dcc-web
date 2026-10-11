# Chore plan: worker-custom-domains (issue #156)

Branch: `chore/worker-custom-domains`, from `main` at 419d4b6 (after #154, the www main address).
Issue: https://github.com/drcdev/dcc-web/issues/156. The PR body says `Closes #156`.

## Goal

The production Worker `dcc-web` is served on `www.doncoleman.ca` through a Custom Domain that Don
attached by hand in the Cloudflare dashboard during the #129 live swap (PR #154, done 2026-10-10;
the bare domain's Custom Domain was removed in the same sitting). Principle VIII says Worker
configuration is committed and applied through CI, never set by hand in the dashboard, so this
chore ([#156](https://github.com/drcdev/dcc-web/issues/156)) declares `www.doncoleman.ca` as the
Worker's Custom Domain in `wrangler.jsonc` (`routes` with `custom_domain: true`). Wrangler then
applies it on every production deploy, the domain is under review and version control, and it
cannot drift from what setup item 18 (`live-hosts`) expects. The bare domain `doncoleman.ca` stays a
redirect-only hostname (proxied `AAAA doncoleman.ca 100::` placeholder plus a 301 redirect rule) and
is **not** declared. The preview Worker must not inherit the route, and the generated Playwright
config must not carry it. Because `www` is already attached to `dcc-web`, the next production deploy
should be a no-op for routing; that is confirmed after merge.

This uses Wrangler's first-party `routes` / `custom_domain` configuration rather than a custom
script or an API call in the deploy step (Principle IV).

## Acceptance

Mechanical criteria (the review phase checks each one).

**Before state (419d4b6):** `grep -c '"routes"' wrangler.jsonc` prints `0` (no `routes` at the top
level or under `env.preview`); `tests/unit/site/config-files.test.ts` has no assertion on `routes`;
`scripts/e2e-wrangler-config.ts` drops only `ai` and `$schema`.

1. **Tests seen failing first.** The new assertions in W1 and W2 are run red against the
   before-state before W3 / W2's implementation, and the implement summary records each red run.
2. **Production routes.** Top-level `wrangler.jsonc` has exactly
   `"routes": [{ "pattern": "www.doncoleman.ca", "custom_domain": true }]`. The test derives the
   expected host from `FALLBACK_ORIGIN` in `src/lib/site-origin.ts` (the production address), so
   it checks the invariant "production's only route is a Custom Domain on the site's own host", not
   a copied literal.
3. **No bare domain.** No route in any environment has the pattern `doncoleman.ca` (implied by 2 for
   production; asserted for every environment).
4. **Preview does not inherit.** `env.preview` has `"routes": []`, and Wrangler's own resolution
   (`unstable_readConfig({ config, env: "preview" })` from `wrangler`) returns an empty `routes`
   for the preview environment with no diagnostics warning about inherited custom domains.
5. **E2E config has no routes.** The generated `wrangler.e2e.json` content (produced by a pure
   function the generator calls) has no `routes` at the top level or under any environment, and
   still has no `ai` and no `$schema`.
6. **Types unchanged.** `pnpm run typecheck` (which runs `wrangler types --check`) passes with
   `worker/worker-configuration.d.ts` unchanged.
7. **Existing suites green.** The `worker/` Vitest projects (production and preview, which read
   `wrangler.jsonc` through `@cloudflare/vitest-plugin`) and the contact E2E journey (same-origin
   check under `wrangler dev`) pass unchanged.
8. **Docs.** `docs/setup.md` item 6 and item 18 say the `www` Custom Domain is declared in
   `wrangler.jsonc` and applied by each production deploy; the item 18 rollback says a hand removal
   of the `www` Custom Domain must be paired with a revert of the `routes` entry. The existing
   `tests/unit/setup/docs-structure.test.ts` item 18 assertions pass without edits.
9. **Scope of the diff:** `git diff --name-only main` lists only files named in the work items and
   `.specify/chores/worker-custom-domains/**`. No page, component, visual baseline,
   `public/_headers`, CI workflow, deploy script or setup-check code change.
10. The changed-paths gate tier (`changed-paths.ts --base origin/main`) is green locally, then CI.

**After merge (production deploy, Don, recorded in the PR body):**

- [ ] Workers Builds log for the `main` production deploy of `dcc-web` shows the deploy succeeded and lists `www.doncoleman.ca (custom domain)` among the triggers, with no conflict prompt or permission error [PREVIEW-CHECK]
- [ ] Workers & Pages → `dcc-web` → Settings → Domains & Routes lists the Custom Domain `www.doncoleman.ca` only (no `doncoleman.ca`), and `pnpm setup:check --item live-hosts` is complete [PREVIEW-CHECK]
- [ ] The `main` deploy of `dcc-web-preview` (`deploy --env preview`) succeeded and its Domains & Routes list no Custom Domain [PREVIEW-CHECK]

Branch builds of `dcc-web-preview` only run `versions upload`, which does not apply routes, so the
branch preview shows nothing about this change beyond the site still serving.

## Scope

**In:**

- `wrangler.jsonc` (top-level `routes`, `env.preview.routes: []`).
- `scripts/e2e-wrangler-config.ts` and a new pure helper `scripts/lib/e2e-wrangler-config.ts`
  (drop `routes` alongside `ai` and `$schema`).
- `tests/unit/site/config-files.test.ts` (new assertions).
- `docs/setup.md` items 6 and 18 (a few sentences each); the one-line comment in
  `scripts/setup-check/checks/cloudflare-worker.ts` only if it would otherwise read as hand-set.

**Out:**

- Declaring the bare domain `doncoleman.ca` (must stay a redirect-only hostname; attaching it would
  fail on its `AAAA` record and would break the 301).
- The redirect rule, the placeholder `AAAA` record and DNS baseline (`setup/dns-baseline.json`):
  zone configuration, not Worker configuration.
- Setup-check code and `scripts/setup-check/items.ts` wording: item 6's text ("production is served
  only on the Custom Domain") stays true; item 18 already probes the live hosts.
- Deploy scripts (`scripts/deploy/*`): `wrangler deploy` applies `routes` itself.
- Any dashboard change by the agent.

**Follow-ups for the PR body:**

- Setup check: read the Worker's attached Custom Domains through Cloudflare's API
  (`GET /accounts/{account_id}/workers/domains`) and compare them with `wrangler.jsonc` `routes`, so
  a hand-added or hand-removed domain is reported directly rather than only through the HTTP probes
  of item 18.

## Constitution Check

- **I. Test-First:** W1 and W2 add failing unit assertions before the config and generator change;
  W4 is docs-only and says why no new test applies.
- **II. Automated Release Gate:** no check skipped or weakened; production still deploys only from
  `main` through `deploy:production`, which now also applies the declared route.
- **III. Human Review of Every Change:** normal flow, Don approves; the after-merge checks are
  listed as `[PREVIEW-CHECK]` items in the PR body; auto-merge armed after the final push.
- **IV. First-Party Before Custom:** Wrangler's own `routes` with `custom_domain: true` and its
  per-environment override; no custom script or API call. No Astro decision is made, so no Astro
  docs page applies.
- **V. Static by Default:** unchanged; `run_worker_first` stays `["/api/*"]`, no endpoint added.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged; no data path touched.
- **VIII. Cloudflare Best Practices:** brought into line: the Custom Domain moves from a dashboard
  setting to committed Worker configuration applied by the deploy.
- **IX. Cost Ceiling:** no cost; Custom Domains are free.
- **X. Accessible, Fast and Private:** unchanged; no page, script or budget change.
- **XI. Spec Kit Workflow:** `/chore` branch and `.specify/chores/worker-custom-domains/`.
  `wrangler.jsonc` and `docs/setup.md` are shared hot files; implement merges `origin/main` before
  the gate and resolves any conflict there.

## Work items

### W1: Config unit tests for production and preview routes (test first)

- [x] W1 done (red against 419d4b6: the routes and preview tests fail until W3; the bare-domain test passes vacuously; the Wrangler inherit-warning sub-assertion was dropped, the raw `routes: []` check covers the cause)
- **Files:** `tests/unit/site/config-files.test.ts`.
- **Test:** unit over config, new-first. **Layer: unit**, the cheapest layer that can observe the
  config and Wrangler's resolution of it.
- **Edits (new `it` blocks in the existing `wrangler.jsonc` describe):**
  - "serves production only on a Custom Domain for the site's own host (#156)": `config.routes`
    equals `[{ pattern: new URL(FALLBACK_ORIGIN).hostname, custom_domain: true }]`, importing
    `FALLBACK_ORIGIN` from `src/lib/site-origin.ts`.
  - "never declares the bare domain in any environment": for the top level and every
    `config.env[*]`, no route `pattern` equals the hostname with a leading `www.` removed.
  - "keeps the preview Worker off the production Custom Domain": `config.env.preview.routes` is
    `[]`, and `unstable_readConfig({ config: wranglerPath, env: "preview" })` (from `wrangler`, as
    `worker/vitest.config.ts` already uses) resolves `routes` to an empty array (or `undefined`
    treated as empty). If `unstable_readConfig` logs Wrangler's "inherits the top-level `routes`"
    warning, the test fails on it (spy on the warning output or check the diagnostics it exposes;
    implement picks whichever the 4.149.0 API offers, and drops this sub-assertion with a note if
    neither is reachable, since the raw `[]` check already covers the cause).
- Run red against 419d4b6 (no `routes` key) and record it.

### W2: E2E Wrangler config drops `routes` (test first)

- [x] W2 done (red: stub helper returned config unchanged, new test failed on the ai key; green with the helper; the generator-source test now reads both files)
- **Why:** `wrangler dev` infers its origin host from the first route (`getInferredHost` in
  wrangler 4.149.0, `dev.inferOriginFromRoutes` defaults to true) and passes it to Miniflare as the
  upstream, which rewrites `request.url` to `https://www.doncoleman.ca/...`. The contact API's
  `isSameOriginRequest` compares `Origin` (`http://127.0.0.1:4321`) with `url.origin`, so the
  contact E2E journey would get 403s. Dropping `routes` from the generated config keeps
  `wrangler dev` on its local origin. (Setting `dev.host` would also need an override; dropping
  the key matches how the generator already handles `ai`.)
- **Files:** new `scripts/lib/e2e-wrangler-config.ts` exporting a pure
  `toE2eWranglerConfig(config)` that returns a copy without `$schema`, `ai` and `routes` (top level
  and each env); `scripts/e2e-wrangler-config.ts` reads `wrangler.jsonc`, calls it and writes
  `wrangler.e2e.json` as today; `tests/unit/site/config-files.test.ts`.
- **Test:** new-first. **Layer: unit** (pure function over the real `wrangler.jsonc`). New `it`:
  "generates the e2e config without the ai binding or any route": apply `toE2eWranglerConfig` to
  the parsed `wrangler.jsonc`; no `ai`, `$schema` or `routes` at the top level or under any env;
  every other top-level key is kept. The existing "reaches the e2e Worker's flag only through the
  wrangler dev --var" test must still pass; it reads the generator source, so point it at both
  files (generator and helper) so it still covers the code that builds the config.
- Red run: write the test and an empty-bodied helper stub (or import failing) first, record red,
  then implement. The second-layer evidence is the existing contact E2E journey (acceptance 7), run
  in the gate, not a new test.

### W3: Declare the Custom Domain in `wrangler.jsonc`

- [ ] W3 done
- **Files:** `wrangler.jsonc`.
- **Edit:** after `preview_urls` at the top level add
  `"routes": [{ "pattern": "www.doncoleman.ca", "custom_domain": true }]`; in `env.preview` after
  `preview_urls` add `"routes": []`.
- **Test:** existing, W1 (turns green). Also run `pnpm run typecheck` (acceptance 6) and the
  `worker/` Vitest projects (acceptance 7). If a `dist/` build is present, optionally run
  `pnpm exec wrangler deploy --dry-run` and `--env preview --dry-run` (with `--env-file /dev/null`)
  and confirm no inherited-custom-domain warning; dry runs make no account change.

### W4: Setup docs say the `www` Custom Domain is in config

- [ ] W4 done
- **Files:** `docs/setup.md`; `scripts/setup-check/checks/cloudflare-worker.ts` header comment only
  if it needs one clause.
- **Edits:**
  - Item 6 "What it is for" / "Where to do it": production is served on the Custom Domain
    `www.doncoleman.ca`, declared in `wrangler.jsonc` `routes` and applied by each production
    deploy; do not add or remove it in the dashboard.
  - Item 18: one short paragraph before `### Live swap`: since #156 `wrangler.jsonc` declares the
    `www` Custom Domain, so step 3's hand attachment (done 2026-10-10) is now also applied by every
    production deploy; the steps stay as the record of the swap and as the rollback reference. The
    bare domain stays out of config.
  - Item 18 rollback, "After step 3": add that the `routes` entry must be reverted in a reviewed
    pull request as well, or the next production deploy re-attaches `www`.
  - Keep every phrase the docs-structure item 18 test looks for ("Custom Domain", "10 minutes",
    "remove the Custom Domain", "AAAA www", "AAAA doncoleman.ca 100::", "301",
    "Preserve query string") and the step numbering unchanged.
- **Test:** no behaviour: n/a (docs wording; the existing `docs-structure` test guards the runbook
  shape and must stay green without edits).

### W5: Gate

- [ ] W5 done
- Merge `origin/main`, run the changed-paths tier locally (Local toolchain rules), then let CI run.
  Collect the three `[PREVIEW-CHECK]` items for the PR body.

## Docs citations

- Cloudflare, Custom Domains: declaring one under `routes` with `custom_domain = true`, the
  existing-record restriction and exact-hostname matching —
  https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#set-up-a-custom-domain-in-your-wrangler-configuration-file
  and #add-a-custom-domain.
- Cloudflare, Wrangler configuration: `routes` is an inheritable key; environments override it —
  https://developers.cloudflare.com/workers/wrangler/configuration/ (routes, custom domains,
  environments sections) and https://developers.cloudflare.com/workers/wrangler/environments/.
  Wrangler 4.149.0 (`validateRoutes` in `wrangler-dist/cli.js`) confirms it: an env that does not
  set `routes` inherits the top-level custom domains and gets the warning "Add `"routes": []` to
  "env.<name>" to prevent inheritance".
- Cloudflare, Wrangler config is the source of truth for settings it declares —
  https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth.
- Cloudflare, `wrangler dev` `--host` defaults to the host inferred from routes —
  https://developers.cloudflare.com/workers/wrangler/commands/#dev; confirmed in wrangler 4.149.0
  (`getInferredHost`, `inferOriginFromRoutes ?? true`, Miniflare `upstream`).
- Astro: no Astro decision in this chore, so no Astro docs page is cited.

## Risks

- **Deploy token scope.** Attaching or confirming a Custom Domain needs zone-level permission on
  `doncoleman.ca`. If the Workers Builds token for `dcc-web` lacks it, the production deploy fails
  at the triggers step after the new version is uploaded and deployed (site keeps serving; the
  domain is still attached by hand). Mitigation: the first after-merge `[PREVIEW-CHECK]`; Don
  widens the build token in the Workers Builds settings or reverts.
- **Already-attached domain.** Cloudflare does not document deploying a Custom Domain that is
  already attached to the same Worker; expected no-op (Wrangler only prompts when it is attached to a
  different Worker). Confirmed by the after-merge check.
- **Preview inheritance.** Without `"routes": []`, `deploy --env preview` on `main` would move `www`
  to `dcc-web-preview`. Guarded by W1 (raw and Wrangler-resolved checks).
- **Local tooling reading `wrangler.jsonc`.** `wrangler dev` (E2E) is covered by W2; the `worker/`
  Vitest plugin reads the same file and is expected to ignore `routes`, confirmed by running its
  suites in W3.
- **Rollback by hand is undone by the next deploy.** Documented in W4's item 18 rollback note.
