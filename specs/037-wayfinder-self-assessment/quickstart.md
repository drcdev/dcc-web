# Quickstart: validating the Wayfinder self-assessment

**Feature**: `037-wayfinder-self-assessment` | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Follow `CLAUDE.md` "Local toolchain": check `node -v` against `.nvmrc`, and run
  `source ~/.nvm/nvm.sh && nvm use` in the same command as any `pnpm` call.
- In an agent shell, run the gate as the verify notes in `CLAUDE.md` describe
  (`ASTRO_PREVIEW_BACKGROUND=1`, bounded with `perl -e 'alarm N; exec @ARGV'`), and ask before a
  full `pnpm run verify`.

## Automated checks

| What | Command | Proves |
|------|---------|--------|
| Scoring, bands, plan order, link encode/decode, schema, version | `pnpm run test:unit` | data-model rules, [results-link.md](./contracts/results-link.md) grammar, contract rows A1–A3 |
| Components render from data | `pnpm run test:unit` (tests/component/assessment/) | [assessment-data.md](./contracts/assessment-data.md) component table, U2, U18 markup |
| Build errors reach the output with the file name | `pnpm run test:build` | rows A1, A4–A8 on fixture files |
| Script only on the assessment post | `pnpm run test:build` | U16 (output spanning pages) |
| Journeys in a browser | `pnpm run test:e2e` (e2e project) | U3–U15, L1–L7, U19 on the real post found through `tests/helpers/content.ts` |
| Accessibility | `pnpm run test:a11y` | U17 |
| Budget | `pnpm run test:budget` | SC-005 at load and after scrolling to the block |
| Visual | `pnpm run test:visual` | Unchanged: no baseline is touched (see plan "Visual baselines") |

## Manual walk-through (dev server or preview)

1. Open the Wayfinder post. Confirm each shift section still ends with its Practical
   Application paragraph and the 6-Week Development Plan still lists six weeks, word for word
   as before.
2. Scroll to the assessment. Press "Show my results" with nothing answered: an error summary
   appears and focus lands on the first statement.
3. Answer all fifteen so two shifts are below the middle. Confirm the chart, the text summary
   (`2.3 of 5, nearer 'From' (...)`), and links for exactly those two shifts. Follow one: the
   heading is in view and the address bar still shows `#result=...`.
4. Note that the address bar changed to `#result=...` and the Back button does not step
   through results.
5. Press "Print my plan": the preview shows only the plan (six weeks, lowest score first, date,
   positions, link) on at most two pages. Cancel, then use the browser's own Print menu: the
   same plan.
6. Copy the results link, open it in a private window: the page opens at the top with "Your
   earlier result is below"; following it shows the earlier result marked with its date and an
   empty form.
7. Retake with different answers: both markers per shift, told apart by shape; the summary
   states the change per shift.
8. Edit one statement's wording in `src/content/assessments/wayfinder.yaml` locally (do not
   commit), rebuild, and reopen the old link: the earlier result shows on its own, marked "made
   with an earlier set of questions"; a retake is shown separately.
9. Change the link by hand (`...-16`): the page says the link could not be read and nothing
   breaks.
10. "Clear my answers": everything resets and the fragment is gone.
11. Turn JavaScript off: the post reads in full and the assessment shows the note and the
    statement list. Print it: statements, not an empty form.
12. Open DevTools Network while doing steps 3–10: no request is made.
13. Check at 320 px wide and in dark mode: no sideways scrolling; chart and scales legible.

## After release (production only)

- With a results link open on production, inspect the Cloudflare Web Analytics beacon request
  and confirm the `#result=` fragment is not in its payload (research R14).
