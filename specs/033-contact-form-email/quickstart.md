# Quickstart: validating contact form email delivery

How to prove feature 033 works. Contracts: [contact-api](./contracts/contact-api.md),
[contact-email](./contracts/contact-email.md), [worker-config](./contracts/worker-config.md),
[setup-check](./contracts/setup-check.md). Data: [data-model.md](./data-model.md).

## Prerequisites

- Node from `.nvmrc` (see CLAUDE.md "Local toolchain"); `pnpm install` done.
- Local runs need no Cloudflare login: `wrangler dev` simulates `send_email` locally (logs the
  message and writes it to a temp file, sends nothing), and the Worker tests inject a fake binding.
- Production/preview checks need Don's one-time setup (item 17) done first.

## 1. Local, offline (agent or Don)

| Step | Command | Expected |
|---|---|---|
| Worker tests | `pnpm run test:worker` | `contact-email`, `contact`, `logging`, `router`, `schema`, `environments` pass in both projects; no file references `messages`, `CONTACT_READ_TOKEN` or `IP_HASH_SALT` |
| Unit tests | `pnpm run test:unit` | config, privacy-policy, site-pages and setup-check tests pass |
| Types | `pnpm run typecheck` | regenerated `worker-configuration.d.ts` is current (`CONTACT_EMAIL: SendEmail`) |
| Contact journey | `pnpm exec playwright test tests/e2e/contact.spec.ts --project=e2e` | valid send shows the confirmation; 503 stub keeps every value; no 429 row |
| Full gate | `pnpm run verify` (ask Don first, run in background under the wrapper) | green |

Manual local look (optional): `pnpm run build`, then `node scripts/e2e-wrangler-config.ts` and
`pnpm exec wrangler dev --config wrangler.e2e.json --env-file tests/fixtures/worker/e2e.env --var ALLOW_TURNSTILE_TESTING:true`;
send the form at `http://127.0.0.1:8787/contact/`. The terminal prints
`send_email binding called with MessageBuilder:` with From `contact-form@drc.dev`,
To `contact@doncoleman.ca`, the subject, and a path to the text body. Open that file: every field,
`Received:` in UTC, no preview line (local runs use the production config).

Removed routes: `curl -i http://127.0.0.1:8787/api/messages/new -H "Authorization: Bearer anything"`
→ `404 {"error":"not_found"}`.

## 2. One-time setup (Don, before the binding is pushed)

Follow `docs/setup.md#contact-email` (walkthrough item 17): verify `contact@doncoleman.ca` as an
Email Routing destination address, confirm Email Routing is on for `drc.dev`, and give the
read-only token Email Routing Addresses read access for the account and Zone Settings: Read on the `drc.dev` zone. Then
`pnpm run setup:check`: items 4, 5 and 17 complete. No DNS record is added to doncoleman.ca; item 5
passing confirms its iCloud records are unchanged (SC-008). Also send yourself a normal email to
`contact@doncoleman.ca` and see it arrive.

## 3. Preview (Don, `[PREVIEW-CHECK]` in the PR)

On the branch preview URL (`br-033-contact-form-email-dcc-web-preview.drc-dev.workers.dev/contact/`):

1. Send a message with a project link (open a project story, use its contact link).
2. Within 5 minutes an email arrives at `contact@doncoleman.ca`: subject
   `[Preview] Contact form: <name> (about <project>)`, first body line names the preview host,
   every field present.
3. Press Reply: the To is the address you typed in the form.
4. Send again straight away: also delivered (no per-sender limit).

## 4. Before approving (Don, pre-merge; auto-merge is armed, so approval is the hold)

1. Collect unread production messages through the retrieval endpoint as usual.
2. Re-check the endpoint once more immediately before approving; anything arriving after this is
   an accepted loss (FR-017).
3. Approve; the merge deploy applies `0003_drop_messages.sql` and removes the cron.

## 5. After release

- Send one message from `https://doncoleman.ca/contact/`: arrives within 5 minutes, no `[Preview]`,
  Reply addresses the visitor (SC-002).
- `curl -i https://doncoleman.ca/api/messages/new` with and without the old token → 404 (SC-005).
- `pnpm run setup:check`: item 16 reports no cron and needs only `TURNSTILE_SECRET_KEY`;
  item 17 complete.
- List each remote database's tables (`dcc-web` and `dcc-web-preview`): no `messages`, and
  `question_sets` and `usage_bucket` still present (FR-009, SC-004).
- Within 7 days of release (post-merge PR-body item, FR-017a; hygiene, not a security deadline):
  delete `CONTACT_READ_TOKEN` and `IP_HASH_SALT` from both Workers.
