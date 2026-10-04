# Data Model: Critical Thinking Questions on Writing Posts

**Feature**: `022-critical-thinking-questions` | **Plan**: [plan.md](./plan.md) |
**Research**: [research.md](./research.md)

Three things hold data: a build-time **question source** file per post (static asset), and two D1
tables in the renamed databases `dcc-web` / `dcc-web-preview` (`question_sets`, `usage_bucket`).
Nothing identifies a reader anywhere (FR-019).

## 1. Question source (static asset, build time)

Path: `/writing/<slug>/question-source.json`, one per post that the build publishes (drafts only
in preview builds). Produced by `src/pages/writing/[slug]/question-source.json.ts` from
`prepareQuestionSource()` (`src/lib/questions/source.ts`).

| Field | Type | Rule |
|---|---|---|
| `slug` | string | The post's id, equal to the URL segment |
| `title` | string | Front-matter title, as on the page |
| `summary` | string | Front-matter summary |
| `text` | string | Prepared plain text of the body (research R4), at most `MAX_INPUT_CHARS` (24,000) characters, cut at a paragraph boundary |
| `hash` | string | 64 lowercase hex chars: SHA-256 of `JSON.stringify([title, summary, body])` over the **raw** body (research R3) |

The post page renders the same `slug` and `hash` as `data-slug` and `data-hash` on the panel.
The Worker trusts only this file, read through `env.ASSETS`, never the caller (FR-014). Static
assets are fixed for each deployment and no request path can write them; only a new build and
deploy changes the file.

## 2. `question_sets` (D1)

One cached set per post version (FR-016). At most one row per slug: inserting a set for a new
hash deletes the slug's other rows in the same batch (research R8). Retention (FR-016a): a set
is kept until the post's hash changes; rows for removed posts may linger and may be pruned by
hand. Inserts use `INSERT OR IGNORE`, so of two concurrent first generations the first write
wins. "New questions" sets are never written here.

| Column | Type | Constraint |
|---|---|---|
| `slug` | TEXT | NOT NULL, `length(slug) BETWEEN 1 AND 200` |
| `content_hash` | TEXT | NOT NULL, `length(content_hash) = 64` |
| `questions` | TEXT | NOT NULL, `json_valid(questions)` and `json_array_length(questions) BETWEEN 2 AND 4` |
| `model` | TEXT | NOT NULL (model id that produced the set, for later comparison) |
| `created_at` | INTEGER | NOT NULL, Unix ms |

Primary key `(slug, content_hash)`, `WITHOUT ROWID`. Lookups and the delete-others statement use
the primary key (prefix `slug`), so no further index is needed.

`questions` is a JSON array of strings, each already validated (below). Only the Worker writes
it; it never holds model output that failed validation.

## 3. `usage_bucket` (D1)

The site-wide token bucket for the environment whose database holds it (FR-017, FR-021).

| Column | Type | Constraint |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, `CHECK (id = 1)` (exactly one row) |
| `tokens` | REAL | NOT NULL, `CHECK (tokens >= 0)` |
| `updated_at` | INTEGER | NOT NULL, Unix ms of the last refill computation |

Seeded by the migration with `(1, 0, 0)`: the first take refills from `updated_at = 0`, so the
bucket starts full at whatever `BUCKET_CAPACITY` is configured.

**Refill** (computed, never stored separately): `available = min(capacity, tokens + (now −
updated_at) × rate)`, with `rate = BUCKET_REFILL_PER_DAY / 86,400,000` tokens per ms.

**State transitions**:

| Event | Condition | Effect | Response |
|---|---|---|---|
| Cached press | set exists for `(slug, hash)` | none | 200, `source: "cached"` |
| Take (first generation or "new questions") | `available ≥ 1` | `tokens = available − 1`, `updated_at = now` (one atomic `UPDATE … RETURNING`) | continue to the model |
| Take | `available < 1` | none | 429, `Retry-After = ceil((1 − available) / rate / 1000)` s |
| Refund | model error, timeout, fewer than 2 valid questions, or a D1 or asset failure after the take | `tokens = min(capacity, tokens + 1)`; if this statement fails the token stays spent | 503 |
| Success | 2–4 valid questions | first generation: insert set and delete the slug's other hashes; fresh: nothing stored | 200, `source: "generated"` or `"fresh"` |

## 4. Configuration (`worker/src/questions/config.ts`)

| Name | Default | Used by |
|---|---|---|
| `QUESTIONS_MODEL` | `"@cf/ibm-granite/granite-4.0-h-micro"` | model call; stored in `question_sets.model` |
| `BUCKET_CAPACITY` | `200` | bucket |
| `BUCKET_REFILL_PER_DAY` | `200` | bucket |
| `MAX_INPUT_CHARS` | `24_000` | build-side preparer (imported, as `ContactForm.astro` imports contact rules) |
| `MAX_OUTPUT_TOKENS` | `300` | model call |
| `MODEL_TIMEOUT_MS` | `15_000` | model call |
| `QUESTIONS_MIN` / `QUESTIONS_MAX` | `2` / `4` | validator, migration `CHECK` mirrors these |
| `QUESTION_MAX_WORDS` / `QUESTION_MAX_CHARS` | `25` / `200` | validator |
| `QUOTE_RUN_WORDS` | `10` | validator (no quoting at length) |
| `BODY_MAX_BYTES` | `1024` | request body cap |

A unit test asserts every numeric value is a positive finite number and `QUESTIONS_MIN ≤
QUESTIONS_MAX`. (The sizing rule for raising a bucket, both environments' worst case inside the
free daily allocation, is in the plan's Risks.) At run time the bucket treats a non-positive or
non-finite capacity or rate as an empty bucket (429), never as unlimited.
`MAX_OUTPUT_TOKENS = 300` leaves room for the prompt's 3 questions (or at most 4) of 25 words,
about 35 tokens each, plus list markers.

## 5. Validation rules for one question (FR-003, FR-004, SC-002)

After stripping list markers, quotes and emphasis, a line is a valid question when it:

1. ends with `?` and has no `.`, `!` or `?` sentence end before that final `?`;
2. has 1–25 words and at most 200 characters;
3. contains no `<`, `>`, backtick or URL;
4. shares no run of 10 or more consecutive words (case- and punctuation-insensitive) with the
   question source `text`;
5. is not a case-insensitive duplicate of an earlier valid line.

The first 4 valid lines are kept; fewer than 2 makes the result `malformed`.

## 6. Migration

`migrations/0002_create_questions.sql` creates both tables and seeds the bucket row. It is
additive, so it applies to whichever database the `DB` binding points at: the current databases
while the branch is implemented, and, with `0001_create_messages.sql`, the new databases after
Don's swap commit. The deploy scripts apply it by binding (`d1 migrations apply DB --remote`) and locally by the Playwright web-server command and the
worker test setup (`applyD1Migrations`). No change to `messages`.
