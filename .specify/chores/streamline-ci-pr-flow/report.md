# Review report — streamline-ci-pr-flow

Reviewer read `git diff main...HEAD` (7 commits, b977be7..25db743, 16 files) against `plan.md`, with
the constitution read on the branch (3.0.0) and on `main`.

**Counts:** CRITICAL 0 · HIGH 1 · LOW 7

## Work items

| Item | Status | Notes |
|---|---|---|
| W1 constitution 3.0.0 | done | III retitled; major-change list, flag and "when in doubt" removed; IX, Technology Constraints and Governance reworded; Security Baseline "(Principle III)" kept. See HIGH-1, LOW-4, LOW-5. |
| W2 classifier and drift guard | done | `VOICE.md` in `SKIP_SAFE_FILES`; `AGENT_PREFIXES` and `CODE_EXTENSIONS` added; non-code files under `.claude/skills/` are docs tier; `READ_BY_CHECKS` removed; `isMalformed` still guards every predicate; the guard expands directory literals and matches `VOICE.md`. |
| W3 local tier | done | `--base <ref>` sets event `local`, diffs `<ref>...HEAD` with no fetch, accepts only a plain ref, and writes `GITHUB_OUTPUT` only when it is set. |
| W4 docs | done | `docs/testing.md` (tier table, local-tier paragraph, accepted risk, Visual row); `docs/setup.md` (item 10, three principle lines); `docs/design/blog.md:298`. |
| W5 `_shared/` | done | open-pr (no classification, auto-merge on every PR), preview-check, visual-baselines, verify-gate (local tier). |
| W6–W8 skills and CLAUDE.md | done | Finish lists renumbered with no gaps and no dangling "step N"; tweak triage condition 1 is "No platform change". |
| W9 memory | done | Named memory files carry a #143 update line; the remaining "major-change" mentions are historical. |

Nothing in the diff goes beyond the plan except LOW-7. `ci.yml`, `verify-needs.ts`, `CODEOWNERS`,
`src/`, `worker/`, `public/`, `tests/e2e/` and the snapshots are unchanged.

## Tests

- `vitest run tests/unit/ci tests/unit/setup tests/unit/site/docs-content-structure.test.ts`: 39 files, 670 tests, all passing.
- Full `pnpm run test:unit`: 158 files, 2434 tests, all passing.
- Every path is asserted (`SAFE`, `DOCS_TRUE` plus the `decide()` docs cases, `UNSAFE` plus "runs the full tier for %s alone"). W3 cases: merge-base diff without fetch, six malformed bases returning `null` without calling git, a git failure returning `null`, and `decide({event:"local"})` sorting like a PR and failing closed on `null`.
- Every new or moved case is a unit test, as the plan names. The coverage mapping holds and no assertion was dropped: `.registry` moved from UNSAFE to SAFE; setup-walkthrough moved to `DOCS_TRUE` (the old deny-list case is now "runs the docs tier when the setup-walkthrough skill changes"); the other skill paths moved from SAFE to `DOCS_TRUE`.
- Drift guard: the old classifier passed every `.claude/skills/**/*.md` as skip-safe. The guard now expands the `".claude/skills"` literal at `tests/unit/site/docs-content-structure.test.ts:142`, so the old classifier fails it and the new one passes.

## No check weakened

- **Skip-safe readers.** I searched `src`, `scripts`, `tests`, `worker`, `.github`, `setup` and every root config (`eslint.config.js`, `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`, `package.json`, `.secretlintrc.json`, `wrangler.jsonc`) for `.claude`, `.specify` and `VOICE`. There are exactly two readers, both of `.claude/skills/` (docs tier): `tests/unit/setup/skill-behaviour.test.ts:6` and `tests/unit/site/docs-content-structure.test.ts:142`.
- **Tools that read files without naming them.** eslint and tsc/astro check read only files whose extensions are in `CODE_EXTENSIONS`, so those stay full tier. No JSON file under `.claude/` or `.specify/` is imported. secretlint runs on every tier.
- **Docs tier.** `ci.yml:74` runs `pnpm run test:unit` on every tier except skip-safe, and `test:unit` covers `tests/unit/**`, so both skill readers run on the docs tier. `verify-needs.ts` is unchanged. The gate is stricter than before: skill edits used to skip their readers.
- **Local tier.** Content-only and full run the full verify. A bad, missing or unknown base fails closed to `tier=full`. CI recomputes the tier itself.

