# Feature Specification: Launch the new doncoleman.ca

**Feature Branch**: `011-launch`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Launch the new doncoleman.ca. Switch doncoleman.ca from the current
Ghost site to the new site safely, and confirm it works."

## Context

Today `doncoleman.ca` and `www.doncoleman.ca` serve Don's Ghost site. The new site already runs
on its own review address and per-branch preview addresses, with the domain's DNS in Cloudflare
(setup items 3 to 6 in `docs/setup.md`). The existing "Live domain still Ghost" setup item
deliberately fails as soon as the domain points anywhere other than Ghost, and every response
from the new site currently tells search engines not to index it. This feature takes the
domain over: it proves the new site is ready, walks Don through the switch one confirmed step
at a time, keeps a fast way back to Ghost for the first days, confirms the live site works, and
then documents how to retire Ghost and the old theme's backend.

This is a **major change** under Constitution Principle III (it changes infrastructure and DNS,
retires external services, and changes CI). The pull request is labelled and waits for Don's
approval.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know the new site is ready before switching (Priority: P1)

Before touching DNS, Don runs one readiness checklist and sees, item by item, whether the new
site is ready: every expected page is present, the Ghost content has been migrated, no link
inside the site leads to a missing page, the contact form works end to end, and the automated
checks are passing on the main branch.

**Why this priority**: Switching an unready site is the biggest risk in the launch. The
readiness checks are useful on their own even if the switch waits.

**Independent Test**: Run the readiness checks against the current preview build and main
branch; each item reports pass or fail with a plain reason, and a deliberately broken internal
link makes the link check fail.

**Acceptance Scenarios**:

1. **Given** a preview build of the new site, **When** the automated site check runs in CI,
   **Then** every address listed in the site's own sitemap returns a page and every link
   between the site's own pages resolves, or the check fails and names each broken address and
   the page that links to it.
2. **Given** a change that introduces a link to a page that does not exist, **When** CI runs,
   **Then** the check fails and the change cannot merge.
3. **Given** the readiness checklist, **When** Don works through it, **Then** each item says what
   is checked, how it is confirmed (automatically or by Don), and its current result.
4. **Given** the automated checks on the main branch are failing, **When** Don reaches the
   readiness checklist, **Then** that item reports not ready and the walkthrough does not
   proceed to the switch.

---

### User Story 2 - Switch the domain with a guided, confirmed walkthrough (Priority: P1)

Don follows a numbered walkthrough for the switch. Each step says what to do, where to do it,
and how to confirm it worked. The agent pauses at every step that needs Don and never performs
account, sign-in, DNS or credential actions itself. Before the switch, the current DNS records
that point the bare domain and `www` at Ghost are recorded in the walkthrough so they can be
restored exactly.

**Why this priority**: The switch is the purpose of the feature; it must be safe and verifiable.

**Independent Test**: Read the walkthrough end to end: every step has a "what", a "where" and a
"how to confirm", the Ghost records are written down, and every step needing Don is marked as a
pause.

**Acceptance Scenarios**:

1. **Given** the readiness checklist is all green, **When** Don starts the switch, **Then** the
   walkthrough first shows the recorded Ghost records for the bare domain and `www` and the
   rollback steps, before any change is made.
2. **Given** Don has completed a manual step, **When** he runs the confirmation for that step,
   **Then** it reports clearly whether the step worked, and the walkthrough only moves on after
   it does.
3. **Given** any step, **When** the agent assists, **Then** Don never pastes a secret into the
   chat and the agent never signs in, creates accounts, changes DNS or handles credentials.

---

### User Story 3 - Switch back to Ghost quickly if something goes wrong (Priority: P1)

If the new site misbehaves in the first few days, Don can restore the recorded Ghost records by
following a short rollback section, and confirm that the domain serves Ghost again.

**Why this priority**: A safe launch needs a known way back; it must exist before the switch.

**Independent Test**: Read the rollback section: it lists the exact records to restore, where to
restore them, and a confirmation that the domain is back on Ghost.

