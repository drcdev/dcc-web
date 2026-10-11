# Contract: part files and their build errors

Collection `architecture`: `src/content/architecture/*.md`, `glob()` loader, schema in
`src/content/schemas/architecture.ts`. Each row has one primary test; the logic row is a unit
test, the wiring is proven once by a build test (`sync` mode, `tests/build/fixture-site.ts`).

| Row | Input | Result |
|---|---|---|
| P01 | `name` missing or blank | Astro schema error naming the file and `name` |
| P02 | an unknown front-matter key | schema error naming the key (strict object) |
| P03 | `source` absolute (`/x`) or containing `..` | build error: `Architecture part file <file>: source "<path>" must be a path inside the repository, like worker/src/index.ts.` |
| P04 | `source` names a path that does not exist | build error: `Architecture part file <file>: source "<path>" does not exist in the repository.` |
| P05 | `source` names a file | URL `https://github.com/drcdev/dcc-web/blob/main/<path>` |
| P06 | `source` names a folder | URL `https://github.com/drcdev/dcc-web/tree/main/<path>` (no trailing slash) |
| P07 | empty body | build error: `Architecture part file <file>: the part has no explanation. Add a few sentences below the settings.` |
| P08 | a part file whose id is not in the layout, or a layout id with no file | build error from `<ArchitectureDiagram>` naming the missing or extra ids |
| P09 | a layout label whose lines do not join to the file's `name` | build error from `<ArchitectureDiagram>` naming the id, the lines and the name |
| P10 | every real part file | `source` tracked by git (`git ls-files --error-unmatch`); every part but `browser` has a `source`, `browser` has none (SC-001) |

Layers: P01, P02 schema unit test; P03–P07 unit tests of `assertPartSource` / `sourceUrl` /
body check with neutral example data in a temp folder; P08, P09 unit tests of the pure
`checkParts(layout, parts)` function plus the component test; one `sync` build test proves
`generateId` calls `assertPartSource` (P04 with a broken fixture under
`tests/fixtures/architecture/broken/`); P10 a unit content test that reads the real files through
`tests/helpers/content.ts` (new `architectureParts` reader) and needs no edit when content changes.

Error text follows `contentError()` in `src/lib/content/errors.ts` ("Architecture part file" is a
new kind alongside "Page file", "Post file" and "Project file").
