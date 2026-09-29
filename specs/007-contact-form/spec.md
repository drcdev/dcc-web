# Feature Specification: Contact Form and Message Retrieval

**Feature Branch**: `007-contact-form`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Let visitors contact Don through a simple form, and let Don retrieve new messages without logging in to anything."

## Clarifications

### Session 2026-09-29

- Q: Should contact messages be stored in Western North America ("wnam"), given that storage cannot be limited to Canada and the region cannot be changed once the stores are created? → A: Yes, Western North America. It stays a decision point for Don until he runs the store-creation command in the setup walkthrough, which must restate the region and that it cannot be changed before that command.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor sends a message (Priority: P1)

A visitor opens the Contact page, fills in their name, email, an optional organization and a
message, ticks the consent box (which links to the privacy policy), and sends it. They see a
clear confirmation that the message was received. The form looks like the current site's
contact form at https://www.doncoleman.ca/contact/.

**Why this priority**: Receiving enquiries is the whole point of the feature. Without it
nothing else has value.

**Independent Test**: Open the Contact page, submit a valid message, see the confirmation, and
confirm a new stored message exists with the submitted details.

**Acceptance Scenarios**:

1. **Given** the Contact page, **When** a visitor enters a name, a valid email and a message,
   ticks the consent box and sends, **Then** they see a confirmation and the message is stored
   as new.
2. **Given** the Contact page, **When** a visitor leaves the organization blank, **Then** the
   message is still accepted.
3. **Given** the Contact page, **When** a visitor tries to send without ticking the consent box,
   **Then** the form does not send and tells them consent is required.
4. **Given** the Contact page, **When** a visitor reads the consent text, **Then** it links to
   the privacy policy at `/privacy-policy/`.
5. **Given** the Contact page, **When** the form is used with a keyboard or a screen reader,
   **Then** every field, the consent box, errors and the confirmation are reachable and
   announced.

---

### User Story 2 - Visitor recovers from an error (Priority: P1)

A visitor whose message cannot be sent (a field is invalid, the service is unavailable, or they
have sent too many messages) sees a clear, plain-language error, and everything they typed is
still in the form so they can correct it or try again.

**Why this priority**: Losing a typed message is the worst outcome for a visitor and would cost
Don the enquiry. It belongs with the core journey.

**Independent Test**: Submit an invalid form, and a valid form while the service is made to
fail; confirm a specific error appears and all typed values remain.

**Acceptance Scenarios**:

1. **Given** a visitor enters an invalid email, **When** they send, **Then** they see an error
   naming the email field and their other entries are kept.
2. **Given** the message service is unavailable, **When** the visitor sends, **Then** they see
   an error saying the message was not sent and suggesting they try again, and their message is
   still in the form.
3. **Given** a visitor has reached the sending limit, **When** they send again, **Then** they
   see an error saying they have sent too many messages and to try later, and their message is
   kept.
4. **Given** a field is longer than its limit, **When** the visitor sends, **Then** they see
   which field is too long and what the limit is.

---

### User Story 3 - Don retrieves new messages through an assistant (Priority: P1)

A scheduled automated assistant, holding a secret access key, asks the site for new messages,
receives them, and marks each one as read once handled. It can do nothing else: it cannot
delete, edit or create messages, or read messages already marked read. Don does not log in to
anything.

**Why this priority**: Stored messages that Don cannot read are useless. This replaces email
notifications, which are out of scope.

**Independent Test**: Store two messages, request new messages with the key and receive both,
mark one as read, request again and receive only the other; repeat without the key and be
refused.

**Acceptance Scenarios**:

1. **Given** stored messages with status new, **When** the assistant requests new messages with
   a valid key, **Then** it receives every new message with its identifier, name, email,
   organization, project, message and time received, oldest first.
2. **Given** a new message, **When** the assistant marks it as read with a valid key, **Then**
   it no longer appears in the list of new messages.
3. **Given** any retrieval request with a missing or wrong key, **When** it is made, **Then** it
   is refused and reveals no message content.
4. **Given** a valid key, **When** the assistant attempts any action other than listing new
   messages or marking a message as read, **Then** it is refused.
5. **Given** no new messages, **When** the assistant requests new messages, **Then** it receives
   an empty list.

---

### User Story 4 - Spam and abuse are kept out without bothering real visitors (Priority: P2)

Automated and abusive submissions are rejected, while a real visitor normally sends a message
without solving a puzzle.

