# Implementation Plan: Simplify the project pages to a four-part story

**Branch**: `014-project-four-part-story` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-project-four-part-story/spec.md` (GitHub issue #35)

**Major change (Constitution Principle III): YES.** The slice redesigns the look of a whole
section (project story pages and list spacing, new options-table colours), which "changes the
design system … or visual identity", and it edits `astro.config.mjs` (a Markdown plugin
registered, the clip build rule removed). Auto-merge stays off. `tasks.md` must carry a
`[PREVIEW-CHECK]` task for Don to review `/projects/` and all five project pages on the preview
deployment, and the PR body must say why auto-merge is off.

## Summary

Replace the seven hand-placed `<Chapter>` blocks and the structured `comparison` frontmatter
with plain Markdown in four `##` parts (Problem, Options, Build, Lessons) and an ordinary
options table. A pure check, `validateProjectStory` (`src/lib/content/project-story.ts`), parses
each body with Sätteri's `mdxToMdast` (Astro's own Markdown processor) and enforces the part
order and the table shape; it runs in the story route's `getStaticPaths()` over every entry,
drafts included, and returns the parsed comparison. A Sätteri mdast plugin scoped to project
files wraps each part in a `<ProjectPart>` element and swaps the Options table for
`<OptionsTable />`, both passed through `<Content components>`; `ProjectPart` places the
part's picture (now chosen in frontmatter with `visuals.<name>.part`) beside the text on wide
screens and below it on phones, and adds the Build links; `ProjectLayout` adds the closing
invitation (optional `invitation:` sentence, else a standard one). Part text uses the post
body's prose classes, so headings and spacing match a writing post. The schema drops `order`,
`comparison`, `demo.embed` and clips, makes `date` required, and the list sorts newest first.
`_template.mdx` sits beside the projects, kept out of the collection by a negated glob pattern
and checked by a unit test and a fixture build. All five projects are rewritten from their own
text and become drafts.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5 on Node 24 (`.nvmrc`)

**Primary Dependencies**: existing only: `astro`, `@astrojs/mdx` 8.0.2,
`@astrojs/markdown-satteri` / `satteri` 0.10.5 (already direct dependencies), Tailwind CSS 4
with `@tailwindcss/typography`. **No dependency added, removed or upgraded.**

**Storage**: Files only (`src/content/projects/*.mdx` and images beside them). No D1 change.

**Testing**: Vitest (`unit` project: unit and Astro container component tests; `build` project:
real `astro sync` / `astro build` via the fixture site), Playwright (`e2e`, `a11y`, `visual`,
`sections`, `budget` projects).

**Target Platform**: Static pages served by Cloudflare Workers static assets; no Worker code
change.

**Project Type**: Static Astro website (single project).

**Performance Goals**: Existing performance budget and Core Web Vitals "good" on mobile; the
story page loses the reveal animation and gets shorter, so no regression is expected.

**Constraints**: No client JavaScript added; pages readable with JavaScript off; WCAG 2.2 AA;
production build must still validate drafts.

**Scale/Scope**: 5 project files, 1 template, ~6 components touched or added, ~10 removed;
2 snapshotted pages (`/projects/`, `/projects/focus-pocus/`) change appearance.

No item is NEEDS CLARIFICATION; research.md resolves every technical choice.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Test-First | PASS | Every behaviour has a test task at one named layer (table below), written and seen failing before the code. Contract rows in [contracts/build-errors.md](./contracts/build-errors.md) each map to a unit test plus one call-site run per distinct call site. |
| II. Automated Release Gate | PASS | No check is skipped or weakened. Tests that covered removed behaviour (chapters, embedded demo, clips, reveal) are deleted together with that behaviour, not disabled; the full `pnpm run verify` gate runs before the PR. |
| III. Human Review for Major Changes | MAJOR | Visual identity of a section changes and `astro.config.mjs` changes. `[PREVIEW-CHECK]` task, auto-merge off, reason stated in the PR body. No dependency, contact-data, cost, CI or constitution change. |
| IV. First-Party Before Custom | PASS | See "First-party choices" below. Astro decisions cite docs found through the Astro Docs MCP (available this session). Two custom pieces (the story check and the parts plugin) are justified there. |
| V. Static by Default | PASS | All pages stay prerendered. No script added; the embedded demo `iframe` and its CSP widening are removed. Story, table, links and invitation are static HTML (FR-011). |
| VI. Content as Files | PASS | Projects stay MDX files; the comparison moves from frontmatter into the body as a table, and the new check keeps "invalid content fails the build with a clear error" (US3, FR-015), drafts included. |
| VII. Private Data | N/A | No contact-data change; the invitation link keeps carrying only the project slug (`contactHref`). |
| VIII. Cloudflare Best Practices | PASS | No Worker, D1, Turnstile or `wrangler` change; pages remain static assets. |
| IX. Cost Ceiling | PASS | Expected new monthly cost: **$0**. Nothing new is hosted or called; build output shrinks slightly. |
| X. Accessible, Fast and Private | PASS | Table keeps scope headers, caption, a keyboard-reachable scroll region, answer text beside colour, chosen row marked in text; new cell colours meet 4.5:1 in both themes (axe on the template); forced-colours check kept; budget test unchanged; no third-party script. |
| XI. Spec Kit Workflow | PASS | Spec Kit branch and directory naming; one feature on this branch. Files touched are confined to the projects area (`src/content/projects/`, `src/components/project/`, `src/lib/content/project*`, the projects route and layout), plus `astro.config.mjs`, `src/content.config.ts`, `docs/projects.md`, `docs/testing.md` and the test files listed below. A parallel worktree editing `astro.config.mjs` or `docs/testing.md` would conflict; resolve by merging `main` into this branch before the PR and keeping both edits. |
| Technology Constraints | PASS | Astro, strict TypeScript, Tailwind, existing palette tokens only (no new token). The design-baseline deviation is the major change above. |
| Development Workflow | PASS | Constitution Check present; Astro choices cite docs (research.md); tests ordered before code with a named layer each; out-of-scope items stay in the spec's follow-up list; site copy is plain language. |

