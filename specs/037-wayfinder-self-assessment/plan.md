# Implementation Plan: Wayfinder self-assessment

**Branch**: `037-wayfinder-self-assessment` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/037-wayfinder-self-assessment/spec.md`

## Summary

Add a self-assessment to the Systems Leadership Wayfinder post: fifteen statements (three per
mindset shift) on one form, a chart and text summary placing the reader between each shift's
"From" and "To", links from low scores to the matching section and its Practical Application,
a printable six-week plan ordered by the reader's scores, and a results link (scores in the URL
fragment) for comparing a later retake. Everything runs in the reader's browser and stores
nothing.

Approach: a new `assessments` content collection holds one YAML file that is the single source
for the shifts, statements, Practical Application paragraphs and week activities. Three MDX
components passed through the post route (`PracticalApplication`, `DevelopmentPlan`,
`SelfAssessment`) render that text into the post at build time, so the post's existing prose for
those parts moves into the data file unchanged. The interactive part is a server-rendered form
plus a tiny processed `<script>` that lazy-imports one small module when the reader nears the
block (or at once when the address holds a result). Pure scoring, link and plan logic lives in
`src/lib/assessment/` and is unit-tested. No server code, no new dependency, no new service.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`), Astro 7.3.5, MDX 8.0.2,
Tailwind CSS 4.3.3

**Primary Dependencies**: none new. Astro content collections (`glob()` loader, Zod from
`astro/zod`), `@astrojs/mdx` components prop, Astro processed `<script>`, browser platform APIs
(`IntersectionObserver`, dynamic `import()`, `history.replaceState`, `window.print`, Clipboard
API, SVG DOM)

**Storage**: Authored content in `src/content/assessments/wayfinder.yaml`. Reader answers and
results exist only in the page and the URL fragment; no database, no cookies, no browser storage

**Testing**: Vitest (unit and Astro component tests via the container API; build tests running
real `astro build` on a fixture site), Playwright (e2e, a11y with axe, budget, visual) — as
`docs/testing.md` lays out

**Target Platform**: Static pages on Cloudflare Workers static assets; evergreen browsers;
print to A4 and US Letter

**Project Type**: Static web site (Astro) with one Worker for `/api/*`, untouched by this slice

**Performance Goals**: The Wayfinder post keeps the existing budget (LCP 2.5 s, CLS 0.1,
long tasks 200 ms, JavaScript 10 KB, total 150 KB on simulated mobile); the assessment module
targets 6 KB compressed or less; the bootstrap script is a few hundred bytes

**Constraints**: CSP without `'unsafe-inline'` for scripts or styles (no `style` attributes, no
inline handlers); no third-party script; WCAG 2.2 AA light and dark; 320 px without sideways
scroll; nothing sent over the network (SC-004); the fragment is the only persistence

