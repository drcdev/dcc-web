# Review report: apple-container-baselines

Reviewed `git diff main...HEAD` (6db2a7b8, 8551cb89, 5b235131, 05c829b0) against `plan.md`. No changes to code in review.

## Verdict
Ready for PR. W1 to W3 done as planned, nothing beyond them. 0 CRITICAL, 0 HIGH, 3 LOW.

## Work items
- W1 `scripts/visual-baselines-linux.sh`: runtime order is `VISUAL_RUNTIME`, then `container`, then `docker`, else exit 1 (lines 24-43). Shared `run_args` array (51-58). Container route adds `--cpus 4 --memory 8G --shm-size 1G` and inspects the volume, creating it only if missing (60-64). Inner `bash -eo pipefail -c` body is byte-identical to main. Header comment updated (7-14).
- W2 `_shared/visual-baselines.md` steps 2-3 and `CLAUDE.md` bullet plus Visual baselines line: present.
- W3 `docs/setup.md`, `docs/testing.md`, `content/SKILL.md`: present, wording matches the plan.
- Out of scope and untouched: package.json, CI, Playwright config, changed-paths.ts, tests, baseline images. No file under specs/**, .specify/bugs/* or another chore's directory is in the diff.

## Tests
- W1: acceptance run log. Line 2: `Using container with mcr.microsoft.com/playwright:v1.63.0-noble and pnpm 11.15.1`. Line 89: DejaVu Sans resolved. Then `78 passed (57.6s)` and `EXIT=0`. The snapshots directory showed zero porcelain diff (per the implement summary). `bash -n` re-run in review: passes. shellcheck skipped (not installed), as planned.
- W2/W3: no behaviour change (n/a). tests/unit green per the implement summaries (2878 passed).
- Docker route not executed (Docker Desktop off); reasoned from the diff only.

## Script correctness
- `set -euo pipefail` kept, and `${VISUAL_RUNTIME:-}` keeps `-u` safe. All expansions are quoted, including `"${run_args[@]}"`.
- Docker route is unchanged from main: `docker run --rm -t -v "$PWD:/work" -v dcc-web-linux-node-modules:/work/node_modules -w /work -e CI=1 -e WRANGLER_SEND_METRICS=false <image> bash -eo pipefail -c "…"`, same flags in the same order.
- Volume creation is idempotent (inspect, else create). Create keeps stderr, and a failure aborts under `set -e`.
- A `command -v` guard before each status call lets a missing binary fall through cleanly. Harmless.
- Error messages go to stderr and exit 1. Each names `container system start` or Docker Desktop, and an invalid `VISUAL_RUNTIME` is reported with the value given. No secrets or `.env` passed into the container.

## Checks not weakened
No test, threshold, CI step or gate is touched. No shared block is restated in a pipeline skill; content/SKILL.md keeps a one-phrase pointer.

## Findings
### CRITICAL
None.
### HIGH
None.
### LOW
1. `.claude/skills/_shared/visual-baselines.md:25`: step 3 says "the container runtime made … the container runtime has drifted from CI", which reads as Apple's `container` only even though Docker is the fallback. Suggest "the local runtime (`container` or Docker)". The line is 126 characters against the file's ~100-column wrap. The same applies to `CLAUDE.md:26` (115), `docs/setup.md:272`, `docs/testing.md:217` and `content/SKILL.md:111`. Cosmetic.
2. `.claude/skills/deliver/SKILL.md:103` and `.claude/skills/tweak/SKILL.md:145`: the tasks-phase text still says `test:visual:update:linux` "needs Docker Desktop", which is now inaccurate. The plan scoped these skills out, and the implement phase follows the shared rule, so nothing breaks. Follow-up.
3. `CLAUDE.md:20-21`: the inline code `container system start` is split across a line break. It renders fine but a grep for the command misses it. Cosmetic.

## Before / after measurement
- Before (main): the Linux baseline refresh ran only in Docker Desktop, which is normally off.
- After: it runs in the `container` tool first (normally running), with Docker as the fallback. The W1 run took the container route, resolved DejaVu Sans, passed 78 tests, exited 0 and left zero diff in tests/e2e/visual.spec.ts-snapshots/. Not re-run in review.

## Follow-ups for the PR body
- The Docker route was not exercised (Docker Desktop off); I checked by reading the diff that its arguments are unchanged.
- Update the "needs Docker Desktop" phrase in the deliver and tweak tasks-phase rows (LOW 2).
- Optional: reword and rewrap step 3 of the shared visual-baselines rule (LOW 1).
- The auto-memory notes that say Docker is the only Linux route are Don's to update.
- A shellcheck step in CI could be a separate chore.
- `scripts/build-fixture-site.ts:140` warns about EACCES on Docker Desktop bind mounts. The same may apply to `container`'s virtiofs mount, though the acceptance run showed no problem.
