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
    <p role="status" aria-live="polite" data-career-status hidden></p>
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
- Print: every `<details>` content shows, no step is muted (no tint, dashed rule or compact row), no item is highlighted, and the
  filter and status line are hidden (FR-018; `print:details-content:block` as in
  `SelfAssessment.astro`).

## Client behaviour (`<career-timeline>` custom element)

- On connect: attach the listeners first, then un-hide the filter group and the status line and
  set `data-ready`, so a script that fails leaves the no-JS page (FR-014). The status line is
  served empty and stays empty on connect; text is written only on a filter change, so nothing
  is announced on load (FR-013).
- Choose category K: pressed state moves to K; each `li` whose `data-categories` holds K gets
  `details.open = true` and its items in `ul[data-list=K]` get `data-match`; every other `li` gets
  `data-muted` and `details.open = false`; the status line reads "M of N roles have k." or,
  when M is 1, "1 of N roles has k." (k in lower case) (FR-010, FR-011, FR-013).
- Choose All: remove every `data-muted` and `data-match`, close every `details` (hand-opened
  ones too), status "Showing all N roles." (FR-012).
- Every change is applied to every step, ignoring earlier hand opening or closing (FR-012a).
  Pressing the already-pressed button does nothing (no status write).
- Focus stays on the pressed button. If `document.activeElement` is inside a step's detail that
  the change closes, focus moves to that step's `<summary>` first (FR-013a, FR-013b). Never
  scrolls.
- A muted step stays openable; opening it does not clear `data-muted`.
- No animation at all. Any transition added later is `motion-safe:` only (FR-015).
- Writes nothing to the address, storage or cookies.

## Styling contract

- Disclosure marker (spec FR-007b): the marker renders on the same line as the first line of
  `[data-step-role]`, at every width and in every state, JavaScript on or off; nothing in the
  summary puts the role on a line below the marker. The marker is not text in the accessible
  name. Organization and period may follow on later lines (except Variant B's muted one-liner).
- `li[data-muted]` (spec FR-011, FR-011a; one of the two variants ships, never both, never a
  runtime switch). No background image, no pattern, no `opacity`; all text at AA contrast
  against the solid colour behind it, in both themes. `print`: no muting.
  - **Variant A, "Muted + side rule"**: the muted step's row has a soft solid muted tint and a
    faint dashed left timeline rule (at least 3:1 against the page background); text keeps its
    normal colour. `li:not([data-muted])` while a category is chosen (a matching step) has a
    solid accent left rule. `forced-colors`: the tint drops; the dashed rule stays in
    `CanvasText`, the solid rule stays solid.
  - **Variant B, "Compact one-line rows"**: the muted step's summary lays out marker, role,
    organization and period on one line in a smaller text size and a muted text token that
    still meets 4.5:1; no background. Matching steps stay full size. The line wraps rather than
    clips or scrolls at 320 px and 200% text zoom. Opened, the step's detail shows at full size.
    `forced-colors`: the size and layout change stays.
- `summary:focus-visible` gets the same outline as `a:focus-visible` and `button:focus-visible`
  in `global.css` (including the forced-colours rule); the muted treatment and highlight never cover it.
- Summaries and filter buttons are at least 24 x 24 CSS px; the filter row wraps; links are
  underlined.
- Item `ul[data-list] > li[data-match]`: rust left border, bold, light tint, in both themes.
- One column at every width; nothing overflows at 320 px or 400% zoom (FR-017).
- No inline `style` attributes (CSP, FR-017a).
