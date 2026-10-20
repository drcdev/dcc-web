# Contract: Questions panel disclosure below xl

`src/components/post/QuestionsPanel.astro`. This contract replaces row P20 of
`specs/022-critical-thinking-questions/contracts/questions-panel.md` and changes P07 (heading
and landmark name). Rows P01–P06, P08–P17 and P21–P24 of 022 still hold. Row ids (D01…) are for
test titles.

## Markup (initial, prerendered)

```html
<aside data-questions aria-label="Think while you read"
       class="hidden [.js_&]:block … (card: border, radius, background; padding only from xl)"
       data-slug="…" data-hash="…" data-sticky="…">
  <h2 class="…">
    <button type="button" data-questions-toggle
            aria-expanded="false" aria-controls="questions-content"
            class="… w-full min-h-11 … xl:hidden">
      <span>
        <span class="block …">Think while you read</span>
        <span class="block text-sm …">Optional AI critical thinking questions</span>
      </span>
      <svg aria-hidden="true" focusable="false" class="… (rotated while expanded)">…</svg>
    </button>
    <span class="hidden xl:inline">Think while you read</span>
  </h2>
  <div id="questions-content" data-questions-content
       class="… (hidden below xl unless the toggle is expanded; always shown from xl)">
    <p>Get a few questions to keep in mind while you read this post.</p>
    <!-- unchanged from 022: buttons, status region, list, AI note, in that order -->
  </div>
</aside>
```

Class lists are illustrative; the rules below are the contract.

## Rules

- **D01 Closed on load (FR-001, FR-011)**: below 1280 px with JavaScript on, every page load
  shows only the button; the content wrapper is not displayed; `aria-expanded="false"`.
- **D02 Label (FR-002)**: the button's text is exactly "Think while you read" then "Optional AI
  critical thinking questions" (second line smaller), never changed by script. The chevron is
  `aria-hidden`. No emoji.
- **D03 Name (FR-002, P07 replaced)**: the aside is a complementary landmark named exactly
  "Think while you read" at every width. At 1280 px and wider the `h2` text is exactly "Think
  while you read" with no second line. The post title stays the page's only `h1`.
- **D04 Button (FR-003)**: a native `button` with `type="button"`, `aria-expanded` and
  `aria-controls="questions-content"`; operable by pointer, Enter and Space; the site's focus
  ring (2 px outline, 2 px offset, rust-600, `Highlight` in forced colours); target at least
  44×44 CSS px.
- **D05 Open and close (FR-004)**: activating the button flips `aria-expanded`; when `"true"`
  the content is displayed directly after the heading, when `"false"` it is `display: none`
  (out of sight, the accessibility tree and the focus order). Focus stays on the button.
  No transition or animation; only the chevron's orientation changes.
- **D06 No side effects (FR-005)**: opening or closing sends no request and does not change the
  status text, list, buttons or `busy` flag. A request in flight when the panel closes completes
  and its result is shown on reopen. If it moves focus to "New questions" while the panel is
  closed, the call has no effect and focus is not lost.
- **D07 Wide layout (FR-006)**: at 1280 px and wider the button is `display: none` (not
  focusable), the plain heading span and the content are shown, and P21/P21a placement and
  sticky behaviour are unchanged.
- **D08 Crossing 1280 px (FR-007)**: no script runs on resize for the disclosure; the attribute
  is untouched, so the small layout restores the reader's last choice and the panel state is
  kept. No focus is moved on resize; a focused control inside the content keeps focus.
- **D09 JavaScript off (FR-008, P05)**: the aside stays `hidden` without the `js` root class;
  no button in the questions area is displayed or focusable at any width.
- **D10 Live region (FR-009)**: one status region (P08), inside the content. It is not
  announced while the panel is closed; its current text is shown on reopen.
- **D11 No shift (FR-010)**: the closed bar's size comes from prerendered HTML and CSS only; the
  module script changes nothing visible on load. CLS attributable to the panel is 0 at 390×844
  and 1280×800.
- **D12 Size (SC-002)**: at 390 px wide with default text, the closed aside's border box is at
  most 5rem (80 px) tall.
- **D13 Reading start (SC-001)**: on the fixture post at 390×844 and 768×1024 the top of the
  first body paragraph is inside the first viewport.
- **D14 CSP and budget (FR-012)**: the script sets attributes only (no `style`), adds no inline
  script and no request; the post template stays within the JS (10 KB), LCP and CLS budgets.
- **D15 Accessibility (FR-013)**: axe (WCAG 2.2 AA tags) passes with the panel closed and open
  at 390 px in both themes; in forced colours the card border, chevron and focus ring stay
  visible; text-spacing overrides grow the bar without clipping; no sideways scroll at 320 px,
  390 px and 1279 px, nor at 640 px (200% zoom of 1280).
