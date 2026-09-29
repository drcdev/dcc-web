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

1. Run `pnpm setup:check --json`. If the `live-domain-ghost` result has a summary starting
   "Problem:", show it before anything else — the live site may have come off Ghost and needs
   the rollback procedure in `docs/setup.md#dns-nameservers` right away.
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
4. Before showing the `dns-nameservers` step as actionable, refuse to continue unless
   `dns-records-parity` is complete, and show the rollback procedure from
   `docs/setup.md#dns-nameservers` before Don makes the nameserver switch (FR-039). Also remind
   Don to confirm DNSSEC is disabled at Squarespace (see the "Before the switch: DNSSEC" note in
   `docs/setup.md#dns-nameservers`) before he makes the switch.
5. Before any step whose `phase` is `after-merge`, tell Don this slice's pull request must be
   merged first, and give the PR link.
6. End with the full report (`pnpm setup:check`) and its summary line ("`N` of 18 complete").

## Secret handling (FR-012, FR-024)

- Never ask Don to type, paste or reveal a secret value in the chat.
- Never run a command whose output can contain a secret value — this includes `cat .env`,
  `printenv`, `gh auth token`, `wrangler secret` reads, and any provider tool's verbose or debug
  mode.
- For a secret step, say: "Open `.env` in your editor and paste the token after
  `CLOUDFLARE_API_TOKEN=`" or "Paste it into the Cloudflare/GitHub screen", then "Choose Done".
- If Don pastes something that looks like a secret into the chat, do not repeat it: tell him to
  revoke and recreate it immediately.

## Allowed commands

The skill runs only these read-only commands:

- `pnpm setup:check` (with `--json`, `--item <id>`, or `--no-network`)
- `pnpm setup:dns-snapshot`
- `gh auth status`
- `node --version`
- `pnpm --version`
- `git status`

Never run: `cat .env`, `printenv`, `gh auth token`, or any command with a `--verbose` or
`--debug` flag.

Commands that change a provider's settings are **shown for Don to run himself** — the skill never
runs them. Each example below is shown for Don to run himself when he reaches the matching step:

Shown for Don to run himself at the `github-main-protection` step:

```sh
gh api -X POST repos/drcdev/dcc-web/rulesets --input setup/github-ruleset.json
```

Shown for Don to run himself at the `github-major-label` step:

```sh
gh label create major-change
```

Workers Builds deploys automatically once this slice's pull request has merged to main, so the
skill never shows or runs a deploy command as part of the normal walkthrough. If Don ever needs
to trigger a manual deploy himself (for example, to recover from a stuck Workers Builds run),
shown for Don to run himself:

```sh
pnpm exec wrangler deploy
```
