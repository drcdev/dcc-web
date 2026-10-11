# Review report: worker-custom-domains (issue #156)

Reviewer: fresh-eyes review phase, 2026-10-10, on `chore/worker-custom-domains` at 53f9f5b (`git diff main...HEAD`). Read-only outside this file.

## Verdict

W1 to W4 are done as planned and nothing beyond them. W5 (the gate) is left to the orchestrator. No CRITICAL or HIGH findings; three LOW.

## Work items against the plan

| Item | Planned | Found |
| --- | --- | --- |
| W1 | Three unit `it` blocks in the `wrangler.jsonc` describe of `tests/unit/site/config-files.test.ts` | Present at lines 146-172: the production route is derived from `FALLBACK_ORIGIN`, no environment declares the bare domain, and preview has `routes: []` with a matching `unstable_readConfig` resolution. Unit layer, as planned. The inherit-warning sub-assertion was dropped, which the plan allows, and the W1 tick records it. |
| W2 | Pure helper `scripts/lib/e2e-wrangler-config.ts`, called by the generator; a new unit test; the generator-source test reads both files | Present. The helper drops `$schema`, `ai` and `routes` at the top level and in each env, and returns copies without changing its input. The new test is at lines 33-46. Unit layer, as planned. |
| W3 | Top-level `routes` with `custom_domain: true`; `env.preview.routes: []` | `wrangler.jsonc` lines 15 and 43, exactly as specified. |
| W4 | `docs/setup.md` item 6, item 18 note, item 18 rollback | All three edits are present. The step numbering and every phrase the item 18 docs-structure test looks for are unchanged. The `cloudflare-worker.ts` comment is untouched; it already reads "served on the Custom Domain only", not as hand-set, which the plan allows. |

**Scope (acceptance 9):** the diff lists only `wrangler.jsonc`, `scripts/e2e-wrangler-config.ts`, `scripts/lib/e2e-wrangler-config.ts`, `tests/unit/site/config-files.test.ts`, `docs/setup.md` and `.specify/chores/worker-custom-domains/**`. No page, baseline, `_headers`, CI workflow, deploy script, setup-check code or skill changed.

**Tests:** `vitest run tests/unit/site/config-files.test.ts tests/unit/setup/docs-structure.test.ts`: 2 files, 73 tests passed.

**Checks not weakened:** the generator-source test now loops over the generator and the helper and applies the same two assertions to each (no `ALLOW_TURNSTILE_TESTING`, no `.vars`). The config-building code moved into the helper, so reading both files keeps the guard on all the code that builds `wrangler.e2e.json`. It guards the same thing as before, over a wider surface. No other assertion changed.

**Other checks:** `docs/testing.md` needs no update, because no test layer moved. No skill changed, so no shared block is restated. The coverage mapping is true; the contact E2E journey is gate evidence, not a new mapping.

## Correctness

- **Preview cannot inherit the Custom Domain.** `env.preview.routes` is `[]`, and Wrangler's `unstable_readConfig({env:"preview"})` resolves `dcc-web-preview []`. `deploy --env preview --dry-run` prints no inherited-domain warning.
- **E2E config has no routes.** `node scripts/e2e-wrangler-config.ts` writes `wrangler.e2e.json` with `routes` undefined at the top level and in `env.preview`, and with no `ai` or `$schema`. So `wrangler dev` cannot infer `www.doncoleman.ca` as its origin, and the contact same-origin check stays on 127.0.0.1.
- **Production deploy.** `scripts/deploy/production.ts` runs plain `wrangler deploy`. Wrangler prints its multi-environment `--env=""` advisory, which was already there before this branch because `env.preview` existed. The top level is still what gets deployed: `unstable_readConfig` resolves `dcc-web` with the www route both with no env and with `env:""`. `--env=""` is not needed for correctness, and adding it would change a deploy script, which is out of scope.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. `tests/unit/site/config-files.test.ts:153-161`: the bare-domain test compares each route's pattern with the bare hostname by exact equality. A string route such as `doncoleman.ca/*`, or a `zone_name`-style route, would get past it. This is acceptable today, because the production route is pinned exactly (line 147) and preview is pinned to `[]`.
2. `tests/unit/site/config-files.test.ts:33-46`: the e2e-config test checks that the top-level keys are kept, but not that the other per-environment keys survive. The helper's code clearly keeps them.
3. The optional W1 "no inherit warning" sub-assertion was dropped. The plan allows this and the W1 tick records it; the raw `routes: []` check and the clean preview dry run cover it.

## Measurement

**Before (main 419d4b6):** `grep -c '"routes"' wrangler.jsonc` gave 0. No routes were declared anywhere, and the www Custom Domain existed only as a dashboard setting.

**After (53f9f5b):** `grep -c` gives 2. The top level declares `"routes": [{ "pattern": "www.doncoleman.ca", "custom_domain": true }]` and `env.preview` declares `"routes": []`.

`unstable_readConfig` gives:

```
top(no env): dcc-web [{"pattern":"www.doncoleman.ca","custom_domain":true}]
env="":      dcc-web [{"pattern":"www.doncoleman.ca","custom_domain":true}]
preview:     dcc-web-preview []
```

`perl -e 'alarm 120; exec @ARGV' wrangler deploy --dry-run --env-file /dev/null` (production): exits at `--dry-run: exiting now.` and lists the bindings CONTACT_EMAIL, DB `dcc-web`, AI and ASSETS. The only warning is the existing multi-environment `--env=""` advisory; there is no route or inherited-domain warning. Wrangler 4.149.0's dry run does not print triggers, so the resolution above is the evidence for the route.

`... --env preview`: no warnings. Bindings are DB `dcc-web-preview`, ALLOW_TURNSTILE_TESTING and SITE_ENVIRONMENT `preview`, and there is no inherited-custom-domain warning.

Generated `wrangler.e2e.json`: no `routes` at the top level or in `env.preview`; no `ai` and no `$schema`.

## Follow-ups for the PR body

- Setup check: read the Worker's attached Custom Domains through `GET /accounts/{account_id}/workers/domains` and compare them with `wrangler.jsonc` `routes`.
- Optional: pass `--env=""` in `scripts/deploy/production.ts` to silence the multi-environment warning, which was already there before this branch.
- Optional: tighten the bare-domain test to catch string and `zone_name` route forms (LOW 1).
- After-merge `[PREVIEW-CHECK]` items from the plan:
  - The Workers Builds production log shows `www.doncoleman.ca (custom domain)` with no permission error. The zone scope of the deploy token is the main risk.
  - Domains & Routes lists `www` only.
  - The `dcc-web-preview` main deploy attaches no Custom Domain.