**Why this priority**: Spam would bury real enquiries and could exhaust free-plan limits, but
the form is useful before spam arrives.

**Independent Test**: Submit with the hidden trap field filled, without passing the human
check, and more often than the limits allow; confirm each is rejected and nothing extra is
stored.

**Acceptance Scenarios**:

1. **Given** a submission that fills the hidden field real visitors never see, **When** it is
   sent, **Then** it is not stored, and the sender sees the normal confirmation so a bot learns
   nothing.
2. **Given** a submission that fails the automated human check, **When** it is sent, **Then**
   it is not stored and the visitor sees an error asking them to try again, with their message
   kept.
3. **Given** a sender has sent 3 messages in the past hour, **When** they send a fourth,
   **Then** it is refused.
4. **Given** a sender has sent 5 messages in the past day, **When** they send a sixth,
   **Then** it is refused.
5. **Given** a real visitor on a typical browser, **When** they send one message, **Then** they
   are not asked to solve a visual puzzle in normal conditions.

---

### User Story 5 - Visitor coming from a project story (Priority: P2)

A visitor reading a project story follows a link to the Contact page. The form shows which
project they came from, and that project is stored with their message so Don knows the context.

**Why this priority**: Useful context for Don, but the form works without it.

**Independent Test**: Open the Contact page with a project named in the link, see the project
shown in the form, submit, and confirm the stored message carries that project.

**Acceptance Scenarios**:

1. **Given** a link to the Contact page that names a project, **When** the page opens, **Then**
   the form shows the project name.
2. **Given** a link with no project, **When** the page opens, **Then** no project is shown and
   the message is stored with no project.
3. **Given** a project value that is overly long or contains markup, **When** the page opens,
   **Then** it is shown as plain text, cut to the project limit, and never runs as code.

---

### User Story 6 - Visitor understands what happens to their information (Priority: P2)

A visitor reads the privacy policy and learns which fields the form collects and why, where
messages are stored, how long they are kept, that a spam-protection check runs, and how to ask
for their message to be deleted.

**Why this priority**: Required for informed consent, and the existing policy has placeholders
for exactly this.

**Independent Test**: Read the privacy policy and confirm each placeholder about the contact
form and spam protection is replaced with the facts in this spec.

**Acceptance Scenarios**:

1. **Given** the privacy policy, **When** a visitor reads the contact form section, **Then** it
   lists the fields collected, states where messages are stored and says they are deleted
   automatically after 12 months.
2. **Given** the privacy policy, **When** a visitor reads the spam protection section, **Then**
   it names the service used and what it receives.
3. **Given** the Contact page, **When** a visitor reads near the form, **Then** a short note
   says what happens to their information and links to the privacy policy.

---

### User Story 7 - Old messages are deleted automatically (Priority: P2)

Messages older than the retention period (12 months by default) are deleted without Don doing
anything, whether or not they have been read.

**Why this priority**: A constitutional privacy requirement, but no message reaches 12 months
old for a year after launch.

**Independent Test**: Store one message dated 13 months ago and one dated 11 months ago, run the
scheduled clean-up, and confirm only the older one is gone.

**Acceptance Scenarios**:

1. **Given** messages older and younger than 12 months, **When** the scheduled clean-up runs,
   **Then** only messages older than 12 months are deleted.
2. **Given** the clean-up, **When** time passes, **Then** it runs at least once a day without
   manual action.

---

### User Story 8 - Preview messages stay separate (Priority: P2)

Messages sent from a preview deployment are stored apart from real messages. Retrieving
production messages never returns a preview message, and the reverse.

**Why this priority**: Testing on previews must not pollute Don's real messages or mix test
data with personal data.

**Independent Test**: Send a message from a preview deployment, confirm it can be retrieved
from the preview store with the preview key, and confirm it does not appear in production.

**Acceptance Scenarios**:

1. **Given** a preview deployment, **When** a message is sent from it, **Then** it is stored
   only in the preview store.
2. **Given** a message stored from a preview, **When** production new messages are requested,
   **Then** it is not included.

---

### User Story 9 - Don completes the one-time setup (Priority: P3)

Don follows a numbered, step-by-step walkthrough for the setup steps only he can do (creating
the message stores, granting permissions, creating the spam-protection widget, entering secrets
and settings). Each step says what to do, where, and how to confirm it worked. The existing
setup check reports which of these steps are still outstanding and passes only when all are
done.

