# Quickstart: validating the setup walkthrough and setup check

**Feature**: `001-setup-walkthrough` | **Plan**: [plan.md](./plan.md)

These scenarios prove the slice works. Contracts: [setup-check CLI](./contracts/setup-check-cli.md),
[report schema](./contracts/check-report.schema.json), [walkthrough skill](./contracts/walkthrough-skill.md),
[CI and gates](./contracts/ci-and-gates.md). Entities: [data-model.md](./data-model.md).

## Prerequisites

- Node 24 (`nvm install 24 && nvm use`, reads `.nvmrc`), pnpm per `packageManager` (`corepack enable`).
- `gh auth status` shows Don's account.
- For live scenarios only: `.env` created from `.env.example` with a **read-only** Cloudflare token
  (entered in an editor, never in chat).

## 1. Local gate (no accounts needed)

```bash
pnpm install
pnpm exec playwright install chromium
pnpm run verify
```

Expected: secretlint, ESLint, `astro check`, Vitest, `astro build` and Playwright all pass.
Vitest includes the setup-check unit tests with recorded provider fixtures (FR-006), the
registry/docs/secret-manifest drift tests, the major-change gate tests and the `_headers` test.
Playwright runs the axe WCAG 2.2 AA scan and the page-budget test on the placeholder.

**Negative check (FR-024)**: add a file containing a fake AWS-style key, run
`pnpm run lint:secrets` → fails naming the file. Delete the file.

## 2. Check reports everything missing on a fresh setup (Story 1, scenario 1)

With no `.env` and no provider setup:

```bash
pnpm setup:check; echo "exit=$?"
```

Expected: every item is `missing` or `could-not-check`, each with a next action, walkthrough step
and docs link; summary line "0 of 18 complete" (or the count of already-done items); `exit=1`.

## 3. Secrets by name only (Story 1, scenario 3)

With `CLOUDFLARE_API_TOKEN` set in `.env`:

```bash
pnpm setup:check --json --item local-credentials | grep -c "$(grep ^CLOUDFLARE_API_TOKEN= .env | cut -d= -f2-)"
```

Expected: `0` (the value never appears). Run this yourself in a terminal; do not paste output that
could contain a secret into chat.

## 4. One item flips (Story 1 independent test)

Complete one item (for example create the `major-change` label and enable auto-merge), rerun
`pnpm setup:check --item github-major-label` → `complete`; rerun the full check → only that
item changed.

## 5. Could-not-check (Story 1, scenario 4)

Disconnect from the network (or temporarily blank `CLOUDFLARE_API_TOKEN` in `.env`) and run the
check. Expected: Cloudflare and DNS items are `could-not-check` with the reason and how to fix
access; none is `complete`.

## 6. Walkthrough (Story 2)

In Claude Code: `/setup-walkthrough`.

- Shows all steps in order; already-complete steps are skipped with a note.
- Stops at the first incomplete step with what / where / how-confirmed and asks Done / Skip / Stop.
- Choosing Done while the step is still incomplete keeps you on the step with the finding and fix.
- Stopping and restarting resumes at the first incomplete step.
- The Cloudflare token step tells you to paste the token into `.env` in your editor, never chat.
- It refuses to move to the nameserver step until DNS parity is complete.

## 7. Branch protection works (SC-006) — after the ruleset is imported

1. As `dcc-bot`, open a PR that breaks a unit test → `verify` fails → merge button blocked.
2. As `dcc-bot`, open a PR labelled `major-change` (or touching `package.json`) with green checks →
   merge blocked until Don approves; after Don's approval on the latest commit it becomes
   mergeable.
3. As `dcc-bot`, open a non-major PR with green checks → mergeable (auto-merge allowed) without Don.

## 8. Hosting, preview, review address, analytics, live site

- Push a branch → Workers Builds posts a preview URL on the PR; the page loads and sends
  `X-Robots-Tag: noindex`.
- `curl -sI https://new.doncoleman.ca/ | grep -i x-robots-tag` → `noindex`.
- `https://doncoleman.ca/` still shows the Ghost site; email still arrives (send a test message).
- Cloudflare dashboard → Web Analytics shows `new.doncoleman.ca` with automatic setup.
- `pnpm setup:check` → "18 of 18 complete", exit 0.

## 9. Docs parity (Story 3)

Open `docs/setup.md`: one section per check item with purpose, where, how confirmed, principle
and secret names only. The drift test in `pnpm run verify` enforces the one-to-one match.
