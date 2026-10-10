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

This is a **major change** under Constitution Principle III. The triggers met are: it changes CI
(a new blocking check), deployment and infrastructure configuration (DNS, the site's main
address, the indexing rules), and it removes external services (Ghost, the Flux Supabase
project, the Mailgun records). The pull request is labelled, auto-merge stays off, and it waits
for Don's approval after he has checked the preview. The preview check is: the preview's pages
tell search engines not to index them, and their canonical links name the preview's own
address. The DNS switch itself happens only after the pull request has merged (see
Clarifications).

## Clarifications

### Session 2026-09-30

- Q: How long should Ghost keep running after the switch? → A: 2 weeks after the switch. This
  is both the rollback window and the agreed period before retirement.
- Q: Are all posts migrated, and will placeholder copy be replaced before the switch? → A: All
  posts are migrated. Don replaces the Services and Speaking placeholder copy and the Focus Pocus
  placeholders before the switch. An automated readiness check fails while any page still says
  "placeholder copy" or any public project is marked as a placeholder.
- Q: Which is the main address, the bare domain or `www`? → A: The bare `doncoleman.ca` is the
  main address, and `www.doncoleman.ca` permanently redirects to it.
- Q: What happens to the review address `new.doncoleman.ca` after launch? → A: It is removed
  completely: its custom domain and DNS record are deleted, so old review links stop resolving.
  The review-address setup items (16 and 17) are retired or replaced.
- Q: Before Ghost is cancelled, is Ghost's data exported and are the Ghost-only Mailgun records
  removed? → A: Yes. Before cancelling, Don exports Ghost's content (JSON) and members (CSV).
  After cancelling, he deletes the `mail.doncoleman.ca` Mailgun records (two MX, the SPF TXT and
  the DKIM TXT), and the mail-records baseline is updated to match. The iCloud mail records stay
  untouched.
- Q (Don, after the plan): When does the DNS switch happen relative to this feature's pull
  request? → A: After the pull request merges. Production serves `main`, and `main` must first
  carry the bare-domain main address and the new indexing rules. The pull request delivers the
  checks, the crawler and the walkthrough. Once Don approves and merges it, the switch, the
  post-launch checks and the removal of the review address are walked through with Don in the
  same session, using the walkthrough. Success criteria that depend on the switch (SC-002,
  SC-003, SC-007) are proven after the merge.
- Q (Don, after the plan): Is the fifth Mailgun record, the tracking CNAME, deleted too? → A: Yes.
  After cancelling Ghost, Don deletes the tracking CNAME `email.mail.doncoleman.ca` together with
  the two MX, the SPF TXT and the DKIM TXT records for `mail.doncoleman.ca`: five records in all.
  The iCloud records stay untouched.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know the new site is ready before switching (Priority: P1)

Before touching DNS, Don runs one readiness checklist and sees, item by item, whether the new
site is ready: every expected page is present, the Ghost content has been migrated, no
placeholder copy or placeholder project remains, no link
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
5. **Given** a page that still says "placeholder copy" or a public project marked as a
   placeholder, **When** the automated readiness check runs, **Then** it fails and names each
   such page or project.

---

### User Story 2 - Switch the domain with a guided, confirmed walkthrough (Priority: P1)

After this feature's pull request has merged, Don follows a numbered walkthrough for the
switch, in the same session as the merge. Each step says what to do, where to do it,
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

If the new site misbehaves in the 2 weeks after the switch, Don can restore the recorded Ghost records by
following a short rollback section, and confirm that the domain serves Ghost again.

**Why this priority**: A safe launch needs a known way back; it must exist before the switch.

**Independent Test**: Read the rollback section: it lists the exact records to restore, where to
restore them, and a confirmation that the domain is back on Ghost.

**Acceptance Scenarios**:

1. **Given** the domain has been switched, **When** Don follows the rollback steps, **Then** the
   bare domain and `www` point at Ghost again and the existing "Live domain still Ghost"
   confirmation reports complete.
2. **Given** the 2-week rollback window after the switch, **When** Ghost is still running,
   **Then** rollback is possible; the walkthrough states that rollback stops being possible once
   Ghost is cancelled.

---

