# Review report: prune-restating-tests (issue #97)

Reviewer: fresh-eyes review phase, read-only on code. Reviewed `git diff e3c9aeb...HEAD` (main is `e3c9aeb`; 10 commits, W1 to W10, plus the plan) against `plan.md`, issue #97 and its two comments, the constitution and `CLAUDE.md`.

## Verdict

Every work item W1 to W10 is done as planned, and nothing was added beyond the plan. The diff touches only `tests/**`, `playwright.config.ts`, `package.json` (the one `reference:capture` line), `docs/testing.md`, `docs/design-source.md` and the chore folder. Nothing under `src/`, `public/`, `worker/`, `scripts/`, `.github/`, `.claude/` or `setup/` changed, and no baseline PNG changed (the only deleted PNGs are the 12 Ghost reference images). Every touched unit file and both touched e2e specs pass. One HIGH finding: the rewritten workflow permission test has a gap that the old per-job test did not have. Fix it before the PR.

## Findings

### CRITICAL

None.

### HIGH

- **H1. `tests/unit/ci/workflows.test.ts:117-119`, "grants no job a write permission" misses `write-all`.** The new regex `/:\s*write\s*$/m` matches `contents: write` and `id-token: write`, but not `permissions: write-all`. Checked with node: `"    permissions: write-all"` gives `false`. The removed test (old L218) required each of `changes`, `static`, `build-tests` and `verify` to declare `permissions:\n contents: read` in its header, so a job-level `write-all` failed it. "Read-only permissions" is an invariant the issue says to keep, so this is a weakening beyond what the issue allows (Principle II). Fix: also reject `write-all`. For example, `expect(contents).not.toMatch(/:\s*write(-all)?\s*$/m)`. Show the fix failing on a scratch `permissions: write-all` line, then revert the scratch edit. The same check could also go in the `visual-baselines.yml` block, which has no write check (it had none before either).

### LOW

- **L1. `public/_headers` values are no longer pinned anywhere** (`tests/unit/site/headers.test.ts:66-77` checks only that each name is present). Example: `X-Frame-Options: ALLOWALL`, `Strict-Transport-Security: max-age=0` or a header CSP without `frame-ancestors 'none'` would pass the unit test. The e2e spec would also pass, because it reads its expected values from the same file. The issue allows dropping exact values, and a deleted header is still caught by the presence test. Possible follow-up: a few cheap value invariants.
- **L2. Turnstile script source.** The replacement for the removed csp.test.ts contact-page tests is `contact.spec.ts:56-63`. It checks that the contact policy contains the Turnstile host anywhere and that `frame-src` names it, but not `script-src` itself. The removed unit test checked `insertScriptResource` by its exact text. The guarantee still holds in practice: the contact success-path test asserts no CSP violation (`contact.spec.ts:52`). The rest of the mapping is accurate: `local-site.test.ts:297` keeps project, index and About pages on the site policy with no `frame-src`, and `[...slug].astro:44` is the route the `/contact/` e2e test exercises.
- **L3. `docs/testing.md:193`** is 123 characters wide. The rest of the paragraph wraps at about 95. Cosmetic.
- **L4. `config-files.test.ts:100-103`**, "never makes the AI binding remote", also passes if the binding is removed. Removing it is caught elsewhere (`wrangler types --check` and the Worker code). Noted only.

## Coverage mappings checked

- **csp.test.ts contact-page tests (removed):** held by `contact.spec.ts:56-63` and by `local-site.test.ts:297-308` (other pages keep the site policy, there is no `frame-src`, and `_headers` has no `frame-src`). Confirmed, see L2.
- **config-mdx `build:fixtures` wiring (removed):** the Playwright `sections` web server runs `pnpm run build:fixtures` (`playwright.config.ts:42`). The `verify` sequence is still pinned at `config-files.test.ts:236`. Confirmed.
- **config-files `deploy:preview` (removed):** a change-detector. `config-files.test.ts:118` still checks that `scripts/deploy/preview.ts` applies migrations with `--env preview`. Accepted.
- **navigation.test.ts 17 → 15:** the two dropped tests are the planned tombstones. Every distinct `nav.test.ts` case was merged:
  - `isCurrent`: trailing-slash equivalence is already covered by `/services`; the child case `/projects/example-project/` is added.
  - `isInSection`: the index, the child with and without a slash, `/projects-old/` and `/project/` are added, and `/` never holds `/projects/example-project/`.
  - Dropped as duplicates: `isInSection("/projects/", "/")` and `isCurrent("/projects", "/projects/")`.
  - No case was lost, and no real slug remains.
- **e2e headers spec reads `public/_headers`:** a header deleted from `/*` fails the unit presence test (`headers.test.ts:66-77`). A weakened `/_astro/*` Cache-Control fails `headers.test.ts:37`. A missing `/*` rule makes the spec throw. Confirmed.
- **W3 and W4:** the page-schema check (`launch-content.test.ts:48`) replaces the Home intro key checks. The guard's page needles have a self-test, and the guard passes over its three folders.