## Findings

### HIGH

**HIGH-1 — PR #146 conflicts with this branch in `.specify/memory/constitution.md`, and #146 has merged (origin/main 79bfb9f).**
To resolve it, merge `origin/main`; then:
1. Keep the 3.0.0 Sync Impact Report and change it to `2.3.1 → 3.0.0`.
2. Take #146's TODO list, which no longer has the `#86` TODO.
3. Make the design baseline line read "the site's Tailwind theme is its design system."
4. Set the footer to `3.0.0 | Ratified 2026-09-28 | Last Amended 2026-10-10`.
5. Re-run the major-change grep.

### LOW

- **LOW-1** — The verify step in the four skills says "when the tier is full" but leaves out content-only (`deliver/SKILL.md:219`, `chore/SKILL.md:243`, `squash/SKILL.md:148`, `tweak/SKILL.md:181`).
- **LOW-2** — `_shared/verify-gate.md:24–25` still says only the full verify counts as the gate.
- **LOW-3** — The local tier diffs `origin/main...HEAD`, so uncommitted work is not tiered; say to run it on a clean tree.
- **LOW-4** — `constitution.md:90` says "once it is opened", where the skills say "right after the final push".
- **LOW-5** — The Sync Impact Report says "issue #105" (it is a PR) and "this command" where it should name `speckit-constitution`; the Governance line overruns the wrap width.
- **LOW-6** — Existing drift-guard gaps, none new in this PR: it does not scan `worker/`, `.github/`, `setup/` or `package.json`, and it misses `join(".claude", …)` and a bare `".claude"`.
- **LOW-7** — `/squash` and `/chore` dropped "whether auto-merge is armed" from the PR body and report, while `/deliver` and `/tweak` keep it.

## Before/after measurement

This branch is `tier=full` (`scripts/ci/changed-paths.ts` changed), so CI runs the full gate on it.

| Change | Before (main) | After |
|---|---|---|
| `.claude/settings.json` only | skip-safe | skip-safe |
| `.specify/scripts/bash/common.sh` | skip-safe | skip-safe |
| `.specify/extensions/.registry` | full | skip-safe |
| `.specify/memory/constitution.md` | skip-safe | skip-safe |
| `.claude/skills/deliver/SKILL.md` | skip-safe (its unit test skipped) | docs |
| `.claude/skills/setup-walkthrough/SKILL.md` | full | docs |
| `.claude/hooks/check.ts`, `.specify/x.d.ts` | full | full |

| Tier | Expected CI | Moved into it by this PR |
|---|---|---|
| skip-safe | ~51 s | `.registry`, any `.txt`, `.toml` or extensionless agent file, and `VOICE.md` (were full: ~604 s on a PR, 376–581 s on main) |
| docs | ~52 s | every skill edit (was 51 s skip-safe) and setup-walkthrough (was ~604 s full) |
| content-only / full | ~8–10 min | unchanged |

**Local gate.** Before, every branch ran the full verify (5:39 to 8 min). After: docs tier ~10.5 s (`lint:secrets` 1.4 s plus `test:unit` 9.1 s), skip-safe ~1.4 s, content-only and full unchanged.

## Follow-ups for the PR body

- LOW-4, LOW-6 and LOW-7 if they are not folded in.
- Merge the skip-safe and docs tiers (51 s against 52 s).
- Reconsider the full run on the merge-commit push to `main` (Principle II; Don's call).

## Resolution (orchestrator, round 1)

- **HIGH-1 resolved.** Merged `origin/main` (79bfb9f, PR #146). The constitution conflict is resolved as described: Sync Impact Report `2.3.1 → 3.0.0` naming speckit-constitution, #146's TODO list kept, design baseline reads "the site's Tailwind theme is its design system.", footer 3.0.0. "major" now appears only inside the Sync Impact Report comment and in the semver rule ("MAJOR for …").
- **LOW-1 fixed.** The four skills' verify steps name content-only alongside full.
- **LOW-2 fixed.** `_shared/verify-gate.md` says the orchestrator's tiered gate counts.
- **LOW-3 fixed.** `_shared/verify-gate.md` requires an empty `git status --porcelain` before tiering.
- **LOW-4 fixed.** The constitution says auto-merge is armed "after its final push".
- **LOW-5 partly fixed.** "PR #105" and the skill name are corrected; the Governance wrap width is left as is.
- **Open, for the PR body:** LOW-6 and LOW-7.
