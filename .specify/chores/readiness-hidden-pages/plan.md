# Chore plan: readiness-hidden-pages (cutover plan stage 1a)

Branch: `chore/readiness-hidden-pages`, from `main` at 6c01102 (after #123 merged).
No GitHub issue. Source: `docs/cutover-plan.md` stage 1, box 1a, and its "Decisions" section.

## Goal

Setup item 25 (`launch-content-ready`) blocks step L2 of the launch walkthrough today. It does
so only because the expected page `work-with-me` has `visible: false` and `draft: true`. Don has
decided that Work with me stays hidden through the domain switch (cutover plan "Decisions";
issue #122 publishes it later). The readiness check therefore needs to accept a page that is
deliberately hidden. This chore adds a hidden-page rule to the check: an expected page with
`visible: false` counts as deliberately hidden, not unfinished, even though it is also a draft.
A page that is a draft but not hidden still fails. The chore drops `work-with-me` from
`launch.expectedPages` (and `/work-with-me/` from `launch.expectedPaths`; see W3). It brings the
L2 step in `docs/launch.md` and the item 25 wording in `docs/setup.md` and `items.ts` up to date,
and ticks box 1a in the cutover plan. The site's output is unchanged: no page, route, sitemap or
build changes. Only a setup-check script, its config, its tests and docs change.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Unit tests seen failing first.** The new hidden-page cases in
   `tests/unit/setup-check/checks/launch-content-ready.test.ts` (W1) fail before W2 and pass
   after. The implement summary records the red run.
2. **A plain draft still fails.** The existing "is missing for a draft expected page" case
   (`draft: true`, no `visible`) passes unchanged. A new case with `visible: true` and
   `draft: true` is also `missing` with `about: page is still a draft`.
3. **The real check is complete.** `node scripts/setup-check/cli.ts --item launch-content-ready`
   (which `pnpm setup:check --item launch-content-ready` runs) reports `complete` in the worktree
   after W2 and W3. The same holds on `main` after merge.
4. **Each half works alone.** With W2 in place and the W3 config change temporarily reverted
   (scratch, not committed), the real check is still `complete`, through the hidden rule. The
   implement summary records this run.
5. **Existing guards stay green.** `tests/unit/setup/launch-doc.test.ts` (L2 still contains
   `pnpm setup:check --item launch-content-ready`), `tests/unit/setup/docs-structure.test.ts`,
   `tests/unit/setup/items.test.ts`, `tests/unit/setup/schemas.test.ts` and
   `tests/build/indexing.test.ts` ("names a file in src/content/pages/ for every expected page
   id") pass with no edits.
6. **Scope of the diff:** `git diff --name-only main` lists only
   `scripts/setup-check/checks/launch-content-ready.ts`, `scripts/setup-check/items.ts`,
   `setup/config.json`, `tests/unit/setup-check/checks/launch-content-ready.test.ts`,
   `docs/launch.md`, `docs/setup.md`, `docs/cutover-plan.md` and
   `.specify/chores/readiness-hidden-pages/**`. Nothing under `src/`, `public/`, `.github/` or
   `.claude/`.
7. **Cutover plan:** the only change in `docs/cutover-plan.md` is box 1a going from `- [ ]` to
   `- [x]` (`git diff main -- docs/cutover-plan.md` shows one changed line).
8. `pnpm run verify:quick` is green, then the full gate before the PR.

**Before measurement** (2026-10-09, at 6c01102,
`node scripts/setup-check/cli.ts --item launch-content-ready`):

```
[!] missing  Step 25 of 31  Launch content ready
    1 launch content problem(s).
    work-with-me: page is still a draft
0 of 1 complete · 1 missing
```

`src/content/pages/work-with-me.mdx` front matter has `visible: false` and `draft: true`.
`setup/config.json` `launch.expectedPages` has 7 ids, including `work-with-me`, and
`launch.expectedPaths` has 9 paths, including `/work-with-me/`.

**After (target):** `[ok] complete  Step 25 of 31  Launch content ready`; `expectedPages` 6 ids,
`expectedPaths` 8 paths.

## Scope

**In:**

- `scripts/setup-check/checks/launch-content-ready.ts`: an `isHidden` helper
  (`/^visible:\s*false\s*$/m` on the front matter, matching the `isDraft` style). An expected
  page that is hidden is accepted. The placeholder-copy scan also skips hidden pages, because a
  hidden page never reaches production. The head comment and the complete-summary wording
  change to match.
- `scripts/setup-check/items.ts`: item 25 `where` and `confirmedBy` wording.
- `setup/config.json`: drop `work-with-me` from `expectedPages` and `/work-with-me/` from
  `expectedPaths`.
- `tests/unit/setup-check/checks/launch-content-ready.test.ts`: new cases.
- `docs/launch.md` L2, `docs/setup.md` item 25, `docs/cutover-plan.md` box 1a.

**Out:**

- Publishing Work with me (issue #122), or any content change under `src/content/`.
- The rest of `docs/cutover-plan.md`, including the L2 line in stage 2 and the "*new*" config
  item near line 164.
- `scripts/setup-check/schemas.ts` and `types.ts` (no shape change).
- `.claude/skills/setup-walkthrough/SKILL.md` (it refers to L2 and the item generically).
- The check's `.mdx`-only file listing and regex front matter parsing. Both are kept as they are.

**Follow-ups for the PR body:**

- When issue #122 publishes Work with me, add `work-with-me` back to `launch.expectedPages` and
  `/work-with-me/` back to `launch.expectedPaths`. Otherwise neither check requires the page to
  be live. Suggest a line in #122.
- Stage 1b (Ghost 301s, `/tweak`) is the other stage-1 pull request. Both must merge before
  Part A of the walkthrough.

## Constitution Check

- **I. Test-First:** W1 adds the hidden-page cases and runs them red before W2 changes the check.
- **II. Automated Release Gate:** no check is skipped or weakened in CI. The setup check is not
  part of the gate. Within it, a plain draft expected page still fails (acceptance 2), and every
  other rule (missing file, placeholder copy in a published page, placeholder project visual,
  privacy policy) is unchanged.
- **III. Human Review for Major Changes:** no criterion fires. There is no dependency, contact
  data, design system, layout, navigation, cost or constitution change. `setup/config.json`
  holds setup-check expectations, not CI, deployment or infrastructure configuration: no
  workflow, Wrangler config or ruleset changes. Verdict: **not major**; auto-merge applies.
- **IV. First-Party Before Custom:** no tool usage changes. The check already reads front matter
  with regexes through `RepoReader`, and the new rule follows that pattern. No Astro or
  Cloudflare API is touched.
- **V. Static by Default:** unchanged; nothing ships.
- **VI. Content as Files:** unchanged; the check reads the same content files.
- **VII. Private Data:** unchanged. The privacy-policy rule (Cloudflare D1, no retired service)
  is untouched.
- **VIII. Cloudflare Best Practices:** unchanged.
- **IX. Cost Ceiling:** unchanged.
- **X. Accessible, Fast and Private:** unchanged.
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/readiness-hidden-pages/` per
  `/chore`. The stage 1b `/tweak` touches `public/_redirects` and possibly
  `tests/e2e/not-found.spec.ts`, so it shares no file with this chore.

## Work items

### W1: Hidden-page cases for the check (test first)

- [ ] W1 done
- **Files:** `tests/unit/setup-check/checks/launch-content-ready.test.ts`.
- **Test:** new-first. **Layer: unit**, the cheapest layer that can observe the rule. The check is
  a pure function of the files that the fake `RepoReader` serves. Use inline fixture slugs
  (`about`, `extra`) as the file already does. Name no real page, because the content-derived
  literal guard forbids it.
- **Cases:**
  1. Complete when an expected page has `visible: false` and `draft: true` (the hidden-and-draft
     shape of a real hidden page).
  2. Complete when an expected page has `visible: false` and `draft: false`.
  3. Missing with `about: page is still a draft` when an expected page has `visible: true` and
     `draft: true`. This case passes before W2 too. It pins the "draft but not hidden still
     fails" half.
  4. Complete when a non-expected page with `visible: false` (and no `draft`) says "placeholder
     copy" (the placeholder scan skips hidden pages).
  5. The expected page that is missing its file is still reported when another expected page
     is hidden (hidden does not mask other problems). Optional if case 1 plus the existing
     missing-file case already cover it; the implementer decides.
- Cases 1, 2 and 4 must be seen failing before W2.

### W2: Accept hidden pages in the check

- [ ] W2 done
- **Files:** `scripts/setup-check/checks/launch-content-ready.ts`.
- **Test:** existing: W1 turns green, and every existing case in the file passes unchanged.
- **Shape:**
  - `function isHidden(text)`: `/^visible:\s*false\s*$/m.test(frontmatter(text))`.
  - Expected-page loop: missing file → problem; else if `isHidden` → accepted (no problem);
    else if `isDraft` → `page is still a draft`.
  - Placeholder scan over pages: `continue` when `isDraft(text) || isHidden(text)`.
  - Head comment: "every expected page exists and is published or deliberately hidden
    (`visible: false`)". Complete summary: "Every expected page is published or deliberately
    hidden, …". `NEXT_ACTION` is unchanged; a test pins it, and it still describes the fix for a
    plain draft.
- Projects have no `visible` field. Leave the project scan unchanged.

### W3: Drop Work with me from the launch config

- [ ] W3 done
- **Files:** `setup/config.json`.
- **Test:** existing: `tests/build/indexing.test.ts` ("names a file in src/content/pages/ for
  every expected page id"; "lists every launch.expectedPaths entry in the production sitemap",
  main only) and `tests/unit/setup/schemas.test.ts` (fixtures, not the real file). Unit over
  config: the acceptance 3 run of the real check is the observation. Add no test that restates
  the list ("Invariants, not mirrors").
- **Change:** remove `"work-with-me"` from `launch.expectedPages`, and remove `"/work-with-me/"`
  from `launch.expectedPaths`.
- **Judgment call on `expectedPaths`:** the only reader that checks the real list against a live
  site is setup item 29 (`live-sitemap`). After the switch it requires every `expectedPaths`
  entry in the production sitemap, and it does not filter hidden or draft pages. A hidden page is
  left out of the production build (`src/lib/pages.ts` `getPages`) and so out of the sitemap.
  Keeping `/work-with-me/` would make item 29 fail on switch day, against Don's decision that the
  page stays hidden. The build test already skips draft addresses, so either choice passes it.
  Removing the path weakens no check: it brings the expectation in line with the decided state,
  and the follow-up restores it when #122 publishes the page. The other readers
  (`tests/build/indexing.test.ts`, `live-helpers.ts` fixtures) are unaffected.
- Run acceptance 4 (scratch revert of this file only) and acceptance 3 here.

### W4: Update the item 25 wording in `items.ts` and `docs/setup.md`

- [ ] W4 done
- **Files:** `scripts/setup-check/items.ts` (item 25 `where` and `confirmedBy`),
  `docs/setup.md` (section `## 25. Launch content ready {#launch-content-ready}`, "Where to do
  it" and "How it will be confirmed").
- **Test:** existing: `tests/unit/setup/items.test.ts` and `tests/unit/setup/docs-structure.test.ts`
  (ids, order, anchors) stay green. Documentation wording otherwise: no behaviour: n/a
  (description strings and docs).
- **Wording:** "exists and is not a draft" becomes "exists and is published, or is deliberately
  hidden with `visible: false`". In `docs/setup.md`, "remove `draft: true` from each page listed
  …" gains "(a page kept hidden with `visible: false` is accepted as it is)". Keep the anchor,
  the heading, the `pnpm setup:check --item launch-content-ready` literal and the Principle VII
  line.

### W5: Bring L2 in `docs/launch.md` up to date, and tick 1a

- [ ] W5 done
- **Files:** `docs/launch.md` (section `### L2. … {#l2}`), `docs/cutover-plan.md` (line 38 only).
- **Test:** existing: `tests/unit/setup/launch-doc.test.ts` (L2 present among the step ids; L2
  contains `pnpm setup:check --item launch-content-ready`). Otherwise no behaviour: n/a
  (documentation).
- **L2 "What to do":** remove the "Work with me placeholder copy" and "Focus Pocus placeholders"
  wording. Focus Pocus is retired and has no placeholders, and Work with me stays hidden. The
  text says: publish each page in `launch.expectedPages` (`draft: false`) with no placeholder
  copy; a page kept hidden with `visible: false` (Work with me, until issue #122) is accepted as
  it is; no published project visual is still marked placeholder; and the privacy policy says
  contact messages are stored in Cloudflare D1 and names no retired service. When the check
  already reports complete, no pull request is needed. The current L2 text names neither
  Services nor Speaking, so there is nothing to remove for them. Keep the heading text and
  anchor, the **Pause:** line, "Where", and the confirm line with the literal command. The
  readiness table row "Pages published, privacy policy correct" may stay as is.
- **Cutover plan:** change `- [ ] **1a.` to `- [x] **1a.`. Leave every other line unchanged,
  including the stage 2 L2 line.

## Docs citations

None. No tool usage changes (Principle IV). The change is to repository code that reads front
matter with regexes, and to docs.

## Risks

- **Hidden rule too broad.** A page could be set `visible: false` to get past the check without
  being finished. That is the intended behaviour under Don's decision: hidden pages never reach
  production. The follow-up (re-add to the lists when #122 publishes) keeps Work with me from
  dropping out of the launch expectations for good.
- **Regex parsing.** `visible: false` inside the body or in a nested key would not match,
  because `frontmatter()` limits the scan to the front matter block and the pattern is anchored
  at line start. A nested indented `visible:` does not match `^visible:`. A YAML variant such as
  `visible: no` or `visible: False` would not be treated as hidden. The schema is
  `z.boolean()`, so the build would reject those anyway.
- **Content-derived literal guard.** The new test cases must not name a real page slug, so use
  `about` and `extra` fixtures only. Run the guard test in `verify:quick`.
- **Doc-alignment tests.** `launch-doc.test.ts` and `docs-structure.test.ts` match literals and
  anchors in L2 and section 25. Keep the anchors, headings and command literal byte-identical.
- **Verify gate environment.** Sibling worktrees share ports 4321/4322. Check `lsof -i :4321`
  before the full gate, and ask Don before running it (orchestrator).
