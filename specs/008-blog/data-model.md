# Data model: The blog ("Drift & Convergence")

Phase 1 output for [plan.md](./plan.md). All data is files in the repository (Principle VI);
there is no database. Research references (R1…) point to [research.md](./research.md).

## Post (collection entry, `posts`)

One file: `src/content/posts/{slug}.mdx`, images in `src/content/posts/images/`.

| Setting | Type | Required | Rules |
|---|---|---|---|
| `title` | text | yes | trimmed, not empty |
| `summary` | text | yes | trimmed, not empty; used on cards, the post's title card, page description and feed |
| `date` | date (`YYYY-MM-DD`) | yes | a readable date; the publication date |
| `updated` | date | no | a readable date, not earlier than `date` |
| `topics` | list of topic ids | yes | at least one; each in the controlled list (Topic); no repeats; the first is the **main topic** |
| `featureImage` | `{ src, alt, caption? }` | no | `src` a local image that exists; `alt` required and not empty; `caption` optional |
| `featured` | true/false | no | default `false` |
| `draft` | true/false | no | default `false` |

- Unknown settings fail the build (strict object).
- Body: MDX. Headings start at `##` (the title is the only `h1`); sections allowed are the
  existing registry (`Figure`, `WideImage`, `FullImage`, …); Markdown images need alt text;
  fenced code may carry `caption="…"` after the language.
- Schema: `postSchema({ image })` in `src/content/schemas/post.ts` (R1). Contract:
  [contracts/post-file.md](./contracts/post-file.md).

**Derived values**

| Value | Rule | Where |
|---|---|---|
| `slug` / entry id | the file name without `.mdx`; lower-case letters, digits, hyphens; not `all` or `topics` | `slugFromPostPath()` (`src/lib/content/post-address.ts`) |
| `href` | `/writing/{slug}/` | `postHref()` |
| `minutesRead` | whole minutes, words ÷ 225 rounded up, at least 1 | Sätteri plugin → `remarkPluginFrontmatter.minutesRead` (R6) |
| `mainTopic` | `topics[0]` | summary |
| `isVisible` | `!draft` in production; always otherwise | `includeDrafts()` (R3) |
| related posts | R5 `selectRelated` | post route |

**Invariants**

1. No two post files make the same slug; no slug is reserved (FR-003).
2. Every post has at least one topic, all from the list (FR-018).
3. `updated ≥ date` when present (FR-033).
4. A feature image and every body image have alt text (FR-033).
5. On a production build, no draft appears in any page, listing, related list, home section,
   feed or sitemap; on every other build drafts are built and listed, and the feed still
   excludes them (FR-032, FR-036).
6. Listing order is `date` descending, then `title` ascending (FR-015).

**States**

```text
draft: true  ──(Don sets draft: false or removes it)──▶  published
  │ production: absent everywhere                          │ everywhere; in the feed
  │ preview/dev/test: built, listed, "Draft" notice        │
  │ feed: never                                            │
```

`featured` and `updated` are independent flags on a published or draft post.

## PostSummary (derived, in memory)

What cards, listings, the feed and the home section need, built once per build by
`getPostSummaries()` in `src/lib/posts.ts` from each entry and its render result:

```ts
interface PostSummary {
  slug: string;
  href: string;              // /writing/{slug}/
  title: string;
  summary: string;
  date: Date;
  updated?: Date;
  topics: TopicId[];         // first = main topic
  featureImage?: { src: ImageMetadata; alt: string; caption?: string };
  featured: boolean;
  draft: boolean;
  minutesRead: number;
}
```

## Topic (controlled list, `src/config/topics.ts`)

| Field | Type | Rules |
|---|---|---|
| `id` | text | lower-case letters, digits, hyphens; unique; used in `/writing/topics/{id}/` |
| `name` | text | shown on pills and the banner |
| `description` | text | one or two sentences for the topic banner |
| `colour` | palette name | one of the existing palettes (`rust`, `sage`, `lavender`, `mist`, `sand`, `mauve`, `dusk`); unique across topics |

Starting list (FR-016): `compliant-data` (rust), `technology-teams` (sage), `agentic-ai`
(lavender), `healthcare-leadership` (mist) (R2). A topic has many posts; a post has one or more
topics. Pill, border and banner classes per colour live in `src/components/post/topic-styles.ts`.

Adding a topic: add one entry to `topics` and, if its colour is not yet in the style map, one
entry there (the unit test fails until both exist). Removing a topic that posts still name fails
the build, naming the posts (edge case).

## Blog settings (`src/config/blog.ts`)

| Setting | Value |
|---|---|
| `sectionName` | "Drift & Convergence" |
| `feedTitle` / `feedDescription` | "Drift & Convergence" / plain one-line description |
| `pageSize` | 12 |
| `featuredMax` | 3 |
| `latestMax` | 6 |
| `recentMax` | 3 |
| `relatedMax` | 3 |
| `viewsNote` | "The views in this post are my own and do not represent any employer or client." (placeholder until Don supplies his wording; one place, FR-027) |

## LandingSelection (derived)

```ts
interface LandingSelection {
  lead?: PostSummary;          // newest visible post
  featured: PostSummary[];     // ≤ 3 featured, newest first, never the lead
  latest: PostSummary[];       // ≤ 6 newest not already shown
}
```

Rules: R5. Empty `featured` → the "Featured" heading and grid are not rendered; empty `latest`
→ the "Latest" heading and grid are not rendered; no `lead` → the "no posts yet" message.

## ListingPage (Astro `Page<PostSummary>`)

From `paginate()`: `data`, `currentPage`, `lastPage`, `url.prev/next/first/last`. Pages exist for
1…`lastPage`; page 1 is the bare address. A topic with no posts has one page with an empty
`data` and the "no posts on this topic yet" message.

## BuildMode (derived, `src/lib/build-mode.ts`)

```ts
interface BuildEnv { WORKERS_CI?: string; WORKERS_CI_BRANCH?: string }
function includeDrafts(env: BuildEnv): boolean  // false only when WORKERS_CI === "1" && WORKERS_CI_BRANCH === "main"
```

## Feed item (derived, `src/pages/writing/rss.xml.ts`)

| RSS field | From |
|---|---|
| `title` | `title` |
| `link` | `href` (absolute against `site`) |
| `pubDate` | `date` |
| `description` | `summary` |
| `customData` | `<dcterms:modified>` with `updated` in ISO form, when present |

Every non-draft post, newest first, on every build (R11).

## Share links (derived, `src/lib/share.ts`)

```ts
function shareLinks(title: string, url: string): { linkedin: string; email: string }
// linkedin: https://www.linkedin.com/sharing/share-offsite/?url=<encoded url>
// email:    mailto:?subject=<encoded title>&body=<encoded url>
```

## Build errors (`PageContentError`)

Post failures reuse `PageContentError` with new helpers `postFileError(file, problem)` →
"Post file {file}: {problem}" and `postFilesError(a, b, problem)`. Full list:
[contracts/build-errors.md](./contracts/build-errors.md).