### First-party choices (Principle IV)

| Capability | First-party option | Decision |
|---|---|---|
| Project files, frontmatter rules | Content collections, `glob()` loader, Zod schema with `image()` (docs.astro.build/en/guides/content-collections/) | Used; schema edited |
| Keeping `_template.mdx` out | `glob()` `pattern` array with a `!` pattern (docs.astro.build/en/reference/content-loader-reference/#pattern) | Used. Astro 7.3.5's loader does **not** skip `_` files on its own (only `src/pages` does: docs.astro.build/en/guides/routing/#excluding-pages), so the exclusion is explicit (research R3) |
| Rendering the body with page components | `@astrojs/mdx`, `render()`, `<Content components>` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content) | Used, same mechanism as today |
| Turning plain parts into sections | Markdown processor plugins (Sätteri mdast plugin, as in docs.astro.build/en/recipes/reading-time/) | Used. The hook is first-party; the grouping logic inside it is custom because no Astro feature wraps a heading and its siblings (research R2) |
| Table and part rules | Zod covers frontmatter only | Custom pure function over Sätteri's mdast; no first-party body validator exists (research R1) |
| Pictures | `astro:assets` `<Image>` (docs.astro.build/en/guides/images/) | Used, unchanged |
| Ordering | Manual sort, as the docs require for `getCollection()` | Used |
| Hosting and delivery | Cloudflare Workers static assets | Unchanged. No Cloudflare product is needed; Fly.io is not part of this site |

### Test layers (docs/testing.md "Where a test goes")

One primary layer per behaviour; a second layer only with the reason given.

