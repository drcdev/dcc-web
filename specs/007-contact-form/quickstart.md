# Quickstart: validating the contact form and message retrieval

How to prove the feature works, locally first and then on the preview deployment. It points to
the contracts instead of repeating them. It holds no implementation code.

## Prerequisites

- Node from nvm. `node -v` must print v24.x. If it does not, run
  `source ~/.nvm/nvm.sh && nvm use` in the same shell command as the next step.
- Dependencies: `corepack pnpm install --frozen-lockfile` (installs the root and the `worker/`
  workspace package).
- For the E2E run: `corepack pnpm exec playwright install chromium`.
- Network access to `challenges.cloudflare.com` for the E2E run (Turnstile test keys).
- Nothing from Cloudflare is needed locally. Local runs use Miniflare's D1 and the public test
  values in `tests/fixtures/worker/e2e.env`.

## 1. Worker integration and contract tests (Cloudflare Vitest integration)

```sh
corepack pnpm --filter ./worker test
```

Expected: all pass. These cover:

| Area | File | Proves |
|---|---|---|
| Submission | `worker/test/contact.test.ts` | every row of [contact-api.md](./contracts/contact-api.md): honeypot success with no row, each validation code, 10 KB limit, origin and content-type refusals, duplicate ID stored once, Turnstile failure (mocked siteverify) not stored, 4th in an hour and 6th in a day refused, D1 failure → 503 |
| Retrieval | `worker/test/retrieval.contract.test.ts` | [retrieval-api.md](./contracts/retrieval-api.md) end to end |
| Retention | `worker/test/retention.test.ts` | only rows older than 12 months deleted, any status (SC-007) |
| Privacy | `worker/test/logging.test.ts` | no submitted value, IP or hash ever reaches `console` |
| Indexes | `worker/test/query-plans.test.ts` | no statement does `SCAN messages` |
| Rules | `worker/test/rules.test.ts` | shared limits and `validateSubmission()` |

## 2. Site unit, component and config tests

```sh
corepack pnpm run test
```

Expected: all pass, including the extended `config-files`, `csp`, `site-origin`,
`deploy-preview`, new `deploy-production`, `navigation` (no `/contact/` in
`futureDestinations`), `ContactForm` component and setup-check tests (items 19–25, reader
redaction).

## 3. Full gate, as CI runs it

```sh
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm run verify
```

`verify` becomes: secrets lint → lint → typecheck (`astro check`, `tsc -p worker`,
`wrangler types --check`) → `test` (root Vitest, then the `worker` package) → build → E2E.

## 4. The visitor journey in a browser (manual spot check)

```sh
corepack pnpm run build
corepack pnpm exec wrangler d1 migrations apply contact --local --persist-to .cache/e2e-state
corepack pnpm exec wrangler dev --ip 127.0.0.1 --port 4321 --persist-to .cache/e2e-state --env-file tests/fixtures/worker/e2e.env
```

Open `http://127.0.0.1:4321/contact/?project=Cadence`:

1. "About: Cadence" is shown. Fill the name, email and message, leave the organization blank,
   tick consent, and send → the success panel appears and takes focus.
2. Retrieve it with the fake local token from `tests/fixtures/worker/e2e.env`:
   `curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4321/api/messages/new`
   (export `TOKEN` from that file in your shell first; it is a test value). Expect one
   message, `project: "Cadence"`, `organization: null`, and no `ip_hash`.
3. Mark it read: `curl -s -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4321/api/messages/<id>/read`
   → `200`. List again → `[]`. Mark again → `409`.
4. The same list without the header → `401 {"error":"unauthorized"}`.
5. Turn JavaScript off → the page and its note render, the "needs JavaScript" notice shows,
   and Send is disabled.

The automated form of these journeys is `tests/e2e/contact.spec.ts` (next section).

## 5. E2E (Playwright against `wrangler dev`)

```sh
perl -e 'alarm 1200; exec @ARGV' corepack pnpm run test:e2e
```

`tests/e2e/contact.spec.ts` must pass, covering User Stories 1, 2, 4 (client side) and 5 and
the edge cases. Each test sets a unique `CF-Connecting-IP` on `/api/contact` via `page.route`:

| Journey | Expectation |
|---|---|
| Valid send, organization blank | Success panel focused; message retrievable through the API |
| `?project=<b>x</b>` of 150 characters | Shown as text, cut to 100; stored the same way |
| No consent | Not sent; consent error tied to the checkbox |
| Invalid email / message over 5,000 | Field error names the field (and the limit); all values kept |
| Double-click Send | One stored message |
| `/api/contact` fulfilled with 503 / 429 | Plain-language error; all values kept |
| Turnstile script aborted | "Spam check couldn't load" message; values kept |
| Keyboard only | Every control reachable in order; errors and success announced (live region) |

The `a11y`, `budget`, `visual`, `shell` and `no-js` projects pick up `/contact/` from
`tests/e2e/templates.ts`. Budget: the page must stay within the 10 KB JS / 100 KB total budget
**before** interaction (Turnstile loads only on first interaction). Visual: refresh the baselines
on macOS (`pnpm run test:visual:update`) and Linux (`pnpm run test:visual:update:linux`, needs
Docker Desktop) only for the new contact page. Any other diff is a regression.

## 6. Setup check (before the walkthrough)

```sh
corepack pnpm setup:check
```

Expected before Don's setup: items 19–24 report `missing` or `could-not-check`, each with a
plain `nextAction`. Item 25 is shown as after-merge. No secret value appears in the output
(also asserted by unit tests). Then run `/setup-walkthrough` and follow items 19–24 in order.

## 7. Preview deployment (the feature's "done when")

After items 19–24 are complete and the branch is pushed:

1. `dcc-web-preview` builds the branch. It applies migrations to `contact-preview`, deploys, and
   uploads the aliased version. Preview address:
   `https://br-007-contact-form-dcc-web-preview.drc-dev.workers.dev/contact/`.
2. Send a test message there. Turnstile runs with the real widget (or with the test keys under
   the research R6 fallback).
3. Retrieve it with the **preview** read token, which Don holds, with `GET /api/messages/new` on
   the preview address → the message is there (SC-011).
4. The same request with the production token on the preview address → `401` (FR-024).
   Production `contact` stays empty of it (SC-006). This is confirmed after merge, once item 25
   deploys production.
5. `corepack pnpm setup:check` → items 19–24 complete. Item 25 is completed after merge.