### User Story 4 - Confirm the live site works after the switch (Priority: P1)

Right after the switch, Don runs the setup check and sees whether the bare domain serves the new
site over HTTPS, `www` permanently redirects to it, every page in the live sitemap loads, the contact endpoint responds, and the
domain's email records are unchanged.

**Why this priority**: The launch is not done until the live address is proven to work.

**Independent Test**: Run the post-launch checks against the live domain; each reports complete
or a plain "Problem:" summary.

**Acceptance Scenarios**:

1. **Given** the switch is done, **When** Don runs the post-launch checks, **Then** they report
   complete only if the bare domain serves the new build over HTTPS, `www` permanently
   redirects to the bare domain, every address in the live
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

After the agreed period of 2 weeks, the walkthrough continues with clear steps to export
Ghost's content and members, cancel the Ghost subscription, remove the five Mailgun DNS records
that only Ghost's newsletter used, retire the Flux Supabase project (after Don exports any contact submissions he
wants to keep and confirms it is the Flux project, not his other Supabase project), archive the
Flux repository, and update the design-source document to say Flux is archived but can still be
cloned. (Superseded: Don chose to keep Flux unarchived (2026-10-09).)

**Why this priority**: It saves running costs and tidies up, but only after the launch is proven.

**Independent Test**: Read the retirement section: each step has what, where and how to confirm,
the Ghost cancellation is preceded by the Ghost export, and the Supabase step requires an export
and an explicit project-identity confirmation first.

**Acceptance Scenarios**:

1. **Given** the agreed period has passed and Don is satisfied, **When** he follows the
   retirement steps, **Then** each step has a confirmation, and the Supabase deletion step is
   preceded by an export step and a step confirming the project is the Flux one.
2. **Given** the Flux repository is archived, **When** someone reads the design-source document,
   **Then** it says Flux is archived and still cloneable with the same command.
   (Superseded: Don chose to keep Flux unarchived (2026-10-09).)
3. **Given** Ghost has been cancelled and all five Mailgun records deleted,
   **When** the setup check compares mail records, **Then** it uses the updated baseline without
   the Mailgun records and reports the iCloud mail records unchanged.

### Edge Cases

- A sitemap address that redirects rather than returning a page is a failure: sitemap addresses
  must return a page directly. A link to a page that only exists in drafts gets a not-found
  response and fails.
