# Contract: index and story pages (DOM, motion, no-JS, CSP)

Both pages render inside `BaseLayout` (skip link, header, footer, theme). Selectors below are
the test hooks; class names are free.

## `/projects/` (index)

```html
<main id="main">
  <header>
    <h1>Projects</h1>
    <p>…one plain-language line…</p>
  </header>
  <project-filter data-total="N">
    <!-- hidden until the island is ready (data-ready), so hidden without JS or if the script fails -->
    <div role="group" aria-labelledby="filter-label" hidden>
      <button aria-pressed="true" data-filter-all>All projects</button>
      <button aria-pressed="false" data-theme="ai-integration">AI integration</button> …
    </div>
    <p role="status" aria-live="polite" data-filter-status hidden>Showing all N projects.</p>
    <ul data-project-list>
      <li data-project="focus-pocus" data-themes="ai-integration|automation|macos">
        <div data-project-text>
          <h2><a href="/projects/focus-pocus/">Focus Pocus</a></h2>   <!-- the only link in the row -->
          <p data-project-problem>…</p>
          <p data-draft-mark>Draft</p>                                  <!-- non-production drafts only -->
          <span data-status="experiment">Experiment</span>
          <ul aria-label="Themes"><li>AI integration</li>…</ul>
        </div>
        <div data-project-visual><img alt="…" …/></div>
      </li>
    </ul>
    <div data-filter-empty hidden><p>No projects match this theme.</p><button data-filter-clear>Show all projects</button></div>
  </project-filter>
  <!-- with no published project: <p data-projects-empty>No projects are published yet.</p> instead of the list -->
</main>
```

- Header navigation: the Projects link has `aria-current="page"`.
- ≥ 64rem: each `li` is a two-column grid (text left, visual right). Below: one column, visual
  after text. No horizontal page scroll from 320 px.
- The row title carries the view-transition name `project-<slug>` (see Motion).

## `/projects/<slug>/` (story)

```html
<div data-progress aria-hidden="true"></div>              <!-- decorative; CSS-only -->
<main id="main">
  <p data-draft-notice>Draft …</p>                          <!-- non-production drafts only -->
  <header data-story-header>
    <h1>Focus Pocus</h1>                                    <!-- view-transition name project-<slug> -->
    <p data-story-problem>…</p>
    <span data-status>…</span><ul aria-label="Themes">…</ul>
  </header>
  <nav aria-label="In this story"><ol>
    <li><a href="#problem">The problem</a></li> … <li><a href="#invitation">Have a problem like this?</a></li>
  </ol></nav>
  <section id="problem" aria-labelledby="problem-heading" data-stage="problem">
    <p>Chapter 1 of 7</p><h2 id="problem-heading" data-reveal>The problem</h2>
    <div data-chapter-text>…</div>
    <div data-chapter-visual><figure>…</figure></div>       <!-- only when the chapter has a visual -->
  </section>
  …
  <section id="options" …>
    <div role="region" aria-labelledby="options-caption" tabindex="0" data-comparison>
      <table><caption id="options-caption">…</caption>
        <thead><tr><th scope="col">What to compare</th><th scope="col" data-chosen>JXA behind an MCP server <span>Chosen</span></th>…</tr></thead>
        <tbody>
          <tr><th scope="row">Summary</th>…</tr>
          <tr><th scope="row">In its favour</th>…</tr>     <!-- only if any option has pros -->
          <tr><th scope="row">Against it</th>…</tr>        <!-- only if any option has cons -->
          <tr><th scope="row">Works on macOS <small>…</small></th><td><span aria-hidden="true">✓ </span>Meets</td>…</tr>
        </tbody></table>
    </div>
    <p data-reason><strong>Why JXA behind an MCP server was chosen.</strong> …</p>
  </section>
  <section id="built" …>
    <ul data-demo-links>
      <li><a href="https://drc.dev/…">Open the Focus Pocus demo</a></li>        <!-- or stand-in: -->
      <li><a href="https://drc.dev/projects/focus-pocus">Focus Pocus on drc.dev</a> <span>This is not a live demo.</span></li>
      <li><a href="https://github.com/…">Source code for Focus Pocus</a></li>
    </ul>
  </section>
  …
  <section id="invitation" …>
    <h2 id="invitation-heading">Have a problem like this?</h2>
    <a href="/contact/?project=focus-pocus" data-invitation>Tell me about a problem like Focus Pocus</a>
  </section>
</main>
```

- Headings: one `h1`; seven `h2`; body headings `h3`+. Header Projects link is `aria-current="page"`.
- Visuals: image → `<img alt>`; diagram → `<figure>` with `<img alt aria-describedby>` and a visible
  description; clip → `<video controls muted playsinline preload="none" poster>` (no `autoplay`)
  with a visible description; placeholder → visible "Placeholder" mark.
- Embedded demo (chapter `visual="demo"`): `<iframe src="https://…drc.dev/…" title="<demo title>"
  loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms">` with no `allow` autoplay;
  the "Open the … demo" link stays in the built chapter.
- No `<script>` element other than the site shell's (theme init, menu, analytics beacon).

## Motion (CSS only)

| Effect | Condition | Otherwise |
|---|---|---|
| Progress bar fills with page scroll (`scroll(root)`) | no-preference + `@supports (animation-timeline: view())` | `display: none` |
| Chapter heading uncover (`view()`) | same | heading fully visible |
| Sticky visual panel | ≥ 80rem + no-preference | ordinary block after the text |
| Cross-document view transition, title pairing | no-preference + browser support | normal page load |

Content is never hidden by default; forced colours keep borders, chosen mark, status and focus
visible; print hides the progress bar.

## CSP

- Story pages with an embedded demo: the Astro CSP `<meta>` gains
  `frame-src https://drc.dev https://*.drc.dev` (via `Astro.csp.insertDirective`, route
  frontmatter, before layout render). All other pages: unchanged.
- If title pairing needs a generated `<style>`, its hash is added with `Astro.csp.insertStyleHash`.
- `public/_headers`: unchanged.
