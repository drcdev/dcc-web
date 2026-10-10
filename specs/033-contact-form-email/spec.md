# Feature Specification: Contact form sends email instead of storing messages

**Feature Branch**: `033-contact-form-email`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Remove the d1 contact table and change the contact form over to use the send email feature. Use a fixed destination for free plan compatibility" (GitHub issue #145, "Change contact form to email")

## Background

Today the contact form stores each accepted message in the site's database. Don's scheduled
assistant collects new messages through a token-protected retrieval endpoint and marks them read,
and a daily clean-up deletes messages after 12 months (feature 007). This feature replaces all of
that with an email: each accepted message is sent straight to one fixed inbox that Don owns, and
the site keeps no copy. Sending only to a single, verified, fixed address is what keeps this
within Cloudflare's free plan (sending to arbitrary recipients is a paid feature). The visitor's
experience of the form does not change, apart from the privacy wording that describes where their
message goes.

This is a **major change** under Constitution Principle III: it replaces an integration (adds an
email service, removes the message store and retrieval endpoint), changes how contact data is
collected, stored, retrieved and deleted, and changes Worker and DNS configuration. It also
conflicts with the current wording of Principles V, VII and VIII and the Technology Constraints,
which describe contact submissions as stored in D1, rate-limited per sender and retrieved with a
bearer token; those are amended as this slice's first task (see Dependencies).

## Clarifications

### Session 2026-10-10

- Q: With the message store gone, how should repeat senders be limited? → A: By the human check
  (Turnstile) alone. The per-sender limits of 3 an hour and 5 a day are removed, and nothing about
  senders is stored. Accepted trade-off: spam that passes the human check reaches Don's inbox.
- Q: What should the privacy policy promise about how long Don keeps contact emails? → A: Kept only
  as long as needed to deal with the enquiry, and deleted on request. No fixed period.
- Q: Where should Email Routing be turned on, given the domain's mail is hosted by iCloud? → A: On a
  sending subdomain only (for example `mail.doncoleman.ca`), sending from an address there to
  contact@doncoleman.ca. The apex domain's iCloud MX, SPF and DKIM records stay untouched; planning
  confirms that subdomain-only routing works with the apex left off.
- Q: Is the constitution amendment made inside this slice or first as a separate step? → A: Inside
  this slice, as the first task, through the constitution command, in the same pull request.
- Q: Does dropping the message store ship in the same pull request as the switch to email? → A: Yes,
  the same pull request. Collecting unread stored messages is a pre-merge step, and auto-merge stays
  off until Don confirms it is done.
- Q: The shared preview database applies migrations on every branch push, so its message table is
  dropped as soon as this branch is pushed. How are preview messages handled? → A: They are test
  sends and are dropped without collecting; the pre-merge collection step covers production only.
  Other open branches' previews showing "service unavailable" on the contact form until they merge
  main is accepted.
- Q: Messages can still reach the production store between Don collecting and the merge deploy
  dropping it. How is that gap handled? → A: The small window is accepted. The pre-merge step tells
  Don to collect immediately before approving and to re-check the retrieval endpoint just before
  approving.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor's message reaches Don by email (Priority: P1)

A visitor fills in the contact form exactly as today (name, email, optional organization, message,
consent, and the project line when they came from a project story) and sends it. They see the same
confirmation as today. Within a few minutes Don receives an email in his inbox containing
everything the visitor entered. Replying to that email addresses the reply to the visitor's email
address, not to the site.

**Why this priority**: This is the whole feature. Without delivery to Don's inbox the form is
useless once the message store is gone.

**Independent Test**: Submit a valid message (with and without organization and project) against
a test send target; confirm the visitor sees the confirmation and exactly one email is produced,
addressed to the fixed destination, containing every entered field, with the visitor's address as
the reply address.

**Acceptance Scenarios**:

1. **Given** the Contact page, **When** a visitor enters a name, a valid email and a message,
   ticks consent and sends, **Then** they see the existing confirmation and one email is sent to
   Don's fixed address.
