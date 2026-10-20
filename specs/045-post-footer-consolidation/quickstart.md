# Quickstart: checking the post footer block

## Prerequisites

- Node from `.nvmrc` (see CLAUDE.md "Local toolchain"); in an agent shell use the wrapper script
  with the pnpm shim.
- Docker Desktop running only for the Linux visual baselines
  (`.claude/skills/_shared/visual-baselines.md`).

## Automated checks

| What | Command | Expect |
|------|---------|--------|
| Component markup and order (F1 to F4) | `pnpm vitest run tests/component/post` | green |
| Build: one block per post page, none elsewhere (F1) | `pnpm vitest run tests/build/blog-listing.test.ts` | green |
| Layout, edges, gaps, divider spacing (F5 to F8, F11) | `pnpm exec playwright test tests/e2e/blog.spec.ts` | green |
| Forced colours (F12) | `pnpm exec playwright test tests/e2e/blog-forced-colors.spec.ts` | green |
| Axe and targets, both themes (F9, FR-016) | `pnpm exec playwright test tests/e2e/blog.a11y.spec.ts` | no violations |
| Post template look | `pnpm run test:visual` | only `post-template-*` differ before refresh |
| Gate for the changed paths | `scripts/ci/changed-paths.ts --base origin/main` tier | green |

Refresh the eight `post-template-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png` baselines
per `.claude/skills/_shared/visual-baselines.md`; any other baseline diff is a regression.

## Manual check (preview, for the PR's `[PREVIEW-CHECK]` list)

1. Open a Drift post, a Convergence post and a post in no series, light and dark, at 375 px and
   1440 px. One box after the text; author part, small grey italic views note, thin line, share
   part; no gradient box; Related posts after an even gap.
2. Tab through the block: three author links, then the share links (and Share on a phone).
3. Turn on forced colours (Windows high contrast or Chrome emulation): box edge, divider, note and
   links all visible.
4. 200% text zoom at 320 px: nothing scrolls sideways; long lines wrap.
