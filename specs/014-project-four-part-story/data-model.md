# Data model: four-part project story

**Feature**: `014-project-four-part-story` | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

Supersedes the "Project", "Comparison", "Stage and Chapter" and "IndexVisual / Visual" entities
of `specs/009-portfolio/data-model.md`. Entities not listed here (theme keys, status, build
mode, published-project selection by draft flag) are unchanged.

## Project (one file in `src/content/projects/<slug>.mdx`)

Frontmatter, validated by `projectSchema` in `src/content/schemas/project.ts` (strict at every
level, so an unknown or removed key fails naming the key).

| Field | Type | Required | Rule |
|---|---|---|---|
| `title` | text | yes | non-empty |
| `problem` | text | yes | one sentence, at most 140 characters, ends with `.` `?` or `!` (unchanged) |
| `description` | text | yes | non-empty |
| `themes` | text[] | yes | 1 to 4, no repeat by theme key (unchanged) |
| `status` | enum | yes | `shipped`, `experiment`, `in-progress` |
| `date` | date | **yes** (was optional) | coerced date; orders the list |
| `visual` | Picture | yes | the list-row picture (unchanged); has no `part` |
| `visuals` | record name → PartPicture | no | name: lower-case letters, digits, hyphens; kind `clip` no longer allowed |
| `demo` | `{ href, title? }` | no | `href` https on drc.dev; **`embed` removed** |
| `standIn` | `{ href, label? }` | no | https; not with `demo` (unchanged) |
| `source` | URL | no | https |
| `image` | `{ src, alt }` | no | sharing image (unchanged) |
| `invitation` | text | no | **new**; trimmed; empty or absent means the standard sentence |
| `draft` | boolean | default `false` | |

**Removed keys** (each fails as an unrecognized key naming it): `order`, `comparison` (and with
it `caption`, `constraints`, `options`, `fit`, `pros`, `cons`, `chosen`, `reason`),
`demo.embed`, and visual kind `clip` (`poster`, `label`).

Body: plain Markdown in four parts (see Part). Allowed: paragraphs, lists, tables, links,
emphasis, code, headings level 3 and below, MDX comments. Not allowed: level-1 headings, MDX
elements (any `<Tag>`), `import` / `export`, body images.

## PartPicture (value in `visuals`)

| Field | Type | Required | Rule |
|---|---|---|---|
| `kind` | `image` \| `diagram` | yes | |
| `src` | image | yes | relative to the project file; must exist (generateId check, unchanged) |
| `alt` | text | yes | |
| `description` | text | diagram only | visible caption, linked by `aria-describedby` |
| `placeholder` | boolean | no | shows "Placeholder" mark (unchanged) |
| `part` | `problem` \| `options` \| `build` \| `lessons` | no | **new**; at most one picture per part across the record |

A picture with no `part` is allowed and not shown in the story (for example one kept only for
reference beside the list picture).

## Part

One of four, in this order, each a level-2 heading with exactly this text:

| Id | Heading | Page extras |
|---|---|---|
| `problem` | Problem | picture if assigned; the first picture on the page loads eagerly |
| `options` | Options | picture if assigned; the Options table is rendered from the checked OptionsComparison |
| `build` | Build | picture if assigned; BuildLinks after the text when `demo`, `standIn` or `source` is set |
| `lessons` | Lessons | picture if assigned |

Defined once in `src/lib/content/parts.ts` (`partIds`, `partHeadings`), used by the schema
enum, the story check, the mdast plugin and the components.

## OptionsComparison (parsed from the Options part, never written as data)

Produced by `validateProjectStory(file, body)`; passed to the page through
`Astro.locals.project.comparison`.

```text
OptionsComparison {
  optionHeader: string            // the table's first header cell text
  constraints: Constraint[]       // header cells 2..n, in order
  options: Option[]               // body rows, in order
}
Constraint { label: string }      // equals the bold label of the matching list item
Option {
  name: string                    // text of the first cell (bold markers removed)
  chosen: boolean                 // first cell is entirely one strong node
  fits: ("yes" | "partly" | "no")[]   // one per constraint, lower-cased
}
```

Invariants (each a contract row): at least one constraint and one option; every row has
exactly `1 + constraints.length` cells; option names unique and constraint labels unique;
exactly one `chosen`; the constraint list before the
table has the same labels in the same order; the first block after the table is a paragraph
starting "Why". The explanation after each label and the "Why" sentence stay ordinary Markdown
and are rendered as written.

## Template (`src/content/projects/_template.mdx`)

A Project file with `draft: true`, placeholder text in every required field, one example
diagram in `visuals` with `part: build` (image file `src/content/projects/images/template/diagram.svg`),
an example `invitation`, the four parts, a two-item constraint list and a two-option table with
one bold option and a "Why" line. Placeholder text is written as instructions, links use
example.com addresses, and MDX comments name the optional details and what to replace or
delete. Excluded from the collection by the loader's `!**/_*`
pattern; checked by a unit test and by a fixture build of a renamed copy.

## Derived: published projects and order

`selectPublishedProjects(entries, env)`: drops drafts in the production build only (unchanged),
then sorts by `date` descending, then `title` ascending, then slug (`order` removed).

## State: draft to published

Unchanged mechanism: `draft: true` builds only outside production and shows the draft notice;
`draft: false` publishes. This feature sets all five projects to `draft: true`; publishing each
is Don's follow-up.