2. **Given** an email produced by the form, **When** Don reads it, **Then** it shows the
   visitor's name, email, organization (or that none was given), project (or that none was
   given), message, and the time it was received, and the subject tells him at a glance that it
   is a contact-form message and who it is from.
3. **Given** an email produced by the form, **When** Don presses Reply in his mail program,
   **Then** the reply is addressed to the visitor's email address.
4. **Given** a visitor who arrived from a project story, **When** they send, **Then** the email
   names that project.
5. **Given** any submission, **When** it is accepted, **Then** the email goes only to the one
   fixed destination address; nothing the visitor enters can change or add a recipient.

---

### User Story 2 - A visitor learns when sending fails, and keeps what they typed (Priority: P1)

If the message cannot be handed off for sending (the email service refuses it or is unreachable), the visitor sees the existing "not sent, please try again"
error and everything they typed stays in the form. The site never shows the confirmation for a
message that was not handed off for delivery.

**Why this priority**: With no stored copy, a failed send that looked successful would lose the
enquiry silently. Failing closed is the only safe behaviour.

**Independent Test**: Make the send step fail; submit a valid message; confirm the error appears,
all values remain, no confirmation is shown, and the failure is logged with its outcome only.

**Acceptance Scenarios**:

1. **Given** the email service refuses or cannot be reached, **When** a visitor sends a valid
   message, **Then** they see the existing service-unavailable error and their entries are kept.
2. **Given** a send failure, **When** it is logged, **Then** the log records only that sending
   failed and the kind of error, never any field value, address or fingerprint.
3. **Given** the existing validation, consent and human-check errors, **When** they occur,
   **Then** the visitor sees the same errors as today and no email is sent.

---

### User Story 3 - The site no longer keeps contact messages (Priority: P1)

After this change the site holds no copy of any contact message. The message store is removed
from both production and preview, the retrieval endpoint that Don's assistant used is gone, its
access key and the sender-fingerprint salt are retired, and the daily clean-up of old messages is
no longer needed for contact data. Real messages already stored in production when the change
ships are not lost: Don collects them immediately before approving the pull request. Preview
messages are test sends and are dropped without collecting.

**Why this priority**: Removing the store is the second half of the issue and the main privacy
gain (Principle VII: collect and keep the minimum).

**Independent Test**: After the change, submit a message and confirm nothing holding its content
is written anywhere by the site; call the old retrieval addresses with and without the old key and
confirm they return "not found"; confirm the production and preview databases no longer contain
the message store.

**Acceptance Scenarios**:

1. **Given** an accepted submission, **When** it is processed, **Then** no name, email,
   organization, project or message text is written to any site storage or log.
2. **Given** the old message-retrieval addresses, **When** anything calls them, **Then** they
   respond "not found", whether or not a key is supplied, and reveal nothing.
3. **Given** the production and preview databases after the change is deployed, **When** they are
   inspected, **Then** the contact message store no longer exists, and the questions feature's
   data is untouched.
4. **Given** messages still stored in production before the deploy, **When** the pull request is
   ready to merge, **Then** it lists collecting any unread production messages, immediately before
   approving and with a final re-check of the retrieval endpoint, as a pre-merge step; auto-merge
   stays off, and the pull request merges (removing the store) only after Don confirms the step is
   done.
5. **Given** the shared preview database, **When** this branch's preview deploy applies the change,
   **Then** its message store is dropped without collection, and other open branches' previews may
   answer the contact form with "service unavailable" until they merge main (accepted).

---

### User Story 4 - Spam and abuse are still kept out (Priority: P2)

Automated and abusive submissions are still rejected before any email is sent, so Don's inbox does
not fill with spam. The human check (Turnstile), the hidden trap field and the same-origin check
are the only spam controls; there is no per-sender limit and nothing about senders is stored. Spam
that passes the human check reaches Don's inbox; this trade-off is accepted.

**Why this priority**: Every accepted submission now lands in Don's inbox, so the spam controls
matter more than before, but the form works without the extra hardening.

**Independent Test**: Submit with the hidden trap field filled, with a failed human check and from
another origin; confirm each is refused (or, for the trap field, silently accepted) and no email is
sent for any of them. Submit several valid messages in a row from one sender and confirm each is
sent and no "too many messages" error appears.

