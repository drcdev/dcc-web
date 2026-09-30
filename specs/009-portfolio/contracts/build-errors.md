# Contract: project build errors

Every error stops `astro build` (so CI fails and nothing deploys) and names the file. Custom
checks use `Project file <path>: <problem>` (or `Project files <a> and <b>: <problem>`); schema
errors come through Astro's content validation, which names the entry, the file and the setting
path. Each row has one broken fixture in `tests/fixtures/projects/broken/` and one assertion in
`tests/build/project-validation.test.ts` (asserted phrase in quotes).

| # | FR-073 case | Source | Message must contain |
|---|---|---|---|
| 01 | Missing title | schema | file, `title` |
| 02 | Missing problem | schema | file, `problem` |
| 03 | Missing status / unknown status | schema | file, `status`, the allowed values |
| 04 | No theme / more than four / same theme twice | schema | file, `themes` |
| 05 | Missing index visual or its alt | schema | file, `visual` / `alt` |
| 06 | Setting of the wrong kind (e.g. `order: first`), or an order of 0, below 0 or not whole | schema | file, the setting |
| 07 | Unknown setting (e.g. `titel`) | schema (strict) | file, the setting |
| 08 | Problem over 140 characters or more than one sentence | schema | file, `problem`, "one sentence of at most 140 characters" |
| 09 | Missing chapter | body check | file, "is missing the chapter" + stage |
| 10 | Chapters out of order | body check | file, "out of order" + stage |
| 11 | Repeated chapter | body check | file, "more than once" + stage |
| 12 | No option marked chosen / more than one | schema | file, "exactly one option must be chosen" |
| 13 | Chosen option without a reason | schema | file, `reason` |
| 14 | Option missing a fit for a constraint | schema | file, option id, constraint id |
| 15 | Comparison with no options or no constraints | schema | file, `comparison` |
| 16 | `<OptionComparison />` missing or outside the options chapter | body check | file, "OptionComparison" |
| 17 | Missing image (frontmatter or body) | `generateId` image check | file, the image path |
| 18 | Visual with no alt text / diagram with no description | schema | file, `alt` / `description` |
| 19 | Clip with no description, missing clip file or clip over 5 MB | schema / clip check | file, the clip path or `description` |
| 20 | Demo address not on drc.dev (or not HTTPS) | schema | file, `demo.href`, the address |
| 21 | Source-code or stand-in address not HTTPS | schema | file, `source` / `standIn.href`, the address |
| 22 | Demo and stand-in both set | schema | file, "demo or standIn, not both" |
| 23 | Unknown building block (e.g. `<Timeline>`) | body check | file, `<Timeline>`, list of blocks |
| 24 | Unknown visual name | body check | file, the name |
| 25 | `visual="demo"` without `demo.embed: true` | body check | file, "embed" |
| 26 | Duplicate slug (`x.md` + `x.mdx`) or nested file | route check | both files |
| 27 | Bad file name (capitals, spaces) | `generateId` | file, "lower-case letters, digits and hyphens" |
| 28 | Level-1 or level-2 heading in the body | body check | file, "use ### for headings" |
| 29 | Body image without alt text | body check | file, "alt text" |
| 30 | Invitation block missing, outside the invitation chapter or repeated; Demo block missing when demo/standIn/source set, outside the built chapter or repeated | body check | file, "Invitation" / "Demo" |
| 31 | Reason on an option that is not chosen; fit naming an unknown constraint; duplicate option or constraint id | schema | file, `comparison`, the id |
| 32 | Visual name not matching `^[a-z][a-z0-9-]*$` or using the reserved name `demo`; a clip as the index visual | schema | file, `visuals` / `visual`, the name or kind |

No message contains anything from outside the project file (no environment value or secret).

A page file that tries to use `/projects/…` fails through the existing address check (the
`src/pages/projects/` routes own that prefix once `/projects/` is no longer reserved).
