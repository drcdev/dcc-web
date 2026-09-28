# Contract: `/setup-walkthrough` Claude Code skill

**File**: `.claude/skills/setup-walkthrough/SKILL.md` · **Runbook twin**: `docs/setup.md`

## Behaviour

1. Run `pnpm setup:check --json` (never re-implements confirmation logic — FR-010).
2. Show the full ordered step list with each step's status (Story 2 scenario 1).
3. For each step in order:
   - `complete` → one line "Step N — already done, skipping" (FR-011).
   - otherwise → show **What it is for**, **Where to do it**, **How it will be confirmed** from the
     report / registry and the matching `docs/setup.md` section (FR-008), then pause with
     **AskUserQuestion**: `Done — check it` · `Skip for now` · `Stop here` (FR-009).
   - On `Done — check it` → run `pnpm setup:check --json --item <id>`.
     - `complete` → continue.
     - `pending` → explain the wait, offer to continue with steps that do not depend on it.
     - `missing` / `could-not-check` → show `summary`, `details`, `nextAction`; stay on the step
       (Story 2 scenario 3).
   - `Skip for now` → move on; dependent steps are shown as blocked.
   - `Stop here` → print how to resume (`/setup-walkthrough`); state is recomputed next time.
4. Before the `dns-nameservers` step, refuse to continue unless `dns-records-parity` is complete
   (FR-007, spec edge case "Existing DNS records").
5. Before the steps marked `after-merge`, tell Don the slice's PR must be merged first and give
   the PR link.
6. End with the full report and the summary line.

## Secret handling (FR-012, FR-024)

- Never ask for, echo, or read back a secret value. The skill's instructions forbid
  `cat .env`, `printenv`, `gh auth token`, `wrangler secret` reads, or any command whose output
  contains a secret.
- Secret steps say: "Open `.env` in your editor and paste the token after
  `CLOUDFLARE_API_TOKEN=`" or "Paste it into the Cloudflare/GitHub screen", then "Choose Done".
- If Don pastes something that looks like a secret into the chat, the skill tells him to revoke
  and recreate it, and does not repeat it.

## Allowed commands

Read-only only: `pnpm setup:check …`, `pnpm setup:dns-snapshot`, `gh auth status`,
`node --version`, `pnpm --version`, `git status`. Commands that change provider settings
(for example `gh api -X POST …/rulesets --input setup/github-ruleset.json`, `gh label create`)
are **shown for Don to run himself**; the skill does not run them.