**Acceptance Scenarios**:

1. **Given** a submission with the hidden trap field filled, **When** it is sent, **Then** the
   sender sees the normal confirmation and no email is sent.
2. **Given** a submission that fails the human check, **When** it is sent, **Then** it is refused
   as today and no email is sent.
3. **Given** a submission from another website or with no origin information, **When** it is
   sent, **Then** it is refused and no email is sent.
4. **Given** a sender who has already sent several messages, **When** they send again and pass
   the human check, **Then** the message is sent; the per-sender limits of 3 an hour and 5 a day
   no longer exist, and no fingerprint or send time is recorded.

---

### User Story 5 - Preview deployments do not mix with real enquiries (Priority: P2)

Messages sent from a preview deployment still reach the fixed destination (so Don can see a test
send work), but every preview email is clearly marked as coming from a preview, so it is never
mistaken for a real enquiry.

**Why this priority**: Preview testing must stay possible, and previously preview messages were
kept apart in a separate store. With email there is one inbox, so the separation becomes a label.

**Independent Test**: Send a message from a preview deployment and confirm its email subject and
body say it came from a preview; send one from production and confirm it carries no such mark.

**Acceptance Scenarios**:

1. **Given** a preview deployment, **When** a message is sent from it, **Then** the email's
   subject begins with a preview marker and the body names the preview it came from.
2. **Given** production, **When** a message is sent, **Then** the email carries no preview marker.

---

### User Story 6 - A visitor understands where their message goes (Priority: P2)

The privacy policy and the note on the Contact page describe the new handling in plain language:
the message is sent by email to Don's inbox and not stored on the site; the email service used;
that the sender's IP address is not stored; that Don keeps the email only as long as needed to
deal with the enquiry; and how to ask for it to be deleted.

**Why this priority**: Consent is only informed if the policy matches what actually happens.

**Independent Test**: Read the privacy policy contact-form, security and "your choices" sections
and the note on the Contact page; confirm every statement about storage location, the database,
recovery history, retention and notifications matches this spec, and nothing still says messages
are stored in a database or that no email is sent.

**Acceptance Scenarios**:

1. **Given** the privacy policy, **When** a visitor reads the contact form section, **Then** it
   says the message is emailed to Don and not stored by the site, names the email service, states
   that the email is kept only as long as needed to deal with the enquiry and is deleted on
   request, and no longer mentions database storage, its region or "no email is
   sent".
2. **Given** the privacy policy, **When** a visitor reads how to have a message deleted, **Then**
   it describes deleting the email from Don's inbox, with no mention of database recovery history.
3. **Given** the Contact page, **When** a visitor reads the note near the form, **Then** it matches
   the retention statement in the policy.
4. **Given** the privacy policy, **When** its contents change, **Then** its "Last updated" date
   changes too.

---

### User Story 7 - Don completes the one-time email setup (Priority: P3)

The setup walkthrough and setup check cover the steps only Don can do: turning on Cloudflare's
email routing for a sending subdomain only (for example `mail.doncoleman.ca`), leaving the apex
domain's iCloud mail records untouched,
verifying the fixed destination address, and confirming that the old message-retrieval access key
and the sender-fingerprint salt are no longer required. The setup check reports what is missing and passes when it is all done.

**Why this priority**: Needed before release, but the feature can be built and tested locally
first.

**Independent Test**: Run the setup check with email routing off and the destination unverified
and see both reported as missing; after the walkthrough, see them pass; confirm the old retrieval
key and fingerprint salt are no longer listed as required.

**Acceptance Scenarios**:

1. **Given** email routing is not set up, **When** Don runs the setup check, **Then** it names the
   missing email setup items.
2. **Given** email routing is on and the destination is verified, **When** Don runs the setup
   check, **Then** those items pass.
3. **Given** the existing iCloud mail records on the apex domain, **When** email setup is
   complete, **Then** those records are unchanged, Don's existing mailbox still receives mail, and
   the DNS baseline and its parity check include the records email routing adds on the sending
   subdomain.
