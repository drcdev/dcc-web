# Data model: The portfolio

All data is build-time content: one MDX file per project in `src/content/projects/`, validated by
`projectSchema({ image })` (`src/content/schemas/project.ts`, Zod via `astro/zod`, every object
strict so an unknown setting fails). Derived values are computed at build time in
`src/lib/projects.ts` and `src/lib/content/*`. The authoring view of the same model is
[contracts/project-file.md](./contracts/project-file.md); errors are in
[contracts/build-errors.md](./contracts/build-errors.md).

## Project (collection entry)

| Field | Type | Required | Rules |
|---|---|---|---|
| *slug* (entry id) | string | derived | File name without `.mdx`; `^[a-z0-9-]{1,64}$`; unique across the collection; one level only. Address `/projects/<slug>/`. |
| `title` | string | yes | Trimmed, non-empty. Main heading, row title, link name. |
| `problem` | string | yes | One sentence: ends with `.`, `?` or `!`, no sentence break inside, ≤ 140 characters. |
| `description` | string | yes | Sharing / meta description. |
| `themes` | string[] | yes | 1–4 items, each non-empty; no two equal after normalising (see Theme). |
| `status` | enum | yes | `shipped` \| `experiment` \| `in-progress`; labels "Shipped", "Experiment", "In progress". |
| `visual` | IndexVisual | yes | The index row visual: `{ src: image(), alt, placeholder? }`. |
| `order` | integer ≥ 1 | no | Index order, ascending, before unordered projects. |
| `date` | date | no | Used for "most recent first" fallback. |
| `demo` | Demo | no | Live demo on drc.dev. Not together with `standIn`. |
| `standIn` | StandIn | no | Page that stands in for a demo. |
| `source` | https URL | no | Source-code address, any host, HTTPS only. |
| `image` | `{ src: image(), alt }` | no | Sharing image (resized to 1200 px PNG). |
| `draft` | boolean | no (false) | Excluded from production builds; marked "Draft" elsewhere. |
| `visuals` | record<name, Visual> | no | Named visuals referenced from the body. Name `^[a-z][a-z0-9-]*$`; `demo` is reserved. |
| `comparison` | Comparison | yes | The option comparison for the options chapter. |
| *body* | MDX | yes | The story, written with building blocks (below). |

Invariants (checked by schema `superRefine` or build-time checks):

1. `demo` and `standIn` are never both set.
2. If a chapter uses `visual="demo"`, `demo.embed` is `true`.
3. Every visual name used in the body exists in `visuals` (or is `demo`).
4. Two files never share a slug (`.md`/`.mdx` twins or nested files fail); the slug never clashes
   with another route: once `/projects/` leaves `futureDestinations` (`src/config/navigation.ts`),
   the existing address check in `src/lib/content/address.ts` treats the `src/pages/projects/[slug].astro`
   route as the owner of the `/projects/` prefix, so a page file there fails. `address.ts` itself
   needs no change.
5. Every image and clip path resolves to a file (named in the error).
6. The schema and the body check run on **every** collection entry, drafts included, in every
   build mode; draft filtering happens only after validation (FR-073).

## IndexVisual / Visual

`kind` discriminates; `placeholder: true` on any kind shows a visible "Placeholder" mark.

| Kind | Fields | Rules |
|---|---|---|
| `image` | `src: image()`, `alt` | `alt` non-empty. |
| `diagram` | `src: image()` (SVG or raster), `alt`, `description` | `description` non-empty; rendered visibly and linked by `aria-describedby`. |
| `clip` | `src` (relative `.webm`/`.mp4`), `poster: image()`, `label`, `description` | File exists, ≤ 5 MB; rendered `<video controls muted playsinline preload="none">`, never `autoplay`. |

The index `visual` accepts `image` and `diagram` only (no clip on the index).

## Demo and StandIn

| Entity | Fields | Rules |
|---|---|---|
| Demo | `href`, `title?`, `embed?` (default false) | `href` HTTPS on `drc.dev` or a subdomain (`^https://([a-z0-9-]+\.)*drc\.dev(/|$)`). Link text "Open the <title or project title> demo". Embed is a lazy, sandboxed `<iframe>` with a `title`. |
| StandIn | `href`, `label?` | HTTPS. Shown with the note "This is not a live demo." |
| Source | `source` (URL) | HTTPS. Link text "Source code for <title>". Shown only in the built chapter. |

## Comparison, Constraint, Option

```text
comparison:
  caption?: string                 # default "Options considered, compared against the constraints"
  constraints: Constraint[]        # ≥ 1
  options: Option[]                # ≥ 1 (≥ 2 expected, not enforced)

Constraint: { id: ^[a-z][a-z0-9-]*$ (unique), label, detail? }
Option:     { id (unique), name, summary, fit: record<constraintId, Fit>,
              pros?: string[], cons?: string[], chosen?: boolean, reason?: string }
Fit:        "meets" | "partly" | "misses"   → "Meets" / "Partly meets" / "Does not meet"
```

Invariants: exactly one option has `chosen: true`; that option has a non-empty `reason`; no other
option has a `reason`; every option's `fit` has exactly the constraint ids (no missing, no extra);
the "In its favour" and "Against it" rows render only when some option has `pros` / `cons`
(a missing list renders an empty cell, never an error).

## Stage and Chapter

The seven stages are a constant in `src/lib/content/stages.ts`:

| Order | `stage` id | Heading |
|---|---|---|
| 1 | `problem` | The problem |
| 2 | `constraints` | What made it hard |
| 3 | `options` | Options considered |
| 4 | `built` | What I built |
| 5 | `outcome` | How it turned out |
| 6 | `lessons` | What I'd do differently |
| 7 | `invitation` | Have a problem like this? |

A Chapter renders `<section id="<stage>" aria-labelledby="<stage>-heading">` with "Chapter N of
7", an `h2`, the slotted body and the optional visual. A `draft` flag on a chapter shows a visible
"Draft for review" mark (FR-082); it is independent of the project-level `draft` setting, so
Focus Pocus is published (`draft: false`) with its draft chapters and placeholder visuals marked. Headings are not overridable per project
(Don changes the wording in `stages.ts`).

## Theme (derived)

```text
themeKey(raw)   = raw.trim().replace(/\s+/g, " ").toLowerCase().replace(/ /g, "-")
Theme           = { key, label }   label = first spelling seen, in index order
themesOf(list)  = unique by key, sorted by label (localeCompare)
parseThemeParam(search, known) → { key | null, unknown: boolean }   (value normalised with themeKey)
```

## Status

`shipped` → "Shipped", `experiment` → "Experiment", `in-progress` → "In progress". Rendered as a
`StatusPill` with text; tone is decorative.

## Derived: published projects and order

```text
getPublishedProjects(env) = collection
  .filter(p => !(isProductionBuild(env) && p.data.draft))
  .sort(by order asc (defined first) → date desc (defined first) → title)
isProductionBuild(env) = env.WORKERS_CI === "1" && env.WORKERS_CI_BRANCH === "main"
contactHref(slug) = `/contact/?project=${slug}`   (slug must match ^[a-z0-9-]{1,64}$)
```

## State: draft lifecycle

```text
draft: true  --(production build)--> not built, not listed, not in sitemap
draft: true  --(local / test / preview build)--> built, row and story marked "Draft"
draft: false --> built everywhere
```

## Error type

`projectFileError(file, problem)` → `PageContentError("Project file <path>: <problem>")` and
`projectFilesError(a, b, problem)` in `src/lib/content/errors.ts`, beside the page variants.
Schema errors come from Astro's content validation, which already names the entry and file.
