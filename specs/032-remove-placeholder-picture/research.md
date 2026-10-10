# Research: Remove the project placeholder picture option

## R1. How the build rejects the removed setting

- **Decision**: Delete `placeholder: z.boolean().optional()` from both shapes in
  `pictureVisuals()` in `src/content/schemas/project.ts`. Both are `z.strictObject`, and the story
  shapes are `.extend()`ed from them (still strict), so `placeholder` on `visual` or on any
  `visuals` entry becomes an unrecognised key.
- **Rationale**: First-party Astro content collection schema with `astro/zod` (Astro docs,
  "Content collections > Defining the collection schema",
  https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema). Astro
  reports a schema failure with the file name (`InvalidContentEntryDataError`,
  https://docs.astro.build/en/reference/error-reference/#content-collection-errors). This is the
  same mechanism already used for removed settings R01-R04 (`order`, `demo.embed`, `comparison`).
  `placeholder: false` is rejected too, because the key itself is unknown (spec edge case).
- **Alternatives considered**: A custom refine with a bespoke "placeholder was removed" message
  — rejected: Principle IV (first-party covers it) and the R01-R04 precedent uses plain strict
  errors. Keeping the key as deprecated/ignored — rejected: spec FR-001/FR-002.

## R2. The `data-visual-mark` style hook

- **Decision**: Remove the `[data-visual-mark]` rule in `src/components/project/portfolio.css`
  (~line 98) and the `[data-placeholder]` selector in the forced-colours border list (~line 225).
- **Rationale**: Clarify confirmed the only element carrying `data-visual-mark` or
  `data-placeholder` is the mark in `PartPicture.astro` (`grep -rn data-visual-mark src tests`
  finds only those two places). Once the mark goes both are dead code (FR-003). The forced-colours
  list keeps `[data-part-picture]` and every other project element (US2 scenario 2).
- **Alternatives considered**: Keep `data-visual-mark` for future marks — rejected, no current
  user and the spec scopes it in as "its styles".

## R3. Where the rejection is tested

- **Decision**: Primary layer unit: add tests to `tests/unit/content/project-schema.test.ts`
  next to R01-R04 asserting the issue text names `placeholder` for (a) `visual` image,
  (b) `visual` diagram, (c) a `visuals` image entry, (d) a `visuals` diagram entry, and that
  `placeholder: false` is rejected too. No new broken fixture or build run.
- **Rationale**: Constitution test placement: one primary layer, the cheapest that observes it.
  That Astro runs the strict schema on real files and names the file is already proven by the
  existing wiring run in `tests/build/project-validation.test.ts` ("rows 01 to 08 ... the schema
  is wired and Astro names the file"). The spec's acceptance scenario 1/2 (build fails naming
  file and setting) is therefore met by unit (setting named) plus existing wiring (file named).
  The spec rules out adding a fixture to prove rejection (US3 scenario 1).
- **Alternatives considered**: A new broken removed-placeholder fixture with a build run —
  rejected as a second layer with no new behaviour to observe, adding ~build-time cost to the gate.

## R4. Which visual baselines change

- **Decision**: Refresh only `story-template-*` (8 PNGs: desktop/phone x light/dark x
  darwin/linux). Leave the 40 `project-row-*` PNGs and all others untouched.
- **Rationale**: `tests/e2e/visual.spec.ts` shoots `article[data-story]` on
  `/projects/every-part/`, where three story pictures (`problem-shot`, `build-shot`,
  `lessons-shot`) render the mark. The project rows are rendered by `ProjectRow.astro`, whose
  props carry only `visual.src` and `visual.alt`; it never reads `placeholder`, so dropping the
  key from `visual` in the fixtures changes no row pixels. The retired story header and lead
  story fixtures do not use the setting.
- **Alternatives considered**: Refresh project rows as the issue suggested — rejected: FR-007
  says baselines whose pixels do not change are left as they are, and an unpredicted diff would
  be a regression.

## R5. Broken fixtures

- **Decision**: Remove the single `placeholder: true` line from the list picture of each of the
  seven broken fixtures that have it (`17-missing-image`, `26-duplicate-slug`, `27-bad-file-name`,
  `R01-removed-order`, `RP04-missing-replacement`, `story-malformed-table`, `story-mdx-element`),
  plus the valid `draft.mdx`, `every-part.mdx` (4 lines) and `every-setting.mdx` (2 lines).
- **Rationale**: FR-005. After the schema change, a leftover key would make a broken fixture fail
  on `placeholder` instead of its intended error. Note: `R01-removed-order` is also reused (with a
  `status: nonsense` replace) as the draft wiring fixture; removing the line keeps that run failing
  on `status` only. The existing `project-validation` build tests assert each intended message,
  so they confirm FR-005 without new tests. (Clarify estimated "about 10"; the exact count of files
  is 10 fixtures with 14 lines, plus 2 test-data objects in `helpers.ts` and `project-schema.test.ts`.)

## R6. Fixture alt text containing the word "placeholder"

- **Decision**: Keep `alt: A placeholder picture for the ...` in `every-part.mdx`.
- **Rationale**: It is alt text, not the setting (SC-003 counts mentions of the setting). Alt text
  is not drawn, so it does not affect the story-template pixels either way; keeping it avoids
  touching any alt-dependent assertion. A task-level grep for the setting should use
  `placeholder:` (the YAML key), not the bare word.
- **Alternatives considered**: Rewording to "A sample picture for the ..." — harmless but out of
  scope churn.

## R7. Documentation

- **Decision**: In `docs/projects.md` remove the `placeholder: true` YAML line (~line 87) and the
  `placeholder` bullet (~line 205), and rename "## Drafts and placeholders" to "## Drafts" (no
  in-repo link targets that anchor). Leave `docs/design/portfolio.md` and `specs/014-*` as
  historical records.
- **Rationale**: FR-006; Clarify decision.

## Astro Docs MCP

Consulted (`astro-docs` search "content collection schema Zod strict object unknown keys build
error"). Astro 7.3.5 re-exports Zod 4 from `astro/zod`; schema failures are reported per file.
