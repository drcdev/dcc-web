---
name: setup-walkthrough
description: Guide Don through every setup item for dcc-web (Cloudflare, GitHub, DNS) in a safe order, confirming each step with the setup check. Use when Don runs /setup-walkthrough, or asks to continue or resume the dcc-web setup.
---

# `/setup-walkthrough`

This skill walks Don through every setup item for `dcc-web`, in the safe order fixed by
`scripts/setup-check/items.ts` and documented in `docs/setup.md`. It never re-implements
confirmation logic (FR-010): every "is this step done?" question is answered by running
`pnpm setup:check`, never by the skill's own judgement.

## Behaviour

1. Run `pnpm setup:check --json`.
2. Show the full ordered step list: each step's number, title and current status only (no
   what/where/how detail yet).
3. Walk the steps in order. For each step:
   - If it is already `complete`, print one line — "Step N — already done, skipping" — and move
     on (FR-011).
   - If its prerequisites (`dependsOn`) are not all `complete`, show it as **blocked**, name the
     prerequisite step, and do not ask Don to act on it or run its confirmation.
   - Otherwise, show **What it is for**, **Where to do it**, **How it will be confirmed** — each
     starting on its own line, from the registry and the matching `docs/setup.md` section — then
     pause with **AskUserQuestion**, offering exactly three answers:
     - `Done — check it`
     - `Skip for now`
     - `Stop here`
   - On `Done — check it`: run `pnpm setup:check --json --item <id>`.
     - `complete` → continue to the next step.
     - `pending` → explain what is being waited on and the expected wait, say no action is
       needed now, and offer to continue with steps that do not depend on it.
     - `missing` or `could-not-check` → show the `summary`, `details` and `nextAction`; stay on
       this step and pause again with the same three answers. There is no retry limit.
   - At every pause (every `AskUserQuestion`, FR-009): the skill runs no further confirmations,
     shows no later step's instructions, and prepares nothing for later steps until Don answers.
     Nothing happens beyond the step being shown until his answer comes back.
   - On `Skip for now`: move to the next step; steps that depend on this one are shown as
     blocked until it is done.
   - On `Stop here`: print how to resume (`/setup-walkthrough`) and end. Nothing is stored —
     state is recomputed from a fresh check run next time (FR-011).
4. Before any step whose `phase` is `after-merge`, tell Don this slice's pull request must be
   merged first, and give the PR link.
5. End with the full report (`pnpm setup:check`) and its summary line ("`N` of `T` complete",
   where `T` is the registry length: the number of items `setup:check` reports, never a fixed number).

## Secret handling (FR-012, FR-024)

- Never ask Don to type, paste or reveal a secret value in the chat.
- Never run a command whose output can contain a secret value — this includes `cat .env`,
  `printenv`, `gh auth token`, `wrangler secret` reads, and any provider tool's verbose or debug
  mode.
- For a secret step, say: "Open `.env` in your editor and paste the token after
  `CLOUDFLARE_API_TOKEN=`" or "Paste it into the Cloudflare/GitHub screen", then "Choose Done".
- If Don pastes something that looks like a secret into the chat, do not repeat it: tell him to
  revoke and recreate it immediately.
- The skill never signs in, never creates accounts, never changes DNS and never handles or asks for
  a credential. Don alone acts in the Cloudflare dashboard, the DNS zone, an account or an export.
  The skill only runs the read-only commands listed under "Allowed commands".

## Allowed commands

The skill runs only these read-only commands:

- `pnpm setup:check` (with `--json`, `--item <id>`, or `--no-network`)
- `gh auth status`
- `node --version`
- `pnpm --version`
- `git status`
- `pnpm exec wrangler d1 list --json`, only after Don confirms the Databases part of `contact-bindings` (see "Contact bindings (item 16)")

Never run: `cat .env`, `printenv`, `gh auth token`, or any command with a `--verbose` or
`--debug` flag.

Commands that change a provider's settings are **shown for Don to run himself** — the skill never
runs them. Each example below is shown for Don to run himself when he reaches the matching step:

