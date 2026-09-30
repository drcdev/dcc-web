# Data model: Design directions for the blog

**Feature**: 005-blog-design-directions | **Plan**: [plan.md](./plan.md)

There is no content collection and no schema in this feature (the brief rules them out; the
real `posts` collection belongs to the later blog feature). The entities below are plain
TypeScript types and constants in one prototype-only module,
`src/pages/design/blog/_data/samples.ts`, which is deleted with the prototypes. They are shaped
so the later blog feature can lift the field list straight into its `post.ts` schema beside
`src/content/schemas/page.ts`.

## Topic

| Field | Type | Rule |
|---|---|---|
| `slug` | string | Lower-case letters, digits, hyphens. Unique. Used in topic addresses only. |
| `name` | string | Display name. |
| `intro` | string | One or two sentences (FR-008). 60–280 characters. |
| `tone` | `"rust" \| "sage" \| "lavender" \| "mist"` | Existing palette used to colour-code the topic in directions that do so (research R5). Unique per topic. |

The four starting topics (FR-004), fixed:

| slug | name | tone |
|---|---|---|
| `compliant-data` | High-compliance data and integration | rust |
| `high-performing-teams` | High-performing technology teams | sage |
| `agentic-ai-legacy` | Agentic AI in legacy environments | lavender |
| `healthcare-leadership` | Healthcare technology leadership | mist |

## SamplePost

| Field | Type | Rule |
|---|---|---|
| `slug` | string | Lower-case letters, digits, hyphens. Unique. **Contains no topic slug** (FR-012). |
| `title` | string | Plausible title on the blog's subject (FR-004). |
| `date` | ISO date string | Unique across posts so newest-first order is total. All in 2025–2026. |
| `readingMinutes` | integer ≥ 1 | Shown as "N min read". |
| `topics` | Topic `slug`[] | One or more, each an existing topic. |
| `summary` | string | One or two sentences, ≤ 240 characters. |
| `featured` | boolean | Don's hand-set "most important" flag (clarification 2026-09-29, FR-006). |
| `image` | `{ src: ImageMetadata; alt: string }` \| undefined | Optional feature image (edge case: post with no image). Alt text required when present. |
| `body` | `"full-with-image" \| "full-no-image" \| "short"` | Which sample body the post page renders (research R2). |

Derived values (computed in the module, not stored):

- `byNewest`: posts sorted by `date` descending.
- `featuredPosts`: `byNewest` filtered to `featured`.
- `postsInTopic(slug)`: `byNewest` filtered to posts whose `topics` include `slug`.
- `relatedTo(post, n = 3)`: other posts sharing the most topics, ties broken by newest; falls
  back to newest posts when fewer than `n` share a topic (FR-011).
- `proposedAddress(direction, post)`: the address the direction proposes for the real blog
  (see [contracts/prototype-routes.md](./contracts/prototype-routes.md)); never includes a
  topic.

### Sample set invariants (checked by `tests/unit/design/blog-samples.test.ts`)

1. Exactly 13 posts, so a page size of 5 gives three listing pages (first, middle, last).
2. Every one of the four topics has at least one post (FR-004), and exactly one topic has only
   one post (edge case "topic with only one post"); `healthcare-leadership` is that topic.
3. 3 or 4 posts are `featured` (enough for a featured grid or strip; none are newest-only).
4. At least two posts have no `image` (edge case "post with no image"), one of them on the
   first listing page.
5. At least one title is 90 characters or longer (edge case "long title").
6. At least one post has three or more topics (edge case "many topics").
7. Exactly one post has `body: "full-with-image"` and exactly one `body: "full-no-image"`; the
   rest are `"short"`.
8. No post `slug` contains any topic `slug`, and `proposedAddress` for every direction contains
   no topic slug (FR-012).
9. Dates are unique.
10. Every `image` has non-empty alt text.

## Sample post body (FR-010)

