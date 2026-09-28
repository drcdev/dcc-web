# Contract: CI workflows, required checks and major-change gate

## Required status checks on `main` (ruleset `main-protection`)

| Check context | Workflow file | Job id / name | Events |
|---|---|---|---|
| `verify` | `.github/workflows/ci.yml` (name `CI`) | `verify` | `pull_request`, `push` to `main` |
| `major-change-approval` | `.github/workflows/major-change.yml` (name `Major change`) | `major-change-approval` | `pull_request` (opened, synchronize, reopened, labeled, unlabeled, ready_for_review), `pull_request_review` (submitted, edited, dismissed) |

Job names are part of the contract: renaming a job breaks branch protection, so the
`github-main-protection` check compares the ruleset contexts with the job names parsed from the
workflow files (unit-tested).

## `verify` job

- `permissions: contents: read`; no repository secrets.
- Runs `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps chromium`,
  `pnpm run verify` — the same command Don and agents run locally (FR-015, FR-016).

## `major-change-approval` job

- `permissions: pull-requests: read`; uses `GITHUB_TOKEN` only.
- Fetches labels, author, head SHA and reviews with `gh api`, then runs
  `node scripts/ci/major-change-gate.ts` which prints one plain-language line and exits 0 (pass)
  or 1 (fail). Decision rules: see `MajorGateInput` in [data-model.md](../data-model.md).

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