4. **Given** the setup check after this change, **When** it lists required secrets, **Then**
   neither the message-retrieval key (`CONTACT_READ_TOKEN`) nor the sender-fingerprint salt
   (`IP_HASH_SALT`) is among them.

### Edge Cases

- **Double-click on Send**: the form already disables Send while sending, so one click sequence
  produces one email.
- **Retry after an unclear outcome** (the visitor's connection drops after the email was sent but
  before the confirmation arrived, and they send again): Don may receive the same message twice.
  This is accepted; the site keeps no record that could detect it, and a duplicate email is
  harmless. (Today a repeated submission identifier is answered from the store without storing
  twice; with no store, that check goes away.)
- **One sender sends many messages that each pass the human check**: every one is emailed. There
  is no per-sender limit; this is the accepted trade-off of keeping no record of senders.
- **Markup, script or line breaks in any field**: the email shows them as plain text. No field can
  add headers, recipients or change the subject's structure (line breaks and control characters in
  the name or project never reach a header).
- **Very long message (5,000 characters)**: delivered whole; field limits are unchanged.
- **Visitor's email address is on the destination domain or is Don's own address**: still
  delivered to the fixed destination; the reply address is still the visitor's.
- **Email service refuses a send for any limit of its own**: sending fails closed with the
  existing service-unavailable error; nothing is billed. (Sends to a verified destination do not
  count toward Cloudflare's sending quota or daily limits.)
- **The fixed destination stops being verified** (for example Don removes it): every send fails
  closed and the setup check reports the destination as missing.
- **Delivery is delayed or the email lands in spam after hand-off**: outside the site's control;
  the visitor has already seen the confirmation. The setup steps cover the sender authentication
  that keeps these emails out of spam.
- **JavaScript turned off**: unchanged from today; the page explains the form needs JavaScript.
- **Old retrieval key or fingerprint salt still set in a secret store after the change**:
  harmless; the setup check no longer requires either and the follow-up notes they can be deleted.
- **A production message arrives after Don's final collection but before the merge deploy drops
  the store**: it is lost. This small window is accepted; the pre-merge step has Don collect and
  re-check immediately before approving to keep it as short as possible.
- **Other open branches' previews after this branch's preview deploy drops the shared preview
  store**: their contact form answers "service unavailable" until they merge main. Accepted.

## Requirements *(mandatory)*

### Functional Requirements

**Delivery**

- **FR-001**: Each accepted contact submission MUST be sent as one email to a single fixed
  destination address set in the site's committed configuration. The address is not taken from
  the request, a form field or any visitor input, and only one destination is allowed.
- **FR-002**: The email MUST contain the visitor's name, email, organization (or a clear "not
  given"), project (or "not given"), message, and the time received. It MUST be plain text, with
  every field shown as text and never interpreted as markup.
- **FR-003**: The email MUST set the visitor's email address as its reply address, and its sender
  MUST be an address on the sending subdomain (for example `mail.doncoleman.ca`) with a display
  name that names the site.
- **FR-004**: The subject MUST identify the email as a contact-form message and include the
  visitor's name and, when present, the project; any line break or control character in those
  values MUST be removed before it is used in the subject.
- **FR-005**: The visitor MUST see the confirmation only after the email service has accepted the
  email. If it refuses or cannot be reached, the submission MUST fail closed with the existing
  service-unavailable error, and the visitor's entries stay in the form.
- **FR-006**: Emails sent from a preview deployment MUST be marked as preview in the subject and
  body. Production emails MUST carry no such mark.

**Unchanged visitor experience**

- **FR-007**: The Contact page, its fields, limits, consent text, validation, accessibility
  behaviour, error and confirmation states, human check, hidden trap field, same-origin check and
  body-size limit MUST behave as they do today (feature 007), except for the privacy wording in
  FR-014 and FR-015 and the removed per-sender limit (FR-012). No email is sent for any refused
  or trap-field submission.
- **FR-008**: The contact form MUST stay within the existing performance budget and load no new
  client-side script.

**What is no longer kept**

- **FR-009**: The site MUST NOT write any submitted field (name, email, organization, project,
  message) to any database, file or log. The contact message store MUST be removed from both the
  production and preview databases through a committed, CI-applied change; the questions
  feature's data in the same databases MUST be unaffected.
- **FR-010**: The message-retrieval endpoint (list new messages, mark read) MUST be removed; any
  request to its addresses MUST receive the site's normal "not found" API response. Its access
  key (`CONTACT_READ_TOKEN`) and the sender-fingerprint salt (`IP_HASH_SALT`) MUST no longer be
  required by the Worker configuration, the code or the setup check.
- **FR-011**: The scheduled daily clean-up of contact messages MUST be removed. It is the Worker's
  only scheduled job, so the Cron Trigger is removed from the Worker configuration in both
  environments.
- **FR-012**: The contact API MUST NOT limit submissions per sender and MUST NOT store or compute
  anything about a sender (no IP address, salted fingerprint or send time). The per-sender limits
  of 3 an hour and 5 a day, and the "too many messages" response, are removed from the contact
  API. The human check, hidden trap field and same-origin check (FR-007) are the spam controls;
  spam that passes the human check reaching Don's inbox is an accepted trade-off.
- **FR-013**: Logs MUST record one outcome line per request (sent, trap, invalid, human check
  failed, unavailable, forbidden, too large), with no field value, address or token. The "stored"
  and "duplicate" outcomes are replaced by "sent", and the "rate limited" outcome is removed.

**Privacy wording**

- **FR-014**: The privacy policy MUST state that contact messages are sent by email to Don's
  inbox and are not stored by the site; name the email service; state that the sender's IP
  address is not stored or used to limit sending; state that Don keeps contact emails only as
  long as needed to deal with the enquiry and deletes one on request (no fixed period); explain
  how to ask for a message to be deleted; and remove every statement about D1 storage, its
  region, database recovery history, the 12-month retention period, stored IP fingerprints and
  "no email is sent". Its "Last updated" date MUST change.
- **FR-015**: The note on the Contact page MUST match the policy's retention statement and keep
  its link to the privacy policy.

**Setup and operations**

- **FR-016**: The setup check and walkthrough MUST include: email routing turned on for the
  sending subdomain only (for example `mail.doncoleman.ca`), never the apex domain; the fixed
  destination address verified in Email Routing; and the sender authentication records on the
  sending subdomain in place. Each step says what to do, where, and how to confirm it. The apex
  domain's iCloud MX, SPF and DKIM records MUST stay unchanged, and the DNS baseline MUST be
  updated to include the records email routing adds on the subdomain. Planning MUST confirm from
  Cloudflare's documentation that routing can be turned on for the subdomain while the apex stays
  off.
- **FR-017**: The message store's removal ships in the same pull request as the switch to email.
  That pull request MUST list collecting any unread stored production messages as a pre-merge
  item for Don, to be done immediately before he approves, with a final re-check of the retrieval
  endpoint just before approving; auto-merge stays off until he confirms it is done. Messages that
  arrive after that re-check and before the deploy are an accepted loss. Preview messages are test
  sends and are dropped without collection when the branch's preview deploy applies the change.
- **FR-018**: All Worker configuration (including the email binding and the removed Cron Trigger)
  and the removal of the message store MUST be committed and applied through CI, never by hand in the dashboard
  (Principle VIII).
- **FR-019**: Setup and repository documentation that describes stored contact messages, the
  retrieval key or message retrieval MUST be updated to describe email delivery instead.

### Key Entities

- **Contact submission**: what the visitor enters (name, email, optional organization, optional
  project, message, consent) plus a per-page submission identifier. It exists only while the
  request is handled and is never stored by the site.
- **Contact email**: the email built from one accepted submission. Fixed sender on the site's
  domain, fixed single destination, reply address set to the visitor, subject naming the visitor
  (and project), plain-text body with every field and the time received, and a preview mark when
  sent from a preview. Once handed to the email service it lives only in Don's mailbox.
- **Fixed destination**: the one verified address Don owns that every contact email goes to. It
  is configuration, not data, and it is the only recipient the site can ever send to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of accepted submissions in tests produce exactly one email to the fixed
  destination containing every entered field, and the visitor sees the confirmation for each.
- **SC-002**: A test message sent from production reaches Don's inbox within 5 minutes of the
  visitor seeing the confirmation, and pressing Reply addresses the visitor.
- **SC-003**: 100% of simulated send failures show the visitor the service-unavailable error with
  every entered value still in the form, and none shows the confirmation.
- **SC-004**: After release, the site holds zero contact messages: the message store does not
  exist in either environment and no submitted field value appears in any site storage or log.
- **SC-005**: Every request to the old retrieval addresses returns "not found", with or without
  the old key.
- **SC-006**: 0 emails are sent for trap-field, failed-human-check, cross-origin or invalid
  submissions in tests.
- **SC-007**: Running costs do not rise: contact email uses only the free allowance for sending
  to verified addresses, and monthly cost stays at or below the $13 ceiling (expected change: $0).
- **SC-008**: Don's existing domain mailbox keeps receiving mail after email setup, confirmed by
  the setup check's mail-record checks passing.

## Assumptions

- The fixed destination is a mailbox Don owns and can verify (default: the site's published
  contact address, contact@doncoleman.ca, already public in the privacy policy, so committing it
  exposes nothing new). The exact address is a setup choice made in planning.
- Cloudflare allows a Worker to send email to verified destination addresses at no cost on any
  plan, including when only Email Routing is configured, and such sends do not count toward its
  sending quota or daily limits; sending to arbitrary recipients would need the paid plan. This is
  why the destination is fixed and why no copy is sent to the visitor.
- Free sends to verified destinations must come from a domain with Email Routing turned on.
  Turning routing on for the apex would replace the domain's iCloud MX records, which Cloudflare
  says cannot coexist with an external mail server, so routing is turned on for a sending
  subdomain only (for example `mail.doncoleman.ca`). Cloudflare's subdomain documentation says
  routing can be added per subdomain with records placed on that subdomain; whether that works
  with the apex left off is the main technical risk and is confirmed in planning.
- The visitor does not receive a copy of their message (it would need sending to an unverified
  address). The confirmation on screen is unchanged.
- Duplicate emails from an unclear retry are acceptable; the site keeps no record to prevent them.
- The questions feature keeps the shared database, so only the contact message store is removed,
  not the database itself.
- Production messages already in the store are collected by Don immediately before he approves
  the pull request; no export of them is kept in the repository. Preview messages are test sends
  and are not collected.
- Preview deployments send to the same fixed destination, marked as preview, rather than to a
  second address.

## Dependencies

- **Constitution amendment (first task of this slice, via the constitution command, same pull
  request)**: Principle V describes the Contact API as storing submissions, letting Don retrieve
  them and rate-limiting each sender; Principle VII requires contact submissions to be stored only
  in D1, a salted IP hash, preview messages stored separately and stored submissions deleted after
  a retention period; Principle VIII names message retrieval as the bearer-token endpoint, lists
  D1 migrations and Cron Triggers, and says the contact API rate-limits submissions; the Technology
  Constraints list D1 storage and a Cron Trigger for the Contact API and do not list an email
  service; the Security Baseline names the contact API's per-sender rate limit. The amendment
  describes email delivery with no stored contact data and no per-sender limit. It is made before
  any other implementation task and reviewed with this pull request as a major change.
- Cloudflare Email Routing on the sending subdomain only, and a verified destination address
  (Don, during setup).

## Out of Scope / Follow-up Work

- Sending a copy or acknowledgement email to the visitor (needs paid sending to arbitrary
  addresses).
- Deleting the retired retrieval key (`CONTACT_READ_TOKEN`) and fingerprint salt (`IP_HASH_SALT`)
  from the production and preview secret stores (Don, after release; noted in the walkthrough).
- Retiring or reconfiguring Don's scheduled assistant that used the retrieval endpoint (outside
  this repository).
- HTML-formatted contact emails, attachments, or more than one destination.
- Any change to the questions feature's database use, or to the preview database pruning tracked
  in issue #82.
