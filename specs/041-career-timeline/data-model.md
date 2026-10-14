# Data model: Interactive career timeline

## Career step (collection `career`)

One YAML file per step in `src/content/career/`. The entry id is the file name without extension.
Schema: `src/content/schemas/career.ts` (strict object; any other key fails the build).

| Field | Type | Required | Rule |
|---|---|---|---|
| `role` | text | yes | Trimmed, non-empty, at most 120 characters. |
| `organization` | text | yes | Trimmed, non-empty, at most 120 characters. |
| `start` | `YYYY-MM` string | yes | A real month (01–12). |
| `end` | `YYYY-MM` string or `present` | yes | Not before `start`. |
| `scope` | text | yes | FR-003. At most 300 characters. Missing scope fails the build naming the file. |
| `decision` | text | no | "Key decision". At most 300 characters (as every detail part). |
| `changed` | text | no | "What changed in how I worked". |
| `wish` | text | no | "What I wish I'd known". |
| `nextMove` | text | no | "The skill that led to the next move". Forbidden on the current role (cross-file rule C2). |
| `achievements` | text[] | no | Category Achievements. Each item at most 200 characters. Empty list is an error (leave the key out). |
| `leadership` | text[] | no | Category Leadership. Same rule. |
| `awards` | `{ name: text, year: integer, href?: https URL }[]` | no | Category Awards. Same rule. `name` at most 200 characters and without the year (the year shows after it: "Name (2024)"). |
| `posts` | `reference("posts")[]` | no | Each a post file name. Must exist and not be a draft (C3, C4). No duplicates. |

Text fields are trimmed, non-empty plain text, not Markdown; they render as text only, never as
markup, and line breaks are not kept (spec FR-003a, FR-003b). Items, awards and posts render in
file order. A file that cannot be parsed fails the build naming it; with no files at all the
timeline renders nothing (the fixture site relies on this; the real six are guarded by
`career-launch.test.ts`).

### Cross-file rules (`src/lib/content/career.ts`, run when the About page builds)

- **C1** Ordering: steps sort by `start` ascending, ties by id. The last is the **current role**
  (spec FR-001a); this is the only definition of it.
- **C2** The current role has `end: present` and no `nextMove`.
- **C3** Every `posts` entry names an existing post file.
- **C4** No `posts` entry names a draft post (any build mode).

Each failure names the step file (`Career step file src/content/career/<id>.yaml: …`), the field
and, where there is one, the offending value (spec FR-005a). See
`contracts/build-errors.md`.

## Category

A fixed list of three, in this order: Achievements, Leadership, Awards. Each maps to one step key.
A category appears in the filter only when at least one step has an item of it.

## Derived: timeline view (what the component renders)

`getCareerTimeline()` (`src/lib/career.ts`) reads the collection, runs C1–C4, and returns:

- `steps`: in order, each with `id`, `role`, `organization`, `start`, `end`, a display `period`
  ("Oct 2014 – Sep 2016"), `parts` (only those present, in the fixed label order), `achievements`,
  `leadership`, `awards`, and `posts` resolved to `{ title, href }` from `getPostSummaries()`.
- `categories`: the used categories, in the fixed order.

The component accepts a `timeline` prop that replaces the lookup (component tests use it).

## Client state (filter)

| State | Steps | Items | Status line |
|---|---|---|---|
| All (default) | Every step closed (on choosing All, including hand-opened ones) or as the visitor left them (on load); none dithered | none marked | "Showing all N roles." (not announced on load) |
| Category K | Matching steps open, others closed and `data-dithered` | matching items `data-match` | "M of N roles have k." or, when M is 1, "1 of N roles has k." (k = category in lower case) |

Not stored in the address, cookie or storage; a reload starts from All. The visitor may open or
close any step at any time; that does not change the filter. Every filter change is applied fresh
to every step (spec FR-012a); choosing the already-selected choice does nothing and announces
nothing. Focus stays on the chosen button; if focus was inside a step's content that the change
closes, it moves to that step's `<summary>` (spec FR-013a, FR-013b). With no used category, no
filter or status line is rendered.

## Launch content (FR-006a)

Six files, content exactly as spec FR-006a's two tables, with no reflection parts other than the
one `decision` on Manager, Enterprise Systems Development. Proposed file names:

1. `leader-systems-engineer.yaml`
2. `manager-enterprise-systems-development.yaml`
3. `project-director-enabling-technologies.yaml`
4. `cchl-vancouver-island-chapter.yaml`
5. `cloud-architect-it-project-manager.yaml`
6. `director-data-infrastructure-and-architecture.yaml`

Step 5's four related posts are named by their post file names. Step 4's two awards link to the
same CCHL articles the About page's Recognition section already uses; step 5's award has no link.
