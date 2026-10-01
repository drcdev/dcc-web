# Data Model: Frame the Writing pages around Drift & Convergence

Extends `specs/008-blog/data-model.md`. Everything is a file in the repository; nothing is
stored at run time.

## Topic (controlled), `src/config/topics.ts`

| Field | Type | Rule |
|---|---|---|
| `id` | string | `^[a-z0-9-]+$`, ≤ 40 chars, unique. The address key. |
| `name` | string | Non-empty. Pill text and banner heading. |
| `description` | string | One or two sentences. Banner text; for a series, also the framing lead. |
| `colour` | `Palette` | Existing palette, unique across all controlled topics (series included). |
| `series` | `true` (optional) | Present only on the two series. |

The list after this feature, in order:

| id | name | colour | series |
|---|---|---|---|
| `compliant-data` | High-compliance data and integration | rust | |
| `technology-teams` | High-performing technology teams | **sand** (was sage) | |
| `agentic-ai` | Agentic AI in legacy environments | **mauve** (was lavender) | |
| `healthcare-leadership` | Healthcare technology leadership | mist | |
| `drift` | Drift | lavender | yes |
| `convergence` | Convergence | sage | yes |

Derived values (pure, unit-tested):

- `controlledIds`: the six ids. `seriesIds`: `["drift", "convergence"]`.
- `pillRowTopics`: controlled topics without `series` (the landing/all-posts pill row, FR-006).
- `topicHref(id)`: `/writing/{id}/` for a series, `/writing/topics/{id}/` otherwise (controlled
  or free-form).
- `otherSeries(id)`: the other series id (series banner link).

## Series

A controlled topic with `series: true`. Canonical address `/writing/{id}/`, pages
`/writing/{id}/{n}/` for n ≥ 2. Old addresses `/writing/topics/{id}/[n/]` redirect (301) to
the canonical address (contracts/writing-pages.md "Redirects"). Lists visible posts whose
`topics` include the id, newest first, `blog.pageSize` per page.

## Free-form topic

Any id in a post's `topics` that is not a controlled id.

| Field | Derivation |
|---|---|
| `id` | As written in the post. Same id rules as controlled topics (FR-012). |
| `label` | `topicLabel(id)`: hyphens → spaces, first letter capitalised (`cloud-cost` → "Cloud cost"). |
| `href` | `/writing/topics/{id}/` |
| colour | always `dusk` (pill and plain banner) |

The set of free-form topics is the union over **visible** posts (production hides drafts, so a
free-form id used only by a draft gets no page in production). Free-form topics never appear
in the pill row.

## Post (changed fields only)

| Field | Before | After |
|---|---|---|
| `topics` | 1+ ids from the controlled enum, each once | 1+ ids, each `^[a-z0-9-]+$`, ≤ 40 chars, each once; controlled or free-form |

Validation (schema `superRefine`, in addition to the 008 rules):

1. At most one series id (FR-004).
2. No free-form id within edit distance ≤ 2 of a controlled id (FR-011); the message names the
   closest controlled id.

File check (`assertPostFiles`): the slug may not be `all`, `topics`, `drift` or `convergence`
(FR-008).

Derived for display (pure helpers in `src/lib/content/topic-ids.ts`):

- `orderTopics(topics)`: the series id (if any) first, then the others in written order.
- `mainTopic(topics)`: the series id if any, else the first controlled id, else `undefined`.
  Colours the border of a text-only card.

## Content changes (FR-005)

| Post file | `topics` after |
|---|---|
| `the-systems-leadership-wayfinder-…mdx` | `convergence`, `healthcare-leadership` |
| `starting-something-new.mdx` | `convergence`, `healthcare-leadership` |
| `building-focus-pocus-…mdx` | `drift`, `agentic-ai` |
| `self-contained-development-for-ghost-themes.mdx` | `drift`, `technology-teams` |
| `sample-everything.mdx` | unchanged (`agentic-ai`, `compliant-data`) |

Existing topics are kept; the series is added first so the source reads like the page.

## Blog settings, `src/config/blog.ts`

| Field | Change |
|---|---|
| `feedTitle` | unchanged, "Drift & Convergence" |
| `feedDescription` | names both series (research R8) |
| `sectionName` | unchanged |
