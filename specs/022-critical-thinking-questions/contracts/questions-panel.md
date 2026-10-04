# Contract: Questions panel on the post template

`src/components/post/QuestionsPanel.astro`, rendered by `src/layouts/PostLayout.astro` only
(FR-001), with one processed `<script>` (research R10). Row ids (P01…) are for test titles.

## Markup (initial, prerendered)

```html
<aside data-questions class="… hidden [.js_&]:block …"
       aria-labelledby="questions-heading"
       data-slug="some-post" data-hash="<64 hex>">
  <h2 id="questions-heading">Think before you read</h2>
  <p>Get a few questions to keep in mind while you read this post.</p>
  <button type="button" data-questions-get>Get questions</button>
  <p role="status" aria-live="polite" data-questions-status class="sr-only…"></p>
  <!-- filled by the script: -->
  <ol data-questions-list hidden></ol>
  <p data-questions-note hidden>These questions were written by an AI model from the post text. They may be imperfect.</p>
  <button type="button" data-questions-new hidden>New questions</button>
</aside>
```

- P01: every writing post page has exactly one `[data-questions]`; pages, project stories,
  listings, series and topic pages have none (FR-001).
- P02: `data-slug` equals the post slug and `data-hash` equals the `hash` in that post's
  `/writing/<slug>/question-source.json`.
- P03: in the DOM and focus order the panel follows the title card and precedes
  `[data-post-body]` (FR-010).
- P04: no request to `/api/questions` is made on load (FR-002).
- P05: with JavaScript off the panel is not displayed and no button is reachable; the article
  reads normally (FR-011, spec edge case).
- P06: only writing post pages ship the panel script (FR-011); the post template stays within
  the budget (JS ≤ 10 KB, LCP, CLS) and its CSP is unchanged (`connect-src 'self'`).

## States

| State | Visible | Live region text | Focus |
|---|---|---|---|
| Idle | heading, sentence, "Get questions" | empty | unchanged |
| Loading | "Get questions" (or "New questions") disabled, `aria-busy="true"` on the panel | "Getting questions…" | stays on the disabled button |
| Ready | numbered list of 2–4 questions, AI note, "New questions" (Get button removed) | "Questions are ready." | moves to "New questions" if it was on "Get questions" |
| Limited (429) | message: "Questions are unavailable for now because today's limit has been reached. Try again in about {n} minutes." ("about {n} hours" when over 90 minutes) and the previous button | same message | unchanged |
| Stale (404 `stale`) | "This post has changed since the page loaded. Reload the page to get questions." | same | unchanged |
| Error (503, 404 `not_found`, network, other) | "Questions could not be loaded. Try again." and the button enabled again | same | unchanged |

- P10: pressing "Get questions" sends `{ slug, hash, fresh: false }`; "New questions" sends
  `fresh: true` (FR-016).
- P11: while loading, a second press sends nothing (FR-005).
- P12: the list shows exactly the strings returned, as text (never HTML), in an `<ol>` (FR-003).
- P13: the AI note is visible whenever questions are (FR-006).
- P14: copy is the plain-language text above (FR-007); errors reveal nothing internal.
- P15: on 429 the message uses `retryAfter`, rounded up to minutes or hours.
- P16: a client-side guard shows at most 4 items and treats fewer than 2 as an error, so a
  wrong server answer cannot break SC-002.

## Placement (research R11)

- P20: below 1280 px (`xl`), the panel is a block between the title card and the body, at most
  the reading column's width; no horizontal scroll at 320, 390 and 1280 px (FR-008).
- P21: at 1280 px and wider, the panel sits to the right of the body in the article's grid,
  `position: sticky; top: 1rem`; while scrolling the body it stays in view and its box never
  intersects the body text, the header or the footer (FR-009). It stops at the end of the body.
- P22: light and dark themes use the site's tokens (dusk/mist/rust, as the title card); WCAG 2.2
  AA contrast in both themes and both layouts, visible focus ring on both buttons (FR-012).
- P23: forced-colours mode keeps borders and button outlines visible (as the existing
  `blog-forced-colors.spec.ts` checks for the post template).
