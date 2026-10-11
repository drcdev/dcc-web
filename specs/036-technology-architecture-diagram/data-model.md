# Data model: Interactive architecture diagram

**Feature**: `036-technology-architecture-diagram` | **Plan**: [plan.md](./plan.md) |
**Research**: [research.md](./research.md)

Two sources describe a part: a Markdown **part file** (content, Principle VI) and an entry in the
**layout module** (drawing code). They share the part id. Nothing is stored at run time.

## 1. Part file (`src/content/architecture/<id>.md`, collection `architecture`)

| Field | Type | Rule |
|---|---|---|
| id | string (from the file name) | lower-case kebab-case, unique; it is the entry's `id` and the page fragment (FR-009) |
| `name` | non-empty string | the part's label in the diagram and its entry heading; plain language (FR-013) |
| `source` | optional string | repository-relative path to a file or folder; no leading `/`, no `..`; must exist and be tracked by git (FR-006, FR-007) |
| body | Markdown | the explanation: a few sentences (FR-004, FR-013); must not be empty |

Schema: `z.strictObject({ name, source })` in `src/content/schemas/architecture.ts`; unknown keys
fail. The path rules run in the loader's `generateId` (`assertPartSource`), so the build error
names the file. See [contracts/part-files.md](./contracts/part-files.md).

Derived (never authored):

- `sourceUrl` = `REPOSITORY_URL` + `/blob/main/` (file) or `/tree/main/` (folder) + `source`.
- `connectsTo` = the outgoing connections from the layout, rendered as the "Connects to" line.

## 2. Layout module (`src/lib/architecture/layout.ts`)

Pure, typed, no side effects; imported by the component and by unit tests.

```text
Layout {
  viewBox: { width: 240, height: number }
  parts: LayoutPart[]          // in tab / DOM order, top to bottom
  connections: Connection[]
}
LayoutPart {
  id: string                   // matches a part file
  kind: "box" | "group"        // group = a frame around other parts; its link is the frame's tab
  x, y, width, height: number  // the box, or for a group the frame
  tab?: { x, y, width, height }// group only: the clickable label tab
  lines: string[]              // label line breaks; lines.join(" ") === part file `name`
  contains?: string[]          // group only: ids drawn inside the frame (not nested links)
  glyphs?: ("worker" | "database")[] // preview group only: decorative, aria-hidden
}
Connection {
  from: string, to: string     // part ids
  label?: string               // short, at most two lines; also used in "Connects to"
  points: [x, y][]             // polyline; first point on `from`'s edge, last on `to`'s edge
}
```

Invariants (unit-tested, [contracts/diagram-dom.md](./contracts/diagram-dom.md) rows L01–L09):

1. Exactly 12 parts, unique ids.
2. Every shape and label lies inside the viewBox.
3. Boxes do not overlap, except that a group frame contains exactly its `contains` boxes.
4. A connection's first point lies on the edge of `from` and its last on the edge of `to`.
5. Every `from`/`to` names a part.
6. Flow rules (FR-003): every connection into the AI model comes from the Worker API; the inbox is
   reached only from the email path; the email path only from the Worker API; the Worker API
   connects to the bot check; the static pages and the Worker API are reached from the browser
   with labels that distinguish `/api/` requests from everything else; the preview group is not
   connected to any production part.
7. Part labels use the part-label class (15 units), connection labels the connection-label class
   (12.5 units).
8. The set of layout ids equals the set of part-file ids (checked at build in the component, and
   in a unit content test), and each `lines.join(" ")` equals the part file's `name`.
9. Order: parts are listed top to bottom, then left to right, so the DOM and tab order follow the
   picture.

## 3. Initial parts (12)

Ids, names and sources are content and may be reworded in review; the ids are the contract with
the layout.

| id | name (indicative) | kind | source | in group |
|---|---|---|---|---|
| `browser` | Your browser | group (frame) | — (none, by spec) | — |
| `questions-panel` | Questions panel | box | `src/components/post/QuestionsPanel.astro` | browser |
| `contact-form` | Contact form | box | `src/components/sections/ContactForm.astro` | browser |
| `production` | Production | group (frame) | `wrangler.jsonc` | — |
| `static-pages` | Static pages | box | `src/pages` (folder) | production |
| `worker-api` | Worker API | box | `worker/src/index.ts` | production |
| `database` | D1 database | box | `migrations` (folder) | production |
| `ai-model` | Workers AI model | box | `worker/src/questions/generate.ts` | — |
| `bot-check` | Turnstile bot check | box | `worker/src/contact/turnstile.ts` | — |
| `email-path` | Email sending | box | `worker/src/contact/email.ts` | — |
| `inbox` | Contact inbox | box | `wrangler.jsonc` | — |
| `preview` | Preview | group (small, with Worker and database glyphs) | `wrangler.jsonc` | — |

## 4. Initial connections

| from → to | label (indicative) | shows |
|---|---|---|
| browser → static-pages | every other request | only `/api/` runs code (FR-003) |
| questions-panel → worker-api | /api/questions | panel reaches the model only through the API |
| contact-form → worker-api | /api/contact | |
| contact-form → bot-check | widget token | the widget runs in the page |
| worker-api → database | saved questions, budget | |
| worker-api → ai-model | no saved set, budget left | model called only on a miss within budget |
| worker-api → bot-check | verify token | checked before email |
| worker-api → email-path | if accepted | |
| email-path → inbox | one fixed address | nothing stored |

The preview group has no connection; its explanation and its two glyphs say it has its own Worker
and database (FR-002, FR-003).

## 5. Selection state (client only, with JavaScript)

| State | Part link | Entry |
|---|---|---|
| none | no `aria-current` | no `data-selected` |
| selected (fragment names the part) | `aria-current="true"` | `data-selected` |

Transitions: load with a part fragment → selected (no focus move); fragment changes to another
part → previous cleared, new selected, focus moves to the new entry; "Back to diagram" → selection
kept, focus moves to that entry's part link. The URL fragment is the only state.
