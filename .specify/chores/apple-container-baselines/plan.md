# Chore plan: apple-container-baselines

Branch: `chore/apple-container-baselines`, from `main` at 72a235dc.
No issue (ad-hoc chore Don asked for in chat).

## Goal

`pnpm run test:visual:update:linux` (`scripts/visual-baselines-linux.sh`) runs only in Docker
Desktop today, which is normally off. Apple's `container` tool (1.6.0, Homebrew login service,
recommended kernel) is installed and normally running. The script should prefer `container`
when `container system status` succeeds and fall back to Docker when `docker info` succeeds.
Both routes use the same image (`mcr.microsoft.com/playwright:v<version>-noble`), the same
DejaVu font install and the same steps. The live docs that say "Docker" are updated to
describe the new order. No user-visible behaviour changes: the site, tests and baselines are
untouched.

## Acceptance

1. With `container` running, `pnpm run test:visual:update:linux` uses the container route
   (it prints which runtime it chose) and completes. On this branch (no snapshotted surface
   changed, so it equals clean `main`), `git status --porcelain tests/e2e/visual.spec.ts-snapshots/`
   is empty afterwards: zero diff in the `*-linux.png` baselines (the macOS PNGs are not
   rewritten by this script either).
2. The container route passes `--cpus 4 --memory 8G --shm-size 1G` (the default is 4 CPUs and
   1 GB memory, too small for the Astro build and Chromium). The Docker route keeps today's
   arguments exactly.
3. node_modules lives in the named volume `dcc-web-linux-node-modules` on both routes. On the
   container route the script creates it with `container volume create` when
   `container volume inspect` fails. The repository is bind-mounted writable at `/work`.
4. When neither `container system status` nor `docker info` succeeds, the script exits 1 with
   a message telling the user to start `container` (`container system start`) or Docker
   Desktop. `VISUAL_RUNTIME=docker` or `VISUAL_RUNTIME=container` forces a route (judgment
   call J1); a forced route that is not running exits 1 with the same kind of message.
5. `bash -n scripts/visual-baselines-linux.sh` passes. shellcheck is not installed locally, so
   it is skipped (noted, not added as a dependency).
6. `CLAUDE.md` (Local toolchain bullet, Visual baselines line), `.claude/skills/_shared/visual-baselines.md`
   (steps 2 and 3), `docs/setup.md`, `docs/testing.md` and `.claude/skills/content/SKILL.md`
   describe the order: `container` first, Docker Desktop as the fallback, and if neither is
   running ask Don to start one with an `AskUserQuestion` whose question text carries the
   instruction.
7. Tier: the `.sh` is in `CODE_EXTENSIONS`, so `node scripts/ci/changed-paths.ts --base origin/main`
   prints `tier=full`. Local gate per `_shared/verify-gate.md` (ask Don before the full gate;
   CI is the gate).

## Scope

**In:** W1 to W3 below.

**Out:**

- `package.json` (the `test:visual:update:linux` entry is unchanged), CI, Playwright config,
  `scripts/ci/changed-paths.ts`, any test or baseline image.
- Comments in `scripts/build-fixture-site.ts:140` and `scripts/lib/e2e-wrangler-config.ts:5`,
  generic Docker mentions in `deliver`/`tweak`/`speckit-implement` skills, and historical
  records under `specs/**`, `.specify/chores/*` and `.specify/bugs/*`.
- Follow-ups (PR body only): the auto-memory notes that say "Docker is the only Linux route"
  are Don's to update; a shellcheck step in CI is a possible separate chore.

## Constitution Check

- **I. Test-First:** the script has no unit-testable behaviour beyond its end-to-end run, so W1's
  test is the acceptance run itself (Acceptance 1) plus `bash -n`; W2 and W3 are docs
  (`no behaviour: n/a`).
- **II. Automated Release Gate:** unchanged. CI still compares against the committed Linux
  baselines; nothing is skipped or loosened.
- **III. Human Review of Every Change:** PR from `drc-agents`, auto-merge armed, Don approves.
- **IV. First-Party Before Custom:** uses Apple's own `container` CLI flags and volumes as
  documented, and keeps the official Playwright image; no new package.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** unaffected; no secrets or `.env` passed into the container.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** no cost; local tooling only.
- **X. Accessible, Fast and Private:** unaffected; baselines must stay byte-identical.
- **XI. Spec Kit Workflow:** chore branch with its plan in `.specify/chores/apple-container-baselines/`.

## Work items

### [x] W1 Container route in `scripts/visual-baselines-linux.sh`

Files: `scripts/visual-baselines-linux.sh`.
Test: acceptance run (Acceptance 1) via the container route, plus `bash -n`.
Layer: e2e (manual acceptance run of the visual update; no automated test reads the script).

- Keep one script. Pick `runtime` in this order: `VISUAL_RUNTIME` if set (must be `container`
  or `docker`, else exit 1); else `container` if `command -v container` and
  `container system status >/dev/null 2>&1` succeed; else `docker` if `docker info` succeeds;
  else exit 1 with the "start container (`container system start`) or Docker Desktop" message.
  Print `Using <runtime> with <image> and pnpm <version>`.
