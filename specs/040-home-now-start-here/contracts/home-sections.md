# Contract: `<Now />` and `<StartHere />` markup

Both are registered body sections (`src/components/sections/index.ts`). They take no props in page
files. An optional data prop (`now` / `paths`) replaces the lookup, for component tests only. They
render static HTML with no `<script>`. Class names follow `RecentWriting.astro`, with the
`not-prose my-10` wrapper and the same heading and link tokens.

## Home page order (`src/content/pages/index.mdx` body)

```mdx
<Now />

<StartHere />

<RecentWriting />
```

The intro card comes from front matter and renders first, so the order is intro, Now, Start here,
Recent writing (US3-AS1).

## `<Now />`

```html
<section aria-labelledby="now-heading" data-now class="not-prose my-10">
  <h2 id="now-heading">Now</h2>
  <p data-now-updated>Updated <time datetime="2026-10-01">October 1, 2026</time></p>
  <dl>
    <div><dt>Working on</dt><dd>…</dd></div>
    <div><dt>Reading</dt><dd>…</dd></div>
    <div><dt>MBA research</dt><dd>…</dd></div>
    <div><dt>AI experiments</dt><dd>…</dd></div>
  </dl>
  <div data-now-open-to><!-- rendered body: <p>I'm open to … <a href="/contact/">Get in touch</a>.</p> --></div>
</section>
```

- The labels and their order are fixed in code. The texts come from the Now entry.
- The section always renders, because the Now entry is required.

## `<StartHere />`

```html
<section aria-labelledby="start-here-heading" data-start-here class="not-prose my-10">
  <h2 id="start-here-heading">Start here</h2>
  <div class="grid items-start gap-6 md:grid-cols-2">
    <section aria-labelledby="path-building-with-ai-agents" data-reading-path="building-with-ai-agents">
      <h3 id="path-building-with-ai-agents">Building with AI agents</h3>
      <p>For people curious about letting AI do the build.</p>
      <ol>
        <li data-kind="post"><a href="/writing/…/">Building Focus Pocus: …</a> <span>6 min read</span></li>
        <li data-kind="project"><a href="/projects/cadence/">Cadence</a> <span>Project</span> · <span>4 min read</span></li>
      </ol>
    </section>
  </div>
</section>
```

- Paths are in `position` order and items in file order (FR-008).
- Projects carry the visible text "Project" (FR-010). Posts carry no label.
- The reading time is always "N min read", with N ≥ 1 (edge case).
- When there are no visible paths, it renders nothing: no heading and no empty section (FR-007, FR-013).
- On a phone the grid is one column, reading top to bottom, with no horizontal scroll at 320 px.
  From the `md` breakpoint (768 px) it is two columns, filled row by row in position order; paths
  are top-aligned and take their own height (spec FR-015b). No CSS `order` or reversed flow.
- The Now `<dl>` is one column at every width: each `<dt>` above its `<dd>`.
- Long titles and topic text wrap (`overflow-wrap: anywhere` or equivalent); nothing is clipped.
- Links use the same link and focus classes as `RecentWriting.astro`; reading-path links are block
  or padded enough to meet the 24 px target size (WCAG 2.5.8).
- The Now "open to" link is an ordinary inline text link, not a button; the intro call to action
  stays the page's one button (spec FR-016).
