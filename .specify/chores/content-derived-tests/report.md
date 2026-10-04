# Review report: content-derived-tests (issue #55)

Reviewer: fresh-eyes review phase, read-only on `src/`, `tests/`, `scripts/`, `.github/`, `.claude/`. Range: `main...HEAD` (W1 to W14, commits f226dc1 to 28e83cb). Round 1.

## Verdict

The mechanical acceptance criteria hold:
- the regex count dropped from 88 to 0;
- the guard and the helper exist and pass;
- the diff stays inside `tests/**`, `docs/testing.md` and this chore folder;
- the Principle III verdict of "none" is still right.

The issue's litmus (publishing or rewriting content never needs a test change) is **not yet met** in four places, where a valid content publish turns a test red. Two of them come from the fixture site sorting real posts and fixture posts together. One is a landing check that assumes every post has a feature image. The fourth is a latent bug in the no-JS stand-in check.

## Findings

### CRITICAL (0)

None.

### HIGH (4)

- **H1. `tests/e2e/blog-pagination.spec.ts` L29 and L88: the next few real posts break it.**
  - The module-level guard throws when either total falls outside 13 to 24. Today all posts total 21 and agentic-ai totals 15.
  - Publishing **4 more real posts of any kind** takes all posts to 25, and every case in the file then fails when it loads.
  - The "page past the last" case hard-codes `${first}3/` as a 404. The "pages from 1 to 2" case asserts that page 2 has no Next link. Both assume exactly two pages.
  - Fix:
    - compute `last = Math.ceil(total / blog.pageSize)`;
    - assert page 2's count as `min(pageSize, total - pageSize)`;
    - assert there is no Next link only on page `last`;
    - use `${first}${last + 1}/` as the past-the-last address;
    - keep a `total > pageSize` precondition, which the 13 generated posts guarantee.
  - The old file needed an edit on every publish, so this is an improvement, but it still fails the litmus.

