# Bug Verification: D1 databases lack the project prefix

- **Slug**: d1-database-names
- **Tested**: 2026-09-30
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The old names and IDs no longer appear anywhere outside intentional history. `wrangler.jsonc` binds `DB` to
`dcc-web-contact` and `dcc-web-contact-preview` with the new IDs, and Wrangler resolves the new name locally.
The full unit suite, worker suite, lint and type check all pass. The live account lists the two new databases.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `grep -rn` for `database_name`, `contact-preview`, `d1 create contact`, `migrations apply contact`, old UUIDs, `"contact"` (excluding node_modules, .reference, dist, .cache, 007-contact-form, .specify/bugs) | pass | Old UUIDs: 0 hits. Every other hit is `dcc-web-` prefixed, a `contact-*` setup item id, the contact page/route or `href: "contact"` fixtures |
| Config binding | read `wrangler.jsonc` | pass | Top level `dcc-web-contact` / `9b51b0c4-...`; `env.preview` `dcc-web-contact-preview` / `53cef28f-...`; `migrations_dir` still `migrations` |
| New / updated tests | `pnpm vitest run` (config-files, deploy, setup tests included) | pass | 90 files, 1212 tests |
| Worker suite | `pnpm --filter ./worker test` | pass | 12 files, 132 tests |
| Lint | `pnpm run lint` | pass | eslint exit 0 |
| Type check | `pnpm run typecheck` | pass | astro check, tsc, wrangler types up to date |
| Local wrangler resolution | `pnpm exec wrangler d1 migrations list dcc-web-contact --local --env-file /dev/null` | pass | lists 0001_create_messages.sql |
| Live names | `pnpm exec wrangler d1 list --json --env-file /dev/null` | pass | new names and UUIDs present |

## Output Excerpts

- Vitest: `Test Files 90 passed (90)`, `Tests 1212 passed (1212)`.
- Worker: `Tests 132 passed (132)`.
- Live list also still shows the old `contact` (5b29b0c1-...) and `contact-preview` (3e160f9c-...).

## Residual Risks

- Old `contact` and `contact-preview` databases still exist remotely; Don deletes them after deploys bind to the new IDs.
- Remote behaviour (deploy binding, remote migrations, setup:check items 19, 24, 25) is not exercised here; needs the preview deploy.
- Full `pnpm run verify` (build, e2e) is left to the orchestrator.

## Recommendation

Close the bug once the preview and production deploys bind to the new databases and the old ones are deleted.
