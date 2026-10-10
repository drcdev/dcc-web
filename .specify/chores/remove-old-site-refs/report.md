# Review report: remove-old-site-refs

Branch `chore/remove-old-site-refs`, reviewed against `main...HEAD`. Closes #140.

## Verdict

All seven work items are done as planned and nothing beyond them was changed. One acceptance criterion (the primary grep) is not met because the new W1 guard test itself names Ghost and Supabase. That is the one finding to fix before the gate; everything else holds.

## Findings

### CRITICAL

None.

### HIGH

- **H1 `tests/unit/site/design-source.test.ts:33-35`**: the new W1 test "describes the current design source, not the Ghost or Supabase setup it came from" names Ghost and Supabase in its title and regexes.
  - Issue #140 says test names do not mention Ghost or Supabase. Acceptance criterion 1 allows exactly 4 residue lines, and these add 3 more (7 in total).
  - It is not acceptable residue. The 4 allowed lines name a published post or use generic Spec Kit wording; this one names the old setup.
  - The plan's own W7 reasoning applies. `docs/design-source.md` is a reviewed file, so a guard against the old names coming back protects against a state that cannot arise unattended. The kept heading test already fails if the deleted sections return.
  - **Fix:** delete the test (lines 33-36). Record the mapping in the PR body: the doc's shape is pinned by "has the three required headings", the 18 Flux name literals and the 19-row count, and any reintroduced history would be caught in review.
  - Rewording only the title would not be enough: `/ghost/i` and `/supabase/i` would stay in the file and in the grep.
  - After the fix the primary grep returns exactly the 4 allowed lines.

### LOW

- **L1 `tests/unit/setup-check/report.test.ts:283`**: `expect(human).not.toContain("for the switch")` keeps "the switch" in a test as a negative guard. The primary grep does not match it and it is not one of the issue's named terms, so it can stay for now. It can go when the dead `waiting` status is removed (see follow-ups).
- **L2 `docs/setup.md:561`**: the reflow left "made by hand on 2026-10-09, for issue #91". The plan's wording has no comma. Cosmetic.
- **L3 `scripts/setup-check/checks/mail-records.ts:1`, `scripts/setup-check/checks/preview-noindex.ts:1`, `scripts/site-check/preview.ts:2`, `scripts/site-check/crawl.ts:1`**: the comments were not reflowed after the spec citations were cut. The first lines are short, and `crawl.ts:1` runs past 100 columns. Cosmetic; no lint rule fires.

## Checks

- **Work items against the plan:** W1–W7 each match the plan file by file. No files outside the listed ones were edited (34 files including plan.md), and there are no `public/`, `src/content/`, `src/styles/` or config edits.
- **Rendered output:** the three `.astro` edits (`SiteHeader`, `SiteFooter`, `ContactForm`) are `//` comment lines inside the frontmatter fence only. No visual baselines change.
- **Tests run:**
  - vitest on every touched unit and component file, plus `tests/unit/setup-check`, `docs-content-structure.test.ts` and `changed-paths.test.ts`: 39 files, 568 tests passed.
  - `tests/build/local-site.test.ts`: 46 passed.
  - Touched e2e specs (a11y, headers, not-found, site-links) list cleanly with `playwright test --list`: 453 tests in 4 files.
- **Layers:** no test moved layer, so `docs/testing.md` needs no change.
- **Coverage mappings:**
  - **W6 CSP:** the widened test treats every source that is not a quoted keyword or hash and not a bare scheme as a host, and requires it to be one of the two Web Analytics origins.
    - A scheme-less `x.supabase.co` or `cdn.jsdelivr.net` fails `toContain`, and so does any `https://` vendor origin.
    - The three vendor names are fully covered, so coverage goes up. The rest of the forbidden list is intact.
  - **W7 header and footer:** the `data-ghost-search|data-portal|#/portal` regexes are gone. The visible-text checks and the `facebook.com|twitter.com|x.com` link check remain. Holds.
  - **W7 dns-baseline:** the "no retired record" test is gone. The records that must exist stay pinned, and `dns-records-parity` compares the reviewed file with the live zone. Holds. The `source` fixture swap to `"example"` keeps the assertion's meaning.
  - **W7 schemas:** the removed case had the same input and assertion as "accepts a valid config". Holds.
  - **W1:** the removed "What doesn't carry over" and "Current live URLs" cases are covered by `redirects.test.ts`, `pages.spec.ts`, `not-found.spec.ts` and the `public/_redirects` header comment.
  - **W4:** the report test asserts the new wording and that the old wording is gone.
