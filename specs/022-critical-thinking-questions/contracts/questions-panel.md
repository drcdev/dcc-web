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
  <p role="status" aria-live="polite" data-questions-status></p>
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
  reads normally (FR-011, spec edge case "JavaScript off": not shown at all).
- P06: only writing post pages ship the panel script (FR-011); the post template stays within
  the budget (JS ≤ 10 KB, LCP, CLS) and its CSP is unchanged (`connect-src 'self'` is enough).
  The panel adds no unhashed inline script, no `style` attribute and no inline style set from
  script (the CSP blocks them); state changes toggle classes and `hidden` only.
- P07: the panel is a complementary landmark (`aside` named by its `h2`). The `h2` fits the
  outline: the post title is the page's only `h1` (FR-010).
- P08: the status region is in the prerendered DOM, empty, from page load, so the first
  announcement is not lost. It is the panel's only live region; it is visible (not
  screen-reader-only), and its text is the state's message in the table below, so what is
  spoken is what is shown. No `aria-busy` is used: on an ancestor of the live region it would
  suppress the very announcement the loading state needs.
- P09: DOM order inside the panel is heading, sentence, button(s), status, list, AI note, so the
  AI note is read straight after the list (FR-006).

## States

| State | Visible | Status (live region) text | Focus |
|---|---|---|---|
| Idle | heading, sentence, "Get questions" | empty | unchanged |
| Loading | "Get questions" (or "New questions") marked `aria-disabled="true"` (not the `disabled` attribute, so it keeps focus and stays in the tab order; presses are ignored) | "Getting questions..." (three ASCII dots) | stays on the pressed button; the reader can Tab on into the article meanwhile |
| Ready | numbered list of 2–4 questions, AI note, "New questions" (Get button removed) | "Questions are ready." | moves to "New questions" if it was on "Get questions"; otherwise unchanged |
| Ready again ("New questions") | the list's items are replaced in place by the fresh set; AI note and "New questions" stay | "New questions are ready." | stays on "New questions" |
| Limited (429) | message: "Questions are unavailable for now because today's limit has been reached. Try again in about {n} minutes." ("about {n} hours" when over 90 minutes) and the previous button, available again | same message | stays on the pressed button |
| Stale (404 `stale`) | "This post has changed since the page loaded. Reload the page to get questions." | same | stays on the pressed button |
| Error (503, 404 `not_found`, network, other) | "Questions could not be loaded. Try again." and the button available again | same | stays on the pressed button |

The previous questions (if any) stay visible in the limited, stale and error states after a
"New questions" press. Every state is conveyed by its text, never by colour alone.

- P10: pressing "Get questions" sends `{ slug, hash, fresh: false }`; "New questions" sends
  `fresh: true` (FR-016).
- P11: while loading, a second press sends nothing (FR-005).
- P12: the list shows exactly the strings returned, as text (never HTML), in an `<ol>` (FR-003).
- P13: the AI note is visible whenever questions are (FR-006).
- P14: copy is the plain-language text above (FR-007); errors reveal nothing internal.
- P15: on 429 the message uses `retryAfter` (seconds): `n = max(1, ceil(retryAfter / 60))`
  minutes; if that is over 90, `n = ceil(retryAfter / 3600)` hours. "1 minute" and "1 hour"
  are singular. The time shown is never earlier than `retryAfter` and at most one unit later.
  (At the default 60 a day one token refills every 1,440 s; a refused "New questions" can wait
  for up to about 8.4 hours, so the hours form is reachable.)
- P16: a client-side guard shows at most 4 items and treats fewer than 2 as an error, so a
  wrong server answer cannot break SC-002. The guard checks only a subset of the server
  validator's rules (each item a non-empty string of at most 200 characters ending in "?"), so
  anything the server accepts the client displays; the two cannot disagree about a valid set.
- P17: on error, a reader may retry at once; there is no client back-off (a failed attempt is
  refunded server-side, FR-020a).

## Placement (research R11)

- P20: below 1280 px (`xl`), the panel is a block between the title card and the body, at most
  the reading column's width; no horizontal scroll at 320, 390 and 1280 px (FR-008).
- P21: at 1280 px and wider, the panel sits to the right of the body in the article's grid,
  `position: sticky; top: 1rem`; while scrolling the body it stays in view and its box never
  intersects the body text, the header or the footer (FR-009). It stops at the end of the body.
  Its top aligns with the top of the body. Because it occupies its own grid column it cannot
  cover a focused element in the body (WCAG 2.4.11). Wide and full-width figures in the body
  expand to the body column's edges at this width, never past the window or under the panel.
- P21a: the panel is sticky only while its box fits the viewport (`max-height` never set, no
  inner scrollbar). Sticky positioning applies under `@media (min-width: 1280px) and
  (min-height: 40rem)`; in addition the script removes the sticky class whenever the panel's
  height exceeds `innerHeight − 2rem` (checked after each state change and on resize), so a
  ready panel with 4 questions at large text sizes scrolls with the page instead of being
  clipped. E2E checks it at 1280×600 with 4 questions: every panel element can be scrolled
  into view.
- P21b: zoom: the breakpoint is in CSS px, so 200% zoom on a 1280 px window and 400% zoom
  (320 CSS px) give the block layout of P20 with no horizontal scroll (WCAG 1.4.10). The panel
  sets no fixed heights or widths in `px` on text containers, so text-spacing overrides
  (WCAG 1.4.12) grow it without clipping.
- P22: light and dark themes use the site's tokens (dusk/mist/rust, as the title card); WCAG 2.2
  AA contrast in both themes and both layouts and every state: text ≥ 4.5:1 (including the
  `aria-disabled` button's label and the limit, stale and error messages), button borders and
  the focus indicator ≥ 3:1 against adjacent colours. Both buttons use the site's existing
  focus ring (2 px outline, 2 px offset) and have a target of at least 24×24 CSS px (WCAG 2.5.8)
  (FR-012). No animation, spinner or scroll-linked effect; any future transition is disabled
  under `prefers-reduced-motion: reduce`.
- P23: forced-colours mode keeps the panel border, button outlines and focus indicator visible,
  using system colours (`ButtonText`/`ButtonFace` for buttons, `Highlight` for focus) with no
  author colour carrying state (as the existing `blog-forced-colors.spec.ts` checks for the post
  template).
- P24: accessibility scans (axe, WCAG 2.2 AA tags) run on the panel in the idle state (template
  scan) and in the ready, limited and error states after a stubbed `/api/questions` response,
  in both themes (FR-012a).