**Why this priority**: Needed before launch, but the feature is built and tested locally first.

**Independent Test**: Run the setup check before setup and see each missing item reported;
after following the walkthrough, see it pass.

**Acceptance Scenarios**:

1. **Given** none of the setup is done, **When** Don runs the setup check, **Then** it fails and
   names every missing item.
2. **Given** all setup is done, **When** Don runs the setup check, **Then** it passes.
3. **Given** the setup check, **When** it checks secrets, **Then** it confirms only that they
   exist and never shows their values.
4. **Given** the walkthrough, **When** Don reaches a step that involves a secret, **Then** it
   tells him to enter it directly into the secret store, never into a chat or a file in the
   repository.

### Edge Cases

- JavaScript is turned off: the Contact page and its explanatory text still render, and the
  page says the form needs JavaScript to send, so the visitor is not left with a form that
  silently fails.
- The spam-protection check cannot load (blocked or offline): the visitor sees an error asking
  them to try again later, and their message is kept.
- The visitor double-clicks Send: only one message is stored.
- The request body is larger than 10 KB: it is refused without being stored.
- A required field contains only spaces: it is treated as empty.
- Name, organization, project or message contains markup or script: it is stored and returned
  as plain text and never executed anywhere.
- The email is 254 characters or fewer but not in a basic valid form: it is refused.
- The assistant marks as read a message that does not exist or is already read: the response
  says so and nothing else changes.
- Many new messages exist: the assistant still receives all of them, in a bounded number of
  requests.
- A submission comes from another website: it is refused.

## Requirements *(mandatory)*

### Functional Requirements

**Contact form**

- **FR-001**: The site MUST have a Contact page at `/contact/` with a form whose layout, fields,
  states and styling match the current site's contact form, within the site's existing design
  system.
- **FR-002**: The form MUST collect name (required, up to 100 characters), email (required, up
  to 254 characters, basic format check), organization (optional, up to 100 characters) and
  message (required, up to 5,000 characters).
- **FR-003**: The form MUST require a consent checkbox stating that the visitor's information
  will be collected and used to reply, with a link to `/privacy-policy/`.
- **FR-004**: When the Contact page is opened with a project named in its link, the form MUST
  show the project and submit it with the message; the project MUST be treated as plain text
  and limited to 100 characters.
- **FR-005**: On success the visitor MUST see a clear confirmation. On failure they MUST see a
  plain-language error that says what went wrong, and every value they typed MUST remain in the
  form.
- **FR-006**: The system MUST validate every field on the server using the same limits as the
  form, and MUST refuse request bodies larger than 10 KB.
- **FR-007**: The Contact page MUST show a short note on what happens to the visitor's
  information, linking to the privacy policy.
- **FR-008**: The form MUST meet WCAG 2.2 AA, including labelled fields, errors tied to their
  fields, and announced confirmation and error messages.
- **FR-009**: The Contact page MUST stay within the site's performance budget; the only scripts
  it loads are the form's own submit behaviour and the spam-protection check.
- **FR-010**: The Contact page MUST be reachable from the site's navigation at its already
  planned position.

**Spam and abuse**

- **FR-011**: The form MUST include a hidden field that real visitors never see or fill. A
  submission with it filled MUST NOT be stored, and MUST receive the same response as a
  successful one.
- **FR-012**: Every submission MUST pass an automated human check that normally needs no
  interaction from real visitors; failures MUST NOT be stored.
- **FR-013**: The system MUST refuse submissions from the same sender beyond 3 in any hour or 5
  in any day.
- **FR-014**: The system MUST accept submissions only from the site's own pages.

**Storage and privacy**

- **FR-015**: Each accepted message MUST be stored with name, email, organization, project,
  message, a one-way salted fingerprint of the sender's network address (never the address
  itself), status (new or read) and time received.
- **FR-016**: The system MUST NOT write message contents or personal details to any log.
- **FR-017**: Messages sent from preview deployments MUST be stored separately from production
  messages, and each environment's retrieval MUST return only its own messages.
- **FR-018**: Messages older than the retention period (default 12 months) MUST be deleted
  automatically, at least once a day, whatever their status.
- **FR-019**: The privacy policy MUST state the fields collected and why, where messages are
  stored (provider and region), the 12-month retention period, the spam-protection service and
  what it receives, and how to ask for a message to be deleted. Its contact-form and
  spam-protection placeholders MUST be replaced.

**Retrieval**

