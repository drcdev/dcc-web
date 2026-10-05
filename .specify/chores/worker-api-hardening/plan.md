# Chore plan: worker-api-hardening (issue #89)

Branch: `chore/worker-api-hardening`, from `main` at c87fb86 (after #102, the D1 rename, and #103).
Issue: https://github.com/drcdev/dcc-web/issues/89. The PR body says `Closes #89`.

## Goal

The production Worker `dcc-web` still answers outside the `doncoleman.ca` zone: `wrangler.jsonc`
turns on its `workers.dev` address and its preview (version) URLs, so production code and
secrets are served on hosts that zone-level controls (Always Use HTTPS, the planned `api-per-ip`
rate-limit rule) never see, and every old production version stays reachable on its own version
URL after a later fix. The retrieval API (`/api/messages*`) does not refuse plain HTTP, which
Principle VIII forbids; `workers.dev` answers `http://` without a redirect, so a mistyped
assistant URL would send the read token in clear (confirmed: `http://dcc-web.drc-dev.workers.dev/api/messages`
answers `401` over HTTP today). Production also accepts any Turnstile verdict made with a public
testing secret, with nothing to catch that secret being set there. Finally, every branch build
replaces the preview Worker's active deployment, not just uploads an aliased version. This chore
([#89](https://github.com/drcdev/dcc-web/issues/89)) closes those four edges: production preview
URLs off (and `workers.dev` off, see W2), an HTTPS-only check on the retrieval API reusing the
existing scheme rule, a per-environment `ALLOW_TURNSTILE_TESTING` variable set only for preview
and e2e, and branch builds that only upload an aliased version.

**Triage note.** The issue carries a `bug` label but names `/chore` as its pipeline. There is no
visitor-visible change: the HTTP refusal is on an API only Don's assistant calls; a testing-key
verdict never occurs on production with the real secret; the preview and deploy changes alter
hosting, not pages. If any work item would change what a visitor sees, implement stops and says
so.

Binding decisions from the issue comments: the D1 rename (#102) is on `main` and this plan uses
the renamed bindings; IPv6 /64 hashing for the contact rate limit is **out**; testing keys are
allowed by a per-environment variable, never by host-name logic.

## Acceptance

Mechanical criteria (the review phase checks each one). No timing measurement applies to this
chore; the before-state is the current configuration and tests at c87fb86.

1. **Tests seen failing first.** Every new or changed assertion in W1, W3, W5, W6 and W7 is run red
   against the current code before the matching implementation, and the implement summary
   records each red run.
2. **Production config.** Top-level `wrangler.jsonc` has `"preview_urls": false` and (Don's W2
   decision) `"workers_dev": false`, and no `vars` key containing `ALLOW_TURNSTILE_TESTING`.
3. **Preview config.** `env.preview` sets `"workers_dev": true`, `"preview_urls": true` and
   `"vars": { "ALLOW_TURNSTILE_TESTING": "true" }` explicitly (no longer inherited).
4. **E2E config.** `tests/fixtures/worker/e2e.env` has `ALLOW_TURNSTILE_TESTING=true`; the
   generated `wrangler.e2e.json` still copies the production top level, so the flag reaches e2e
   only through the env file.
5. **Types.** `worker/worker-configuration.d.ts` is regenerated with `pnpm run types:worker` and
   shows `ALLOW_TURNSTILE_TESTING?: "true"` on the base `Env` (optional, because production has
   no value) and `ALLOW_TURNSTILE_TESTING: "true"` on `PreviewEnv`. `pnpm run typecheck` (which
   runs `wrangler types --check`) passes. Confirmed by a trial run of `wrangler types` 4.144.0
   on a scratch copy of the config during this plan.
6. **Retrieval HTTPS.** A request to `/api/messages` or `/api/messages/*` whose URL is not
   `https:` (and is not `http:` on `localhost` / `127.0.0.1`) gets `403 {"error":"https_required"}`
   before authorization: with no token, with a valid token, and for any method, and D1 is not
   read. The scheme rule is one exported function, `isSecureRequest(url)` in
   `worker/src/same-origin.ts`, used by `isSameOriginRequest` and by `handleMessages`.
7. **Turnstile gate.** A siteverify answer with `metadata.result_with_testing_key: true` is
   accepted (when `success` is true) only when `env.ALLOW_TURNSTILE_TESTING === "true"`;
   otherwise the request gets `422 turnstile_failed`. No hostname parsing is added. A real
   verdict is checked exactly as today (success, action, hostname).
8. **Preview deploy steps.** `previewDeploySteps` for a non-`main` branch returns exactly
   `[["d1","migrations","apply","DB","--remote","--env","preview"], ["versions","upload","--env","preview","--preview-alias",<alias>]]`
   (no `deploy`); for `main` it returns the migrations step then `["deploy","--env","preview"]`.
9. **Docs.** `docs/setup.md` items 7, 17, 22 and 24, `scripts/setup-check/items.ts`, the
   item 7 check messages and `.claude/skills/setup-walkthrough/SKILL.md` no longer tell Don to
   turn on `workers.dev` or preview URLs for `dcc-web`; item 24 says the preview database is
   disposable and branch migrations must be additive only. The `docs-structure`, `drift` and
   setup-check unit tests pass.
10. **Recorded decisions annotated** (W8): `specs/011-launch/research.md` R6,
    `specs/007-contact-form/research.md` R6, `specs/007-contact-form/contracts/worker-config.md`
    and `contracts/retrieval-api.md` carry a dated "Superseded by #89" note; their original
    text stays.
11. **Scope of the diff:** `git diff --name-only main` lists only files named in the work items
    below and `.specify/chores/worker-api-hardening/**`. No visual baseline, page, component,
    `public/_headers`, CI workflow, CLAUDE.md or pipeline skill change.
12. `pnpm run verify:quick` is green, then the full gate before the PR (after asking Don).

**Before state (c87fb86):**

| What | Before | After |
|---|---|---|
| `dcc-web` `workers_dev` / `preview_urls` | `true` / `true` (`wrangler.jsonc:13-14`) | `false` / `false` |
| `dcc-web-preview` `workers_dev` / `preview_urls` | inherited `true` / `true` | explicit `true` / `true` |
| `ALLOW_TURNSTILE_TESTING` | does not exist | `env.preview.vars` and `e2e.env` only |
| Config test | "enables workers_dev and preview_urls" (`config-files.test.ts:70-72`) | production off, preview on, flag placement |
| `/api/messages*` over `http://` | `401` (or `200` with a token) | `403 https_required` before auth |
| Testing-key verdict in production | accepted (`turnstile.ts:58`) | `422 turnstile_failed` |
| Branch preview build | migrate, `deploy --env preview`, aliased upload | migrate, aliased upload only |
| `docs/setup.md` item 7 | "turn on its `workers.dev` address and preview URLs" | leave both off; config is the source |

Preview checks (on `br-chore-worker-api-hardening-dcc-web-preview.drc-dev.workers.dev` once
the PR exists; this branch's own Workers Builds run uses the new `scripts/deploy/preview.ts`):

- [ ] The branch alias URL serves the site, and the build log shows `versions upload` with `--preview-alias` and no `wrangler deploy` [PREVIEW-CHECK]
- [ ] Workers & Pages → `dcc-web-preview` → Deployments: the active deployment is still `main`'s, not this branch's version [PREVIEW-CHECK]
- [ ] `curl -s -o /dev/null -w '%{http_code}' http://br-chore-worker-api-hardening-dcc-web-preview.drc-dev.workers.dev/api/messages/new` prints `403` [PREVIEW-CHECK]
- [ ] A contact form submission on the branch alias still succeeds (preview has `ALLOW_TURNSTILE_TESTING`, so the preview fallback test keys keep working) [PREVIEW-CHECK]

- [ ] Before approving: Don confirms his assistant calls `https://new.doncoleman.ca/api/messages/...`, not `dcc-web.drc-dev.workers.dev`, or is ready to switch it when production deploys [PREVIEW-CHECK]

After the merge (production deploy, Don, recorded in the PR body): the `dcc-web` Worker's
Settings → Domains & Routes shows `workers.dev` and Preview URLs off (Wrangler applies both from
the config on `wrangler deploy`), `https://dcc-web.drc-dev.workers.dev/` no longer serves the
site, `https://new.doncoleman.ca/` still does, and Don's assistant (re-pointed at
`https://new.doncoleman.ca/api/messages/...` if it used `workers.dev`) retrieves messages.

## Scope

**In:**

- `wrangler.jsonc` (production and preview `workers_dev` / `preview_urls`, preview `vars`).
- `tests/fixtures/worker/e2e.env` (the flag), `worker/worker-configuration.d.ts` (regenerated).
- `worker/src/same-origin.ts`, `worker/src/messages/router.ts`, `worker/src/messages/log.ts`
  (new outcome), `worker/src/contact/turnstile.ts`, `worker/src/contact/submit.ts`.
- `scripts/deploy/preview.ts`; `scripts/setup-check/checks/cloudflare-worker.ts`,
  `scripts/setup-check/checks/preview-noindex.ts`, `scripts/setup-check/items.ts`.
- Tests: `tests/unit/site/config-files.test.ts`, `tests/unit/site/deploy-preview.test.ts`,
  `tests/unit/setup-check/checks/cloudflare-worker.test.ts`,
  `tests/unit/setup-check/checks/preview-noindex.test.ts`, `worker/test/same-origin.test.ts`,
  `worker/test/retrieval.contract.test.ts`, `worker/test/contact.test.ts`, and any docs-text
  assertion in `tests/unit/setup/*.test.ts` that pins the changed wording.
- Docs: `docs/setup.md` items 7, 17, 22, 24; `.claude/skills/setup-walkthrough/SKILL.md` (only
  the item 7 / 22 / 24 lines that repeat the setup text); `docs/design/blog.md` and
  `docs/design/portfolio.md` (one note each that their `-dcc-web` version URLs stopped
  resolving when #89 turned off production preview URLs).
- Specs annotations (W8).

**Out:**

- IPv6 /64 hashing for the contact rate limit (removed from scope by decision 2).
- The dashboard edge rate-limit rule `api-per-ip` (Don's dashboard work; this chore only makes it
  possible by taking production off `workers.dev`).
- Any change to Cloudflare dashboard settings by the agent. Wrangler applies `workers_dev` and
  `preview_urls` on deploy; anything else is a Don step written into `docs/setup.md`.
- Cloudflare Access on `workers.dev` previews, HSTS on `workers.dev`, and moving the apex Custom
  Domain into `wrangler.jsonc` (launch T9, after the switch).
- A per-script `workers.dev` / previews read in the setup check (Cloudflare's
  `GET /accounts/{id}/workers/scripts/{name}/subdomain`, which returns `enabled` and
  `previews_enabled`). Item 7 keeps checking the account subdomain, reworded (W7).
- `scripts/deploy/production.ts` (migrate then `deploy`): unchanged.

**Follow-ups for the PR body:**

- Setup check: read each Worker's own `workers.dev` and preview-URL state through the per-script
  subdomain API, so items 7 and 22 confirm the real setting rather than the account subdomain.
- Don's dashboard rule `api-per-ip` can be added once production is off `workers.dev`.

## Constitution Check

- **I. Test-First:** every work item that changes code or config starts with its failing test
  (W1, W3, W5, W6, W7); docs-only items say why no behaviour test applies.
- **II. Automated Release Gate:** no check is skipped or weakened. Every branch still gets a
  preview (the aliased version upload is the preview); only `main` replaces the preview Worker's
  deployment. Production still deploys only from `main` via `deploy:production`. The two
  removed assertions are mapped to stronger replacements (W1, W5, W6).
- **III. Human Review for Major Changes:** fires on two criteria. **"touches how contact data is
  collected"**: W4 changes which Turnstile verdicts the contact API accepts, and W3 changes how
  contact messages are retrieved (`/api/messages*`). **"changes CI, deployment or infrastructure
  configuration"**: `wrangler.jsonc` (`workers_dev`, `preview_urls`, `vars`) and
  `scripts/deploy/preview.ts` (the Workers Builds deploy command). No dependency, design,
  layout or constitution change; no cost increase. Verdict: **major**. Label `major-change`,
  auto-merge off, Don reviews the preview (`[PREVIEW-CHECK]` lines) and approves.
- **IV. First-Party Before Custom:** uses Wrangler's own `workers_dev`, `preview_urls` and
  per-environment `vars` keys, `wrangler versions upload --preview-alias`, and Turnstile's own
  `metadata.result_with_testing_key` flag; the only custom code is a one-line scheme check that
  already exists and is reused. No Astro decision is made, so no Astro docs page applies.
- **V. Static by Default:** unchanged; no endpoint added, only `/api/*` runs Worker code.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** strengthened: the read token can no longer be used over plain HTTP, and
  production can no longer store a message that passed only a public test key. Preview messages
  stay in `dcc-web-preview`. No log line gains personal data (the new log outcome is a fixed
  string).
- **VIII. Cloudflare Best Practices:** closes the "serve HTTPS only" gap on the retrieval API;
  runs production on the zone's Custom Domain rather than `workers.dev`, as Cloudflare
  recommends; config stays committed and applied by Wrangler, not the dashboard.
- **IX. Cost Ceiling:** no new cost. Fewer preview deployments, no new service.
- **X. Accessible, Fast and Private:** unchanged; no page, script or budget change.
- **XI. Spec Kit Workflow:** `/chore` branch and `.specify/chores/worker-api-hardening/`.
  `wrangler.jsonc`, `docs/setup.md` and `worker/src/contact/*` are shared hot files; implement
  merges `origin/main` before the gate and resolves any conflict there.

## Work items

### W1: Config unit tests for production, preview and the flag (test first)

- [x] W1 done
- **Files:** `tests/unit/site/config-files.test.ts`.
- **Test:** unit over config, new-first. **Layer: unit**, the cheapest layer that can observe
  config text.
- **Edits:**
  - Replace "enables workers_dev and preview_urls" (l.70-72) with "keeps production off
    workers.dev and version URLs (#89)": top-level `workers_dev` is `false` (Don's W2
    decision) and `preview_urls` is `false`.
  - New: "turns on workers.dev and version URLs for the preview Worker explicitly":
    `config.env.preview.workers_dev === true` and `config.env.preview.preview_urls === true`.
  - New: "allows Turnstile testing keys only for preview": `env.preview.vars.ALLOW_TURNSTILE_TESTING`
    is `"true"`; top-level `vars` is absent or lacks the key.
  - Extend "provides the e2e env file with public test values only": `/^ALLOW_TURNSTILE_TESTING=true$/m`.
  - New: the generated e2e config (the existing generator import in this file) carries no
    `ALLOW_TURNSTILE_TESTING` in `vars`, so the flag reaches e2e only through `e2e.env`.
  - "holds no secret-looking vars" already covers the new name (no SECRET/TOKEN/SALT/KEY/PASSWORD).
- **Coverage mapping:** the removed `workers_dev`/`preview_urls` `true` assertions are replaced
  by the production-off and preview-on cases, which pin both Workers instead of one.

### W2: `wrangler.jsonc`, `e2e.env` and Env types

- [x] W2 done
- **Files:** `wrangler.jsonc`, `tests/fixtures/worker/e2e.env`, `worker/worker-configuration.d.ts`.
- **Test:** W1 (unit over config) goes green; `pnpm run typecheck` checks the generated types.
- **Edits:**
  - Top level: `"preview_urls": false`; `"workers_dev": false` (decision below). No top-level
    `vars`.
  - `env.preview`: `"workers_dev": true`, `"preview_urls": true`,
    `"vars": { "ALLOW_TURNSTILE_TESTING": "true" }`.
  - `e2e.env`: add `ALLOW_TURNSTILE_TESTING=true` with a comment ("lets the always-pass test
    secret above pass; never set for production").
  - Run `pnpm run types:worker` and commit the result.
- **Decision (Don, 2026-10-04): production `workers_dev` goes off in this PR.** The issue said
  "once the DNS switch is done". It is not done: `https://doncoleman.ca` still answers `301`
  from Caddy (the Ghost host), but `https://new.doncoleman.ca` is already served by `dcc-web` on
  Cloudflare (checked with `curl -sI` during this plan). So production keeps a zone hostname
  without `workers.dev`: `new.doncoleman.ca` now, and `doncoleman.ca` once launch L16 removes
  the review address. The `api-per-ip` rule and Always Use HTTPS then cover every production
  request. If Don's assistant calls the `workers.dev` host, he points it at
  `https://new.doncoleman.ca/api/messages/...` when this deploys (post-deploy item above).
  Item 17 (W7) drops the production `workers.dev` host. The rejected option was keeping
  `workers_dev: true` until after L16.

### W3: HTTPS-only retrieval API (tests first, then code)

- [x] W3 done
- **Files:** `worker/test/same-origin.test.ts`, `worker/test/retrieval.contract.test.ts`, then
  `worker/src/same-origin.ts`, `worker/src/messages/router.ts`, `worker/src/messages/log.ts`.
- **Test:** new-first. **Layer: worker** (the Workers Vitest pool with the real router and local
  D1), the cheapest layer that runs the request through `handleMessages`.
  - `same-origin.test.ts`: new `describe("isSecureRequest")`: `https://example.com` true;
    `http://example.com` false; `http://localhost:4321` and `http://127.0.0.1:4321` true;
    `http://localhost.evil.example` false. Existing `isSameOriginRequest` cases stay unchanged
    (they now cover the reuse).
  - `retrieval.contract.test.ts`: new cases: `GET http://example.com/api/messages/new` with the
    valid token → `403 {"error":"https_required"}`, same with no token (not `401`), and
    `POST http://example.com/api/messages/<id>/read` with the valid token → `403` and the row
    is still unread; `http://127.0.0.1:4321/api/messages/new` with the token → `200`.
- **Code:** export `isSecureRequest(url: URL): boolean` holding today's l.8 condition;
  `isSameOriginRequest` calls it. In `handleMessages`, before `isAuthorized`:
  `if (!isSecureRequest(new URL(request.url))) { log("https_required"); return json({ error: "https_required" }, 403); }`.
  Add `"https_required"` to `MessagesOutcome`. Refusing rather than redirecting is deliberate: a
  redirect would let a client that already sent its token in clear carry on silently.

### W4: Retrieval contract text

- [x] W4 done
- **Files:** `specs/007-contact-form/contracts/retrieval-api.md`.
- **Test:** no behaviour: n/a (contract text; W3 holds the assertions). Add a "Scheme (checked
  before authorization, #89)" paragraph naming the `403 {"error":"https_required"}` answer and
  the localhost exception, and note that the uniform-401 rule applies to HTTPS requests.

### W5: Turnstile testing keys gated by `ALLOW_TURNSTILE_TESTING` (tests first, then code)

- [x] W5 done
- **Files:** `worker/test/contact.test.ts`, then `worker/src/contact/turnstile.ts`,
  `worker/src/contact/submit.ts`.
- **Test:** new-first. **Layer: worker** (the contact handler through `run()` with a mocked
  siteverify; the `production` Vitest project loads the top-level config, which has no flag).
  - Rewrite "accepts Cloudflare's documented testing-key answer ..." (l.213-221) into:
    (a) with `run(request, { ALLOW_TURNSTILE_TESTING: "true" })` the testing-key success
    (`hostname: "example.com"`, no action) → `200`, and a testing-key `success: false` → `422`;
    (b) with no override (production config) the same testing-key success → `422
    turnstile_failed` and no row stored; (c) `ALLOW_TURNSTILE_TESTING: "false"` and `"1"` →
    `422` (only the exact string `"true"` allows).
  - The existing real-verdict cases (action, hostname mismatch) stay unchanged.
  - E2E keeps passing through `e2e.env` with the existing contact journey (existing coverage of
    the wiring; no new E2E test).
- **Code:** `VerifyInput` gains `allowTestingKey: boolean`; l.58 becomes
  `if (result.metadata?.result_with_testing_key === true) return input.allowTestingKey && result.success === true;`.
  `submit.ts` passes `allowTestingKey: env.ALLOW_TURNSTILE_TESTING === "true"`. Update the
  file's header comment and the l.56-57 comment.
- **Coverage mapping:** the old single test's acceptance assertion moves to (a); (b) and (c) are
  new.

### W6: Preview deploy uploads only on branches (test first, then script)

- [x] W6 done
- **Files:** `tests/unit/site/deploy-preview.test.ts`, then `scripts/deploy/preview.ts`.
- **Test:** unit, new-first. **Layer: unit** (the pure step builder; nothing is spawned).
  - "applies preview migrations first, deploys the preview env, then uploads an aliased version"
    becomes "on a branch, applies preview migrations then uploads an aliased version without
    deploying" with the Acceptance 8 array.
  - "skips the aliased upload on main" becomes "on main, applies preview migrations then deploys
    the preview Worker" (same array as today).
  - New: "never deploys from a branch": no step of a non-`main` branch starts with `"deploy"` or
    contains `"versions","deploy"`.
- **Code:** `steps` starts with the migrations step; `main` pushes `["deploy","--env","preview"]`;
  other branches push the aliased `versions upload`. Update the header comment (migrations on
  every build, additive only; only `main` changes the active deployment).
- **Coverage mapping:** the removed branch `deploy` expectation is replaced by the stricter
  "never deploys from a branch" case.
- **Contract:** in `specs/007-contact-form/contracts/worker-config.md` "Deploy scripts", add a
  "Superseded by #89" note with the new step lists (W8 does the other annotations).

### W7: Setup checks and setup docs

- [x] W7 done
- **Files:** `tests/unit/setup-check/checks/cloudflare-worker.test.ts`,
  `tests/unit/setup-check/checks/preview-noindex.test.ts`, then
  `scripts/setup-check/checks/cloudflare-worker.ts`, `scripts/setup-check/checks/preview-noindex.ts`,
  `scripts/setup-check/items.ts`, `docs/setup.md`, `.claude/skills/setup-walkthrough/SKILL.md`.
- **Test:** unit, new-first for the two checks; existing `tests/unit/setup/docs-structure.test.ts`
  and `drift.test.ts` for the docs text. **Layer: unit.**
  - `cloudflare-worker`: summary strings change from "workers.dev and preview URLs enabled" to
    "Worker dcc-web exists and the account's workers.dev subdomain is on (used by the preview
    Worker)"; the missing-subdomain next action says to turn on the account subdomain, not the
    Worker's preview URLs. Logic is unchanged (it reads the account subdomain).
  - `preview-noindex`: checks only the preview Worker's `workers.dev` host; the
    test that expects both hosts expects one, and a new case asserts the production host is not
    requested.
- **Docs:**
  - Item 7: replace "Then turn on its `workers.dev` address and preview URLs" with: leave
    `workers.dev` and Preview URLs off for `dcc-web`; `wrangler.jsonc` sets both to `false` and
    Wrangler applies them on each deploy; production is served only on the zone's Custom Domain.
    Update "How it will be confirmed" and the Constitution line (VIII, not II).
  - Item 17: say only the preview Worker has a `workers.dev` host.
  - Item 22: keep "turn on the `workers.dev` address and preview URLs" for `dcc-web-preview`,
    noting `wrangler.jsonc` `env.preview` now sets both explicitly; add that only `main`
    replaces the active deployment and branches upload an aliased version.
  - Item 24: add that the `dcc-web-preview` database is disposable (Don may wipe or recreate it;
    nothing in it is kept), and that branch migrations are applied to it before merge, so every
    migration must be additive only (already enforced by the "only additive migrations" unit
    test).
  - Line ~501 (previews on `workers.dev`): reword if it implies production is on `workers.dev`.
  - Mirror the item 7, 22 and 24 changes in `items.ts` (`where`, `confirmedBy`) and in
    `SKILL.md`.

### W8: Annotate the recorded decisions

- [ ] W8 done
- **Files:** `specs/011-launch/research.md` (R6), `specs/007-contact-form/research.md` (R6),
  `specs/007-contact-form/contracts/worker-config.md` (l.16-17 and "Deploy scripts").
- **Test:** no behaviour: n/a (history notes; the config and code tests in W1, W5 and W6 hold the
  rules).
- **Edits** (each a short dated "Superseded by #89 (2026-10):" note; the original text stays):
  - 011 R6: `workers.dev` was kept on as an SEO concern only; #89 takes production off
    `workers.dev` and version URLs for security (zone controls, HTTPS); the host-scoped noindex
    rule now covers the preview Worker only.
  - 007 R6: test keys are allowed by `ALLOW_TURNSTILE_TESTING`, set only in `env.preview.vars`
    and `e2e.env`; production rejects a testing-key verdict.
  - 007 worker-config l.16-17: production `workers_dev`/`preview_urls` false, preview sets both
    true explicitly (no longer inherited); the reason recorded in `docs/setup.md` (Principle II
    previews on `dcc-web`) ended when spec 007 moved previews to `dcc-web-preview`.

### W9: Note the dead prototype links

- [ ] W9 done
- **Files:** `docs/design/blog.md`, `docs/design/portfolio.md`.
- **Test:** no behaviour: n/a (docs note only).
- **Edit:** one sentence under each "Preview" line: the `-dcc-web` version URLs below stopped
  resolving when production preview URLs were turned off (#89); the decisions they record stand.

## Docs citations (Principle IV)

All confirmed with WebFetch during this plan (2026-10-04).

- Wrangler configuration, `workers_dev` ("Defaults to `true` when the configuration has no
  `route` or `routes`"), `preview_urls` ("Enables Version URLs and `workers.dev` Preview URLs.
  If omitted, Wrangler does not change an existing setting"), both listed as **inheritable**;
  `vars` listed under **non-inheritable keys** (must be set per environment):
  https://developers.cloudflare.com/workers/wrangler/configuration/ (sections "Inheritable keys"
  and "Non-inheritable keys"). This is why W2 sets both keys explicitly in `env.preview` and why
  a top-level `vars` would not reach preview (and the flag must not be top-level at all).
- Disabling `workers.dev` with `"workers_dev": false`, and "It's recommended to run production
  Workers on a Workers route or custom domain ... rather than on your `workers.dev` subdomain":
  https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Version (preview) URLs: "When enabled, Version URLs are publicly available"; "Disabling Version
  URLs disables routing to Version URLs and aliased Version URLs";
  `wrangler versions upload --preview-alias <alias>` gives `<alias>-<worker>.<subdomain>.workers.dev`:
  https://developers.cloudflare.com/workers/configuration/previews/
- `wrangler versions upload` creates a version without deploying it, decoupled from
  `wrangler deploy`: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/
  and the command reference https://developers.cloudflare.com/workers/wrangler/commands/#versions-upload
- Turnstile test secrets (always-pass `1x0000000000000000000000000000000AA`, "Production secret
  keys will reject the dummy token"): https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- Siteverify, "Validate the action and hostname when specified":
  https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- `metadata.result_with_testing_key`: neither Turnstile page above names the field. It was
  observed directly during this plan: siteverify with the always-pass test secret answered
  `{"hostname":"example.com","metadata":{"result_with_testing_key":true},"success":true}`, and
  with the always-fail secret `{"success":false,"metadata":{"result_with_testing_key":true}}`.
  Implement records this in the `turnstile.ts` comment instead of calling it documented.
- `wrangler types` emitting a var that exists only in `env.preview` as optional on the base
  `Env`: observed with wrangler 4.144.0 on a scratch config; typing docs:
  https://developers.cloudflare.com/workers/languages/typescript/#generate-types

## Risks

- **Assistant on `workers.dev`.** If Don's assistant calls the production
  `workers.dev` host, retrieval stops when this deploys. Mitigation: the PR body says so first;
  the fix is changing the assistant's base URL to `https://new.doncoleman.ca` (later
  `https://doncoleman.ca`).
- **Wrangler applying `workers_dev`/`preview_urls`.** Wrangler applies explicit values on
  `wrangler deploy`; if the dashboard still shows them on after the production deploy, Don turns
  them off there (written into item 7 as the fallback) and the setup-check follow-up will catch
  drift.
- **Branch migrations on a shared preview DB.** A branch migration lands in `dcc-web-preview`
  before merge, and an edited migration number would not re-run. Mitigation: additive-only is
  enforced by the migrations test; item 24 documents the database as disposable.
- **Aliased version vs migrated schema.** `main`'s active preview deployment runs against a
  database that a branch may have migrated ahead; additive-only keeps it compatible.
- **Hot files.** `wrangler.jsonc`, `docs/setup.md` and the contact worker are touched by other
  work; merge `origin/main` before the gate.
- **Typed Env.** `ALLOW_TURNSTILE_TESTING` is `"true" | undefined` on `Env`; the code compares
  to the string `"true"`, so production (absent) reads as "not allowed" with no cast.
- **Old production version URLs.** Turning `preview_urls` off removes every old production
  version URL, including the design prototype links in `docs/design/` (W9). That is the intended
  effect of the finding.
