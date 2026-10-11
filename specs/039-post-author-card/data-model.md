# Data model: Author card at the end of posts

**Feature**: `039-post-author-card` | **Plan**: [plan.md](./plan.md)

No storage, no content collection and no frontmatter field is added. The feature reads one new
settings object and one existing post field.

## Author profile (`blog.author` in `src/config/blog.ts`)

| Field | Type | Value (draft, Don revises in review) | Rules |
|-------|------|--------------------------------------|-------|
| `name` | `string` | `"Don Coleman"` | Non-empty. The heading is `Written by {name}`. |
| `photo` | `ImageMetadata` | default import of `src/content/pages/images/don-coleman.jpg` (the home page portrait, 645 x 645) | Imported, so a missing file fails the build. |
| `photoAlt` | `string` | `"Don Coleman"` | Exactly Don's full name, no "photo of" prefix (FR-010c). |
| `lines` | `readonly [string, string]` | `"I'm Director, Data Infrastructure and Architecture at Island Health."`, `"I write about systems thinking, practical AI and leading complex change."` | Exactly two sentences; each non-empty, one line (no `\n`), at most 100 characters; neither contains "Cloud Architect" in any letter case (FR-002, FR-003, SC-004). The role title in `lines[0]` also appears in the About page's text (FR-004a). |

Relationships: shared by every post page; used by nothing else (FR-013). The home page keeps
its own `intro` frontmatter, which points at the same photo file.

## Series (existing, `src/config/topics.ts`)

A post's `topics` array names at most one series id (`drift` or `convergence`); the post schema
already enforces this. New helper:

- `seriesOf(topics: readonly string[]): TopicId | undefined` returns the series id in `topics`,
  or `undefined` when there is none.

## Card links (derived per post, no storage)

| Post | Writing link text | Writing link href |
|------|-------------------|-------------------|
| In a series `s` | `More in {findTopic(s).name}` | `topicHref(s)` (`/writing/{s}/`) |
| In no series | `More of my writing` | `/writing/` |

Plus, on every post: `More about me` to `/about/` and `Get in touch` to `/contact/`.

## State

None. The card is static HTML built with each post page; a change to `blog.author` rebuilds
every post page with the new values (SC-006).
