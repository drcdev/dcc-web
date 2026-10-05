# Review report: worker-api-hardening (issue #89)

Fresh-eyes review of `chore/worker-api-hardening` against `plan.md`. Base: local `main` at c87fb86 (the plan's base). `origin/main` is at 87a8389 (#104, dependency advisories), which also touches `docs/setup.md` and `scripts/setup-check/items.ts`. A trial `git merge-tree` of HEAD with `origin/main` merges cleanly.

## Verdict

All nine work items are done as planned. Nothing outside the plan was changed. Every planned test is present at the layer the plan names, and all of them pass. No check was weakened. The Principle III verdict (**major**, auto-merge off) still matches the real diff.

**Findings: 0 CRITICAL, 0 HIGH, 5 LOW.**

## Checks run (this review)

| Command | Result |
|---|---|
| `pnpm exec vitest run tests/unit/site/config-files.test.ts tests/unit/site/deploy-preview.test.ts tests/unit/setup-check/checks/cloudflare-worker.test.ts tests/unit/setup-check/checks/preview-noindex.test.ts tests/unit/setup` | 58 files, 800 tests passed |
| `pnpm run test:worker` (Workers Vitest pool: production and preview projects) | 18 files, 268 tests passed |
| `tsc -p worker` and `wrangler types worker/worker-configuration.d.ts --check` | pass ("Types ... are up to date") |
| `git merge-tree --write-tree HEAD origin/main` | clean |

The full `pnpm run verify` gate was not run here. The orchestrator runs it.

## Correctness review

- **HTTPS check** (`worker/src/same-origin.ts:8`, `worker/src/messages/router.ts:16`):
  - `isSecureRequest` holds exactly the old inline condition: `https:`, or `http:` with a hostname in `LOCAL_HOSTS`.
  - The localhost exception compares the whole hostname, so `localhost.evil.example` is refused (tested).
  - `handleMessages` runs the check first, before `isAuthorized`.
  - `index.ts` routes `/api/messages*` straight to `handleMessages` with no earlier D1 access, so D1 is not read on a refusal.
  - Tests cover a valid token, no token and a wrong token (403, not 401), five methods on `/read` with the row left unread, and `127.0.0.1` getting 200.
  - The new log outcome is a fixed string, so no personal data is logged.
- **Turnstile gate** (`worker/src/contact/turnstile.ts:62`, `worker/src/contact/submit.ts:132`):
  - `allowTestingKey` is set by `env.ALLOW_TURNSTILE_TESTING === "true"`, an exact string match.
  - A testing-key verdict returns `input.allowTestingKey && result.success === true`, so production, where the value is absent, rejects it with `422 turnstile_failed` and stores nothing (tested).
  - `"false"` and `"1"` are rejected (tested). No hostname parsing was added.
  - The real-verdict branch (success, action and hostname) is unchanged.
- **Preview deploy** (`scripts/deploy/preview.ts:32-41`):
  - Migrations run on every build.
  - `main` alone pushes `deploy --env preview`. Every other branch pushes only `versions upload --env preview --preview-alias <alias>`.
  - Tests pin both arrays exactly, and the new "never deploys from a branch" case includes `main-fix`.
- **`ALLOW_TURNSTILE_TESTING` cannot reach production:**
  - `wrangler.jsonc` has no top-level `vars`. The flag sits only in `env.preview.vars` (l.35), and Wrangler treats `vars` as non-inheritable.
  - `e2e.env` carries the flag. The e2e server runs `wrangler dev --config wrangler.e2e.json` with no `--env`, so it reads top-level config plus the env file. The generator copies `env.preview.vars` through, but `wrangler dev` without `--env` ignores that block.
  - Generated types show the flag as optional `"true"` on the base `Env` and required on `PreviewEnv`.
  - The worker Vitest production project loads `../.env`, and test (b) passes, so that file does not set the flag.

## Coverage mappings (verified true)

| Removed or replaced assertion | Replacement |
|---|---|
| "enables workers_dev and preview_urls" (top-level `true`/`true`) | "keeps production off workers.dev and version URLs (#89)" (`config-files.test.ts:70`), plus "turns on ... for the preview Worker explicitly". Together they pin both Workers. |
| "accepts Cloudflare's documented testing-key answer ..." (accepted with no flag) | (a) accepted only with `"true"` (`contact.test.ts:213`); (b) 422 and no row stored when the flag is unset (l.223); (c) 422 for `"false"` and `"1"` (l.232) |
| Branch steps included `deploy --env preview` | Exact branch array without `deploy`, plus "never deploys from a branch" |
| preview-noindex checked the `dcc-web` and `dcc-web-preview` hosts | Checks the preview host, and asserts the production host is never requested. The production host stops serving once `workers_dev` is off, so nothing is lost. |

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **The W1 generator check reads source text** (`tests/unit/site/config-files.test.ts:85-92`). It asserts that `scripts/e2e-wrangler-config.ts` never mentions the flag or `.vars`; it does not inspect the generated `wrangler.e2e.json`. Together with the top-level-`vars` test (l.80) it still holds the rule, but a generator rewrite that adds vars by another route (for example a spread) would get past it. Known deviation, acceptable.
2. **W5 casts to type the invalid override values** (`worker/test/contact.test.ts:234`). It uses `as unknown as Partial<Env>`, because the generated type only allows `"true"`. Test-only and deliberate: it proves anything other than the exact string is rejected. Known deviation, acceptable.
3. **A spec contract still describes item 17 with both hosts.** `specs/011-launch/contracts/setup-items.md:66-67` and `specs/011-launch/data-model.md:52` still say the check requests both Workers' `workers.dev` hosts; the check now requests only the preview host. The R6 note in `specs/011-launch/research.md` covers the reason, but these two files were not in W8's list, so they carry no "Superseded by #89" note. `specs/001-setup-walkthrough/data-model.md:43` (item 7 "workers.dev and preview URLs enabled") is equally stale. A gap in the plan, not in the implementation: follow-up.
4. **The constitution label in `docs/setup.md` is stale** (`docs/setup.md:233`). Item 7 now reads "VIII (Secure by Default)", but the constitution names VIII "Cloudflare Best Practices". The label is copied from the file's existing usage (l.575, 600, 652 and others), so this PR repeats a stale label rather than introducing one. Follow-up: rename across `docs/setup.md`.
5. **Commit trailers are inconsistent.** `00e5fff` (W3) and `db72bb3` (W2) have no Co-Authored-By trailer, `6359543` (W1) has a "Claude Sonnet 5.5" trailer, and `db72bb3`'s subject lacks the "(W2)" tag. History is not rewritten.

Known deviations also checked:

- **W6 added a "Superseded by #89" note to `worker-config.md` "Deploy scripts".** The plan's W6 asks for exactly this.
- **W7 moved item 7's principle from II to VIII.** The plan asks for this, and the drift test passes.
- **W7 left `setup-walkthrough/SKILL.md` untouched.** Correct: the file has no `workers.dev` or preview-URL text, so acceptance 9 holds without an edit.

## Scope (criterion 11)

`git diff --name-only main...HEAD` lists 27 files. Each one is named in a work item or sits under `.specify/chores/worker-api-hardening/`. There is no change to visual baselines, pages, components, `public/_headers`, CI workflows, CLAUDE.md or pipeline skills.

## Principle III verdict

**Major**, and still correct against the real diff:

- **Contact data collection:** `turnstile.ts` and `submit.ts` change which verdicts are accepted, and `router.ts` changes retrieval.
- **Deployment and infrastructure config:** `wrangler.jsonc` and `scripts/deploy/preview.ts` change.

Label the PR `major-change`, leave auto-merge off, and have Don run the `[PREVIEW-CHECK]` items.

## Acceptance criteria: before (c87fb86) and after (this branch)

| # | Criterion | Before (c87fb86) | After (HEAD) | Status |
|---|---|---|---|---|
| 1 | New assertions seen red first | n/a | Implementers report red runs per item; not re-run red by this review | met (as reported) |
| 2 | Production config | `workers_dev: true`, `preview_urls: true` (`wrangler.jsonc:13-14`) | `false` / `false`, no top-level `vars` | met |
| 3 | Preview config | inherited `true`/`true`, no `vars` | explicit `true`/`true`, `vars.ALLOW_TURNSTILE_TESTING: "true"` | met |
| 4 | E2E config | no flag | `ALLOW_TURNSTILE_TESTING=true` in `e2e.env`; generator unchanged | met |
| 5 | Types | no flag | `?: "true"` on base `Env`, `: "true"` on `PreviewEnv`; `--check` passes | met |
| 6 | Retrieval HTTPS | `http://` gives 401, or 200 with a token | `403 https_required` before auth; localhost allowed; one shared `isSecureRequest` | met |
| 7 | Turnstile gate | testing-key verdict accepted everywhere | accepted only when the flag `=== "true"`; production gives 422 | met |
| 8 | Preview deploy steps | branch: migrate, `deploy`, aliased upload | branch: migrate, aliased upload; main: migrate, `deploy` | met |
| 9 | Docs | items 7/17/22 tell Don to turn on `workers.dev`/previews for `dcc-web`, or check both hosts | items 7/17/22/24, `items.ts` and check messages reworded; SKILL.md needed nothing | met |
| 10 | Recorded decisions annotated | none | dated notes in 011 R6, 007 R6, `worker-config.md` (twice), `retrieval-api.md` scheme section | met (see LOW 3) |
| 11 | Diff scope | n/a | only planned files | met |
| 12 | `verify:quick`, then full gate | n/a | targeted suites and the worker typecheck green; orchestrator runs the gate | pending (orchestrator) |

No timing measurement applies: acceptance is mechanical.

## Follow-ups for the PR body

- **Production assistant URL:** before approving, Don confirms his assistant calls `https://new.doncoleman.ca/api/messages/...`, not `dcc-web.drc-dev.workers.dev` (`[PREVIEW-CHECK]`).
- **After the production deploy:** `dcc-web` Domains & Routes shows `workers.dev` and Preview URLs off; `https://new.doncoleman.ca/` still serves the site (`wrangler deploy` with `workers_dev: false` and no `routes` keeps the dashboard Custom Domain, but confirm it); `https://dcc-web.drc-dev.workers.dev/` no longer serves the site.
- **Setup check:** read each Worker's own `workers.dev` and preview-URL state through `GET /accounts/{id}/workers/scripts/{name}/subdomain`, so items 7 and 22 confirm the real setting.
- **Dashboard rule:** Don can add the `api-per-ip` rate-limit rule now that production is off `workers.dev`.
- **Stale specs:** annotate item 17 and item 7 in `specs/011-launch/contracts/setup-items.md`, `specs/011-launch/data-model.md` and `specs/001-setup-walkthrough/data-model.md` (LOW 3).
- **Constitution label:** rename "VIII (Secure by Default)" in `docs/setup.md` to "VIII (Cloudflare Best Practices)" (LOW 4).
