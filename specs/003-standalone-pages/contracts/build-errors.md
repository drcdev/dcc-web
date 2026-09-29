# Contract: build errors for page files

Every rule below stops `astro build` (and therefore `pnpm run verify`, the CI `verify` check and
the Cloudflare deploy) with a message that names the file and the problem in plain language
(FR-007, FR-008, FR-009, SC-003). Messages produced by this feature start with `Page file` or
`Page files`; schema messages come from Astro's content collection error, which names the entry
and the key. Each row has one broken fixture in `tests/fixtures/pages/broken/` and one test case in
`tests/build/page-validation.test.ts`.

| # | Mistake | Detected by | Message must contain |
|---|---|---|---|
| 1 | No `title` | schema | file name, `title` |
| 2 | No `description` | schema | file name, `description` |
| 3 | Wrong type (`nav.position: "second"`) | schema | file name, `position` |
| 4 | Unknown / misspelled key (`titel`) | strict schema | file name, `titel` |
| 5 | `image` or `featureImage` without `alt` (or empty alt) | schema | file name, `alt` |
| 6 | Image file that does not exist (frontmatter) | `image()` helper | file name, image path |
| 7 | Image file that does not exist (body) | Astro image resolution | image path |
| 8 | Markdown image with empty alt in the body | body check | file name, "alt text" |
| 9 | Empty body | body check | file name, "no content" |
| 10 | Unknown section (`<Callout>`) | body check | file name, `Callout`, list of valid sections |
| 11 | Section missing required information (`<CallToAction label="x">`) | section prop check | file name, `CallToAction`, `href` |
| 12 | Image section with no image inside | section prop check | file name, section name, "image" |
| 13 | Two files, same address (`about.md` + `about.mdx`; `x.mdx` + `x/index.mdx`) | address check | both file names, the address |
| 14 | Page address used by another route (`404.mdx`, `robots.txt` style conflicts) | address check | page file, route file, the address |
| 15 | Two navigation entries with the same position (page vs page, page vs fixed entry) | navigation merge | both sources, the position |
| 16 | Level-1 heading in the body (`# Heading`) | body check | file name, "use ##" |

Row 7's message comes from Astro and may not include the page file; the test asserts only the
image path for that row (noted, not a gap in FR-007: the build still fails and says which image).
