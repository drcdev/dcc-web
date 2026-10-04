# Bug Assessment: Neutral topic pill disappears into its card in dark mode

- **Slug**: neutral-pill-dark-mode
- **Created**: 2026-10-03
- **Source**: GitHub issue #46, "Make the neutral topic pill visible in dark mode" (pasted text; no URL fetched)
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> In dark mode the neutral topic pill has the same background colour as the card it sits on, so
> it disappears and only its text shows. It should keep a visible edge or contrasting fill in dark
> mode, like the other topic pills do. Follow-up from #43.

## Symptom

In dark mode a free-form (neutral, `dusk`) topic pill on a post card, the lead story or the post
title card has fill `dusk-800`, the same token as the card surface, and a transparent border, so
the pill shape is invisible and only its text shows. Expected: the pill keeps a visible boundary
in dark mode, as the six controlled-topic pills do (their fill is a different hue from the card).

## Reproduction

1. Build the fixture site and open `/writing/topics/fixture-cards/` (listing cards),
   `/writing/` (lead story) or `/writing/every-part/` (title card); every fixture post carries the
   free-form topic `fixture-cards`.
2. Switch to the dark theme (`dark` class on `<html>`).
3. Observe the `a[data-free-form]` pill: fill and card are both `dusk-800` (contrast 1.00:1) and
   the border is `transparent`. The committed `listing-cards-*-dark`, `lead-story-*-dark` and
   `post-template-*-dark` baselines show it.

## Suspected Code Paths

- `src/components/post/topic-styles.ts:71` — the `dusk` pill:
  `${pillBase} bg-dusk-100 text-dusk-900 dark:bg-dusk-800 dark:text-dusk-100`. The fix site.
- `src/components/post/topic-styles.ts:22-23` — `pillBase` sets `border border-transparent`
  (kept transparent so the edge appears only in forced-colours mode, FR-051).
- `src/components/post/TopicPill.astro:30` — renders free-form pills with `topicStyle("dusk").pill`
  and `data-free-form`; no change needed.
- Card surfaces, all `dark:bg-dusk-800` (context only, no change):
  `src/components/post/PostCard.astro:39`, `src/components/post/LeadStory.astro:39`,
  `src/layouts/PostLayout.astro:56` (title card, which holds `PostMeta`),
  `src/components/page/HomeIntro.astro:31`.
- `src/styles/global.css:24-35` — `dusk-N` is the `#1c1a29` hue and saturation at lightness
  `100 - N/10` %, so the pill fill and the card fill are the same colour.

## Root Cause Hypothesis

Confidence: **high**. The neutral pill's dark fill `dark:bg-dusk-800` is the same token as every
card surface it is placed on, and the pill has no visible edge in either theme (the border is
transparent outside forced-colours mode). The controlled-topic pills avoid this only because their
`*-900` fills are a different hue from the dusk card (luminance contrast 1.12–1.31:1, but a clear
hue shift); the neutral pill is the one palette that shares the card's hue, so nothing separates
it. PR #43 recorded this as follow-up item 6.

## Proposed Remediation