**Acceptance Scenarios**:

1. **Given** the domain has been switched, **When** Don follows the rollback steps, **Then** the
   bare domain and `www` point at Ghost again and the existing "Live domain still Ghost"
   confirmation reports complete.
2. **Given** the rollback window, **When** Ghost is still running, **Then** rollback is possible;
   the walkthrough states that rollback stops being possible once Ghost is cancelled.

---

### User Story 4 - Confirm the live site works after the switch (Priority: P1)

Right after the switch, Don runs the setup check and sees whether the live domain serves the new
site over HTTPS, every page in the live sitemap loads, the contact endpoint responds, and the
domain's email records are unchanged.

**Why this priority**: The launch is not done until the live address is proven to work.

**Independent Test**: Run the post-launch checks against the live domain; each reports complete
or a plain "Problem:" summary.

**Acceptance Scenarios**:

1. **Given** the switch is done, **When** Don runs the post-launch checks, **Then** they report
   complete only if the bare domain serves the new build over HTTPS, every address in the live
   sitemap returns a page, the contact endpoint responds, and the mail records match the
   recorded baseline.
2. **Given** the mail records differ from the baseline, **When** the checks run, **Then** they
   report a problem naming the difference, and the walkthrough points to the rollback.
3. **Given** the switch has not happened yet, **When** the setup check runs, **Then** the
   post-launch items report that they are waiting for the switch rather than failing, and the
   "Live domain still Ghost" item is not reported as a problem after a deliberate switch.

---

### User Story 5 - Update external links after launch (Priority: P2)

Right after the switch, the walkthrough reminds Don to update the few external links (such as
LinkedIn posts) that point to old blog addresses, since old addresses are not redirected.

**Why this priority**: It affects readers arriving from elsewhere but not the site itself.

**Independent Test**: The walkthrough has a step immediately after the post-launch checks
listing the external places to update and how to confirm each link now lands on a page.

**Acceptance Scenarios**:

1. **Given** the post-launch checks pass, **When** Don continues the walkthrough, **Then** the
   next step is the external-links reminder.

---

### User Story 6 - Retire Ghost and the old theme's services (Priority: P3)

After the agreed period, the walkthrough continues with clear steps to cancel the Ghost
subscription, retire the Flux Supabase project (after Don exports any contact submissions he
wants to keep and confirms it is the Flux project, not his other Supabase project), archive the
Flux repository, and update the design-source document to say Flux is archived but can still be
cloned.

**Why this priority**: It saves running costs and tidies up, but only after the launch is proven.

**Independent Test**: Read the retirement section: each step has what, where and how to confirm,
and the Supabase step requires an export and an explicit project-identity confirmation first.

**Acceptance Scenarios**:

1. **Given** the agreed period has passed and Don is satisfied, **When** he follows the
   retirement steps, **Then** each step has a confirmation, and the Supabase deletion step is
   preceded by an export step and a step confirming the project is the Flux one.
2. **Given** the Flux repository is archived, **When** someone reads the design-source document,
   **Then** it says Flux is archived and still cloneable with the same command.

### Edge Cases

- A sitemap address that redirects rather than returning a page, or a link to a page that only
  exists in drafts: the check treats a missing or error response as a failure and reports it.
