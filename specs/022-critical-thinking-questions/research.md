# Research: Critical Thinking Questions on Writing Posts

**Feature**: `022-critical-thinking-questions` | **Date**: 2026-10-04 | **Plan**: [plan.md](./plan.md)

The spec's Clarifications are final: Workers AI through an `ai` binding, a hybrid cache (one
cached set per post version in D1, plus "new questions"), one site-wide token bucket per
environment in D1, no Turnstile, D1 databases renamed to `dcc-web` / `dcc-web-preview`, and
Principle V amended in this PR (done: constitution v2.2.0). Each decision below records what was
chosen, why, and what was rejected. Astro choices cite the page found through the Astro Docs MCP
(`astro-docs`), which was available for this plan.

## R1. Model: `@cf/ibm-granite/granite-4.0-h-micro`

**Decision**: Generate with Workers AI model `@cf/ibm-granite/granite-4.0-h-micro` through
`env.AI.run(model, { messages, max_tokens: 300, temperature })`. The model id lives in the one
config module (R6), so Don can swap it without touching logic.

**Rationale**:

- Cheapest current text-generation model in the Workers AI catalog (checked 2026-10-04 on
  developers.cloudflare.com/workers-ai/models/ and /platform/pricing/): input $0.017 per M tokens
  (1,542 neurons per M), output $0.112 per M tokens (10,158 neurons per M). Not deprecated.
- Instruction-tuned, 131,000-token context (far more than the 6,000-token input cap in R4), and
  supports function calling, which signals good instruction following for a ~3B model.
- 2–4 one-sentence questions is a short, well-bounded task; a small model is enough, and the
  Worker's validator (R5) is the real guarantee, not the model.

**Neurons and cost** (Principle IX, FR-024):

| Case | Input tokens | Output tokens | Neurons |
|---|---|---|---|
| Typical post (~1,500 words) | ~2,400 (prompt + text) | ~120 | 2,400 × 0.001542 + 120 × 0.010158 ≈ **5** |
| Worst case (input capped, R4) | ~6,350 | 300 (`max_tokens`) | 9.8 + 3.0 ≈ **13** |

- Default bucket: 200 generations a day per environment, two environments (production and
  preview share one account allowance): worst case 2 × 200 × 13 = **5,200 neurons/day**, about
  half of the 10,000 neurons/day free allocation. **Expected monthly cost: $0.**
- Ceiling if both buckets are exhausted every day: still 5,200 neurons/day, inside the free
  allocation, so **$0**. For scale, if the same usage were billed in full at $0.011 per 1,000
  neurons it would be 5,200 × 30 × 0.011 / 1,000 ≈ **$1.72/month**, well under the $13 ceiling.
- The account is on Workers Free (spec 007 plan, Principle VIII), where Workers AI use past the
  daily allocation is refused rather than billed; the bucket keeps usage under it anyway.
- D1 cost: one bucket UPDATE and at most one INSERT plus one DELETE per generation, one indexed
  primary-key read per cached press: well under 0.5% of the free daily row limits.

**Structured output**: Workers AI JSON Mode (`response_format: { type: "json_schema" }`) is
documented only for a short list of older or larger models (`llama-3.1-8b-instruct`, now gone
from the catalog; `llama-3.3-70b-instruct-fp8-fast`; `deepseek-r1-distill-qwen-32b`; and two
`@hf` models), and even there "Workers AI can't guarantee that the model responds according to
the requested JSON Schema". Granite's documented input has no JSON-schema mode. So the prompt
asks for plain text, one question per line, and the Worker parses and validates (R5). This is
model-agnostic, so a later model swap needs no parser change.

**Alternatives considered**:

- `@cf/meta/llama-3.2-3b-instruct` (4,625 / 30,475 neurons per M): about 3× the neurons
  (worst case ~39 per generation, 15,400/day for two full buckets: over the free allocation).
  Named as the fallback if Granite's questions read poorly in the preview check; switching it
  needs the bucket lowered to ~120/day per environment, stated in the same config module.
