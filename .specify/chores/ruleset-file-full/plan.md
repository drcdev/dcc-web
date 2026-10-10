# Chore plan: ruleset-file-full (closes #149)

Branch: `chore/ruleset-file-full`. The PR says **`Closes #149`**.

## Goal

Issue https://github.com/drcdev/dcc-web/issues/149: the committed ruleset file
`setup/github-ruleset.json` does not match the live `main-protection` ruleset (id 24156251).
The live ruleset has settings the file leaves out. The most important are merge commits as the
only allowed merge method and the extra approval for unattributed (Copilot) pull requests. A
ruleset `PUT` replaces the whole `rules` array, so applying the file today
(`gh api -X PUT repos/drcdev/dcc-web/rulesets/24156251 --input setup/github-ruleset.json`) would
silently drop those settings. This chore makes the file hold every writable field of the live
ruleset, literally, so that a `PUT` of the file is a no-op against the live state. It also adds a
cheap unit guard so the file cannot quietly lose these parameters again, and refreshes the docs
that warn against a `PUT` of the file. Nothing live is changed. Visitors see no change.

**Orchestrator's call (recorded):** the file matches the live ruleset's writable fields
literally, including `conditions.ref_name.include: ["~DEFAULT_BRANCH"]` in place of
`["refs/heads/main"]`. The setup check already accepts `~DEFAULT_BRANCH`
(`scripts/setup-check/checks/github-main-protection.ts:44-53`, `coversMain`), and `main` is the
default branch, so both spellings protect the same ref.

## Acceptance

Before (read-only `gh api repos/drcdev/dcc-web/rulesets/24156251`, 2026-10-10, compared with the
file at `0643c24`):

- file `conditions.ref_name.include` is `["refs/heads/main"]`; live is `["~DEFAULT_BRANCH"]`;
- file `pull_request.parameters` lacks `required_reviewers: []`,
  `require_last_push_approval: false`, `require_extra_approval_for_unattributed_changes: true`
  and `allowed_merge_methods: ["merge"]`;
- file `required_status_checks.parameters` lacks `do_not_enforce_on_create: false`;
- everything else already matches (name, target, enforcement, `bypass_actors: []`, `deletion`,
  `non_fast_forward`, `strict_required_status_checks_policy: false`, `verify` pinned to
  `integration_id` 15368).

After:

1. This read-only comparison prints nothing (the file equals the live writable fields, key order
   aside):

   ```sh
   diff <(jq -S . setup/github-ruleset.json) \
        <(gh api repos/drcdev/dcc-web/rulesets/24156251 \
            | jq -S '{name, target, enforcement, conditions, rules, bypass_actors}')
   ```

2. A new unit test (W1) over `setup/github-ruleset.json` fails against the file at `0643c24` and
   passes after W1. It asserts the file is a complete `PUT` body for the two parameterised rules
   and that the merge-method and unattributed-approval settings are not weakened.
3. `tests/fixtures/providers/github/ruleset-full.json` (the recorded "complete" live response)
   carries the live shape, including `~DEFAULT_BRANCH`, and the existing "complete" test in
   `tests/unit/setup-check/checks/github-main-protection.test.ts` still passes against it.
4. `scripts/setup-check/schemas.ts` is unchanged, and `pnpm setup:check` still validates the file
   without error (`validateSetupJson` in `scripts/setup-check/cli.ts:197-211`).