- Links to other sites are not checked by the internal link check (external sites can be down
  for reasons outside the site's control).
- DNS changes can take time to reach every resolver: post-launch checks report "pending" while
  answers are still mixed, rather than a hard failure.
- HTTPS certificate for the bare domain or `www` not yet issued right after the switch: reported
  as pending with a plain reason.
- The new site's "do not index" signal must not carry over to the live domain, while the review
  and preview addresses keep it.
- `www` and the bare domain: one serves the site and the other sends visitors to it, so neither
  shows a certificate or not-found error.
- Old Ghost-only addresses (for example tag, author and feed paths) return the new site's
  not-found page; they are not redirected.
- Rollback after Ghost has been cancelled is not possible; the walkthrough says so before the
  cancellation step.
- Don has two Supabase projects: deleting the wrong one would lose unrelated data, so the step
  requires confirming the project name and contents first.
- Contact submissions held only in the old Supabase project are lost when it is deleted unless
  exported first.

## Requirements *(mandatory)*

### Functional Requirements

**Readiness (before the switch)**

- **FR-001**: The project MUST have an automated check, run in CI against the preview build,
  that fails when any address in the site's own sitemap does not return a page.
- **FR-002**: The same check MUST fail when any link from one of the site's own pages to another
  of its pages points to a page that does not exist, naming the broken target and the linking
  page.
- **FR-003**: The walkthrough MUST include a readiness checklist covering: all expected pages
  present, Ghost content migrated, placeholder page copy replaced, no broken internal links,
  contact form working end to end, and the automated checks passing on the main branch. Each
  item MUST say how it is confirmed.
- **FR-004**: The walkthrough MUST NOT proceed to the switch while any readiness item is not
  confirmed.

**The walkthrough and manual steps**

- **FR-005**: The walkthrough MUST be a numbered sequence in the project's setup documentation;
  every step MUST state what to do, where, and how to confirm it worked.
- **FR-006**: Every step that needs Don MUST be a pause: the assisting agent waits for Don and
  never creates accounts, signs in, changes DNS or handles credentials.
- **FR-007**: No step MAY require Don to paste a secret into the chat.
- **FR-008**: The setup check MUST be extended with this feature's new checks before the
  walkthrough that relies on them is written.

**The switch and rollback**

- **FR-009**: Before the switch, the walkthrough MUST record the current bare-domain and `www`
  DNS records that point to Ghost (type, name, value, proxy setting), exactly enough to restore
  them.
- **FR-010**: The switch MUST point the bare domain and `www` at the new site, leaving every
  other DNS record, including mail records, unchanged.
- **FR-011**: The walkthrough MUST include a rollback section that restores the recorded Ghost
  records and confirms the domain serves Ghost again, usable for as long as Ghost is running.
- **FR-012**: After a deliberate switch, the setup check MUST no longer report the "Live domain
  still Ghost" item as a problem, while still confirming Ghost correctly during a rollback.

**After the switch**

- **FR-013**: The setup check MUST confirm that the bare domain serves the new build over HTTPS.
- **FR-014**: The setup check MUST confirm that every address in the live sitemap returns a page.
- **FR-015**: The setup check MUST confirm that the contact endpoint on the live domain responds.
- **FR-016**: The setup check MUST confirm that the domain's mail records are unchanged from the
  recorded baseline.
- **FR-017**: Post-launch checks MUST report "waiting for the switch" before the switch,
  "pending" while DNS or certificates are still settling, and "Problem:" with a plain summary
  on a real failure.
- **FR-018**: The live domain MUST be indexable by search engines after launch, while the review
  address and preview addresses remain not indexable.
- **FR-019**: Old addresses from the Ghost site MUST NOT be redirected; they return the new
  site's not-found page.
- **FR-020**: Immediately after the post-launch checks, the walkthrough MUST remind Don to update
  external links (such as LinkedIn posts) that point to old blog addresses.

**Retirement (after the agreed period)**

- **FR-021**: The walkthrough MUST include steps, to be followed only after the agreed period
  (see Open Questions), for cancelling the Ghost subscription, stating first that rollback ends
  with it.
- **FR-022**: The walkthrough MUST include steps for retiring the Flux Supabase project that
  first have Don export any contact submissions he wants to keep, then confirm it is the Flux
  project and not his other Supabase project, before deleting it.
- **FR-023**: The walkthrough MUST include a step for archiving the Flux repository, and the
  design-source document MUST be updated to say Flux is archived but still cloneable.

### Key Entities

- **Readiness item**: something that must be true before the switch; has a description, a way
  to confirm it (automatic or by Don) and a result.
- **Ghost DNS records**: the bare-domain and `www` records that point to Ghost today; recorded
  before the switch and used for rollback.
- **Mail records baseline**: the domain's mail records as recorded during setup; compared after
  the switch.
- **Walkthrough step**: a numbered step with what, where, how to confirm, and whether it pauses
  for Don.
- **Post-launch check**: a setup check item run against the live domain, with states waiting,
  pending, complete or problem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The sitemap and internal link check passes on the preview build, with 100% of
  sitemap addresses returning a page and zero broken internal links.
- **SC-002**: The switch is completed with Don, following the walkthrough, with every step's
  confirmation passing.
- **SC-003**: After the switch, all post-launch checks in the setup check report complete: the
  bare domain serves the new site over HTTPS, 100% of live sitemap addresses load, the contact
  endpoint responds, and mail records are unchanged.
- **SC-004**: Email for the domain keeps working through the switch, with no change to any mail
  record.
- **SC-005**: If rollback is needed, Don can restore Ghost in under 15 minutes of his own work by
  following the rollback section alone.
- **SC-006**: The walkthrough documents the retirement steps (cancel Ghost, retire the Flux
  Supabase project, archive Flux) for after the agreed period, each with a confirmation.

## Assumptions

- The domain's DNS is already in Cloudflare and the new site is already deployed from main with
  a working review address (setup items 3 to 25).
- Ghost keeps running unchanged during the rollback window; the Ghost records recorded before the
  switch are enough to restore it.
- The mail records baseline already recorded during setup is the reference for "unchanged".
- The contact form is confirmed end to end on the live domain by Don submitting a test message,
  since that sends a real message.
- Moving the drc.dev portfolio is out of scope (a later feature).
- Old Ghost addresses are intentionally not redirected; broken inbound links are handled by the
  external-links reminder.
- The retirement steps are documented in this feature but performed later, by Don, after the
  agreed period; the feature is done when they are documented.
- Cancelling Ghost and retiring Supabase reduce running costs; no step adds a recurring cost
  (Principle IX).

## Open Questions (for clarify)

Ask Don in the first clarify round:

1. How long should Ghost keep running after the switch (the rollback window and the "agreed
   period" before retirement)? The description suggests about two weeks.
2. Has he migrated all posts, and replaced all placeholder page copy? (This decides whether the
   content readiness items can pass or need content work first.)

Also worth confirming during clarify (agent-identified):

3. Which of the bare domain and `www` should be the main address, with the other sending
   visitors to it? (Ghost currently uses `www.doncoleman.ca`.)
4. What happens to the review address `new.doncoleman.ca` after launch: keep it (not indexable)
   or remove it?

## Technical Notes (hand-off to planning, not requirements)

From the feature description's technical direction:

- Read `docs/setup.md` (the description says `docs/setup/`; the repository has a single
  `docs/setup.md` runbook), the `setup:check` script (`scripts/setup-check/`) and
  `docs/design-source.md` first.
- Write the numbered walkthrough in the setup documentation; extend `setup:check` before the
  walkthrough.
- Add a CI check against the preview build: every URL in the site's own sitemap returns a page;
  no internal link points to a missing page.
- Record the current apex and `www` DNS records pointing to Ghost in the walkthrough.
- The switch: point the apex and `www` records in Cloudflare at the Workers project instead of
  Ghost. Rollback restores the recorded Ghost records.
- Post-launch `setup:check` items: apex serves the new build over HTTPS; every URL in the live
  sitemap returns a page; `/api/contact` responds; MX records unchanged.
- Retirement: cancel Ghost; retire the Flux Supabase project (after export; confirm it is the
  Flux project); archive `drcdev/flux`; update `docs/design-source.md`.
- Observed while specifying: `public/_headers` sends `X-Robots-Tag: noindex` on every path, and
  setup item 6 (`live-domain-ghost`) fails by design once the apex leaves Ghost. Both need
  handling for launch (FR-012, FR-018).
- Label the pull request as a major change and wait for Don's approval.
