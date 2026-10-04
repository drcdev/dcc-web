# Implementation Plan: Retired status for projects

**Branch**: `015-project-retired-status` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-project-retired-status/spec.md` (GitHub issue #50)

**Major change (Constitution Principle III): YES, confirmed.** The slice adds a new tone,
`mauve` (filled), to the shared label pill `src/components/Pill.astro`, which "changes the
design system". It adds no dependency, service, cost or CI/deployment change. Auto-merge stays
off; `tasks.md` must carry a `[PREVIEW-CHECK]` task for Don to look at `/projects/` and
`/projects/tempo/` in both themes on the preview deployment, and the PR body must say why
auto-merge is off.

## Summary

Add `retired` to the project `status` enum and an optional `replacedBy` setting: either
`project: <id>` (Astro `reference("projects")`) or `name:` with an optional https `href:`.
Schema refinements reject a replacement on a non-retired project and malformed forms; a pure
check in the story route's `getStaticPaths()` rejects a missing or self reference over every
entry, drafts included. A pure resolver turns the replacement into `{ name, href? }`, linking a
project only when it has a page in this build (a draft target in production is named without a
link). `StoryHeader` shows a fixed note inside the header ("**Retired.** I no longer use or
maintain this project." plus " It was replaced by <name>."), and `StatusPill` shows "Retired"
in the new filled mauve tone on both the story and the index row. Tempo becomes
`status: retired` with `replacedBy: { name: Cadence }`. One new fixture project exercises the
tone and the note on the fixture site, adding two visual subjects (16 new baseline images, none
changed).

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Node from `.nvmrc` via nvm

**Primary Dependencies**: Astro content collections (`astro:content` `reference`, `getCollection`),
`@astrojs/mdx` 8.0.2, Zod 4 via `astro/zod`, Tailwind CSS theme tokens. No new dependency.

**Storage**: Markdown/MDX files in `src/content/projects/` (Principle VI). No database.

**Testing**: Vitest `unit` project (unit and Astro component tests through the existing
container helpers), Vitest `build` project (real `astro build` / `sync` of a fixture site),
Playwright projects `e2e`, `sections` (fixture site on port 4322), `a11y`, `visual`.

**Target Platform**: Static pages on Cloudflare Workers static assets; no Worker code involved.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: No change to the performance budget: no client JavaScript, a few CSS
utility classes, one short paragraph.

**Constraints**: WCAG 2.2 AA in both themes (pill and note contrast); readable with JavaScript
off; invalid content fails the build naming the file; no retired date.

**Scale/Scope**: 4 real projects (1 becomes retired), 1 new fixture project, 1 new broken
fixture; ~6 source files, ~12 test files, 3 docs.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 (below, unchanged).*

| Principle | How this plan complies |
|---|---|
| I. Test-First | Every behaviour has a failing test written first, at one named layer (see "Test placement"). Tasks put tests before the code they cover. |
| II. Automated Release Gate | No check is skipped or weakened. The guide test's walker learns to treat `reference()` as a leaf so it does not demand Astro's internal keys; the real settings stay required (research R2). Full `verify` runs before the PR. |
| III. Human Review | **Major**: new design-system pill tone. Auto-merge off, `[PREVIEW-CHECK]` task, reason stated in the PR body. |
| IV. First-Party Before Custom | Astro Docs MCP consulted (research R2, R3). Status: content collection schema enum (first-party). Replacement link: Astro `reference()` (first-party). Existence and self checks: custom, because `reference()` validates only when `getEntry()` runs and then returns `undefined` without naming the file (docs: reference() page). Route data: `getStaticPaths` over `getCollection` (first-party). Rendering: Astro components, prerendered. Colour: existing Tailwind `mauve` theme tokens, no new tokens. Cloudflare: nothing new, pages remain static assets. Fly.io: not in the stack (removed in feature 004); nothing to consider. |
| V. Static by Default | Pill and note are prerendered HTML with no script; readable with JS off (FR-010). |
| VI. Content as Files | `status` and `replacedBy` live in MDX front matter, validated by the schema and the route check; invalid content fails the build naming the file (RP01 to RP05). `docs/projects.md` and the template comment document both. |
| VII. Private Data | Not touched (no contact data). |
| VIII. Cloudflare Best Practices | No Worker, D1, Turnstile, Cron or config change. Only `/api/*` runs Worker code, unchanged. |
| IX. Cost Ceiling | Expected new monthly cost: **$0** (no service, no dependency). |
| X. Accessible, Fast and Private | Text label, not colour alone; AA contrast checked by `a11y` (axe) on the retired fixture story in both themes and widths; no JS added, budget unaffected; no third-party script. |
| XI. Spec Kit Workflow | Spec Kit branch and directory; one feature. No parallel worktree edits the same files as far as known; if one does, it merges after this PR merges and `main` is merged in. |
| Dev workflow: Astro decisions cite docs | research.md R1 to R3 name the Astro pages. |
| Dev workflow: test placement | One primary layer per behaviour, named below; second layers carry a written reason. |
| Dev workflow: scope | Focus Pocus (also retired in reality), a Cadence story and a status filter stay out of scope (spec follow-up). |
| Dev workflow: plain language | Note wording fixed by the spec; error messages plain (data-model.md). |

No violations; Complexity Tracking is empty.

## Design

### Source changes

| File | Change |
|---|---|
| `src/lib/content/project-status.ts` (new) | `projectStatuses` (four values), `ProjectStatus` type, `statusLabel`, `statusTone` (`retired` → `mauve`). |
| `src/content/schemas/project.ts` | `status: z.enum(projectStatuses)`; `replacedBy` strict object (`project: reference("projects")`, `name`, `href`), refinements RP01, RP02 (data-model.md). Imports `reference` from `astro:content`. |
| `src/lib/content/project-replacement.ts` (new) | `checkReplacements(entries)` (RP04, RP05, `projectFileError`); `resolveReplacement(entry, all, publishedIds)` → `{ name, href? } \| undefined`. |
| `src/pages/projects/[slug].astro` | After the `validateProjectStory` loop, `checkReplacements(all)`; per path, `replacement: resolveReplacement(entry, all, publishedIds)` as a prop; passed to `ProjectLayout`. |
| `src/layouts/ProjectLayout.astro` | `replacement?` prop passed to `StoryHeader`. |
| `src/components/project/StoryHeader.astro` | `status: ProjectStatus`; `replacement?`; renders `<p data-retired-note>` inside the header after the meta when retired (contracts/pages-dom.md). |
| `src/components/project/StatusPill.astro` | Uses `ProjectStatus`, `statusLabel`, `statusTone`. |
| `src/components/project/ProjectRow.astro` | `status: ProjectStatus` (type only). |
| `src/components/Pill.astro` | `tone: "mauve"` with the classes in data-model.md. |
| `src/components/project/portfolio.css` | `[data-retired-note]` style from existing mauve tokens (research R5). |
| `src/content/projects/tempo.mdx` | `status: retired`, `replacedBy: { name: Cadence }`; body comment updated (research R8). |
| `src/content/projects/_template.mdx` | Optional-details comment documents `status: retired` and `replacedBy` (FR-011); front matter unchanged. |
| `docs/projects.md` | `status` row lists `retired`; `replacedBy` row and both forms; build-error classes for RP01 to RP05. |
| `docs/testing.md` | Contract-row mapping gains RP01 to RP05 and the changed S02; visual coverage notes the two new subjects. |
| `docs/design-source.md` | `Pill` row mentions the Retired-only filled mauve tone. |

### Test placement

Each behaviour has one primary layer (docs/testing.md "Where a test goes"). Test files must not
contain `specs/...` path literals (the changed-paths drift guard rejects them); cite contract
row ids instead.

| Behaviour (FR / SC / row) | Layer | Test |
|---|---|---|
| `retired` accepted; S02 message lists `retired` (FR-001) | unit | `tests/unit/content/project-schema.test.ts` (extend the status loop and the S02 phrase list) |
| RP01, RP02, RP03 schema rules (FR-008) | unit | `tests/unit/content/project-schema.test.ts` "RP01" to "RP03" |
| RP04 missing, RP05 self (FR-008) | unit | `tests/unit/content/project-replacement.test.ts` (new) "RP04", "RP05" |
| Resolver: on-site published link, draft target with and without drafts, off-site with href, name only, none (FR-007) | unit | `tests/unit/content/project-replacement.test.ts` |
| Status label and tone map (FR-004) | unit | `tests/unit/content/project-status.test.ts` (new) |
| Retired sorts by date like any status (FR-002) | unit | `tests/unit/content/project-order.test.ts` (one case) |
| Tempo is retired, replaced by Cadence with no href, still published (FR-009, SC-005) | unit | `tests/unit/content/projects-content.test.ts` (add the status assertion; slug and `published` lists unchanged) |
| Template documents `retired` and `replacedBy`, still passes the schema (FR-011) | unit | `tests/unit/content/project-template.test.ts` |
| Guide names `retired`, `replacedBy`, `project`, `name`, `href` and the RP error classes (FR-011) | unit | `tests/unit/content/projects-guide.test.ts` (walker treats `reference()` as a leaf; add the error classes) |
| Pill `mauve` tone: same shape as other tones, `data-tone="mauve"` | component | `tests/component/project/Pill.test.ts` |
| StatusPill shows "Retired" with `data-status="retired"` and tone mauve (FR-004, FR-010) | component | `tests/component/project/StatusPill.test.ts` |
| StoryHeader note: exact wording for none / `{name}` / `{name, href}`; no note on other statuses; draft notice before the header and note after the meta on a retired draft; link text is the name, same-tab (no `target`), underlined; name-only has no `<a>`; no role/aria on pill or note; no script (FR-005, FR-007, FR-010, FR-012) | component | `tests/component/project/StoryHeader.test.ts` |
| ProjectRow for a retired project: Retired pill, same `data-themes`, title link unchanged (FR-002, US1-4) | component | `tests/component/project/ProjectRow.test.ts` |
| RP04/RP05 call site: a retired **draft** naming a missing project fails a **production** build, naming file and id; message carries no canary | build | `tests/build/project-validation.test.ts` "RP04: a retired draft naming a missing project fails a production build" with `tests/fixtures/projects/broken/RP04-missing-replacement.mdx` |
| Route wiring and draft replacement in production: production build lists the retired row with the Retired pill, builds `/projects/retired/` with all four parts and a note naming "Draft project" without a link; preview build links `/projects/draft/` (FR-002, FR-003, FR-007, SC-001) | build | `tests/build/drafts.test.ts` (add `{ from: "retired.mdx", replace: [["project: minimal", "project: draft"]] }` to the `projects` list of the existing two builds, so only these builds' copy points at the draft fixture; no new build) |
| Following the note's link reaches the replacement story in one click (SC-002, US2-1) | E2E | `tests/e2e/projects-fixtures.spec.ts` (new test on `/projects/retired/`) |
| Retired pill computed colours equal the mauve tokens in both themes (FR-004; tokens are what pixels cannot name) | E2E (theme-tokens) | `tests/e2e/theme-tokens.spec.ts`: a `/projects/retired/` entry with a `[data-status="retired"]` probe: background `mauve-50`/`mauve-800`, color `mauve-950`/`mauve-100`, border `mauve-800`/`mauve-300` |
| Template accessibility with a retired project, story and index (SC-004, FR-012); reflow of the pill and note (FR-013) | a11y | `tests/e2e/a11y.spec.ts` "portfolio states": add "the retired fixture story" (`/projects/retired/`) and "the full fixture index" (`/projects/`, which lists the retired row) to the axe states, both widths and themes; plus the no-horizontal-scroll check (`expectNoHorizontalScroll`) on `/projects/retired/` at 320 CSS px and at 200% zoom, since the TEMPLATES loop that runs it does not reach the fixture site |
| Template pixels: retired row and retired story header | visual | `tests/e2e/visual.spec.ts`: subjects `project-row-retired` and `retired-story-header` (below) |

No-JS reading (FR-010) has no browser test of its own: the pill and note are static text in the
prerendered HTML, which the component tests (no `<script>`) and the drafts build test (text in
`dist/`) already show; the existing `projects-no-js.spec.ts` keeps covering story pages.

### Existing tests and lists that change

| File | Change needed | Why |
|---|---|---|
| `tests/e2e/projects-fixtures.spec.ts` | `ALL` 8 → 9; "lists projects newest first" fixture list gains `"retired"` last (date 2025-01-01, update the dates comment); header comment | The fixture site copies every file in `tests/fixtures/projects/` (except `broken/`), so the new fixture adds a row. Tooling and AI-integration counts unchanged (theme is Automation). |
| `tests/e2e/visual.spec.ts` | `FIXTURE_PROJECTS` gains `"retired"`; two new subjects; header comment "50 images per platform" → 58, "eight fixture-site subjects" → ten | New template subjects; `onlyFixtureRows` must keep the retired row for its shot. |
| `tests/unit/content/project-schema.test.ts` | status loop and S02 phrase list include `retired` | FR-001 |
| `tests/build/project-validation.test.ts` | row 03 phrase list adds `retired`; new RP04 run | Contract S02 (changed), RP04 |
| `tests/unit/content/projects-guide.test.ts` | values list includes `retired`; walker stops at `reference()` | FR-011, research R2 |
| `tests/component/project/StatusPill.test.ts` | add `["retired", "Retired"]` | FR-004 |
| `tests/unit/content/projects-content.test.ts` | add Tempo status/replacement assertion | FR-009; `slugs` and `published` stay the same |
| `tests/build/indexing.test.ts` (`realProjects`), `tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts` | **No change** | Tempo stays published at `/projects/tempo/`; no slug is added or removed. |
| `tests/e2e/projects.spec.ts`, `tests/e2e/templates.ts` | **No change** | They assert no draft marks and use Focus Pocus as the story template; neither reads Tempo's status. |
| `tests/component/project/StoryHeader.test.ts` "has no … in-page links" | **No change** (uses a non-retired project) | The note's link appears only for a retired project with a linked replacement. |

### Visual baselines

The fixture site **must** gain a retired project (`tests/fixtures/projects/retired.mdx`):
without it no visual subject shows the new tone or the note (research R7).

- New subjects in `FIXTURE_SUBJECTS`:
  - `project-row-retired`: path `/projects/`, locator `li[data-project="retired"]`,
    `wait: onlyFixtureRows`.
  - `retired-story-header`: path `/projects/retired/`, locator `header[data-story-header]`.
- **Predicted new images (16; 8 per platform)**:
  - `project-row-retired-phone-dark-visual-{darwin,linux}.png`
  - `project-row-retired-phone-light-visual-{darwin,linux}.png`
  - `project-row-retired-desktop-dark-visual-{darwin,linux}.png`
  - `project-row-retired-desktop-light-visual-{darwin,linux}.png`
  - `retired-story-header-phone-dark-visual-{darwin,linux}.png`
  - `retired-story-header-phone-light-visual-{darwin,linux}.png`
  - `retired-story-header-desktop-dark-visual-{darwin,linux}.png`
  - `retired-story-header-desktop-light-visual-{darwin,linux}.png`
- **Predicted changed images: none.** The retired fixture is dated 2025-01-01, older than all
  four existing fixtures, so it sorts below `every-setting` and the `project-row-minimal-*` and
  `project-row-every-setting-*` shots keep their position; `story-template-*` uses the
  non-retired `every-part` fixture; real content (Tempo) is never snapshotted; the shell,
  not-found, sections and blog subjects are untouched. A diff in any existing image is a
  regression to fix, not a baseline to refresh.
- Baseline count goes from 100 to 116 committed images.
- Tasks: generate with `pnpm run test:visual:update` (macOS) and
  `pnpm run test:visual:update:linux` (needs Docker Desktop; ask Don to start it; fallback is
  the `visual-baselines` PR label and the `visual-baselines-linux` artifact, copying only
  `*-linux.png`). Then `git status` must show exactly the 16 new files and no modified ones.

### Order of work (for tasks)

1. Status module, schema, replacement check and resolver, each after its unit tests (RED then
   GREEN); guide and template updates.
2. Every test for the page changes, written and seen to fail first: component tests (Pill,
   StatusPill, StoryHeader, ProjectRow), the RP04 build run with its broken fixture, the
   drafts build test, fixture counts, theme tokens, the a11y states and reflow check, the
   visual subjects and the e2e link journey.
3. Fixture `retired.mdx` (test input).
4. Code: pill tone, StatusPill, ProjectRow types, StoryHeader note and CSS, ProjectLayout, then
   route wiring, until every step-2 test except the missing baselines is green.
5. Tempo's unit assertion, then Tempo's content.
6. Baselines (macOS then Linux) against the prediction below.
7. Docs (`docs/testing.md`, `docs/design-source.md`; `docs/projects.md` goes with the guide
   test in step 1).
8. `[PREVIEW-CHECK]`: Don reviews `/projects/` and `/projects/tempo/` in both themes and at
   phone width on the preview deployment and judges the filled mauve pill and the note; the
   wording, missing link and colours are already covered by tests.

## Project Structure

### Documentation (this feature)

```text
specs/015-project-retired-status/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── build-errors.md  # rows RP01-RP05, S02 changed
│   ├── pages-dom.md     # pill and note markup
│   └── project-file.md  # status: retired, replacedBy
├── checklists/
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Pill.astro                         # + mauve tone
│   └── project/
│       ├── ProjectRow.astro               # status type
│       ├── StatusPill.astro               # label/tone from project-status
│       ├── StoryHeader.astro              # + retired note
│       └── portfolio.css                  # + [data-retired-note]
├── content/
│   ├── projects/_template.mdx             # comment documents retired/replacedBy
│   ├── projects/tempo.mdx                 # status: retired, replacedBy: Cadence
│   └── schemas/project.ts                 # retired, replacedBy
├── layouts/ProjectLayout.astro            # passes replacement
├── lib/content/
│   ├── project-replacement.ts             # new: checkReplacements, resolveReplacement
│   └── project-status.ts                  # new: statuses, labels, tones
└── pages/projects/[slug].astro            # runs the check, resolves the note

tests/
├── unit/content/        project-schema, project-replacement (new), project-status (new),
│                        project-order, projects-content, project-template, projects-guide
├── component/project/   Pill, StatusPill, StoryHeader, ProjectRow
├── build/               project-validation (RP04 run), drafts (retired fixture)
├── e2e/                 projects-fixtures, theme-tokens, a11y, visual (+ 16 baselines)
└── fixtures/projects/   retired.mdx (new), broken/RP04-missing-replacement.mdx (new)

docs/  projects.md, testing.md, design-source.md
```

**Structure Decision**: the existing single Astro project layout; no new directories.

## Risks and open questions

- **Guide walker and `reference()`**: the walker change must be narrow (treat the reference
  value as a leaf) so it still demands every real setting.
- **Row-shot stability**: the prediction that `project-row-minimal-*` and
  `project-row-every-setting-*` do not change rests on the retired fixture sorting last. If
  either changes, investigate before refreshing anything.
- **Linux baselines**: memory notes that local Docker Linux baselines once differed from CI for
  pages with unusual glyphs; the new subjects use ordinary text, so Docker is the first choice
  and the CI label the fallback.
- **Dark fill choice**: mauve-800 (not 900) is a planning decision inside the clarify answer
  "mauve-800/900"; Don sees it at the preview check.
- **Follow-ups (not in this slice)**: a Cadence project story, then pointing Tempo's
  `replacedBy` at it; Focus Pocus's retirement.

## Complexity Tracking

No Constitution Check violations.
