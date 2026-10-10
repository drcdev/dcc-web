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

It replaces an integration (adds an email service, removes the message store and retrieval
endpoint), changes how contact data is collected, stored, retrieved and deleted, and changes
Worker and DNS configuration. Like every pull request under Constitution Principle III (as amended
by issue #143), it merges only on Don's approval. It also conflicts with the current wording of Principles I, V, VII and VIII, the Technology Constraints
and the Security Baseline, which describe contact submissions as stored in D1, rate-limited per
sender and retrieved with a bearer token, and integration tests as running against a real local
database; those are amended as this slice's first task (see Dependencies).

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
  *Update 2026-10-10: when Don tried to turn on Email Routing for `mail.doncoleman.ca`, the
  Cloudflare dashboard proposed changing the apex doncoleman.ca MX, SPF and DKIM (iCloud) records,
  so subdomain-only routing is not possible there. Don chose the separate-domain fallback (research
  R3) using `drc.dev`, a domain he already owns with Email Routing on in Cloudflare. The Worker
  sends from `contact-form@drc.dev` to the fixed, verified destination `contact@doncoleman.ca`.
  doncoleman.ca's DNS and iCloud mail are untouched, and there is no new cost.*
- Q: Is the constitution amendment made inside this slice or first as a separate step? → A: Inside
  this slice, as the first task, through the constitution command, in the same pull request.
- Q: Does dropping the message store ship in the same pull request as the switch to email? → A: Yes,
  the same pull request. Collecting unread stored messages is a pre-merge step, and auto-merge stays
  off until Don confirms it is done.
  *(Superseded in part by issue #143's single pull-request flow, merged to main during this
  slice: auto-merge is now armed on every pull request and Don's approval is the hold. The
  collection step stays a pre-approval item in the pull request body; Don approves only once it
  is done.)*
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
   approving and with a final re-check of the retrieval endpoint, as a pre-approval step, and the
   pull request merges (removing the store) only after Don has done the step and approved.
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
   sender sees the normal confirmation and no email is sent. The response status and body are
   byte-identical to a real success; response timing is not equalised (the trap path skips the
   human check and the send), which is accepted.
2. **Given** a submission that fails the human check, **When** it is sent, **Then** it is refused
   as today and no email is sent.
3. **Given** a submission from another website, with no `Origin` header, or with an `Origin` of
   `null`, **When** it is sent, **Then** it is refused as today (feature 007's same-origin rule,
   unchanged) and no email is sent.
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

The setup walkthrough and setup check cover the steps only Don can do: confirming Cloudflare's
email routing is on for the separate sending domain `drc.dev` (so doncoleman.ca's DNS and iCloud
mail records are never touched), verifying the fixed destination address, and confirming that the old message-retrieval access key
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
3. **Given** the existing iCloud mail records on doncoleman.ca, **When** email setup is
   complete, **Then** those records are unchanged and Don's existing mailbox still receives mail;
   email setup adds no DNS record on doncoleman.ca.
4. **Given** the setup check after this change, **When** it lists required secrets, **Then**
   neither the message-retrieval key (`CONTACT_READ_TOKEN`) nor the sender-fingerprint salt
   (`IP_HASH_SALT`) is among them.

### Edge Cases

- **Double-click on Send, or Enter pressed repeatedly**: the form already disables Send while
  sending (feature 007 FR-008i), and a second activation by pointer or keyboard does nothing, so
  one send attempt produces one email.
- **Retry after an unclear outcome** (the visitor's connection drops after the email was sent but
  before the confirmation arrived, and they send again): Don may receive the same message twice.
  This is accepted; the site keeps no record that could detect it, and a duplicate email is
  harmless. (Today a repeated submission identifier is answered from the store without storing
  twice; with no store, that check goes away.) The per-page submission identifier is still
  validated and still passed to the human check as its idempotency key, so a replayed
  human-check token is refused; it is not used, and cannot be used, to detect duplicate emails.
- **One sender sends many messages that each pass the human check**: every one is emailed. There
  is no per-sender limit; this is the accepted trade-off of keeping no record of senders.
- **Markup, script or line breaks in any field**: the email shows them as plain text. No field can
  add headers, recipients or change the subject's structure (line breaks and control characters in
  the name or project never reach a header).
- **Very long message (5,000 characters)**: delivered whole; field limits are unchanged.
- **Visitor's email address is on the destination domain or is Don's own address**: still
  delivered to the fixed destination; the reply address is still the visitor's.