| Behaviour (story / FR) | Primary layer | Test (new or rewritten) |
|---|---|---|
| Part rules P01–P07, allowed sub-headings and comments (US3, FR-002, FR-015) | unit | `tests/unit/content/project-story.test.ts` |
| Table rules T01–T13 and the allowed cases (US3, FR-013, FR-014) | unit | `tests/unit/content/project-story.test.ts` |
| Body tags / import / export rejected R05–R06 (FR-017) | unit | `tests/unit/content/project-story.test.ts` |
| Schema: removed settings R01–R04, `part` N01–N02, `invitation` N03, `date` required, carried rows S01–S08 (US5-3, FR-012, FR-017) | unit | `tests/unit/content/project-schema.test.ts` (rewritten) |
| Order by date, then title, then file name (FR-018) | unit | `tests/unit/content/project-order.test.ts` (rewritten) |
| Parts plugin groups parts, replaces only the Options table, ignores non-project files (FR-002, FR-016) | unit | `tests/unit/markdown/project-parts.test.ts` (compiles small MDX with `satteri` and the plugin) |
| Template exists, is a draft, passes schema and story check, has example picture with `part` and an `invitation`, notes naming the optional details, only example.com links (US2-1, FR-019, FR-020) | unit | `tests/unit/content/project-template.test.ts` |
| The five projects: all `draft: true`, review comments kept, no removed setting, current invitation sentence moved to `invitation` (US5-1/2, FR-022–FR-024) | unit | `tests/unit/content/projects-content.test.ts` (replaces `focus-pocus.test.ts`) |
| Author guide names every setting, part and allowed answer (FR-012) | unit | `tests/unit/content/projects-guide.test.ts` (updated for parts, no blocks or stages) |
| `ProjectPart`: section, `aria-labelledby`, picture column only when assigned, eager first picture, Build links only when set (FR-005, FR-008) | component | `tests/component/project/ProjectPart.test.ts` |
| `OptionsTable`: caption, scope, `data-fit` with words, chosen row marker (FR-007) | component | `tests/component/project/OptionsTable.test.ts` |
| `ProjectInvitation`: custom vs standard sentence, contact link (FR-009, US2-5) | component | `tests/component/project/ProjectInvitation.test.ts` |
| `StoryHeader` has no contents list (FR-003) | component | `tests/component/project/StoryHeader.test.ts` (updated) |
| `PartPicture` alt / diagram description (FR-005) | component | `tests/component/project/PartPicture.test.ts` (from `Visual.test.ts`, clip cases removed) |
| Wiring: schema call site rejects a removed setting in a draft under production (R01, S01–S08) | build (`sync`) | `tests/build/project-validation.test.ts` |
| Wiring: route runs `validateProjectStory` on a draft in a production build (P/T/R05–R06 call site, US3-7) | build | `tests/build/project-validation.test.ts` (one run; the logic rows stay unit) |
| Wiring: generateId image check S09, file name S10, duplicate slug S11 | build | `tests/build/project-validation.test.ts` (kept) |
| Template excluded (X01) and a renamed copy builds with four parts, links and invitation (X02, SC-003) | build | `tests/build/project-validation.test.ts` (reason for build layer: only the real loader and route show exclusion and a clean build) |
| Plugin + components wiring: built story HTML is one `article` in `main` with the heading in a `header`, four `section[data-part]` in order, the table markup and the invitation last (FR-002, FR-025) | build | `tests/build/drafts.test.ts` fixture build, one assertion on `projects/minimal/index.html` (reason: only the real MDX compile proves the plugin output reaches `<Content components>`) |
| Production: drafts absent, empty list state, no sitemap entries, Focus Pocus a draft (US4-3, US5-2, SC-005) | build | `tests/build/drafts.test.ts`, `tests/build/indexing.test.ts` (Focus Pocus moved to the draft list) |
| Story journey: heading, four parts in order, no contents / chapter numbers / reveal, no part `min-height`, part `h2` computed size equals a post `h2`, picture beside at 1280 px and below at 390 px, links, invitation, progress bar, title carry-over, focus on the Build links, invitation link and table region visible and not under the progress bar (US1, FR-004, FR-027) | e2e | `tests/e2e/projects.spec.ts` (rewritten) and `projects-motion.spec.ts` (reveal cases removed, progress bar kept) |
| No-JS readability (FR-011) | e2e | `tests/e2e/projects-no-js.spec.ts` (updated selectors) |
| Forced colours on the table and chosen row (FR-007) | e2e | `tests/e2e/projects-forced-colors.spec.ts` (updated selectors) |
| List: rows and filter unchanged, newest first, row links and filter buttons at least 24 by 24 px after the spacing change (US4-1, FR-018, FR-021, FR-027) | e2e | `tests/e2e/projects-fixtures.spec.ts` (order assertion added; count stays 9) |
| Template accessibility (story and list), including the existing reflow at 320 px and 200% checks (FR-011, FR-026) | a11y | `tests/e2e/a11y.spec.ts` entries for `/projects/`, `/projects/focus-pocus/`, the `every-part` fixture story (renamed from `every-block`) and the `every-setting` fixture story (live demo link, SC-006) |
| Template appearance; row spacing smaller (US4-2) | visual | `tests/e2e/visual.spec.ts`: `projects` and `project-story` baselines refreshed |
| Performance budget | budget | `tests/e2e/budget.spec.ts`, unchanged |
| Migration adds no claim; dropped text (pros, cons, option summaries, caption, repeated constraint prose) listed per project (FR-022) | manual review | PR body list, checked by Don at the preview review (SC-007); a test cannot judge whether a sentence is a new claim |
| Pages shorter at phone width (SC-002) | manual measurement | quickstart step 0, numbers recorded in the PR body (a permanent test would pin content length, not behaviour) |
| Don's review on preview (SC-007) | `[PREVIEW-CHECK]` | tasks.md |

**Visual baselines**: `/projects/` and `/projects/focus-pocus/` have committed baselines
(`tests/e2e/visual.spec.ts-snapshots/projects-*` and `project-story-*`, phone and desktop,
light and dark). Both the macOS (`pnpm run test:visual:update`) and Linux
(`pnpm run test:visual:update:linux`, Docker; fallback: `visual-baselines` PR label and the
`visual-baselines-linux` artifact, `*-linux.png` only) sets must be refreshed. Any other page's
diff is a regression.

