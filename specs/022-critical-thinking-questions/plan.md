# Implementation Plan: Critical Thinking Questions on Writing Posts

**Branch**: `022-critical-thinking-questions` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-critical-thinking-questions/spec.md`

**Major change (Constitution Principle III): YES.** It adds an external service integration
(Workers AI, a new `ai` binding) and an `ASSETS` binding, replaces both D1 databases, changes
infrastructure configuration (`wrangler.jsonc`, deploy scripts, setup checks), could increase
running costs (expected $0, stated below), amends the constitution (v2.1.0 → v2.2.0, done in
this phase), and adds a new element to the post template (visual baselines change). Auto-merge
stays off; the PR carries the `major-change` label, `tasks.md` carries `[PREVIEW-CHECK]` tasks
(question quality and panel placement on the preview, the live database steps), and the PR body
says why.

## Summary

A "Think before you read" panel on every writing post asks a Worker endpoint for 2–4 critical
thinking questions. The build writes each post's plain text and a content hash to
`/writing/<slug>/question-source.json`; the page carries the slug and hash. `POST /api/questions`
(in the existing Worker, beside `/api/contact`) checks the origin, returns the cached set for
that `(slug, hash)` from D1 when there is one (free), and otherwise reads the source file through
the `ASSETS` binding, takes one token from a site-wide D1 token bucket (200 a day, continuous
refill, one config module), calls Workers AI (`@cf/ibm-granite/granite-4.0-h-micro`) and
validates the output (2–4 one-sentence questions, ≤ 25 words, no quoting). Failures refund the
token. "New questions" generates a fresh set that is shown but not stored. The panel is an Astro
component with a processed script, hidden without JavaScript, a block above the body below
1280 px and a sticky sidebar beside it at 1280 px and up. The D1 databases are replaced by
`dcc-web` / `dcc-web-preview`, and the privacy policy says what is sent to Workers AI.

## Technical Context

**Language/Version**: TypeScript (strict), Node 24 (`.nvmrc`), Astro 7.3.5 (current pin),
Worker on `compatibility_date` 2026-09-28

**Primary Dependencies**: none new. Platform features: Workers AI (`ai` binding), Workers static
assets binding (`ASSETS`), D1. Existing: Astro, Tailwind, Wrangler 4.144.0,
`@cloudflare/vitest-plugin` 1.3.3, Vitest, Playwright

**Storage**: D1 `dcc-web` (production) and `dcc-web-preview` (preview), replacing
`dcc-web-contact` / `dcc-web-contact-preview`; new tables `question_sets`, `usage_bucket`
(migration `0002_create_questions.sql`); build-time static JSON per post

**Testing**: Vitest `unit` (source preparation, validator, bucket maths, config, CSP, docs),
`build` project (source files, drafts, sitemap), worker project (`@cloudflare/vitest-plugin`,
local D1, fake `AI` and `ASSETS`), Playwright `e2e`, `a11y`, `visual`, `budget`

**Target Platform**: Cloudflare Workers (static assets + `/api/*` Worker), evergreen browsers

**Project Type**: static Astro site with one Worker (single repository)

**Performance Goals**: questions shown within 5 s in ≥ 95% of presses (SC-001); cached press
one D1 primary-key read; post template within the unchanged budget (JS ≤ 10 KB, total ≤ 150 KB,
LCP ≤ 2.5 s, CLS < 0.1)

**Constraints**: ≤ 200 generations/day/environment by default; worst case 13 neurons per
generation; no reader identifiers, cookies or IPs; no CSP loosening; model output never shown
unvalidated; prerendered post pages readable without JavaScript

**Scale/Scope**: one endpoint, one component, one migration, a handful of posts today (5 files, one a draft sample); 2 D1 databases replaced

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1 against constitution v2.2.0. No
violation; nothing in Complexity Tracking.*

| Principle | How this plan complies |
|---|---|
| I. Test-First | Every behaviour has a test at one named layer (Test placement below), written first and seen to fail: the validator, preparer and bucket maths fail as missing modules; worker rows Q01–Q29 fail with today's 404 for `/api/questions`; the build test fails with no `question-source.json`; the panel E2E fails with no `[data-questions]`. Integration tests run the API against real local D1 (Principle I, as amended). Tasks order tests before code. |
| II. Automated Release Gate | No check is skipped or weakened. New tests join existing jobs (`test:unit`, `test:worker`, `test:build`, `test:e2e:parallel`, `test:budget`); no new script or project. Visual baselines are refreshed for a predicted template change only. Full `verify` before the PR. |
| III. Human Review | **Major** (see header): new integration and bindings, D1 replacement, infra config, possible cost, constitution amendment, post template change. Auto-merge off, `[PREVIEW-CHECK]` tasks, reason in the PR body. |
| IV. First-Party Before Custom | Astro Docs MCP consulted (research R2, R9, R10 cite pages). **Model inference**: Workers AI binding (first-party; external providers rejected, R1). **Structured output**: Workers AI JSON Mode exists but is documented only for older or larger models and not guaranteed, so plain-line output plus a Worker validator (R1, R5). **Post text for the Worker**: Astro static file endpoint + Workers `ASSETS` binding (R2); `HTMLRewriter` and bundled manifests rejected. **Question-set cache**: D1 (spec); Cache API and KV fall short (R8). **Token bucket**: D1 single row (spec); Workers Rate Limiting binding cannot express a daily site-wide limit, AI Gateway rate limiting/caching is dashboard-configured and keyed on whole requests, a Durable Object adds a class for one counter (R7). **Endpoint**: route in the existing Worker; Astro server endpoints/Actions need the Cloudflare adapter and on-demand rendering (R9). **UI panel**: Astro component with a processed `<script>`, data attributes, no framework (R10). **Custom code** (validator, bucket SQL, text preparer) exists only where no first-party option meets the requirement, as named above. |
| V. Static by Default | Amended to v2.2.0 in this phase via `speckit-constitution`: the questions API is now a named `/api/` endpoint with its data and limits. Post pages stay prerendered; the panel's script loads only on writing posts; the post is fully readable with JavaScript off and shows no dead button (R10). |
| VI. Content as Files | Posts stay Markdown/MDX files. D1 holds only a cache of generated, derived question sets, not authored content (Principle V wording); deleting it loses nothing authored. |
| VII. Private Data | The feature collects no personal data: no cookies, accounts, IPs or hashes; logs are outcome-only (R14). Only the post's own public text goes to Workers AI. Contact data rules unchanged; the contact data is not migrated (not live). The privacy policy gains a section (FR-023). |
| VIII. Cloudflare Best Practices | One Worker; only `/api/*` runs it (`run_worker_first` unchanged). Origin-only, HTTPS-only, bucket-limited, no model call when empty (as amended). Bindings, migrations and config committed and applied by the deploy scripts; no dashboard configuration (AI Gateway avoided for that reason). D1 queries use primary keys; at most 3 writes per generation. `invocation_logs` stays off. Wrangler `--env-file /dev/null`; no `versions secret put`/`versions deploy`. |
| IX. Cost Ceiling | **Expected monthly cost: $0.** Granite 4.0 H Micro: ~5 neurons per typical generation, ≤ 13 worst case; two environments × 200/day × 13 = 5,200 neurons/day worst case, inside the 10,000/day free allocation. Ceiling if both buckets are exhausted every day: still $0 (and ≈ $1.72/month even if billed in full at $0.011 per 1,000 neurons). D1 rows and Worker requests negligible (R1). Workers Free refuses AI use past the allocation rather than billing. |
| X. Accessible, Fast and Private | WCAG 2.2 AA panel: heading, live region, numbered list, visible focus, both themes, forced colours (panel contract P22–P23); `a11y` covers the post template. Budget: ~2–3 KB script within the 10 KB JS limit, no CLS (shown via the pre-paint `js` class). No third-party script; the model is called only from the Worker. |
| XI. Spec Kit Workflow | Spec Kit branch and directory, one feature. Files overlap with sibling worktrees only if they edit `PostLayout.astro`, `wrangler.jsonc`, the deploy scripts or `docs/setup.md`; the PR merges `main` before the gate and re-runs the config tests. Visual baselines are regenerated after that merge. |
| Dev workflow: Astro decisions cite docs | research.md R2, R9, R10 name the Astro pages (endpoints, routing reference, client-side scripts, Cloudflare adapter). |
| Dev workflow: test placement | Every test below names one layer; second layers carry a reason. |
| Dev workflow: plain language | Panel copy in `contracts/questions-panel.md` is plain, with no hype. |

**Post-design re-check**: the data model (two small D1 tables, one static file per post), the
API and panel contracts and the worker-config contract introduce nothing beyond the table above.
PASS.

## Project Structure

### Documentation (this feature)

```text
specs/022-critical-thinking-questions/
├── plan.md              # this file
├── research.md          # R1–R14
├── data-model.md        # question source, question_sets, usage_bucket, config, validation
├── quickstart.md        # Cloudflare steps (Don's live steps), local validation, journeys, baselines
├── contracts/
│   ├── questions-api.md # POST /api/questions, Q01–Q29
│   ├── questions-panel.md # panel markup, states, placement, P01–P23
│   └── worker-config.md # wrangler.jsonc, rename file list, deploy order, W01–W05
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
migrations/
└── 0002_create_questions.sql            # new: question_sets, usage_bucket (+ seed row)

worker/src/
├── index.ts                             # route POST /api/questions
├── same-origin.ts                       # new: isSameOriginRequest moved from contact/submit.ts
├── contact/submit.ts                    # imports same-origin.ts (no behaviour change)
└── questions/
    ├── config.ts                        # new: model, bucket, limits (FR-018)
    ├── handler.ts                       # new: request flow (contracts/questions-api.md)
    ├── bucket.ts                        # new: take / refund / retryAfter (D1)
    ├── cache.ts                         # new: get / store question sets (D1)
    ├── generate.ts                      # new: prompt, env.AI.run with timeout
    ├── validate.ts                      # new: parse + validate model output (pure)
    └── log.ts                           # new: outcome-only log line
worker/test/
├── helpers.ts                           # run(request, envOverrides); fake AI and ASSETS
├── questions.test.ts                    # new: Q01–Q29
├── questions-validate.test.ts           # new: validator rules
├── questions-bucket.test.ts             # new: bucket against local D1
├── environments.test.ts                 # name-independent; per-environment bucket
└── schema.test.ts / query-plans.test.ts # extended for the new tables
worker/vitest.config.ts                  # remoteBindings: false
worker/worker-configuration.d.ts         # regenerated (AI, ASSETS)

src/
├── lib/questions/source.ts              # new: prepareQuestionSource (text + hash)
├── pages/writing/[slug]/question-source.json.ts  # new: static file endpoint
├── components/post/QuestionsPanel.astro # new: panel + processed script
├── layouts/PostLayout.astro             # panel placement, xl grid
└── content/pages/privacy-policy.mdx     # new section (FR-023)

astro.config.mjs                         # sitemap filter excludes question-source.json
public/_headers                          # X-Robots-Tag: noindex for question-source.json
wrangler.jsonc                           # ai, assets.binding; D1 names/ids swapped by Don's commit
playwright.config.ts                     # local migrations by binding `DB`
scripts/deploy/{production,preview}.ts   # migrations by binding `DB` (name-independent)
scripts/setup-check/checks/contact-shared.ts, scripts/setup-check/items.ts  # names from wrangler.jsonc
docs/setup.md, docs/testing.md, .claude/skills/setup-walkthrough/SKILL.md

tests/
├── unit/questions/source.test.ts        # new
├── unit/site/{config-files,deploy-*,csp,headers,sitemap,privacy-policy}.test.ts  # extended
├── unit/setup/**, unit/setup-check/**   # new names
├── component/post/QuestionsPanel.test.ts # new
├── build/question-source.test.ts        # new (fixture site build)
└── e2e/questions.spec.ts                # new; visual.spec.ts snapshots refreshed
```

**Structure Decision**: single repository as today: Astro site under `src/`, the Worker under
`worker/` with its own Vitest pool, migrations at the root. The questions API mirrors the
contact API's layout (`worker/src/questions/` beside `worker/src/contact/`).

## Test placement

Each behaviour has one primary layer, the cheapest that can observe it (`docs/testing.md`,
"Where a test goes").

| Behaviour | Layer | File | Why this layer |
|---|---|---|---|
| Validator rules (data-model §5, SC-002, FR-003/004) | Unit (worker pool, pure) | `worker/test/questions-validate.test.ts` | Pure function, rule by rule |
| Text preparation, 24,000-char cap, hash changes on title/summary/body edit only (R3, R4) | Unit | `tests/unit/questions/source.test.ts` | Pure function |
| Bucket take/refund/refill/retryAfter against D1 (FR-017, FR-020, SC-003) | Worker integration | `worker/test/questions-bucket.test.ts` | Needs real local D1 SQL semantics |
| API rows Q01–Q12, guarantees Q20–Q25, Q27 | Worker integration | `worker/test/questions.test.ts` | Endpoint against local D1 with fake `AI`/`ASSETS` |
| Environment isolation Q26, database names differ per environment (read from config, not pinned) | Worker integration (both projects) | `worker/test/environments.test.ts` | Only the two Vitest projects load both envs |
| Migration schema and constraints; primary-key query plans | Worker integration | `schema.test.ts`, `query-plans.test.ts` | D1/SQLite behaviour |
| `wrangler.jsonc` shape and consistency W01–W04 (no live ids or names pinned); deploy scripts and Playwright command apply by binding `DB` | Unit | `tests/unit/site/config-files.test.ts`, `deploy-*.test.ts` | Reads config files |
| Generated types W05 | Typecheck | `pnpm run typecheck` (`wrangler types --check`) | Existing guard |
| Setup-check names, items, docs commands | Unit | `tests/unit/setup-check/**`, `tests/unit/setup/**` | Existing fixtures |
| Panel markup P01 (component part), P02 attributes, copy P14, AI note text | Component | `tests/component/post/QuestionsPanel.test.ts` | One component, container API |
| One `question-source.json` per visible post, none for drafts in production, hash equals page `data-hash` (P02), sitemap exclusion | Build | `tests/build/question-source.test.ts` | Cross-page output only the real build shows |
| `_headers` noindex rule; sitemap filter config | Unit | `headers.test.ts`, `sitemap.test.ts` | Config read |
| Privacy policy section (FR-023) | Unit | `privacy-policy.test.ts` | Content file read |
| Journey: press → loading → questions → new questions; 429, stale and error states; no request on load; double-press guard (P04, P10–P16, US1, US3 panel side) | E2E | `tests/e2e/questions.spec.ts` (`page.route` stubs `/api/questions`) | Only a browser shows the states and announcements |
| Placement at 390 and 1280 px, sticky, no overlap, DOM order (P03, P20, P21) | E2E | `tests/e2e/questions.spec.ts` | Layout geometry needs a browser (the existing `geometry.spec.ts` also covers no horizontal scroll for the post template unchanged) |
| No-JS: no panel, post readable (P05) | E2E | `tests/e2e/no-js.spec.ts` (extended) | Existing no-JS journey file |
| WCAG 2.2 AA both themes/widths (P22), idle state | Accessibility | existing `blog.a11y.spec.ts` / `blog-fixture.a11y.spec.ts` | Template-level; the panel is on the template |
| WCAG 2.2 AA of the ready, limited and error states, both themes (P24, FR-012a) | Accessibility | `blog-fixture.a11y.spec.ts` (new cases, `page.route` stub) | Second scan of the same template, with a written reason: these states' markup exists only after interaction, so the idle template scan cannot see it |
| Sticky fallback for a tall panel at 1280×600, 400% zoom (320 px) block layout (P21a, P21b) | E2E | `tests/e2e/questions.spec.ts` | Layout geometry needs a browser |
| Forced colours (P23) | E2E | existing `blog-forced-colors.spec.ts` (one assertion added) | Existing template check |
| Budget, JS ≤ 10 KB (P06) | Budget | existing `budget.spec.ts` | Unchanged limits |
| Post template pixels | Visual | existing `post-template` shot, baselines refreshed (macOS and Linux) | Template change |
| Panel script only on posts (P06), CSP unchanged | Build | `question-source.test.ts` (asserts no panel script in a non-post page of the same build) | Second assertion in the same build; no extra build |

No behaviour is tested at a second layer except the build check of P02, whose component test
covers markup and whose build test covers that page and file agree (different behaviour), and
the state scans in the a11y row above (reason given there).

No test at any layer calls the real Workers AI model: worker tests pass a fake `AI` and a fake
`ASSETS` through the env override, E2E and a11y tests stub `/api/questions` with `page.route`,
and CI has no Cloudflare login. A test that would reach the real binding is a defect.

## Visual baselines

The post template gains the panel, so the `post-template` element shot of the fixture post
`/writing/every-part/` changes, and any other shot that includes the post article. Refresh both
sets after merging `main`: `pnpm run test:visual:update` (macOS) and
`pnpm run test:visual:update:linux` (Docker Desktop; ask Don to start it), or the
`visual-baselines` label fallback, copying only `*-linux.png`. Shell, not-found, listing,
project and sections shots must not change; a diff there is a regression. Tasks phase adds the
task.

## Risks and open points

- **`ai` and `ASSETS` bindings in local test runners** (research R12): Wrangler treats `ai` as
  remote-only, and `ASSETS` points at `./dist`, which does not exist when `verify:quick` runs
  the worker tests before the build. The plan sets `remoteBindings: false` for the worker pool
  and stubs the API in E2E; spike T001 confirms, with no Cloudflare credentials, that
  `wrangler dev`, the worker pool and `wrangler types --check` start. Every outcome ends in a
  green suite: if not, the fallbacks are a test-only E2E config without `ai`, and stub `AI` /
  `ASSETS` objects in `miniflare.bindings` (tests inject their own fakes per request anyway).
- **Workers Builds token**: if deploying with an `ai` binding needs an extra token permission,
  the first preview deploy fails; Don adds it (quickstart §1).
- **Question quality** from a ~3B model: judged by Don on the preview (`[PREVIEW-CHECK]`). The
  fallback model and its lower bucket are named in research R1; switching is a config edit.
- **Live database steps** are all Don's (quickstart §1, `[PREVIEW-CHECK]` tasks in Phase 7).
  During implementation `wrangler.jsonc` keeps the current database names and ids, so every
  deploy, preview and test stays green; `0002` is additive and applies to whichever database
  `DB` is bound to. Deploy scripts and the Playwright command apply migrations by the binding
  name `DB`, and the setup check reads names from `wrangler.jsonc`, so Don's swap commit changes
  `wrangler.jsonc` only. The config and environment tests assert shape and consistency (W01),
  not live ids or names, so nothing is red by design before or after the swap (Principle II).
  The PR does not merge until Don's swap commit is pushed and its preview deploy is green
  (Phase 7 order). Old databases are deleted only after each environment deploys green against
  its new id and `SELECT count(*) FROM messages` returns 0; the rollback path is in
  `contracts/worker-config.md`.
- **Shared allowance**: production and preview share one account's 10,000 neurons/day; the
  default buckets use at most about half of it. Raising either bucket should keep
  2 × capacity × 13 ≤ 10,000.
- **Breakpoint `xl`** is new to the site's templates (R11); Don confirms the layout on preview.

## Complexity Tracking

No violations. The constitution amendment (Principle V) is the governance path the spec required,
not an exception.
