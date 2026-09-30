# Contract: a post file

What Don writes to publish a post (US3, FR-031, SC-002). One file, `src/content/posts/{slug}.mdx`;
images it uses go in `src/content/posts/images/`. No other file is edited to publish a post. The
authoring guide, `docs/posts.md` (FR-034), explains every item below in plain language.

## Example

````mdx
---
title: Putting an AI agent in front of a system nobody wants to touch
summary: An agent can read a legacy system's screens faster than a new hire, but it cannot tell you which of them are safe to change.
date: 2026-08-27
updated: 2026-09-30          # optional; not earlier than date
topics:                      # at least one; the first is the main topic
  - agentic-ai
  - compliant-data
featureImage:                # optional
  src: ./images/legacy-agent.png
  alt: Two connected boxes, one labelled agent and one labelled legacy system
  caption: Where the agent sits   # optional
featured: true               # optional, default false
draft: true                  # optional, default false
---

Opening paragraph.

## A section heading

<Figure caption="The approval flow">
![The approval flow, drawn as three boxes](./images/flow.png)
</Figure>

```ts caption="Reading a post's settings"
const { title } = entry.data;
```

| Column | Column |
| --- | --- |
| Cell | Cell |
````

## Rules

- **Address**: the file name is the slug; the post lives at `/writing/{slug}/`. Lower-case
  letters, digits and hyphens only; not `all` or `topics`; no two files with the same slug; no
  sub-folders; `.mdx` only.
- **Settings**: exactly those in [data-model.md](../data-model.md) § Post; any other key fails.
- **Topics**: ids from `src/config/topics.ts`; the build error lists the allowed ids.
- **Body**: `##` to `######` headings (no `#`); images need alt text; the site's sections
  (`Figure`, `WideImage`, `FullImage`, …) work without imports; a code fence may name a
  language and a `caption="…"`; a fence without a language shows as plain text in the same box.
- **Draft**: `draft: true` keeps the post off the production site entirely and out of the feed
  everywhere; preview deployments, `astro dev` and test builds show it with a "Draft" notice.
- **Featured**: `featured: true` adds the "Featured" mark everywhere the post appears and makes
  it eligible for the landing page's Featured grid.
- **Sample posts**: the feature ships three or four posts named `sample-*.mdx`, each
  `draft: true` and saying in its summary that it is a sample. Together they cover captioned,
  wide and full-width images, code with and without a caption and without a language, a wide
  table, headings `##` to `####`, at least one featured post, one post without a feature image,
  one updated post, and all four topics (FR-035).
