#!/usr/bin/env bash
# Regenerate the Linux visual baselines locally.
#
# Builds the site and runs `pnpm run test:visual:update` inside the official
# Playwright image that matches the installed @playwright/test version (Ubuntu
# 24.04, the same Chromium build and fonts as `ubuntu-latest`). node_modules (and the pnpm
# store inside it) live in a named volume so the Linux-native binaries
# never touch the macOS node_modules; the repository itself is bind-mounted, so
# the refreshed images land directly in tests/e2e/visual.spec.ts-snapshots/.
#
# Runs in Apple's `container` when `container system status` succeeds, else in
# Docker Desktop (`docker info`). Set VISUAL_RUNTIME=container or
# VISUAL_RUNTIME=docker to force a route.
# Usage: pnpm run test:visual:update:linux
set -euo pipefail
cd "$(dirname "$0")/.."

volume=dcc-web-linux-node-modules
start_hint="Start container (run: container system start) or Docker Desktop, wait for it to report ready, then run this again."

container_running() { command -v container >/dev/null 2>&1 && container system status >/dev/null 2>&1; }
docker_running() { command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; }

case "${VISUAL_RUNTIME:-}" in
  container)
    container_running || { echo "container is not running. ${start_hint}" >&2; exit 1; }
    runtime=container ;;
  docker)
    docker_running || { echo "Docker is not running. ${start_hint}" >&2; exit 1; }
    runtime=docker ;;
  "")
    if container_running; then
      runtime=container
    elif docker_running; then
      runtime=docker
    else
      echo "Neither container nor Docker is running. ${start_hint}" >&2
      exit 1
    fi ;;
  *)
    echo "VISUAL_RUNTIME must be container or docker (got: ${VISUAL_RUNTIME})." >&2
    exit 1 ;;
esac

playwright_version=$(node -p "require('./node_modules/@playwright/test/package.json').version")
pnpm_version=$(node -p "require('./package.json').packageManager.split('@')[1]")
image="mcr.microsoft.com/playwright:v${playwright_version}-noble"

echo "Using ${runtime} with ${image} and pnpm ${pnpm_version}"

run_args=(
  --rm -t
  -v "$PWD:/work"
  -v "${volume}:/work/node_modules"
  -w /work
  -e CI=1
  -e WRANGLER_SEND_METRICS=false
)

if [ "$runtime" = container ]; then
  # The default of 4 CPUs and 1 GB is too small for the Astro build and Chromium.
  run_args+=(--cpus 4 --memory 8G --shm-size 1G)
  container volume inspect "$volume" >/dev/null 2>&1 || container volume create "$volume" >/dev/null
fi

"$runtime" run "${run_args[@]}" \
  "$image" \
  bash -eo pipefail -c "
    echo \"node \$(node -v) in container\"
    # ubuntu-latest ships DejaVu, which fontconfig ranks first for sans-serif,
    # so CI renders the site's system font stack in DejaVu Sans. The Playwright
    # image lacks it and would fall back to Liberation Sans, changing every
    # text pixel. Installing it makes the two renderings match. Inter is self-hosted
    # now, but DejaVu stays so the fallback face matches CI (feature 018, R10).
    (apt-get update -qq && apt-get install -y -qq --no-install-recommends fonts-dejavu-core) >/dev/null 2>&1
    echo \"sans-serif resolves to: \$(fc-match sans-serif)\"
    npm install -g pnpm@${pnpm_version} >/dev/null
    pnpm install --frozen-lockfile --store-dir /work/node_modules/.pnpm-store
    pnpm run build
    pnpm run test:visual:update
  "

echo
echo "Linux baselines refreshed. Review the diff with: git status tests/e2e/visual.spec.ts-snapshots/"