- `@cf/meta/llama-3.1-8b-instruct-fp8` (~13,800 input neurons per M): ~92 neurons worst case,
  over the allocation at 200/day. Rejected.
- `@cf/zai-org/glm-4.7-flash`: reasoning model, its thinking tokens add output cost and latency
  for no gain on a 3-question task. Rejected.
- `@cf/meta/llama-3.1-8b-instruct-fast`: no longer in the catalog. Rejected.
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (JSON Mode): far above the allocation. Rejected.
- OpenRouter or another external provider: an external account, an API key secret and a
  third-party data processor; Principle IV prefers the platform's own feature and the spec's
  Clarifications chose Workers AI. Rejected.

## R2. Where the post text comes from: a prerendered source file per post, read through the `ASSETS` binding

**Decision**: The build writes one static JSON file per visible post,
`/writing/<slug>/question-source.json`, from a static file endpoint
`src/pages/writing/[slug]/question-source.json.ts` whose `getStaticPaths()` uses the same
`getPosts()` as the post page (so drafts exist only in preview builds). It holds `slug`, `title`,
`summary`, the prepared `text` (R4) and `hash` (R3). The post page renders the same `slug` and
`hash` into the panel's `data-` attributes. The Worker reads the file with
`env.ASSETS.fetch()` (a new `assets.binding: "ASSETS"` in `wrangler.jsonc`), so it generates only
for a post the build actually published (FR-014) and never accepts caller text.

