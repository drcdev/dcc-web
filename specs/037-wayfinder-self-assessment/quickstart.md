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
| Scoring, bands, weakest-first low band, link encode/decode, schema, version | `pnpm run test:unit` | data-model rules, [results-link.md](./contracts/results-link.md) grammar, contract rows A1–A3 |
| Components render from data | `pnpm run test:unit` (tests/component/assessment/) | [assessment-data.md](./contracts/assessment-data.md) component table, U2, U18 markup |
| Build errors reach the output with the file name | `pnpm run test:build` | rows A1, A4–A8 on fixture files |
| Script only on the assessment post | `pnpm run test:build` | U16 (output spanning pages) |
| Journeys in a browser | `pnpm run test:e2e` (e2e project) | U3–U15, L1–L7, U19 on the real post found through `tests/helpers/content.ts` |
| Accessibility | `pnpm run test:a11y` | U17 |
| Budget | `pnpm run test:budget` | SC-005 at load and after scrolling to the block |
| Visual | `pnpm run test:visual` | Unchanged: no baseline is touched (see plan "Visual baselines") |

## Manual walk-through (dev server or preview)

1. Open the Wayfinder post. Confirm each shift section still ends with its Practical
   Application paragraph, word for word as before, and that the post ends with its "Printable
   Resources" section.
2. Scroll to the assessment. Press "Show my results" with nothing answered: an error summary
   appears and focus lands on the first statement.
3. Answer all fifteen so two shifts are below the middle. Confirm the chart, the text summary
   (`2.3 of 5, nearer 'From' (...)`), and "Mindsets to develop" listing exactly those two shifts,
   weakest first, each with its score, From → To, Practical Application and link. Follow one: the
   heading is in view and the address bar still shows `#result=...`.
4. Note that the address bar changed to `#result=...` and the Back button does not step
   through results.
5. Press "Print my focus areas": the preview shows only the focus-areas sheet (title, date, the
   two shifts weakest first with their section addresses, the results link) on at most two
   pages of A4 or Letter. Cancel, then use the browser's own Print menu: the same sheet.
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
14. PREVIEW-CHECK (SC-001): take the assessment once without hurrying; it takes under 5 minutes.
15. PREVIEW-CHECK (SC-006 manual part): with a screen reader, trigger the errors, then show
    results; the count, each error and the results are announced, and the text summary says
    everything the chart shows. Print preview reads title, date, mindsets to develop, results link.
16. Open the post without a fragment: the title card shows "Take the self-assessment"; with a
    results link it reads "Your earlier result is below" and nothing on the page jumps.
17. The privacy policy has the paragraph about the self-assessment (FR-016a).

## After release (production only)

- PREVIEW-CHECK (post-release, spec FR-016b): with a results link open on production, open the
  network panel and inspect the Cloudflare Web Analytics beacon request
  (`cloudflareinsights.com/cdn-cgi/rum`). **Pass**: no payload field contains `#`, `result=` or
  any part of the fragment. **Fail**: any field does; the same day, add a Web Analytics rule
  excluding the Wayfinder post's path and open a follow-up issue (research R14).
