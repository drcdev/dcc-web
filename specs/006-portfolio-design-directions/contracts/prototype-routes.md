# Contract: prototype routes and page DOM

These routes exist only on the feature branch and its preview deployments. They are deleted,
with everything in `src/prototypes/portfolio/`, before the pull request merges (FR-043).

## Routes

| Address | File | Content |
|---|---|---|
| `/design/portfolio/` | `src/pages/design/portfolio/index.astro` | Hub: one link to each direction's index and story, with its one-line summary |
| `/design/portfolio/a/` | `src/pages/design/portfolio/a/index.astro` | Direction A (Timeline) projects index |
| `/design/portfolio/a/focus-pocus/` | `src/pages/design/portfolio/a/focus-pocus.astro` | Direction A story |
| `/design/portfolio/b/` | `src/pages/design/portfolio/b/index.astro` | Direction B (Cards) index |
| `/design/portfolio/b/focus-pocus/` | `src/pages/design/portfolio/b/focus-pocus.astro` | Direction B story |
| `/design/portfolio/c/` | `src/pages/design/portfolio/c/index.astro` | Direction C (Chapters) index |
| `/design/portfolio/c/focus-pocus/` | `src/pages/design/portfolio/c/focus-pocus.astro` | Direction C story |

All are prerendered (the site default), served as static assets by the Worker, and return 200.

## Every prototype page

- Renders inside `BaseLayout` with the site navigation, and passes `noindex` so the page has
  `<meta name="robots" content="noindex">` (FR-007). Not in the header, footer or sitemap.
- Has a `<title>` of the form "<Direction name> – <Page> · Don Coleman" (e.g. "Timeline –
  Focus Pocus · Don Coleman"), a description, exactly one `h1`, no skipped heading levels.
- Shows a one-line prototype notice at the top of `main`: "Design prototype for review.
  Not part of the live site." with a link back to `/design/portfolio/`.
- Uses no `style` attributes, no `<iframe>`, no raster images, no external requests.
- Ships only bundled module scripts (the islands) besides the existing theme-init script.
- No horizontal page scroll at 320 px, 390 px and 1280 px, or at 200% zoom.

## Story page (`/design/portfolio/<x>/focus-pocus/`)

- `DraftNotice` at the top of the story.
- `h1` is the project title, "Focus Pocus", followed by the one-line problem statement.
- Seven stage sections in order, each `<section id="<stage-id>" aria-labelledby=…>` with an
  `h2` heading, in `STAGE_ORDER`: `problem`, `constraints`, `options`, `built`, `outcome`,
  `lessons`, `invitation` (FR-010).
- Each stage contains a visible "Draft for review" mark (`data-draft-mark`).
- A stage with a visual renders it inside the same `<section>`, beside the text at desktop
  width and directly after it at phone width (FR-012). A stage without a visual leaves no
  empty column.
- The options stage contains every option in the HTML (`data-option="<id>"`), each with its
  name, summary, pros and cons; the chosen one has `data-chosen` and a visible "Chosen" label
  plus its reason (FR-011). None is `hidden` or `display:none` in the no-JS render.
- The demo appears in the `built` stage: a link to `https://drc.dev/projects/focus-pocus` (and
  the repository), the stand-in note, and, where the direction shows one, a placeholder frame
  in place of an embed (FR-014).
- The invitation stage's `h2` reads "Have a problem like this?" and contains the link from
  contracts/contact-handoff.md (FR-015).
- Reveal elements carry `data-reveal`. With `prefers-reduced-motion: reduce`, their computed
  `animation-name` is `none` and opacity is 1; with JavaScript off they are fully visible
  (FR-016, FR-017).

## Index page (`/design/portfolio/<x>/`)

- `h1` "Projects".
- One entry per project (`data-entry="<slug>"`, `data-themes="<theme>|<theme>"`), each showing
  title, one-line problem, visual, theme labels and status label (FR-020). Five entries.
- Focus Pocus's title links to the same direction's story (FR-024). Other entries do not link
  to a story; their only link is "on drc.dev" to their project page (spec edge case).
- A `<portfolio-filter>` island around the list (contracts/islands.md).
- With JavaScript off, all five entries are visible and no filter control is visible (FR-023).

## Hub page (`/design/portfolio/`)

- `h1` "Portfolio design directions", a list of the three directions, each with name, summary,
  and links to its index and story. Exists to make the preview deployment easy to review; also
  removed before merge.
