#!/usr/bin/env bash
# Regenerate the Linux visual baselines locally.
#
# Runs the same steps as the `update-baselines` job in
# .github/workflows/visual-baselines.yml, inside the official Playwright image
# that matches the installed @playwright/test version (Ubuntu 24.04, the same
# Chromium build and fonts as `ubuntu-latest`). node_modules (and the pnpm
# store inside it) live in a named Docker volume so the Linux-native binaries
# never touch the macOS node_modules; the repository itself is bind-mounted, so
# the refreshed images land directly in tests/e2e/visual.spec.ts-snapshots/.
#
# Needs Docker Desktop running. Usage: pnpm run test:visual:update:linux
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, wait for it to report ready, then run this again." >&2
  exit 1
fi

playwright_version=$(node -p "require('./node_modules/@playwright/test/package.json').version")
pnpm_version=$(node -p "require('./package.json').packageManager.split('@')[1]")
image="mcr.microsoft.com/playwright:v${playwright_version}-noble"

echo "Using ${image} with pnpm ${pnpm_version}"

docker run --rm -t \
  -v "$PWD:/work" \
  -v dcc-web-linux-node-modules:/work/node_modules \
  -w /work \
  -e CI=1 \
  -e WRANGLER_SEND_METRICS=false \
  "$image" \
  bash -eo pipefail -c "
    echo \"node \$(node -v) in container\"
    # ubuntu-latest ships DejaVu, which fontconfig ranks first for sans-serif,
    # so CI renders the site's system font stack in DejaVu Sans. The Playwright
    # image lacks it and would fall back to Liberation Sans, changing every
    # text pixel. Installing it makes the two renderings match.
    (apt-get update -qq && apt-get install -y -qq --no-install-recommends fonts-dejavu-core) >/dev/null 2>&1
    echo \"sans-serif resolves to: \$(fc-match sans-serif)\"
    npm install -g pnpm@${pnpm_version} >/dev/null
    pnpm install --frozen-lockfile --store-dir /work/node_modules/.pnpm-store
    pnpm run build
    pnpm run test:visual:update
  "

echo
echo "Linux baselines refreshed. Review the diff with: git status tests/e2e/visual.spec.ts-snapshots/"