**Scale/Scope**: One post, one assessment of 5 shifts x 3 statements, 6-week plan; 3 new
components, 1 new collection, about 5 small pure modules, 1 client module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|-----------|--------|------------------------|
| **I. Test-First** | PASS | Every task writes its tests first and sees them fail. Layers: unit (scoring, bands, plan order, link grammar, schema, version), component (the three components from a `data` prop), build (error rows A1, A4–A8 on fixture files; script present only on the assessment post), E2E (journeys and print, on the real post found through the content helper), a11y (block with results and with errors, light and dark), budget. No API endpoint changes, so no Worker integration test. |
| **II. Automated Release Gate** | PASS | No check is skipped, weakened or re-thresholded. The budget limits are unchanged; the post gains a budget case. Preview deployment per branch as usual. |
| **III. Human Review of Every Change** | PASS | Normal flow: PR from `drc-agents`, Don's approval, auto-merge armed after the final push. PREVIEW-CHECK items for Don: print preview on A4 and Letter in his browser, statement wording, the moved text reading unchanged. |
| **IV. First-Party Before Custom** | PASS | Astro Docs MCP was used for every Astro choice (research names each page). Data: Astro content collections with a Zod schema (first-party). Rendering text from data: MDX `components` prop (first-party). Interactivity: Astro processed `<script>` with `data-*` attributes (first-party). Lazy loading: Astro's `client:visible` was considered and falls short (not supported on MDX-passed components, needs a UI framework and its runtime that would break the 10 KB budget, cannot also load at once for a results link) — the custom part is one `IntersectionObserver` and one `import()` (research R3). Chart: no Astro or Cloudflare chart feature exists; drawn as inline SVG by site code, no library (spec Assumptions). Print: CSS `@media print` in an `is:global` style (first-party Astro directive). Cloudflare: no platform capability is needed — static assets already serve the page; no Worker, D1, KV, Durable Object or Workers AI is used, because nothing is stored or computed on the server. Fly.io: not used by this project; no server is needed. |
| **V. Static by Default** | PASS | The post stays prerendered; no endpoint is added (the live poll, which would need one, is out of scope, FR-019). The interactive block is an isolated island loaded late (FR-017). Core content (the post, including the moved Practical Application paragraphs and the plan) is in the HTML and reads with JavaScript off. |
| **VI. Content as Files** | PASS | The statements and moved text live in a YAML file in the repository under a collection schema; invalid content fails the build with a clear error naming the file (contract rows A1–A8). No CMS, no database. |
| **VII. Private Data: Minimal and Protected** | PASS | Answers are not collected by the site: they never leave the browser, are not logged, stored or sent (FR-016). The URL fragment is never sent in a request. No IP, fingerprint, cookie or storage. Principle VII stays as written (spec Scope). No secrets involved. |
| **VIII. Cloudflare Best Practices** | PASS | No Worker, binding, migration or Cron Trigger changes. Only `/api/*` invokes Worker code; this feature is static assets only. |
| **IX. Cost Ceiling** | PASS | Expected added monthly cost: **$0**. No new service, binding, storage or request volume beyond a few KB of static assets on the existing free plan. |
| **X. Accessible, Fast and Private** | PASS | WCAG 2.2 AA in both themes (native radios in fieldsets, labelled points, error summary, live region, text summary as the chart's equivalent, shape plus colour for markers, forced-colours support, 320 px). Budget case added for the post. No third-party script, no tracking. |
| **XI. Spec Kit Workflow** | PASS | Spec Kit branch and directory (`037-wayfinder-self-assessment`). One feature on this branch. Shared files edited with sibling worktrees in mind: `src/pages/writing/[slug].astro`, `src/lib/content/body.ts`, `src/content.config.ts`, `docs/posts.md`, `tests/e2e/budget.spec.ts` and `tests/helpers/content.ts` — small additive edits; on conflict, merge `origin/main` and keep both sides. |
| **Technology Constraints** | PASS | Astro, strict TypeScript, Tailwind, Cloudflare Workers static assets, pnpm with its lockfile. No new tool, library or service. |
| **Security Baseline** | PASS | `public/_headers` and the CSP unchanged (the module is served from `'self'`; no inline style or script added outside Astro's hashed processing). No dependency added. Reader input is never sent anywhere, so no automated consumer sees it. |
| **Development Workflow** | PASS | Astro decisions cite the docs (research R1–R3, R7). Tests come before the code they cover, each test task names its layer (Test plan below). Out-of-scope items stay in the spec's Follow-up work. Copy is plain language. |

No exceptions; Complexity Tracking is empty.

## Design overview

### Single source of text (FR-004)

`src/content/assessments/wayfinder.yaml` holds the shifts (name, From, To, heading anchor,
Practical Application text, week text, three statements), the integration week, the five scale
labels, the block's title and intro. The schema (`src/content/schemas/assessment.ts`) fixes five
shifts of three statements. The post replaces its five `**Practical Application**` paragraphs
with `<PracticalApplication assessment="wayfinder" shift="..." />` and its six week paragraphs
with `<DevelopmentPlan assessment="wayfinder" />`, rendering the same markup as before. Details:
[contracts/assessment-data.md](./contracts/assessment-data.md).

### The assessment block

`<SelfAssessment assessment="wayfinder" />` under a `##` heading in the post, between Mindset
Shift #5 and "The Systems Leadership Wayfinder". It renders the form (native radios), the
no-JavaScript note with the statements as a list, a status region and empty result containers,
and passes the client data as one JSON `data-*` attribute plus the build-computed statement set
version. Behaviour rows U1–U19: [contracts/assessment-ui.md](./contracts/assessment-ui.md).

### Results link

`#result=<version>.<yyyymmdd>.<sum>-<sum>-<sum>-<sum>-<sum>`, written with `replaceState` each time
results show and removed on clear; decoded on load. Grammar and rows L1–L7:
[contracts/results-link.md](./contracts/results-link.md).

### Printing

The module appends a plan sheet to `<body>` and marks `<html>`; a print-only global style shows
just the sheet. Without a result, print shows the post with the statement list (research R7).

### Modules

| File | Kind | Role |
|------|------|------|
| `src/content/schemas/assessment.ts` | build | Zod schema and refinements (A1–A3) |
| `src/lib/assessment/version.ts` | build (node:crypto) | Statement set version (R5) |
| `src/lib/assessment/score.ts` | pure, shared | Scores, bands, band phrases, change text, low-band and "next to practise" selection |
| `src/lib/assessment/plan.ts` | pure, shared | Six-week order (stable by sum) |
| `src/lib/assessment/result-link.ts` | pure, shared | Encode, decode, URL |
| `src/lib/assessment/lookup.ts` | build | `getEntry` wrapper with A4/A5 errors through `contentError`, and the A6/A7 heading checks used by the post route |
| `src/lib/assessment/client.ts` | browser | Form handling, validation, chart, summary, links, plan sheet, print, copy, clear, history |
| `src/components/assessment/PracticalApplication.astro` | component | One paragraph |
| `src/components/assessment/DevelopmentPlan.astro` | component | Six week paragraphs |
| `src/components/assessment/SelfAssessment.astro` | component | Block markup, bootstrap script, print style |
| `src/components/assessment/index.ts` | registry | `postComponents` and their names, used by the route and `validatePageBody` |

## Visual baselines

This slice changes **no snapshotted surface**: not the shell (header, footer, mobile menu), not
a template (`PostLayout` and the post route's markup for every other post are unchanged), and not
the design system (no change to `src/styles/global.css` tokens or the Tailwind theme). The new
components render only in a real post, which the visual project never snapshots; their CSS is
scoped to their own data attributes and a root attribute only the module sets, and the print
rules apply to print media only. The fixture site is not changed. **So there are no
baseline-update tasks.** Any diff in `pnpm run test:visual` is a regression to fix
(`.claude/skills/_shared/visual-baselines.md`).

The "Your earlier result is below" link is inserted into the title card by the module only when
the address holds a result; it is not part of the template's built markup.

## Test plan (layers)

| Layer | Files (new unless noted) | Covers |
|-------|--------------------------|--------|
| Unit | `tests/unit/assessment/score.test.ts`, `plan.test.ts`, `result-link.test.ts`, `version.test.ts`, `schema.test.ts`; `tests/unit/content/body.test.ts` (extend) | FR-005, FR-007 phrases, FR-008 selection, FR-010 order and ties, FR-012/014 grammar and version, A1–A3, A8 |
| Component | `tests/component/assessment/PracticalApplication.test.ts`, `DevelopmentPlan.test.ts`, `SelfAssessment.test.ts` | Same markup as the old prose; U2 structure, labels, `type="button"`; U18 no-JS list; data attribute holds no statement answers |
| Build | `tests/build/post-validation.test.ts` (extend) with `tests/fixtures/posts/broken/a0*-*.mdx` and `tests/fixtures/assessments/`; `tests/build/assessment-scripts.test.ts` | A1, A4–A7 reach the output naming the file; U16: only posts rendering the block carry its script (output spanning pages) |
| E2E | `tests/e2e/self-assessment.spec.ts` | U3–U15, U19, L1–L7, Story 2 scenario 2, print media (U8) and PDF page count on A4 and Letter (U9), zero requests (U15), 320 px (U17 overflow part) |
| E2E no-JS | `tests/e2e/no-js.spec.ts` (extend) | U18 |
| A11y | `tests/e2e/self-assessment.a11y.spec.ts` | U17: axe with results, with errors and with a comparison, light and dark. Second layer beside the template a11y runs because the block's states only exist after interaction. |
| Budget | `tests/e2e/budget.spec.ts` (extend) | SC-005 at load and after scrolling to the block |
| Visual | none | No surface changes (above) |

E2E and a11y specs find the post through a new `postsWithAssessment()` in
`tests/helpers/content.ts` and compute expectations from its YAML; they never name the post
(docs/testing.md "Real content in tests").

## Project Structure

### Documentation (this feature)

```text
specs/037-wayfinder-self-assessment/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── assessment-data.md
│   ├── assessment-ui.md
│   └── results-link.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── content.config.ts                         # + assessments collection
├── content/
│   ├── assessments/wayfinder.yaml            # new: single source
│   ├── schemas/assessment.ts                 # new
│   └── posts/the-systems-leadership-wayfinder-…mdx   # prose moved to components; block added
├── components/assessment/
│   ├── index.ts                              # post-only component registry
│   ├── PracticalApplication.astro
│   ├── DevelopmentPlan.astro
│   └── SelfAssessment.astro
├── lib/
│   ├── assessment/{version,score,plan,result-link,lookup,client}.ts
│   └── content/body.ts                       # accepts post components for kind "post"
└── pages/writing/[slug].astro                # pass post components; A6/A7 heading check

tests/
├── unit/assessment/*.test.ts
├── component/assessment/*.test.ts
├── build/{post-validation.test.ts,assessment-scripts.test.ts}
├── fixtures/{assessments/,posts/broken/a0*.mdx}
├── helpers/content.ts                        # + postsWithAssessment()
└── e2e/{self-assessment.spec.ts,self-assessment.a11y.spec.ts,no-js.spec.ts,budget.spec.ts}

docs/posts.md                                 # how to use the three components; rows A1–A8
```

**Structure Decision**: The existing single Astro project. New code follows the site's
patterns: a collection in `src/content.config.ts` with its schema in `src/content/schemas/`,
components under `src/components/<area>/`, pure logic under `src/lib/<area>/`, tests by layer.

## Post-design Constitution re-check

Re-checked after research, data model and contracts: still PASS on every row. The design adds
no endpoint, dependency, storage, cost, inline style or third-party request; the one custom
piece (lazy loading via `IntersectionObserver` + `import()`) is justified under Principle IV in
research R3.

## Risks and open questions

- **Web Analytics and the fragment** (research R14): the edge-injected beacon's handling of the
  URL fragment on a normal page view is not documented. Post-release check for Don; follow-up if
  it records the fragment.
- **Questions API source** (research R13): the moved text disappears from this post's question
  source because tags are stripped; the hash changes. Accepted; widening the source is
  follow-up work.
- **JS budget headroom**: the post already carries the questions panel script; the module must
  stay near 6 KB compressed. The budget case after scrolling catches a breach.
- **Statement wording** is drafted in implementation and needs Don's edit in review
  (PREVIEW-CHECK); any later wording change invalidates comparisons with older links by design.
- **CLS on results-link visits**: inserting the "earlier result" link into the title card
  shifts content once on such visits. It is small and only on that path (the budget run has no
  fragment); keep the inserted line to one short line.

## Complexity Tracking

No constitution violations to justify.