- Share the run arguments in a bash array: `--rm -t -v "$PWD:/work"
  -v dcc-web-linux-node-modules:/work/node_modules -w /work -e CI=1
  -e WRANGLER_SEND_METRICS=false`. The container route adds `--cpus 4 --memory 8G
  --shm-size 1G` (host has 10 CPUs and 16 GB). Do not pass `--arch`: default arm64 matches
  Docker on Apple Silicon, which already matches CI.
- Container route only: `container volume inspect dcc-web-linux-node-modules >/dev/null 2>&1
  || container volume create dcc-web-linux-node-modules` (none exists yet). Docker creates
  named volumes on first use, as today.
- The inner `bash -eo pipefail -c "…"` body is unchanged (DejaVu install, pnpm install with
  the store in the volume, build, `test:visual:update`). Update the header comment: needs
  `container` or Docker Desktop running.
- Implement step: run `pnpm run test:visual:update:linux` through the nvm wrapper in the
  background under `perl -e 'alarm 1800; exec @ARGV'` (first run pulls the image and does a
  cold pnpm install; expect several minutes), then check
  `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` is empty. If the named volume
  form `-v name:/path` is rejected by `container run`, fall back to a host directory outside
  the repo (`${XDG_CACHE_HOME:-$HOME/.cache}/dcc-web/linux-node-modules`) bind-mounted at
  `/work/node_modules`, and say so in the summary. If baselines differ, stop: do not commit
  them; report the diff (that is a `[NEEDS DECISION]` for Don, not a baseline refresh).

### W2 Shared rule and CLAUDE.md

Files: `.claude/skills/_shared/visual-baselines.md` (steps 2 and 3), `CLAUDE.md` (Local
toolchain Docker bullet, Visual baselines "Linux via Docker" phrase).
Test: `no behaviour: n/a (agent instructions)`.
Layer: none (no test reads these files).

- `_shared/visual-baselines.md` step 2: the script runs in Apple's `container` when
  `container system status` succeeds, else Docker Desktop (`docker info`), with the same
  Playwright image. If neither succeeds, ask Don to start one (`container system start`, or
  Docker Desktop) with an `AskUserQuestion` whose question text carries the instruction.
  Step 3: "the container runtime has drifted from CI" instead of "Docker has drifted".
- `CLAUDE.md` bullet: `container` is a Homebrew login service and normally running; Docker
  Desktop is normally off and is the fallback; same ask-Don rule when neither runs. Visual
  baselines line: "Linux via `container` or Docker".

### W3 Live docs

Files: `docs/setup.md` (~line 272), `docs/testing.md` (~line 217),
`.claude/skills/content/SKILL.md` (~line 111).
Test: `no behaviour: n/a (docs)`; the existing readers (`docs-content-structure.test.ts`,
`changed-paths.test.ts` drift guard, `skill-behaviour.test.ts`) stay green under
`pnpm run test:unit`.
Layer: unit (existing tests only).

- setup.md: "runs in the Playwright image matching `@playwright/test`, in Apple's `container`
  when it is running, else Docker Desktop".
- testing.md: "The Linux baselines come from the Playwright image (run in `container` or
  Docker)".
- content/SKILL.md: "which runs the Playwright image in `container` or Docker".

## Docs citations

- apple/container command reference, `container run` (`--cpus`, `--memory`, `--shm-size`,
  `--volume`, `--workdir`, `--env`, `--rm`, `--tty`) and `container volume create|inspect`,
  `container system status|start`:
  https://github.com/apple/container/blob/main/docs/command-reference.md and
  https://github.com/apple/container/blob/main/docs/how-to.md. Confirmed locally against
  `container run --help` and `container volume create --help` (1.6.0).
- Playwright Docker image tags: https://playwright.dev/docs/docker.

## Risks

- **Rendering drift.** A different VM kernel could in principle change Chromium output. The
  image, arch (arm64) and fonts are identical, so pixels should match; the acceptance run is
  the check, and a diff stops the chore rather than landing new baselines.
- **Bind-mount behaviour.** `container` uses virtiofs; file ownership of written PNGs, write
  speed of `dist/`, and inotify are different from Docker. The run writes only `dist/`,
  `.astro/` and the snapshots, so ownership is the main thing to check (`ls -l` a PNG after a
  run if it changed).
- **Named volume support or size.** `-v name:/path` is expected to mount a named volume in
  1.6.0; W1 has a host-directory fallback. The default volume size must hold node_modules plus
  the pnpm store (~1-2 GB); pass `-s` on create if it proves too small.
- **Memory.** 8 GB of 16 GB on the host while sibling worktrees run may starve the machine;
  lower to 6G if the run is killed, never below 4G.
- **Network.** The container route needs outbound access for `apt-get` and npm, the same as
  Docker today.
