# Bug Fix: D1 databases lack the project prefix

- **Slug**: d1-database-names
- **Fixed**: 2026-09-30
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Renamed the D1 databases to `dcc-web-contact` (production) and `dcc-web-contact-preview` (preview)
everywhere in the repository, and recorded the new database IDs in `wrangler.jsonc` in the same
change. Don had already created the two databases, so the two-PR alternative was not needed.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `wrangler.jsonc` | modified | new `database_name` and `database_id` for both environments; stale placeholder comments dropped |
| `scripts/deploy/production.ts`, `scripts/deploy/preview.ts` | modified | `d1 migrations apply` names |
| `playwright.config.ts` | modified | e2e local migration target |
| `scripts/setup-check/checks/contact-shared.ts`, `scripts/setup-check/items.ts` | modified | fallback constants, item 19 and 24 text |
| `docs/setup.md`, `.claude/skills/setup-walkthrough/SKILL.md` | modified | create/delete commands, names in prose |
| tests (see below) | modified/added | new names and IDs |

New IDs: production `9b51b0c4-2ddb-4563-8621-c99d28de4e16`, preview `53cef28f-8a6c-4b53-8557-bbc30aa986bf`.

## Tests Added or Updated

- `tests/unit/site/config-files.test.ts` — new names, new exact `database_id` values (added), guard that every
  `d1 migrations apply <name>` in the deploy scripts and playwright config matches a `database_name` in
  `wrangler.jsonc` for the right environment (added), playwright command.
- `tests/unit/site/deploy-preview.test.ts`, `deploy-production.test.ts` — new names; mutual-exclusion assertions kept.
- `tests/unit/setup/docs-structure.test.ts`, `items.test.ts` — exact `d1 create` command strings.
- `tests/unit/setup-check/checks/*` and `providers/contact-readers.test.ts` — fixtures.
- `worker/test/environments.test.ts` — expected names.

## Local Verification

- `pnpm vitest run tests/unit/site tests/unit/setup-check tests/unit/setup` → 795 pass (10 failed before the fix, as expected).
- `pnpm --filter ./worker test` → 132 pass.
- `pnpm run lint` → 0 errors; `pnpm run typecheck` → clean.

## Deviations from Assessment

- The new IDs went into `wrangler.jsonc` in this change rather than after a separate step.
- `worker/test/env.d.ts` needed no change (generic comments). `specs/007-contact-form/**` left untouched.

## Follow-ups

- Don deletes the old `contact` and `contact-preview` databases after the preview and production deploys bind to the new IDs.
- Major change (Principle III): auto-merge stays off; preview check and `setup:check` items 19, 24, 25 after merge.
