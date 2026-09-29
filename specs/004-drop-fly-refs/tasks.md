# Tasks: Drop Fly.io references from specs and setup guide

**Input**: `specs/004-drop-fly-refs/` (spec.md, plan.md, quickstart.md)
**Tests**: No automated test is added. Plan approach (b) for Principle I: documentation is not an artifact type Principle I covers, and a specs-reading test would force a CI configuration change (a major change). Verification is the grep, citation and diff-scope checks in quickstart.md, run before and after the edits. No visual baselines: no rendered page changes.
**Wording source**: constitution v2.0.0 (`git show origin/docs/constitution-v2-cloudflare:.specify/memory/constitution.md`). Do not modify the constitution. Find each passage by content; line numbers in plan.md are only a guide.

Wording rules: Principle VII is "Private Data: Minimal and Protected"; Principle VIII is "Cloudflare Best Practices"; "not applicable" notes say no Cloudflare Worker code, D1 database or Cron Trigger is involved; contact service notes say TypeScript in the site's Cloudflare Worker under `/api/` with Cloudflare D1 storage (and, where setup items are listed, the D1 database, Worker secrets and Turnstile keys); privacy passages say submissions are stored in Cloudflare D1 and the privacy policy states the location recorded in the contact feature's plan. Assert no storage country, city or region. Keep each passage's meaning apart from hosting and storage facts. Do not edit `specs/003-standalone-pages/tasks.md`.

## Phase 1: User Story 1 - Artifacts match constitution v2.0.0 (Priority: P1)

**Goal**: Specs 001-003 and `docs/setup.md` agree with constitution v2.0.0 on the contact API, its storage and the principle titles.

**Independent Test**: The FR-005 grep returns no output; the diff touches only the eight named files plus this feature's directory and `.specify/feature.json`.

### Baseline check (before any edit)

- [X] T001 [US1] Run the quickstart.md step 1 grep from the repo root (`grep -rn -i -E "fly\.io|fly\.toml|fly volume|\byyz\b|canada|toronto" specs docs | grep -v -E "^specs/004-drop-fly-refs/|^specs/003-standalone-pages/tasks\.md:"`) and confirm it currently FAILS, meaning it finds matches in the eight files listed in plan.md. Record the match count and file list in your task notes. If it finds no matches, stop and report.

### Edits

- [X] T002 [P] [US1] In `specs/001-setup-walkthrough/plan.md`, update the Principle VIII row of the Constitution Check to "Cloudflare Best Practices" with a "not applicable" note about Worker code, D1 or Cron Trigger; change any remark that the check's registry lets the contact feature "add Fly items" to "add its Cloudflare items".
- [X] T003 [P] [US1] In `specs/001-setup-walkthrough/spec.md`, rewrite the out-of-scope contact service note to describe TypeScript in the site's Cloudflare Worker under `/api/` with Cloudflare D1 storage, naming the D1 database, Worker secrets and Turnstile keys where it lists setup items; no Fly.io app, volume or region.
- [X] T004 [P] [US1] In `specs/002-site-foundation/plan.md`, update the Principle VIII row to "Cloudflare Best Practices" with the new "not applicable" note.
- [X] T005 [P] [US1] In `specs/002-site-foundation/spec.md`, rewrite the follow-up contact feature note to the Cloudflare Worker `/api/` and D1 wording (FR-002).
- [X] T006 [P] [US1] In `specs/003-standalone-pages/plan.md`, update the Principle VII row (title "Private Data: Minimal and Protected", storage in Cloudflare D1, no city, country or region), the Principle VIII row ("Cloudflare Best Practices", new "not applicable" note) and the launch-content test description (drop the Canada or Toronto assertion wording; refer to the location recorded in the contact feature's plan).
- [X] T007 [P] [US1] In `specs/003-standalone-pages/spec.md`, update privacy story acceptance scenario 2, FR-022 and its contact-form bullet, and the contact-data assumption to say submissions are stored in Cloudflare D1 and the privacy policy states the location recorded in the contact feature's plan (FR-003).
- [X] T008 [P] [US1] In `specs/003-standalone-pages/checklists/privacy.md`, rewrite CHK004 to the same D1 and recorded-location wording.
- [X] T009 [P] [US1] In `docs/setup.md`, change both "Constitution principle" citations of Principle VII (local credentials item and secret scanning item) to "VII (Private Data: Minimal and Protected)".

### Verification (after all edits)

- [X] T010 [US1] Re-run the quickstart.md step 1 grep and confirm zero output (SC-001, FR-005). Fix any remaining match in the covered files.
- [X] T011 [US1] Run quickstart.md step 2: confirm the three Principle VIII rows say "Cloudflare Best Practices", the two `docs/setup.md` lines say "VII (Private Data: Minimal and Protected)", and the 003 plan Principle VII row names no city, country or region (SC-002).
- [X] T012 [US1] Run quickstart.md step 3 (`git diff --name-only main...HEAD`, plus `git status --short` for uncommitted edits) and confirm only the eight files, `specs/004-drop-fly-refs/` and `.specify/feature.json` changed; in particular not `specs/003-standalone-pages/tasks.md`, `.specify/memory/constitution.md`, `src/` or `tests/` (SC-003, FR-004).

Step 4 of quickstart.md (`pnpm run verify`, SC-004) is the pipeline's verify phase, not a task here.

## Dependencies and parallelism

- T001 first. T002-T009 touch different files and run in parallel after T001. T010-T012 run after all edits.
- MVP scope: the whole list (single story).
