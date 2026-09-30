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
   marked as a draft for Don's review), that the screenshots and demo clips inside the
   stories are labelled placeholders, that Focus Pocus has no live demo so its drc.dev page
   stands in (FR-049), and how the screenshots were taken.
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
   - `### Trade-offs` (FR-048): what it does well; what it does poorly; its build and
     maintenance effort; and its risks: accessibility, browser support, how it would hold
     real media, and how it scales to many projects.
   - `### New visual resources`: "None." or a plain list (FR-005, FR-049, User Story 4
     scenario 2).
5. `## Comparison` (FR-048): one table, directions as columns, with exactly these rows: fit
   with the site's current look; how clearly the options are shown; reading on a phone;
   accessibility risk; JavaScript shipped; behaviour in browsers without scroll-driven
   animations or view transitions; demo embedded or linked; effort to build and maintain for
   real. The table describes; it does not rank, score or recommend (FR-041).
6. `## Contact hand-off`: the `/contact/?project=<slug>` link and a pointer to
   `specs/006-portfolio-design-directions/contracts/contact-handoff.md`.
7. `## Decision`: the heading followed by nothing but an HTML comment
   `<!-- Don: record the chosen direction and any changes here. -->` (FR-041).

## Checks

- A unit test (`tests/unit/prototypes/portfolio/decision-doc.test.ts`, on the branch only)
  asserts: the three direction headings; each direction's four behaviour labels (each
  paragraph mentioning reduced motion and JavaScript off), trade-offs (well, poorly, effort,
  risks) and new-resources sections ("None." or a list); the Comparison table's eight rows;
  the draft, placeholder-media and demo stand-in disclosures; no ranking, scoring or
  recommendation wording; exactly 24 image references, each resolving to an existing file
  in `docs/design/portfolio/`; every image's alt text names its direction, page, width and
  theme; the Decision section has no
  content other than the comment; the "pinned to commit" sentence with a 7–40 character hex
  SHA once the URLs are filled in. Like every other file outside the document and its
  images, this test is deleted in the removal commit; the final step runs it on the filled-in
  document first and only then deletes it (quickstart.md, step 7).
- Plain language, no hype (FR-032).