One shared Astro component, `src/pages/design/blog/_components/SampleBody.astro`, renders the
full body inside the site's `prose dark:prose-invert prose-accent` wrapper. It contains, in
order: an introduction; an `h2` section; an in-body figure (`<Image />` + `<figcaption>`); a
code sample (plain `<pre><code>`, one line longer than a phone width, in a focusable scroll
region, research R4); a table wider than a phone, in the existing `.table-wrapper`, also a
focusable scroll region with a caption; a closing section. The `"full-no-image"` variant omits
the feature image only; the in-body figure stays, because FR-010 applies to every post page.

## DesignDirection

| Field | Type | Rule |
|---|---|---|
| `id` | `"a" \| "b" \| "c"` | Folder name under `/design/blog/`. |
| `name` | string | Short descriptive name. |
| `summary` | string | One paragraph, shown on the directions index and in the decision document. |
| `topicPresentation` | string | How topics are shown and browsed. |
| `addresses` | `{ post; landing; all; allPage; topic }` | Proposed real-blog address patterns. |
| `newColoursOrFonts` | string[] | Empty for all three directions (research R5); listed if that changes. |
| `noFeaturedBehaviour` | string | What the landing page shows when no post is featured (edge case). |

The three instances (the structural differences required by FR-003):

| | A. Front page | B. Timeline | C. Topic hubs |
|---|---|---|---|
| Idea | A magazine front page: the newest post as a large feature, Don's featured posts in a bento grid, then a card grid of recent posts. | A reading log: one newest-first stream on a vertical timeline, grouped by month, text-first. | A field guide: writing organized around the four topics, each a hub with its introduction, its featured post and its newest posts. |
| Flux patterns drawn on | `post.hbs` feature-image overlay header, `content-post-list-featured.hbs` bento grid, `ui-tag-pill.hbs`, accent colour-coding | `content-post-list.hbs` timeline, `content-post-meta.hbs` | `ui-tag-pill.hbs`, accent colour-coding, `content-post-meta.hbs` |
| Newest writing | Lead story at the top, then a "Latest" card grid | The stream itself; newest first, top of page | A "Latest" strip of the three newest posts above the hubs |
| Featured posts | Bento grid of featured posts directly under the lead story | A short "Start here" list pinned above the stream, and a "Featured" marker on those entries in the stream | Each hub leads with its featured post; featured posts also carry a marker |
| Topic presentation | Colour-coded pills on every card; a pill row under the landing heading; topic page = intro banner in the topic's colour + card grid | Plain text topic links in a filter row above the stream; topic page = intro paragraph + the same timeline, filtered | Topics are the primary structure; listing has a side index of topics (a `<details>` disclosure on phone, no JavaScript); topic hub = intro + featured + all its posts |
| Listing | Card grid, numbered pagination | Compact timeline grouped by year, "Newer posts" / "Older posts" links plus "Page N of M" | Two-column list with the topic index beside it, numbered pagination |
| Post page | Full-width feature image with the title overlaid (Flux `post.hbs`); related posts as three cards | Title and meta first, feature image below; related posts as a text list, plus previous/next by date | Two columns on desktop: body plus a side column with date, reading time, topics and "In this post" contents; related posts grouped as "More in {topic}" |
| Proposed post address | `/writing/{slug}/` | `/writing/{slug}/` | `/writing/{year}/{slug}/` |
| Proposed topic address | `/writing/topics/{topic}/` | `/writing/topics/{topic}/` | `/writing/{topic}/` |
| No post featured | Bento grid is omitted; the lead story is the newest post | "Start here" list is omitted | Each hub leads with its newest post |
| New colours or fonts | None | None | None |

## Decision document (docs/design/blog.md)

Structure fixed by [contracts/decision-document.md](./contracts/decision-document.md). Its
Decision section is a state holder: **empty** when this feature's pull request is opened;
filled by Don only.

## State transitions

```text
Prototype pages:  absent → built and tested on branch → on preview for Don's review
                  → removed on branch after Don's review ([PREVIEW-CHECK]) → merged (absent on main)
Decision section: empty (PR opened) → filled by Don (outside this feature's tasks)
Screenshots:      captured from the prototypes → committed → merged (kept on main)
```
