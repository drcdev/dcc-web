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
which describe contact submissions as stored in D1 and retrieved with a bearer token; those must
be amended first (see Dependencies).

## Clarifications

_None yet. Open questions are marked [NEEDS CLARIFICATION] below for the clarify phase._

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

If the message cannot be delivered for sending (the email service refuses it, is unreachable, or
a free-plan sending limit is reached), the visitor sees the existing "not sent, please try again"
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
3. **Given** the existing validation, consent, human-check and sending-limit errors, **When** they
   occur, **Then** the visitor sees the same errors as today and no email is sent.

---

### User Story 3 - The site no longer keeps contact messages (Priority: P1)

After this change the site holds no copy of any contact message. The message store is removed
from both production and preview, the retrieval endpoint that Don's assistant used is gone, its
access key is retired, and the daily clean-up of old messages is no longer needed for contact
data. Messages already stored when the change ships are not lost: Don has had the chance to
collect them before the store is removed.

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
4. **Given** messages still stored before the deploy, **When** the change is prepared for release,
   **Then** the release steps tell Don to collect any unread messages first, and the store is
   removed only after that step.

---

### User Story 4 - Spam and abuse are still kept out (Priority: P2)

Automated and abusive submissions are still rejected before any email is sent, so Don's inbox does
not fill with spam and the free-plan sending allowance is not used up by abuse.

**Why this priority**: Every accepted submission now lands in Don's inbox, so the spam controls
matter more than before, but the form works without the extra hardening.

**Independent Test**: Submit with the hidden trap field filled, with a failed human check, from
another origin, and more often than the sending limits allow; confirm each is refused (or, for the
trap field, silently accepted) and no email is sent for any of them.

**Acceptance Scenarios**:

1. **Given** a submission with the hidden trap field filled, **When** it is sent, **Then** the
   sender sees the normal confirmation and no email is sent.
2. **Given** a submission that fails the human check, **When** it is sent, **Then** it is refused
   as today and no email is sent.
3. **Given** a submission from another website or with no origin information, **When** it is
   sent, **Then** it is refused and no email is sent.
4. **Given** a sender who has reached the sending limit, **When** they send again, **Then** they
   see the existing "too many messages" error and no email is sent. The limits are
   [NEEDS CLARIFICATION: keep today's per-sender limits of 3 an hour and 5 a day, which needs the
   site to keep a short-lived record of each sender's salted fingerprint and send times (no message
   content) — or replace them with a coarser limit the platform provides that needs no stored
   record — or rely on the human check alone?]

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
what happens to the sender's IP address; how long Don keeps the email; and how to ask for it to be
deleted.

**Why this priority**: Consent is only informed if the policy matches what actually happens.

**Independent Test**: Read the privacy policy contact-form, security and "your choices" sections
and the note on the Contact page; confirm every statement about storage location, the database,
recovery history, retention and notifications matches this spec, and nothing still says messages
are stored in a database or that no email is sent.

**Acceptance Scenarios**:

1. **Given** the privacy policy, **When** a visitor reads the contact form section, **Then** it
   says the message is emailed to Don and not stored by the site, names the email service, states
   how long the email is kept, and no longer mentions database storage, its region or "no email is
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
email routing for the domain (or a sending subdomain) without breaking his existing mailbox,
verifying the fixed destination address, and confirming that the old message-retrieval access key
is no longer required. The setup check reports what is missing and passes when it is all done.

**Why this priority**: Needed before release, but the feature can be built and tested locally
first.

**Independent Test**: Run the setup check with email routing off and the destination unverified
and see both reported as missing; after the walkthrough, see them pass; confirm the old retrieval
key is no longer listed as required.

**Acceptance Scenarios**:

1. **Given** email routing is not set up, **When** Don runs the setup check, **Then** it names the
   missing email setup items.
2. **Given** email routing is on and the destination is verified, **When** Don runs the setup
   check, **Then** those items pass.
3. **Given** the existing mail records for the domain, **When** email setup is complete, **Then**
   Don's existing mailbox still receives mail, and the DNS baseline and its parity check reflect
   any records email routing adds.
4. **Given** the setup check after this change, **When** it lists required secrets, **Then** the
   message-retrieval key is not among them.

### Edge Cases

- **Double-click on Send**: the form already disables Send while sending, so one click sequence
  produces one email.
- **Retry after an unclear outcome** (the visitor's connection drops after the email was sent but
  before the confirmation arrived, and they send again): Don may receive the same message twice.
  This is accepted; the site keeps no record that could detect it, and a duplicate email is
  harmless. (Today a repeated submission identifier is answered from the store without storing
  twice; with no store, that check goes away.)
- **Markup, script or line breaks in any field**: the email shows them as plain text. No field can
  add headers, recipients or change the subject's structure (line breaks and control characters in
  the name or project never reach a header).
- **Very long message (5,000 characters)**: delivered whole; field limits are unchanged.
- **Visitor's email address is on the destination domain or is Don's own address**: still
  delivered to the fixed destination; the reply address is still the visitor's.
- **Email service daily or monthly sending allowance reached**: sending fails closed with the
  existing service-unavailable error; nothing is billed.
- **The fixed destination stops being verified** (for example Don removes it): every send fails
  closed and the setup check reports the destination as missing.
- **Delivery is delayed or the email lands in spam after hand-off**: outside the site's control;
  the visitor has already seen the confirmation. The setup steps cover the sender authentication
  that keeps these emails out of spam.
- **JavaScript turned off**: unchanged from today; the page explains the form needs JavaScript.
- **Old retrieval key still set in a secret store after the change**: harmless; the setup check
  no longer requires it and the follow-up notes it can be deleted.

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
  MUST be an address on the site's own domain (or sending subdomain) that names the site.
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
  FR-014 and FR-015. No email is sent for any refused or trap-field submission.
