# Contract: retired status in the story page and project list (DOM)

Adds to `specs/014-project-four-part-story/contracts/pages-dom.md`. Only the changed parts
are shown. Everything is prerendered HTML with no script (FR-010).

## Status pill (story header and index row)

```html
<span data-pill data-tone="mauve" data-status="retired" class="… border-mauve-800 bg-mauve-50 text-mauve-950
      dark:border-mauve-300 dark:bg-mauve-800 dark:text-mauve-100">Retired</span>
```

The word "Retired" is the text content, so the status never depends on colour (FR-010). The
pill has no `role`, `aria-label`, `aria-live` or `aria-hidden`: its text is its accessible
content. Dark mode uses the `mauve-800` fill, `mauve-300` border and `mauve-100` text, as
FR-004 states (the border carries the edge against the dark page; contrast in data-model.md).
No `forced-colors` override is added: the border and text stay visible in the system colours.
The other statuses are unchanged (`sage` / `lavender` / `rust`, labels Shipped / Experiment /
In progress).

## Story page `/projects/<slug>/`, retired project

```html
<article data-story>
  <p data-draft-notice>…</p>                       <!-- only for a draft, outside production; unchanged -->
  <header data-story-header>
    <h1 data-story-title data-title-slug="<slug>">Title</h1>
    <p data-story-problem>…</p>
    <div data-story-meta><!-- StatusPill (Retired), ThemePills --></div>
    <p data-retired-note><strong>Retired.</strong> I no longer use or maintain this project.<!--
      --> It was replaced by <a href="/projects/<id>/">Replacement title</a>.</p>
  </header>
  <!-- the four parts and the invitation, unchanged (FR-003) -->
</article>
```

The replacement sentence, by `replacement` value (see data-model.md "ResolvedReplacement"):

| `replacement` | Text after "this project." |
|---|---|
| `undefined` | nothing |
| `{ name, href }` | ` It was replaced by <a href="{href}">{name}</a>.` |
| `{ name }` | ` It was replaced by {name}.` |

The link is a plain same-tab `<a>`, like the Build links: no `target`, no `rel` change, no
external-link icon or "opens in" text, on or off the site. Its text is the replacement's
name only. It is styled as an inline story link (FR-012): the note's text colour, underlined,
and the site's global `a:focus-visible` outline; as an inline link in a sentence it is exempt
from the WCAG 2.2 target-size minimum. A name-only replacement is bare text: no `<a>`, no
underline, no link colour. `<strong>` is inline emphasis, not a heading, and the `<p>` has no
role or live region.

Reading order (DOM order): `[data-draft-notice]` (draft outside production only), then the
header's title, problem, meta (Retired pill, theme pills) and `[data-retired-note]`, then the
parts. The pill row wraps (`flex-wrap`) and the note text wraps, so nothing scrolls sideways
at 320 CSS pixels or 200% zoom (FR-013).

`[data-retired-note]` is absent on every non-retired story and never appears on the index.
Page `<title>`, description and sharing image are unchanged.

Tempo, after this change:

```html
<p data-retired-note><strong>Retired.</strong> I no longer use or maintain this project. It was replaced by Cadence.</p>
```

## Project list `/projects/`

Unchanged markup, order (date, title, slug) and filter behaviour. A retired row is the same
`<li data-project="<slug>" data-themes="…">` with the Retired pill in `[data-project-meta]`.
No note on the index.