- **Email service refuses a send for any limit of its own** (including during an abuse burst that
  passes the human check): sending fails closed with the existing service-unavailable error;
  nothing is billed. The log line carries the service's own error code (for example its
  rate-limit code), so a limit is distinguishable from a generic outage without logging content.
  (Sends to a verified destination do not count toward Cloudflare's sending quota or daily
  limits.)
- **The fixed destination stops being verified** (for example Don removes it): every send fails
  closed and the setup check reports the destination as missing.
- **Delivery is delayed, bounces, or the email lands in spam after hand-off**: outside the site's
  control; the visitor has already seen the confirmation. The site does not track delivery or
  bounces, and a message accepted by the email service but never delivered is lost silently; this
  is accepted. The setup steps cover the sender authentication that keeps these emails out of
  spam.
- **Sending stops working for every visitor** (for example the destination is unverified or the
  binding is misconfigured): there is no alerting. Each failed attempt is logged as
  "unavailable" with the service's error code, visitors see the error and keep their text, and
  the setup check reports a missing destination or routing record. Don notices through the setup
  check, the Worker's logs, or the post-release test send; this absence of monitoring is
  accepted for a site that receives a handful of messages a week.
- **A hung dependency**: the human-check call keeps its existing 5-second timeout, and the send
  call is bounded by the Workers runtime's own request limits; either ending without success
  fails closed with the service-unavailable error. The site adds no retry.
- **JavaScript turned off**: unchanged from today; the page explains the form needs JavaScript.
- **Old retrieval key or fingerprint salt still set in a secret store after the change**:
  harmless; the setup check no longer requires either and the follow-up notes they can be deleted.
- **A production message arrives after Don's final collection but before the merge deploy drops
  the store**: it is lost. The window runs from Don's final re-check of the retrieval endpoint to
  the moment the production deploy that follows the merge drops the store (normally minutes).
  This small window is accepted; the pre-merge step has Don collect and re-check immediately
  before approving to keep it as short as possible.
- **Between the drop and the new code going live in one deploy**: the deploy removes the store
  first and then uploads the new Worker, so for those seconds the old code may answer a
  submission with the service-unavailable error (it already fails closed when its store is
  missing). The visitor keeps their text and can retry. Accepted.
- **The merge is reverted after release**: the drop is irreversible from the repository's side.
  Reverting the code does not bring back messages; the old code would fail closed until a new,
  reviewed migration recreated an empty store. The only recovery of dropped rows is Cloudflare's
  database recovery history (7 days on the plan in use), done by hand by Don, and since every
  real message was collected before approval it is not expected to be needed.
- **Other open branches' previews after this branch's preview deploy drops the shared preview
  store**: their contact form answers "service unavailable" until they merge main. Accepted.

## Requirements *(mandatory)*

### Functional Requirements

**Delivery**

- **FR-001**: Each accepted contact submission MUST be sent as one email to a single fixed
  destination address set in the site's committed configuration (`contact@doncoleman.ca`). The
  address is not taken from the request, a form field or any visitor input, and only one
  destination is allowed. The restriction MUST be enforced twice: by the platform's email binding,
  configured to send only to that one destination and only from the one sender address, and by
  the code, which uses the same committed values; a test proves the two agree in both
  environments.
- **FR-002**: The email MUST contain the visitor's name, email, organization (or a clear "not
  given"), project (or "not given"), message, and the time received (UTC, ISO 8601). It MUST be
  plain text only, with every field shown as text and never interpreted as markup. It is laid out
  for easy reading in any mail program and by a screen reader: one labelled field per line
  ("Name:", "Email:", "Organization:", "Project:", "Received:"), then a blank line, the label
  "Message:" and the message with its line breaks kept. On a preview, the preview line comes first,
  followed by a blank line.
- **FR-002a**: Everything in a contact email that came from the visitor is untrusted data
  (Security Baseline). Any assistant or automated reader of Don's inbox MUST treat it as data and
  never follow it as instructions; the amended constitution's untrusted-data bullet covers contact
  emails explicitly.