Shown for Don to run himself at the `github-main-protection` step:

```sh
gh api -X POST repos/drcdev/dcc-web/rulesets --input setup/github-ruleset.json
gh api -X PUT repos/drcdev/dcc-web/rulesets/<id> --input setup/github-ruleset.json
```

The `POST` creates the ruleset; the `PUT` updates an existing one. The file holds every writable
field of the live ruleset, so the `PUT` is safe (#149).

Workers Builds deploys automatically once this slice's pull request has merged to main, so the
skill never shows or runs a deploy command as part of the normal walkthrough. If Don ever needs
to trigger a manual deploy himself (for example, to recover from a stuck Workers Builds run),
shown for Don to run himself:

```sh
pnpm exec wrangler deploy
```

## Contact bindings (item 16)

`contact-bindings` is one step. Walk its parts in this order, using the matching sections of
`docs/setup.md#contact-bindings`: Databases, Turnstile widget, Worker secrets, Site key, Production
deploy. If the check says the token lacks D1 Read, Workers Builds Configuration Read or Turnstile
Sites Read, send Don back to `local-credentials` (item 2) to add them to his read-only token. The
whole `contact-bindings` item is `phase: after-merge`, so the after-merge rule in step 4 of Behaviour
applies: give the PR link and wait for the merge.

### Databases part: region confirmation (FR-027a, FR-027b)

The `AskUserQuestion` for the Databases part carries this text inside the question itself
(Don cannot see prose written before the tool call), together with the three standard answers:

> Both databases will be created in Western North America (`wnam`). D1 cannot keep data only in
> Canada, and the location cannot be changed after the databases are created. Do you confirm this
> region?

If Don does not confirm the region, stop the walkthrough before any store is created: do not show
the `wrangler d1 create` commands, do not run anything for later steps, and tell him a different
region needs a reviewed change to the spec, plan and privacy policy first.

Once he confirms, the commands below are shown for Don to run himself (the skill never runs them).
Shown for Don to run himself at the Databases part, choosing **no** if Wrangler offers
to add the binding to the config:

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create dcc-web --location wnam --env-file /dev/null
pnpm exec wrangler d1 create dcc-web-preview --location wnam --env-file /dev/null
```

If a database was created with the wrong name or location and is still empty, remove it with this
command, shown for Don to run himself, then create it again:

```sh
pnpm exec wrangler d1 delete dcc-web --env-file /dev/null
```

After Don says Done, the skill may run one non-check command for this item:
`pnpm exec wrangler d1 list --json`. Its output contains no secrets. Copy the two database IDs
into `wrangler.jsonc` (`dcc-web` at the top level, `dcc-web-preview` under `env.preview`), then
commit and push. This is the only non-check command the skill runs during the walkthrough. Then run
`pnpm setup:check --json --item contact-bindings`.

### Worker secrets part: secrets by name only

Don never pastes a secret into the chat. The check confirms these by name only and the skill
never asks for a value. Shown for Don to run himself at the Worker secrets part, typing or
pasting each value at Wrangler's prompt (production first, then the same three with `--env preview`
in place of `--env ""`, using a different read token and salt). `--env-file /dev/null` keeps Wrangler
from using the read-only token in the repository's `.env` instead of Don's dashboard login:

```sh
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY --env "" --env-file /dev/null
pnpm exec wrangler secret put CONTACT_READ_TOKEN --env "" --env-file /dev/null
openssl rand -hex 32 | pnpm exec wrangler secret put IP_HASH_SALT --env "" --env-file /dev/null
```

To replace a leaked secret on `dcc-web`, Don runs the same `wrangler secret put` command again with
a new value; no redeploy is needed. On `dcc-web-preview` plain `secret put` refuses after a branch
build, so Don runs `wrangler versions secret put NAME --env preview --env-file /dev/null`, then
`wrangler versions deploy --env preview --env-file /dev/null`, and the agent pushes a commit (or Don
retries the build) so the branch alias inherits the new value.
