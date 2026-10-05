# Review report: shared-helpers-dead-plumbing (issue #98)

Fresh-eyes review of `chore/shared-helpers-dead-plumbing` against `plan.md`, 2026-10-05.
Diff read as `git diff main...HEAD` (main at 5f65379; W1 to W7). The review subagent could not
write this file, so the orchestrator saved its returned text here.

## Verdict

All seven work items are done as planned, and nothing outside the plan's scope changed. No
`.claude/`, `.github/`, `public/`, `setup/`, `wrangler.jsonc`, `package.json` or `src/content/`
file is touched, so no shared pipeline block is restated. No check is weakened. No CRITICAL or
HIGH finding; three LOW findings, all closed by the orchestrator before verify (see Resolution).

Re-checked in the review phase:

- `pnpm run test:worker`: 19 files, 281 tests, green (includes the new `worker/test/http.test.ts`
  and "Q04: a declared length over the cap is 413 before the body is read").
- `vitest run --project unit` on the 17 touched unit files: 513 tests, green.
- `pnpm run typecheck` and `pnpm run lint`: green.
- `playwright test --list` on `shell.spec.ts` and `not-found.spec.ts`: 109 tests (111 before).
- `wrangler.e2e.json` sha256 `187732139410de23…`, byte-identical before and after.

## Checks against the plan

- **Walkers return the same file sets.** A scratch comparison of the old `statSync` walker with
  `filesUnder` over 15 roots gave identical sets. The old and new `contentFiles` gave the same
  list in the same order for all 20 content folders. Every per-site filter keeps its meaning
  (`changed-paths` segment skips and `anyExt`, `images/` skips, `_` / `broken/` skips,
  `design-source` `existsSync` guard, `local-site` `startsWith(fontsDir)`).
- **JSONC readers.** On the real `wrangler.jsonc`, `stripJsonc` parses deep-equal to the old
  `drift.test.ts` reader; on `wrangler.jsonc` and `worker/tsconfig.json`, deep-equal to the old
  `config-files.test.ts` stripper. Both tests guard the same values.
- **Endpoints.** Contact is unchanged: its early `Content-Length` check now lives in `readCapped`
  with the same `too_large` log and 413; parse failure and non-object still give 400
  `invalid_json`. Questions keeps method, origin and content-type checks first; `null` results
  map to 413 `too_large` and 400 `invalid` as before. The only runtime change is the planned
  early 413 on questions; the new test fails on 5f65379.
- **Removed E2E coverage.** Both deleted `shell.spec.ts` tests were `test.skip` whenever
  `futureDestinations` was empty, so they had not run since the list emptied. The not-found
  spread added nothing.
- **Deleted `reserved` unit cases.** `reserved` was always `[]` on main. The real-route test now
  asserts that `writing.mdx` and `projects.mdx` throw naming `src/pages/writing/` and
  `src/pages/projects/` (the claimant is `[slug].astro`, sorted first; the directory-level
  assertion is right).
- **Coverage map.** Every W5 mapping is true; `docs/testing.md` row 14 names the widened test.
- **Principle III.** Major change: "touches how contact data is collected" —
  `worker/src/contact/submit.ts` now reads every submission through `readCapped` in
  `worker/src/http.ts`. No other criterion fires (no dependency or service change, no
  navigation or visual change, no cost change, `e2e-wrangler-config.ts` output byte-identical).
- **Test layers.** `http.test.ts` at the worker unit layer, the early-reject case at the worker
  endpoint layer (`questions.test.ts`), `projectHref` at the unit layer next to `postHref`.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **`docs/pages.md` lines 48–51 still said "reserved".** The page `reserved` input is gone;
   `/writing/` and `/projects/` are taken because route files claim them and `/contact/` because
   `contact.mdx` is the contact page. The author-facing rule was still true but named a
   mechanism that no longer exists.
2. **`filesUnder` does not follow symlinks** (`tests/helpers/files.ts`). The old walkers did; no
   symlink exists under any walked root today, so every list is the same. A doc-comment line
   covers it.
3. **Missing space before the closing brace** in `tests/unit/content/addresses.test.ts` line 156
   (`routeFiles?: string[]}`), left over from deleting `reserved?: string[]`.

Noted, not a finding: the shared `stripJsonc` drops trailing commas with a regex that does not
look inside strings. That was already true of the setup-check copy; no config the repo reads has
such a value.

## Resolution

All three LOW findings were fixed by the orchestrator before the verify gate: the
`docs/pages.md` section is now "Menu positions and taken addresses" and explains why each
address is taken; `filesUnder`'s doc comment states that symlinks are skipped; the brace spacing
is fixed.

## After-measurement

Before figures from `plan.md` Acceptance (5f65379); after figures at the end of W7.

| What | Before | After |
|---|---|---|
| `function readCapped` in `worker/src` | 2 copies | 1 (`worker/src/http.ts`) |
| `JSON.parse` in the two endpoint files | 2 | 0 |
| `Content-Length` handling outside `http.ts` | 1 (contact only) | 0 (both endpoints via `readCapped`) |
| `SourceFile` lines in `worker` | 2 | 0 |
| JSONC readers in `scripts` and `tests` | 3 | 1 (`scripts/lib/jsonc.ts`) |
| `contact-shared` imports in `e2e-wrangler-config.ts` and `strip-jsonc.test.ts` | 2 | 0 |
| Hand-written walkers in `tests` (`isDirectory()` lines) | 17 walkers (18 lines) | 0 walkers (1 unrelated line) |
| Files naming `futureDestinations` | 8 | 0 |
| `reserved` lines in `src/lib/content/addresses.ts` | 7 | 1 (post-slug rule only) |
| Stale comments | 2 | 0 |
| `addressOfProject` | 1 (no callers) | 0 |
| Inline `/projects/${…}/` address literals | 3 | 1 (`projectHref` itself) |
| Listed tests in `shell` + `not-found` specs | 111 | 109 (two always-skipped removed) |
| `wrangler.e2e.json` sha256 | `187732139410de23…` | identical |

`git diff --stat main...HEAD` at the end of W7: 45 files, +666 / −417; without `.specify/`,
44 files, +313 / −417, net −104 lines. The test additions include 88 new test lines; without
them the test tree shrinks by about 150 lines.

## Follow-ups for the PR body

- **Major change (Principle III):** touches how contact data is collected; behaviour unchanged.
- **F1. Script and site walkers.** `scripts/fonts/embed-diagram-fonts.ts` (`svgFilesUnder`) and
  `src/lib/prune-unreferenced-assets.ts` (`walk`) could use recursive `readdirSync` too; out of
  scope (the issue named test walkers only).
- **F2. Contact `nav:` front matter.** Optional in #98, skipped: Contact is already a fixed
  primary entry, and moving it risks a navigation change for no gain.
