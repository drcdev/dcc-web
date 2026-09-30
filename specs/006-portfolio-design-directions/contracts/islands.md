# Contract: interactive islands

Both islands are custom elements defined in a processed `<script>` in their `.astro`
component (Astro bundles and CSP-hashes them). Content is complete in the HTML before any
script runs. Together with the site's own scripts, a prototype page must stay under the 10 KB
JavaScript budget.

## `<portfolio-filter>` (all directions, index page)

Markup before script:

- A `<div role="group" aria-labelledby="filter-label">` of theme controls with classes
  `hidden js:flex` (hidden without JavaScript), each a `<button type="button"
  aria-pressed="false" data-theme="<theme>">`, plus an "All projects" button with
  `aria-pressed="true"`.
- The entry list, each entry with `data-themes`.
- A `<p role="status" aria-live="polite" class="hidden js:block">` that reads "Showing all 5
  projects." / "Showing 2 projects about <theme>.".
- A hidden no-match message: "No projects match this theme." with a "Show all projects"
  button.

Behaviour with script:

- Pressing a theme button sets it `aria-pressed="true"`, the others `false`, hides entries
  whose `data-themes` does not include the theme (`hidden` attribute), updates the status
  text, and writes `?theme=<theme>` with `history.replaceState`.
- Pressing "All projects" or "Show all projects" clears the filter, shows every entry, and
  removes `?theme=`.
- On load, `?theme=<known>` applies that filter; `?theme=<unknown>` shows the no-match
  message with its clear button and hides every entry.
- Keyboard: all controls are native buttons, reachable with Tab and operated with Enter or
  Space; focus stays on the pressed button.

Tests: unit (filter rule), component (markup and classes), E2E (apply, clear, deep link,
unknown theme, no-JS render shows all entries and no visible control).

## `<option-tabs>` (direction B, story page, options stage)

Markup before script: an ordered list of option cards (`data-option`), all visible, the
chosen one first-class labelled "Chosen" with its reason. A tab list container with
`hidden js:flex` holds one `<button role="tab">` per option.

Behaviour with script (WAI-ARIA Authoring Practices tabs pattern, automatic activation):

- The container gets `role="tablist"` and an accessible name "Options considered"; each card
  becomes a `role="tabpanel"` labelled by its tab; the chosen option's tab is selected
  initially.
- Left/Right arrow keys move between tabs, Home/End go to first/last; only the selected tab is
  in the Tab order; unselected panels get `hidden`.
- Printing or JavaScript off shows every option stacked.

Tests: component (every option present without script, chosen marked), E2E (arrow-key
navigation, each option reachable, no-JS shows all options).

## Not islands

- Direction A options: native `<details>`/`<summary>`, chosen open by default.
- Direction C options: a `<table>` with a `<caption>`, options as column headers
  (`scope="col"`), constraints as row headers (`scope="row"`), inside a
  `<div role="region" aria-labelledby=… tabindex="0">` that scrolls horizontally on its own
  at phone width so the page does not.
- Scroll reveals, progress rails, sticky visual panel and view transitions: CSS only.
