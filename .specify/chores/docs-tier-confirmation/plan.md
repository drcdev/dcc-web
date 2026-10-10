# Chore plan: docs-tier-confirmation

Branch: `chore/docs-tier-confirmation`, from `main` at e6bf21b (after #135 merged).
Closes [#133](https://github.com/drcdev/dcc-web/issues/133).

## Goal

The docs-only CI tier from #127 (PR #131) had not been seen working on a real run. The five
"Post-merge verification" checks in `specs/031-docs-only-gate/spec.md` are now confirmed from real
runs (gathered read-only in the explore phase), and all five pass. This chore records the results
where the spec says they go: against each check in the spec, and as a comment on issue #127 (per
`quickstart.md`, "On GitHub"). It changes no code, workflow or test. If a check had failed, the fix
would be its own change; none did. One unrelated e2e flake seen along the way becomes a follow-up
issue.

## Acceptance

1. `specs/031-docs-only-gate/spec.md` "Post-merge verification (follow-up)" marks each of the five
   checks done, with its run id(s), the logged tier line, and the wall time where the check has a
   time limit (first job start to `verify` end).
2. Check 2 states honestly that the `tier=full` reason named
   `.claude/skills/setup-walkthrough/SKILL.md` (the first path in order that is not skip-safe,
   documentation or content-only; it is in `READ_BY_CHECKS`), not the `src/` file; the spec's
   wording assumed a two-file PR. Run 38024829035 (PR #135, naming `public/_headers`) is noted as
   corroboration.
3. Check 4 records that both overlapping `main` runs completed `verify` without cancellation, and
   that the #134 run concluded failure from an unrelated Playwright flake (named, with the passing
   reruns), so SC-005 (completion, not cancellation) holds.
4. The issue #127 comment text is drafted in this plan (W2) and posted by the orchestrator at
   Finish.
5. `git diff --name-only main` lists only `specs/031-docs-only-gate/spec.md` and
   `.specify/chores/docs-tier-confirmation/**`. Nothing under `src/`, `worker/`, `scripts/`,
   `tests/`, `.github/`, `.claude/` or `docs/`.
6. This PR's own CI run logs `tier=skip-safe` (every changed path is under `specs/` or
   `.specify/` with a skip-safe extension), runs secretlint only and passes `verify`. That is
   extra evidence for the remaining tier, noted in the PR body.

## Scope

