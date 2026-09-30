# Contract: build errors for post files

Every rule stops `astro build` (and so `pnpm run verify`, CI and the Cloudflare deploy) with a
message naming the file and the problem (FR-003, FR-018, FR-033, FR-043, FR-044, FR-052,
SC-003). Messages written by
this feature start with `Post file` or `Post files`; schema messages come from Astro's content
collection error, which names the entry and the key. Each row has one broken fixture in
`tests/fixtures/posts/broken/` and one case in `tests/build/post-validation.test.ts`. The build
stops at the first error; tests use one broken file per run.

| # | Mistake | Detected by | Message must contain |
|---|---|---|---|
| P1 | No `title`, or empty or only spaces | schema | file name, `title` |
| P2 | No `summary`, or empty or only spaces | schema | file name, `summary` |
| P3 | No `date` | schema | file name, `date` |
| P4 | Unreadable date (`date: next tuesday`, `"2026-08-27"` quoted, `27/08/2026`, `2026-02-30`) | schema / post file check | file name, `date` |
| P5 | No `topics`, or an empty list | schema | file name, `topics` |
| P6 | Unknown topic (`agentic-a1`) | schema (enum) | file name, `agentic-a1`, every allowed topic id in list order |
| P7 | Same topic twice | schema | file name, `topics` |
| P8 | `featureImage` without `alt` (or empty) | schema | file name, `alt`, "alt text" |
| P9 | `featureImage` file that does not exist | image check / `image()` | file name, image path |
| P10 | `updated` earlier than `date` | schema | file name, `updated` |
| P11 | Unknown or misspelled setting (`sumary`) | strict schema | file name, `sumary` |
| P12 | Body image with empty alt text | body check | file name, "alt text" |
| P13 | `.md` file in `src/content/posts/` | post file check | file name, "rename it to .mdx" |
| P14 | Post in a sub-folder | post file check | file name, "sub-folder" |
| P15 | File name with characters other than lower-case letters, digits and hyphens | post file check | file name, "lower-case letters, digits and hyphens" |
| P16 | Reserved slug (`all.mdx`, `topics.mdx`) | post file check | file name, the address, "reserved" |
| P17 | Two files with one slug (`x.mdx` + `x.md`) | post file check | both file names, the address |
| P18 | Level-1 heading in the body | body check | file name, "use ##" |
| P19 | Unknown section tag (`<Callout>`) | body check | file name, `Callout`, the list of sections |
| P20 | Empty body | body check | file name, "no content" |
| P21 | A topic removed from the list while a post still names it | schema (enum) | file name, the topic id |
| P22 | Body image file that does not exist (`![…](./images/missing.png)`) | `astro:assets` import / body check | file name, image path (FR-052) |

P21 is the same mechanism as P6; its test removes a topic from a copied `topics.ts` in the
fixture site. There is no warning tier (spec FR-033): nothing else about a post file is
checked. A code fence naming a language the highlighter does not know is not an error; it is
shown as plain text (spec Edge Cases). A Shiki colour the class map does not know, or a `style` attribute left in
highlighted code, also fails the build (R7); that is a developer error, covered by
`tests/unit/markdown/shiki-classes.test.ts`, not a post-file row.