- **FR-020**: An automated assistant holding a secret access key MUST be able to list all
  messages with status new, oldest first, with every stored field except the sender
  fingerprint.
- **FR-021**: The assistant MUST be able to mark a single message as read by its identifier.
- **FR-022**: Retrieval MUST offer no other actions: no deletion, editing, creation, or reading
  of messages already marked read.
- **FR-023**: Any retrieval request without the correct key MUST be refused without revealing
  whether messages exist.
- **FR-024**: Production and preview MUST use different access keys.

**Operations and setup**

- **FR-025**: The feature MUST add no running cost; expected usage MUST stay within the free
  plan limits of the services already in use.
- **FR-026**: The feature MUST send no email or other notifications.
- **FR-027**: A numbered walkthrough in the setup documentation MUST cover every step only Don
  can do, each stating what to do, where, and how to confirm it worked. Don enters secrets
  directly into the secret stores.
- **FR-027a**: Immediately before the walkthrough step that creates the message stores, the
  walkthrough MUST restate the storage region (Western North America) and that it cannot be
  changed after the stores are created, so Don confirms it at that point.
- **FR-028**: The existing setup check MUST be extended so it fails until every step in the
  walkthrough is complete: both message stores exist in the chosen region, their structure is
  up to date, the required secrets exist (checked by name only), the build setting for the
  human check exists, and the scheduled clean-up is registered.

### Key Entities

- **Message**: One accepted contact submission. Attributes: identifier, name, email,
  organization (optional), project (optional), message text, sender fingerprint (salted one-way
  hash of the network address, used only for rate limiting), status (new or read), time
  received. Belongs to exactly one environment (production or preview).
- **Retrieval key**: A secret shared with Don's scheduled assistant, one per environment, that
  grants only list-new and mark-read.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can complete and send the form in under 2 minutes, and sees a
  confirmation or error within 5 seconds of pressing Send on a typical connection.
- **SC-002**: In 100% of failed sends tested, every value the visitor typed is still in the
  form.
- **SC-003**: 100% of submissions with the hidden field filled, failing the human check, or
  over the hourly or daily limit are not stored.
- **SC-004**: A message sent from production appears in the assistant's next list of new
  messages, and does not appear again after being marked read.
- **SC-005**: 0 retrieval requests without the correct key return any message data.
- **SC-006**: 0 preview messages appear in production retrieval, and the reverse.
- **SC-007**: After the scheduled clean-up, 0 messages older than 12 months remain, and 100% of
  younger messages remain.
- **SC-008**: Monthly running cost added by this feature is $0.
- **SC-009**: The Contact page passes automated accessibility checks with no WCAG 2.2 AA
  violations and stays within the site's performance budget.
- **SC-010**: Don can complete the setup walkthrough without help, and the setup check passes
  at the end.
- **SC-011**: A test message sent from a preview deployment lands in the preview store and can
  be retrieved with the preview key.

## Out of Scope

- Email or other notifications about new messages (alerts come from Don's scheduled assistant).
- Newsletter sign-up.
- Booking or scheduling links.
- Migrating messages from the old site.
- Any interface for Don to browse, search, reply to or delete messages.
- Self-service deletion of a message through the site (requests are handled by Don manually,
  as the privacy policy describes).

## Assumptions

- The storage region is Western North America (confirmed 2026-09-29). Storage cannot be
  limited to Canada and the region cannot be changed after the stores are created, so it
  remains Don's decision until he runs the store-creation step of the walkthrough.
- The retention period is 12 months and is the same for read and unread messages.
- Returning new messages oldest first suits a scheduled assistant that checks periodically; the
  list may be split into pages if it is large.
- The visitor sees the same confirmation whether their message was stored or silently dropped
  by the hidden-field trap.
- The project comes from the Contact page link; project stories add that link when they exist
  (the portfolio is a separate feature).
- Visitors ask for their message to be deleted by contacting Don, and Don deletes it manually.
  The privacy policy says how.
- Sending needs JavaScript, because the spam-protection check requires it; the page still
  renders and explains this when JavaScript is off.
- Rate limits are counted per sender fingerprint, so visitors behind a shared network address
  share a limit.
- This feature runs in parallel with the blog design and portfolio design features; shared
  files (site configuration, setup documentation, setup check, privacy policy, navigation) are
  merged, not overwritten.
- This is a major change under Constitution Principle III: it changes how contact data is
  collected, stored and retrieved, and adds infrastructure.
