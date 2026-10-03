# Contract: project story page and list (DOM)

Supersedes the story part of `specs/009-portfolio/contracts/pages-dom.md`. The index contract
there is unchanged except for row spacing; the filter island contract is unchanged. Tests
select on the `data-*` hooks below.

## Story page `/projects/<slug>/`

```html
<!-- BaseLayout: skip link, header, main -->
<div data-progress aria-hidden="true"></div>               <!-- unchanged -->
<article data-story>
  <p data-draft-notice>…</p>                                <!-- draft builds only, unchanged -->
  <header data-story-header>
    <h1 data-story-title data-title-slug="<slug>">Title</h1> <!-- view-transition name, unchanged -->
    <p data-story-problem>One-line problem.</p>
    <div data-story-meta><!-- StatusPill, ThemePills --></div>
    <!-- no nav "In this story" -->
  </header>

  <section data-part="problem" aria-labelledby="problem" data-has-picture="true|false">
    <div data-part-text class="prose …same classes as the post body…">
      <h2 id="problem">Problem</h2>
      …writer's Markdown…
    </div>
    <figure data-part-picture data-visual="image|diagram">…</figure> <!-- only when a picture has part: problem -->
  </section>

  <section data-part="options" …>
    <div data-part-text class="prose …">
      <h2 id="options">Options</h2>
      <p>…routes…</p>
      <ul><li><strong>Label</strong>: explanation</li>…</ul>
      <div role="region" aria-labelledby="options-caption" tabindex="0" data-options-table>
        <table>
          <caption id="options-caption">How the options compare for Title</caption>
          <thead><tr><th scope="col">Option</th><th scope="col">Constraint</th>…</tr></thead>
          <tbody>
            <tr data-chosen>
              <th scope="row">Option name <span data-chosen-label>Chosen</span></th>
              <td data-fit="yes"><span aria-hidden="true">✓ </span>Yes</td>
              <td data-fit="partly"><span aria-hidden="true">~ </span>Partly</td>
              <td data-fit="no"><span aria-hidden="true">✗ </span>No</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Why …</p>
    </div>
  </section>

  <section data-part="build" …>
    <div data-part-text class="prose …">
      <h2 id="build">Build</h2>
      …
      <ul data-build-links>                                <!-- only when demo, standIn or source is set -->
        <li><a href="…">Open the Title demo</a></li>
        <li><a href="…">Title on drc.dev</a> <span data-demo-note>This is not a live demo.</span></li>
        <li><a href="…">Source code for Title</a></li>
      </ul>
    </div>
  </section>

  <section data-part="lessons" …>…</section>

  <footer data-invitation-block>
    <p data-invitation-text>Project sentence, or the standard sentence.</p>
    <p><a href="/contact/?project=<slug>" data-invitation>Tell me about a problem like Title</a></p>
  </footer>
</article>
```

Guarantees:

- Exactly four `section[data-part]`, in the order problem, options, build, lessons, each with
  one `h2` whose computed font size equals a post body `h2` at the same viewport.
- No element carries `data-chapter`, `data-chapter-number`, `data-reveal` or
  `data-story-contents`; no "Chapter n of" text.
- No `section[data-part]` has a `min-height`; at `64rem` and wider a part with a picture is a
  two-column grid (text, then picture to its right); below `64rem` the picture follows the text.
- The first picture on the page is `loading="eager"`, every other `loading="lazy"`; images have
  `alt`, diagrams a `figcaption` referenced by `aria-describedby`.
- `td[data-fit]` carries the answer as text; colour is never the only signal; the chosen row is
  marked by the word "Chosen" and a heavier edge as well as colour.
- No `iframe` on any project page; the page CSP is the site policy (no frame allowance).
- Everything above is in the static HTML; no script is needed to read it (the progress bar and
  view transition are CSS / browser features, unchanged).

## Project list `/projects/`

Unchanged markup and filter behaviour. Rows are ordered by `date` (newest first), then title.
`[data-project]` vertical padding and the gap between its columns are smaller than before
(R8 in research.md). With no published project (production while all five are drafts) the
existing `[data-projects-empty]` state is shown.
