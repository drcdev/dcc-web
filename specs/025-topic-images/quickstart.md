# Quickstart: validating series images and dark-mode outlines

**Feature**: `025-topic-images` | Contract: [contracts/series-cards.md](./contracts/series-cards.md)

All toolchain commands follow `CLAUDE.md` "Local toolchain" (node from `.nvmrc`; in an agent
worktree, the job's `run.sh` wrapper). Ask Don before the full `pnpm run verify` gate.

## 1. Bring the images in (implementation, once)

Re-encode the two sources through sharp into `src/assets/series/` (lossless PNG, no metadata),
then confirm: each file is 1536 × 768 and sharp's metadata reports no EXIF, ICC or XMP.

## 2. Fast checks

| Run | Expect |
|---|---|
| `pnpm exec vitest run --project unit tests/unit/content/topics.test.ts tests/unit/content/series-images.test.ts` | Map covers exactly the series; images 2:1; every new dark outline ≥ 3:1 against `dusk-BASE`. |
| `pnpm exec vitest run --project unit tests/component/post` | Tile and banner markup per the contract; page 2 banner has the strip; `TopicBanner` has no image; card edges use `dusk-500` in dark. |
| `pnpm exec vitest run --project build tests/build/blog-listing.test.ts` | Strip candidates 4:1; each series WebP ≤ 25 KB; topic page has no series image. |

## 3. Browser checks (fixture site, port 4322)

| Run | Expect |
|---|---|
| `pnpm exec playwright test --project sections tests/e2e/blog-fixtures.spec.ts` | Tile image spans the tile at 2:1; strip ≈ 4:1, banner-wide, flush; no horizontal scroll at 320 px. |
| `pnpm exec playwright test --project e2e tests/e2e/theme-tokens.spec.ts tests/e2e/blog-forced-colors.spec.ts` | Dark outline colours per the contract; light unchanged; edges visible in forced colours. |
| `pnpm exec playwright test --project a11y` | No new axe violations on `/writing/`, series and topic pages. |
| `pnpm run test:budget` | `writing-landing`, `writing-series-drift`, `writing-series-convergence` pass; record their `totalBytes` and LCP in the PR. |

## 4. Visual baselines

Refresh per `.claude/skills/_shared/visual-baselines.md` (macOS locally, Linux via Docker or the
`visual-baselines` label). Expected diffs only: `series-banner-*` (4 per platform: both widths, light
and dark, because of the strip), `lead-story-{phone,desktop}-dark` and
`listing-cards-{phone,desktop}-dark` (outline colour, 2 each per platform), and the new
`series-intro-*` subject (4 per platform). Any light `lead-story` or `listing-cards` diff is a
regression. Any other changed baseline is a regression.

## 5. Look at it (preview deployment)

`/writing/`, `/writing/drift/`, `/writing/convergence/`, `/writing/drift/2/` if it exists, and
`/writing/topics/technology-teams/`, in light and dark, at phone and desktop width.