5. `docs/setup.md` §12 and `.claude/skills/setup-walkthrough/SKILL.md` say a `PUT` of the file
   to the existing ruleset is safe; `specs/001-setup-walkthrough/research.md` R9 gets a dated
   note (2026-10-10, #149) that the file now holds the live-only parameters.
6. No live mutating `gh api` call is made by the pipeline (no `PUT`, no `POST`).
7. `pnpm run verify:quick` is green after each item. Editing `setup/github-ruleset.json` puts the
   PR in the full verify tier (`tests/unit/ci/changed-paths.test.ts:39,277`).

## Scope

**In:** W1 to W3 below.

**Out:**

- Any live ruleset change. The `PUT` becomes safe, but nobody needs to run it: the live state is
  already what the file now says.
- New gaps in the `github-main-protection` check (for example "merge commits only" or
  "unattributed approval"). The check evaluates the live ruleset against a closed list of 9 gaps
  from the 001 spec; widening that list is a spec change, not this chore.
- A scheduled drift check that compares the live ruleset with the file (the Acceptance 1 command
  is a manual check only).
- Tightening `githubRulesetSchema` (see W1 "Schema decision").
- The repository-level merge settings (`allow_squash_merge`, `allow_rebase_merge`). They live on
  the repository, not the ruleset, and are unchanged.
- `tests/unit/setup/schemas.test.ts` (its inline object tests shape, not the file),
  `ruleset-partial.json`, `ruleset-wrong-branch.json`, `ruleset-excludes-main.json`, and
  historical records under `specs/` (other than the R9 note), `.specify/chores/*` and
  `.specify/bugs/*`, including the drop-up-to-date-rule plan's "Live change for Don" warning,
  which was true when written.

**Follow-ups for the PR body:**

1. Consider a scheduled read-only drift check (live ruleset vs file), the residual risk R9 still
   lists.
2. Consider adding "merge commits only" to the setup check's closed gap list through a spec
   change, if Don wants the live setting confirmed, not just recorded.

## Constitution Check

- **I. Test-First:** W1 writes the guard test first and sees it fail against the current file,
  then edits the file. W2 edits a fixture under an existing test. W3 is docs, with a
  `no behaviour` line.
- **II. Automated Release Gate:** strengthened, not weakened. `verify` stays required and pinned;
  the file can no longer drop live protections when applied. The PR runs the full tier.
- **III. Human Review of Every Change:** one flow; auto-merge armed after the final push, merges
  on Don's approval. Nothing needs a preview check.
- **IV. First-Party Before Custom:** uses GitHub's own ruleset REST shape (docs cited below); no
  custom script. The guard is a plain unit test over a config file.
- **V. Static by Default:** not affected.
- **VI. Content as Files:** not affected.
- **VII. Private Data:** not affected; no secrets touched or printed. The read-only `gh api` GET
  returns no secret.
- **VIII. Cloudflare Best Practices:** not affected.
- **IX. Cost Ceiling:** not affected; no recurring cost.
- **X. Accessible, Fast and Private:** not affected; no page changes.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, plan in
  `.specify/chores/ruleset-file-full/`.

## Work items

### [x] W1 Committed ruleset holds every live writable field, with a unit guard

- **Files:**
  - `tests/unit/setup/drift.test.ts`: new `describe("committed ruleset is a complete PUT body")`
    next to the existing "ruleset contexts <-> CI job names" block (lines 100-112), which already
    reads the file. It asserts:
    - the `pull_request` rule's `parameters` has every key of the REST `pull_request` parameter
      set the live ruleset returns: `required_approving_review_count`,
      `dismiss_stale_reviews_on_push`, `required_reviewers`, `require_code_owner_review`,
      `require_last_push_approval`, `required_review_thread_resolution`,
      `require_extra_approval_for_unattributed_changes`, `allowed_merge_methods`;
    - `allowed_merge_methods` equals `["merge"]` (the repository's merge-commits-only rule in
      `CLAUDE.md` Merging);
    - `require_extra_approval_for_unattributed_changes` is `true`;
    - the `required_status_checks` rule's `parameters` has a boolean
      `do_not_enforce_on_create`.

    The test comment says why: a ruleset `PUT` replaces the `rules` array, so a key missing from
    the file is reset when the file is applied (#149). It uses no `specs/` path literal (drift
    guard).
  - `setup/github-ruleset.json`: set `conditions.ref_name.include` to `["~DEFAULT_BRANCH"]`; add
    `required_reviewers: []`, `require_last_push_approval: false`,
    `require_extra_approval_for_unattributed_changes: true`, `allowed_merge_methods: ["merge"]`
    to `pull_request.parameters`; add `do_not_enforce_on_create: false` to
    `required_status_checks.parameters`. Keep the live key order. No read-only fields (`id`,
    `node_id`, `source_type`, `source`, `created_at`, `updated_at`, `current_user_can_bypass`,
    `_links`).
- **Test:** new-first. Write the describe block, run `tests/unit/setup/drift.test.ts`, see it
  fail on the missing keys, edit the file, see it pass. Then run Acceptance 1 (read-only GET) and
  confirm an empty diff.
- **Layer:** unit (`docs/testing.md` "Where a test goes": the behaviour is a property of a
  committed config file, which a unit test reads directly; no build, browser or provider call can
  observe it more cheaply). No second layer.
- **Invariants, not mirrors (#97):** the key-presence assertion is the invariant "the file is a
  complete `PUT` body", not a restated value. The two value assertions are rules that must hold
  (merge commits only, no weaker Copilot approval), the same kind as "read-only permissions" in
  `docs/testing.md`. The test does not pin the include pattern, approval count or anything else
  the setup check already guards.
- **Schema decision:** `scripts/setup-check/schemas.ts` (`githubRulesetSchema`) stays unchanged.
  Its parameter objects are non-strict `z.object`s, so the new keys already pass, and
  `include: z.array(z.string().min(1)).min(1)` accepts `~DEFAULT_BRANCH`. GitHub validates the
  values on import, and the W1 test is the guard against losing them. Adding the fields to the
  schema would duplicate the guard in a second place for no extra protection.

### [x] W2 Recorded "complete" fixture carries the live shape

- **Files:** `tests/fixtures/providers/github/ruleset-full.json`: same edits as W1 (include
  `~DEFAULT_BRANCH`, the four `pull_request` keys, `do_not_enforce_on_create`), keeping its `id`.
  `ruleset-wrong-branch.json` and `ruleset-excludes-main.json` are left alone: they test the
  condition logic with explicit refs.
- **Test:** existing. The "complete" test (`github-main-protection.test.ts:56`) and the
  verify-pin test (line 99, which clones the fixture) must still pass. They now exercise the
  `~DEFAULT_BRANCH` branch of `coversMain`, which no fixture covered before. The check's code
  already handles it, so this is not a red-first item.
- **Layer:** unit (the check is pure evaluation of a recorded provider response).

### [ ] W3 Docs stop warning that a PUT of the file is unsafe

- **Files:**
  - `docs/setup.md` §12 (#github-main-protection, "Where to do it", about lines 318-320): keep the
    `POST` for a first import and add that an existing ruleset is updated with
    `gh api -X PUT repos/drcdev/dcc-web/rulesets/<id> --input setup/github-ruleset.json`, which is
    safe because the file holds the full ruleset (#149).
  - `.claude/skills/setup-walkthrough/SKILL.md` (about line 81): the same one-line `PUT` note
    beside the `POST` command, still "shown for Don to run himself".
  - `specs/001-setup-walkthrough/research.md` R9: a dated sub-bullet (2026-10-10, #149) after the
    first bullet: the file now holds every writable field of the live ruleset (merge commits
    only, extra approval for unattributed changes, `~DEFAULT_BRANCH`), so a `PUT` of the file is
    a no-op and the warning above is superseded. The original text stays as written.
  - `CLAUDE.md` Merging, "What branch protection enforces": add "merge commits only, and an extra
    approval for a Copilot PR not attributed to a person" to the list.
- **Test:** `no behaviour: n/a (documentation and agent notes; docs/setup.md section anchors are
  unchanged, so the registry <-> docs coverage test in drift.test.ts is unaffected)`.
- **Layer:** n/a.

Work items: 3.

## Docs citations

- GitHub REST, "Update a repository ruleset" (`PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}`),
  https://docs.github.com/en/rest/repos/rules#update-a-repository-ruleset, fetched 2026-10-10.
  Body fields are `name`, `target`, `enforcement`, `bypass_actors`, `conditions` and `rules`; the
  file uses exactly these. Under `rules` → `pull_request` → `parameters` the page documents:
  - `allowed_merge_methods` (array of strings): "Array of allowed merge methods. Allowed values
    include merge, squash, and rebase. At least one option must be enabled." `["merge"]` is valid.
  - `require_last_push_approval` (boolean, required): "Whether the most recent reviewable push
    must be approved by someone other than the person who pushed it."
  - `required_reviewers` (array of objects, beta): "A collection of reviewers and associated file
    patterns." An empty array is valid.
  - `required_approving_review_count`, `dismiss_stale_reviews_on_push`,
    `require_code_owner_review`, `required_review_thread_resolution` (all required).

  Under `required_status_checks` → `parameters`: `do_not_enforce_on_create` (boolean, optional):
  "Allow repositories and branches to be created if a check would otherwise prohibit it."
  Under `conditions` → `ref_name` → `include`: "Also accepts ~DEFAULT_BRANCH to include the
  default branch or ~ALL to include all branches."
- **`require_extra_approval_for_unattributed_changes` is not in the REST reference.** It is
  absent from the rendered page and from the published OpenAPI description
  (`github/rest-api-description`, `api.github.com.json`, fetched 2026-10-10). GitHub returns it
  on the live `GET`, and "Available rules for rulesets",
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets,
  section "Additional approval for unattributed Copilot pull requests", describes the setting:
  it "is enabled by default, for both new and existing rulesets. When Copilot opens a pull
  request that isn't attributed to a person, the ruleset requires one more approval than the
  number you configured." See Risks for why keeping it in the file is still the right call.
- No Astro or Cloudflare choice is involved, so no Astro or Cloudflare docs are cited.

## Risks

- **Undocumented parameter on `PUT`.** `require_extra_approval_for_unattributed_changes` is
  returned by the API but not in the REST reference, so its acceptance as `PUT` input is not
  documented. Both outcomes are safe: if GitHub rejects it, the `PUT` fails loudly (422) and
  changes nothing; if it accepts or ignores it, the setting stays `true` (the documented default
  for new and existing rulesets). Dropping it from the file instead would hide a live setting,
  which is what #149 is about. The pipeline does not run a `PUT` to find out (no live mutation).
- **`~DEFAULT_BRANCH` vs `refs/heads/main`.** They protect the same ref while `main` is the
  default branch. If the default branch were ever renamed, the ruleset would follow the new
  name, which matches the live behaviour Don already has. The setup check accepts both.
- **Full verify tier.** Editing `setup/github-ruleset.json` sorts the PR to the full tier, so CI
  takes the full gate time. Expected and harmless.
- **Live drift after this PR.** If the live ruleset is changed in the dashboard later, the file
  drifts again; the W1 guard only stops the file losing keys, it does not read the live state.
  Acceptance 1's command is the manual check; a scheduled check is a follow-up.
- **Beta field.** `required_reviewers` is marked beta in the REST reference. An empty array is the
  live value; if GitHub changes its shape, a `PUT` fails loudly rather than silently.
