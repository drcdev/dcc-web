# Chore plan: visual-refocus-phase-2 (issue #40, phase 2)

Branch: `chore/visual-refocus-phase-2`, at `main`'s code (commit f71ed20, after #41 merged).
Issue: https://github.com/drcdev/dcc-web/issues/40. This run delivers phase 2 of the issue's
Plan (V3 and V5, with V6 confirmed), so the PR body says `Part of #40` (phase 2).

## Goal

Phase 1 of [#40](https://github.com/drcdev/dcc-web/issues/40) removed the ten real-content
snapshot subjects, so the `visual` project now covers only the shell, the not-found page and the
sections fixture. Phase 2 does two things.

**V3** adds pixel baselines for the post and project-story templates on the fixture site
(port 4322). The content there is frozen, so only a template or design change moves the pixels.
Don widened V3 today over the phase-1 gap list in `docs/testing.md` "Visual coverage". The
fixture site's listing cards and lead story, a series banner, the projects index rows and the
contact form get snapshots too. The home intro card stays review-only, because it is site copy,
not a template.

**V5** adds computed-style checks on fixture pages in both themes. Key components (header,
footer, pills, buttons, code block, table, quote, links and focus rings) must resolve to the
theme's tokens, and the `dark` class must flip each one. axe keeps the contrast coverage.

**V6** keeps the per-platform baseline flow. The shared sentence S1 ("the shell ..., the
not-found page and the fixture site") stays true, so CLAUDE.md and the four pipeline skills
need no edit.

No page, component, style or script of the site changes. The only non-test file that changes is
`scripts/build-fixture-site.ts`, the test harness that builds the fixture site.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Only shell, not-found and fixture targets.** `grep -nE 'open\(page, "' tests/e2e/visual.spec.ts`
   shows only `/`, `/nope/` and `http://localhost:4322/...` paths. Every new subject is an
   element locator on fixture content. A PR that only touches `src/content/**` cannot change a
   snapshotted subject (issue acceptance 1).
2. **Content-edit proof** (W5, scratch, never committed):
   - Add a word to the `summary` of the real draft post `src/content/posts/sample-everything.mdx`,
     and to the `problem` of one real project in `src/content/projects/`.
   - Rebuild the fixture site and run `--project=visual`. All 50 tests pass.
   - Revert both edits. `git status --porcelain src/` is empty afterwards.
3. **Test counts:**
   - `--project=visual --list` reports **50** tests (was 18). Each test makes one image.
   - `--project=e2e --list` reports **625 tests in 19 files** (was 619 in 18).
   - `--project=sections --list` stays **55 tests in 4 files**.
   - `playwright test --list` reports **1429 tests in 28 files** (was 1391 in 27).
4. **Snapshot files:**
   - `tests/e2e/visual.spec.ts-snapshots/` holds **100** PNGs: 50 `*-darwin.png` and 50
     `*-linux.png` (was 36).
   - The 64 new files are 8 subjects × 2 widths × 2 themes × 2 platforms: `post-template`,
     `story-template`, `lead-story`, `listing-cards`, `series-banner`, `project-row-minimal`,
     `project-row-every-setting` and `contact-form`.
   - `git diff --name-status main -- tests/e2e/visual.spec.ts-snapshots/` shows only `A` lines.
     No existing baseline changes.
5. **Theme tokens:** `tests/e2e/theme-tokens.spec.ts` passes (6 tests). The implement summary
   records that it was seen to fail.
6. **Existing tests stay green:**
   - the `sections` project;
   - the fixture-site budget case;
   - `tests/unit/**`, including `pipeline-visual-baselines`, `pipeline-test-placement`,
     `config-mdx`, `config-files`, `fixture-posts`, `sample-posts` and `tests/unit/ci/*`.
7. **`docs/testing.md`:**
   - The Visual row names the new fixture subjects.
   - Each gap clause in the "Visual coverage" table says where its snapshot now lives, or that it
     is review-only by decision (the home intro card).
   - The closing paragraph is rewritten.
   - A dated "Measured gate times" entry for phase 2 has the before figures and
     `pending (#40 phase 2 PR run)` after cells.
   - The "Where a test goes" bullets are byte-identical.
8. **Scope of the diff:** `git diff --name-only main` lists nothing under `src/`, `.github/`,
   `.claude/` or `public/`, and not `playwright.config.ts`, `package.json` or `CLAUDE.md`.
   This confirms V6 needs no wording change. Only `tests/**`, `scripts/build-fixture-site.ts`,
   `docs/testing.md` and `.specify/chores/visual-refocus-phase-2/**` change.

**Before measurement** (CI run 37141574364, the push of f71ed20 (#41) to `main`, full tier,
success):

| What | Before |
|---|---|
| `e2e` job | 305 s (17:43:54Z to 17:48:59Z) |
| `test:e2e:parallel` step ("Run the end-to-end, accessibility, visual and sections projects") | 208 s (17:44:33Z to 17:48:01Z) |
| Budget step | 56 s |
| Visual tests, local `--project=visual --list` | 18 |
| E2E tests, local `--project=e2e --list` | 619 in 18 files |
| All Playwright tests, local `--list` | 1391 in 27 files |
| Visual PNGs | 36 |

The before figures come from a `main` push, which has no preview site-check. The after figures
will come from this PR's first CI run, which does have one. So the comparable number is the
`test:e2e:parallel` step. Phase 1's recorded "after" (353 s and 241 s) was also a PR run, so it
is not this phase's before.

## Scope

**In:**

- `tests/fixtures/posts/valid/every-part.mdx` (new): the fixture post that is the post-template
  subject and the lead story.
- `tests/fixtures/posts/valid/text-only.mdx` and `long-title.mdx`: add the free-form topic
  `fixture-cards` as each one's last topic.
- `tests/fixtures/pages/contact-form.mdx` (new): a fixture page holding `<ContactForm />`.
- `scripts/build-fixture-site.ts`: add `every-part.mdx` to `FIXTURE_POSTS`, and a new exported
  `FIXTURE_PAGES` list that copies the contact-form page as well as `sections.mdx`.
- `tests/unit/content/sample-posts.test.ts` and `tests/unit/site/fixture-posts.test.ts`: new
  unit cases that guard the fixtures' shape.
- `tests/e2e/blog-fixtures.spec.ts`: lead, Featured and home Recent writing expectations, and
  the head comment. Comment-only updates in `blog-pagination.spec.ts` and `budget.spec.ts`.
- `tests/e2e/theme-tokens.spec.ts` (new): V5, in the existing `e2e` project.
- `tests/e2e/visual.spec.ts`: eight new subjects and the head comment.
- `tests/e2e/visual.spec.ts-snapshots/`: 32 new `-darwin` PNGs (W5) and 32 new `-linux` PNGs
  (orchestrator, W7).
- `docs/testing.md`: the Layers rows (E2E and Visual), "Visual coverage", and "Measured gate
  times".
- This plan, and the review report later.

**Out:**

- Any change under `src/`, including the CTA button's lack of a dark variant (see W3), and the
  footer's build-time year (see Risks). Both are site behaviour.
- `playwright.config.ts`, `package.json`, `.github/workflows/*` and
  `scripts/visual-baselines-linux.sh`. V5 lives in the `e2e` project and V3 in `visual.spec.ts`
  precisely so that no project list changes. `config-mdx.test.ts` and `config-files.test.ts`
  stay as they are.
- CLAUDE.md and the four pipeline `SKILL.md` files (V6: S1 to S3 stay true).
- A shared Playwright theme helper. Five specs copy the same `addInitScript` snippet today, and
  `theme-tokens.spec.ts` makes six. Folding them together is a refactor outside V3/V5.
- Phase 3 of #40 (recording the times on the issue).

**Follow-ups for the PR body:**

1. #40 phase 3: record the before and after `e2e` times on the issue.
2. **Footer year.** `SiteFooter.astro` renders `new Date().getFullYear()` at build time.
   - Affected baselines: `footer-*` and the full-page `not-found-*` and `sections-*` shots.
   - Every one of them fails on the first build in 2027 until it is refreshed.
   - A fixed build year for the fixture and test builds, or a `mask` on the year, would fix it.
     It needs its own change.
   - The new element shots in this phase leave the footer out.
3. **Shared theme helper.** One shared theme-setting helper for the six Playwright specs that set
   `color-theme` (refactor).
4. **CTA button in both themes.** The CTA button (`CallToAction.astro`) is `bg-rust-600
   text-white` in both themes. V5 records that as the design (same token in both themes). If it
   should have a dark variant, that is a design change (Principle III).
5. **Index draft mark.** The projects index draft mark (`[data-draft-mark]`) and the in-progress
   status on an index row have no row snapshot. The in-progress pill is in the story-template
   shot. The draft mark exists only outside production.

## Constitution Check

- **I. Test-First:** every item writes or changes its test before the code it covers:
  - W1 and W2 write their unit guards first and update the fixture-site e2e expectations before
    adding the fixtures, so both are seen red.
  - W3's new spec is shown to fail once on purpose.
  - W4's snapshot tests fail on missing baselines before W5 generates them.
  - The one assertion that moves (home Recent writing's third card) has a coverage mapping in W1.
- **II. Automated Release Gate:**
  - No check is skipped, disabled or weakened.
  - The visual project grows from 18 to 50 tests and stays blocking.
  - The `blog-fixtures.spec.ts` expectations change because the fixture site's content changes.
    They are not relaxed. They still pin exact lead, Featured, Latest and Recent lists.
  - The full gate runs locally (orchestrator) and in CI, because `tests/` and `docs/*.md` are
    full-tier paths.
- **III. Human Review for Major Changes:** no criterion fires.
  - Dependencies: none added or removed.
  - Contact data: `contact-form.mdx` only places the existing form on a test-only fixture page.
    How data is collected, stored, retrieved or deleted is unchanged, and the form is never
    submitted in these tests.
  - Design system, layout, navigation and visual identity: unchanged. Not one pixel of the real
    site moves. New baselines are added for subjects whose templates did not change. CLAUDE.md
    S2 says baselines change "when the shell, a template or the design system changes", and that
    trigger is not met here, so this is a coverage addition.
  - Running costs: none. CI gains roughly 20 to 40 s of e2e time on free GitHub-hosted runners.
  - CI, deployment and infrastructure configuration: untouched (no `.github/`, no
    `playwright.config.ts`, no `package.json`, no `wrangler.jsonc`). `scripts/build-fixture-site.ts`
    is the test harness, not CI configuration.
  - The constitution is not amended.

  Verdict: **not major**. Auto-merge can go on once the Linux baselines are committed and the
  after-figures are recorded. Judgment call: 64 new baseline images could read as touching
  "visual identity". They do not change it. They only pin the current templates. The orchestrator
  re-checks this against the real diff, and the pre-PR pause puts it to Don.
- **IV. First-Party Before Custom:**
  - Snapshots: Playwright's own `expect(locator).toHaveScreenshot()` element shots, the
    first-party way to snapshot part of a page. `toHaveScreenshot`'s `stylePath` and `mask` were
    considered for keeping the post shot full-page and rejected (see W4).
  - Colour checks: Playwright's `expect(locator).toHaveCSS()`, which also retries past any colour
    transition.
  - Expected values: a short in-page probe (`getComputedStyle` of a `var(--color-*)` declaration).
    This is the one custom piece. It copies the precedent in `sections.spec.ts` ("content
    headings use the design-system colours"). No first-party API turns a token name into its
    computed colour.
  - `page.emulateMedia({ reducedMotion: "reduce" })` puts the story in its resting state.
  - No Astro decision is made. The fixture build keeps its existing approach: copy files into
    `src/content/` and call `build()` from `astro`. So no Astro docs page is cited and the Astro
    Docs MCP was not consulted.
  - No new package.
- **V. Static by Default:** unaffected. The contact form fixture page is a prerendered page like
  `/contact/`, and only on the fixture site.
- **VI. Content as Files:** unaffected. Fixture content lives in `tests/fixtures/` as MDX.
- **VII. Private Data:** unaffected. No form is submitted and no secret is read or printed.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected.
- **X. Accessible, Fast and Private:** unaffected. axe (`a11y`) stays the contrast guard. V5 adds
  token identity, not contrast. The budget project is unchanged. Its fixture case still measures
  12 cards on `/writing/all/`.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/visual-refocus-phase-2/` and the `after_chore_*` commits.

## Work items

**Preamble for every implement subagent:**

- **Toolchain.**
  - Node 24 is active, but `pnpm` is not on PATH. Run every toolchain command through the
    wrapper: `/tmp/dcc-chore-p2/run.sh <alarm-seconds> pnpm <args>`. It sets PATH and
    `ASTRO_PREVIEW_BACKGROUND=1`, changes into the worktree, and runs the command under a perl
    alarm.
  - macOS has no `timeout` binary. The wrapper's first argument is the time bound. Never use
    `timeout`.
  - Run every command from the worktree. Never `cd` into `/Users/doncoleman/Repos/dcc-web`.
- **Before any Playwright run:**
  - Check `lsof -i :4321 -i :4322`. A sibling worktree's server on either port gives spurious
    404s or ECONNREFUSED, because `reuseExistingServer` is on locally. If one is up, wait and
    rerun.
  - The fixture site rebuilds only when no server is on 4322. After changing a fixture, make
    sure 4322 is free so the webServer runs `pnpm run build:fixtures` again.
- **After each item:** run the item's targeted tests, then
  `/tmp/dcc-chore-p2/run.sh 300 pnpm run verify:quick`. Never run the full `pnpm run verify`.
  The orchestrator runs it after the review phase.
- **House style:**
  - Plain ASCII in fixture text: no curly quotes, no em dashes, no non-Latin glyphs. Linux font
    fallback drifts on unusual glyphs.
  - Plain sentences in comments and docs.
  - Do not touch anything under `src/`. If a test can only pass by changing the site, stop and
    report it. A chore changes no behaviour.

Order: W1 → W2 → W3 → W4 → W5 → W6, then W7 (orchestrator). W3 needs W1's post. W4 needs W1
and W2's pages. W5 needs W4. W6 describes everything.

### W1 Fixture post `every-part`, the `fixture-cards` topic, and the fixture-site specs that read them

- [x] W1 done

**Files:**

- `tests/fixtures/posts/valid/every-part.mdx` (new)
- `tests/fixtures/posts/valid/text-only.mdx`, `tests/fixtures/posts/valid/long-title.mdx`
- `scripts/build-fixture-site.ts` (`FIXTURE_POSTS`, its doc comment, the head comment)
- `tests/unit/content/sample-posts.test.ts`
- `tests/e2e/blog-fixtures.spec.ts`
- `tests/e2e/blog-pagination.spec.ts` (comment only)
- `tests/e2e/budget.spec.ts` (comment only)

**Design (why each choice):**

- **Lead story.** The lead on `/writing/` is the newest visible post (`selectLanding`), which is
  today the real draft `sample-everything` (2026-08-27). A fixture post becomes the lead, and
  stays the lead whatever real posts are added, only if it is dated far beyond any real post.
  So `every-part` is dated **2099-01-01**. Nothing in `src/` rejects or hides a future date
  (checked: no `Date.now()` in the post code; `assertPostDates` checks only the shape).
- **Featured.** `featured: true`, so the lead story and the post's title card render the Featured
  mark. The lead is never in Featured, so this changes nothing else.
- **Topics.** `drift` (series marker), `compliant-data` (rust pill), `healthcare-leadership`
  (mist pill) and `fixture-cards` (neutral free-form pill).
  - `agentic-ai` is avoided, so the agentic-ai pagination (15 posts) and its comments are
    unchanged.
  - `technology-teams` is avoided, because `blog-fixtures.spec.ts` pins that topic's exact list.
  - One series only (P23).
- **`fixture-cards`.** A free-form id no real post would plausibly use. It is not a near miss of
  a controlled id, and it obeys the id rules (P24, P26).
  - Adding it as the **last** topic of `text-only.mdx` and `long-title.mdx` makes
    `/writing/topics/fixture-cards/` list exactly three fixture cards: every-part (image),
    long-title (image, wrapping title) and text-only (no image, topic-coloured border).
  - On the desktop grid they fill one row, so even the row-stretch height is fixture-only.
  - `mainTopic()` takes the first controlled id, so the text-only card's border colour is
    unchanged.
- **Where the new posts land on `/writing/all/`.** All three posts with `fixture-cards` are on
  page 1 (positions 1, 3 and 4 of 21). Page 2 keeps exactly one free-form pill (`cloud-cost` on
  fixture-post-13). The strict locator in "reaches the page from the neutral pill on the post's
  card" therefore still matches one element.
- **Body.** Rich enough for V3 and V5: a link, inline code, bold, h2 to h4, a bulleted and a
  numbered list, a blockquote, a captioned `ts` code block (the code card and its Copy button),
  and a Markdown table (the scrolling table region).
  - No body image, no `WideImage` and no `FullImage`: the sections snapshot covers those.
  - The feature image has no caption, so the title card keeps its overlapping (`-mt-12`) layout.

**`every-part.mdx`** (write exactly this; ASCII only):

````mdx
---
title: Every part of a post
summary: A fixture post that shows every part of the post template on frozen content, for the visual and theme tests only.
date: 2099-01-01
updated: 2099-01-02
topics:
  - drift
  - compliant-data
  - healthcare-leadership
  - fixture-cards
featureImage:
  src: ./images/sample.png
  alt: A plain blue-grey rectangle used as the feature image of a fixture post
featured: true
---

This post exists only on the fixture site. It holds one of each part a post can show, with a [link to all writing](/writing/all/), some `inline code` and **bold text**.

## A second-level heading

- A first list item
- A second list item
- A third list item

1. A first numbered step
2. A second numbered step

### A third-level heading

> A quoted passage, set apart from the text around it.
> It runs on to a second line.

```ts caption="A short code sample"
const answer: number = 42; // a comment
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

| Option | Cost | Choice |
| --- | --- | --- |
| Build it | High | No |
| Buy it | Medium | No |
| Reuse it | Low | Yes |

#### A fourth-level heading

A closing paragraph under the fourth-level heading.
````

**Test (new-first, then existing updated first):**

1. **Unit, new-first** in `tests/unit/content/sample-posts.test.ts`. Extend the describe block
   "fixture posts for the fixture site" with the cases below, and run them red before the file
   exists. **Layer: unit**: they read fixture files, and nothing needs a build or a browser.
   - "has a post that shows every part of the post template (#40 V3)":
     - `every-part.mdx` exists and is plain ASCII (`/^[\x00-\x7F]*$/`);
     - its front matter has `featured: true`, a `featureImage`, and a `date` in 2099, so it is
       the newest post and the lead;
     - its topics are `drift`, `compliant-data`, `healthcare-leadership` and `fixture-cards`;
     - its body holds a fenced code block with `caption=`, a Markdown table row, a `>` quote, a
       Markdown link, and `##`, `###` and `####` headings.
   - "puts the fixture-cards topic on exactly every-part, long-title and text-only": read every
     `tests/fixtures/posts/valid/*.mdx` that is in `FIXTURE_POSTS`, and check which name
     `fixture-cards`.
   - "copies every fixture post into the fixture site": `FIXTURE_POSTS` (imported from
     `scripts/build-fixture-site.ts`, as `fixture-posts.test.ts` already does) equals
     `["text-only.mdx", "long-title.mdx", "every-part.mdx"]`.
2. **E2E, existing, updated before the fixture lands** in `tests/e2e/blog-fixtures.spec.ts`
   (`sections` project, port 4322). **Layer: E2E**, unchanged: listing order on a served page.
   - Head comment: list `every-part.mdx` (2099-01-01, featured; drift, compliant-data,
     healthcare-leadership, fixture-cards), and add `fixture-cards` to the text-only and
     long-title entries. Newest first is now every-part, sample-everything, long-title,
     text-only, the 13 generated posts, then the four real posts.
   - "fills Featured ...":
     - the lead href becomes `/writing/every-part/`;
     - Featured becomes `["/writing/sample-everything/", "/writing/fixture-post-01/", WAYFINDER]`;
     - Latest is unchanged;
     - the `STARTING` check stays;
     - add the same zero-count check for `FOCUS_POCUS`, which no longer fits in Featured;
     - update the inline comment to match.
   - "home page recent writing ...": rename to "lists the 3 newest posts, the fixture lead first
     and the long title last". The cards are `Every part of a post`, `Every kind of content a
     post can hold` and `LONG_TITLE_START`. Drop the text-only assertions on `cards.nth(2)`
     (coverage mapping below).
   - "series lead": the comment says no fixture post joins a series. Change it to say the lead
     links both series. The assertion is unchanged.
   - Comments: `blog-pagination.spec.ts` (21 posts in all, 12 on page 1 and 9 on page 2; the
     agentic-ai count is unchanged) and `budget.spec.ts` (21 posts; `/writing/all/` still shows
     12 cards).

**Coverage mapping** for the one removed assertion: the home Recent writing check that its
third card is the text-only card with no image. The home section now holds the three newest
posts, which no longer include text-only. The guarantee lives in three places:

- The same `PostCard` text-only variant in the same `CardGrid` (`h3` titles) is asserted on the
  landing by "shows the text-only post as a card with no image and no empty picture box".
- Its pixels are pinned by the new `listing-cards` snapshot (W4).
- The home section's count and order are still asserted.

**Run:**

1. `/tmp/dcc-chore-p2/run.sh 120 pnpm exec vitest run --project unit tests/unit/content/sample-posts.test.ts tests/unit/site/fixture-posts.test.ts`:
   red, then green after the fixture edits.
2. With port 4322 free:
   `/tmp/dcc-chore-p2/run.sh 900 pnpm exec playwright test --project=sections`. Expect 55
   passed, with blog-fixtures red before the fixture edits and green after.
3. `/tmp/dcc-chore-p2/run.sh 600 pnpm exec playwright test --project=e2e tests/e2e/geometry.spec.ts tests/e2e/no-js.spec.ts tests/e2e/shell.spec.ts`
   (these visit the text-only fixture post).
4. `/tmp/dcc-chore-p2/run.sh 600 pnpm exec playwright test --project=a11y tests/e2e/blog-fixture.a11y.spec.ts tests/e2e/a11y.spec.ts -g "text-only|fixture"`.
5. `/tmp/dcc-chore-p2/run.sh 600 pnpm exec playwright test --project=budget --workers=1 -g "12 cards"`.
6. `verify:quick`.

### W2 Contact-form fixture page

- [x] W2 done

**Files:** `tests/fixtures/pages/contact-form.mdx` (new); `scripts/build-fixture-site.ts`;
`tests/unit/site/fixture-posts.test.ts`.

**Why a new page, not `sections.mdx`:**

- Adding `<ContactForm />` to `sections.mdx` would change all four `sections-*` baselines.
- It would also break the `sections.spec.ts` no-JS check `main script count 0`, because the form
  ships an island.
- `[...slug].astro` grants the Turnstile CSP to any page whose body contains `<ContactForm`, and
  Turnstile loads only on first interaction. So a static shot of the new page makes no network
  call.

**`contact-form.mdx`** (ASCII only):

```mdx
---
title: Contact form
description: The contact form on its own, for the visual and theme tests only.
---

This page holds the contact form on fixture content. It exists only in the test site.

<ContactForm />
```

**Build script:**

- Replace the single `fixture` constant with an exported
  `FIXTURE_PAGES = ["sections.mdx", "contact-form.mdx"] as const`, with a doc comment. Copy each
  page into `src/content/pages/` in a loop, keeping the `existsSync` guard and the images copy.
- Update the head comment: the site gets the sections page and the contact-form page, plus the
  fixture posts.
- The page address is `/contact-form/`. It has no `nav` setting, so it is not in the navigation.
  It collides with no route or reserved address.

**Test:** new-first. **Layer: unit**: it reads the list and the files, and no build is needed.
The page's rendering is observed by W4's `contact-form` snapshot. Add a describe block
"fixture pages" to `tests/unit/site/fixture-posts.test.ts`, and update its head comment so it
says the file also covers the fixture pages:

- `FIXTURE_PAGES` equals `["sections.mdx", "contact-form.mdx"]`, and each file exists under
  `tests/fixtures/pages/`.
- `contact-form.mdx` is ASCII and its body contains `<ContactForm />`.
- `sections.mdx` does **not** contain `<ContactForm`. This guards the sections baselines and the
  no-JS script count.

**Run:**

1. The unit file: red before the edit, green after.
2. `/tmp/dcc-chore-p2/run.sh 600 pnpm run build:fixtures`, then check that
   `.cache/fixture-site/dist/contact-form/index.html` exists and contains `id="contact-form"`.
   This is a manual check; do not commit anything from `.cache/`.
3. `/tmp/dcc-chore-p2/run.sh 900 pnpm exec playwright test --project=sections tests/e2e/sections.spec.ts`
   (unchanged, still green).
4. `verify:quick`.

### W3 V5: theme tokens per component, both themes (`tests/e2e/theme-tokens.spec.ts`)

- [x] W3 done

**Files:** `tests/e2e/theme-tokens.spec.ts` (new). No config change: the `e2e` project's
`testIgnore` does not match the name, so `e2e` runs it. Every address is absolute on
`FIXTURE_SITE` (exported by `tests/e2e/templates.ts`), as `geometry.spec.ts` already does. This
is why V5 does not need the `sections` project. Joining that project would mean editing its
`testMatch` and `testIgnore` in `playwright.config.ts`, and the exact regex that
`config-mdx.test.ts` pins.

**Test:** new-first. **Layer: E2E.** Which token the cascade gives an element in a theme
(Tailwind's `dark:` variant, `.dark .prose-accent` against `dark:prose-invert`, component CSS)
only shows in a browser's computed style. No cheaper layer sees it:

- Component tests render HTML, not CSS.
- `tests/unit/content/topics.test.ts` computes contrast from token values in `global.css`, not
  from which token an element gets.

Second-layer reasons, for the spec's head comment:

- axe (`a11y`) checks contrast ratios, and a wrong token can still pass contrast.
- The visual snapshots fail on any pixel change but do not name the token.
- This spec names component, property, theme and token in its failure message.
- It does not repeat the heading colours that `sections.spec.ts` already checks.

**Shape:**

- **Pages** (desktop 1280x800 only, because colours do not depend on width):
  - `${FIXTURE_SITE}/sections/`
  - `${FIXTURE_SITE}/writing/every-part/`
  - `${FIXTURE_SITE}/projects/every-part/`
- **Two tests per page, 6 in all.** Titles: `<page> resolves theme tokens, light then dark` and
  `<page> resolves theme tokens, dark then light`.
- **Steps for each test:**
  1. `page.emulateMedia({ reducedMotion: "reduce" })`.
  2. Set the starting theme with the usual `addInitScript` storing `color-theme`. Copy the
     snippet; do not add a shared helper (Scope, Out).
  3. `goto`, then assert the `html` class as `visual.spec.ts` does.
  4. Wait for `.code-card__button` to be visible on the post page, and for the story to load.
  5. Assert every probe against the starting theme's tokens.
  6. Flip the class in the page with
     `page.evaluate(() => document.documentElement.classList.toggle("dark"))`, with no reload.
     This proves the class alone drives each value.
  7. Assert every probe against the other theme's tokens.
- **Probe table:** `{ name, selector, property, light, dark, focus? }`.
  - `light` and `dark` are token names (`"dusk-200"` for `--color-dusk-200`, `"white"` for
    `--color-white`) or the literal `"transparent"`.
  - `focus: true` means call `locator.focus()` first. A programmatic focus matches
    `:focus-visible` in Chromium; `sections.spec.ts` relies on the same.
- **Expected value:**
  - Compute it in the page. Append a `span` to `body`, set
    `probe.style.setProperty("color", "var(--color-<token>, rgb(1, 2, 3))")` through the CSSOM
    (the CSP allows the CSSOM; it blocks `setAttribute("style")`), read
    `getComputedStyle(probe).color`, then remove the span.
  - If the result is `rgb(1, 2, 3)`, fail with "token --color-<token> is not defined".
    Tailwind 4 emits only the theme variables it uses, so a misspelt or unused token must not
    pass silently.
  - `"transparent"` expects `rgba(0, 0, 0, 0)`.
- **Assertion:** `await expect(locator, \`${name} ${property} (${theme})\`).toHaveCSS(property, expected)`.
  `toHaveCSS` retries, so a `motion-safe:transition-colors` element is read after it settles.
  Reduced motion already switches those off.
- **The flip:** for every probe whose light and dark tokens differ, also assert that the two
  expected values differ. Two token names could resolve to one colour, and then the test would
  prove nothing.
- **Theme-invariant probes.** A probe whose tokens are equal is theme-invariant by design today:
  the CTA button. It is asserted equal in both themes, with a comment. Its class list
  `bg-rust-600 text-white` has no `dark:` variant. Changing that is a design change and out of
  scope. Judgment call: V5's "the dark class flips every one" is read as "flips every one the
  design gives a dark value". The invariant ones are pinned so that an accidental flip fails too.

**Probe table** (tokens as read from the source on f71ed20):

- **The implementer confirms each value by running the test.** Where the cascade gives a
  different palette token than the class list suggests, the observed cascade is the design. The
  likely case is `.dark .prose-accent` against `dark:prose-invert` for blockquote and prose
  links.
- In that case, set the table to the token the browser resolves and add a comment naming the
  rule that wins.
- If a value resolves to no token at all, stop and report it. Do not change any CSS.

`/sections/`:

| Probe | Selector | Property | Light | Dark |
|---|---|---|---|---|
| page background | `body` | `background-color` | `white` | `dusk-BASE` |
| header rule | `body > header nav[aria-label="Main"]` | `border-bottom-color` | `dusk-200` | `dusk-600` |
| header background | same | `background-color` | `transparent` | `dusk-900` |
| site name | `body > header nav a[href="/"]` (first) | `color` | `dusk-900` | `white` |
| theme switch | `[data-theme-switch]` | `color` | `dusk-500` | `dusk-400` |
| footer background | `body > footer` | `background-color` | `transparent` | `dusk-900` |
| footer rule | `body > footer hr` | `border-top-color` | `dusk-200` | `dusk-700` |
| footer copyright | `body > footer p` (the copyright line) | `color` | `mauve-600` | `mauve-400` |
| CTA button | `main a` with text "Get in touch" | `background-color` | `rust-600` | `rust-600` (invariant) |
| CTA text | same | `color` | `white` | `white` (invariant) |
| focus ring | same, `focus: true` | `outline-color` | `accent-500` | `accent-400` |

`/writing/every-part/`:

| Probe | Selector | Property | Light | Dark |
|---|---|---|---|---|
| title card | `[data-title-card]` | `background-color` | `white` | `dusk-800` |
| title card border | same | `border-top-color` | `dusk-200` | `dusk-700` |
| topic pill | `[data-title-card] a[data-topic-pill][href="/writing/topics/compliant-data/"]` | `background-color` / `color` | `rust-100` / `rust-900` | `rust-900` / `rust-100` |
| free-form pill | `[data-title-card] a[data-free-form]` | `background-color` / `color` | `dusk-100` / `dusk-900` | `dusk-800` / `dusk-100` |
| series marker | `[data-title-card] [data-series-marker]` | `border-top-color` / `background-color` | `lavender-700` / `lavender-100` | `lavender-300` / `lavender-900` |
| featured mark | `[data-title-card] [data-featured-mark]` | `background-color` / `color` | `accent-100` / `accent-900` | `accent-900` / `accent-100` |
| code card | `[data-code-block]` | `background-color` / `border-top-color` | `dusk-50` / `dusk-200` | `dusk-900` / `dusk-700` |
| copy button | `.code-card__button` | `background-color` / `color` / `border-top-color` | `white` / `dusk-800` / `dusk-300` | `dusk-800` / `mist-100` / `dusk-600` |
| code text | `.astro-code` | `color` | `dusk-800` | `mist-200` |
| table cell | `.table-wrapper td` (first) | `color` | `dusk-700` | `mist-200` |
| table header rule | `.table-wrapper th` (first) | `border-bottom-color` | `dusk-200` | `dusk-700` |
| quote (stands in for "callouts") | `[data-post-body] blockquote` | `color` / `border-left-color` | `dusk-900` / `accent-300` | `mist-100` / `accent-700` |
| prose link | `[data-post-body] a[href="/writing/all/"]` | `color` | `accent-600` | `accent-400` |
| prose link focus | same, `focus: true` | `outline-color` | `accent-500` | `accent-400` |
| share control | `[data-share] a` (first) | `color` / `border-top-color` | `rust-800` / `rust-600` | `rust-300` / `rust-300` |

`/projects/every-part/`:

| Probe | Selector | Property | Light | Dark |
|---|---|---|---|---|
| story title | `[data-story-title]` | `color` | `dusk-900` | `white` |
| status pill | `[data-status="in-progress"]` | `background-color` / `color` / `border-top-color` | `rust-50` / `rust-950` / `rust-800` | `dusk-900` / `rust-100` / `rust-300` |
| build link | `[data-build-links] a` (first) | `color` | `dusk-900` | `white` |
| build link focus | same, `focus: true` | `outline-color` | `accent-500` | `accent-400` |
| invitation link | `[data-invitation]` | `color` | read `portfolio.css` `[data-invitation]` | same |

**"Callouts" mapping:** the site has no callout component. Post row P19 uses `Callout` as its
example of an unknown section tag, and `src/` has no callout file. So the probe that stands for
"callouts" is the prose blockquote, the only set-apart text block a post renders. The spec's
head comment says so.

**Seen to fail:** the spec passes on the current site by design, so show the failure once on
purpose, in a scratch run that is not committed. Swap the `light` and `dark` columns of one
probe, or skip the class toggle. Confirm the failure message names the probe, property and
theme. Record this in the implement summary.

**Run:**

1. `/tmp/dcc-chore-p2/run.sh 600 pnpm exec playwright test --project=e2e tests/e2e/theme-tokens.spec.ts`.
2. `/tmp/dcc-chore-p2/run.sh 120 pnpm exec playwright test --project=e2e --list | tail -1`.
   Expect 625 tests in 19 files.
3. `verify:quick`.

### W4 V3: eight fixture subjects in `tests/e2e/visual.spec.ts`

- [ ] W4 done

**Files:** `tests/e2e/visual.spec.ts`.

**Test:** new-first. **Layer: visual** (Playwright `visual` project). Pixel identity of a
template on frozen content is what only a snapshot shows. Second-layer reasons, for a comment
above the new block:

- The pages' behaviour is already asserted elsewhere: `blog-fixtures.spec.ts`,
  `projects-fixtures.spec.ts`, `contact.spec.ts`, `projects.spec.ts` and the new
  `theme-tokens.spec.ts`.
- This block adds only the pixels, which the phase-1 gap list in `docs/testing.md` says nothing
  else pins.

**Edits:**

- **Keep everything that exists byte-for-byte:** `open`, `settleImages`, the three existing
  loops, and the existing test titles and snapshot names. The 36 existing baselines must not
  move.
- **New block** after the sections loop: one loop over `WIDTHS` × `THEMES` with one `test()` per
  subject. That gives 8 subjects × 4 = 32 tests. Each test:
  1. calls `await page.emulateMedia({ reducedMotion: "reduce" })` **before** `open(...)`, so every
     subject is shot in its resting state (story chapters final, no reading-progress bar);
  2. calls `open(page, <absolute fixture URL>, ...)`;
  3. asserts the locator has count 1;
  4. calls `await expect(locator).toHaveScreenshot(<name>)`. Element shots never need
     `fullPage`; Playwright captures an element taller than the viewport whole.
- **Test titles** follow the file's pattern: `fixture post template — ${size.name} — ${theme}`,
  and so on.

| Subject (snapshot prefix) | URL (on `http://localhost:4322`) | Locator | Extra wait |
|---|---|---|---|
| `post-template` | `/writing/every-part/` | `page.locator("#main > article")` | `.code-card__button` visible |
| `story-template` | `/projects/every-part/` | `page.locator("article[data-story]")` | none |
| `lead-story` | `/writing/` | `page.locator("[data-lead-story]")` | expect its `h2 a` href `/writing/every-part/` (guards against a real post taking the lead) |
| `listing-cards` | `/writing/topics/fixture-cards/` | `page.locator("ul[data-topic-grid]")` | expect 3 `[data-post-card]` inside |
| `series-banner` | `/writing/drift/` | `page.locator("header[data-series-banner]")` | none |
| `project-row-minimal` | `/projects/` | `page.locator('li[data-project="minimal"]')` | `project-filter[data-ready]` count 1 |
| `project-row-every-setting` | `/projects/` | `page.locator('li[data-project="every-setting"]')` | `project-filter[data-ready]` count 1 |
| `contact-form` | `/contact-form/` | `page.locator("[data-contact]")` | `#contact-js-required` hidden (the island ran; same check as `contact.spec.ts`) |

Snapshot names are `<prefix>-${size.name}-${theme}.png`, so files are
`<prefix>-<size>-<theme>-visual-<platform>.png`.

**Why element shots, not full page** (V3's ticked text says "full page"; judgment call):

- **The post page.** It ends with Related posts, picked from **all** visible posts by shared
  topics, then newest. Real posts are among the candidates, so a content edit could move a
  full-page shot. Related posts sit outside the post's `<article>`, so the article shot leaves
  them out. Their cards are the same `PostCard` that `listing-cards` pins.
- **Real content around the other subjects.** The fixture `/writing/`, `/writing/drift/` and
  `/projects/` pages also show real posts and real draft rows around the fixture subject, so
  only the element is content-proof. A project row is a full-width list item with no siblings in
  its row, so its pixels are its own.
- **The shell.** Full-page shots would pin the header and footer a second time. A shell change
  would then refresh 32 more images, and the footer's build-time year would break all of them in
  2027 (Risks).
- **Rejected first-party alternatives.**
  - `toHaveScreenshot`'s `mask` paints over a region but keeps its height, so a real related post
    with a longer title still moves the page.
  - `stylePath` could hide Related posts, but it keeps the shell duplication and the footer year,
    and its CSS injection under the site's CSP is untested here.

**Header comment:**

- Rewrite the head comment to name the new subjects and "50 images per platform".
- Keep the sentence on comparison settings and `updateSnapshots` "none".
- Keep the statement that the project never snapshots real content, and add that every fixture
  subject is an element shot, for the reasons above.

**Seen to fail:** before W5, the 32 new tests fail with "A snapshot doesn't exist"
(`updateSnapshots: "none"`). That is the expected red. Record it.

**Run:**

1. `/tmp/dcc-chore-p2/run.sh 120 pnpm exec playwright test --project=visual --list | tail -1`.
   Expect 50 tests in 1 file.
2. With ports free: `/tmp/dcc-chore-p2/run.sh 900 pnpm exec playwright test --project=visual`.
   Expect 18 passed and 32 failed on missing snapshots, with no failure among the 18 old tests.
3. `verify:quick`.

### W5 macOS baselines for the new subjects, and the content-edit proof

- [ ] W5 done

**Files:** `tests/e2e/visual.spec.ts-snapshots/` (32 new `*-darwin.png`). **Test:** the W4
tests, which go green here. This is the visual layer's normal baseline step. Linux is not done
here.

**Steps:**

1. Make sure 4321 and 4322 are free (`lsof`). Then run, in the background:
   `/tmp/dcc-chore-p2/run.sh 1200 pnpm run test:visual:update`. Use `run_in_background` and read
   the exit status line. Running it from the agent shell through the wrapper is the known-good
   route. Don't run anything else that builds `dist` meanwhile.
2. `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` must show exactly 32 `??` darwin
   files and **no** ` M` line.
   - A modified existing baseline is an unpredicted diff, so it is a regression. Restore it with
     `git checkout -- <file>` and stop, then report.
   - No `-linux` file may appear. The macOS run writes only `-darwin`.
3. **Look at every new image** with the Read tool, at both widths and themes. Check:
   - each shows the intended element, and only fixture text ("Every part of a post", "Fixture
     cards", "Minimal project", "Every setting", "Drift", "Send a message");
   - images have painted (no blank boxes);
   - the post shot ends at the Share area, with no Related posts;
   - the lead story is every-part.

   Report anything odd instead of committing it.
4. **Stability:**
   `/tmp/dcc-chore-p2/run.sh 1200 pnpm exec playwright test --project=visual --repeat-each=3`.
   All 150 runs pass. A flaky subject is fixed in the test (a missing wait), never by loosening
   `maxDiffPixelRatio`.
5. **Content-edit proof (Acceptance 2), scratch only:**
   - Append " Edited." to the `summary` of `src/content/posts/sample-everything.mdx`, and to the
     `problem` of one real project in `src/content/projects/`. Pick a non-fixture file, and
     leave `_template.mdx` alone.
   - Free 4322 so the fixture site rebuilds, then run
     `/tmp/dcc-chore-p2/run.sh 900 pnpm exec playwright test --project=visual`. All 50 pass.
   - Then `git checkout -- src/content/` and confirm `git status --porcelain src/` is empty.
     Never commit these edits.
   - Record the result in the implement summary.
6. `verify:quick`. Commit only the 32 darwin PNGs.

The Linux baselines are **not** made by an implement subagent. W7 has the orchestrator make
them after the review phase.

### W6 `docs/testing.md`: Layers rows, Visual coverage, gate-time entry

- [ ] W6 done

**Files:** `docs/testing.md`.

**Test:** `no behaviour: n/a (documentation; pipeline-test-placement.test.ts reads this file's
"Where a test goes" bullets, which stay byte-identical and must stay green)`.

**Edits:**

- **Layers table, Visual row:**
  - "What only it can show" becomes: "Pixel baselines of the design system: the shell (header,
    footer, open mobile menu), the not-found page, and on the fixture site the sections page,
    the post and story templates, the listing cards, the lead story, a series banner, two
    projects index rows and the contact form. Never real content."
  - Verdict: keep "Keep, blocking. A diff is a design-system change (Principle III).", and
    change the tail to "Real-content shots removed in #40 phase 1; fixture template shots added
    in phase 2; see 'Visual coverage'."
- **Layers table, E2E row:**
  - "What only it can show" gains ", the theme token each key component resolves to in both
    themes (`theme-tokens.spec.ts`)".
  - Nothing else in the row changes.
- **"Visual coverage" intro:**
  - Replace "the not-found page and the sections fixture page" with "the not-found page and
    fixture subjects on the fixture site".
  - Add one sentence: phase 2 added element shots of the fixture post and story templates, the
    listing cards, the lead story, the Drift series banner, two projects index rows and the
    contact form. Each is an element on fixture content, so a content edit still cannot fail
    the project.
- **The table:** keep every row and its first part. Replace only each gap clause:
  - `home`: "Home intro card pixels: review-only by decision (#40 phase 2): it is site copy,
    not a template."
  - `contact`: "The contact form's pixels: the `contact-form` snapshot of the fixture page
    `/contact-form/` (#40 phase 2)."
  - `writing-landing`:
    - "Listing card pixels: `listing-cards`, the three fixture cards on
      `/writing/topics/fixture-cards/`."
    - "Lead-story pixels: `lead-story` on the fixture `/writing/`, whose lead is the fixture post
      `every-part` (dated 2099 so no real post can take the lead)."
  - `writing-all`, `writing-topic`: "As `writing-landing`, including the card snapshot."
  - `writing-post`: "Post template pixels: `post-template`, the article of the fixture post
    `/writing/every-part/`. Related posts are left out because they are chosen from all posts;
    their cards are the `listing-cards` component."
  - `writing-series`: "Series banner pixels: `series-banner` on the fixture `/writing/drift/`
    (banner element only)."
  - `projects`: "Projects index row pixels: `project-row-minimal` and
    `project-row-every-setting` (row elements only; the fixture index also lists real draft
    rows)."
  - `project-story`: "Story template pixels: `story-template`, the article of the fixture story
    `/projects/every-part/`, with reduced motion."
- **Closing paragraph:** replace "After this PR these pixels have no snapshot ... meanwhile."
  with a short paragraph:
  - every phase-1 gap now has a fixture snapshot, except the home intro card, which is
    review-only by decision;
  - the fixture site also holds real content, so every phase-2 subject is an element shot, and
    the post's Related posts are left out;
  - `blog-fixtures.spec.ts` pins the lead, so a fixture change that moves it fails there with a
    named reason.
- **"Measured gate times":** append `### Visual refocus, #40 phase 2 (2026-10-03)` after the
  phase-1 entry. Do not edit the phase-1 entry.
  - Table columns: Measure | Before (run 37141574364, `main` push of #41) | After.
  - Rows:
    - `e2e` job: 305 s | `pending (#40 phase 2 PR run)`
    - `test:e2e:parallel` step: 208 s | `pending (#40 phase 2 PR run)`
    - Visual tests: 18 | 50
    - Visual PNGs: 36 | 100
    - E2E tests: 619 | 625
  - One line under the table: "Before is a `main` push run; after figures are from this PR's CI
    run, which adds the preview site-check, so the `test:e2e:parallel` step is the comparable
    number."
- No other line changes. House style: plain sentences, no em dashes in new text, pipe tables.

**Run:**

1. `/tmp/dcc-chore-p2/run.sh 120 pnpm exec vitest run --project unit tests/unit/setup tests/unit/ci`.
2. `grep -n '^## \|^### ' docs/testing.md`. The heading list matches `main` plus
   `### Visual refocus, #40 phase 2 (2026-10-03)`.
3. `verify:quick`.

### W7 `[ORCHESTRATOR]` Full gate, Linux baselines, after-measurement, PR

- [ ] W7 done

**Files:** `tests/e2e/visual.spec.ts-snapshots/*-linux.png` (32 new); `docs/testing.md` (two
cells). Not for an implement subagent.

1. **Review fixes.** After the review phase and its fixes, ask Don before the full gate (memory:
   parallel gates crash his machine). Then run `pnpm run verify` through the wrapper in the
   background under `perl alarm`, and read `VERIFY_EXIT=`. Check `lsof -i :4321` first.
2. **Linux baselines.**
   - Run `pnpm run test:visual:update:linux` (Docker Desktop). If `docker info` fails, ask Don to
     start it with an `AskUserQuestion` whose question text carries the instruction.
   - Commit only the 32 new `*-linux.png`. No existing `-linux` file may change; if one does,
     stop.
   - Fallback when Docker is unavailable, or when CI then fails on a new Linux image (memory:
     local Docker baselines can differ from CI): add the `visual-baselines` label, download the
     `visual-baselines-linux` artifact with `gh run download`, and copy only the new
     `*-linux.png`.
   - `verify` is red on visual only until then, so say so in the PR body.
3. **After-measurement.** After the PR's first fully green CI run, take the `e2e` job time and the
   "Run the end-to-end, accessibility, visual and sections projects" step time from
   `gh run view <id> --json jobs`.
   - Write them into W6's two `pending` cells.
   - Commit `docs(testing): record #40 phase 2 e2e times` and push. Do not leave `pending` in
     the merged file.
4. **PR body.**
   - `Part of #40` (phase 2);
   - the before/after table;
   - the V3 widening as decided, and the element-shot judgment call;
   - the `blog-fixtures.spec.ts` expectation changes and their coverage mapping;
   - the CTA invariant and "callouts" mapping notes;
   - the Scope follow-ups;
   - the Principle III verdict (not major).
   - Open it from `drc-agents` per CLAUDE.md Merging.
   - Auto-merge goes on only after the Linux baselines and the after figures are pushed.

## Docs citations

Playwright (the only tool whose usage changes):

- Visual comparisons, per-platform snapshot names, `--update-snapshots`:
  https://playwright.dev/docs/test-snapshots
- `expect(locator).toHaveScreenshot()` (element shots; options `mask`, `stylePath`,
  `animations`, `caret`, `maxDiffPixelRatio`):
  https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-screenshot-1
- `locator.screenshot()` (scrolls the element into view and captures the whole element):
  https://playwright.dev/docs/api/class-locator#locator-screenshot
- `expect(locator).toHaveCSS()` (computed style, auto-retrying):
  https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-css
- `page.emulateMedia({ reducedMotion })`: https://playwright.dev/docs/api/class-page#page-emulate-media
- `page.addInitScript` (theme in `localStorage` before first paint):
  https://playwright.dev/docs/api/class-page#page-add-init-script
- Locators (CSS and attribute selectors, `filter({ hasText })`): https://playwright.dev/docs/locators
- Test CLI (`--list`, `--project`, `--repeat-each`, `-g`): https://playwright.dev/docs/test-cli
- Web platform, used inside `page.evaluate`: `Window.getComputedStyle()`
  (https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle) and
  `CSSStyleDeclaration.setProperty()`
  (https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty), which a
  CSP without `'unsafe-inline'` permits where a `style` attribute is blocked.

Astro: no Astro decision is made. The fixture build adds files through its existing copy into
`src/content/` and its existing `build()` call, and no collection, loader, route or config
changes. So the Astro Docs MCP was not consulted.

## Risks

- **Real content leaking into a shot.** The fixture site also builds the real posts, pages and
  draft projects.
  - Mitigations:
    - every subject is an element on fixture content;
    - the lead is pinned by a 2099 date, and checked in the visual test and in
      `blog-fixtures.spec.ts`;
    - the cards page uses a free-form topic only fixtures carry;
    - project rows have no row siblings;
    - the post shot leaves out Related posts.
  - Residual risk: a real post dated after 2099-01-01 or tagged `fixture-cards`, both absurd. A
    real project with slug `minimal` or `every-setting` would fail the build first (duplicate
    slug).
  - Acceptance 2 proves the design with a scratch content edit.
- **Element shots taller than the viewport** (post and story at phone width). Playwright captures
  the whole element. W5's image review checks that nothing is cut off.
- **Share button by platform.** The Share button is shown only where `navigator.share` exists,
  which may differ between headless Chromium on macOS and on Linux. Each platform has its own
  baseline, so this is stable within a platform. W5's `--repeat-each=3` checks that.
- **Linux glyphs.** New text on Linux can render differently in local Docker and in CI.
  Mitigations: ASCII-only fixtures (unit-guarded in W1 and W2), and the label + artifact fallback
  in W7.
- **The V5 cascade.** `.dark .prose-accent` and `dark:prose-invert` both set prose variables, and
  which one wins decides the quote and link tokens. W3 makes the observed cascade the expected
  value, with a comment. It reports any value that resolves to no token, and changes no CSS.
- **`--update-snapshots` touching existing images.** Only images past the threshold are
  rewritten, but any rewrite of an existing baseline is a regression. W5 step 2 checks
  `git status` for ` M` and stops.
- **Fixture ripple.** The new post shifts `/writing/all/` (21 posts, 9 on page 2), the fixture
  home's Recent writing, and Featured on the landing.
  - All the affected assertions are listed in W1, and the sections project runs in W1.
  - The budget fixture case still sees 12 cards. Its page-1 images change slightly; W1 runs it.
- **Footer year.** This existing hazard is not introduced here. Every footer-bearing baseline
  fails on the first build in 2027. It is a follow-up, and the new subjects avoid the footer.
- **Port collisions** with sibling worktrees on 4321 and 4322 (spurious failures). Check `lsof`
  first, then wait and rerun. The fixture site rebuilds only when 4322 is free.
- **Gate time.** This adds 32 visual tests and 6 e2e tests, all single-page loads, at an estimated
  +20 to 40 s on the `test:e2e:parallel` step at 4 workers. W7 records the real figure.
