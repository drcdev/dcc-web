# Data model: Design directions for the portfolio

All of this is build-time TypeScript in `src/prototypes/portfolio/`, used only by the prototype
pages and removed with them before merge. It is not a content collection (content collections
are out of scope; see plan.md Complexity Tracking). The shapes are a sketch the real portfolio
feature can learn from, not a commitment.

## Types (`src/prototypes/portfolio/types.ts`)

### `ProjectStatus`

`"shipped" | "experiment" | "in-progress"`. Display labels: "Shipped", "Experiment",
"In progress". Each status has one colour-coding class (palette tokens only).

### `Theme`

A plain string label such as "AI integration", "Developer tools", "Mobile", "Web", "Design
systems", "Productivity". The theme list shown by a filter is derived from the entries, sorted,
with no duplicates.

### `ProjectEntry` (index entry; Key Entities "Sample project" and "Other project entry")

| Field | Type | Rule |
|---|---|---|
| `slug` | string | `^[a-z0-9-]+$`, unique across entries |
| `title` | string | non-empty |
| `problem` | string | one sentence, ≤ 140 characters, ends with a full stop |
| `visual` | `Visual` | required; the index visual (placeholder frame or diagram) |
| `themes` | `Theme[]` | 1–4, unique |
| `status` | `ProjectStatus` | required |
| `storyPath` | string \| undefined | set only for Focus Pocus; the direction prefixes it |
| `externalHref` | string | the drc.dev project page (`https://drc.dev/projects/<slug>`) |
| `reviewNote` | string | "Themes and status are a draft for Don's review." |

### `Visual`

A discriminated union:

- `{ kind: "diagram"; id: "architecture" | "options"; label: string; description: string }`
  rendered by an inline SVG component with `role="img"`, `aria-labelledby` naming `label`, and
  `description` as visible or linked text.
- `{ kind: "placeholder"; media: "screenshot" | "clip"; label: string; description: string }`
  rendered as a bordered frame that visibly says "Placeholder" followed by `label`, with
  `description` as text (FR-012). A `clip` placeholder never autoplays (there is no media).

### `StoryStage`

| Field | Type | Rule |
|---|---|---|
| `id` | `StageId` | one of `problem`, `constraints`, `options`, `built`, `outcome`, `lessons`, `invitation` |
| `heading` | string | plain language, e.g. "The problem", "What made it hard" |
| `body` | string[] | paragraphs; may be empty only for `invitation` |
| `visual` | `Visual` \| undefined | shown beside this stage; absent means no gap is left |
| `draft` | `true` | every stage is marked "Draft for review" (FR-003) |

`StageId` order is fixed by `STAGE_ORDER` (FR-010). Each id maps to one accent class for
colour-coding: problem → rust, constraints → sand, options → lavender, built → sage, outcome →
mist, lessons → mauve, invitation → accent. Shades per theme are chosen to pass AA.

### `StoryOption`

| Field | Type | Rule |
|---|---|---|
| `id` | string | slug, unique within the story |
| `name` | string | e.g. "AppleScript bridge", "OmniFocus URL scheme", "JXA scripts behind an MCP server" |
| `summary` | string | one or two sentences |
| `pros` / `cons` | string[] | at least one each |
| `fit` | `Record<ConstraintId, "meets" \| "partly" \| "misses">` | used by direction C's table |
| `chosen` | boolean | exactly one option is `true` |
| `reason` | string \| undefined | required when `chosen`; why it was picked |

### `Constraint`

`{ id: ConstraintId; label: string; detail: string }`. Drafted from the project: macOS-only
automation surface, natural-language dates, bulk operations without slowing OmniFocus, and
working inside Claude Desktop's MCP model.

### `Demo`

| Field | Type | Rule |
|---|---|---|
| `live` | boolean | `false` for Focus Pocus |
| `href` | string | `https://drc.dev/projects/focus-pocus` (the stand-in target) |
| `secondaryHref` | string | `https://github.com/drcdev/focus-pocus` |
| `standInNote` | string | "Focus Pocus has no live demo. This link opens its project page instead." (FR-014) |
| `still` | `Visual` | placeholder frame shown in place of an embed |

### `SampleStory`

`{ entry: ProjectEntry; stages: StoryStage[]; constraints: Constraint[]; options: StoryOption[]; demo: Demo }`

### `Direction`

| Field | Type | Rule |
|---|---|---|
| `key` | `"a" \| "b" \| "c"` | route segment |
| `name` | string | "Timeline", "Cards", "Chapters" |
| `summary` | string | one sentence for the hub page and decision document |
| `indexPath` | string | `/design/portfolio/<key>/` |
| `storyPath` | string | `/design/portfolio/<key>/focus-pocus/` |
| `behaviours` | `{ stages; options; demo; reveals: string }` | the four behaviours, in plain words |
| `javascript` | string[] | islands used: `"filter"`, and `"option-tabs"` for B |
| `newResources` | string[] | empty unless the direction needs a colour or typeface the site lacks (FR-005) |

## Sample data (`src/prototypes/portfolio/sample.ts`)

- `focusPocus: SampleStory`: the seven stages, 3 constraints or more, 3 options with one
  chosen, the demo stand-in, visuals: architecture diagram beside `built`, options diagram
  beside `options`, placeholder screenshot beside `problem`, placeholder clip beside `outcome`;
  `constraints` and `lessons` have no visual (exercises the "no empty gap" edge case).
- `otherEntries: ProjectEntry[]`: Tempo, Flux, drc.dev, Plunge Buddy.
- `allEntries = [focusPocus.entry, ...otherEntries]`.
- `directions: Direction[]`: A, B, C.

## Invariants (unit-tested in `tests/unit/prototypes/portfolio/sample.test.ts`)

1. `focusPocus.stages.map(s => s.id)` equals `STAGE_ORDER` exactly.
2. Every stage has `draft: true`.
3. Exactly one option has `chosen: true`, and it has a non-empty `reason`.
4. Every option's `fit` has a value for every constraint id.
5. Only Focus Pocus has `storyPath`; the others do not.
6. `allEntries` slugs are unique and match `^[a-z0-9-]+$`.
7. Across `allEntries`, every `ProjectStatus` appears at least once and there are ≥ 4
   distinct themes.
8. Every `problem` is one sentence of at most 140 characters.
9. Every placeholder `Visual` has a non-empty `label` and `description`.
10. `focusPocus.demo.live === false` implies a non-empty `standInNote`.
11. `directions` has exactly three entries with keys `a`, `b`, `c`, and every
    `newResources` array is present (possibly empty).

## Filter rule (`src/prototypes/portfolio/filter.ts`)

- `themesOf(entries): Theme[]`: sorted unique themes.
- `matches(entry, theme | null): boolean`: `true` when `theme` is `null` (no filter) or the
  entry lists that theme exactly (case-sensitive label match).
- `parseThemeParam(search: string, known: Theme[]): { theme: Theme | null; unknown: boolean }`:
  reads `?theme=`; an unknown value yields `unknown: true` so the island shows the no-match
  message with a clear button (FR-022, spec edge case).
- State: `null` (all shown) ⇄ `theme` (filtered). Clearing returns to `null` and removes
  `?theme=` from the address with `history.replaceState`.

## Contact hand-off (`src/prototypes/portfolio/contact-link.ts`)

`contactHref(slug: string): string` returns `/contact/?project=<slug>`; it throws on a slug
that fails `^[a-z0-9-]+$`. See contracts/contact-handoff.md.