- Links to other sites are not checked by the internal link check (external sites can be down
  for reasons outside the site's control).
- DNS changes can take time to reach every resolver: post-launch checks report "pending" while
  answers are still mixed, rather than a hard failure.
- HTTPS certificate for the bare domain or `www` not yet issued right after the switch: reported
  as pending with a plain reason.
- The new site's "do not index" signal must not carry over to the live domain, while the
  per-branch preview addresses keep it.
- `www` and the bare domain: the bare domain serves the site and `www` permanently redirects to
  it, keeping the path, so neither shows a certificate or not-found error.
- Once `new.doncoleman.ca` is removed, old review links stop resolving; this is intended.
- Old Ghost-only addresses (for example tag, author and feed paths) return the new site's
  not-found page; they are not redirected.
- Rollback after Ghost has been cancelled is not possible; the walkthrough says so before the
  cancellation step.
- Only one of the two domain records switches (for example the bare domain works but `www` does
  not): the setup check reports each half separately, and Don either finishes the other half in
  the same sitting or rolls both back (FR-010b).
- A late problem after the review address has been removed: rollback does not need the review
  address. If Don later wants to switch again, he restores the review address first and the
  readiness checklist runs again (FR-011).
- Search engines after a rollback: no indexing step is needed. The bare domain serves Ghost again
  and search engines replace any new-site pages they picked up as they recrawl Ghost; the
  preview addresses stay not indexable throughout.
- Don has two Supabase projects: deleting the wrong one would lose unrelated data, so the step
  requires confirming the project name and contents first.
- Contact submissions held only in the old Supabase project are lost when it is deleted unless
  exported first.

## Requirements *(mandatory)*

### Functional Requirements

**Readiness (before the switch)**

- **FR-001**: The project MUST have an automated check, run in CI against each pull request's
  preview build, that fails when any address in the site's own sitemap does not return a page.
  "Returns a page" means a successful (200) response served directly: a redirect, a not-found or
  an error response is a failure. The content type is not part of the test. The check MUST also
  fail when the sitemap names a main address other than the one expected for the build being
  checked.
- **FR-001a**: The check MUST fail closed. If the preview build fails, does not report within 20
  minutes, or cannot be reached, the check fails with a plain message that says what it waited
  for and how to run it again. It never passes because it could not run.
- **FR-002**: The same check MUST fail when any link from one of the site's own pages to another
  of its pages points to a page that does not exist. Only ordinary links between pages are
  checked, not images, stylesheets, scripts or feeds. The part of a link after `#` is ignored and
  the target page is checked. Email, telephone and script links, and links to other sites, are
  ignored. A link may pass through up to 5 redirects within the site but must end on a page. Each
  failure MUST be reported on its own line, naming the kind of failure, the broken address, the
  problem (the status received or the network reason) and every page that links to it. The same
  list MUST appear in the CI run's summary.
- **FR-002a**: The CI check MUST use no secret beyond CI's own read-only access to the
  repository, and MUST NOT expose any secret to code from a pull request, including one from a
  fork.
- **FR-003**: The walkthrough MUST include a readiness checklist covering: all expected pages
  present, Ghost content migrated (all posts are migrated), placeholder page copy and
  placeholder projects replaced, no broken internal links, contact form working end to end, the
  contact form's spam protection accepting the bare domain, the privacy policy stating where
  contact messages are stored and naming no retired service, and the automated checks passing on
  the main branch. The automated checks include the accessibility checks and the performance
  budget, so a failing accessibility run blocks the switch. Each item MUST say how it is
  confirmed.
- **FR-003a**: An automated readiness check MUST fail, naming each problem, while any of these is
  true: a published (non-draft) page contains the phrase "placeholder copy" in any letter case; a
  published project is flagged as a placeholder in its own details; or a page on the list of
  expected pages is missing or still a draft. Today this covers the Services and Speaking pages
  and the Focus Pocus project, which Don replaces before the switch.
- **FR-003b**: The switch MUST NOT happen until this feature's pull request has merged and the
  production site built from `main` serves the bare domain as its main address with the indexing
  rules of FR-018. Before then the live domain would be told not to index and would name the
  review address. The readiness checklist confirms this.
- **FR-004**: The walkthrough MUST NOT proceed to the switch while any readiness item is not
  confirmed. This is enforced by a readiness gate step that lists each item's result: the
  assisting agent does not present any switch step until every item at the gate is confirmed,
  and the setup check reports the result of each automatically confirmed item.

**The walkthrough and manual steps**

- **FR-005**: The walkthrough MUST be a numbered sequence in the project's setup documentation.
  Every step MUST state what to do, where, how to confirm it worked, and what to do when the
  confirmation fails (try again, wait, go to the rollback, or stop). The walkthrough and the
  setup check's summaries are written in plain language.
- **FR-006**: Every step that needs Don MUST carry a visible pause marker and say who acts. The
  assisting agent only runs read-only checks, checks that a file Don names exists, and prepares
  repository changes. Don alone performs every action in a dashboard, account, DNS zone or
  export. The agent waits for Don at each pause and never creates accounts, signs in, changes DNS
  or handles credentials.
- **FR-007**: No step MAY require Don to paste a secret into the chat. Exported files and their
  contents MUST never be pasted into the chat, committed to the repository or written to any log.
- **FR-008**: The setup check MUST be extended with this feature's new checks before the
  walkthrough that relies on them is written.

**The switch and rollback**

- **FR-009**: Before the switch, the walkthrough MUST record the current bare-domain and `www`
  DNS records that point to Ghost (type, name, value, proxy setting and cache lifetime), exactly
  enough to restore them. They are recorded in the walkthrough and in the committed DNS baseline,
  and the two MUST agree. Before any change, Don also saves an export of the whole DNS zone on
  his own machine.
- **FR-010**: The switch MUST point the bare domain and `www` at the new site, leaving every
  other DNS record, including mail records, unchanged. This is confirmed by comparing the whole
  zone, not only the mail records, against the committed DNS baseline: the only differences
  allowed are the bare-domain and `www` records that the switch replaces.
- **FR-010a**: The bare domain `https://doncoleman.ca` MUST be the site's main address:
  canonical links, social sharing addresses, the sitemap, `robots.txt` and the writing feed on
  the live site MUST use it. `www.doncoleman.ca` MUST permanently redirect, in a single 301
  response, to the same path and query string on `https://doncoleman.ca`, unchanged (no trailing
  slash added or removed), from both `http://` and `https://`, with a valid certificate on `www`
  and no interstitial page or redirect loop. `http://doncoleman.ca` MUST permanently redirect to
  `https://doncoleman.ca`.
- **FR-010b**: The bare domain is switched first, then `www`, in one sitting. If one half cannot
  be confirmed, Don either completes it in the same sitting or follows the rollback for both.
  The setup check reports each half separately, so a half-switched domain is visible, and it is
  not left in place when the sitting ends.
- **FR-010c**: The records that replace Ghost's MUST have a cache lifetime of 5 minutes or less,
  so that a switch or a rollback reaches most visitors within minutes.
- **FR-010d**: The bare domain and `www` MUST be served over HTTPS only. After Ghost was
  retired (2026-10-09, #93) the strict-transport policy is one year with `includeSubDomains` and no
  preload list. Preload is decided separately. While rollback to Ghost was possible, the policy
  covered the bare domain only, and rollback stayed safe under it because Ghost also serves the
  domain over HTTPS.
- **FR-011**: The walkthrough MUST include a rollback section that undoes every change the
  switch made: it detaches the bare domain from the new site, removes the `www` redirect and its
  placeholder record, restores the recorded Ghost records exactly, and confirms the domain serves
  Ghost again. It is usable for as long as Ghost is running: from the switch date (the day the
  bare domain is attached to the new site, written down in the walkthrough) until Ghost is
  cancelled, no earlier than 2 weeks later. Rollback does not depend on the review address. If
  it happens after the review address is removed and Don later wants to switch again, he
  restores the review address first and the readiness checklist runs again.
- **FR-011a**: Don decides whether to roll back. The walkthrough recommends rollback when a
  post-launch check reports a problem (not pending) that cannot be fixed within the sitting, when
  any mail record differs from the baseline, when a check is still pending 24 hours after the
  switch, or when Don judges the live site unusable for readers.
- **FR-012**: The setup check MUST recognise a deliberate switch only from Don's own act of
  attaching the bare domain to the new site in the hosting account, never from public DNS
  answers alone. Before that act, any departure from the Ghost records is reported as a problem,
  so a broken DNS state is not mistaken for a switch. After a deliberate switch, the "Live domain
  still Ghost" item MUST no longer report a problem. During and after a rollback (the bare
  domain detached again), it confirms Ghost again and the post-launch items return to waiting.

**After the switch**

- **FR-013**: The setup check MUST confirm that the bare domain serves the new build over HTTPS
  and that `www` permanently redirects to the bare domain.
- **FR-014**: The setup check MUST confirm that every address in the live sitemap returns a page.
- **FR-015**: The setup check MUST confirm that the contact endpoint on the live domain responds,
  using a request that cannot create a submission, store data or send a message: it expects the
  endpoint's documented refusal of a request that is not a submission. The check runs only when
  Don runs the setup check, sends one such request per run, never runs from CI, and does not
  count toward the submission rate limit.
- **FR-015a**: Launch MUST NOT change the contact protections. The endpoint accepts submissions
  only from the address the form was served from: the bare domain after launch (`www` never
  submits, because it redirects), the review address only while it exists, and each preview
  address into preview storage. Spam-protection verification, rate-limit thresholds and the
  retention period are unchanged. Production and preview submissions stay in separate stores.
  The only personal data collected stays what a person types into the form.
- **FR-015b**: Don's end-to-end test messages, on the review address and on the live domain,
  MUST be marked as launch tests (starting "Launch test") and deleted by Don once he has
  confirmed they arrived.
- **FR-016**: The setup check MUST confirm that the domain's mail records are unchanged from the
  committed DNS baseline, which is the source of truth. "Unchanged" means each public resolver
  returns the same set of mail records (MX, TXT and DKIM records) by type, name, value and, for
  MX, priority; order and cache lifetime are ignored. After the Mailgun records are removed
  (FR-024), the baseline is the updated one without them.
- **FR-016a**: Don MUST confirm that mail works by sending a message to and from his domain
  address before the switch, after the switch, and after the Mailgun records are deleted.
- **FR-017**: Post-launch checks MUST report "waiting for the switch" before the switch,
  "pending" while DNS or certificates are still settling, and "Problem:" with a plain summary on
  a real failure. Each state is printed as a word, not shown by colour or symbol alone. A check
  still pending 24 hours after the switch is treated as a problem by the walkthrough.
- **FR-018**: The live bare domain MUST be indexable by search engines after launch. These MUST
  stay not indexable, through a do-not-index response header: every branch preview address,
  every per-version preview address, the hosting platform's default addresses for both the
  production and the preview site, and the review address until it is removed. Branch previews
  also carry do-not-index page metadata. Draft pages and the not-found page are never indexable,
  and contact endpoint responses are never indexable on any address. Search engines are never
  blocked from crawling, because that would hide the do-not-index signal.
- **FR-019**: Old addresses from the Ghost site MUST NOT be redirected. Tag, author, feed and
  admin addresses, and any old post address the new site does not have, return status 404 with
  the site's not-found page and no redirect. This is an accepted risk: readers who follow an old
  link to an address that changed land on the not-found page. The expected traffic is small (a
  handful of external links), Don accepts the loss, and FR-020 covers the links he controls.
- **FR-019a**: After the post-launch checks are complete and the external-links step is done, in
  the same session as the switch, the walkthrough MUST remove the review address
  `new.doncoleman.ca` completely (its custom domain and its DNS record) and confirm it no longer
  resolves. Removal is not delayed to the end of the rollback window, because rollback does not
  depend on it (FR-011). The setup check's review-address items (16 and 17) MUST be retired or
  replaced so that they no longer expect the review address to exist or to send "do not index".
- **FR-020**: Immediately after the post-launch checks, the walkthrough MUST remind Don to update
  external links (such as LinkedIn posts) that point to old blog addresses.

**Retirement (after the agreed period)**

- **FR-021**: The walkthrough MUST include steps, to be followed no earlier than 2 weeks after
  the switch date, for cancelling the Ghost subscription. Before the cancellation it MUST state
  that rollback ends with it and that Ghost's content and members cannot be recovered once the
  subscription ends. At the switch, Don notes Ghost's next renewal date so that the cancellation
  can avoid a further charge; 2 weeks is a minimum, not a deadline. Before the cancellation, Don
  MUST export Ghost's content (JSON) and members (CSV) to his own machine, outside the
  repository. The walkthrough confirms both files exist and are not empty from paths Don gives,
  without opening them.
- **FR-021a**: Ghost's members are not moved to the new site, which has no newsletter. The
  members file and any exported contact submissions are private records: only Don keeps them, on
  his own machine, and he deletes them within 12 months of the export, matching the site's
  12-month retention for contact messages. Sending members a final notice that the newsletter is
  ending is Don's choice and not required. Until each store or file is deleted, Don answers
  requests to see or delete personal data held in Ghost, Supabase or the exports by hand within
  30 days, as the privacy policy says.
- **FR-022**: The walkthrough MUST include steps for retiring the Flux Supabase project, in this
  order: show Don its tables, their fields and the number of records so he can decide what to
  keep; have him export the contact submissions he wants to keep; have him confirm the export is
  complete by checking that the file opens and its record count matches the project's; have him
  confirm the project's identity with two independent identifiers (the project name, and a
  project reference that matches the one in the Flux repository's Supabase configuration) and
  that it holds Flux's contact table and contact function, so it is not his other Supabase
  project; and only then delete it.
- **FR-023**: The walkthrough MUST include a step for archiving the Flux repository. Before
  archiving, the repository MUST be checked for committed secrets or personal data: any secret
  found is revoked, and personal data is removed (or the repository kept private) before it
  stays cloneable. The design-source document MUST be updated to say Flux is archived but still
  cloneable. (Superseded: Don chose to keep Flux unarchived (2026-10-09).)
- **FR-024**: After Ghost is cancelled, the walkthrough MUST have Don delete all five Mailgun
  records that only Ghost's newsletter used:
  - MX `mail.doncoleman.ca` → `mxa.eu.mailgun.org` (priority 10);
  - MX `mail.doncoleman.ca` → `mxb.eu.mailgun.org` (priority 10);
  - TXT `mail.doncoleman.ca` `v=spf1 include:mailgun.org ~all` (SPF);
  - TXT `mta._domainkey.mail.doncoleman.ca` (Mailgun's DKIM key);
  - CNAME `email.mail.doncoleman.ca` → `eu.mailgun.org` (Mailgun's tracking address).

  Before deleting, Don confirms that nothing other than Ghost's newsletter sends through Mailgun
  (the site's contact form sends no email). The iCloud mail records on the bare domain MUST stay
  untouched: MX `mx01.mail.icloud.com` and `mx02.mail.icloud.com`, the TXT `apple-domain`
  verification, the TXT `v=spf1 include:icloud.com ~all`, and the DKIM CNAME
  `sig1._domainkey.doncoleman.ca`. The mail-records baseline MUST be updated to match in the
  retirement follow-up change straight after the deletion, and retirement is not complete until
  the mail-records check passes against the updated baseline, so the zone and the baseline cannot
  drift apart.
- **FR-024a**: The bare domain's email authentication (the iCloud SPF and DKIM records) MUST stay
  valid and unchanged. The domain has no DMARC policy today; adding one is follow-up work outside
  this feature.
- **FR-025**: Every irreversible step (Ghost cancellation, Supabase deletion, Mailgun record
  deletion) MUST be labelled irreversible and list the evidence needed before it. Archiving the
  Flux repository is labelled reversible.
- **FR-025a**: After retirement, no DNS record for the domain MAY point at Ghost, Mailgun or the
  removed review address, so no dangling record can be taken over.
- **FR-025b**: When each service is retired, Don MUST revoke or delete its API keys where the
  service still exists (for example Mailgun's sending domain and keys, and any Ghost integration
  keys), and any leftover secret or environment value for a retired service MUST be removed from
  GitHub, Cloudflare and local untracked files.
- **FR-025c**: The retirement follow-up change (baseline update, design-source update, removal of
  the review address's do-not-index rule) is a separate, small pull request that the agent
  prepares once Don has completed the retirement steps, and Don approves it.

**Security and privacy of the checks**

- **FR-026**: The setup check MUST read the hosting account with read-only access only, using a
  token Don keeps in his local untracked environment file. The token is never printed and never
  used in CI. The output of the setup check and of the site check MUST never contain message
  contents, personal details, tokens or environment values.

**Accessibility, performance and analytics**

- **FR-027**: WCAG 2.2 AA applies to every page this launch makes public, including the
  replacement Services, Speaking and Focus Pocus content and the not-found page. The existing
  automated accessibility checks (every WCAG 2.2 A and AA rule, run on every page template
  including the not-found page, with zero violations allowed) MUST pass on `main` before the
  switch, as part of readiness (FR-003). The main-address and indexing changes MUST NOT change
  page titles, document language, headings, landmarks or visible markup; if any markup does
  change, the same checks MUST still pass. Fixes for broken links keep descriptive link text. The
  replacement content is prose inside existing templates that are already tested for keyboard
  use and reflow at 320 CSS pixels, so no extra manual review is required beyond Don reading the
  pages on the preview; new interactive content would need a manual keyboard and screen-reader
  review.
- **FR-027a**: The not-found page that old Ghost addresses now reach MUST say plainly that the
  page does not exist and that older blog addresses were not carried over, link to the home page,
  have one main heading inside the main content region, be fully usable by keyboard, and meet AA
  contrast.
- **FR-028**: The performance budget and Core Web Vitals "good" thresholds continue to apply,
  unchanged, on the live domain. Analytics on the live domain is the site's existing
  privacy-focused, cookie-free analytics only: no other third-party script and no new personal
  data.

### Key Entities

- **Readiness item**: something that must be true before the switch; has a description, a way
  to confirm it (automatic or by Don) and a result.
- **Ghost DNS records**: the bare-domain and `www` records that point to Ghost today; recorded
  before the switch and used for rollback.
- **Mail records baseline**: the domain's mail records as recorded during setup; compared after
  the switch. Updated once to drop the five Mailgun records after Ghost is cancelled.
- **Walkthrough step**: a numbered step with what, where, how to confirm, and whether it pauses
  for Don.
- **Post-launch check**: a setup check item run against the live domain, with states waiting,
  pending, complete or problem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

SC-002, SC-003 and SC-007 depend on the switch, which happens after this feature's pull request
merges (Clarifications), so they are proven after the merge, with Don, in the same session.

- **SC-001**: The sitemap and internal link check passes on the preview build, with 100% of
  sitemap addresses returning a page and zero broken internal links. The CI check finishes
  within 3 minutes once the preview is ready, and waits no more than 20 minutes for it.
- **SC-002**: After the merge, the switch is completed with Don, following the walkthrough, with
  every step's confirmation passing.
- **SC-003**: After the switch, all post-launch checks in the setup check report complete: the
  bare domain serves the new site over HTTPS, `www` permanently redirects to it, 100% of live
  sitemap addresses load, the contact endpoint responds, and mail records are unchanged.
- **SC-004**: Email for the domain keeps working through the switch, with no change to any mail
  record, and Don's test messages send and arrive before the switch, after it, and after the
  Mailgun deletion. Later, only the five Ghost-only Mailgun records are removed and the iCloud
  records never change.
- **SC-005**: If rollback is needed, Don can restore Ghost in under 15 minutes of his own work by
  following the rollback section alone. The time runs from opening the rollback section to
  finishing its last dashboard action, and excludes the time DNS and certificates take to
  settle.
- **SC-006**: The walkthrough documents the retirement steps (export Ghost content and members,
  cancel Ghost, remove the five Mailgun records, retire the Flux Supabase project, archive Flux)
  for after the 2-week period, each with a confirmation and each irreversible step labelled.
- **SC-007**: After launch, `new.doncoleman.ca` no longer resolves and no setup check item
  expects it.
- **SC-008**: After retirement, no DNS record for the domain points at Ghost, Mailgun or the
  review address.

## Assumptions

- The domain's DNS is already in Cloudflare and the new site is already deployed from main with
  a working review address (setup items 3 to 25).
- Ghost keeps running unchanged during the 2-week rollback window; the Ghost records recorded
  before the switch are enough to restore it. Ghost serves the domain over HTTPS, so the site's
  strict-transport policy does not block a rollback.
- The mail records baseline already recorded during setup is the reference for "unchanged".
- The contact form is confirmed end to end on the live domain by Don submitting a test message,
  since that sends a real message.
- The contact form itself (its error, success and rate-limited states, its spam-protection
  widget, and its behaviour without JavaScript) is unchanged by this feature. Its accessibility
  requirements belong to the contact feature's specification, and its automated checks keep
  running in the release gate.
- The walkthrough and the setup documentation live in the repository and are not published on
  the site, so they are outside the site's WCAG scope. They still use headings, tables and plain
  language.
- Moving the drc.dev portfolio is out of scope (a later feature).
- Old Ghost addresses are intentionally not redirected; broken inbound links are handled by the
  external-links reminder.
- The retirement steps are documented in this feature but performed later, by Don, no earlier
  than 2 weeks after the switch; the feature is done when they are documented. The repository
  changes that follow retirement come in a separate follow-up pull request (FR-025c).
- Expected new monthly cost is $0 (Principle IX). The custom domain, the redirect, the
  certificates and the analytics are free on the current plans, and the new CI check uses a few
  minutes per pull request within the free CI allowance. Cancelling Ghost, retiring Supabase and
  dropping Mailgun reduce running costs; no step adds a recurring cost.

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
- Observed during clarify: main-branch builds resolve Astro's `site` to `reviewHost`
  (`new.doncoleman.ca`) in `src/lib/site-origin.ts` and `setup/config.json`; it must become
  `https://doncoleman.ca` (FR-010a). Removing the review address retires setup items 16 and 17
  (FR-019a). The Mailgun records are in `setup/dns-baseline.json` (FR-024).
- Label the pull request as a major change and wait for Don's approval.
