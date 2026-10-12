# Implementation Plan: Wayfinder self-assessment

**Branch**: `037-wayfinder-self-assessment` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/037-wayfinder-self-assessment/spec.md`

## Summary

Add a self-assessment to the Systems Leadership Wayfinder post: fifteen statements (three per
mindset shift) on one form, a chart and text summary placing the reader between each shift's
"From" and "To", links from low scores to the matching section and its Practical Application,
a printable sheet of the reader's focus areas (the mindsets scoring below 3, weakest first), and
a results link (scores in the URL
fragment) for comparing a later retake. Everything runs in the reader's browser and stores
nothing. The post's critical-thinking question source stays complete after the move (FR-021),
and the privacy policy gains one paragraph (FR-016a).

Approach: a new `assessments` content collection holds one YAML file that is the single source
for the shifts, statements and Practical Application paragraphs. Two MDX
components passed through the post route (`PracticalApplication`, `SelfAssessment`) render that
text into the post at build time, so the post's existing prose for those parts moves into the
data file unchanged. The post's 6-Week Development Plan section and its `DevelopmentPlan`
component were removed on 2026-10-11, and the six-week plan was then dropped from the feature in
favour of the focus areas (spec Clarifications, PR #176 decisions). The interactive part is a server-rendered form
plus a tiny processed `<script>` that lazy-imports one small module when the reader nears the
block (or at once when the address holds a result). Pure scoring, link and plan logic lives in
`src/lib/assessment/` and is unit-tested. No server code, no new dependency, no new service.
A one-line slot in the post's title card, built into the page on posts that render the block,
holds the "Take the self-assessment" / "Your earlier result is below" link, so a results-link
visit causes no layout shift (FR-018a). The question source expands the two text components back
into their Markdown before it is prepared (FR-021).

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

**Scale/Scope**: One post, one assessment of 5 shifts x 3 statements, a focus-areas print; 4 new
components (3 used in the post body, 1 in the title card), 1 new collection, about 7 small pure
modules, 1 client module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|-----------|--------|------------------------|
| **I. Test-First** | PASS | Every task writes its tests first and sees them fail. Layers: unit (scoring, bands, weakest-first low band, link grammar, schema, version), component (the two components from a `data` prop), build (error rows A1, A4–A7, A9, A10 on fixture files; script present only on the assessment post; A8 is a unit row), E2E (journeys and print, on the real post found through the content helper), a11y (block with results and with errors, light and dark), budget. No API endpoint changes, so no Worker integration test. |
| **II. Automated Release Gate** | PASS | No check is skipped, weakened or re-thresholded. The budget limits are unchanged; the post gains a budget case. Preview deployment per branch as usual. |
| **III. Human Review of Every Change** | PASS | Normal flow: PR from `drc-agents`, Don's approval, auto-merge armed after the final push. PREVIEW-CHECK items for Don (tasks.md lists them for the PR body): statement wording, SC-001 timing, print preview on A4 and Letter in his browser, the privacy paragraph, the moved text reading unchanged, the screen-reader and no-JavaScript reading-order pass, and the post-release beacon check (FR-016b). |
| **IV. First-Party Before Custom** | PASS | Astro Docs MCP was used for every Astro choice (research names each page). Data: Astro content collections with a Zod schema (first-party). Rendering text from data: MDX `components` prop (first-party). Interactivity: Astro processed `<script>` with `data-*` attributes (first-party). Lazy loading: Astro's `client:visible` was considered and falls short (not supported on MDX-passed components, needs a UI framework and its runtime that would break the 10 KB budget, cannot also load at once for a results link) — the custom part is one `IntersectionObserver` and one `import()` (research R3). Chart: no Astro or Cloudflare chart feature exists; drawn as inline SVG by site code, no library (spec Assumptions). Print: CSS `@media print` in an `is:global` style (first-party Astro directive). Cloudflare: no platform capability is needed — static assets already serve the page; no Worker, D1, KV, Durable Object or Workers AI is used, because nothing is stored or computed on the server. Fly.io: not used by this project; no server is needed. |
| **V. Static by Default** | PASS | The post stays prerendered; no endpoint is added (the live poll, which would need one, is out of scope, FR-019). The interactive block is an isolated island loaded late (FR-017). Core content (the post, including the moved Practical Application paragraphs) is in the HTML and reads with JavaScript off. |
| **VI. Content as Files** | PASS | The statements and moved text live in a YAML file in the repository under a collection schema; invalid content fails the build with a clear error naming the file (contract rows A1–A10). No CMS, no database. |
| **VII. Private Data: Minimal and Protected** | PASS | Answers are not collected by the site: they never leave the browser, are not logged, stored or sent (FR-016). The URL fragment is never sent in a request; an E2E test records every request on a results-link journey (SC-004), and the production-only analytics beacon, which strips the fragment today (research R14), has a release check with a pass/fail rule and a same-day fallback (FR-016b). No IP, fingerprint, cookie or storage. Principle VII stays as written (spec Scope); the privacy policy says how the assessment handles answers (FR-016a). No secrets involved. |
| **VIII. Cloudflare Best Practices** | PASS | No Worker, binding, migration or Cron Trigger changes. Only `/api/*` invokes Worker code; this feature is static assets only. |
| **IX. Cost Ceiling** | PASS | Expected added monthly cost: **$0**. No new service, binding, storage or request volume beyond a few KB of static assets on the existing free plan. |
| **X. Accessible, Fast and Private** | PASS | WCAG 2.2 AA in both themes (native radios in fieldsets, labelled points, error summary, live region, text summary as the chart's equivalent, shape plus colour for markers, forced-colours support, 320 px). Budget case added for the post. No third-party script, no tracking. |
| **XI. Spec Kit Workflow** | PASS | Spec Kit branch and directory (`037-wayfinder-self-assessment`). One feature on this branch. Shared files edited with sibling worktrees in mind: `src/pages/writing/[slug].astro`, `src/pages/writing/[slug]/question-source.json.ts`, `src/layouts/PostLayout.astro` (an optional named slot only), `src/lib/content/body.ts`, `src/content.config.ts`, `src/content/pages/privacy-policy.mdx`, `docs/posts.md`, `tests/e2e/budget.spec.ts` and `tests/helpers/content.ts` — small additive edits; on conflict, merge `origin/main` and keep both sides. |
| **Technology Constraints** | PASS | Astro, strict TypeScript, Tailwind, Cloudflare Workers static assets, pnpm with its lockfile. No new tool, library or service. |
| **Security Baseline** | PASS | `public/_headers` and the CSP unchanged (the module is served from `'self'`; no inline style or script added outside Astro's hashed processing). No dependency added. Reader input is never sent anywhere, so no automated consumer sees it. |
| **Development Workflow** | PASS | Astro decisions cite the docs (research R1–R3, R7). Tests come before the code they cover, each test task names its layer (Test plan below). Out-of-scope items stay in the spec's Follow-up work. Copy is plain language. |

No exceptions; Complexity Tracking is empty.

## Design overview

### Single source of text (FR-004)

`src/content/assessments/wayfinder.yaml` holds the shifts (name, From, To, heading anchor,
Practical Application text, three statements), the five scale labels, the block's title and intro. The schema (`src/content/schemas/assessment.ts`) fixes five
shifts of three statements. The post replaces its five `**Practical Application**` paragraphs
with `<PracticalApplication assessment="wayfinder" shift="..." />`, rendering the same markup as
before. The post ends with its "Printable Resources" section. Details:
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

The module appends a focus-areas sheet to `<body>` (title, date, the mindsets to develop with
each section's full address, the results link) and marks `<html>`; a print-only style in
`client.css` shows just the sheet. Without a result, print shows the post with the statement
list (research R7, as amended 2026-10-11).

### Post images and the budget (2026-10-11)

Collapsing the block (FR-001a) shortened it, so the budget journey's scroll to it brings the two
Wayfinder infographics in "The Systems Leadership Wayfinder" (1536 px Markdown images inside
`<Figure>`) into lazy-load range. Served at full size they took the journey to 348 KB against the
150 KB limit; the limit is not changed. The post route now passes `img: PostImage` to MDX
(docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content: a local
Markdown image reaches the component as its `ImageMetadata`). `PostImage` renders Astro's
`<Image>` with `widths` 360/720/1080/1536, `sizes="(min-width: 1280px) 1280px, calc(100vw -
2rem)"` and quality 75 (docs.astro.build/en/reference/modules/astro-assets/#widths), so a 390 px
phone downloads the 360 px file (about 33 KB) and the journey measures about 143 KB. It applies
to every Markdown image in a post body, which keeps posts import-free; pages are unchanged.
Considered: the global `image.layout: "constrained"` (docs.astro.build/en/reference/configuration-reference/#imagelayout)
changes every image on the site, adds data attributes everywhere and starts at 640 px, still over
the limit; an `<Image>` import in the post is refused by the posts' section rule.

### Modules

| File | Kind | Role |
|------|------|------|
| `src/content/schemas/assessment.ts` | build | Zod schema and refinements (A1–A3) |
| `src/lib/assessment/version.ts` | build (node:crypto) | Statement set version (R5) |
| `src/lib/assessment/score.ts` | pure, shared | Scores, bands, band phrases, change text, low-band selection (weakest first, stable) and "next to practise" |
| `src/lib/assessment/result-link.ts` | pure, shared | Encode, decode, URL |
| `src/lib/assessment/lookup.ts` | build | `getEntry` wrapper with A4/A5 errors through `contentError`, and the A6/A7 heading checks used by the post route |
| `src/lib/assessment/client.ts` | browser | Form handling, validation, chart, summary, mindsets to develop, focus-areas sheet, print, copy, clear, history, title-card link text |
| `src/lib/assessment/question-text.ts` | pure, build | Expands `PracticalApplication` tags in a post body back into their Markdown text, and drops `SelfAssessment` (FR-021); used by the post route and `question-source.json.ts` before `prepareQuestionSource()` |
| `src/lib/assessment/checks.ts` | pure, build | A9 (From/To lines match) and A10 (no moved text left in the prose) checks on a post body, used by the post route |
| `src/components/post/PostImage.astro` | component | Every Markdown image in a post body: `<Image>` with `widths`, `sizes` and quality 75 (budget, 2026-10-11) |
| `src/components/assessment/AssessmentLink.astro` | component | The reserved one-line title-card link, rendered into `PostLayout`'s new optional `title-extra` slot by the post route for posts that render `SelfAssessment` |
| `src/components/assessment/PracticalApplication.astro` | component | One paragraph |
| `src/components/assessment/SelfAssessment.astro` | component | Block markup inside a native `<details>` collapsed behind a "Take the self-assessment" summary (FR-001a, Don's PR #176 review; native HTML, no script needed to open it), bootstrap script (opens it for a results or in-block fragment, loads the module on approach or on open), print style |
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

The title-card link line (FR-012) is rendered into a new optional named slot of `PostLayout`
only by posts that render the assessment. With the slot empty, `PostLayout` renders exactly the
markup it renders today, so fixture posts and the post-template snapshots are unchanged. The
module only changes the link's text and target; it inserts nothing into the title card.

## Test plan (layers)

| Layer | Files (new unless noted) | Covers |
|-------|--------------------------|--------|
| Unit | `tests/unit/assessment/score.test.ts`, `plan.test.ts`, `result-link.test.ts`, `version.test.ts`, `schema.test.ts`, `question-text.test.ts`, `checks.test.ts`; `tests/unit/content/body.test.ts` (extend) | FR-005, FR-007 phrases, FR-008 selection, FR-010 order and ties, FR-012/014 grammar and version (including which edits change it), FR-021 expansion, A1–A3, A8–A10 rules |
| Component | `tests/component/assessment/PracticalApplication.test.ts`, `SelfAssessment.test.ts` | Same markup as the old prose; U2 structure, labels, `type="button"`; U18 no-JS list; data attribute holds no statement answers |
| Build | `tests/build/post-validation.test.ts` (extend) with `tests/fixtures/posts/broken/a0*-*.mdx` and `tests/fixtures/assessments/`; `tests/build/assessment-scripts.test.ts`; `tests/build/question-source.test.ts` (new or extend) | A1, A4–A7, A9, A10 reach the output naming the file; U16 / SC-005: only posts rendering the block carry its loader, chunk reference, styles and title-card line, and shared scripts are unchanged (output spanning pages); FR-021: each built `question-source.json` for a post using the components holds every practical application text and no component tag |
| E2E | `tests/e2e/self-assessment.spec.ts` | U3–U15, U19–U21, L1–L7, Story 2 scenario 2, print media (U8) and PDF page count on A4 and Letter (U9), zero requests and no request carrying the fragment on a results-link journey (U15, L7), focus and reduced-motion rules (U20), CLS 0 before input with a fragment at 320 and 390 px (U21), 320 px, 200% zoom and text-spacing overflow (U17) |
| E2E no-JS | `tests/e2e/no-js.spec.ts` (extend) | U18 |
| A11y | `tests/e2e/self-assessment.a11y.spec.ts` | U17: axe in the empty, errors, results, comparison, separate-results and unreadable-link states (SC-006), light and dark, plus forced colours for the markers. Second layer beside the template a11y runs because the block's states only exist after interaction. |
| Budget | `tests/e2e/budget.spec.ts` (extend) | FR-018b / SC-005 at load and after scrolling, answering and showing results, under the existing slow-4G and 4x CPU conditions |
| Content | `src/content/pages/privacy-policy.mdx` | FR-016a paragraph; no test beyond the existing page checks (copy, not behaviour) |
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
│   ├── SelfAssessment.astro
│   └── AssessmentLink.astro                  # reserved title-card link line
├── lib/
│   ├── assessment/{version,score,plan,result-link,lookup,client,question-text,checks}.ts
│   └── content/body.ts                       # accepts post components for kind "post"
├── layouts/PostLayout.astro                  # optional title-extra slot, empty by default
├── content/pages/privacy-policy.mdx          # FR-016a paragraph
└── pages/writing/
    ├── [slug].astro                          # pass post components; A6/A7/A9/A10 checks; title-card link; expanded question hash
    └── [slug]/question-source.json.ts        # expanded question source (FR-021)

tests/
├── unit/assessment/*.test.ts
├── component/assessment/*.test.ts
├── build/{post-validation.test.ts,assessment-scripts.test.ts,question-source.test.ts}
├── fixtures/{assessments/,posts/broken/a0*.mdx}
├── helpers/content.ts                        # + postsWithAssessment()
└── e2e/{self-assessment.spec.ts,self-assessment.a11y.spec.ts,no-js.spec.ts,budget.spec.ts}

docs/posts.md                                 # how to use the two components; rows A1–A10
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

- **Web Analytics and the fragment** (research R14): the beacon is injected at the edge on
  production only, so CI cannot run it. The current beacon (`beacon.min.js`, version 2026.10.0)
  clears the hash and query from the page address and referrer before sending. FR-016b makes
  the post-release check concrete (pass: no payload field holds `#`, `result=` or the fragment;
  fail: Don adds a Web Analytics exclude rule for the post's path the same day, plus an issue).
  The site's own requests are covered in CI by the E2E request recorder (SC-004).
- **Questions API source** (research R13): resolved in this slice. The question source expands
  the moved components back into their Markdown (FR-021), so it keeps the same text; the hash
  changes once and the post's cached question set regenerates once.
- **JS budget headroom**: the Wayfinder post loads no separate script file today (its small
  scripts, including the questions panel's, are inlined in the page), so the lazy module has the
  whole 10 KB script allowance; its 6 KB target leaves 4 KB. The budget case after scrolling
  and showing results catches a breach.
- **Statement wording** is drafted in implementation and needs Don's edit in review
  (PREVIEW-CHECK); any later wording change invalidates comparisons with older links by design.
- **CLS on results-link visits**: resolved by reserving the title-card line in the built page
  (FR-012, FR-018a): the module only swaps its text, so nothing moves. The earlier result is
  inserted far below the visible area at the top of the page, and scroll anchoring holds visible
  content still if the reader has scrolled. An E2E case with a fragment asserts CLS 0 before
  input at 320 and 390 px.

## Complexity Tracking

No constitution violations to justify.
