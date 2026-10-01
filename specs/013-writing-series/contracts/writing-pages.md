# Contract: Writing pages with series

Extends `specs/008-blog/contracts/blog-pages.md`. Anything not named here is unchanged.

## Addresses

| Page | Address | Built for |
|---|---|---|
| Series, page 1 | `/writing/drift/`, `/writing/convergence/` | always (empty series shows the empty message) |
| Series, page N ≥ 2 | `/writing/{series}/{n}/` | N ≤ last page |
| Controlled topic | `/writing/topics/{topic}/[n/]` | the four non-series topics only |
| Free-form topic | `/writing/topics/{id}/[n/]` | each free-form id named by a visible post |
| Post | `/writing/{slug}/` | slug never `all`, `topics`, `drift`, `convergence` |

Not built: `/writing/topics/drift/…`, `/writing/topics/convergence/…`.

## Redirects (`public/_redirects`)

| Request | Response |
|---|---|
| `/writing/topics/drift` or `/writing/topics/drift/` | `301`, `Location: /writing/drift/` |
| `/writing/topics/drift/{n}/` | `301`, `Location: /writing/drift/{n}/` |
| same two rows for `convergence` | `301` to `/writing/convergence/…` |

No other rule is added. Every link the site renders to a series uses the short address.

## Series marker (`SeriesMarker`)

- `<a href="/writing/{id}/" data-series-marker="{id}">Series: {name}</a>`, pill-shaped,
  `font-semibold`, 2px outline in the series palette (700 light / 300 dark), pill colours of
  the series palette (lavender for Drift, sage for Convergence).
- Wherever topics are listed (PostCard, LeadStory, PostMeta, related posts, RecentWriting),
  the marker is the first `<li>` of the topics list; the remaining topics follow in written
  order. A post without a series renders no marker and no empty `<li>`.

## Topic pill (`TopicPill`)

| Topic kind | Renders |
|---|---|
| series | `SeriesMarker` |
| controlled | as today, `data-topic-pill`, its palette (Agentic AI now mauve, Technology teams now sand) |
| free-form | `<a href="/writing/topics/{id}/" data-topic-pill data-free-form>` in `dusk`, text `topicLabel(id)` |

## Topic pill row (`TopicPillRow`)

The four non-series controlled topics in list order, then "All posts". No series, no
free-form topics.

## Landing `/writing/`

Order: eyebrow, `h1` "Writing" and RSS link; **framing lead** (`SeriesIntro`,
`data-series-intro`): one sentence naming Drift & Convergence, then for each series (Convergence
first, then Drift) its name, description and a link to `/writing/{id}/`; lead story; pill row;
Featured; Latest; "All posts". The framing lead renders even when a series has no posts, and
when there are no posts at all. Meta description = `blog.feedDescription`.

## Series page `/writing/{series}/[n/]`

- `SeriesBanner` (`data-series-banner="{id}"`), page `h1`: eyebrow "Series", the series name
  (", page N" on N ≥ 2), its description, a link to the other series ("Read {other name}")
  and a link "All writing" to `/writing/`. Series palette banner colours.
- Then `CardGrid` of the series' posts (or "There are no posts in this series yet." with an
  "All posts" link), then `Pagination` with base `/writing/{id}/`. No pill row.
- `<title>` and description from the series name and description, as topic pages do.

## Free-form topic page `/writing/topics/{id}/[n/]`

`TopicBanner` in `dusk`: eyebrow "Topic", `h1` `topicLabel(id)`, no description paragraph.
Same grid, empty message and pagination as controlled topic pages.

## Text-only card border

`border-2` in `mainTopic(topics)`'s palette border classes (series first); neutral
`dusk-200/700` border when the post has no controlled topic.

## Home page section (`RecentWriting`)

Heading "Recent writing" unchanged, then one `<p data-series-line>` naming Drift &
Convergence with links to `/writing/convergence/` and `/writing/drift/`, then the cards (each
with its marker), then "All writing".

## About page

"About the writing" keeps its heading, one short introduction to Drift & Convergence with
links to `/writing/convergence/` and `/writing/drift/`, and the closing contact invitation.
The two long series paragraphs are removed.

## Feed `/writing/rss.xml`

`<title>Drift & Convergence</title>`; `<description>` = `blog.feedDescription`, naming both
series. Address and items unchanged.
