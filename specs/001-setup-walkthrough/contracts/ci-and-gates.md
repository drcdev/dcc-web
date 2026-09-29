# Contract: CI workflows, required checks and major-change gate

## Required status checks on `main` (ruleset `main-protection`)

| Check context | Workflow file | Job id / name | Events |
|---|---|---|---|
| `verify` | `.github/workflows/ci.yml` (name `CI`) | `verify` | `pull_request`, `push` to `main` |
| `major-change-approval` (commit status) | `.github/workflows/major-change.yml` (name `Major change`) | `gate` (publishes the status) | `pull_request` (opened, synchronize, reopened, labeled, unlabeled, ready_for_review), `pull_request_review` (submitted, edited, dismissed) |

Ruleset contexts are part of the contract: the `verify` context is the `verify` job's check run,
and `major-change-approval` is a commit status posted by the `gate` job. The gate job must not be
named `major-change-approval`, or its check run would collide with the status context. A drift
test compares the ruleset contexts with the `verify` job key and the gate script's
`STATUS_CONTEXT`.

## `verify` job

- `permissions: contents: read`; no repository secrets.
- Runs `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps chromium`,
  `pnpm run verify` — the same command Don and agents run locally (FR-015, FR-016).

## `gate` job (publishes the `major-change-approval` status)

- `permissions: pull-requests: read` and `statuses: write`; uses `GITHUB_TOKEN` only.
- Fetches labels, author, head SHA and reviews with `gh api`, then runs
  `node scripts/ci/major-change-gate.ts`, which posts `success` (approved, or no label) or
  `pending` (waiting for approval, or owner-authored PR) to status context `major-change-approval`
  on the PR head SHA and exits 0. It exits non-zero only on error (missing env, failed API call).
  Decision rules: see `MajorGateInput` in [data-model.md](../data-model.md).
- Why a status: check runs from separate workflow runs on one SHA do not supersede each other, so
  a failed push-run check run blocked the PR after a later review-run passed. The newest commit
  status for a context wins.
- Same-repo PRs only: a `pull_request_review` run from a fork gets a read-only token and could not
  post the status.

## Marking a PR major

| Mechanism | Covers | Enforced by |
|---|---|---|
| `.github/CODEOWNERS` → `@drcdev` on `/.github/`, `/package.json`, `/pnpm-lock.yaml`, `/.nvmrc`, `/wrangler.jsonc`, `/astro.config.mjs`, `/public/_headers`, `/scripts/ci/`, `/setup/`, `/.specify/memory/constitution.md`, `/.github/CODEOWNERS` | Principle III majors that are visible as paths (dependencies, CI, deployment, infrastructure, constitution) | GitHub ruleset `require_code_owner_review` (native) |
| Label `major-change` | Majors not visible as paths (design system, layout, navigation, visual identity, running cost, contact data handling) | `major-change-approval` required check |

The `/deliver` skill applies the label when Don chooses "Major — hold for my review".

## Preview deployments

Workers Builds (not GitHub Actions) builds every non-`main` branch with
`pnpm exec wrangler versions upload` and posts its own check run and preview URL on the PR;
`main` is deployed with `pnpm exec wrangler deploy`. The Workers Builds check is informational
and not a required context (its name is owned by Cloudflare).
