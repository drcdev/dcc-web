# Implementation Plan: Author card at the end of posts

**Branch**: `039-post-author-card` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/039-post-author-card/spec.md`

## Summary

Every post gets one static author card between the "views are my own" note and the Share area:
a visible `h2` "Written by Don Coleman", the home page's existing portrait as a 96 px circle,
two first-person lines on Don's current role, and three plain links (the post's series page, or
`/writing/` for a post in no series; "More about me"; "Get in touch"). The facts live once, in a
new `blog.author` object in `src/config/blog.ts`, which imports the home page's photo file. A
new `AuthorCard.astro` renders it with Astro's `<Image />`; `PostLayout.astro` places it as a
direct child of the `<article>`, so it shares the title card's edges as feature 035 arranged for
the views note and Share area. No script, no server code, no new dependency, no cost.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, per `package.json`)

**Primary Dependencies**: Astro (`astro:assets` `<Image />`), Tailwind CSS; no additions

**Storage**: N/A (settings constant in `src/config/blog.ts`; photo file already in the repo)

**Testing**: Vitest unit and component tests (Astro Container API), Vitest build test on the
fixture site, Playwright E2E (`blog.spec.ts`), a11y, visual and budget projects

**Target Platform**: Static pages on Cloudflare Workers static assets

**Project Type**: Static web site (Astro)

**Performance Goals**: Post page stays inside the existing budget (LCP 2.5 s, CLS 0.1, 10 KB
JS, 150 KB total at 390 x 844); the card adds 0 bytes of JS and a lazy 96/192 px WebP below the
fold

**Constraints**: WCAG 2.2 AA in both themes; works with JavaScript off; no sideways scroll at
320 px; card edges match the title card's at every width

**Scale/Scope**: One new component, one layout edit, two config edits; post pages only

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1 design. No violations.*

| Principle | How this plan meets it |
|-----------|------------------------|
| I. Test-First | Tests are written and seen to fail first, one primary layer each (table under Design, "Tests"): unit for `seriesOf()` and the author settings rules, component for the card's markup and its place in `PostLayout`, build test for "posts only", E2E for layout and edges, a11y scan and visual shot for the template. |
| II. Automated Release Gate | No check is skipped or weakened. Existing tests that assert end-of-post order (`blog.spec.ts`) are extended to include the card, not loosened. The changed `post-template` baselines are refreshed on purpose for both platforms. |
| III. Human Review of Every Change | Normal PR from `drc-agents`, Don approves, auto-merge armed. Don reviews the two draft lines and the link wording in the PR; the PR body lists a `[PREVIEW-CHECK]` to look at the card on a Drift post, a no-series post and at phone width, and to check the manual accessibility remainder (SC-005: alt text and link wording, keyboard focus through the three links, 200% text zoom). The PR body lists the spec's out-of-scope items under "Follow-up". |
| IV. First-Party Before Custom | Astro component, Astro `<Image />` (`astro:assets`), Tailwind theme, Cloudflare static assets. Each Astro choice cites its docs page in research.md (R2: Images guide and `densities` reference; testing via the Container API, docs.astro.build/en/guides/testing/#vitest-and-container-api). Astro Docs MCP was available and used. Cloudflare: nothing beyond the existing static-asset serving is needed; no Worker code. No custom code replaces a first-party feature; the only new logic is `seriesOf()`, a five-line helper over the existing topic config. Table in research.md R8. |
| V. Static by Default | The card is prerendered HTML in every post page. No endpoint, no island, no client script (FR-009). Core content stays readable with JS off. |
| VI. Content as Files | No CMS or database. The author facts are a typed constant in a committed config file; the photo is the committed home-page image. No post frontmatter changes. |
| VII. Private Data | No personal data collected, stored or sent. The card links to the existing Contact page; the contact form is untouched. |
| VIII. Cloudflare Best Practices | No Worker, binding, D1, Turnstile or routing change. Only `/api/*` still invokes Worker code. Free plan usage unchanged. |
| IX. Cost Ceiling | Expected added monthly cost: **$0**. The photo is a few kilobytes of static asset on the existing free-plan static hosting; no new service. |
| X. Accessible, Fast and Private | Visible `h2`, meaningful alt text, heading-first DOM, link targets over 24 px, existing tested colour pairs in both themes, reflow at 320 px. Lazy image below the fold keeps LCP, CLS (width and height set) and the byte budget unchanged. No tracking or third-party script. |
| XI. Spec Kit Workflow | Spec Kit branch and directory (`039-post-author-card`). Sibling worktrees 036, 037, 038 and 040 have no `src/` changes yet; see "Parallel work" below for how overlaps are handled. |
| Development Workflow | Constitution Check present; Astro choices cite docs; tests before implementation; each test names its layer; scope limited to the card (other stale wording is follow-up per the spec); card copy is plain language. |
| Security Baseline | `public/_headers` (including the CSP) unchanged: no script, inline style or external resource is added. No secrets. |

## Design

### Files

| File | Change |
|------|--------|
| `src/config/blog.ts` | Add `author: { name, photo, photoAlt, lines }` (data-model.md). `photo` is `import portrait from "../content/pages/images/don-coleman.jpg"`. Update the header comment. |
| `src/config/topics.ts` | Add `seriesOf(topics)`: the series id in a post's topics, or `undefined`. |
| `src/components/post/AuthorCard.astro` (new) | Props `{ topics: readonly string[] }`. Renders the card per contracts/author-card.md, reading `blog.author`, `seriesOf`, `findTopic`, `topicHref`. |
| `src/layouts/PostLayout.astro` | Insert `<AuthorCard topics={post.topics} />` between the views note wrapper and `<Share>`; update the header comment's end-of-post order. |
| `tests/unit/...` (topics and blog settings tests) | `seriesOf` cases; author settings rules. |
| `tests/component/post/AuthorCard.test.ts` (new), `PostLayout.test.ts` | Card markup rows; DOM order row. |
| `tests/build/` (fixture-site build test) | Card on every post page, on no other page. |
| `tests/e2e/blog.spec.ts`, `blog.a11y.spec.ts` | Order and edges include the card; phone and desktop layout; card links in the 24 px target list. |
| `tests/e2e/visual.spec.ts-snapshots/post-template-*` | 8 baselines refreshed (see Visual baselines). |
| `specs/008-blog/contracts/blog-pages.md` "Post" | Note the card in the end-of-post order, pointing to this feature's contract. |

### Card markup (outline)

```text
section[data-author-card]  (title-card box, mt-8, flex-col items-center text-center; md: flex-row items-start text-left gap-6)
  div (text block, flex-1)
    h2  "Written by Don Coleman"
    p   line 1
    p   line 2
    ul  (flex flex-wrap gap-x-4, justify-center; md: justify-start)
      li a  writing link
      li a  "More about me"   /about/
      li a  "Get in touch"    /contact/
  Image (96 x 96, densities [1, 2], webp, rounded-full, order-first, shrink-0)
```

### Decisions settled in this plan (clarify left them open)

1. **Phone layout** (research R3): below 768 px the photo sits on top and everything is
   centred; from 768 px the photo is on the left and the text is left-aligned. This is the same
   breakpoint and alignment rule feature 035 gave the views note and Share area, so the three
   end-of-post pieces switch together.
2. **Contact link text** (research R4): "Get in touch". It is the spec's example, says what the
   link does, and is already the site's wording for this link (Work with me page call to action,
   Technology page).
3. **Writing link without a series** goes to `/writing/`, the writing landing page, with text
   "More of my writing" (research R4).

### Reuse of existing pieces

- **Portrait**: the home page's `src/content/pages/images/don-coleman.jpg` (645 x 645), imported
  once in `blog.ts`. Not copied, not moved; the home page is unchanged.
- **End-of-post structure from feature 035** (PR #157, merged as 1f92fc6): 035 removed the
  `max-w-3xl` cap from the views note and Share area, made both direct full-width children of the
  `<article>` (so they share the title card's edges, including under the questions-panel row at
  `xl`), centred them below `md` and left-aligned them from `md`. The card follows the same
  pattern: a direct child of the article, `mt-8`, no width cap, same breakpoint. 035's E2E edge
  test loops over `["[data-views-note]", "[data-share]"]`; this feature adds
  `"[data-author-card]"` to that list.
- **Card style**: the title card's border, background, radius, padding and shadow classes.
- **Link style**: the landing page's "All posts" link classes.

### Tests (layer per behaviour)

| Behaviour | Contract row | Layer | File |
|-----------|--------------|-------|------|
| `seriesOf` returns the series or `undefined` | A8 | Unit | `tests/unit/content/topics.test.ts` |
| Author lines: two, one line each, at most 100 characters each, no "Cloud Architect" in any case; name and alt non-empty | A6, FR-002, FR-003 | Unit | `tests/unit/content/blog-config.test.ts` |
| The About page's text contains the role title the card's first line uses | A6, FR-004a | Unit (reads the About page source file) | `tests/unit/content/blog-config.test.ts` |
| Photo file at the 2x size is at most 20 KB | A5, FR-014a | Build (only the real build makes the file) | fixture-site build test |
| Heading, image attributes, two lines, three links in order, series vs no-series link, no script; DOM order heading, lines, links, photo; no post title, date or topic pill | A4 to A9, A14 | Component | `tests/component/post/AuthorCard.test.ts` |
| Card sits after the views note and before Share in the article | A2 | Component | `tests/component/post/PostLayout.test.ts` |
| Card on every built post page, on no other page | A1 | Build (output spanning pages) | fixture-site build test |
| Card edges match the title card at 320, 375, 768, 1024 and 1440 px, with and without the questions panel | A3 | E2E (geometry only a browser shows) | `blog.spec.ts` (extend 035's loop) |
| Phone stack and centring; desktop photo left | A10, A11 | E2E | `blog.spec.ts` |
| Visual order views note < card < Share < Related | A2 | E2E, second layer: the existing order test is extended because it already asserts the rendered order with Share and Related | `blog.spec.ts` |
| Card border, text, links and focus indicator survive forced colours | A15 | E2E (only a browser emulates forced colours) | `blog-forced-colors.spec.ts` |
| 24 px targets, axe scan both themes | A12 | a11y | `blog.a11y.spec.ts` selector list; templates already scanned |
| About and Contact links resolve | A13 | Existing crawl | `site-links.spec.ts` (no change) |
| Template look | — | Visual | `post-template` shot (no spec change) |

### Visual baselines

Yes, this changes a snapshotted template. The `post-template` fixture subject captures
`#main > article` on the fixture post `every-part` (a Drift post), and the card is inside the
article. Its eight baselines change on purpose:
`post-template-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png`. Tasks must refresh
both platforms per `.claude/skills/_shared/visual-baselines.md` (macOS update, then Linux via
Docker; ask Don to start Docker Desktop if it is off). No other visual subject renders a post
page, so any other diff is a regression.

### Parallel work

Sibling worktrees 036 (technology diagram), 037 (wayfinder), 038 (this site as a project story)
and 040 (home page now / start here) have changed no `src/` file yet. 040 works on the home page:
if it renames or moves `don-coleman.jpg`, the import in `blog.ts` fails the build loudly; the
later branch to merge updates the path. No sibling is expected to touch `PostLayout.astro`,
`blog.ts`, `topics.ts` or the `post-template` baselines; if one does, the later branch merges
`origin/main` and regenerates the baselines.

## Project Structure

### Documentation (this feature)

```text
specs/039-post-author-card/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── author-card.md
├── checklists/
└── tasks.md             # /speckit-tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── components/post/AuthorCard.astro    # new
├── config/blog.ts                      # + author
├── config/topics.ts                    # + seriesOf()
├── content/pages/images/don-coleman.jpg  # reused, unchanged
└── layouts/PostLayout.astro            # places the card

tests/
├── unit/content/blog-config.test.ts
├── component/post/AuthorCard.test.ts   # new
├── component/post/PostLayout.test.ts
├── build/                              # fixture-site page scan
└── e2e/blog.spec.ts, blog.a11y.spec.ts, visual.spec.ts-snapshots/post-template-*
```

**Structure Decision**: The existing single Astro project. The card follows the existing post
component pattern (`src/components/post/`, settings in `src/config/blog.ts`, tests mirrored
under `tests/component/post/`).

## Open questions for Don (review, not blockers)

- The two role lines are drafts (FR-003); he may revise them in `blog.ts`.
- Photo alt text is "Don Coleman" (the heading already says "Written by Don Coleman"); the home
  page uses the longer "Don Coleman, smiling, in a portrait photo".

## Complexity Tracking

No Constitution Check violations; nothing to justify.
