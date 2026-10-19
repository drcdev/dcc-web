# Quickstart: validating previous, next and index links on project stories

Run every command with the Node version from `.nvmrc` (see CLAUDE.md, Local toolchain).

## Automated checks

| What | Command | Expected |
|---|---|---|
| Neighbour rules | `pnpm exec vitest run tests/unit/content/project-order.test.ts` | `neighbours` cases pass: first has no previous, last has no next, single has neither, no wrap-around |
| Block markup | `pnpm exec vitest run tests/component/project/StoryNav.test.ts` | `nav` labelled "Projects", links in order previous / All projects / next, missing side not rendered, no status, no script |
| Draft exclusion | `pnpm exec vitest run --project build tests/build/drafts.test.ts` | Production: no story links to `/projects/draft/`. Preview: `minimal`'s previous is the draft |
| Fixture journey | `pnpm exec playwright test tests/e2e/projects-fixtures.spec.ts` | Next from `draft` walks `minimal`, `every-part`, `every-setting`, `retired`; ends have no missing-side link; 390 px stacks full width, targets at least 44 x 44, no horizontal scroll |
| Accessibility | `pnpm run test:a11y` | No new violations on the fixture stories or the real story template |
| Pixels | `pnpm run test:visual` | `story-template-*` matches the refreshed baselines (macOS here; Linux via `pnpm run test:visual:update:linux` with Docker, see `.claude/skills/_shared/visual-baselines.md`) |

## By hand (preview deployment or `pnpm run dev`)

1. Open a middle project story and scroll to the end: "← Previous: <title>", "All projects",
   "Next: <title> →" sit after the invitation.
2. Follow Next until the last project; compare each step with the order on `/projects/`.
   The last story has no Next link; the first has no Previous link.
3. Tab through the block: focus moves previous, All projects, next, each with a visible outline.
4. Narrow the window below 640 px: the links stack as full-width rows; a long title wraps.
5. Turn JavaScript off and repeat step 2: the links still work.
