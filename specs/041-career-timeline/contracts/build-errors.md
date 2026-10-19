# Contract: career timeline build errors

Every message starts `Career step file src/content/career/<id>.yaml:` (the `contentError` helper in
`src/lib/content/errors.ts`, with `ErrorKind` gaining `"career step"`), or is Astro's own schema
error, which names the file and the field path. Every message carries the file, the field and,
where there is one, the offending value (spec FR-005a). Messages are plain and say what to change. The
phrases below are the asserted part; exact wording is settled in implement.

| Row | Cause | Where it is decided | Message phrase |
|---|---|---|---|
| T01 | Missing or empty `role`, `organization` or `scope` | schema | `<field>: …` (Astro names the file) |
| T02 | `start` or `end` not `YYYY-MM` (end also allows `present`), or month not 01–12 | schema | `start: write the month as YYYY-MM` |
| T03 | `end` before `start` | schema refine | `end: the end month is before the start month` |
| T04 | Unknown key (including any category other than the three) | schema (strict) | Astro's unrecognized-key message naming the key |
| T05 | Empty `achievements`, `leadership`, `awards` or `posts` list | schema | `<field>: list at least one item, or leave the key out` |
| T06 | Award without `name` or `year`, or `href` not https | schema | `awards.<n>.<field>: …` |
| T07 | Same post listed twice in one step | schema refine | `posts: <slug> is listed twice` |
| T08 | Current role (latest start) has `nextMove` | `checkCareer()` | `the current role has no next move yet; remove nextMove` |
| T09 | Current role does not end `present` | `checkCareer()` | `this is the latest role, so end must be present` |
| T10 | A `posts` entry names no post file | `checkCareer()` | `post "<slug>" does not exist in src/content/posts/` |
| T11 | A `posts` entry names a draft post | `checkCareer()` | `post "<slug>" is a draft; publish it or remove it from posts` |
| T12 | A text field over its limit (role, organization 120; scope and detail parts 300; items and award names 200) | schema | `<field>: keep this under <limit> characters` |
| T13 | A step file that cannot be parsed | Astro's YAML loader | Astro's parse error naming the file |
| T14 | `volunteer` is not true or false | schema | `volunteer: write true, or leave the key out` |

## Where each row is proven (docs/testing.md "Check functions and call sites")

- **Logic**: T01–T07, T12 and T14 in `tests/unit/content/career-schema.test.ts`; T08–T11 in
  `tests/unit/content/career.test.ts`. One case per row; the test title carries the row id.
- **T13** is decided by Astro's own YAML loader; no custom code decides it, so it has no test of
  its own.
- **Wiring**: one `sync` run proves the collection schema is wired and Astro names the file (T01
  as the representative row). One `build` run proves `checkCareer()` runs from the About page and
  its message reaches the build output (T09 as the representative row: it needs no post
  resolution, so it is available from User Story 1; T10 and T11 use the same call site and are
  proven at the unit layer). Both in
  `tests/build/career-timeline.test.ts`. That is two Astro runs added to the build budget.
