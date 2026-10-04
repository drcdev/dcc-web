# Contract: project build errors, retired status and replacement

Adds to `specs/014-project-four-part-story/contracts/build-errors.md` (same conventions: every
error stops `astro build` and names the file; custom checks use `Project file <path>:
<problem>`; schema errors come through Astro's content validation, which names the entry, the
file and the setting path). Each row id appears in the title or a comment of the test that
asserts it, and `docs/testing.md` "Contract-row mapping" gains these rows.

Sources: **schema** = `projectSchema` (call site proven by the existing `sync` run "row 03");
**replacement** = `checkReplacements` in the story route's `getStaticPaths()` (call site proven
by one `build` run, drafts included in a production build).

## Changed

| # | Case | Source | Message must contain |
|---|---|---|---|
| S02 | Unknown status | schema | file, `status`, `shipped`, `experiment`, `in-progress`, `retired` |

## New

| # | Case | Source | Message must contain | Primary assertion | Call-site run |
|---|---|---|---|---|---|
| RP01 | `replacedBy` on a project whose status is not `retired` | schema | file, `replacedBy`, "only a retired project can name a replacement" | `unit/project-schema.test.ts` "RP01" | sync, row 03 |
| RP02 | `replacedBy` with both `project` and `name`, with neither, or with `href` beside `project` | schema | file, `replacedBy`, "either project … or name" / "href goes with name" | `unit/project-schema.test.ts` "RP02" | sync, row 03 |
| RP03 | `replacedBy.href` not https; unknown key in `replacedBy`; empty `name` | schema (strict) | file, the setting path, the existing message | `unit/project-schema.test.ts` "RP03" | sync, row 03 |
| RP04 | `replacedBy.project` names no project file (drafts count as files) | replacement | file, `replacedBy`, the missing id, `src/content/projects/<id>.mdx` | `unit/project-replacement.test.ts` "RP04" | build, "RP04: a retired draft naming a missing project fails a production build" |
| RP05 | `replacedBy.project` names the project itself | replacement | file, `replacedBy`, "this project itself" | `unit/project-replacement.test.ts` "RP05" | build, RP04 run (same `checkReplacements` call) |

## Not an error

- A retired project whose `replacedBy.project` is a draft builds in production; the note
  names the draft by its title with no link (FR-007).
- A retired draft: the draft notice and the retired note both show outside production, and
  the project is left out of production like any draft.
- A retired project with no `replacedBy`.