**Fixtures** (`tests/fixtures/projects/`): `minimal.mdx`, `draft.mdx`, `every-setting.mdx`
rewritten to four parts; `every-block.mdx` becomes `every-part.mdx` (a picture on every part,
a stand-in and a source link, `invitation`, a sub-heading, a table outside Options); clip and poster files
removed; `broken/` keeps the image, duplicate-slug and file-name cases. `tests/component/project/helpers.ts`
drops `comparison` and clips and adds `part`, `invitation`, `date` and a parsed `comparison`.

## Project Structure

### Documentation (this feature)

```text
specs/014-project-four-part-story/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── build-errors.md  # rows S, R, N, P, T, X
│   ├── project-file.md  # the writer-facing file shape
│   └── pages-dom.md     # story page and list DOM hooks
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
astro.config.mjs                         # + projectPartsPlugin in satteri mdastPlugins; - clip assetsInlineLimit
src/content.config.ts                    # projects pattern ["**/*.{md,mdx}", "!**/_*"]
src/content/schemas/project.ts           # schema changes (data-model.md)
src/content/projects/
├── _template.mdx                        # new, draft
├── images/template/diagram.svg          # new, template picture
├── focus-pocus.mdx                      # rewritten, draft: true
├── drcdev-github-io.mdx, flux.mdx, plunge-buddy.mdx, tempo.mdx   # rewritten, still drafts
src/lib/content/
├── parts.ts                             # new: part ids and headings
├── project-story.ts                     # new: validateProjectStory (replaces project-body.ts)
├── project-order.ts                     # date, then title, then slug (file name)
├── project-images.ts                    # clip check removed
├── project-body.ts, stages.ts, demo-csp.ts   # deleted
src/lib/markdown/project-parts.ts        # new: Sätteri mdast plugin
src/lib/projects.ts                      # unchanged API
src/pages/projects/[slug].astro          # story check, components { ProjectPart, OptionsTable }, no CSP widening
src/pages/projects/index.astro           # unchanged markup
src/layouts/ProjectLayout.astro          # renders ProjectInvitation after the body
src/layouts/PostLayout.astro             # prose classes taken from the shared constant
src/components/project/
├── ProjectPart.astro, OptionsTable.astro, PartPicture.astro, BuildLinks.astro, ProjectInvitation.astro   # new
├── StoryHeader.astro                    # contents list removed
├── portfolio.css                        # chapter, stage, reveal CSS removed; part grid, table colours, tighter rows
├── blocks/                              # deleted (Chapter, Demo, Invitation, OptionComparison, Visual, context, schemas, index)
src/env.d.ts                             # App.Locals.project gains `comparison`
docs/projects.md                         # author guide rewritten for the four-part shape
docs/testing.md                          # contract-row mapping: project rows point at 014's contract
tests/                                   # per "Test layers" above
```

**Structure Decision**: Single Astro project; all changes sit in the existing projects slice
of `src/` and its tests. No new top-level directory.

## Post-design Constitution Check

Re-evaluated after research.md, data-model.md and the contracts: no principle changes status.
The design adds no dependency, service, script, Worker code or recurring cost; the two custom
pieces are named with the first-party option each sits on and why it falls short (IV); the
major-change classification (III) stands on visual identity and `astro.config.mjs`. Gate:
**PASS, major change**.

## Risks and open points

- **Plugin mechanism (R2)**: Sätteri's mdast mutation API is documented only in its types.
  First implementation task is a spike; the hast-plugin fallback is recorded in research R2.
- **Settled decision with a wrong premise (R3)**: the glob loader does not ignore `_` files in
  Astro 7.3.5. The template still lives at `_template.mdx`; the exclusion is an explicit
  negated pattern, and the template is checked by tests instead of by the collection.
- **"Existing comparison colours" (R6)**: today's table has no per-answer colours. The plan
  uses existing palette tokens (sage / sand / rust); Don sees them in the preview review.
- **Rules settled at resolve, now written into the spec**: body images rejected (P06, FR-005),
  text before `## Problem` rejected (P07, FR-002 and Edge Cases), `date` required (FR-012,
  FR-018). Don can still object at review.
- **Linux baselines**: if local Docker baselines differ from CI (seen before for unusual
  glyphs; the table uses ✓ ~ ✗), use the label-and-artifact fallback.

## Complexity Tracking

No constitution violation. Custom code beyond configuration, justified under Principle IV:

| Custom piece | Why needed | First-party option rejected because |
|---|---|---|
| `validateProjectStory` (body check over Sätteri mdast) | FR-013–FR-015 rules live in the body | Collection schemas validate frontmatter only |
| `projectPartsPlugin` (groups parts, swaps the Options table) | Picture beside / below each part needs a container per part from plain headings | MDX element overrides wrap single elements; CSS cannot group siblings; hand wrappers are ruled out by the settled decisions |
