# Implementation Plan: One footer block at the end of posts

**Branch**: `045-post-footer-consolidation` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/045-post-footer-consolidation/spec.md`

## Summary

The views note, the author card and the Share area become one box at the end of each post's
`<article>`. A new `PostFooter.astro` renders a `div[data-post-footer]` with the title card's box
and `mt-10`, holding the existing `AuthorCard` (now without a box of its own, with the views note as
a small italic caption at the end of its text column) and the existing `Share` (now without its
gradient box, with a top border as the divider and 1.5 rem above and below it). `PostLayout.astro`
renders `<PostFooter>` in place of the three pieces. Wording, links, the Share button's script and
the content security policy do not change. No server code, no dependency, no cost.

## Technical Context

**Language/Version**: TypeScript (strict), Astro (current stable, per `package.json`)

**Primary Dependencies**: Astro, Tailwind CSS; no additions

**Storage**: N/A (wording stays in `src/config/blog.ts`)

**Testing**: Vitest component tests (Astro Container API), Vitest build test on the fixture site,
Playwright `e2e`, `a11y`, `visual` and `budget` projects

**Target Platform**: Static pages on Cloudflare Workers static assets

**Project Type**: Static web site (Astro)

**Performance Goals**: Post page stays inside the existing budget (LCP 2.5 s, CLS 0.1, 10 KB JS,
150 KB total); the change adds 0 bytes of JS and removes a few CSS classes (the gradient)

**Constraints**: WCAG 2.2 AA in both themes; works with JavaScript off; no sideways scroll at 320 px
or 200% zoom; block edges equal the title card's within 1 px; no new landmark

**Scale/Scope**: One new component, edits to three components and one layout; post pages only

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1 design. No violations.*

| Principle | How this plan meets it |
|-----------|------------------------|
| I. Test-First | Tests change first and are seen to fail: component tests for the new `PostFooter` markup and its place in `PostLayout`, the build test for "one block per post page", E2E for gaps, divider spacing, edges and alignment, forced colours, a11y selector list, and the visual template shot. Each behaviour has one primary layer (table under "Tests"). |
| II. Automated Release Gate | No check is skipped or weakened. Tests that assert today's structure (separate edges for the three pieces, views note before the author card) are rewritten to the new contract rows, not loosened. The eight `post-template` baselines are refreshed on purpose, both platforms. |
| III. Human Review of Every Change | Normal PR from `drc-agents`, auto-merge armed after the final push, Don approves. The PR body lists `[PREVIEW-CHECK]` items: the block on a Drift, a Convergence and a no-series post in both themes at 375 and 1440 px; keyboard order; forced colours; 200% zoom at 320 px. Out-of-scope items go under "Follow-up". |
| IV. First-Party Before Custom | Astro components composed per docs.astro.build/en/basics/astro-components/#component-based-design; the Share script stays an Astro bundled script (docs.astro.build/en/guides/client-side-scripts/); the photo stays `astro:assets` `<Image />` (docs.astro.build/en/guides/images/); tests use the Container API (docs.astro.build/en/guides/testing/#vitest-and-container-api). Astro Docs MCP was available and used. Cloudflare: static-asset serving only, no Worker change. Fly.io: not used by the site and not needed. No custom code replaces a first-party feature (research.md R6). |
| V. Static by Default | The block is prerendered HTML. No endpoint, no new island; the only script is the existing Share button module. Readable with JS off (FR-012). |
| VI. Content as Files | No content or schema change; wording stays in `src/config/blog.ts`. |
| VII. Private Data | No personal data collected or sent. Share links carry only the title and address, as today. |
| VIII. Cloudflare Best Practices | No Worker, binding, D1, Turnstile, Email Routing or route change. Only `/api/*` invokes Worker code. Free plan usage unchanged. |
| IX. Cost Ceiling | Expected added monthly cost: **$0**. No new service, asset or request. |
| X. Accessible, Fast and Private | No new landmark (`div` wrapper, research R2); heading levels unchanged; reading and keyboard order unchanged except the note moving after the links; every text pair at or above 4.5:1 in both themes (research R5: views note 7.5:1 light, 5.8:1 dark); divider and border are CSS borders, so visible in forced colours; no JS added; no tracking. |
| XI. Spec Kit Workflow | Spec Kit branch and directory. Sibling worktrees may touch `PostLayout.astro` and the `post-template` baselines; research R7 says how the later merge handles it. |
| Development Workflow | Constitution Check present; Astro choices cite docs; tests before implementation; each test names its layer; scope limited to the post end (Related posts, wording and other pages are out of scope); no new copy. |
| Security Baseline | `public/_headers` and the CSP unchanged: no inline script or style, no external resource. No secrets. |

## Design

### Files

| File | Change |
|------|--------|
| `src/components/post/PostFooter.astro` (new) | Props `{ topics, title, href }`. Renders `div[data-post-footer]` with `mt-10 rounded-xl border border-dusk-200 bg-white p-6 shadow-sm dark:border-dusk-700 dark:bg-dusk-800`, then `<AuthorCard topics>` and `<Share title href>`. |
| `src/components/post/AuthorCard.astro` | Drop the box classes and `mt-8` from the `section`; render `<ViewsNote />` after the `ul` inside the text column; update the header comment. |
| `src/components/post/ViewsNote.astro` | Classes become `m-0 mt-4 text-sm italic text-dusk-600 dark:text-dusk-300` (no border, no padding, no own alignment); update the comment. |
| `src/components/post/Share.astro` | Drop `mt-8 rounded-lg border-rust-200 bg-gradient-to-r … p-4` and the dark gradient; add `mt-6 border-t border-dusk-200 pt-6 dark:border-dusk-700`; update the comment. Script unchanged. |
| `src/layouts/PostLayout.astro` | Replace the views-note wrapper, `<AuthorCard>` and `<Share>` with `<PostFooter topics={post.topics} title={post.title} href={post.href} />`; update imports and the header comment. |
| `specs/008-blog/contracts/blog-pages.md` "Post" | Items 5, 5a, 6 point to this feature's contract. |
| Tests | See "Tests" and "Existing tests to update". |
| `tests/e2e/visual.spec.ts-snapshots/post-template-*` | Eight baselines refreshed. |

Exact markup, spacing and the contract rows F1 to F12: [contracts/post-footer.md](./contracts/post-footer.md).

### Decisions settled in this plan (clarify left them open)

1. **Wrapper element** (research R2): `<div data-post-footer>`, no role or name. Not `<footer>`:
   although a `<footer>` inside an `<article>` is not a landmark, `a11y.spec.ts` selects
   `"footer a"`, `"footer button[data-theme-toggle]"` and `"footer"`, and `footer-year.ts` reads
   `footer p`; a second `<footer>` would be picked up by those. `geometry.spec.ts`'s
   `body > footer` and `shell.spec.ts` would be unaffected either way. The two parts stay unnamed
   `section`s (generic role, as today).
2. **Font sizes and colour tokens** (research R5): views note `text-sm` (0.875 rem) italic,
   `dusk-600` on `white` (7.5:1) and `dusk-300` on `dusk-800` (5.8:1); author lines stay base size
   `dusk-700` / `mist-300`; headings stay `text-lg` bold `dusk-900` / `white`; share pills keep
   `rust-800` / `rust-300` (11.6:1 / 7.3:1 on the new box background, previously on the gradient).
   Divider and outer border: `dusk-200` / `dusk-700` (decorative).
3. **Gap above the box with the questions panel** (research R4): measured from the bottom of the
   wrapper's previous sibling (the `div` holding the body and, when present, the panel) to the
   wrapper's top. Below 1280 px that is the end of the body; from 1280 px it is the bottom of the
   taller of the body and the panel's grid cell. Not measured from the sticky panel itself.
4. **Divider**: the share part's `border-t`, not an `<hr>` (no `separator` role announced for a
   decorative line).
5. **Views note spacing**: `mt-4` below the link row; it inherits the author part's alignment, so it
   is centred below 768 px and starts at the author text's left edge from 768 px.

### Tests (layer per behaviour)

| Behaviour | Row | Layer | File |
|-----------|-----|-------|------|
| `PostFooter` is one `div[data-post-footer]` with no role/aria, containing author card then share; title-card box classes on the wrapper; no `footer`, `aside`, `hr` | F1, F3, F4 | Component | `tests/component/post/PostFooter.test.ts` (new) |
| Views note inside the author card's text column, after the `ul`, before the `img`; no border classes on the note; the card has no box classes | F2, F4 | Component | `tests/component/post/AuthorCard.test.ts` |
| Share has no gradient, radius or side borders; top border and padding present | F4 | Component | `tests/component/post/Share.test.ts` |
| The block is the last child of the article, once, for the four post kinds (plain, related, questions, draft); related after the article | F1, F2 | Component | `tests/component/post/PostLayout.test.ts` |
| One block per built post page; none elsewhere or in the feed | F1 | Build | `tests/build/blog-listing.test.ts` (extend the 039 describe) |
| Edges at five widths, with and without questions panel | F6 | E2E | `tests/e2e/blog.spec.ts` |
| Gaps above and below the block, 40 ± 1 px at 375 and 1440 px | F7 | E2E | `tests/e2e/blog.spec.ts` |
| Divider spacing 24 ± 1 px each side | F5 | E2E | `tests/e2e/blog.spec.ts` |
| Alignment below and from 768 px, share heading at the photo's left edge, note under the author text | F8 | E2E | `tests/e2e/blog.spec.ts` |
| Views note font size smaller than the author lines | F9 | E2E (computed style; the class alone does not prove the rendered size) | `tests/e2e/blog.spec.ts` |
| Contrast of the note and all text in both themes; 24 px targets | F9, FR-016 | a11y (axe) | `tests/e2e/blog.a11y.spec.ts` (post template already scanned) |
| Border, divider, note and links visible in forced colours | F12 | E2E | `tests/e2e/blog-forced-colors.spec.ts` |
| JS off: all parts present, links visible, button hidden | F11 | E2E | `tests/e2e/blog.spec.ts` "without scripts" (extend) |
| Links and Share button behaviour | F10 | Existing tests unchanged | `AuthorCard.test.ts` links, `Share.test.ts`, `blog.spec.ts` share tests, `site-links.spec.ts` |
| Template look | — | Visual | `post-template` shot (no spec change) |
| Budget (no JS, no CLS) | FR-017 | Budget | existing `budget` project, no change |

### Existing tests to update

- `tests/component/post/ViewsNote.test.ts`: still valid (plain `p`, text, no role); no change unless
  it asserts classes (it does not).
- `tests/component/post/AuthorCard.test.ts`: A6 (`paragraphs()` equals the two lines) and A14
  (`lastIndexOf("<p")` before the `img`) now see the note `p`; A6 filters out `[data-views-note]`,
  A14 adds the note's position. A1/A9 (`byName(html, "section")` length 1, no hidden element) stays.
- `tests/component/post/Share.test.ts`: unchanged assertions remain valid; add the F4 row.
- `tests/component/post/PostLayout.test.ts`: "puts the body … and the views note after it" stays;
  "puts the share area after the views note" stays true; the 039 A2 case ("card after the views
  note and before the share area", "direct child of the article") no longer holds, because the note
  is now inside the card: rewrite it as F1/F2 (`card < note < share` in the DOM, the card inside
  `[data-post-footer]`, and `[data-post-footer]` the article's last element child).
- `tests/build/blog-listing.test.ts`: the 039 A1 regex on `section … data-author-card` still
  matches; add the `data-post-footer` count. A5 (2x portrait size) unchanged.
- `tests/e2e/blog.spec.ts`: the 035 edge loop over `[data-views-note]`, `[data-author-card]`,
  `[data-share]` becomes `[data-post-footer]` (the parts now sit inside the padding); 039 A3 edges
  likewise; A10/A11 (photo stacking, `text-align`) still hold on `[data-author-card]`; the share
  "heading left, links right" test still holds (share padding is 0, so its content right is the
  box's inner right) and gains the F8 heading-left check; the phone centring test still holds; the
  related-order test ("views note < author < share < related" by `y`) changes to
  "author top < note top < share top < related top".
- `tests/e2e/blog-forced-colors.spec.ts`: A15 `expectEdge` moves from `[data-author-card]` to
  `[data-post-footer]`, and a second `expectEdge` on `[data-share]` (its top border is the
  divider); add the note's visibility.
- `tests/e2e/blog.a11y.spec.ts`: selector list keeps `[data-author-card] a`, `[data-share] a`,
  `[data-share] button`; no change.
- `tests/e2e/theme-tokens.spec.ts`: the "share control" probe (`rust-800` / `rust-300`) is unchanged.
- `tests/e2e/fonts.spec.ts`: `[data-views-note]` stays Inter-Italic; no change.
- `tests/e2e/shell.spec.ts`, `geometry.spec.ts`, `a11y.spec.ts`, `footer-year.ts`: unaffected, because
  no `<footer>` is added (decision 1).

### Visual baselines

Changed on purpose, both platforms (8 files): `post-template-{desktop,phone}-{light,dark}-visual-
{darwin,linux}.png`. The shot captures `#main > article` on `/writing/every-part/`, and the block is
inside the article; Related posts is outside it, so its gap is checked by E2E only. No other visual
subject renders a post page (`story-template`, `lead-story`, `listing-cards`, `series-*`,
`project-row-*`, `retired-story-header`, `contact-form`, `career-timeline` on sibling 041), so any
other diff is a regression (FR-018, SC-006). Refresh per `.claude/skills/_shared/visual-baselines.md`
(macOS, then Linux via Docker; Docker Desktop is normally off and Don starts it on request).

## Project Structure

### Documentation (this feature)

```text
specs/045-post-footer-consolidation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── post-footer.md
├── checklists/
└── tasks.md             # /speckit-tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── components/post/PostFooter.astro    # new: the box
├── components/post/AuthorCard.astro    # no box; renders the views note
├── components/post/ViewsNote.astro     # caption classes
├── components/post/Share.astro         # divider instead of gradient box
└── layouts/PostLayout.astro            # renders PostFooter

tests/
├── component/post/PostFooter.test.ts   # new
├── component/post/{AuthorCard,Share,PostLayout}.test.ts
├── build/blog-listing.test.ts
└── e2e/blog.spec.ts, blog-forced-colors.spec.ts, visual.spec.ts-snapshots/post-template-*
```

**Structure Decision**: The existing single Astro project; the new component follows the post
component pattern (`src/components/post/`, tests mirrored in `tests/component/post/`).

## Complexity Tracking

No violations to justify.

## Risks and open questions

- Sibling branches 046, 049 and 050 may edit `PostLayout.astro`, the Related posts cards or the card
  box classes, and refresh `post-template` baselines; the later merge resolves by hand and
  regenerates baselines (research R7).
- Contrast figures are computed from the theme formulas; axe in the a11y project is the enforcing
  check.
