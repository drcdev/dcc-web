# Data Model: Home page with a Now section and Start here reading paths

## Now entry (collection `now`)

File: `src/content/now/now.md`. There must be exactly one; zero or more than one fails the build (N07).

| Field | Where | Type / rule | Shown as |
|-------|-------|-------------|----------|
| `updated` | front matter | `YYYY-MM-DD`, a real calendar day, not after the build date (UTC) | "Updated October 1, 2026" in `<time datetime>` |
| `workingOn` | front matter | required plain text, trimmed, not blank, one line, ≤ 200 characters | "Working on" |
| `reading` | front matter | same | "Reading" |
| `mbaResearch` | front matter | same | "MBA research" |
| `aiExperiments` | front matter | same | "AI experiments" |
| open-to line | body | exactly one Markdown paragraph that contains at least one link to `/contact/` (other links allowed) | rendered by `render()` |

The schema is strict: an unknown or misspelled key fails the build and is named in the error. The
front matter text is plain text, not Markdown. Only the body is rendered as Markdown.

## Reading path (collection `readingPaths`)

File: `src/content/reading-paths/<id>.yaml`. The id is the file name. It is used for the path heading's
`id` attribute.

| Field | Type / rule |
|-------|-------------|
| `title` | required text (the path name, for example "Leading change in healthcare") |
| `description` | required, one sentence ending in `.`, ≤ 160 characters ("who it is for") |
| `position` | integer 1–4; unique across paths; sets display order |
| `items` | list of 1–5 **Reading path items**, in display order |

Collection rules (checked by `checkReadingPaths`):

- At most four path files. Zero files is allowed and hides the section (spec US2-AS5).
- `position` values are unique.
- Within one path, no item appears twice (same collection and id).
- Every item resolves to an existing post or project, drafts included.

## Reading path item

Exactly one key:

| Shape | Meaning |
|-------|---------|
| `post: <slug>` | `reference("posts")`, a post's file name without extension |
| `project: <slug>` | `reference("projects")`, a project's file name without extension |

Title, link, kind and reading time all come from the referenced entry (spec "Key Entities").

## Derived: resolved home view (built by `getReadingPaths()` / `resolveReadingPaths()`)

```text
ResolvedPath  { id, title, description, items: ResolvedItem[] }   // sorted by position
ResolvedItem  { kind: "post" | "project", title, href, minutesRead }
```

- `href`: `postHref(slug)` or `projectHref(slug)` (existing address helpers).
- Visibility: an item is kept only if its target is in the visible set for this build. Posts come
  from `getPostSummaries()`, and projects from `getPublishedProjects()`, so production drops drafts (FR-013).
- A path with no kept items is dropped. With no paths left, `<StartHere />` renders nothing (FR-007).
- The same post may appear in more than one path.

## Derived: Now view (built by `getNow()`)

```text
NowView { updated: Date, topics: { label, text }[4], OpenTo: AstroComponent }
```

## State transitions

None. The Now entry is replaced in place. Its history is the git log (spec Assumptions).
