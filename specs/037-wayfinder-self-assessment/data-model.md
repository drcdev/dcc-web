# Data model: Wayfinder self-assessment

**Feature**: `037-wayfinder-self-assessment` | **Plan**: [plan.md](./plan.md)

Two kinds of data: **authored content** (one YAML file, validated at build, rendered into the
post) and **reader state** (answers and results, which exist only in the reader's page and in
the results link fragment). No database, no browser storage, no server state.

## 1. Authored content: `assessments` collection

File: `src/content/assessments/<id>.yaml`. The file name is the entry id (`wayfinder`).
Schema: `src/content/schemas/assessment.ts`, strict objects throughout (an unknown key fails the
build). Full field rules and error rows: [contracts/assessment-data.md](./contracts/assessment-data.md).

### Assessment

| Field | Type | Rule |
|-------|------|------|
| `title` | text | Heading of the assessment block (e.g. "Where do you sit?"). Required. |
| `intro` | text | One or two plain sentences, including that this is a reflection aid, not a validated instrument (spec Assumptions). Required. |
| `scale` | 5 texts | The five answer labels, low to high. First is "Rarely", last "Almost always" (FR-003). Exactly five, distinct. |
| `shifts` | 5 × Shift | Exactly five, in the post's order. Ids distinct. Anchors distinct. |

Derived at build (not authored):

| Value | Rule |
|-------|------|
| `version` | First 8 hex chars of SHA-256 over `JSON.stringify(shifts.map(s => [s.id, s.statements]))` (research R5). |

### Shift (mindset shift)

| Field | Type | Rule |
|-------|------|------|
| `id` | slug | `^[a-z0-9]+(-[a-z0-9]+)*$`, used in `<PracticalApplication shift="...">`. |
| `name` | text | e.g. "See the Whole System". |
| `from` | text | The "From" wording, e.g. "Fixing individual problems in isolation". |
| `to` | text | The "To" wording. |
| `anchor` | slug | The id of the shift's heading in the post. Checked at build against the rendered headings of every post that renders `<SelfAssessment assessment="<id>">` (contract row A6). |
| `practicalApplication` | text | The Practical Application paragraph, moved unchanged from the post. Plain text (no Markdown). |
| `statements` | 3 × text | Exactly three; each worded so agreeing places the reader nearer `to` (FR-002). |

### Relationships

- A **post** uses an assessment by naming its id in one or more of the two components
  (`PracticalApplication`, `SelfAssessment`). An unknown id or shift id fails
  the build naming the post file (contract rows A4, A5).
- The **mindsets to develop** in the results and the **printed focus areas** reuse each listed
  shift's `name`, `from`, `to`, `practicalApplication` and `anchor`. The data file has no week
  activities and no integration week: the six-week plan was removed on 2026-10-11 (spec
  Clarifications, PR #176 decisions); the strict schema now rejects those keys as unknown.

## 2. Reader state (browser only)

None of these is ever sent over the network, logged, or written to cookies or browser storage
(FR-012, FR-016).

### Answer

| Field | Type | Rule |
|-------|------|------|
| shift index | 0–4 | Position of the shift in the data file. |
| statement index | 0–2 | Position within the shift. |
| value | 1–5 | Index into `scale` plus one. Unanswered is absent. |

Held only in the form's radio state.

### Result

| Field | Type | Rule |
|-------|------|------|
| `version` | 8 hex | The statement set version the answers were made with. |
| `date` | calendar date | Local date the result was shown (`YYYY-MM-DD`). |
| `sums` | 5 × int 3–15 | Sum of each shift's three answers. |

Derived values (pure functions in `src/lib/assessment/score.ts`):

| Value | Rule |
|-------|------|
| `score(shift)` | `sum / 3`, shown to one decimal (`2.3 of 5`) (FR-005, FR-007). |
| `band(shift)` | `low` when `sum < 9` (score below 3); `middle` when `sum = 9`; `high` when `sum > 9`. Comparing sums avoids floating-point edge cases at exactly 3. |
| band phrase | low → `nearer 'From' (<from>)`; middle → `in the middle`; high → `nearer 'To' (<to>)` (FR-007). |
| low-band shifts | Shifts with band `low`, in data order (FR-008). If none: "no low band" message naming the lowest-scoring shift, ties to the earlier shift in data order. |

### Comparison (earlier result + new result)

| Case | Rule |
|------|------|
| same `version` | Comparable: chart shows both markers per shift; summary gives the change per shift as `up 0.7`, `down 0.3` or `no change`, computed from sums (`(new - old) / 3`, one decimal) (FR-013). |
| different `version` | Not comparable: the two results are shown separately (two charts, two summaries) with no change per shift; the earlier one is marked "made with an earlier set of questions" (FR-014). |

### Earlier result

The Result decoded from the results link fragment on load
([contracts/results-link.md](./contracts/results-link.md)). Shown at once, marked "Earlier
result from <date>". Replaced as "the result in the address bar" by the newest result each time
results are shown; the on-page "earlier" result stays the one loaded from the link until the
reader clears or reloads.

### Focus areas (results and print)

Built from the newest Result shown (FR-008, FR-010):

| Part | Rule |
|------|------|
| Shifts | The shifts with `sum < 9` (mean below 3), sorted by `sum` ascending; ties keep data order (stable sort). With none, the single lowest-scoring shift (first in data order on a tie), after the lines "None of your scores is below the middle." and "Next to practise: <name>". |
| Each shift | "<name>: <score> of 5", "<from> → <to>", the `practicalApplication` text, and a link: in the results "Read <name>" to `#<anchor>`; on the sheet "Read <name>: <page address>#<anchor>". |
| Sheet only | Before the shifts: assessment title, the result date, the heading "Mindsets to develop". After them: "Results link: <url>". Nothing else. |

## 3. State transitions (the assessment block)

```text
            load (no fragment)                 load (#result=… valid)
                  │                                     │
                  ▼                                     ▼
              [Empty] ──show (incomplete)──▶ [Errors]   [Earlier shown]
                  │                     ◀──answer──┘        │
                  │ show (complete)                         │ show (complete)
                  ▼                                         ▼
              [Result shown] ◀──change + show──┐     [Compared] or [Shown separately]
                  │                            │     (same version)   (other version)
                  └────────────────────────────┘
   any state ──clear──▶ [Empty]   (answers reset, earlier result dropped, fragment removed,
                                   focus sheet and root print attribute removed)
   load (#result=… malformed) ──▶ [Empty] + "This results link could not be read."
```

Every transition into a shown state: replaces the fragment with the newest result's
(`replaceState`), rebuilds the chart, summary, mindsets to develop and focus sheet, sets the root
print attribute, and updates the live region.
