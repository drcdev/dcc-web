# Data model: Retired status for projects

Extends the `projects` collection model of `specs/014-project-four-part-story/data-model.md`.
Only the changes are listed; every other setting is as before.

## Project (changed)

| Setting | Required | Type | Change |
|---|---|---|---|
| `status` | yes | `"shipped" \| "experiment" \| "in-progress" \| "retired"` | gains `retired` (FR-001) |
| `replacedBy` | no | Replacement (below) | new (FR-006) |

No retired date is recorded; `date` stays the project's own date and keeps setting the index
order (newest first, then title, then file name). Status never affects order, publication or
theme filtering (FR-002).

### Validation rules (schema, `src/content/schemas/project.ts`)

| Rule | Message (path `replacedBy` unless noted) | Contract row |
|---|---|---|
| `status` not one of the four values | Zod's enum message, which lists all four values (path `status`) | S02 (changed) |
| `replacedBy` present and `status` is not `retired` | `only a retired project can name a replacement: set status: retired, or remove replacedBy` | RP01 |
| `replacedBy` has both `project` and `name`, or neither | `replacedBy needs either project (the file name of a project on the site) or name (with an optional href), not both` | RP02 |
| `replacedBy` has `href` together with `project` | `href goes with name: a project on the site is linked to its own page` (path `replacedBy.href`) | RP02 |
| `replacedBy.href` not https | `use an address that starts with https://` (existing `httpsUrl`) | RP03 |
| `replacedBy` has an unknown key | strict object: Zod names the key | RP03 |
| `replacedBy.name` empty or whitespace-only (trimmed, `requiredText`) | existing `requiredText` message | RP03 |
| `replacedBy` present with no value (YAML null) | Zod's type message (expected an object) | RP03 |
| `replacedBy: {}` (no fields) | the RP02 "either project ... or name" message | RP02 |

`replacedBy.name` has no maximum length and is rendered as escaped text. `replacedBy.href`
uses the existing `httpsUrl` (a full URL, `https` scheme only). `project` matches a project
file name exactly (the entry id, lower case like every project file name).

Order: the schema runs during content sync, before any route, so a file that breaks a schema
rule and a replacement rule reports the schema rule first (contracts/build-errors.md). A
replacement that is itself retired, and two projects naming each other, are allowed and not
checked.

### Validation rules (collection, `src/lib/content/project-replacement.ts`)

Run by `checkReplacements(entries)` in the story route's `getStaticPaths()`, over every entry,
drafts included. Each failure is a `projectFileError` ("Project file <path>: ...").

| Rule | Message after the file prefix | Contract row |
|---|---|---|
| `replacedBy.project` names no project file | `replacedBy names the project "<id>", but there is no project file src/content/projects/<id>.mdx. Use the file name of a project on the site, or name: (with an optional href) for anything off the site.` | RP04 |
| `replacedBy.project` names the project itself | `replacedBy names this project itself. Name the project that replaced it, or remove replacedBy.` | RP05 |

## Replacement (new)

One of two forms; exactly one of `project` or `name`.

| Form | Fields | Meaning |
|---|---|---|
| On the site | `project`: the file name (entry id) of another project, typed by Astro `reference("projects")` as `{ collection: "projects", id }` | Linked to that project's story when it has a page in this build |
| Off the site | `name`: plain text, required; `href`: https address, optional | Linked to `href` when given, else named in plain text |

## Derived: ResolvedReplacement (new)

`resolveReplacement(entry, allEntries, publishedIds)` returns `{ name: string; href?: string }`
or `undefined`. It is computed in the route and handed to `ProjectLayout` and `StoryHeader` as
the `replacement` prop.

| `replacedBy` | Build | `name` | `href` |
|---|---|---|---|
| none | any | (returns `undefined`) | |
| `project: x`, x published | any | x's `title` | `/projects/x/` |
| `project: x`, x a draft | includes drafts (every build but production) | x's `title` | `/projects/x/` |
| `project: x`, x a draft | production | x's `title` | none |
| `name: N`, `href: H` | any | N | H |
| `name: N` | any | N | none |

## Derived: status presentation (new module `src/lib/content/project-status.ts`)

| Status | Label | Pill tone |
|---|---|---|
| `shipped` | Shipped | sage |
| `experiment` | Experiment | lavender |
| `in-progress` | In progress | rust |
| `retired` | Retired | mauve (new) |

## Pill tone `mauve` (new, `src/components/Pill.astro`)

| Theme | Background | Border | Text |
|---|---|---|---|
| light | `mauve-50` | `mauve-800` | `mauve-950` |
| dark | `mauve-800` | `mauve-300` | `mauve-100` |

Contrast (computed from the tokens, research R6; thresholds FR-004): light text 17.4:1 on
the fill, light border 12.9:1 against the white page; dark text 10.2:1 on the fill, dark
border 7.9:1 against the dark page (`dusk-BASE`). The dark fill alone is only 1.3:1 against
the dark page, which is why the mauve-300 border carries the pill's edge in dark mode.

Used only by the Retired status. Theme pills stay `neutral` (white or `dusk-900` fill).

## Real content change

`src/content/projects/tempo.mdx`: `status: shipped` becomes `status: retired`, and
`replacedBy:` with `name: Cadence` (no `href`) is added. Still `draft: false`.

## Fixture content (new)

`tests/fixtures/projects/retired.mdx`: title "Retired project", `status: retired`,
`replacedBy: { project: minimal }`, `themes: [Automation]`, `date: 2025-01-01`, published,
four parts. Broken fixture `tests/fixtures/projects/broken/RP04-missing-replacement.mdx`: a
draft, `status: retired`, `replacedBy: { project: no-such-project }`.