**Preferred: a dark-mode border, `dark:border-dusk-400`, on the dusk pill only.** Change line 71
to `${pillBase} bg-dusk-100 text-dusk-900 dark:border-dusk-400 dark:bg-dusk-800 dark:text-dusk-100`.
The fill and text stay as they are, so the text contrast and the pill's neutral tone are
unchanged; the light theme is untouched (border stays transparent); and forced-colours behaviour
(FR-051) still holds, because forced-colours mode replaces the border colour with the system
colour whatever it is, so the 1px edge still appears there. Update the `topic-styles.ts` header
comment to record the new rule (the neutral pill's dark edge is at least 3:1 against the card).

Contrast arithmetic (WCAG relative luminance, computed from the `global.css` tokens with the same
method as `tests/unit/content/topics.test.ts`):

| Candidate edge   | vs card `dusk-800` | vs page `dusk-BASE` |
| ---------------- | ------------------ | ------------------- |
| `dusk-700`       | 1.37               | 1.64                |
| `dusk-600`       | 1.91               | 2.28                |
| `dusk-500`       | 2.64               | 3.16                |
| **`dusk-400`**   | **4.00**           | **4.78**            |
| `dusk-300`       | 5.81               | 6.95                |

`dusk-400` is the lightest-weight shade that clears the 3:1 non-text-contrast bar (WCAG 1.4.11)
that the series-marker outline already uses, against both the card and the page background. The
pill fill is `dusk-800` too, so the edge-versus-fill figure is the same 4.00:1. `dusk-500` (the
text-only card border token) is only 2.64:1 and would be faint. `dusk-300` is the dusk series
marker's 2px outline colour; using `dusk-400` at 1px keeps an ordinary pill visibly distinct from
a series marker (which is also told apart by 2px width and semibold weight, FR-016c).

**Alternatives**:

- *Lighter fill (`dark:bg-dusk-700`)*: text `dusk-100` on `dusk-700` is 7.98:1 (passes 4.5:1),
  but the fill is only 1.37:1 against the card, so the pill stays faint. No fill can reach 3:1
  against `dusk-800` and still keep `dusk-100` text at 4.5:1: `dusk-600` gives 1.91:1 against the
  card with text at 5.72:1, and `dusk-500` or lighter would push the text below 4.5:1. It also
  breaks the `theme-tokens.spec.ts` fill probe. Rejected.
- *Border and lighter fill together*: more visual change than the bug needs. Rejected (scope).

**Files likely to change**:

- `src/components/post/topic-styles.ts` (line 71 and the header comment)
- `tests/unit/content/topics.test.ts` (new failing-first test)
- `tests/e2e/theme-tokens.spec.ts` (one `border-top-color` entry on the existing free-form probe)
- `tests/e2e/visual.spec.ts-snapshots/` (predicted dark baselines, see below)

**Tests to add or update**:

- **Primary layer: unit** (`tests/unit/content/topics.test.ts`). It is the cheapest layer that can
  observe the bug (docs/testing.md "Where a test goes"): the bug is a class-string and token
  fact, and the file already computes contrast from `global.css`. Add a describe block mirroring
  "series marker outline" (line ~222): the dusk pill carries a `dark:border-dusk-N` class, and
  that edge has at least 3:1 against the card surface `dusk-800` and against the page surface
  `dusk-BASE`. Today the dusk pill has no dark border class (only `border-transparent`), so the
  test fails before the fix and passes after it.
- **Second layer, recommended: E2E `tests/e2e/theme-tokens.spec.ts`.** It does not have to change
  for the fix to pass (it pins only the free-form pill's `background-color` and `color`, which a
  border-only fix leaves alone). Add `"border-top-color": ["transparent", "dusk-400"]` to the
  existing "free-form pill" probe (lines 126-130). Reason, which the spec's own header already
  states: only a browser's computed style shows that Tailwind's `dark:` variant actually applies
  the border token, and the unit test reads class strings only. No new probe, no new test.
- Existing `tests/component/post/TopicPill.test.ts` reads classes from the map and is unaffected.
  The existing 4.5:1 text check for "free-form (dusk) pill" is unaffected (fill and text unchanged).

## Risks & Considerations

- **Visual baselines (predicted, not a regression).** Every fixture post carries the free-form
  topic `fixture-cards`, so the dark shots of all three subjects that show a free-form pill change:
  `post-template-{desktop,phone}-dark`, `lead-story-{desktop,phone}-dark` and
  `listing-cards-{desktop,phone}-dark`, darwin and linux each: 12 images. Light shots, the shell,
  not-found, story template, series banner, project rows, contact form and sections do not change.
  Any other diff is a regression to investigate, not a baseline to refresh.
- **Major-change candidate (Principle III).** The fix changes a design-system class map that every
  template using topic pills shares (the visible identity of the neutral pill in dark mode), and it
  refreshes visual baselines. Under "changes the design system ... or visual identity" and "when
  in doubt, treat the change as major", treat it as a major change: auto-merge off, Don checks the
  preview deployment in dark mode.
- **Dusk banner is out of scope.** `topic-styles.ts:73` (`dark:bg-dusk-800`) is used by
  `TopicBanner.astro`, `SeriesBanner.astro` and `SeriesIntro.astro`, which sit on the page
  background (`dusk-BASE`), not on a `dusk-800` card. The banner is a large block whose fill
  differs from the page (1.20:1, same as the controlled pills' order of difference) and whose
  content is a heading and text, so it is not invisible and is not part of this report. Leave it.
- **Dusk series marker** already has a 2px `dark:border-dusk-300` outline; unaffected.
- **Light theme:** the neutral pill's light fill `dusk-100` against a white card is 1.31:1, in line
  with the controlled pills; the report is about dark mode only, so no light change.
- No API, data, security, cost or performance risk.

## Open Questions

None. Judgment calls made in automated mode: border over fill (fill cannot reach 3:1 with legible
text); shade `dusk-400` (lightest that clears 3:1); 3:1 as the bar (matches the series-marker
outline rule); dusk banner left out of scope; theme-tokens probe extended as a second layer.
