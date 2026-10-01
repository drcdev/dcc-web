# Writing and publishing blog posts

Every post on the blog ("Drift & Convergence") is one file in `src/content/posts/`. Add the
file, commit, and the post exists on the next build: its page, its place on the writing pages
and topic pages, the feed, the home page and the sitemap all follow. There is nothing else to
register.

## File name and address

The file name is the address. Use `.mdx`, directly in `src/content/posts/`.
The name may use lower-case letters, digits and hyphens only.

| File | Address |
|---|---|
| `src/content/posts/why-audit-trails-matter.mdx` | `/writing/why-audit-trails-matter/` |
| `src/content/posts/agents-and-legacy-systems.mdx` | `/writing/agents-and-legacy-systems/` |

- The names `all` and `topics` are reserved for listing pages, and so are the series names
  `drift`, `convergence`. A post cannot use them (build error P25).
- There is no year or category in the address, and there are no redirects.
  **Do not rename a published post**: its old address stops working and any link to it breaks.
- Put pictures in `src/content/posts/images/`. Refer to them as `./images/name.png`.

## The top of the file

```yaml
---
title: Why audit trails matter
summary: What an audit trail is for, and how to design one people will read.
date: 2026-08-27
updated: 2026-09-15
topics:
  - compliant-data
  - technology-teams
featureImage:
  src: ./images/audit-trail.png
  alt: A ledger with one line highlighted
  caption: A ledger, the oldest audit trail
featured: false
draft: false
---
```

| Setting | Needed | What it does |
|---|---|---|
| `title` | yes | The main heading and the browser tab title. Long titles wrap. |
| `summary` | yes | Shown on cards, in search results and in link previews. One or two sentences read best. |
| `date` | yes | The publication date, written `YYYY-MM-DD` with no quotes and no time. Posts are listed newest first. A future date is published like any other: there is no scheduling. |
| `updated` | no | The date of the last change, `YYYY-MM-DD`, on or after `date`. The post then shows "Updated" with this date. |
| `topics` | yes | One or more topic identifiers, each once (see Topics below). A series id goes first. At most one series. The first topic sets the colour of a card with no picture. |
| `featureImage` | no | A picture at the top of the post and on its cards: `src` (a file in `images/`), `alt` (required) and `caption` (optional). Without it the post has a text-only card and no picture area. |
| `featured` | no | `true` shows the post in the Featured area of the writing page. Default `false`. |
| `draft` | no | `true` keeps the post off the live site (see Drafts below). Default `false`. |

Do not write a `# Heading` in the body. The title is the page's only main heading; use `##` to
`######` in the body. Any other setting, or a misspelled one, stops the build.

## Topics

Controlled topics are a fixed list in `src/config/topics.ts`. A post names topics by `id`. The
`id` is also the topic's address, `/writing/topics/{id}/`.

### Join a series

To put a post in a series, add `drift` or `convergence` to `topics`, first in the list. A post
is in at most one series. The post then appears on the series page, `/writing/drift/` or
`/writing/convergence/`, and carries the series marker.

### Free-form topics

An id that is not in `src/config/topics.ts` is a free-form topic. Write it with lower-case
letters, digits and hyphens, at most 40 characters. It gets a neutral pill, labelled in sentence
case (`cloud-cost` shows as "Cloud cost"), and a page at `/writing/topics/{id}/`. A free-form id
that is within two letters of a controlled id fails the build (P24), so a typo is caught.

### Add a topic

Add one entry to `src/config/topics.ts` with an `id` (lower-case letters, digits and hyphens),
a `name`, a `description` and a `colour` that no other topic uses. If the colour has no entry in
`src/components/post/topic-styles.ts`, add one there; a test fails until both exist. The topic's
pill and page appear on the next build, even before a post uses it.

### Rename a topic

Change its `name`. Only the label changes; the address stays the same. Changing the `id`
changes the address with no redirect, and the build fails until every post that names the old
`id` is updated.

### Remove a topic

Delete its entry. A post that still names it keeps working: the id becomes a free-form topic
with a neutral pill and the same page address (P21). Remove the id from the posts too if the
topic should go.

## Images and their widths

Use the same sections as pages, with no import. Every image needs a description in the square
brackets (alt text). Leave a blank line after an opening tag and before a closing tag.

`Figure` is an image in the text column. `WideImage` runs a little wider than the text on large
screens. `FullImage` runs the full page width. `caption` is optional on all three.

```mdx
<Figure caption="The audit log after the change">

![A table of log lines with one line highlighted](./images/log.png)

</Figure>

<WideImage>

![A diagram of three systems exchanging records](./images/systems.png)

</WideImage>

<FullImage caption="Optional caption">

![A wide photo of a server room](./images/room.jpg)

</FullImage>
```

A plain `![description](./images/name.png)` also works and sits in the text column. The other
sections of `docs/pages.md` (`Lead`, `TextBlock`, `Offerings`, `CallToAction`) are also
available.

## Tables

