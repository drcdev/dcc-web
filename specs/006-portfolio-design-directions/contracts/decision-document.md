# Contract: `docs/design/portfolio.md` and its screenshots

The only lasting output of the feature (with the spec folder). It must be complete and
readable without the preview deployment (User Story 4, SC-004).

## Files

- `docs/design/portfolio.md`
- `docs/design/portfolio/<direction>-<page>-<width>-<theme>.webp`, where direction is `a`,
  `b` or `c`; page is `index` or `story`; width is `phone` (390 px) or `desktop` (1280 px);
  theme is `light` or `dark`. Exactly 24 files (FR-040). Full-page captures taken with
  reduced motion requested so every stage is in its final state. Each file under 600 KB.
- Nothing else under `docs/design/` is touched (the blog feature owns `docs/design/blog.md`
  and `docs/design/blog/`).

## Document structure

1. `# Portfolio design directions`
2. Short introduction: what the directions are for, the sample project (Focus Pocus, content
   marked as a draft for Don's review), that Focus Pocus has no live demo so its drc.dev page
   stands in, and how the screenshots were taken.
3. `## Preview addresses`: a sentence saying every address is pinned to commit `<sha>`, the
   last commit that still contained the prototypes, so it keeps working after they were
   removed (FR-046), and that Cloudflare keeps a limited number of versions, so the
   screenshots are the lasting record.
4. For each direction, `## Direction A: Timeline` (then B: Cards, C: Chapters):
   - Summary (two or three sentences).
   - Preview: links to the pinned index and story addresses.
   - Screenshots: a table with rows story/index and columns phone light, phone dark, desktop
     light, desktop dark; each image has alt text naming direction, page, width and theme.
   - `### How it works`: four labelled paragraphs: Story stages, Option comparison, Demo
     embeds, Scroll reveals (each also covers reduced motion and JavaScript off).
   - `### Trade-offs`: a list of strengths and costs (build effort, JavaScript, browser
     support, phone reading, how it scales to many projects, how it would hold real media).
   - `### New visual resources`: "None." or a plain list (FR-005, User Story 4 scenario 2).
5. `## Comparison`: one table, directions as columns, rows for the four behaviours,
   JavaScript shipped, browsers without scroll-driven animations, and effort to build for real.
6. `## Contact hand-off`: the `/contact/?project=<slug>` link and a pointer to
   `specs/006-portfolio-design-directions/contracts/contact-handoff.md`.
7. `## Decision`: the heading followed by nothing but an HTML comment
   `<!-- Don: record the chosen direction and any changes here. -->` (FR-041).

## Checks

- A unit test (`tests/unit/prototypes/portfolio/decision-doc.test.ts`, on the branch only)
  asserts: the three direction headings; each direction's four behaviour labels, trade-offs
  and new-resources sections; exactly 24 image references, each resolving to an existing file
  in `docs/design/portfolio/`; every image has non-empty alt text; the Decision section has no
  content other than the comment; the "pinned to commit" sentence with a 7–40 character hex
  SHA once the URLs are filled in. Like every other file outside the document and its
  images, this test is deleted in the removal commit; the final step runs it on the filled-in
  document first and only then deletes it (quickstart.md, step 7).
- Plain language, no hype (FR-032).
