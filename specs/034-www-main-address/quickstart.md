# Quickstart: validating the www main address

Toolchain: follow CLAUDE.md "Local toolchain" (`node -v`; if not the `.nvmrc` major,
`source ~/.nvm/nvm.sh && nvm use` in the same command). Never print `.env*`.

## 1. Repository change (before merge)

| Scenario | Command | Expected |
|---|---|---|
| Resolver falls back to www | `pnpm vitest run --project unit tests/unit/site` | resolver tests pass with `https://www.doncoleman.ca` for `main` and local builds |
| Production build names only www (US1 sc. 1–2, SC-001) | `pnpm vitest run --project build tests/build/indexing.test.ts` | main-branch build: every site-host URL is on `https://www.doncoleman.ca`; no `https://doncoleman.ca` anywhere |
| Local build sitemap | `pnpm astro build && grep -o 'https://[^<]*' dist/sitemap-0.xml \| head` | every entry starts `https://www.doncoleman.ca/` |
| robots.txt | `cat dist/robots.txt` | `Sitemap: https://www.doncoleman.ca/sitemap-index.xml` |
| Setup-check units (US3) | `pnpm vitest run --project unit tests/unit/setup tests/unit/setup-check` | 18 items; `live-hosts` cases per [contracts/setup-check.md](./contracts/setup-check.md); parity accepts the proxied placeholder only when proxied |
| Gate | `node scripts/ci/changed-paths.ts --base origin/main` tier, then CI `verify` | green |

## 2. Before the swap (after merge, production deployed)

`pnpm setup:check --item live-hosts` → `missing`, details showing `https://www.doncoleman.ca/`
answering 301 to the bare domain (old arrangement). This is the expected window (spec Edge Cases).

## 3. The swap (Don, dashboard)

Follow `docs/setup.md#live-hosts` → Live swap ([contracts/live-swap-runbook.md](./contracts/live-swap-runbook.md)).

## 4. After the swap

```sh
pnpm setup:check                      # 18/18 complete (SC-004)
curl -sI 'https://doncoleman.ca/writing/?page=2'   # 301, location: https://www.doncoleman.ca/writing/?page=2
curl -sI 'http://doncoleman.ca/about'              # 301 to https://www.doncoleman.ca/about (or via https://doncoleman.ca/about)
curl -sI 'http://www.doncoleman.ca/'               # 301, location: https://www.doncoleman.ca/
curl -sI 'https://www.doncoleman.ca/drift/2025/self-contained-development-for-ghost-themes/'  # 301, location: /writing/self-contained-development-for-ghost-themes/
```

- Submit the contact form at `https://www.doncoleman.ca/contact/` (SC-005).
- Search Console: sitemap `https://www.doncoleman.ca/sitemap-index.xml` accepted.
- SC-002 spot check (optional): for each `<loc>` in the live sitemap, the `www` URL returns 200 and
  the same path on `https://doncoleman.ca` returns one 301 to it.

## 5. Rollback rehearsal (reading only)

Read `docs/setup.md#live-hosts` → Rollback and confirm it covers each partial state ("after step
1" to "after step 5", FR-015b), restores the old arrangement and states the 24-hour retry and the
revert-PR fallback.
