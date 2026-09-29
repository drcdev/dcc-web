# Implementation Plan: Drop Fly.io references from specs and setup guide

**Branch**: `004-drop-fly-refs` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-drop-fly-refs/spec.md`

## Summary

Bring the wording of the earlier feature artifacts (specs 001-003) and `docs/setup.md` into
line with constitution v2.0.0: the contact API is TypeScript in the site's Cloudflare Worker
under `/api/`, storage is Cloudflare D1 in the location recorded in the contact feature's plan,
Principle VII is "Private Data: Minimal and Protected" and Principle VIII is "Cloudflare Best
Practices". The approach is a set of in-place Markdown edits to the passages the spec names,
verified by the spec's grep search (FR-005) and a diff-scope check (SC-003). No code, test,
configuration or site content changes.

## Technical Context

**Language/Version**: Markdown only. No TypeScript, Astro or configuration is touched.

**Primary Dependencies**: None added or changed.

**Storage**: N/A. The edited text describes Cloudflare D1 storage; nothing is provisioned.

**Testing**: `tests/unit/content/launch-content.test.ts` covers the two pages' copy (updated
before the copy, seen failing, then passing). The spec's grep search (FR-005) and a
`git diff --name-only` scope check (SC-003), run as described in [quickstart.md](./quickstart.md). The existing `pnpm run verify`
gate still runs in CI because `docs/setup.md` is not a skip-safe path. No new automated test
(see Principle I below) for the specs and setup guide.

**Target Platform**: Repository documentation read by agents and Don; not built into the site.

**Project Type**: Documentation change in an Astro static site repository.

**Performance Goals**: N/A.

**Constraints**: Edit only the files named in FR-001 to FR-003 (plus this feature's directory
and `.specify/feature.json`). Leave `specs/003-standalone-pages/tasks.md`, the constitution,
site content and tests untouched. Plain-language wording (Development Workflow).

**Scale/Scope**: Eight spec and doc files, about a dozen passages, plus two site pages and one unit test:

| File | Passages |
|---|---|
| `specs/001-setup-walkthrough/plan.md` | Principle VIII row (line 65) |
| `specs/001-setup-walkthrough/spec.md` | Out-of-scope contact service note (line 236) |
| `specs/002-site-foundation/plan.md` | Principle VIII row (line 95) |
| `specs/002-site-foundation/spec.md` | Follow-up contact feature note (line 721) |
| `specs/003-standalone-pages/plan.md` | Principle VII row (74), Principle VIII row (75), launch-content test description (126) |
| `specs/003-standalone-pages/spec.md` | Privacy story scenario 2 (221), FR-022 (429) and its contact-form bullet (443-444), contact-data assumption (577) |
| `specs/003-standalone-pages/checklists/privacy.md` | CHK004 (line 14) |
| `docs/setup.md` | Principle VII citations (lines 58 and 258) |
| `src/content/pages/privacy-policy.mdx` | Contact form storage paragraph (line 25), description |
| `src/content/pages/technology.mdx` | Contact form paragraph (25), data table row (36), description |
| `tests/unit/content/launch-content.test.ts` | Privacy and Technology assertions (updated first) |

Line numbers are from commit `88481bf` and are a guide only; the implementer finds each passage
by content.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This check is made against **constitution v2.0.0**, the amendment open in PR #13
(`docs/constitution-v2-cloudflare`), not the v1.1.0 text on this branch. The spec's
Assumptions name v2.0.0 as the governing text. This branch does not modify the constitution.

| Principle | Result | Notes |
|---|---|---|
| **I. Test-First** | PASS (the launch-content unit test covers the page copy and was updated first; no new test for specs and docs, see below) | Principle I lists the artifacts it covers: content schemas, components, pages, the contact API, redirects, build configuration and deployment scripts. Specs and the setup guide are not among them, and this change alters no behaviour a test could describe. Verification is the spec's grep search (FR-005 / SC-001), the citation check (SC-002) and the diff-scope check (SC-003), run before the edits (to see the current matches) and after (to see none outside the allowed locations). The existing suite must still pass unchanged (SC-004). Rejected alternative recorded below. |
| **II. Automated Release Gate** | PASS | No check is skipped or weakened. `docs/setup.md` is not skip-safe in `scripts/ci/changed-paths.ts`, so the full `verify` job runs on this PR. |
| **III. Human Review for Major Changes** | PASS: **not a major change** | No criterion fires: no dependency, integration or service is added, removed or replaced; no contact data handling changes (only documentation describing a future feature); no design, layout, navigation or visual change; no cost change; no CI, deployment or infrastructure configuration change; the constitution is not amended on this branch. |
| **IV. First-Party Before Custom** | PASS (n/a) | No Astro or Cloudflare choice is made, so no Astro Docs MCP citation is needed. No custom code. |
| **V. Static by Default** | PASS (n/a) | No page, route or client script changes. |
| **VI. Content as Files** | PASS (n/a) | No site content changes. |
| **VII. Private Data: Minimal and Protected** | PASS | No data collected and no secrets touched. The edits make the 003 artifacts say what v2.0.0 says: submissions are stored in Cloudflare D1, and the privacy policy states the location recorded in the contact feature's plan. No storage country, city or region is asserted. |
| **VIII. Cloudflare Best Practices** | PASS (n/a) | No Worker code, D1 database or Cron Trigger is involved. This change makes earlier plans cite this principle by its v2.0.0 title. |
| **IX. Cost Ceiling** | PASS | Expected additional monthly cost: $0. |
| **X. Accessible, Fast and Private** | PASS (n/a) | Files under `specs/` and `docs/` are not built into the site; no page, performance budget or visual baseline changes. |
| **XI. Spec Kit Workflow** | PASS | Spec Kit branch and directory naming; one feature per branch in its own worktree. Replacing the "to be confirmed" location wording stays in the spec's Follow-up list. Parallel work: PR #13 edits only `.specify/memory/constitution.md`, which this branch does not touch, so the two do not conflict. |
| **Technology Constraints** | PASS | No new tools, services or libraries. |
| **Development Workflow** | PASS | Changes stay inside the spec's file list; wording is plain language. No Astro decision to cite. |

**Gate result (pre-research)**: PASS. **Re-check after Phase 1 design**: PASS. The only design
artifact is `quickstart.md` (verification commands); it adds no service, cost or data flow.

### Rejected alternatives

- **Option (a): a Vitest unit test asserting the eight files contain no Fly.io, `fly.toml`,
  Fly volume, `yyz`, Canada or Toronto wording.** Rejected. The repository has a precedent for
  tests that read `docs/setup.md` (`tests/unit/setup/docs-structure.test.ts`), but `specs/**/*.md`
  is skip-safe in `scripts/ci/changed-paths.ts`, and `tests/unit/ci/changed-paths.test.ts`
  ("no check reads a path the allowlist calls skip-safe") fails if any test reads a `specs/`
  path that is not deny-listed in `READ_BY_CHECKS`. Adding the seven spec files there would
  change CI configuration, which is a Principle III major change and outside this spec's FR-004
  file list, and would make every later edit to those specs run the full CI job. A test on
  `docs/setup.md` alone would cover two of the eight files and would permanently forbid words
  (for example "Canada") that a later setup item might legitimately need. The FR-005 grep gives
  the same assurance for this one-off correction.
- **Rewriting `specs/003-standalone-pages/tasks.md`.** Rejected per the spec's edge case: those
  lines record work already done.
- **Leaving the shipped privacy policy, technology page and `launch-content.test.ts` for the
  contact feature.** Rejected at Don's request: they are in scope (FR-006), worded without a
  location because the D1 location is not recorded yet.
- **Phase 0/1 artifacts beyond quickstart.md** (`research.md`, `data-model.md`, `contracts/`).
  Not produced: there are no unknowns to research, no entities and no interfaces.

## Project Structure

### Documentation (this feature)

```text
specs/004-drop-fly-refs/
├── spec.md              # Feature specification (committed, clarified)
├── plan.md              # This file
├── quickstart.md        # Verification commands (grep and diff-scope checks)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks; not created here)
```

### Source Code (repository root)

No source code changes. The files edited are:

```text
docs/
└── setup.md
specs/
├── 001-setup-walkthrough/
│   ├── plan.md
│   └── spec.md
├── 002-site-foundation/
│   ├── plan.md
│   └── spec.md
└── 003-standalone-pages/
    ├── plan.md
    ├── spec.md
    └── checklists/privacy.md
```

**Structure Decision**: In-place edits to existing Markdown files. Wording follows the spec's
FR-001 to FR-003 and its Assumptions: "not applicable" notes say no Cloudflare Worker code, D1
database or Cron Trigger is involved; contact service notes say TypeScript in the site's
Cloudflare Worker under `/api/`, with Cloudflare D1 storage (and, where a setup list is given,
the D1 database, Worker secrets and Turnstile keys); privacy passages say submissions are stored
in Cloudflare D1 and the privacy policy states the location recorded in the contact feature's
plan. The 001 plan's remark that the check's registry lets the contact feature "add Fly items"
becomes "add its Cloudflare items".

## Complexity Tracking

No constitution violations to justify.