- **No check weakened** beyond the mapped removals. The not-found and redirect assertions are untouched.
- **Shared blocks:** no pipeline skill was edited.
- **Drift guard:** no `specs/` path literals were added to tests.
- **Principle III:** still not a major change. The diff is docs, comments, one developer CLI string and tests.

## Measurement

Primary grep (plan acceptance 1):

| Point | Lines |
|---|---|
| Before | 62 |
| After (current HEAD) | 7: the 4 allowed lines plus design-source.test.ts:33, 34, 35 |
| After the H1 fix | 4 (allowed residue only) |

Secondary grep (plan acceptance 2): before 12, after 0.

Broader grep (excluding specs, .specify, src/content and the lockfile): every remaining hit is allowed.
- The 4 residue lines, plus H1.
- `public/_redirects` and its tests (`redirects.test.ts`, `pages.spec.ts`).
- `not-found.spec.ts`, which holds the old Ghost path checks.
- Playwright's `chromium.launch` and "browser launch" in `scripts/og-image/render.ts` and `tests/unit/site/og-image.test.ts`.
- The generated `worker/worker-configuration.d.ts`.
- `tests/e2e/headers.spec.ts:28`, where "review host" matches inside "preview host".

A further scan for "the switch", "portal", "old site" and "go-live" found only the theme switch and the L1 line.

## Follow-ups for the PR body

- **Dead `waiting` status:** `scripts/setup-check/types.ts:36`, and no check produces it. Removing it from types, schemas, the report, the check-report JSON schema and the `report.test.ts` waiting block (including L1) is a separate chore. This one only rewords its summary line.
- **Constitution wording:** Technology Constraints (`.specify/memory/constitution.md:194`) still says "the existing Tailwind theme from Don's current site". Changing it is a constitution amendment, which must go through `speckit-constitution`, so it is not done here.

## Round 2

Fix commit `2702ee0` checked against round 1.

### Findings

- **CRITICAL:** none.
- **HIGH:** none. H1 is closed. The "describes the current design source, not the Ghost or Supabase setup it came from" test is gone from `tests/unit/site/design-source.test.ts`, and no `/ghost/i` or `/supabase/i` remains in the file.
- **MEDIUM:** none.
- **LOW:** L1–L3 from round 1 are unchanged. They are cosmetic or follow-up items and do not block.

### Checks

- **Scope of the fix:** the commit touches only `tests/unit/site/design-source.test.ts` (5 lines removed) and `plan.md` (a 2-line H1 note under W1). Nothing else changed.
- **The doc's shape is still pinned:**
  - "has the three required headings": How to get Flux, Mapping, Accessibility adjustments.
  - The clone-command and read-only, gitignored and never-imported wording.
  - The Mapping column header, the 19-row count, the allowed owners, and the 32 Flux name literals.
  - The Accessibility adjustments table and ratio rows.
- **Plan note is accurate:** the coverage note added to W1 in `plan.md` is true. It names the heading test, the Flux literals and the row count, and says reintroduced history is caught in review. (Round 1 put the literal count at 18; the file holds 32. The plan note gives no count, so it stays correct.)
- **Tests:** `pnpm exec vitest run tests/unit/site/design-source.test.ts tests/unit/site/docs-content-structure.test.ts` passed (2 files, 127 tests).

### Measurement

| Grep | Before | After |
|---|---|---|
| Primary (acceptance 1) | 62 | 4 (exactly the allowed residue: `speckit-analyze/SKILL.md:116`, `speckit-converge/SKILL.md:118`, `VOICE.md:114`, `tests/e2e/blog.spec.ts:430`) |
| Secondary (acceptance 2) | 12 | 0 |

The round 1 verdict is cleared. The branch is ready for the verify gate.
