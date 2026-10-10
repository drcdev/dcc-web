# Review report: dependabot-sharp-source-map

Reviewed 2026-10-09 against `plan.md`, diff `67fc616...HEAD` (commits 97170e0, 8b5afd3, d6e879a).
Fresh-eyes review; saved by the orchestrator because the review subagent may not write files.

## Findings

- **CRITICAL:** none.
- **HIGH:** none.
- **LOW:**
  1. `plan.md` Acceptance 6 asks for "the same test count as before" without recording it. The
     worker suite is 19 files, 281 tests; no test file changed. Give 281 in the PR body.
  2. `worker/worker-configuration.d.ts` gains ambient `declare module "*.txt"` / `"*.html"` blocks
     beyond the header: the wrangler 4.148.0 change to default module rules in `wrangler types`,
     predicted in the plan. `wrangler types --check` confirms a plain regeneration. Mention it in
     the PR body.

## Work items

| Item | Planned | Done | Beyond plan |
| ---- | ------- | ---- | ----------- |
| W1   | wrangler 4.144.0 → 4.149.0, vitest-plugin 1.3.3 → 1.4.0 | Yes (8b5afd3) | No |
| W2   | Regenerate worker types | Yes, header `workerd@1.20261006.1` | No |
| W3   | source-map-js 1.2.1 → 1.2.2, lockfile only | Yes (d6e879a) | No |

The diff touches only `plan.md`, `package.json`, `worker/package.json`, `pnpm-lock.yaml` and
`worker/worker-configuration.d.ts`. No test, script, CI or `.claude/` file changed.

## Acceptance (re-run by the reviewer)

1. `corepack pnpm audit`: only GHSA-rj75-hqrm-r3gf (alert #2, dismissed, out of scope). Pass.
2. Lockfile: no `sharp@0.35.4`, no `source-map-js@1.2.1`; old wrangler/miniflare/workerd entries
   gone. Pass.
3. Pins: one line in each manifest. Pass.
4. `pnpm-workspace.yaml` identical to 67fc616; frozen install up to date. Pass.
5. `corepack pnpm run typecheck` (with `wrangler types --check`) exits 0. Pass.
6. Worker suite: 19 files, 281 tests pass. Pass.
7. Full gate: CI (Don chose push and let CI verify).

## Extra lockfile changes

Added entries are all in the planned family (wrangler, miniflare, workerd and its platform
binaries, vitest-plugin, the `@cloudflare/unenv-preset` snapshot key, source-map-js 1.2.2).
Everything else is a removal collapsing onto versions already present at 67fc616: `esbuild@0.28.1`
→ 0.28.2, `zod@4.4.3` → 4.6.5, `sharp@0.35.4` → 0.35.5. The vitest-plugin 1.4.0 peer set dropped
`@vitest/runner` and `@vitest/snapshot`. Benign.

## Principle III

**Major**: the change replaces dependency versions (two direct devDependency pins, new
miniflare/workerd runtime). No other criterion fires. No `[PREVIEW-CHECK]` items.

## Before / after

- **Before (67fc616):** 3 audit findings — source-map-js (high), sharp (high),
  postcss-selector-parser (moderate).
- **After (d6e879a):** 1 finding, postcss-selector-parser (moderate) only.

## Follow-ups for the PR body

- Alert #2 (postcss-selector-parser via `@tailwindcss/typography@0.5.20`) is dismissed as not
  reachable; it clears when typography ships on `^7.1.6`.
- An `auditConfig.ignoreGhsas` entry would let `pnpm audit` exit 0; not done, Don has not asked.