**In:** W1 (spec record) and W2 (orchestrator comment on #127).

**Out (follow-ups for the PR body):**

- **e2e flake:** `tests/e2e/projects-fixtures.spec.ts:112` "going back from a story restores the
  index with its ?theme=" failed once on `main` run 38024788337 with `page.goBack: Protocol error
  (Page.getNavigationHistory): Not attached to an active page` (1 failed / 1463 passed); the same
  content passed on PR run 38024136289 and on the next `main` run. Open an issue for it.
- **Tier reason (optional):** the `tier=full` reason names only the first qualifying path. Whether
  it should name every such path is a small separate change, if Don wants it.
- **PR #138** (open, `chore/retire-launch-checks`) retires setup checks including
  `launch-main-checks` and edits `specs/011`; it does not touch `specs/031`, so no overlap. Check 5
  is recorded as it stands today.

## Constitution Check

- **I. Test-First:** no behaviour changes, so no test is added; the change is a documentation
  record. The drift guard forbids `specs/` path literals in tests, so the record lives in the spec.
- **II. Automated Release Gate:** no check is skipped or weakened; nothing in the gate changes.
- **III. Human Review for Major Changes:** none of the criteria fires. No dependency, contact-data,
  design, cost or constitution change, and CI configuration is read from real runs, not edited.
  **Verdict: not major.**
- **IV. First-Party Before Custom:** unchanged; no tool choice made.
- **V. Static by Default:** unchanged.
- **VI. Content as Files:** unchanged; no site content changes.
- **VII. Private Data:** unchanged.
- **VIII. Cloudflare Best Practices:** unchanged.
- **IX. Cost Ceiling:** unchanged; the confirmed docs tier lowers CI minutes per docs PR.
- **X. Accessible, Fast and Private:** unchanged; no page output changes.
- **XI. Spec Kit Workflow:** one chore on its own `chore/<slug>` branch via `/chore`; it closes the
  031 spec's follow-up section.

## Work items

### [x] W1 — Record the post-merge results in the 031 spec

- **Files:** `specs/031-docs-only-gate/spec.md` ("Post-merge verification (follow-up)",
  lines ~369–390).
- **What:** keep the five numbered checks and their wording. Add a dated line under the intro
  ("Confirmed 2026-10-09 from real runs, issue #133") and, under each check, an indented
  **Result** line:
  1. **PASS.** Run 38023035528, PR #132 (2 `docs/` and 2 `.specify/chores/` files): `tier=docs: 2
     documentation file(s) and 2 skip-safe file(s), running secretlint and the unit tests`, then
     "Changed files:" one per line. `changes` and `static` succeeded, `build-tests` and `e2e`
     skipped, `verify` passed in 75 s.
  2. **PASS, with a wording note.** Run 38029587425, PR #138 (`docs/` plus `src/lib/site-origin.ts`,
     `src/content/projects/flux.mdx`, `scripts/`, `tests/` and a `.claude/` skill): `tier=full:
     .claude/skills/setup-walkthrough/SKILL.md is not skip-safe, documentation or content-only,
     running the full gate`; `build-tests` and `e2e` ran. The reason names the first such path in
     order (here a `READ_BY_CHECKS` file), not specifically the `src/` file; the check's "naming
     the `src/` file" assumed a two-file PR. Run 38024829035 (PR #135, `docs/` plus
     `public/_headers`) also sorted to full, naming `public/_headers`.
  3. **PASS.** Run 38024085668 (merge of #132): `tier=docs`, the same four files listed from
     `before` to the pushed commit, `build-tests` and `e2e` skipped, `verify` passed in 80 s. Code
     merges ran the full gate: 38022980128 (#131, `ci.yml`), 38024788337 (#134, `tier=full:
     package.json …`, 6 files) and 38025226789 (#135, 16 files).
  4. **PASS.** #134 merged 04:38:44Z and #135 04:46:24Z; their `main` runs 38024788337
     (04:38:47–04:48:56) and 38025226789 (04:46:26–04:56:35) overlapped and each ended with a
     completed `verify`; neither was cancelled (the concurrency group keys non-PR events on
     `github.sha`; cancel-in-progress applies to pull requests only). The #134 `verify`
     concluded failure from an unrelated e2e flake (`projects-fixtures.spec.ts` "going back from
     a story restores the index with its ?theme=", `page.goBack` "Not attached to an active
     page", 1 of 1463), which passed on PR run 38024136289 and the next `main` run; SC-005 is
     about completion, so it holds. Two overlapping merges were observed, not three.
  5. **PASS.** `launch-main-checks` reads the newest `verify` check run on `main` and passes on
     success; it reports `[x] complete … The newest verify run on main succeeded.` The docs-tier
     `main` run 38024085668 had `verify` success, which is all the check reads.
  Change the closing sentence to note that no check failed, so no fix change was needed.
- **Test:** no behaviour: n/a (documentation record).

### [ ] W2 — Results comment on issue #127 (orchestrator, at Finish)

- **Files:** none (a GitHub comment, posted by the orchestrator after the PR opens).
- **What:** post this on #127 with `gh issue comment 127 --body-file <file>`:

  > Post-merge verification for the docs-only tier (spec.md "Post-merge verification",
  > quickstart.md "On GitHub"), confirmed 2026-10-09 in #133 / PR <n>. All five pass.
  >
  > 1. Docs-only PR: run 38023035528 (PR #132) logged `tier=docs`, skipped build-tests and e2e,
  >    verify passed in 75 s.
  > 2. Docs plus code: run 38029587425 (PR #138) logged `tier=full`. The reason names the first
  >    path that is not docs or skip-safe (`.claude/skills/setup-walkthrough/SKILL.md`), not
  >    the `src/` file specifically. Run 38024829035 (PR #135) also went full, naming
  >    `public/_headers`.
  > 3. Docs-only merge: main run 38024085668 logged `tier=docs` with the same four files,
  >    verify passed in 80 s. Code merges (#131, #134, #135) ran the full gate.
  > 4. No cancellation: the overlapping main runs for #134 and #135 each completed verify. The
  >    #134 run failed on an unrelated e2e flake (projects-fixtures goBack), tracked in #<flake
  >    issue>.
  > 5. `launch-main-checks` reports complete; the docs-tier main run's verify succeeded.
  >
  > PR <n> itself sorted to `tier=skip-safe`.

  Fill `<n>` and `<flake issue>` once known.
- **Test:** no behaviour: n/a (issue comment).

## Docs citations

None. No tool, library or platform usage changes.

## Risks

- **Spec drift with #138:** #138 edits `specs/011`, not `specs/031`; no conflict expected. If it
  merges first and retires `launch-main-checks`, check 5 still records what was true on
  2026-10-09.
- **Verify step:** the diff has no code, and CI sorts it to the skip-safe tier. A local full
  `pnpm run verify` exercises nothing this PR changes; the orchestrator puts that to Don rather
  than running it by default.
- **Run evidence ages out:** GitHub keeps run logs for a limited time, so the spec quotes the tier
  lines rather than relying on the links alone.