- **FR-008**: The contact form MUST stay within the existing performance budget and load no new
  client-side script.

**What is no longer kept**

- **FR-009**: The site MUST NOT write any submitted field (name, email, organization, project,
  message) to any database, file or log. The contact message store MUST be removed from both the
  production and preview databases through a committed, CI-applied change; the questions
  feature's data in the same databases MUST be unaffected.
- **FR-010**: The message-retrieval endpoint (list new messages, mark read) MUST be removed; any
  request to its addresses MUST receive the site's normal "not found" API response. Its access
  key MUST no longer be required by the Worker configuration or the setup check.
- **FR-011**: The scheduled daily clean-up of contact messages MUST be removed. Any scheduled job
  or stored record that remains MUST exist only for what User Story 4's sending limit needs.
- **FR-012**: Sending limits MUST refuse a sender who exceeds them with the existing "too many
  messages" error and its retry time, as resolved in User Story 4. If a per-sender record is kept,
  it MUST hold only a salted fingerprint of the sender's IP address and send times, never any
  field value, and MUST be deleted automatically within 2 days.
- **FR-013**: Logs MUST record one outcome line per request (sent, trap, invalid, human check
  failed, rate limited, unavailable, forbidden, too large), with no field value, address,
  fingerprint or token. The "stored" and "duplicate" outcomes are replaced by "sent".

**Privacy wording**

- **FR-014**: The privacy policy MUST state that contact messages are sent by email to Don's
  inbox and are not stored by the site; name the email service; describe what is done with the
  sender's IP address under the chosen sending limit; state how long Don keeps contact emails
  [NEEDS CLARIFICATION: keep the 12-month promise, with Don deleting contact emails by hand
  after 12 months — or say they are kept only as long as needed to deal with the enquiry, with no
  fixed period — or another period?]; explain how to ask for a message to be deleted; and remove
  every statement about D1 storage, its region, database recovery history and "no email is sent".
  Its "Last updated" date MUST change.
- **FR-015**: The note on the Contact page MUST match the policy's retention statement and keep
  its link to the privacy policy.

**Setup and operations**

- **FR-016**: The setup check and walkthrough MUST include: email routing turned on for the
  sending domain or subdomain; the fixed destination address verified; and sender
  authentication records in place. Each step says what to do, where, and how to confirm it. The
  steps MUST keep Don's existing domain mail working, and the DNS baseline MUST be updated to
  include any record email routing adds.
- **FR-017**: The release steps MUST tell Don to collect any unread stored messages before the
  change that removes the message store is applied to production.
- **FR-018**: All Worker configuration, the removal of the message store and any remaining
  scheduled job MUST be committed and applied through CI, never by hand in the dashboard
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
- **Sender limit record** (only if kept, see User Story 4): a salted fingerprint of the sender's
  IP address and the times they sent, with no message content, deleted within 2 days.

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
- **SC-006**: 0 emails are sent for trap-field, failed-human-check, cross-origin, invalid or
  rate-limited submissions in tests.
- **SC-007**: Running costs do not rise: contact email uses only the free allowance for sending
  to verified addresses, and monthly cost stays at or below the $13 ceiling (expected change: $0).
- **SC-008**: Don's existing domain mailbox keeps receiving mail after email setup, confirmed by
  the setup check's mail-record checks passing.

## Assumptions

- The fixed destination is a mailbox Don owns and can verify (default: the site's published
  contact address, contact@doncoleman.ca, already public in the privacy policy, so committing it
  exposes nothing new). The exact address is a setup choice made in planning.
- Cloudflare allows a Worker to send email to verified destination addresses at no cost on the
  free plan; sending to arbitrary recipients would need the paid plan. This is why the destination
  is fixed and why no copy is sent to the visitor.
- Sending requires Cloudflare's email routing on the sender's domain. The domain's mail is
  currently hosted elsewhere (its mail records point at another provider), so planning must find a
  way to turn email routing on that leaves that mailbox working, most likely a dedicated sending
  subdomain. This is the main technical risk.
- The visitor does not receive a copy of their message (it would need sending to an unverified
  address). The confirmation on screen is unchanged.
- Duplicate emails from an unclear retry are acceptable; the site keeps no record to prevent them
  unless one is kept for sending limits anyway.
- The questions feature keeps the shared database, so only the contact message store is removed,
  not the database itself.
- Messages already in the store are collected by Don before the store is removed; no export of
  them is kept in the repository.
- Preview deployments send to the same fixed destination, marked as preview, rather than to a
  second address.

## Dependencies

- **Constitution amendment (blocking, via the constitution command)**: Principle V describes the
  Contact API as storing submissions and letting Don retrieve them; Principle VII requires contact
  submissions to be stored only in D1, preview messages stored separately and stored submissions
  deleted after a retention period; Principle VIII names message retrieval as the bearer-token
  endpoint and lists D1 migrations and Cron Triggers; the Technology Constraints list D1 storage
  and a Cron Trigger for the Contact API and do not list an email service. These must be amended
  to describe email delivery before implementation, as a reviewed major change.
- Cloudflare email routing on the sending domain or subdomain, and a verified destination address
  (Don, during setup).

## Out of Scope / Follow-up Work

- Sending a copy or acknowledgement email to the visitor (needs paid sending to arbitrary
  addresses).
- Deleting the retired retrieval key from the production and preview secret stores (Don, after
  release; noted in the walkthrough).
- Retiring or reconfiguring Don's scheduled assistant that used the retrieval endpoint (outside
  this repository).
- HTML-formatted contact emails, attachments, or more than one destination.
- Any change to the questions feature's database use, or to the preview database pruning tracked
  in issue #82.
