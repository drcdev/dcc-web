# Contract: the doncoleman.ca story file

The story's only interface is its page, produced by the existing project story template from
the file. Each row is a rule the delivered file must meet, the requirement it serves and how it
is checked. "Build" means the real `astro build` fails on a breach; "Existing test" names a test
that already runs over every project; "Preview" means Don checks it on the branch preview.

| Row | Rule | Req | Checked by |
|---|---|---|---|
| C01 | File `src/content/projects/doncoleman-ca.mdx` validates against the unchanged `projects` schema | FR-001 | Build |
| C02 | Body has exactly Problem, Options, Build, Lessons as `##` headings, in order, plain Markdown only | FR-002 | Build |
| C03 | Options holds a bold-label constraint list, one table with matching columns and `Yes`/`Partly`/`No` cells, exactly one bold option, then a `Why` paragraph | FR-002 | Build |
| C04 | Build part covers the four pipelines, the constitution, the single-approval rule with the separate agent account, and the gate cut from about 31 to about 6 minutes | FR-003, SC-002 | Preview |
| C05 | Every figure traces to a record named in the notes comment (research R9) | FR-004, SC-003 | Review of the diff |
| C06 | `source` is `https://github.com/drcdev/dcc-web`; the page shows a "Source code for doncoleman.ca" link | FR-005 | Existing test (`projects-no-js.spec.ts`, picked story); Preview for the signed-out open (SC-004) |
| C07 | `visual` and both story pictures (the screenshot beside Problem, the diagram beside Build) have alt text; the diagram has a `description`; only the Edge Cases budget fallback may drop the Problem screenshot | FR-006 | Build (schema) for alt and description; review of the diff for the picture count |
| C08 | `pipeline.svg` embeds the Inter glyphs it uses, asks for no system font, is under 16 KB, and its labels fit their boxes | FR-006 | Existing tests (`tests/unit/site/diagram-fonts.test.ts`, `tests/e2e/diagram-fonts.spec.ts`) |
| C09 | `status: shipped`, `date: 2026-09-28` | FR-007 | Review of the diff |
| C10 | Body links `/projects/cadence/` where it names the pipelines' origin | FR-008 | Existing test (`site-links.spec.ts` crawls every internal link) and Preview |
| C11 | Copy is plain, first person, from the recorded interview answers only; Don's quote keeps every word in his order (only punctuation and capitalisation may change); no "Cloud Architect" | FR-009, FR-010 | Preview |
| C12 | `draft: true` | FR-011, SC-001 | Existing build-mode tests (production leaves drafts out) |
| C13 | Title `doncoleman.ca`, themes `[Agentic development, Web, Static sites]`, an invitation | FR-013 | Review of the diff |
| C14 | List picture is a light-mode home page screenshot, 1600 x 1000, metadata stripped | FR-014 | Preview, `sips`/sharp on the file |
| C15 | Page passes the a11y and budget checks and is readable without JavaScript | SC-005, SC-006 | Existing tests (`a11y.spec.ts`, `budget.spec.ts`, `projects-no-js.spec.ts` on the picked story, research R5) |
| C16 | No link to the site's own host; no `demo` or `standIn` | Edge cases | Build (`indexing.test.ts` host rule) |
| C17 | No test names the story; `tests/build/indexing.test.ts` reads the host from `setup/config.json` | FR-012 | Existing test (`no-real-content-in-tests.test.ts`, research R6) |
