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
            <span data-step-period><time datetime="2016-09">Sep 2016</time> – <time datetime="2022-01">Jan 2022</time></span>
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
- Without steps the whole `<section>` renders nothing.
- Print: every `<details>` content shows and no step is dithered (FR-018; `print:details-content:block`
  as in `SelfAssessment.astro`).

## Client behaviour (`<career-timeline>` custom element)

- On connect: un-hide the filter group and the status line; set `data-ready`.
- Choose category K: pressed state moves to K; each `li` whose `data-categories` holds K gets
  `details.open = true` and its items in `ul[data-list=K]` get `data-match`; every other `li` gets
  `data-dithered` and `details.open = false`; the status line reads "M of N roles have K."
  (FR-010, FR-011, FR-013).
- Choose All: remove every `data-dithered` and `data-match`, close every `details`, status
  "Showing all N roles." (FR-012).
- A dithered step stays openable; opening it does not clear `data-dithered`.
- No animation. Any transition added later is `motion-safe:` only (FR-015).
- Writes nothing to the address, storage or cookies.

## Styling contract

- `li[data-dithered] summary`: dot pattern (CSS `radial-gradient` background), summary text on a
  solid backing of the page colour, role drops from bold to medium. `forced-colors`: dashed
  `CanvasText` border instead of the pattern. `print`: no background image.
- Item `ul[data-list] > li[data-match]`: rust left border, bold, light tint, in both themes.
- One column at every width; nothing overflows at 320 px (FR-017).
