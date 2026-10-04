# Quickstart: validating self-hosted Inter

**Feature**: `018-self-hosted-fonts`. Rows refer to [contracts/fonts.md](./contracts/fonts.md).

## Prerequisites

- Node from `.nvmrc` (`node -v`; if not 24, `source ~/.nvm/nvm.sh && nvm use` in the same
  command). In a worktree, use `corepack pnpm` or a `pnpm` shim.
- To regenerate the font files only: `uv` on the PATH (`brew install uv`) and `unzip`.
- For Linux baselines: Docker Desktop running (`docker info`; if it fails, ask Don).

## 1. Font files (only when (re)subsetting)

```sh
node scripts/fonts/subset-inter.ts
git status src/assets/fonts/
```

Expected: the four `Inter-*.woff2` files and `LICENSE.txt`; on an unchanged recipe, no diff
(the subset is byte-deterministic). Sizes about 11.4, 12.3, 11.5 and 12.6 KB.

## 2. Fast checks

```sh
pnpm run test:unit
```

Expected green: font files and recipe (F19, F20), coverage guard (F18), design tokens (F07, F08),
`_headers` rules (F12), astro config fonts block, and the BaseLayout component test (F01 to F05).

## 3. Build

```sh
pnpm run build
ls dist/_astro/fonts/          # exactly four <hash>.woff2 files (F09)
pnpm run test:build            # local-site build test asserts F09 (and F01 to F05 only if they moved there from the component test)
```

## 4. Browser

```sh
pnpm exec playwright test --project=e2e tests/e2e/fonts.spec.ts tests/e2e/headers.spec.ts
pnpm run test:a11y
pnpm run test:budget
```

Expected: faces drawn per F13, same-origin fonts per F14 (each file at most once, no italic face on home), JS-off per F15, blocked fonts per F16,
the font `Cache-Control` per F10 and F11, the CSP unchanged apart from one style hash (F06), and
every budget template at or under 153,600 bytes (150 KB, spec D3) with CLS < 0.1, LCP ≤ 2.5 s
and the long-task and JS limits unchanged (SC-004, F21). Read the `budget` annotations for the
heaviest pages and compare them with research R4: `/writing/convergence/` about 121,654 bytes
plus a few hundred bytes of fallback CSS.

## 5. Visual baselines (all 132)

```sh
pnpm run test:visual:update          # macOS: 66 *-darwin.png
pnpm run test:visual:update:linux    # Docker: 66 *-linux.png
git status tests/e2e/visual.spec.ts-snapshots/   # 132 modified, 0 added, 0 deleted
pnpm run test:visual                  # green on macOS
```

Then push and open the PR **without** the `visual-baselines` label. Expected: the first CI
`verify` run passes the visual project on Linux (SC-001). If it does not, investigate inside
this feature (`fc-match`, the Docker image's fonts, rendering flags) and, failing that, stop and
report the diff to Don. Never commit CI-artifact baselines for this PR.

## 6. Preview check (Don)

On the preview deployment, in both themes at phone and desktop width: home, a post with
italic and bold italic, the projects index and a story. Look at headings, medium-weight labels
(now Regular, each keeping a cue other than weight, FR-017) and semibold labels (now Bold). DevTools Network shows four or fewer
`/_astro/fonts/*.woff2` requests with `immutable`, and a reload shows them served from cache
(SC-009). With the network throttled to slow 4G and the cache disabled, the swap from the
adjusted Arial fallback to Inter shows no visible jump.
