# Quickstart: validating the collapsible questions panel

Rules are in [contracts/questions-disclosure.md](./contracts/questions-disclosure.md); state is
in [data-model.md](./data-model.md).

## Prerequisites

- Node from `.nvmrc` (`node -v`; if wrong, `source ~/.nvm/nvm.sh && nvm use` in the same
  command as the toolchain call, per `CLAUDE.md`).
- Check port 4321/4322 are free before Playwright runs (`lsof -i :4321 -i :4322`); sibling
  worktrees share them.

## Automated checks

| Command | Proves |
|---|---|
| `pnpm exec vitest run tests/component/post/QuestionsPanel.test.ts` | Markup: aside `aria-label`, `h2 > button[aria-expanded=false][aria-controls]` with the two exact label lines, aria-hidden chevron, wide heading span, content wrapper id, 022 DOM order inside it, one live region (D01–D04, D10) |
| `pnpm exec playwright test tests/e2e/questions.spec.ts` | Closed on load at 320/390/640/768/1279 px with a 44×44 target, ≤ 5rem at 390 px, first paragraph in the first viewport at 390×844 and 768×1024, open/close by click, Enter and Space with focus kept, no request on open, state kept across close and across 1280 px resizes, no storage and closed on reload, no CSP violation, wide layout unchanged (D01, D05–D08, D11–D14) |
| `pnpm exec playwright test tests/e2e/no-js.spec.ts` | No trigger or panel without JavaScript at 390 and 1280 px (D09) |
| `pnpm exec playwright test --project=a11y` and `tests/e2e/blog-fixture.a11y.spec.ts`, `tests/e2e/blog-forced-colors.spec.ts` | axe closed and open at 390 px in both themes; forced colours on the trigger (D15) |
| `pnpm run test:budget` | JS, LCP and CLS budgets on the post template (D11, D14) |
| `pnpm run test:visual` | Only the eight `post-template-*` images differ, as listed in research R9 |

The full gate (`pnpm run verify`) is run only as the orchestrator's verify phase decides.

## Manual check on the preview (for the PR's `[PREVIEW-CHECK]` list)

1. On a phone (or 390×844 in a browser), open a writing post: one slim "Think while you read /
   Optional AI critical thinking questions" bar under the title card; the article starts on the
   first screen.
2. Tap the bar: the card grows instantly with the sentence and "Get questions"; tap "Get
   questions", then close and reopen the bar: the questions are still there.
3. With VoiceOver (iOS) or TalkBack: the bar is announced as a collapsed/expanded button.
4. Widen a desktop window past 1280 px: the sidebar panel shows "Think while you read", no bar.
5. Turn JavaScript off: no questions area at any width.