Write a table as a Markdown table. The first row becomes the column headers. Introduce each
table in the text before it, because a table has no title of its own. On a narrow screen it
scrolls sideways inside its own area, which a keyboard user can focus.

## Code

Fence code with three backticks and name the language after them. Add a caption after it with
`caption="..."`.

````md
```ts caption="Reading a setting"
const answer: number = 42;
```
````

Languages such as `ts`, `js`, `json`, `sh`, `yaml` and `html` are coloured. A fence with no
language, or with a language the highlighter does not know, is not an error: it is shown as
plain text. Long lines scroll sideways inside the box.

## Drafts, featured posts and the update date

- **Drafts.** Set `draft: true` while you write. A draft is left out of the live site
  completely: no page, listing, topic page, feed entry or sitemap entry. On a preview address,
  in development and in tests, drafts are built like other posts and are marked "Draft" on
  their cards and with a "Draft" notice at the top of the page. Every draft page also asks
  search engines not to index it. A preview is readable by anyone with a preview address, so
  nothing confidential goes in a draft.
- **Checking a draft on the preview.** Push the branch, open the preview address for the
  branch, and open `/writing/{file name}/`. Remove `draft: true` (or set it to `false`) when the
  post is ready to publish.
- **Featured.** `featured: true` puts a post in the Featured area of the writing page (the
  newest three) with a "Featured" mark. A post that is both a draft and featured is treated as
  a draft.
- **Update date.** Add `updated` when you change a post after publishing it. The post shows
  "Updated" with that date next to the publication date.

## Views note

Every published post ends with the "views are my own" note. It is one setting in
`src/config/blog.ts`; do not copy it into posts.

## Sample posts

There is one sample post, "Sample: Every kind of content a post can hold"
(`src/content/posts/sample-everything.mdx`). It is a draft that holds every kind of content a
post can have, so the blog's pages can be tested and checked on the preview. It stays in the
repository as a draft next to the real posts, because the end-to-end and visual tests depend on
it. Do not edit or remove it unless you update the tests and their visual baselines in the same
change. The other cases the tests need, such as a post with no feature image and a post with a
very long title, are test fixtures in `tests/fixtures/posts/`, not posts on the site.

## Build errors you may see

The build stops at the first problem and names the file. Messages written for posts start with
`Post file` or `Post files`; problems in the top of the file come from the content collection
and name the post and the setting.

| # | What went wrong | How to fix it |
|---|---|---|
| P1 | `title` is missing or empty | Add a title. |
| P2 | `summary` is missing or empty | Add a summary. |
| P3 | `date` is missing | Add `date: 2026-08-27`. |
| P4 | `date` is not a real date, or is written another way (`next tuesday`, `"2026-08-27"` in quotes, `27/08/2026`, `2026-02-30`) | Write a real day as `YYYY-MM-DD`, with no quotes or time. The same rule applies to `updated`. |
| P5 | There are no `topics`, or the list is empty | List at least one topic. |
| P6 | A topic id is a near miss of a controlled one (`agentic-a1`) | The message asks "Did you mean" the right id and lists them all; fix the spelling. |
| P7 | The same topic twice | Name each topic once. |
| P8 | `featureImage` has no `alt` (or an empty one) | Describe the picture in `alt`. |
| P9 | The feature image file does not exist | Add the file to `images/`, or fix the path. |
| P10 | `updated` is earlier than `date` | Use a date on or after `date`. |
| P11 | A misspelled setting (`sumary`) | Fix the spelling; the message names the setting. |
| P12 | An image in the body has no alt text | Describe the image inside the square brackets. |
| P13 | A `.md` file in `src/content/posts/` | Rename it to `.mdx`. |
| P14 | A post in a sub-folder | Move it to `src/content/posts/`. |
| P15 | A file name with characters other than lower-case letters, digits and hyphens | Rename the file. |
| P16 | The address is reserved (`all.mdx`, `topics.mdx`) | Rename the file. |
| P17 | There are two files with the same address (`x.mdx` and `x.md`) | Keep one of them. |
| P18 | A level-1 heading (`# Heading`) in the body | Use `##` for headings in the body. |
| P19 | An unknown tag such as `<Callout>`; it is not a section | Use one of the sections the message lists. |
| P20 | The body has no content | Add text below the settings. |
| P21 | A topic was removed from the list while a post still names it | Not an error now: the id is a free-form topic. |
| P22 | An image file in the body does not exist (`![...](./images/missing.png)`) | Add the file to `images/`, or fix the path. |
| P23 | The post lists both series (`drift` and `convergence`) | Keep one series. |
| P24 | A topic id is close to a controlled topic (`convergance`, `drfit`) | Use the id the message suggests, or pick an id that is not close. |
| P25 | The file is `drift.mdx` or `convergence.mdx` | Rename the file; the address is reserved for the series page. |
| P26 | A topic id has capitals, spaces or other characters, or is over 40 characters | Use lower-case letters, digits and hyphens, at most 40 characters. |

There is no warning level: nothing else about a post file is checked.
