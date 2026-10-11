# Data model: This site as a project story

No new entity, field or schema. The feature adds one entry to the existing `projects`
collection (`src/content/schemas/project.ts`, documented in `docs/projects.md`). This file
records the values that entry takes.

## Project story entry: `doncoleman-ca`

File `src/content/projects/doncoleman-ca.mdx`, address `/projects/doncoleman-ca/`.

| Field | Value | Source |
|---|---|---|
| `title` | `doncoleman.ca` | FR-013 |
| `problem` | One sentence, at most 140 characters, ending `.`, from the "Why rebuild the site" answer | FR-010, schema |
| `description` | One summary sentence for search and link previews | schema |
| `themes` | `[Agentic development, Web, Static sites]` (all existing theme names) | FR-013 |
| `status` | `shipped` | FR-007 |
| `date` | `2026-09-28` | FR-007 |
| `visual` | `kind: image`, `src: ./images/doncoleman-ca/index.png`, `alt` describing the light-mode home page | FR-014, research R3 |
| `visuals.screenshot` | Same picture and alt as `visual`, `part: problem` | FR-006 (drcdev and Flux precedent) |
| `visuals.pipeline` | `kind: diagram`, `src: ./images/doncoleman-ca/pipeline.svg`, `alt`, `description`, `part: build` | FR-006, research R4 |
| `source` | `https://github.com/drcdev/dcc-web` | FR-005 |
| `demo`, `standIn`, `replacedBy`, `image` | absent | research R2 |
| `invitation` | One sentence in Cadence's style, aimed at teams weighing agent-driven delivery with human review | FR-013 |
| `draft` | `true` | FR-011 |

## Body

A `{/* ... */}` notes comment first (where the facts come from, the 2026-10-11 public check of
the repository, why there is no demo link), then exactly four `##` parts in order:

1. **Problem**: why the site was rebuilt (own it in a repo; cheaper, simpler hosting; room for
   consulting work). Not framed as an agent experiment.
2. **Options**: a constraint list of four bold labels, then one table whose constraint columns
   are the same four labels in the same order, three option rows with exactly one in bold, then
   a paragraph starting `Why`.
   - Constraints: agents know the stack well; static by default; under $13 a month; keeps the
     Flux look (exact label wording settled in implementation, kept identical in list and table).
   - Options: stay on Ghost with the Flux theme; Astro on GitHub Pages or Vercel;
     **Astro on Cloudflare Workers** (chosen).
   - Cells: `Yes`, `Partly` or `No` only.
3. **Build**: the four pipelines and their phases in fresh subagents, with a link to
   `/projects/cadence/` where it says where they came from (FR-008); the constitution; the
   single-approval rule and the separate agent account; the gate work from about 31 minutes to
   about 6, and the port collisions and machine load of parallel worktrees (the hardest part).
4. **Lessons**: tests should check what matters (#55, #97); the gate sets the pace; Don's quote
   kept close to verbatim.

## Validation (all existing)

The strict schema and the four-part and Options checks in `src/lib/content` fail the build on
any breach (`docs/projects.md` "Build errors you may see"). Diagram files are held to the rules
in `tests/unit/site/diagram-fonts.test.ts` and `tests/e2e/diagram-fonts.spec.ts`.

## State

`draft: true` at merge: present in every non-production build, marked as a draft;
absent from production. Don flips it to `false` in a later, separate change (out of scope).