- **FR-003**: The email MUST set the visitor's email address as its reply address, as a bare
  address with no display name, and only when it contains exactly one `@` and none of: whitespace,
  control characters, `<`, `>`, `,`, `;`, `"`, `(`, `)`, `\`. When it fails that rule the email has
  no reply address and the body still shows the address; the visitor sees no difference. The
  form's email validation is unchanged (FR-007). The sender MUST be the fixed address
  `contact-form@drc.dev` (on the separate sending domain `drc.dev`) with the display name `doncoleman.ca contact form`; neither
  is taken from visitor input.
- **FR-004**: The subject MUST identify the email as a contact-form message and include the
  visitor's name and, when present, the project (`Contact form: <name>` or
  `Contact form: <name> (about <project>)`). Before use, every control character in those values
  (U+0000–U+001F, U+007F–U+009F, which includes CR, LF, TAB and U+0085) and the Unicode line and
  paragraph separators (U+2028, U+2029) MUST be replaced by a space, runs of whitespace collapsed
  to one space, and the result trimmed. Name and project keep their existing 100-character limits,
  so the subject never exceeds 260 characters.
- **FR-005**: The visitor MUST see the confirmation only after the email service has accepted the
  email, meaning the send call has completed without error. Acceptance means the service has
  taken the message for delivery (queued); it does not mean it has reached the inbox. If the
  service refuses it, cannot be reached, or the call does not complete, the submission MUST fail
  closed with the existing service-unavailable error, and the visitor's entries stay in the form.
  The failure is announced in the form's status area above Send, Send is re-enabled, and focus
  stays on Send so the visitor can retry at once (feature 007 FR-008g and FR-008h, unchanged).
- **FR-006**: Emails sent from a preview deployment MUST be marked as preview in the subject
  (the subject begins with `[Preview] `) and body (the first line names the preview's host).
  Production emails MUST carry no such mark. Whether an email is marked is decided only by the
  environment's committed configuration, never by anything in the request body or a form field,
  and visitor text appears in the subject only after the fixed `Contact form: ` prefix, so a
  visitor can neither add nor remove the mark.

**Unchanged visitor experience**

- **FR-007**: The Contact page, its fields, limits, consent text, validation, accessibility
  behaviour, error and confirmation states, human check, hidden trap field, same-origin check and
  body-size limit MUST behave as they do today (feature 007), except for the privacy wording in
  FR-014 and FR-015 and the removed per-sender limit (FR-012). No email is sent for any refused
  or trap-field submission. The consent tick stays required by validation, so no email is sent
  without it; the site keeps no separate consent record, and the email itself is the record that
  the visitor sent the message having ticked consent.
- **FR-007a** (accessibility kept): The Contact page MUST keep meeting WCAG 2.2 AA exactly as
  feature 007 FR-008 and FR-008a to FR-008p define, all of which stay in force: labels (a),
  required and optional marking (b), input purpose (c), the hidden trap field hidden from
  everyone, out of the tab order and the accessibility tree (d), field errors (e, f), form-level
  errors in the status area with focus kept on Send (g), polite live-region announcements (h),
  the sending state with Send disabled, reading "Sending…" and announced (i), the confirmation
  panel whose heading receives focus so it is announced (j), the consent control and
  "(opens in a new tab)" privacy links (k), the keyboard- and screen-reader-operable human check
  whose failure or failure to load is announced (l), the visible no-JavaScript notice read before
  the fields (m), contrast, focus visibility, reflow and zoom per the design baseline (n), tab
  order (o) and page structure (p). The only change is that the list of form-level errors in
  FR-008g loses "too many messages": its text and the branch that showed it are removed, so no
  orphaned error message remains.
- **FR-007b** (accessibility of changed text): The reworded privacy policy and Contact page note
  MUST meet WCAG 2.2 AA: they keep the existing heading structure and the design baseline's text
  styles (FR-008n governs contrast, reflow and zoom; no new styles are added), every link has
  text that states its purpose on its own (the contact address is a link whose visible text is the
  address itself; the privacy links keep "(opens in a new tab)"), and instructions such as how to
  ask for deletion are written out in words, never conveyed by position, colour or an icon alone.
- **FR-008**: The contact form MUST stay within the existing performance budget and load no new
  client-side script.

**What is no longer kept**

- **FR-009**: The site MUST NOT write any submitted field (name, email, organization, project,
  message) to any database, file or log, on any path: success, refusal, validation failure,
  thrown errors and their messages, and anything the Worker prints that reaches Cloudflare's
  observability logs. The contact message store (the messages table and its indexes, and nothing
  else) MUST be removed from both the production and preview databases through one committed,
  CI-applied migration that succeeds whether the table is present or already gone. The questions
  feature's tables (its cached question sets and its usage bucket) and their data MUST be
  unaffected. Removal is confirmed by a schema test against the local database built from the
  committed migrations, and after deploy by listing each remote database's tables.
- **FR-010**: The message-retrieval endpoint (list new messages, mark read) MUST be removed; any
  request to any path under `/api/messages`, with any method, with or without an
  `Authorization` header (valid old key, wrong key or none), MUST receive the site's normal "not
  found" API response, identical in every case. Its access key (`CONTACT_READ_TOKEN`) and the
  sender-fingerprint salt (`IP_HASH_SALT`) MUST no longer be required or mentioned by the Worker
  configuration (both environments' required-secret lists), the code, the generated Worker types,
  the test configuration and fixtures, local environment templates, CI workflows, the setup
  check's secret manifest or the setup check. Every source file, constant (per-sender limits,
  retention period) and test that only served the store, retrieval, fingerprinting, per-sender
  limiting or retention MUST be removed with it.
- **FR-011**: The scheduled daily clean-up of contact messages MUST be removed. It is the Worker's
  only scheduled job, so the Cron Trigger is removed from the Worker configuration in both
  environments.
- **FR-012**: The contact API MUST NOT limit submissions per sender and MUST NOT store or compute
  anything about a sender (no IP address, salted fingerprint or send time). The per-sender limits
  of 3 an hour and 5 a day, and the "too many messages" response, are removed from the contact
  API. The human check, hidden trap field and same-origin check (FR-007) are the spam controls;
  spam that passes the human check reaching Don's inbox is an accepted trade-off.
- **FR-013**: Logs MUST record one outcome line per request (sent, trap, invalid, human check
  failed, unavailable, forbidden, too large), with no field value, address, IP, token, message ID
  or error message text. The line's only fields are the outcome and, for "unavailable", the error's
  class name and, when the email service supplies one, its documented error code (for example the
  codes for an unverified destination, a refused recipient, a rate limit or a delivery failure),
  so failure kinds are distinguishable without content. The "stored" and "duplicate" outcomes are
  replaced by "sent", and the "rate limited" outcome is removed.

**Privacy wording**

- **FR-014**: The privacy policy MUST state that contact messages are sent by email to Don's
  inbox and are not stored by the site; name the email service (Cloudflare) that carries the
  message and say that the email is then kept in Don's mailbox with his mail provider; state that
  the sender's IP address is not stored by the site or used to limit sending, while it is still
  passed to the human-check service as the policy already describes (feature 007 FR-012b,
  unchanged); state that Don keeps contact emails only as long as needed to deal with the enquiry
  and deletes one on request (no fixed period), answering a deletion request by hand within 30
  days as the policy already promises for requests; explain in words how to ask for a message to
  be deleted (a new message through the form, or an email to the address shown as a link); say
  that deletion removes the email and any copy Don has made from his mailbox (including its
  deleted-items folder), while the mail provider's own backups follow that provider's terms; and
  remove every statement about D1 storage, its region, database recovery history, the 12-month
  retention period, stored IP fingerprints and "no email is sent". The wording is plain language
  (Constitution, Development Workflow: short sentences, no jargon beyond naming the services) and
  is reviewed by Don. Its "Last updated" line MUST change to the release date, in its existing
  visible form (`Last updated: <day> <month> <year>`); the page has no machine-readable date and
  none is added.
- **FR-015**: The note on the Contact page MUST match the policy's retention statement and keep
  its link to the privacy policy, with that link's visible text naming the privacy policy and
  saying it opens in a new tab (feature 007 FR-008k).

**Setup and operations**

- **FR-016**: The setup check and walkthrough MUST include: email routing on for the separate
  sending domain `drc.dev`, and the fixed destination address verified in Email Routing. Each step
  says what to do, where, and how to confirm it. Nothing is added, changed or removed in
  doncoleman.ca's DNS: its iCloud MX, SPF and DKIM records MUST stay unchanged. Each walkthrough
  step names a pass condition that the setup check reports:
  - **Routing on the sending domain**: the Cloudflare API reports Email Routing enabled and ready
    on the `drc.dev` zone (the zone is in the same account; the read-only token covers it).
  - **Destination verified**: the Cloudflare API's list of Email Routing destination addresses
    for the account contains the fixed destination with a verification date. A script cannot read
    the inbox, so this API record is the only evidence of verification; an address that is listed
    without a date is reported as waiting for the verification link.
  - **Sender authentication**: `drc.dev`'s routing and sender records are the ones Cloudflare
    already manages for that zone; this slice adds none.
  - **doncoleman.ca untouched**: the existing mail-records check compares every apex iCloud MX,
    SPF and DKIM record with the committed DNS baseline and fails on any difference.
- **FR-016a** (ordering): No commit that adds the email binding is pushed (so no preview or
  production deploy carries it) until Email Routing is on for `drc.dev` and the fixed destination
  is verified. Until then the work stays local, with every test running offline.
- **FR-017**: The message store's removal ships in the same pull request as the switch to email.
  That pull request MUST list collecting any unread stored production messages as a pre-merge
  item for Don, to be done immediately before he approves, with a final re-check of the retrieval
  endpoint just before approving; the step is done when that re-check returns an empty list of
  new messages. Collected messages go wherever Don's assistant already puts them (outside this
  repository; no export is committed). Messages already marked read were collected earlier and are
  dropped with the store. Messages collected before the change keep the promise they were sent
  under: Don keeps them no longer than 12 months from arrival. The pre-merge item is a checkbox in
  the pull request body; Don confirms it by ticking it (or saying so in a pull request comment)
  and withholds approval until he has (auto-merge is armed, so his approval is the hold). Messages that arrive after that re-check and before the
  deploy are an accepted loss. Preview messages are test sends and are dropped without collection
  when the branch's preview deploy applies the change.
- **FR-017a** (after release): The pull request body MUST also list, as post-merge items owned by
  Don: one production test send (SC-002), and deleting the retired `CONTACT_READ_TOKEN` and
  `IP_HASH_SALT` from both Workers' secret stores within 7 days of release. With the endpoint gone
  neither value grants any access, so the deletion is hygiene, not a security deadline.
- **FR-018**: All Worker configuration (including the email binding and the removed Cron Trigger)
  and the removal of the message store MUST be committed and applied through CI, never by hand in
  the dashboard (Principle VIII). The committed configuration MUST declare zero Cron Triggers
  explicitly in both the production and preview environments (an absent setting would leave the
  deployed trigger in place); a configuration test proves this for both, and the setup check
  reports any Cron Trigger still registered on the production Worker after its deploy.
- **FR-019**: Repository documentation, setup material, skills and code comments that describe
  stored contact messages, the retrieval key or message retrieval MUST be updated to describe email
  delivery instead. The scope is set by a search, not by judgement: every file outside `specs/`
  (past features' specs are history and stay as written) and outside `migrations/` (applied
  migrations are never edited) that matches `CONTACT_READ_TOKEN`, `IP_HASH_SALT`, `/api/messages`,
  `messages` table references, or contact-message retention, rate limiting or retrieval is either
  updated or shown to be still correct, and the search is repeated before the pull request opens.
- **FR-020**: The pull request follows the single flow of Constitution Principle III (as amended
  by issue #143): it is opened from the machine account, auto-merge is armed after the final push,
  and its body lists every `[PREVIEW-CHECK]` item and the pre-approval collection step (FR-017)
  under their own heading for Don to check before approving. The body states that the slice
  amends the constitution (4.0.0) and summarises what it replaces (the message store and retrieval
  endpoint, by email delivery) so Don can review it. *(Originally: flag the pull request as a
  major change; that classification was removed by issue #143.)*

### Key Entities

- **Contact submission**: what the visitor enters (name, email, optional organization, optional
  project, message, consent) plus a per-page submission identifier, which is now used only as the
  human check's idempotency key. It exists only while the request is handled and is never stored
  by the site.
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
- **SC-002**: A test message sent from production (after merge) reaches Don's inbox within 5
  minutes of the visitor seeing the confirmation, and pressing Reply addresses the visitor. The
  same 5-minute expectation applies to the pre-merge test send from the branch preview, which
  must also carry the preview mark (a preview check in the pull request).
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
  the setup check's mail-record check (every doncoleman.ca iCloud MX, SPF and DKIM record identical
  to the committed DNS baseline) and DNS parity check passing; email setup adds no record there.
- **SC-009**: The Contact page and the privacy policy pass the site's automated accessibility
  checks with no WCAG 2.2 AA violations after the change, in the existing accessibility test
  project that covers every page template.

## Assumptions

- The fixed destination is a mailbox Don owns and can verify (default: the site's published
  contact address, contact@doncoleman.ca, already public in the privacy policy, so committing it
  exposes nothing new). Planning fixed it as contact@doncoleman.ca.
- The email binding needs no API key or other secret, so this feature adds no secret; the
  destination and sender addresses are public configuration, not secrets. A test confirms the
  Worker's required-secret list is the human-check secret alone.
- Cloudflare allows a Worker to send email to verified destination addresses at no cost on any
  plan, including when only Email Routing is configured, and such sends do not count toward its
  sending quota or daily limits; sending to arbitrary recipients would need the paid plan
  (developers.cloudflare.com/email-service/platform/pricing/, read 2026-10-10). This is why the
  destination is fixed and why no copy is sent to the visitor. The claim is re-checked against
  that page before release and whenever Cloudflare announces a change to Email Routing or Email
  Service pricing; if it stops holding, the change is a cost question for Don under Principle IX.
- Free sends to verified destinations must come from a domain with Email Routing turned on.
  Turning routing on for doncoleman.ca would replace its iCloud MX records, which Cloudflare says
  cannot coexist with an external mail server. The first plan was a sending subdomain
  (`mail.doncoleman.ca`), but on 2026-10-10 the dashboard proposed changing the apex MX, SPF and
  DKIM records when Don tried it, so Don chose the separate-domain fallback (research R3): the
  Worker sends from `contact-form@drc.dev`. `drc.dev` is a domain Don already owns with Email
  Routing on, so there is no new cost.
- **Assumption (risk)**: `drc.dev` is a zone in the same Cloudflare account as the Worker, so the
  `send_email` binding can send from it and the read-only token can read its routing settings.
  Setup item 17 verifies this; if it fails, the binding cannot send and the plan is revisited.
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
  any other implementation task and reviewed with this pull request. Its
  content, so it can be made without interpretation:
  - **V**: the Contact API receives submissions and emails each accepted one to one fixed,
    verified address; it stores nothing, has no retrieval endpoint and verifies Turnstile.
  - **VII**: submissions are never written to a database, file or log by the site; each is
    emailed to one destination fixed in committed configuration; no IP address or fingerprint is
    stored or computed; preview emails are marked; the privacy policy names the email service and
    the retention-on-request promise. The "collect only needed fields, never log" and secrets
    rules stay.
  - **VIII**: Email Routing joins the named products; message retrieval is no longer the
    bearer-token example; the contact API "verifies Turnstile server-side" with no rate limit;
    contact email goes only to verified destination addresses; turning on Email Routing for the
    sending domain and verifying the destination are one-time account setup done by Don and
    confirmed by the setup check (like the Turnstile widget), not Worker configuration, so the
    "never by hand in the dashboard" rule still covers the binding, migrations and Cron Triggers.
  - **I**: the integration-test layer runs against the local Workers runtime, with a real local
    database where the endpoint uses one.
  - **Technology Constraints**: the Contact API line names the email binding instead of D1 and the
    Cron Trigger, and an Email line is added (Email Routing on a separate sending domain, drc.dev,
    the binding restricted to one destination).
  - **Security Baseline**: abuse is limited by the contact API's Turnstile check, hidden trap field
    and same-origin check; the untrusted-data bullet names contact emails.
  - **Version**: MAJOR is recommended because V's Contact API entry and VII's rules are
    redefined; the constitution command makes the final call and records why. Made as 4.0.0:
    main's issue #143 amendment had already taken 2.3.1 → 3.0.0, and this slice's amendment sits
    on top of it (3.0.0 → 4.0.0).
- Cloudflare Email Routing on `drc.dev` (already on), and a verified destination address (Don,
  during setup).
- **DMARC follow-up (issue #136)**: doncoleman.ca's DMARC record is still to be tightened through
  Cloudflare DMARC Management. Contact email is sent from `drc.dev`, not from doncoleman.ca or a
  subdomain of it, so #136 does not govern it. This slice adds no DNS record on doncoleman.ca.

## Out of Scope / Follow-up Work

- Sending a copy or acknowledgement email to the visitor (needs paid sending to arbitrary
  addresses).
- Deleting the retired retrieval key (`CONTACT_READ_TOKEN`) and fingerprint salt (`IP_HASH_SALT`)
  from the production and preview secret stores is Don's action, not code in this slice; it is a
  post-merge pull-request item with a 7-day deadline (FR-017a) and is noted in the walkthrough.
- Retiring or reconfiguring Don's scheduled assistant that used the retrieval endpoint (outside
  this repository; owner: Don). Risk: after release its calls get "not found", so it reports
  failures or nothing until he changes it; no contact data is lost because messages now arrive by
  email.
- HTML-formatted contact emails, attachments, or more than one destination.
- Any change to the questions feature's database use, or to the preview database pruning tracked
  in issue #82.
