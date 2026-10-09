# Review report: readiness-hidden-pages (cutover plan stage 1a)

Written by the orchestrator from the review subagent's returned text (the subagent could not write
this file).

## Summary

All five work items are done as planned and nothing beyond them. `git diff --name-only main` matches
the plan's allowed list; nothing under `src/`, `public/`, `.github/` or `.claude/` changed, and the
cutover plan diff is the single 1a tick. `vitest run tests/unit/setup tests/unit/setup-check` passes
(51 files, 650 tests). New tests are unit tests with fixture slugs only. No pipeline skill or
`_shared` file changed. Principle III verdict (not major) holds against the real diff.

No check is weakened:

- A scratch run against the real files with `work-with-me` set to `visible: true` and `draft: true`
  still reports `missing` ("work-with-me: page is still a draft").
- With main's config, the branch check is `complete` through the hidden rule alone.
- Dropping `/work-with-me/` from `expectedPaths` loses nothing before #122: the build sitemap test
  already skips draft addresses, and `getPages()` leaves `visible: false` pages out of the production
  sitemap, so keeping the path would make item 29 (`live-sitemap`) fail on switch day.

## Acceptance

| # | Criterion | Result |
|---|---|---|
| 1 | New cases red before W2 | Cases 1, 4 and 5 red; case 2 cannot be (LOW-1) |
| 2 | Draft-but-visible expected page still fails | Existing case, new case and real-file scratch all report the draft |
| 3 | Real check complete | Yes |
| 4 | Hidden rule alone gives complete with main's config | Yes |
| 5 | Doc and setup guards green with no edits | Yes; `indexing.test.ts` needs a build, left to the gate |
| 6 | Diff scope exact | Yes |
| 7 | One-line cutover tick | Yes |
| 8 | Verify gate | Run by the orchestrator |

## Measurement

`node scripts/setup-check/cli.ts --item launch-content-ready`

- Before (main): `[!] missing  Step 25 of 31  Launch content ready; work-with-me: page is still a draft`
- After (branch): `[x] complete  Step 25 of 31  Launch content ready` (exit 0)
- `expectedPages` 7 → 6, `expectedPaths` 9 → 8.

## Findings

0 CRITICAL, 0 HIGH, 4 LOW.

- **LOW-1** `plan.md` (W1) says case 2 (`visible: false`, `draft: false`) must fail before W2, but
  it passes on main's check too. No change needed.
- **LOW-2** `setup/config.json`: dropping `work-with-me` from `expectedPages` is redundant with the
  hidden rule; keeping it would let item 25 catch a #122 change that sets `visible: true` but leaves
  `draft: true`. Cutover box 1a mandated the drop.
- **LOW-3** `docs/launch.md` L2 gave Work with me as an example of a hidden listed page, though it is
  no longer listed. **Fixed** by the orchestrator.
- **LOW-4** `docs/launch.md` L2 "How to confirm" assumed a pull request although "What to do" says
  none may be needed. **Fixed** by the orchestrator.

## Follow-ups for the PR body

- When #122 publishes Work with me, add `work-with-me` back to `launch.expectedPages` and
  `/work-with-me/` back to `launch.expectedPaths`.
- Stage 1b (Ghost 301s, `/tweak`) must also merge before Part A of the walkthrough.
- Out of scope, already on main: the comment at `tests/build/indexing.test.ts:203-204` says
  "setup item 26" but means item 25 (`launch-content-ready`).
