# Contract: build failures

Every message is plain language, names the file and says what to change. The messages use the
existing `contentError()` format (`<Kind> file <path>: <problem>`), with two new kinds: `Now` and
`Reading path`. Astro's own schema errors name the file and key themselves. The custom text goes
in the Zod `error`/`message` options. Each message names the file, the field or item (an item by its
number in the path and its `kind: slug`) and the rule broken (spec FR-006a). The build may stop at
the first failure; it need not report every failure at once.

## Now entry

| Id | Condition | Message (gist) | Layer |
|----|-----------|----------------|-------|
| N01 | `updated` missing | schema: "updated: write the date as YYYY-MM-DD" | unit |
| N02 | `updated` not a real `YYYY-MM-DD` day (e.g. 2026-02-30) | `Now file src/content/now/now.md: updated must be a real date written YYYY-MM-DD` | unit |
| N03 | `updated` after the build date (UTC) | `…: updated (2027-01-01) is in the future. Use today's date or earlier.` | unit + build (proves the date check runs in the build) |
| N04 | `workingOn`, `reading`, `mbaResearch` or `aiExperiments` missing or blank | schema names the key: "add workingOn: what you are working on now" (one per key) | unit |
| N05 | unknown key (strict) | schema names the key | unit |
| N06 | body empty, or has no link to `/contact/` | `…: the body is the "open to" line and must link to /contact/.` | unit + build (proves `checkNowBody()` runs in the build) |
| N07 | no Now file, or more than one | `Now file src/content/now/: there must be exactly one Now file, now.md.` | build |
| N08 | body has more than one paragraph or a heading | `…: the "open to" line is one paragraph.` | unit |
| N09 | `workingOn`, `reading`, `mbaResearch` or `aiExperiments` longer than 200 characters or more than one line | schema names the key: "workingOn: keep it to one line of at most 200 characters" | unit |

## Reading paths

| Id | Condition | Message (gist) | Layer |
|----|-----------|----------------|-------|
| R01 | `title`, `description` or `position` missing | schema names the key | unit |
| R02 | `description` not one sentence ending `.` or over 160 characters | schema | unit |
| R03 | `items` empty or more than five | schema: "list between 1 and 5 items" | unit |
| R04 | item names a post or project that does not exist (no file at all; a draft exists and is never R04) | `Reading path file src/content/reading-paths/<id>.yaml: item 2 (post: no-such-post) does not exist. Use the file name of a post in src/content/posts/.` | unit + build (proves `checkReadingPaths()` runs in the build) |
| R05 | the same item twice in one path (same kind and slug; a post and a project with the same slug are different items) | `…: item 3 (project: cadence) is listed twice.` | unit |
| R06 | more than four path files (counted before drafts are removed) | `Reading path files in src/content/reading-paths/: there are 5 paths; the most is 4.` | unit |
| R07 | two paths with the same `position` | `Reading path files <a> and <b>: both use position 2.` | unit |
| R08 | an item with both or neither of `post` / `project`, or another key | schema: "each item is either post: <slug> or project: <slug>" | unit |
| R09 | YAML that does not parse | Astro's parse error naming the file | build |
| R10 | `position` outside 1–4 | schema | unit |

## Not errors (by design)

- A path that points at a draft builds. Production hides the item, and hides the path if it ends up empty (FR-013).
- No reading-path files: the section is hidden (US2-AS5).
- A Now date older than six months: no warning (spec Follow-up).
- The same post in two paths.
