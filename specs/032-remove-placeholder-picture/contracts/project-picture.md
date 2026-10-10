# Contract: project picture (file format and DOM)

Delta against `specs/014-project-four-part-story/contracts/project-file.md`,
`build-errors.md` and `pages-dom.md`.

## File format

A picture accepts exactly the fields in [data-model.md](../data-model.md). `placeholder` is not
one of them.

## Build error

| Row | Cause | Detected by | Message names |
|---|---|---|---|
| (unlabelled; R05 is already used in `project-validation.test.ts`) | `placeholder` on `visual` or on a `visuals` entry (any value) | schema (strict) | file, `placeholder` |

Primary test: unit (`tests/unit/content/project-schema.test.ts`). File naming by Astro is covered
by the existing schema wiring run in `tests/build/project-validation.test.ts`.

## DOM (project story page)

`<figure data-part-picture data-visual="image|diagram" data-visual-name="<name>">` contains:

- one `<img>` from `astro:assets` `<Image>` with the picture's `alt`; `loading="eager"` for the
  first picture on the page, `lazy` for the rest; diagrams add `aria-describedby` pointing at
- a `<figcaption id="picture-<name>-description">` (diagrams only).

It contains no element with `data-placeholder` or `data-visual-mark`, and no "Placeholder" text.
No stylesheet rule targets `[data-placeholder]` or `[data-visual-mark]`.

The project index row (`ProjectRow.astro`) is unchanged: it never rendered a mark.