- **H2. `tests/e2e/blog-fixtures.spec.ts` L66, L70, L104 (and L124): the next real post moves fixture posts out of the lists.** The fixture site sorts real and fixture posts together. The fixture posts are dated 2026-06-18 to 2026-08-20 and today is 2026-10-03, so a new post dates after all of them.
  - One new real post of any kind pushes `long-title` (2026-08-20) out of Home's three Recent cards: every-part (2099), the new post, then the sample (2026-08-27). The "very long title wraps … on `/`" check at L104 then fails.
  - One new **unfeatured** real post leads Latest, so the assertion at L70 that `latest.slice(0, 2)` equals `[LONG_TITLE, TEXT_ONLY]` fails.
  - Two new **featured** posts push `fixture-post-01` out of Featured (L66).
  - L124 (the technology-teams list) and the text-only landing card (L77 to L83) fail later, after more posts.
  - Plan W9 kept these as fixed assertions about fixture items and did not foresee real content displacing them.
  - Fix (test-owned, so inside this chore's scope): date `long-title`, `text-only` and `fixture-post-01` in the far future, as `every-part` already is (2099), or assert their place relative to the computed selection. F1 would remove the whole class.

- **H3. `tests/e2e/blog.spec.ts` L272 to L282: every landing card must have an image.**
  - `featureImage` is optional in the post schema (`src/content/schemas/post.ts` L43).
  - The test asserts that no lead or card is `[data-text-only]` (L278), that the image count equals the card count (L282), and that `[data-lead-story] img` has the `fetchpriority` and `loading` attributes.
  - Publishing a real post without a feature image fails it once that post is the lead or is in Featured or Latest. Any new post now leads, because it is newer than the 2026-08-27 sample.
  - The assertion predates this chore, but it is exactly the content-shape assumption the litmus excludes, and this block was rewritten here.
  - Fix: compute the expected text-only and image counts from `featureImage` in `LANDING_SELECTION`, and assert the eager-image attributes only when the lead has an image.

- **H4. `tests/e2e/projects-no-js.spec.ts` L27: a stand-in without a label breaks it.**
  - The test types the field as `standIn: { label: string }` and asserts `getByRole("link", { name: data.standIn.label })`.
  - `label` is optional in the schema (`src/content/schemas/project.ts` L68), and `BuildLinks.astro` falls back to `` `${title} on drc.dev` ``.
  - If the newest project with a Build link (the picked story) has a `standIn` with no `label`, the name is `undefined`. The locator then matches every link and fails with a strict-mode error, so a valid publish turns the test red.
  - `projects.spec.ts` already uses the correct default. Fix: `name: data.standIn.label ?? \`${pickedStory.title} on drc.dev\``.

### LOW (10)

- **L1. `tests/build/indexing.test.ts` L155 and L159: production is decided by a local expression.**
  - W3 said `isProductionBuild(env)` does not exist. It **does**, in `src/lib/build-mode.ts` L29. The site applies the same rule through `includeDrafts`, in `src/lib/posts.ts` L49.
  - The local `env.WORKERS_CI_BRANCH === "main"` gives the same answer for both environments in the file, because both set `WORKERS_CI: "1"`. It also matches the file's existing style at L78 and L96.
  - It does drop the fail-safe rule that a Workers CI build with no branch counts as production, and it computes the same value twice.
  - Recommend `const production = isProductionBuild(env)`, used in both places. This is not a correctness bug today.

- **L2. `tests/unit/content/projects-content.test.ts` L71: the FR-082 search is narrower.**
  - The old search was `/focus[-_ ]?pocus/i` over the whole file, so it caught titles and comments. The new one matches a quoted slug or `/projects/<slug>`.
  - A site file holding `"Focus Pocus"` (a quoted title) or `data-project="x-focus-pocus"` now passes.
  - Plan W2 specified this form to avoid false positives on `flux`, so it is accepted. Also matching the quoted title (`"<title>"`) would restore most of the lost coverage cheaply.

- **L3. `tests/unit/content/no-real-content-in-tests.test.ts` L14 to L21: some literals slip past the guard.**
  - As the plan specifies, the needles are addresses, `<slug>.mdx` file names and quoted titles.
  - A bare quoted slug (`"focus-pocus"`), `project-<slug>` or `?project=<slug>` is not caught, although the acceptance regex catches `focus-pocus` anywhere.
  - So a future `toHaveCSS("view-transition-name", "project-tempo")` would pass the guard.
  - Consider adding `"<slug>"`, `` `<slug>` `` and `-<slug>"` as needles.

- **L4. `tests/helpers/content.ts` L140 and L151: the helper can throw when it is imported.**
  - `pickedStory` and `seriesPost` are computed when the module loads.
  - Every importer therefore fails if no real post is in a series or no project exists. That covers the guard, `projects-content`, `sample-posts`, `indexing` (the content CI tier) and every blog spec.
  - The failure is loud rather than silent, as the plan wanted, but it reaches far more tests than it needs to. Lazy accessors would confine it to the specs that use the picks.

- **L5. `tests/e2e/blog.spec.ts` L19 to L23 (`PLAIN_POST`) and L656 to L660 (`markerTopic`): both throw when the spec loads.**
  - **Ruling: these are content-shape assumptions, not content rules.** No rule requires a post without `updated`, or a non-series topic that a series post shares.
  - Both hold today only through the real posts, because the sample has `updated` and no series.
  - Adding `updated` to every real post, or retagging the posts, would fail the whole spec at load.
  - The risk is low and the failure is loud. A follow-up could move both cases to fixture posts.

- **L6. `tests/e2e/blog.spec.ts` L668 and L674: the Home "Recent writing" listing must show a series marker.**
  - Recent holds the 3 newest posts. Two new posts outside any series, plus the sample, would leave it with no marker, and `markers.count() > 0` fails.
  - The same applies to "a series page", where `seriesIds[0]` must have a post.
  - Topic, series and all-posts pages hit the same problem once they have more than 12 posts, because the checks assume page 1. That also affects the pill click-through at L376.
  - Fix: assert that the marker count equals the number of tagged posts shown, computed from `selectRecent` and the other selections.

- **L7. `tests/e2e/pages.spec.ts` L15: every privacy page must have an old-address redirect.**
  - The redirect loop expects one 301 per `privacy/*` page, but `public/_redirects` holds only the Tempo rule.
  - A new app privacy page that never lived on drc.dev would therefore fail.
  - It is a page, not a post or project, so it falls outside the litmus as written, and the plan specified this loop. Noted only.

- **L8. `tests/build/indexing.test.ts` L161 to L186: the landing page's draft checks moved.**
  - The draft checks moved from `writing/index.html` (the landing) to `writing/all/index.html`. That is correct for "every post is listed", because the landing shows a selection.
  - The landing's own production check (no draft label, no link to the sample) is no longer asserted in the build test. `blog.spec.ts` still checks the landing's selection against `inBuild`.
  - Accepted.

- **L9. `tests/unit/content/sample-posts.test.ts` L131 to L139: the FR-005 rule can pass vacuously.** It passes if no real post is in a series. In practice that cannot happen, because importing the helper throws first (L4). Accepted.

- **L10. W14's content-edit proof covered the unit and build layers only.**
  - The e2e and `sections` runs that Acceptance 3 calls for are unverified until the orchestrator's full `pnpm run verify`.
  - H1 to H3 are the kind of failure that a scratch edit of a `featured` flag or a publish date would have exposed on the e2e side.
  - Recommend extending the scratch proof to `--project=e2e --project=sections` before the PR, or at least running it once after the HIGH fixes.

## Checklist results

1. **Work items against the plan.** W1 to W14 are all present. `git diff --name-only main...HEAD` shows the 23 files in the plan's Scope table, the 3 new files (helper, helper test, guard), `docs/testing.md` and `plan.md`. There is no unplanned file, and every planned file is touched. That includes the W13 leftovers `blog-forced-colors.spec.ts` and `blog.a11y.spec.ts`, which are in the Scope table.

2. **Tests and coverage mappings.** Every named test exists at its named layer: the helper and the guard at unit, indexing at build, the specs at e2e. These mappings check out:
   - the stand-in rule loop in `projects.spec.ts` ("every project story");
   - the draft-notice rule over every project;
   - the per-story SEO loop;
   - the computed sitemap, with the cookie-policy exclusion added to `seo.spec.ts`;
   - the drafts `it.each`, with the sample-post precondition that keeps it from being vacuous;
   - `every-part` as the stand-in story on the fixture site;
   - the fit rule: one fit per constraint, values `yes`, `partly` or `no`, and distinct non-empty labels.

   Three checks were removed as copy, and each **matches the plan's W2 table**:
   - the name of Focus Pocus's chosen option;
   - the `packing-list` picture with no part (now covered by the schema and the `PartPicture` tests);
   - the Focus Pocus `standIn.href` (now covered by the schema and the W5 rule).

3. **Litmus.** Not met. See H1 to H4 and L4 to L6, and the rulings below.

4. **Guard.**
   - It scans `.ts`, `.tsx`, `.mts`, `.js` and `.mjs` files under `tests/e2e`, `tests/build` and `tests/unit/content`. It excludes only itself; the helper sits in `tests/helpers/`, which it does not scan.
   - There is no allowlist, as the plan intended, because W12 renamed the inline examples.
   - The needles come from the content, and its known-bad case is built at runtime.
   - It contains no `.claude/`, `.specify/`, `specs/` or `CLAUDE.md` literal (the grep is empty).
   - It does not overlap `changed-paths.test.ts`, which classifies CI paths and runs its own drift guard over quoted path literals. All 171 `tests/unit/ci` tests pass.

5. **Content tier.** This is a strengthening. The old check was one probe for `"/about/"` in `indexing.test.ts`. Now every listed file except `project-template` must read the helper or name an entry, and any unlisted build test that imports the helper fails. `package.json` is unchanged, and `test:build:content` still lists the same three files.

6. **Docs.** `docs/testing.md` has the "Real content in tests" subsection directly after "Where a test goes", with all five bullets from the plan. `vitest --project unit tests/unit/setup` passes 55 files and 727 tests.

7. **Alignment rule.** Nothing under `.claude/` is in the diff, so the rule does not apply.

8. **Principle III.** Still "none". The diff has no `package.json` change and nothing under `.github/` or `src/`. `wrangler.jsonc`, `playwright.config.ts`, `vitest.config.ts`, `CLAUDE.md` and the snapshot PNGs are all unchanged.

9. **Weakening audit.** No check was removed without a mapping. Five checks became narrower or can pass vacuously:
   - FR-082 (L2);
   - the redirect loop, vacuous with no privacy pages (L7);
   - the stand-in loop, vacuous with no stand-ins but backed by the fixture `every-part`;
   - the FR-005 rule (L9);
   - the conditional "no pagination" check, which the plan specified.

   Each was either accepted in the plan or is protected by a precondition that cannot be vacuous. In `projects-content`, the draft-flag test now compares `frontmatter.draft` with `entry.draft`, which is the same value read twice. Its real guarantee, a review comment if and only if the story is a draft, is intact.

## Rulings on the implement subagents' concerns

| Concern | Ruling |
|---|---|
| `blog-pagination.spec.ts` throws unless there are exactly two pages | **HIGH (H1).** Four more real posts break it. |
| `projects-fixtures.spec.ts` throws if the Tooling count drops below 2 | **Fine.** Two test-owned fixtures (`draft.mdx`, `minimal.mdx`) carry Tooling, and real content can only add to the count. The guard protects the plural wording and does not depend on the content. |
| `blog.spec.ts` `PLAIN_POST` and the markers topic throw | **Content-shape assumptions, not content rules (L5).** They are loud and unlikely; move them to fixture posts in a follow-up. |
| `pickedStory` (the newest project with a Build link) now carries a11y and budget, on drcdev-github-io | **The pick changes silently when a newer project with a Build link is published, and that is acceptable.** The template, a11y, budget and forced-colours checks then run on the new story, and a failure there is a real finding on real content (Principle X), not a test bug. The one real bug the pick exposes is H4. Coverage is still one story, as before; running a11y and budget over every story is in follow-ups F2 and F4. |
| W2 dropped the packing-list and chosen-option-name checks as copy | **Confirmed.** This matches the plan's W2 mapping table exactly. |
| W3 used a local `production` because `isProductionBuild` "does not exist" | **The premise is wrong**: `src/lib/build-mode.ts` L29 exports it. The local expression matches the site's rule for both tested environments, so this is LOW (L1). |
| The W13 leftovers (`blog-forced-colors`, `blog.a11y`) were not run | **They type-check.** `astro check` reports 0 errors across 407 files, and the helper exports `seriesPost` (L151), which has its own unit test. They still need the e2e and a11y runs in verify. |
| W14's proof covered unit and build only | **Noted (L10).** The e2e side is unverified until the full verify, and H1 to H3 are the kind of failure it would have shown. |

## Measurement

**Acceptance 1 regex.** This is the plan's literal pattern, run with `grep -cE` over the 23 files in the Scope table. The plan's "22" appears to leave out `content-tier`, which had no matches.

| | Matching lines | Files with matches |
|---|---|---|
| Before (`git grep` on `main`) | 88 | 21; `blog-pagination` and `content-tier` had 0. This reproduces the plan's figure. |
| After (HEAD) | 0 | none of the 23. The helper, its test and the guard also have 0. |

**Other runs:**

| Run | Result |
|---|---|
| Guard and helper (`no-real-content-in-tests.test.ts`, `content-helper.test.ts`) | 2 files, 83 tests, all pass. The guard has one `it.each` case per scanned file. |
| 8 targeted unit files (guard, helper, projects-content, sample-posts, content-tier, project-address, contact-link, project-schema) | 219 tests, all pass |
| `tests/unit/setup` | 55 files, 727 tests, all pass |
| `tests/unit/ci` | 171 tests, all pass |
| `astro check` | 0 errors, 0 warnings, 4 hints |
| plain `tsc -p .` | only the pre-existing `.astro` module-resolution errors; none in the changed files |

## Follow-ups for the PR body

- **Fix before merge (recommended):** H1 to H4. Each is test-only and inside this chore's scope (fixture dates and test files).
- **F1** (from the plan): build the fixture site from fixture content only. That removes the H1 and H2 class for good.
- **F2** (from the plan): move the story-template checks to the fixture `every-part` story.
- **F3** (from the plan): switch `post-schema.test.ts` and the other `parseFrontmatter` callers to the helper.
- **F4** (new):
  - move the `PLAIN_POST`, marker-topic and Home-marker cases to fixture posts (L5, L6);
  - make the helper's picks lazy (L4);
  - use `isProductionBuild` in `indexing.test.ts` (L1);
  - widen the guard's needles to bare quoted slugs (L3).
- **Verify:** the full `pnpm run verify` will be the first e2e, `sections`, a11y and budget run over W9 to W13 together. Extend the W14 scratch proof to the e2e side once H1 to H4 are fixed.

## Round 2

Reviewer: fresh-eyes review phase, read-only. Range: `53be9dd...HEAD` (commit f92b86d, the round-1 fixes), with `main...HEAD` read for context.

### Verdict

H1, H3, H4 and L1 are closed exactly as prescribed, and nothing outside the fix list changed. H2 is **not** closed:
- its fix changes the pixels of a committed visual baseline, the `listing-cards` snapshots;
- it edits a file the plan's Acceptance 7 puts out of scope (`scripts/`).

Both problems go away if the fixture dates are reverted and `blog-fixtures.spec.ts` alone carries the fix (C1 below).

### CRITICAL (1)

- **C1. `scripts/build-fixture-site.ts` L33 to L45 and L171 to L179 (`FIXTURE_POST_DATES`): the visual `listing-cards` baselines now fail.**
  - The `listing-cards` subject in `tests/e2e/visual.spec.ts` (L160 to L168) takes an element shot of `ul[data-topic-grid]` on `/writing/topics/fixture-cards/`. It shows three cards: every-part, long-title and text-only.
  - `src/components/post/PostCard.astro` renders `<time>{formatDate(post.date)}</time>` on every card. Re-dating long-title from 2026-08-20 to 2098-12-31, and text-only from 2026-08-10 to 2098-12-30, changes that text. The card order does not change.
  - **Measured:** `run.sh 480 pnpm playwright test --project visual` gave 46 passed and 4 failed. The failures are `fixture listing cards` at phone and desktop, dark and light: 890 px differ, a ratio of 0.01 against the 0.001 limit. The diff image shows that only the two date lines differ.
  - These subjects pass: lead-story (every-part is still the lead), post-template, story-template, series-banner, the project rows, contact-form, sections, and the header, footer, menu and not-found shots.
  - Landing this as it stands needs a baseline refresh. That breaks triage condition 1, Acceptance 7 ("No snapshot PNG changes") and the CLAUDE.md rule that a visual diff nobody predicted is a regression to fix.
  - The `fixture-post-01` re-date (`FEATURED_FIXTURE_DATE`, 2098-12-29) changes no snapshot, because no visual subject shows an agentic-ai listing or the Featured grid. It is still in `scripts/`, though (see H5).
  - **Fix, test-only.** Revert `scripts/build-fixture-site.ts` to `main`, which removes `FIXTURE_POST_DATES`, `FEATURED_FIXTURE_DATE` and the `readFileSync` path. Drop the date override at L42 to L46 of `tests/e2e/blog-fixtures.spec.ts`. Then make that spec's fixture assertions relative to the computed selection, or move them to the fixture-only topic page:
    - **L73** `expect(featured).toContain("/writing/fixture-post-01/")`: remove it. L72 already asserts that Featured equals `LANDING_POSTS.featured`, and L74 checks the Featured marks. Otherwise, assert it only when `LANDING_POSTS.featured` includes it.
    - **L77** `latest.slice(0, 2) == [LONG_TITLE, TEXT_ONLY]`: remove it, because L76 already computes Latest.
    - **L84 to L90**, the text-only card: assert it on `/writing/topics/fixture-cards/`. Only the three fixture posts carry that topic (`sample-posts.test.ts` L184 enforces this), so the card is always on its single page. Also check the landing, but only when the computed landing selection includes `TEXT_ONLY`.
    - **L107 to L121**, the long-title wrap:
      - always check `/writing/topics/fixture-cards/` (h2) and `LONG_TITLE` (h1);
      - check `/` only when `selectRecent(SITE_POSTS)` includes it;
      - check `LANDING` only when the landing selection includes it;
      - check `/writing/all/` and `/writing/topics/technology-teams/` only when its index is below `blog.pageSize`.
    - **L124 to L132:** compare page 1 with `hrefsWithTopic("technology-teams").slice(0, blog.pageSize)`, and move the `arrayContaining([LONG_TITLE, TEXT_ONLY])` check to the fixture-cards topic page.
  - This keeps every fixture behaviour check (no-image card, long-title wrap, Featured and Latest mechanics). Real content can no longer make it fail, and the snapshots are not touched. F1, which builds the fixture site from fixture content only, remains the structural fix.

### HIGH (1)

- **H5. `scripts/build-fixture-site.ts`: the diff leaves the chore's agreed scope.**
  - Plan Acceptance 7 reads: "`git diff --name-only main` lists only `tests/**`, `docs/testing.md` and `.specify/chores/content-derived-tests/**`. There is nothing under `src/`, `public/`, `scripts/`…".
  - The plan's follow-up F1 names `scripts/build-fixture-site.ts` together with "the visual baselines and the budget" as a separate chore. C1 shows why.
  - Round 1's "inside this chore's scope (fixture dates …)" was wrong: the fixture files' dates are read by `tests/build/local-site.test.ts` L405 to L406, so only the script could carry them.
  - No unit test constrains the script's dates. `tests/unit/site/fixture-posts.test.ts` checks distinct dates and still passes, and `config-mdx.test.ts` checks only the `build:fixtures` script name. The scope breach stands on its own.
  - Fix: the same revert as C1.

### LOW (2)

- **L11. `tests/e2e/blog-fixtures.spec.ts` L8 to L12, the header comment: the dates are stale.**
  - It now says "fixture-post-01 to -13, dated 2026-06-29 back to 2026-06-18". The generator still dates fixture-post-02 to -13 as 2026-06-29 back to 2026-06-18. On `main`, fixture-post-01 was 2026-06-30, which the comment should say again once the revert lands.
  - The note about far-future dates should be removed with the revert.
- **L12. `tests/e2e/blog-fixtures.spec.ts` L64 to L66: the comment says the lead is every-part "(2099)"**, which is true. Once C1 is fixed, the comment above the landing test should also say that the fixture posts' places in Featured and Latest are asserted only through the computed selection. Wording only.

### Round-1 items re-checked

| Item | Status |
|---|---|
| H1 `blog-pagination.spec.ts` | **Closed.** The guard is now `total > pageSize`, and `last = Math.ceil(total / pageSize)`. Page 2 holds `min(pageSize, total - pageSize)` posts. Next is absent only when `last === 2`, and the 404 case uses `${first}${last + 1}/`. |
| H2 fixture posts displaced | **Not closed** (C1, H5). With the new dates no real post can displace them, but the fix changes a baseline and edits `scripts/`. |
| H3 landing images | **Closed.** `BUILT_ENTRY` uses the same `inBuild(posts, { production: false })` as `BUILT_POSTS`. The lead-image attributes are asserted only when the lead has an image, otherwise `[data-lead-story][data-text-only]` is expected. The text-only and image counts come from `featureImage`. |
| H4 stand-in label | **Closed.** `label?: string`, with the default `` `${pickedStory.title} on drc.dev` ``, which matches `BuildLinks.astro`. |
| L1 `isProductionBuild` | **Closed.** It is imported from `src/lib/build-mode.ts`, computed once per environment and used for both the sitemap and the drafts checks. |

### Dependence on the old fixture dates and order

- `tests/e2e/a11y.spec.ts` and `tests/e2e/blog-fixture.a11y.spec.ts` do not depend on them.
- `tests/build/fixture-site.test.ts` and `tests/build/drafts.test.ts` do not depend on them either.
- `tests/build/blog-listing.test.ts` builds its own posts, and its "2026-06-29" belongs to its own post 01.
- `tests/build/local-site.test.ts` L405 reads the fixture files' 2026-08-10 date, which is why the files themselves cannot be re-dated.

### Scope and Principle III

- `git diff --stat main...HEAD -- src package.json` is empty.
- Outside `tests/**`, `docs/testing.md` and the chore folder, the diff touches only `scripts/build-fixture-site.ts` (H5).
- The Principle III verdict is still "none" once C1 and H5 are reverted.

### Measurement

| Run | Result |
|---|---|
| Acceptance 1 regex over the 23 Scope files, the helper, its test, the guard and `scripts/build-fixture-site.ts` | **0** matching lines in 27 files |
| Guard, helper, `fixture-posts`, `sample-posts`, `config-mdx` (vitest `--project unit`) | 5 files, 118 tests, all pass |
| `pnpm playwright test --project visual` (macOS) | **46 passed, 4 failed** (`fixture listing cards`, phone and desktop × dark and light; 890 px, ratio 0.01) |

### Follow-ups for the fix round

1. Revert `scripts/build-fixture-site.ts` to `main` and drop the date override in `blog-fixtures.spec.ts` (C1, H5).
2. Rewrite the five fixture assertions in `blog-fixtures.spec.ts` as described in C1.
3. Re-run `--project visual` (expect 50 passed), plus `--project sections` for `blog-fixtures` and `blog-pagination`.
4. Fix the header comment (L11).

## Round 2 confirmation

Final read-only pass over the round-2 fix commit (ec23472). 0 CRITICAL, 0 HIGH, 0 LOW new.

- **C1: Closed.** `scripts/build-fixture-site.ts` is byte-identical to `main`, and the spec no longer overrides fixture dates.
  - The fixed `toContain("/writing/fixture-post-01/")` and `latest.slice(0, 2)` checks are gone.
  - The text-only card is checked on every run on the fixture-cards page (no `img`, plus `data-text-only`). On the landing it is checked only when the computed landing grid includes it, and otherwise its count is asserted to be 0.
  - The long-title wrap is checked on every run on the fixture-cards page (h2) and on the post page (h1), and on `/`, the landing, `/writing/all/` and technology-teams only when the computed Recent, landing grid or page-1 slice includes it. A missing post makes the check fail rather than skip.
  - Featured and Latest are each compared with the computed landing selection, and the number of Featured marks equals `featured.length` (never 0: fixture-post-01 is always featured and is not the lead).
  - Technology-teams page 1 is compared with the computed `.slice(0, blog.pageSize)`; the fixture-cards page is compared with `hrefsWithTopic("fixture-cards")` and includes `LONG_TITLE` and `TEXT_ONLY`.
  - `main` guarantees that moved rather than disappeared: the "exactly one text-only card on the landing" check (now href-based plus fixture-cards); the pinned Featured, Latest and home sequences (now computed selections); the Starting and Focus Pocus absence checks (now the "not shown" loop); "text-only among the technology-teams posts" (now on fixture-cards).
- **H5: Closed.** `git diff main...HEAD -- scripts/` is empty; the diff stays inside Acceptance 7's scope.
- **L11: Closed.** The header comment says fixture-post-01 is dated 2026-06-30 and posts 02 to 13 run 2026-06-29 back to 2026-06-18, matching the generator on `main`. The far-future note is gone.
- **L12: Closed.** The landing-test comment keeps "every-part is the lead (2099)" and adds that the fixture posts' places in Featured and Latest are asserted only through the computed selection.
- Guard `tests/unit/content/no-real-content-in-tests.test.ts`: 69 passed.
