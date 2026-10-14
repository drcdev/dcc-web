# Contract: `<CareerTimeline />` markup and behaviour

The rendered HTML the tests and the client script rely on. Classes are free; the elements, roles,
`data-*` hooks and order below are the contract.

## Server-rendered (JavaScript off sees exactly this, minus the hidden parts)

```html
<section aria-labelledby="career-heading" data-career class="not-prose …">
  <h3 id="career-heading">Career</h3>
  <career-timeline data-total="6">
    <div role="group" aria-labelledby="career-filter-label" data-career-filter hidden>
      <p id="career-filter-label">Show</p>
      <button type="button" aria-pressed="true" data-category-all>All</button>
      <button type="button" aria-pressed="false" data-category="achievements">Achievements</button>
      <!-- one button per used category, fixed order: achievements, leadership, awards -->
    </div>
    <p role="status" aria-live="polite" data-career-status hidden>Showing all 6 roles.</p>
    <ol data-career-steps>
      <li data-step="<id>" data-categories="achievements|leadership">
        <details>
          <summary>
            <span data-step-role>Role</span>
            <span data-step-org>Organization</span>
            <span data-step-period><time datetime="2016-09">Sep 2016</time> <span aria-hidden="true">–</span><span class="sr-only">to</span> <time datetime="2022-01">Jan 2022</time></span>
          </summary>
          <div data-step-detail>
            <dl>
              <dt>Scope</dt><dd>…</dd>
              <!-- then, only when present, in this order:
                   Key decision · What changed in how I worked · What I wish I'd known ·
                   The skill that led to the next move (never on the last step) -->
            </dl>
            <h4>Achievements</h4><ul data-list="achievements"><li>…</li></ul>
            <h4>Leadership</h4><ul data-list="leadership"><li>…</li></ul>
            <h4>Writing</h4><ul data-list="posts"><li><a href="/writing/<slug>/">Title</a></li></ul>
            <h4>Awards</h4><ul data-list="awards"><li><a href="…">Name</a> (2024)</li><li>Name (2026)</li></ul>
          </div>
        </details>
      </li>
    </ol>
  </career-timeline>
</section>
```

Rules:

- Steps in start order; the last is the current role (FR-001). Every `<details>` starts closed
  (FR-007). A period still running ends with the word `present`, not a `<time>`.
- A part, list or heading with no content is not rendered (FR-003, FR-008, US2 scenario 3).
- An award without `href` is plain text (FR-008).
- Without steps the whole `<section>` renders nothing. With steps but no used category, the filter
  group and the status line are not rendered.
- Text from step files is rendered as text (Astro expressions), never with `set:html`.
- The period's dash is `aria-hidden` and followed by visually hidden "to" (spec FR-002).
- Print: every `<details>` content shows, no step is dithered, no item is highlighted, and the
  filter and status line are hidden (FR-018; `print:details-content:block` as in
  `SelfAssessment.astro`).

## Client behaviour (`<career-timeline>` custom element)

- On connect: attach the listeners first, then un-hide the filter group and the status line and
  set `data-ready`, so a script that fails leaves the no-JS page (FR-014). Setting the status
  text on connect is not an announcement (the status is hidden until then).
- Choose category K: pressed state moves to K; each `li` whose `data-categories` holds K gets
  `details.open = true` and its items in `ul[data-list=K]` get `data-match`; every other `li` gets
  `data-dithered` and `details.open = false`; the status line reads "M of N roles have k." or,
  when M is 1, "1 of N roles has k." (k in lower case) (FR-010, FR-011, FR-013).
- Choose All: remove every `data-dithered` and `data-match`, close every `details` (hand-opened
  ones too), status "Showing all N roles." (FR-012).
- Every change is applied to every step, ignoring earlier hand opening or closing (FR-012a).
  Pressing the already-pressed button does nothing (no status write).
- Focus stays on the pressed button. If `document.activeElement` is inside a step's detail that
  the change closes, focus moves to that step's `<summary>` first (FR-013a, FR-013b). Never
  scrolls.
- A dithered step stays openable; opening it does not clear `data-dithered`.
- No animation at all. Any transition added later is `motion-safe:` only (FR-015).
- Writes nothing to the address, storage or cookies.

## Styling contract

- `li[data-dithered] summary`: dot pattern (CSS `radial-gradient` background) whose dots have at
  least 3:1 contrast with the page background in each theme, summary text on a solid backing of
  the page colour, role drops from bold to medium. `forced-colors`: dashed `CanvasText` border
  instead of the pattern. `print`: no background image.
- `summary:focus-visible` gets the same outline as `a:focus-visible` and `button:focus-visible`
  in `global.css` (including the forced-colours rule); the dither and highlight never cover it.
- Summaries and filter buttons are at least 24 x 24 CSS px; the filter row wraps; links are
  underlined.
- Item `ul[data-list] > li[data-match]`: rust left border, bold, light tint, in both themes.
- One column at every width; nothing overflows at 320 px or 400% zoom (FR-017).
- No inline `style` attributes (CSP, FR-017a).
