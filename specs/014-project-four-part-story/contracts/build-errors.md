# Contract: project build errors (four-part story)

Supersedes `specs/009-portfolio/contracts/build-errors.md` for project files. Every error stops
`astro build` and names the file. Custom checks use `Project file <path>: <problem>` (or
`Project files <a> and <b>: <problem>`); schema errors come through Astro's content validation,
which names the entry, the file and the setting path. Each row id appears in the title or a
comment of the test that asserts it; `docs/testing.md` "Contract-row mapping" lists where.

Sources: **schema** = `projectSchema` (call site: collection schema, proven by a `sync` run);
**generateId** = loader checks in `src/content.config.ts` (`sync` run); **story** =
`validateProjectStory` in `getStaticPaths()` (call site: `build` run, drafts included in a
production build); **route** = other route checks (`build` run).

## Carried over from 009 (unchanged rule, renumbered)

| # | Case | Source | Message must contain |
|---|---|---|---|
| S01 | Missing `title`, `problem`, `description`, `status` or `date` | schema | file, the setting |
| S02 | Unknown status | schema | file, `status`, `shipped`, `experiment`, `in-progress` |
| S03 | No theme / more than four / a theme twice | schema | file, `themes` |
| S04 | Missing list picture or its alt; picture with no alt; diagram with no description | schema | file, `visual` / `visuals`, `alt` / `description` |
| S05 | Unknown or misspelled setting (e.g. `titel`) | schema (strict) | file, the setting |
| S06 | Problem over 140 characters or several sentences | schema | file, `problem`, "one sentence of at most 140 characters" |
| S07 | Demo not HTTPS on drc.dev; source or stand-in not HTTPS; demo and stand-in both set | schema | file, the setting, the address or "demo or standIn, not both" |
| S08 | Picture name not `^[a-z][a-z0-9-]*$` | schema | file, `visuals`, the name |
| S09 | Missing picture file | generateId | file, the image path |
| S10 | Bad file name / nested file | generateId | file, "lower-case letters, digits and hyphens" / "subfolder" |
| S11 | Two files, one slug (`x.md` + `x.mdx`) | `generateId` twin check | both files, "slug x" |

## Removed settings (FR-017, US5-3)

| # | Case | Source | Message must contain |
|---|---|---|---|
| R01 | `order` used | schema (strict) | file, `order` |
| R02 | `demo.embed` used | schema (strict) | file, `embed` |
| R03 | A picture of kind `clip` | schema | file, `visuals`, `kind` |
| R04 | `comparison` used (structured options, pros, cons) | schema (strict) | file, `comparison` |
| R05 | Any MDX element in the body (`<Chapter>`, `<OptionComparison />`, `<Demo />`, `<Invitation />`, `<Visual>`, a page section, anything else) | story | file, the tag, "plain Markdown" |
| R06 | `import` or `export` in the body | story | file, "plain Markdown" |

## New settings

| # | Case | Source | Message must contain |
|---|---|---|---|
| N01 | `visuals.<name>.part` not one of the four parts | schema | file, `part`, `problem`, `options`, `build`, `lessons` |
| N02 | Two pictures with the same `part` | schema | file, both picture names, the part |
| N03 | `invitation` not text | schema | file, `invitation` |

## Parts (FR-002, FR-015, edge cases)

| # | Case | Source | Message must contain |
|---|---|---|---|
| P01 | A part is missing | story | file, "missing the part", the part heading |
| P02 | A level-2 heading that is not one of the four (renamed or extra) | story | file, the heading text, "Problem, Options, Build, Lessons" |
| P03 | A part repeated | story | file, the part, "more than once" |
| P04 | Parts out of order | story | file, the part, "out of order", "Problem, Options, Build, Lessons" |
| P05 | Level-1 heading in the body | story | file, "level-1 heading", "##" |
| P06 | Image in the body | story | file, "visuals", "part" |
| P07 | Text before the first part (other than MDX comments) | story | file, "before ## Problem" |

Allowed, and asserted as passing in the same unit test: level-3+ headings inside a part; MDX
comments anywhere; a table in Problem, Build or Lessons.

## Options part (FR-006, FR-013, FR-014, US3)

| # | Case | Source | Message must contain |
|---|---|---|---|
| T01 | No table in Options | story | file, "Options", "needs one table" |
| T02 | More than one table in Options | story | file, "Options", "only one table" |
| T03 | Empty first header cell (the option column is not named) | story | file, "first column", "names the options" |
| T04 | No constraint columns | story | file, "at least one constraint column" |
| T05 | A row with a different number of cells than the header | story | file, the option, "cells" |
| T06 | A cell that is not yes, partly or no | story | file, the option, the constraint, "yes, partly or no" |
| T07 | No option in bold, or more than one | story | file, "exactly one option must be in bold" (and the count) |
| T08 | An option bolded only in part | story | file, the option, "exactly one option must be in bold" |
| T09 | The first block after the table (skipping blank lines and MDX comments) is not a paragraph starting with the word "Why" | story | file, "Why" |
| T10 | No list before the table in Options (the constraint list is the last list before it) | story | file, "constraint list" |
| T11 | A constraint list item with no bold label, or no colon after it | story | file, the item text, "bold label" |
| T12 | Bold labels differ from the column headings in name or order (exact text, colon and inner formatting ignored) | story | file, both lists of names, "same names, in the same order" |
| T13 | Two options with the same name, or two constraint headings the same | story | file, the repeated name, "more than once" |

Allowed, and asserted as passing: `Yes` / `PARTLY` (case-insensitive); a one-option table
whose only row is bold; a multi-sentence "Why" line; a missing or multi-line explanation after
a label; the colon inside the bold label; bold or a link inside an answer cell; an MDX comment
between the table and the "Why" line.

## Template (FR-019, FR-020)

| # | Case | Source | Assertion |
|---|---|---|---|
| X01 | `_template.mdx` is present | loader pattern | build succeeds; no `projects/_template/` page, no list row, no sitemap entry |
| X02 | A renamed copy of the template | all | build succeeds and the copy has a page with four parts, links and the invitation |

No message contains anything from outside the project file (no environment value or secret;
the build tests keep the canary assertion).