## Invariants the issue lists: all still asserted

| Invariant | Where it is asserted |
| --- | --- |
| no `'unsafe-inline'` | `csp.test.ts:61`, `headers.test.ts` (header CSP), `headers.spec.ts` |
| allow-list only | `csp.test.ts:84` |
| no cookies | `headers.test.ts`, both e2e tests |
| actions pinned | `workflows.test.ts:67` and `:133` |
| read-only permissions | `workflows.test.ts:43`, `:117` (H1), `:129` |
| no secret-looking vars | `config-files.test.ts:137` |
| invocation logs off | `config-files.test.ts:132` |
| no `continue-on-error` | `workflows.test.ts:75` and `:152` |
| `verify` sequence | `config-files.test.ts:236` |
| every spec in one project | `config-files.test.ts:217` |
| `test:a11y` and `types:worker` | `config-files.test.ts:262` and `:336` |

Acceptance 4's full list was checked title by title, and every item is present (some under an equivalent title).

## Other checks

- **Layers:** each item sits at the layer the plan names. `tests/helpers/headers.ts` has no runner import.
- **Shared skill wording:** no `.claude/` change and no shared block restated.
- **`docs/testing.md`:** it has the new rule, the guard needles, the fonts and headers paragraph, and the home and about rows. A `git grep` for the deleted files and titles finds only `docs/design-source.md`.
- **Principle III:** "none" is right. There is no dependency, contact data, design, cost, CI or deployment change. `playwright.config.ts` changes shape only, and the `--list` totals fall by exactly the removed 14 + 1 tests with no file moving between projects.
- **Principle II:** apart from H1, nothing is weakened beyond what the issue authorises.

## Measurement (after, re-run in review; before from the plan, on e3c9aeb)

| Acceptance check | Before | After |
| --- | --- | --- |
| 1. `tests/reference/` | 15 files, 15 MB | absent; `reference:capture` 0; grep matches only `docs/design-source.md` |
| 2. `tests/unit` test files | 124 | 122 |
| 3. literal greps | 6, 2, 16, 4, 2, 10, 20 | all 0 |
| 3. `playwright.config.ts`: each fixture pattern | 2 each | 1 each |
| 6. `--list`, all projects | 1540 in 31 files | 1525 in 31 files |
| 6. `--list`, `e2e` | 667 in 21 files | 652 in 21 files |
| 6. `headers.spec.ts` | 16 | 2 |
| 6. `pages.spec.ts` | 53 | 52 |
| 7. in-scope unit tests | 329 in 12 files | 201 in 10 files, all passing |
| 7. `--project unit` | not recorded (about 2673) | 2545 in 176 files, all passing |

Per-file unit counts:

| File | Before | After |
| --- | --- | --- |
| workflows | 36 | 16 |
| launch-content | 30 | 17 |
| guard | 77 | 78 |
| config-files | 52 | 29 |
| config-mdx | 7 | 6 |
| csp | 20 | 6 |
| headers | 22 | 17 |
| nav | 5 | deleted |
| navigation | 17 | 15 |
| reference-screenshots | 27 | deleted |
| drift | 16 | 12 |
| skill-behaviour | 20 | 5 |

`design-source.test.ts` (83) also passes.

E2E: `headers.spec.ts` and `pages.spec.ts` pass all 54 tests. Port 4322 was free. Port 4321 was held on `[::1]` only, by an `astro dev` in the main checkout, and `wrangler dev` bound to the free `127.0.0.1:4321`. The full `pnpm run verify` gate was not run in review.

## Follow-ups for the PR body

- **H1 fix**, if it is not folded into this PR before it opens.
- **L1.** Value invariants for the `/*` headers (`frame-ancestors 'none'`, `nosniff`, framing denied, HSTS at least one year).
- **F1. Borderline tombstones left in place:**
  - `deploy-preview.test.ts` L99 and `docs-structure.test.ts` L122 assert documentation prose.
  - `site-origin.test.ts` L25 is behaviour.
  - `projects-content.test.ts` L25 and `projects-guide.test.ts` L70 to L83 guard the schema and the guide.
  - The `config-files` `not.toHaveProperty` checks are live invariants.
- **F2.** Cut `design-source.test.ts` to the headings and the `.reference` leak checks.
- **F3.** The navigation config literals in `navigation.test.ts` are design identity and need a separate decision.
- **F4.** `docs-structure.test.ts`, `setup/items.test.ts` and `launch-doc.test.ts` assert documentation prose.
- **F5.** Read page draft flags through the content helper, as #55 did for posts and projects.
- **F6.** Fold the rest of `config-mdx.test.ts` into `config-files.test.ts`, or delete it.
