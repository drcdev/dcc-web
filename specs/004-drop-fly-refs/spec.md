# Feature Specification: Drop Fly.io references from specs and setup guide

**Feature Branch**: `004-drop-fly-refs`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "update the specs and docs/setup.md to drop Fly.io references"

## Context

Constitution v2.0.0 (amendment in PR #13) moves the contact API from Fly.io in Toronto to
TypeScript in the site's Cloudflare Worker, handling `/api/*`, with Cloudflare D1 for storage.
It renames Principle VII to "Private Data: Minimal and Protected", replaces Principle VIII
"Fly.io Best Practices" with "Cloudflare Best Practices", and drops the requirement that data
stay in Canada. The storage location is now recorded in the contact feature's plan, and the
privacy policy states it.

The earlier feature artifacts (specs 001-003) and the setup guide (`docs/setup.md`) still
describe the old arrangement. This change brings their wording into line with v2.0.0. It is a
documentation change only: no code, test, configuration or site content changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agents read artifacts that match the constitution (Priority: P1)

An agent (or Don) building the contact feature, or re-reading an earlier feature, reads the
specs, plans, checklists and setup guide. Every mention of the contact API, its storage and the
principles it falls under agrees with constitution v2.0.0, so nobody is steered back towards
Fly.io, a Toronto region or a Canada-only storage rule.

**Why this priority**: Conflicting artifacts are the reason for the change. The constitution
wins over them, but agents read the artifacts first and can act on the stale wording.

**Independent Test**: Search `specs/` and `docs/` for Fly.io, `fly.toml`, Fly volumes, `yyz`,
Canada and Toronto. The only matches left are the exceptions listed in FR-005.

**Acceptance Scenarios**:

1. **Given** the Constitution Check tables in the plans for 001, 002 and 003, **When** they are
   read, **Then** Principle VIII is titled "Cloudflare Best Practices" with a "not applicable"
   note that no longer mentions Fly.io, and the 003 Principle VII row describes storage without
   naming Toronto.
2. **Given** `docs/setup.md`, **When** the "Constitution principle" lines for the local
   credentials and secret scanning items are read, **Then** they cite "VII (Private Data:
   Minimal and Protected)".
3. **Given** the out-of-scope and follow-up notes in the 001 and 002 specs, **When** they are
   read, **Then** the contact service is described as TypeScript in the site's Cloudflare Worker
   under `/api/`, with Cloudflare D1 storage, and no Fly.io app, volume or region is named.
4. **Given** the 003 spec, plan and privacy checklist, **When** the privacy policy content
   requirements are read, **Then** they say submissions are stored in Cloudflare D1 and that the
   privacy policy states the storage location recorded in the contact feature's plan, without
   asserting Canada, Toronto or Fly.io.

### Edge Cases

- Historical task records: `specs/003-standalone-pages/tasks.md` records work already done
  (the privacy policy and technology page copy that says Toronto, Canada). Rewriting completed
  tasks would misstate what was built, so those task lines stay as they are.
- The shipped privacy policy and technology page, and the unit test that checks them for
  "Canada or Toronto", still describe Toronto storage. They are out of scope here (see
  Follow-up), so the 003 spec will differ from the live copy until the contact feature updates it.
- This spec names Fly.io, Canada and Toronto to describe the change, so its own directory is
  excluded from the search.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every citation of Principle VII or VIII in `specs/001-setup-walkthrough/plan.md`,
  `specs/002-site-foundation/plan.md`, `specs/003-standalone-pages/plan.md` and
  `docs/setup.md` MUST use the v2.0.0 titles ("Private Data: Minimal and Protected" and
  "Cloudflare Best Practices"), and each "not applicable" note MUST refer to Cloudflare Worker,
  D1 or Cron Trigger resources instead of Fly.io.
- **FR-002**: The contact service notes in `specs/001-setup-walkthrough/spec.md` (out-of-scope
  list) and `specs/002-site-foundation/spec.md` (follow-up list) MUST describe the contact API as
  TypeScript in the site's Cloudflare Worker under `/api/`, with Cloudflare D1 storage (naming
  the D1 database, Worker secrets and Turnstile keys where the note lists setup items), and MUST
  NOT name Fly.io, a Fly volume or a region.
- **FR-003**: `specs/003-standalone-pages/spec.md` (acceptance scenario 2 of the privacy story,
  FR-022 and its contact-form bullet, and the contact-data assumption),
  `specs/003-standalone-pages/plan.md` (Principle VII row and the launch-content test
  description) and `specs/003-standalone-pages/checklists/privacy.md` (CHK004) MUST say that
  submissions are stored in Cloudflare D1 and that the privacy policy states the location
  recorded in the contact feature's plan. They MUST NOT assert a storage country, city or region,
  and MUST NOT mention Fly.io.
- **FR-004**: The change MUST NOT alter anything outside the files named in FR-001 to FR-003,
  apart from this feature's own directory and `.specify/feature.json`. It leaves the
  constitution, site content, tests, code, configuration and
  `specs/003-standalone-pages/tasks.md` unchanged, and keeps each edited passage's meaning apart
  from the hosting and storage facts.
- **FR-005**: After the change,
  `grep -rn -i -E "fly\.io|fly\.toml|fly volume|\byyz\b|canada|toronto" specs docs` MUST return
  matches only in `specs/004-drop-fly-refs/` and `specs/003-standalone-pages/tasks.md`.

### Accessibility and appearance

- Accessibility: every page must meet WCAG 2.2 AA (Principle X). This change edits only
  Markdown files under `specs/` and `docs/`, which are not built into the site, so no page's
  accessibility changes.
- Appearance: no rendered page changes appearance. No visual baselines need refreshing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The search in FR-005 returns zero matches outside the two allowed locations.
- **SC-002**: All six principle citations named in FR-001 (three plan rows for VIII, the 003
  plan row for VII, and two `docs/setup.md` lines) match v2.0.0.
- **SC-003**: The diff touches only the files named in FR-001 to FR-003, plus
  `specs/004-drop-fly-refs/` and `.specify/feature.json`.
- **SC-004**: The built site is unchanged: no page, test or visual baseline differs.

## Assumptions

- Constitution v2.0.0 on branch `docs/constitution-v2-cloudflare` (PR #13) is the governing
  text for this change, even though it has not merged to `main` yet.
- Wording follows the constitution's plain-language rule: short factual sentences, no hype.
- Where an old note said a principle was not applicable because no Fly.io service was involved,
  the new note says no Cloudflare Worker code, D1 database or Cron Trigger is involved.

## Follow-up (out of scope)

- `src/content/pages/privacy-policy.mdx` and `src/content/pages/technology.mdx` still say
  submissions are stored in Toronto, Canada, and do not pass through any service outside
  Canada. `tests/unit/content/launch-content.test.ts` checks that copy for "Canada or Toronto".
  Don scoped this change to specs and `docs/setup.md`; the copy and its test should change with
  the contact feature, once the D1 location is recorded in its plan.
- If PR #13 changes before it merges, re-check the principle titles used here.
