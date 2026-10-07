# Research: Plain Markdown for standard content (028)

All Astro choices below were checked against the Astro Docs MCP (`astro-docs`) on 2026-10-07.
Installed versions: `astro` 7.3.5, `@astrojs/mdx` 8.0.2, `@astrojs/markdown-satteri` 0.4.2.

## R1. Do Markdown `##` / `###` headings in MDX page bodies get linkable ids?

- **Decision**: Yes. Rely on Astro's built-in heading ids; add nothing.
- **Rationale**: Astro "injects an `id` attribute into all heading elements (`<h1>` to `<h6>`)
  in Markdown and MDX files", generated with `github-slugger`
  (docs.astro.build/en/guides/markdown-content/#heading-ids). The site uses the Sätteri processor
  (`astro.config.mjs`, `markdown.processor: satteri(...)`); the same docs section covers it
  (`satteriHeadingIdsPlugin` runs by default, after custom plugins). Astro 6 made the
  github-slugger ids the default and stopped trimming trailing hyphens
  (docs.astro.build/en/guides/upgrade-to/v6/#changed-markdown-heading-id-generation).
- **Confirmed against the real build** (`pnpm run build` in this worktree, 2026-10-07):
  `dist/about/index.html` has `<h2 id="about-me">`, `<h3 id="recognition">`,
  `<h2 id="about-the-writing">` from the `##`/`###` lines of `src/content/pages/about.mdx`.
  `dist/work-with-me/index.html` today has `<h2>Speaking topics</h2>`,
  `<h3 data-offering-title>…` and so on: no ids at all, because the headings are printed by the
  `TextBlock` / `Offerings` / `Offering` components, not by Markdown. SC-001 baseline: 0 of 12.
- **Expected ids after the rewrite** (github-slugger): `speaking-topics`,
  `systems-thinking-for-technology-leaders`, `practical-ai-in-healthcare`,
  `leading-change-without-formal-authority`, `past-talks`, `consulting`, `kinds-of-work`,
  `advice-on-technology-change`, `workshops`, `plan-reviews`, `how-i-work`, `what-i-dont-do`.
  All distinct, so the duplicate-text edge case does not arise on this page (github-slugger
  would suffix `-1` if it did).
- **Alternatives considered**: giving `TextBlock` / `Offering` an `id` prop or slugging their
  `title` in the component. Rejected: custom code duplicating a first-party feature
  (Principle IV), and the issue removes those components anyway.

## R2. How does the build reject the removed sections?

- **Decision**: Remove `TextBlock`, `Offerings` and `Offering` from `sectionNames` and
  `sectionComponents` in `src/components/sections/index.ts`. The existing check in
  `validatePageBody` (`src/lib/content/body.ts`) already throws
  `` `<Tag> is not a section. The sections are: …` `` for any capitalised tag outside code that is
  not in `sectionNames`, naming the file. It runs for pages (`src/pages/[...slug].astro`) and
  posts (`src/lib/posts.ts`). No new code, no per-tag hint (clarification 1).
- **Rationale**: FR-002 asks for exactly the existing error. The code-exemption (fenced and
  inline code) is already in `withoutCode`.
- **Alternatives considered**: an explicit "removed sections" list with a migration hint.
  Rejected by the clarification.
- **Also removed**: `TextBlock.astro`, `Offerings.astro`, `Offering.astro`, their schemas in
  `schemas.ts`, and the `offerings` counter in the `content` summary (`schemas.ts` and
  `summarise()` in `validate.ts`), which only `Offerings` used. Keeping dead fields would be
  scope creep in reverse; removing them is part of removing the section.

## R3. Does plain Markdown on the Work with me page look right without a component?

- **Decision**: Yes; no new styles. Pages render through the same `<Content>` in
  `src/pages/[...slug].astro` as About and the privacy policy, whose `##`/`###` headings,
  paragraphs and lists are already styled by the site typography (heading colours FR-014 of the
  sections feature: h2 rust, h3 sage). `**bold**` and the `- ` list already render inside the
  current `TextBlock`, so they are unchanged.
- **Alternatives considered**: a wrapper `<section>` per `##`. Rejected: the issue wants plain
  Markdown, and the current `TextBlock` `<section>` has no accessible name, so it is not a
  landmark and losing it changes nothing for assistive technology.

## R4. Tests that describe the removed sections

Each behaviour keeps one primary layer (constitution, Development Workflow; `docs/testing.md`).

| Test | Change | Layer |
|------|--------|-------|
| `tests/unit/content/body.test.ts` | Add: `<TextBlock title="x">`, `<Offerings>`, `<Offering title="x">` each throw the "is not a section" message naming the file and listing the eight; inside fenced/inline code they do not throw. Existing `it.each(sectionNames)` cases follow the shorter list automatically. | unit |
| `tests/unit/content/section-schemas.test.ts` | Expected name list becomes the eight; delete the `TextBlock` and `Offerings and Offering` blocks; drop `offerings` from `withContent`. | unit |
| `tests/component/sections/TextBlock.test.ts`, `Offerings.test.ts` | Delete with the components. | component |
| `tests/unit/content/launch-content.test.ts` | Rewrite the Work with me structure tests against Markdown: only `Lead` and `CallToAction` tags; Lead first; `##` headings in FR-005 order; three `###` under Speaking topics and under Kinds of work; the no-practice note after `## Consulting`; CTA href `/contact/`. Drop the three names from `registered`. | unit |
| `tests/build/local-site.test.ts` | Rewrite "builds /work-with-me/ …": h2 titles come from the source's `^## ` lines; three h3 under each of the two list sections; no skipped level; **every h2/h3 in `<main>` after the h1 has a non-empty unique `id`** (FR-006, SC-001). Only the real build shows ids. | build |
| `tests/unit/site/docs-content-structure.test.ts` | `docs/pages.md` has an example of each of the eight (adds `ContactForm`, `RecentWriting`); it does not contain `<TextBlock`, `<Offerings` or `<Offering`; `docs/posts.md` does not name them. | unit |
| `tests/fixtures/pages/sections.mdx` | Remove the `TextBlock` and `Offerings` blocks; add one paragraph with an inline Markdown link (`[Architecture reviews](/contact/)`) so the link tests keep a content link. | fixture |
| `tests/e2e/sections.spec.ts` | No-JS text list drops "How I work" and "What I offer"; the focus/target-size test checks the CTA only (an inline link is exempt from WCAG 2.5.8 target size), and the inline link keeps the focus-indicator and underline checks. | e2e |
| `tests/e2e/visual.spec.ts` baselines | `sections-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png` (8 files) are refreshed, because the fixture page loses two blocks. No other baseline changes. | visual |

- **Alternatives considered**: keeping the fixture's `TextBlock`/`Offerings` area as equivalent
  Markdown so the page length stays similar. Rejected: the fixture already has `##`, `###` and
  `####` headings, and the baseline changes either way.
- Earlier specs under `specs/` (for example `specs/003-standalone-pages/contracts/sections.md`)
  are records and are not edited. Source comments that cite them stay.

## R5. Visual baselines

- The visual project (`tests/e2e/visual.spec.ts`) snapshots the header, footer, not-found page,
  open menu, the **sections fixture page** (`http://localhost:4322/sections/`, full page), post
  and story templates, listing cards, project rows, series pieces and the contact form fixture.
  It does **not** snapshot `/work-with-me/`.
- The shell, templates and design system are unchanged. The only affected shots are the eight
  `sections-*` PNGs. A baseline-update task is needed, following
  `.claude/skills/_shared/visual-baselines.md` (macOS locally; Linux via Docker, or the
  `visual-baselines` CI label if Docker is unavailable; this page gains no unusual glyphs).

## R6. Cost and services

- No dependency, binding, endpoint, service or configuration is added or removed. Expected
  monthly cost change: $0.