**Rationale**: Astro static file endpoints with `getStaticPaths()` produce exactly this at build
time (docs.astro.build/en/guides/endpoints/#static-file-endpoints and
docs.astro.build/en/reference/routing-reference/#getstaticpaths). The Workers static-assets
binding is Cloudflare's own way for Worker code to read the deployed assets; nothing is bundled
into the Worker, so the Worker build stays independent of the Astro build, exactly as today.
The file holds only text that is already public on the post page.

**Details**: the file is not linked and is excluded from the sitemap (sitemap `filter`) and sent
with `X-Robots-Tag: noindex` (a `public/_headers` rule), so it never appears in search.

**Alternatives considered**:

- Worker fetches the post's HTML through `ASSETS` and extracts text with `HTMLRewriter`
  (first-party): couples the API to the page markup and computes the hash at request time.
  Rejected; the build-time file is simpler and testable.
- Import a build-time manifest into the Worker bundle: makes the Worker build depend on the
  Astro build order and grows the bundle with every post. Rejected.
- Client sends the text: forbidden by FR-014.

## R3. Cache key: SHA-256 of the post's source content

**Decision**: `hash` = lowercase hex SHA-256 of `JSON.stringify([title, summary, body])`, where
`body` is the entry's raw Markdown/MDX source (`entry.body`), computed at build with
`node:crypto`. Any edit to the title, summary or body changes it (spec: "a changed post gets a new
set"); edits to other front matter (dates, topics) do not.

The client sends `{ slug, hash }`. The Worker looks up `(slug, hash)` in D1 first; on a miss it
reads the source file and refuses with `404 stale` when the file's hash differs (the page was
loaded before a deploy) or `404 not_found` when there is no file.

**Alternatives**: hashing the rendered HTML (changes on template edits, not content); a
`updated` date (not always set). Rejected.

## R4. Text preparation and the input cap

**Decision**: A pure function `prepareQuestionSource(entry)` in `src/lib/questions/source.ts`
turns the raw body into plain text: drops MDX `import`/`export` lines, JSX/HTML tags, image
syntax and fenced code (replaced by `[code example]`), keeps link text without URLs, collapses
whitespace, and cuts at the last paragraph boundary before **24,000 characters** (about 6,000
tokens). Title and summary are always sent. The cap keeps the worst case at ~13 neurons (R1) and
the questions still relate to the post (spec edge case "Very long posts").

## R5. Prompt, parsing and validation of model output

**Decision**:

- **Prompt**: a system message that asks for exactly **3** questions (the middle of 2–4, so a
  model that over- or under-shoots by one still yields a valid set), each one sentence of at most
  25 words ending in "?", that examine claims, assumptions, evidence, alternatives or
  implications, without summarising, answering or quoting the post, output one per line with
  nothing else. The user message carries title, summary and text between fixed delimiters. The
  text is Don's own published content, so prompt injection risk is low, but the trust boundary
  still treats it as untrusted data: quoted material, code examples or MDX comments could read
  as instructions. The system message says the delimited text is material to question and that
  any instructions inside it are to be ignored, no request field ever enters the prompt, and
  the validator below bounds what any output can do (only 2–4 plain question sentences with no
  markup, links or code reach a reader, whatever the text says).
- **Parser and validator** (`worker/src/questions/validate.ts`, pure): split on newlines; strip
  list markers (`1.`, `1)`, `-`, `*`, `•`), surrounding quotes and Markdown emphasis; drop empty
  lines and lines not ending in `?`; reject a line that has a sentence end (`.`, `!`, `?`) before
  its final `?`, contains `<`, `>`, a URL or a backtick, is over **25 words** or **200
  characters**, or shares a run of **10 or more consecutive words** with the post text (no
  quoting at length, FR-004); de-duplicate case-insensitively; keep the first **4**.
- **Outcome**: 2–4 valid questions → success. Fewer than 2 → `malformed`: the Worker refunds the
  token (R7), logs `malformed`, and answers `503 unavailable`; the panel shows its retry error.
  Raw output is never returned or logged (FR-022, spec "Malformed output").
- **Timeout**: the model call is raced against a **15 s** timeout; a timeout or a thrown error
  from `env.AI.run` (including Workers AI's own daily-limit error when the account allocation
  is used up by something other than these buckets, and a model that has been deprecated,
  renamed or removed) is treated like malformed output: refund, `503`. The log line's error
  class lets Don tell a persistent model failure from a transient one; the fix for a removed
  model is a config change of `QUESTIONS_MODEL` (and the bucket, per R1's fallback). The 15 s
  timeout is a hard ceiling for slow attempts; the 5 s target in SC-001 is for 95% of presses,
  which typical generation (~120 output tokens on a small model) meets well inside.
- **Output cap**: `max_tokens: 300` covers the requested 3 questions (at most 4 kept) of up to
  25 words, about 35 tokens each with list markers, with headroom; output past the cap is
  simply cut and the validator drops any unfinished line.
- **Temperature**: 0.4 for the first (cached) set, 0.9 for "new questions", so a fresh press
  differs from the cached set.

## R6. Configuration in one module

**Decision**: `worker/src/questions/config.ts` exports the model id, `BUCKET_CAPACITY = 200`,
`BUCKET_REFILL_PER_DAY = 200`, `MAX_INPUT_CHARS = 24_000` (re-exported to the build-side
preparer), `MAX_OUTPUT_TOKENS = 300`, `MODEL_TIMEOUT_MS = 15_000` and the question limits
(2, 4, 25 words, 200 characters). FR-018 is met: Don edits numbers, not logic. Both environments
share the values; preview usage is still separate because each environment has its own database
(FR-021).

**Alternative**: Wrangler `vars` per environment. Splits the numbers across two places in
`wrangler.jsonc` and needs `wrangler types` regeneration on every change; no requirement asks for
different limits per environment. Rejected; easy to add later.

## R7. Site-wide token bucket in D1

**Decision**: one row per environment database, `usage_bucket(id = 1, tokens REAL,
updated_at INTEGER ms)`, seeded by the migration with `tokens = 0, updated_at = 0`, so the first
read refills to full capacity whatever the configured capacity is. A generation takes a token
with one atomic statement:

```sql
UPDATE usage_bucket
SET tokens = min(?cap, tokens + (?now - updated_at) * ?rate) - 1, updated_at = ?now
WHERE id = 1 AND min(?cap, tokens + (?now - updated_at) * ?rate) >= 1
RETURNING tokens;
```

No row returned → empty: a `SELECT` computes `retryAfter = ceil((1 − refilled) / rate)` seconds
and the Worker answers `429` with `Retry-After` and calls no model (FR-020). A failed or
malformed generation **refunds** the token (`tokens = min(cap, tokens + 1)`), so failures do not
spend (spec FR-020a). Serving a cached set never touches the bucket (FR-016, SC-003).
D1 runs each statement atomically on a single primary, so concurrent presses cannot overspend.

**Rationale**: D1 was chosen in Clarifications; this keeps it to one row, one indexed write per
generation.

**First-party alternatives considered (Principle IV)**:

- **Workers Rate Limiting binding** (`ratelimits`): periods of 10 s or 60 s only, counted per
  Cloudflare location and eventually consistent, so it cannot express "200 a day site-wide".
  Falls short.
- **AI Gateway rate limiting and caching**: fixed or sliding windows per gateway and response
  caching by identical request. Falls short on three counts: a gateway is created and configured
  in the dashboard (Principle VIII wants config in the repository), cached responses would still
  pass through the same limiter path we must reason about, and the cache key would be the full
  request rather than the post version, so "new questions" and stale-version handling would need
  custom headers anyway. Not used; could be added later for observability only.
- **Durable Object** as the bucket: exact and fast, but a new binding and class for one counter
  that D1 already handles. Rejected (and the spec chose D1).

## R8. Question-set cache in D1

**Decision**: `question_sets(slug, content_hash, questions JSON, model, created_at)` with primary
key `(slug, content_hash)`. A first generation inserts with `INSERT OR IGNORE` (a concurrent
first press keeps whichever landed first) and, in the same `batch()`, deletes the slug's rows for
other hashes, so the table holds at most one set per post and needs no retention job. A
"new questions" set is returned to that reader only and **not** stored (FR-016: it does
not replace the cached one).

**First-party alternatives considered**: Workers **Cache API** (per data centre, evictable, so a
cached press could silently spend a token elsewhere: breaks SC-003's spirit); **KV** (a new
binding, eventually consistent writes, and the spec chose D1). Rejected.

## R9. The endpoint: hand-written route in the existing Worker

**Decision**: `POST /api/questions` in `worker/src/index.ts`, beside `/api/contact`, following
its patterns: same-origin check (`Origin` equals the request origin, `Sec-Fetch-Site` absent or
`same-origin`, HTTPS or local host), `Content-Type: application/json`, body cap (1 KB), the shared
`json()` helper and security headers, one outcome-only log line. The same-origin check moves from
`contact/submit.ts` to a shared `worker/src/same-origin.ts` used by both (the contact tests
cover the move).

**First-party alternatives considered (Principle IV)**: Astro server endpoints or Astro Actions
need the `@astrojs/cloudflare` adapter and on-demand rendering
(docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes,
docs.astro.build/en/guides/integrations-guide/cloudflare/), a new dependency that would change
how the whole site is built and served, against Principle V's "static by default". The site
already has a plain Worker with `run_worker_first: ["/api/*"]`; a second route there is the
smallest first-party option.

## R10. The panel: an Astro component with a processed `<script>`

**Decision**: `src/components/post/QuestionsPanel.astro`, rendered only by `PostLayout.astro`,
with a plain `<script>` that Astro processes, bundles and hashes into the page CSP
(docs.astro.build/en/guides/client-side-scripts/#script-processing). Server values reach the
script through `data-` attributes (docs.astro.build/en/guides/client-side-scripts/#pass-frontmatter-variables-to-scripts).
No UI framework, no new dependency. The fetch goes to the site's own origin, which
`connect-src 'self'` already allows, so the CSP needs no change (unlike Turnstile's
`contact-csp.ts`).

**No-JS (FR-011, spec edge case)**: the panel carries `hidden` styling unless the root has the
`js` class that the existing pre-paint `theme-init.js` adds, so without JavaScript nothing is
shown (no dead button) and with JavaScript there is no layout shift (the class is set before
first paint, so CLS is unaffected).

**Script weight**: about 2–3 KB minified; the post template's JS budget is 10 KB and the post
page currently ships only the Copy-button and theme scripts, so the budget holds (checked by
the existing `budget` project).

**Alternatives**: a framework island (Preact etc.) adds a dependency and kilobytes for a button
and a list; server islands need an adapter. Rejected.

## R11. Placement and breakpoint

**Decision**: the large-screen breakpoint is Tailwind's **`xl` (1280 px)**. Below it, the panel
is a full-width block (max width of the reading column) between the title card and the body. At
`xl` and up, the region below the title card becomes a two-column grid inside the existing
`max-w-screen-lg` article: the reading column (`minmax(0, 1fr)`, about 47 rem) and a 15 rem
panel column, with the panel `position: sticky; top: 1rem` inside the grid row that holds the
body, so it scrolls with the body and stops at its end (never over the views note, share area,
related posts or footer; the site header is not sticky, so it cannot be covered). In the DOM
the panel comes after the title card and before the body in both layouts (FR-010); only
`grid-column`/`grid-row` place it to the right at `xl`.

**Why `xl`, not `lg`**: at `lg` (1024 px) the content box is about 992 px, which leaves under
13 rem beside a 48 rem column; at `xl` the article's 64 rem fits a ~47 rem column, a 2 rem gap
and a 15 rem panel. The site uses `sm`/`md`/`lg` today; `xl` is Tailwind's own default
breakpoint, so no theme change is needed. This is a visual change to the post template (major
under Principle III; visual baselines must be refreshed, see plan).

## R12. Testing Workers AI and assets in the worker tests and E2E

**Implement-phase result (T001 spike, no Cloudflare credentials, empty `WRANGLER_HOME`)**: all
three paths passed, so no fallback is needed. (a) `wrangler dev` with `ai` and `ASSETS` bindings
starts and serves `/api/*` and static assets; the only output is the "AI bindings always access
remote resources" warning, with no login demand. (b) The worker Vitest pool starts with the `ai`
binding present and `remoteBindings: false`, and the existing 132 worker tests pass. Without
`remoteBindings: false` the pool called the Cloudflare API with the token from the repository
`.env`, so T014 must add it. (c) The pool and `wrangler types --check` run with no `dist/`
directory. `wrangler types` emits `AI?: Ai` (optional, because the binding is remote-only) and
`ASSETS: Fetcher`, so the questions handler must guard a missing `env.AI`. Note that
`WRANGLER_HOME` (not `XDG_CONFIG_HOME`) is how to point wrangler at an empty config directory.

**Decision**:

- **Worker tests** (`@cloudflare/vitest-plugin`): the handler is called with an env override,
  `run(request, { AI: fakeAi, ASSETS: fakeAssets })`, as `helpers.ts` already passes `env`
  explicitly. `fakeAi.run` returns canned text, throws, or hangs per test; `fakeAssets.fetch`
  serves a fixture `question-source.json`. `worker/vitest.config.ts` sets
  `remoteBindings: false` so a test run never reaches Cloudflare or needs a login; the
  implement phase confirms the pool starts with the `ai` binding present (wrangler classes
  `ai` as remote-only and, with no `remote` key, only warns), with no Cloudflare credentials,
  and with no `dist/` directory for the `ASSETS` binding (`verify:quick` runs the worker tests
  before the build). Fallback if the pool refuses: override `AI` (and, if needed, `ASSETS`) in
  `miniflare.bindings` with a stub object; tests pass their own fakes per request, so every
  path ends in a green suite.
- **E2E** (`wrangler dev` on 4321): panel journeys stub `/api/questions` with `page.route`, as
  `contact.spec.ts` stubs `/api/contact`, so no model is called in CI. The implement phase
  confirms `wrangler dev` still starts in CI with the `ai` binding and no Cloudflare login (it
  warns for a remote-only binding with no `remote` key). `"remote": false` is not an option:
  wrangler 4.144 throws for it on an `ai` binding. Fallback if `wrangler dev` demands a login:
  the E2E web server runs with a test-only config, written by the command, that omits the `ai`
  binding (the stubbed journeys never reach it).
- **Build tests**: the source file's existence per visible post, draft exclusion in production,
  and sitemap exclusion are shown by the real build.

## R13. D1 rename (FR-025)

**Decision**: create `dcc-web` and `dcc-web-preview` (`--location wnam`, as item 19 and the
privacy policy require), swap `database_name` and `database_id` in both environments, apply all
migrations (`0001_create_messages.sql` and the new `0002_create_questions.sql`) through the
existing deploy scripts, then delete `dcc-web-contact` and `dcc-web-contact-preview`. No data is
kept (the contact feature is not live). Order and commands are in [quickstart.md](./quickstart.md)
and [contracts/worker-config.md](./contracts/worker-config.md); the safe order follows the
earlier rename in `.specify/bugs/d1-database-names/assessment.md`. D1 has no rename command
(recorded in memory), so create-swap-delete is the only path. Use `--env-file /dev/null` with
Wrangler so the repository `.env` token does not override the OAuth login, and never run
`wrangler versions secret put` or `wrangler versions deploy` on this Worker.

**Every place the names appear** (from a repository search): `wrangler.jsonc`,
`playwright.config.ts` (local migrations command), `scripts/deploy/production.ts`,
`scripts/deploy/preview.ts`, `scripts/setup-check/checks/contact-shared.ts`,
`scripts/setup-check/items.ts` (items 19 and 24 text), `docs/setup.md` (items 19, 24, 25),
`.claude/skills/setup-walkthrough/SKILL.md`, `worker/test/environments.test.ts`, and the unit
tests `tests/unit/site/config-files.test.ts`, `deploy-preview.test.ts`,
`deploy-production.test.ts`, `tests/unit/setup/docs-structure.test.ts`, `items.test.ts`,
`tests/unit/setup-check/checks/contact-*.ts` and `providers/contact-readers.test.ts`.
`.github/workflows/*.yml` name no database. `specs/007-*` and `.specify/bugs/*` stay as history.

**How the swap stays green**: migrations are applied on deploy by the Workers Builds deploy
commands (`pnpm run deploy:preview` / `deploy:production`, `scripts/deploy/*.ts`), not by the
GitHub Actions workflow. Those scripts and the Playwright web-server command apply migrations by
the binding name `DB` (Wrangler's `getDatabaseInfoFromConfig` matches a `database_name` or a
`binding`), and the setup check reads the database names from `wrangler.jsonc`. The branch
therefore keeps today's names and ids while it is implemented (the new migration is additive and
applies to whichever database is bound), and Don's swap of `database_name`/`database_id` is a
one-file commit. Tests assert the D1 configuration's shape and consistency, not live ids or
names, so nothing is red before or after the swap.

## R14. Privacy and logging

**Decision**: one JSON log line per request, `{ event: "questions", outcome }` with outcome in
`cached | generated | fresh | limited | not_found | stale | forbidden | invalid | malformed |
unavailable`, plus the error class name for `unavailable` (as contact does). Never the slug's
questions, the model output, an IP or a header value (FR-019, FR-022, SC-006). `invocation_logs`
stay off. Cloudflare's own platform request logs and security systems (which see the reader's
IP, as for every request to the site) are outside the site's control and are not read by it;
the privacy policy says so. The privacy policy (`src/content/pages/privacy-policy.mdx`) gains a short section
(FR-023): pressing the button sends the post's own text, not reader data, to Cloudflare Workers
AI; one generated set per post version is stored in D1; nothing about the reader is collected,
stored or logged.
