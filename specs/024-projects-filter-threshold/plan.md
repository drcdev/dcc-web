# Implementation Plan: Projects Filter Threshold

**Branch**: `024-projects-filter-threshold` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-projects-filter-threshold/spec.md` (issue #100)

## Summary

The projects index renders the theme filter only when it lists more than a threshold number of
projects (default 10). Below it, the index is a plain `<ul data-project-list>` of the same rows,
with no filter markup and no filter script. The threshold is one constant in a new
`src/config/projects.ts`. The fixture-site build script rewrites that constant in its copied
source tree to `0`, so the fixture site's five projects still get the filter and the existing
browser filter tests keep reaching it. Production and preview builds build the repository's own
source, which the fixture script never touches, so the override cannot reach them.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5 static output, Node from `.nvmrc`

**Primary Dependencies**: none added

**Storage**: N/A

**Testing**: Vitest (unit, component via Astro's container helpers, build via `tests/build/fixture-site.ts`), Playwright (existing specs only)

**Target Platform**: static pages on Cloudflare Workers static assets

**Project Type**: web site (single Astro project)

**Performance Goals**: the live index ships one script fewer (Principle V, X budget unaffected or improved)

**Constraints**: /tweak triage — no edits to `tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`, `playwright.config.ts`, `vitest.config.ts`; no new E2E spec file; no new route; no CI, wrangler, `astro.config.mjs` or adapter change. The plan satisfies all of them.

**Scale/Scope**: 1 new config module, 1 new small component, 1 page edit, 1 script edit, 1 pure function; tests at unit, component, build and one added case in an existing E2E spec.

## Design

### The rule

- `src/config/projects.ts` (new): `export const PROJECT_FILTER_THRESHOLD = 10;` with a comment
  that the fixture-site build lowers it in its copy. One named value in one place (FR-001).
- `src/lib/content/themes.ts`: add `showsThemeFilter(count: number, threshold: number): boolean`
  returning `count > threshold`. The threshold is a required argument, so `themes.ts` (which the
  filter's client script imports) does not import the config module.

### Where the rule is applied

- `src/components/project/ProjectList.astro` (new): props `themes`, `total`, and an optional
  `threshold` defaulting to `PROJECT_FILTER_THRESHOLD`. When `showsThemeFilter(total, threshold)`
  it renders `<ProjectFilter themes total><slot /></ProjectFilter>` exactly as today; otherwise
  `<ul data-project-list class="not-prose"><slot /></ul>`, the same list element and class the
  filter wraps, so rows look the same (FR-003; row styles key on `[data-project-list]` and
  `[data-project]` in `portfolio.css`, never on `project-filter`).
- `src/pages/projects/index.astro`: replace `<ProjectFilter …>` with `<ProjectList …>`; `total`
  stays `projects.length`, the count of projects this build lists, drafts included where listed
  (clarification 2). The empty-index branch is unchanged.
- No filter script below the threshold: since Astro 5, a component's `<script>` is rendered
  where the component is rendered, so a `ProjectFilter` that is not rendered emits no script
  (Astro docs, *Upgrade to Astro v5 → `<script>` tags are rendered directly as declared*,
  docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared; and
  *Scripts and event handling → Script processing*,
  docs.astro.build/en/guides/client-side-scripts/#script-processing). The build test below
  confirms it against the real build. `portfolio.css` is imported by the page itself, so its
  styles are unaffected (Astro docs, *Troubleshooting → An unexpected `<style>` is included*,
  docs.astro.build/en/guides/troubleshooting/#an-unexpected-style-is-included).
- `?theme=` below the threshold: the page has no script, and a static page is the same file for
  any query string, so the value has no effect (FR-003, SC-003). Observed by the build test (no
  script, every row present, no `hidden` on rows).

### The fixture-site override (decision)

**Chosen: rewrite the constant in the fixture site's copied source.** `prepareFixtureSite()` in
`scripts/build-fixture-site.ts` already copies `src/` into `.cache/fixture-site` and reshapes it
(empties the posts and projects collections, adds fixtures). After the copy it replaces
`PROJECT_FILTER_THRESHOLD = 10` in the copied `src/config/projects.ts` with `= 0` (the value exported as
`FIXTURE_FILTER_THRESHOLD`, the replace done by an exported pure helper `lowerFilterThreshold`), and throws if the text is not found exactly once, so a renamed or
reshaped constant fails the fixture build loudly instead of silently dropping the filter. With
threshold 0, "more than 0" shows the filter for any non-empty fixture index, independent of how
many fixture projects there are.

Why this mechanism:

- **Cannot leak.** Production (`main`) and preview builds run `astro build` on the repository's
  own `src/`. The override exists only as a text change inside `.cache/fixture-site`, written by
  the one script that builds the fixture site. No environment variable, `.env` line or Workers
  Builds dashboard setting can change the production threshold, because production code reads no
  override at all; it reads the constant. This is a stricter reading of FR-001 ("production code
  only reads the override and uses 10 when it is unset"): there is nothing to set.
- **Works with the programmatic build.** `buildSite()` calls `build({ root: siteRoot })` from the
  `astro` package (Astro docs, *Programmatic Astro API → build()*,
  docs.astro.build/en/reference/programmatic-reference/#build); the copied tree is what it
  builds, the same way the Docker visual-baselines run builds it.
- **Precedent.** The build-test harness already patches copied source files through its
  `overrides` option (`tests/build/fixture-site.ts`), and the fixture script already rewrites the
  copied content tree.

Rejected alternatives (Principle IV asks the plan to name the first-party option and why it falls short):

| Alternative | Why rejected |
|-------------|--------------|
| `astro:env` typed variable (`envField.number`, default 10), the first-party typed env feature (docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables) | Needs a schema entry in `astro.config.mjs`, which /tweak triage forbids. It also reads `.env` files and the host's build environment, so a stray variable in Workers Builds (preview or production) or a local `.env` would change the threshold; that is exactly the leak this change must rule out. |
| `process.env.PROJECT_FILTER_THRESHOLD` read in the page frontmatter, set by the fixture script before `build()` (precedent: `getPublishedProjects(process.env)`; `process.env` is what Astro reads in build, docs.astro.build/en/reference/modules/astro-env/ `getSecret()` "defaults to `process.env` in dev and build") | Works, but production code would read a live override, so any build environment that sets the name changes the threshold. A guard (`WORKERS_CI !== "1"`) would narrow it but adds a rule and a test to defend a value nobody should be able to set. |
| `import.meta.env` / Vite `define` | `define` needs a Vite config change in `astro.config.mjs` (forbidden); `import.meta.env` is statically replaced and also loads `.env` files (docs.astro.build/en/guides/environment-variables/#vites-built-in-support), the same leak surface as above. |
| Put the threshold check inside `ProjectFilter.astro` | The component's `<script>` would still be rendered whenever the component is, so the filter script would ship below the threshold (FR-002). |
| Inline the condition in `index.astro` with no new component | The page reads collections, so no component test could cover both sides of the rule (FR-005 asks for component tests at 10 and 11). |

### `projectRowsReady` in `tests/e2e/visual.spec.ts`

No change. It waits for `project-filter[data-ready]` and five rows on the fixture site, and the
fixture site keeps the filter (threshold 0). The visual suite never shoots the real-content
index. No baseline is predicted to change; any change is a regression to fix.

### Production default in a browser (clarify risk)

The real-content server (port 4321, five real projects) now serves the index without the
filter, and no browser test asserts the production default directly. Decision: **no new
assertion on port 4321.** The behaviour "at 10 or fewer projects the built index has no filter
markup and no filter script" is fully observable in built HTML, so its primary layer is the
build test (cheapest layer that can see the script; a component render does not show emitted
scripts). A 4321 assertion would test the same behaviour at a second layer with no written
reason beyond reassurance, and it would be content-coupled: publishing an eleventh project, a
content edit, would fail it (against the content-derived tests rule from issue #55), or it would
have to recompute the rule from content and so duplicate the unit test.

Existing 4321 specs stay unchanged and keep passing: `projects-no-js.spec.ts` asserts the
controls, status and empty message are hidden and `project-filter[data-ready]` count is 0, all of
which hold when the markup is absent; `pages.spec.ts`, `headers.spec.ts`, `projects-motion.spec.ts`
and the `/projects/` focus test in `a11y.spec.ts` do not depend on the filter.

One consequence: `projects-no-js.spec.ts` was the only browser test of the filter's no-script
state (controls rendered but hidden), and it now meets a page with no filter. To keep that
existing coverage where the filter still renders (FR-005 names no-script behaviour), one case is
added to the existing `tests/e2e/projects-fixtures.spec.ts` (port 4322): with JavaScript off,
`project-filter` is present, every row is visible, and the controls, status and empty message
are hidden. This is a move of existing coverage, not a second layer.

## Tests (each names its layer; tests first)

| # | Layer | File | Covers |
|---|-------|------|--------|
| 1 | unit | `tests/unit/content/filter-logic.test.ts` (existing) | `showsThemeFilter`: 10/10 false, 11/10 true, 0/10 false, 5/0 true; `PROJECT_FILTER_THRESHOLD` is 10 (FR-001, SC-002) |
| 2 | unit | `tests/unit/site/fixture-site-content.test.ts` (existing) | `prepareFixtureSite` writes `PROJECT_FILTER_THRESHOLD = 0` into the copied `src/config/projects.ts` and leaves the repository file at 10; the exported pure helper `lowerFilterThreshold(text)` throws when the constant is not found exactly once (FR-005 fixture override) |
| 3 | component | `tests/component/project/ProjectList.test.ts` (new component test file; not an E2E spec) | default threshold: total 10 renders a `ul[data-project-list]` with every slotted row and no `project-filter`, no `data-filter-*`; total 11 renders `project-filter` with controls (FR-002, FR-004, FR-005, US2) |
| 4 | build | `tests/build/local-site.test.ts` (existing L1 build, three fixture projects, default threshold; no new build) | `projects/index.html` has every project row, no `<project-filter`, no `data-filter-` attributes, no "No projects match", and the same `<script` count as `about/index.html` (FR-002, FR-003, SC-001, SC-003) |
| 5 | E2E | `tests/e2e/projects-fixtures.spec.ts` (existing, port 4322) | added no-JS case keeping the filter's no-script browser coverage (see above) |

Unchanged and expected to pass: every other case in `projects-fixtures.spec.ts`, the a11y
portfolio states, the visual project-row shots, `ProjectFilter.test.ts`.

## Constitution Check

*GATE: passes before and after design.*

- **I. Test-First** — Pass. Tests 1–5 are written and seen failing before the config, rule,
  component, page and script edits.
- **II. Automated Release Gate** — Pass. No check skipped or weakened; the full gate runs before
  the PR.
- **III. Human Review / major change** — Not a major change; no criterion fires: no dependency,
  integration or service added or removed; no contact-data change; no design-system, site-wide
  layout, navigation or visual-identity change (one page stops rendering an optional control;
  rows, tokens and shell are unchanged and no baseline moves); no cost change; no CI, deployment
  or infrastructure configuration change (`scripts/build-fixture-site.ts` is the test fixture
  builder, not workflow, wrangler or deploy config); no constitution amendment. Don's approving
  review is still required, as on every PR.
- **IV. First-Party Before Custom** — Pass. Astro choices cite docs pages found through the Astro
  Docs MCP (above). The first-party typed env feature (`astro:env`) was considered and rejected
  with reasons; the chosen mechanism is a plain constant, which needs no framework feature.
- **V. Static by Default** — Pass, and improved: the live index ships no filter script; content
  reads the same with JavaScript off.
- **VI. Content as Files** — Pass. No content or schema change.
- **VII. Private Data** — Pass. Untouched.
- **VIII. Cloudflare Best Practices** — Pass. No Worker, D1 or endpoint change.
- **IX. Cost Ceiling** — Pass. No cost.
- **X. Accessible, Fast and Private** — Pass. The plain list keeps its headings, links and pills;
  the a11y checks on the fixture index (full, filtered, empty) still run against the filter;
  less script on the live page.
- **XI. Spec Kit Workflow** — Pass. Spec Kit branch and directory; files touched do not overlap
  other active worktrees as far as known.
- **Security Baseline** — Pass. Headers, ruleset and Dependabot untouched; the CSP still hashes
  whatever scripts the page emits.
- **Development Workflow / Test placement** — Pass. One primary layer per behaviour; the E2E case
  moves existing no-script coverage rather than duplicating a layer; the 4321 assertion was
  considered and rejected (above).

## Project Structure

### Documentation (this feature)

```text
specs/024-projects-filter-threshold/
├── spec.md
├── plan.md          # this file
├── quickstart.md    # validation run guide
└── tasks.md         # /speckit-tasks
```

No research.md, data-model.md or contracts/: no unknowns remain, there is no data model, and the
change adds no interface.

### Source Code (repository root)

```text
src/config/projects.ts                      # new: PROJECT_FILTER_THRESHOLD = 10
src/lib/content/themes.ts                   # + showsThemeFilter(count, threshold)
src/components/project/ProjectList.astro    # new: filter or plain list
src/pages/projects/index.astro              # uses ProjectList
scripts/build-fixture-site.ts               # lowers the copied constant to 0
tests/unit/content/filter-logic.test.ts     # + rule and default
tests/unit/site/fixture-site-content.test.ts# + override written in the copy only
tests/component/project/ProjectList.test.ts # new
tests/build/local-site.test.ts              # + index below the threshold (L1)
tests/e2e/projects-fixtures.spec.ts         # + no-JS case on the fixture index
```

**Structure Decision**: single Astro project; files as listed.

## Complexity Tracking

No constitution violations.
