# Inner loop and gate (shared)

Included by `/deliver`, `/tweak`, `/squash` and `/chore`. These rules are **mandatory** for the
orchestrator and for every subagent told to read this file. Do not paraphrase them into a
subagent prompt; pass them by reference.

**Inner loop and gate.** `pnpm run verify:quick` runs secret lint, lint, type check, the unit
and component tests, the worker tests and the real `astro build`. It is the inner-loop check
for implement and fix subagents. It leaves out the build-fixture tests and every Playwright
project, so it never counts as the gate. The full `pnpm run verify` runs the whole gate
(secret lint, lint, type check, unit, component, build-fixture and worker tests, build, and
every Playwright project — E2E, accessibility, sections, performance budget and visual), and
it is the only check that counts before a PR for a code change.

Before the gate, commit everything (the tier reads committed changes only, so
`git status --porcelain` must be empty), run `git fetch origin` and
`node scripts/ci/changed-paths.ts --base origin/main` to get the local tier, then run only that
tier's checks: skip-safe runs `pnpm run lint:secrets`;
docs runs `pnpm run lint:secrets && pnpm run test:unit`; content-only or full runs the full
`pnpm run verify`. Only the full-gate case needs Don's go-ahead; the others take seconds. CI
recomputes the same tier, narrows the gate by the changed paths as `docs/testing.md` describes,
and is the gate.

**For implement and fix subagents.** Run the targeted vitest files or Playwright projects for
the changed paths under the `perl` alarm. Then run `pnpm run verify:quick` under the `perl`
alarm as the inner-loop check. Only the orchestrator's tiered gate before the PR counts as the
gate. Never mark work done on a red suite.
