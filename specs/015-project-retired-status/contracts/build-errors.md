# Contract: project build errors, retired status and replacement

Adds to `specs/014-project-four-part-story/contracts/build-errors.md` (same conventions: every
error stops `astro build` and names the file; custom checks use `Project file <path>:
<problem>`; schema errors come through Astro's content validation, which names the entry, the
file and the setting path). Each row id appears in the title or a comment of the test that
asserts it, and `docs/testing.md` "Contract-row mapping" gains these rows.

Sources: **schema** = `projectSchema` (call site proven by the existing `sync` run "row 03");
**replacement** = `checkReplacements` in the story route's `getStaticPaths()` (call site proven
by one `build` run, drafts included in a production build).

**When each source runs.** The schema checks run during Astro's content sync, which every
build (and `astro sync`) performs before any page is rendered, so a schema failure stops the
build first. `checkReplacements` runs at the top of the story route's `getStaticPaths()` over
every project entry, drafts included, before drafts are filtered out; the route exists in
every build, so the check runs even in a production build that publishes no project pages.

**A file that breaks several rules.** Schema rows (S02, RP01 to RP03) are reported before
replacement rows (RP04, RP05), because the route never runs on content that fails the
schema. Zod may report several schema problems of one file together; the build must fail
naming the file, and at least the first problem found must be in the message. Example: a
non-retired project whose `replacedBy.project` names itself fails with RP01; RP05 is
reported only after the status is fixed.

**Test layers.** Each row's primary layer is the unit test named in "Primary assertion".
The call-site run is a deliberate second layer, with this reason: a unit test cannot show
that the check is actually wired into the real `astro build` (schema rows through the
existing `sync` run "row 03", replacement rows through one production `build` run).

**Spec mapping.** FR-008 and the spec's edge cases map to rows as follows, with none
unmapped: replacement on a non-retired project → RP01; both or neither of `project` and
`name`, `replacedBy: {}`, `href` beside `project` → RP02; non-https or host-less `href`,
unknown key, empty or whitespace-only `name`, `replacedBy:` with no value (null) → RP03;
missing project → RP04; self reference → RP05; unknown status → S02.

## Changed

This row replaces the S02 row of feature 014 (whose message listed three values).

| # | Case | Source | Message must contain |
|---|---|---|---|
| S02 | Unknown status | schema | file, `status`, `shipped`, `experiment`, `in-progress`, `retired` |

## New

| # | Case | Source | Message must contain | Primary assertion | Call-site run |
|---|---|---|---|---|---|
| RP01 | `replacedBy` on a project whose status is not `retired` | schema | file, `replacedBy`, "only a retired project can name a replacement" | `unit/project-schema.test.ts` "RP01" | sync, row 03 |
| RP02 | `replacedBy` with both `project` and `name`, with neither (including `replacedBy: {}`), or with `href` beside `project` | schema | file, `replacedBy`, "either project … or name" / "href goes with name" | `unit/project-schema.test.ts` "RP02" | sync, row 03 |
| RP03 | `replacedBy.href` not an `https://` URL with a host; unknown key in `replacedBy`; empty or whitespace-only `name`; `replacedBy:` written with no value (null) | schema (strict) | file, the setting path, the existing message (Zod's type message for null) | `unit/project-schema.test.ts` "RP03" | sync, row 03 |
| RP04 | `replacedBy.project` names no project file (drafts count as files) | replacement | file, `replacedBy`, the missing id, `src/content/projects/<id>.mdx` | `unit/project-replacement.test.ts` "RP04" | build, "RP04: a retired draft naming a missing project fails a production build" |
| RP05 | `replacedBy.project` names the project itself | replacement | file, `replacedBy`, "this project itself" | `unit/project-replacement.test.ts` "RP05" | build, RP04 run (same `checkReplacements` call) |

## Not an error

- A retired project whose `replacedBy.project` is a draft builds in production; the note
  names the draft by its title with no link (FR-007).
- A retired draft: the draft notice and the retired note both show outside production, and
  the project is left out of production like any draft.
- A retired project with no `replacedBy`.
- A retired project whose `replacedBy.project` is itself a retired project (a chain): linked
  or named like any other replacement; nothing follows the chain.
- Two projects naming each other (A replaced by B, B replaced by A), or a longer loop: each
  is only a reference shown in one note and nothing walks the chain, so it cannot break the
  build or a page. Not checked.
- A retired draft whose `replacedBy.project` is also a draft: neither page exists in
  production, so no note is shown there; `checkReplacements` still checks both files.
