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
5. **Given** a real visitor, **When** they send a message, **Then** they are never shown a
   visual puzzle or any other cognitive test. Most visitors see no challenge at all; when the
   human check needs interaction, it asks for at most one checkbox tick that works with a
   keyboard and a screen reader (FR-008l).

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
  them to try again later, announced in the form's status area, and their message is kept.
  Send stays usable, so they can retry once the check loads.
- The human-check service cannot be reached, or the message store cannot be read or written
  (for the rate-limit count or the insert): the system **fails closed**. Nothing is stored,
  the visitor sees the "not sent, please try again in a few minutes" error, and everything they
  typed stays in the form (FR-012a).
- The visitor double-clicks Send: only one message is stored.
- The request body is larger than 10 KB: it is refused without being stored.
- A required field contains only spaces: it is treated as empty.
- Name, organization, project or message contains markup or script: it is stored and returned
  as plain text and never executed anywhere.
- The email is 254 characters or fewer but not in a basic valid form: it is refused.
- The assistant marks as read a message that does not exist or is already read: the response
  says so, returns no message content, and nothing else changes.
- Many new messages exist: the assistant still receives all of them, in pages of up to 100
  (50 by default), so N new messages take at most ⌈N ÷ page size⌉ list requests.
- A submission comes from another website, or carries no origin information: it is refused.
- Stored text is shown or processed anywhere (the retrieval response, Don's assistant, or any
  tool that displays a message): every consumer treats it as plain text. The retrieval
  response is JSON, never HTML, and is marked so browsers do not guess another type.
- A free-plan limit is reached (for example under abuse): nothing is billed. Pages still load,
  because they are static; sending fails closed with the "service unavailable" error and the
  visitor's message kept; retrieval returns an error that Don's assistant reports to him. The
  limit resets the next day.
- A real visitor finds and uses a preview deployment: their message is stored only in the
  preview store, protected, retrievable only with the preview key and deleted on the same
  schedule as production messages (FR-017a).

## Requirements *(mandatory)*

### Functional Requirements

**Contact form**

- **FR-001**: The site MUST have a Contact page at `/contact/` with a form whose layout, fields,
  states and styling match the current site's contact form, within the site's existing design
  system. Where matching the current form would break WCAG 2.2 AA, WCAG 2.2 AA wins and the
  closest conforming style is used.
- **FR-002**: The form MUST collect name (required, up to 100 characters), email (required, up
  to 254 characters, basic format check), organization (optional, up to 100 characters) and
  message (required, up to 5,000 characters).
- **FR-002a**: Each stored item is needed for replying or for abuse control, and nothing else
  is collected (Principle VII): name, to address the reply; email, to send the reply;
  organization (optional) and project (optional), to give the enquiry context; message, the
  enquiry itself; sender fingerprint, only to enforce the sending limits (FR-015); status and
  time received, to list new messages and apply retention.
- **FR-003**: The form MUST require a consent checkbox stating that the visitor's information
  will be collected and used to reply, with a link to `/privacy-policy/`. The consent text MUST
  say who collects the information (Don Coleman), what is kept (what the visitor enters in the
  form), the purpose (to reply to them) and where to read more (the privacy policy). Default
  wording: "I agree that Don Coleman may keep what I enter in this form and use it to reply to
  me, as described in the privacy policy (opens in a new tab)."
- **FR-003a**: Consent MUST be enforced on the server as well as in the form: a submission
  without consent is refused and not stored. Consent itself is not recorded with the message,
  because a message can only be stored after consent was given; the policy in force is
  identified by its "Last updated" date.
- **FR-004**: When the Contact page is opened with a project named in its link, the form MUST
  show the project and submit it with the message; the project MUST be treated as plain text
  and limited to 100 characters.
- **FR-005**: On success the visitor MUST see a clear confirmation. On failure they MUST see a
  plain-language error that says what went wrong, and every value they typed MUST remain in the
  form.
- **FR-006**: The system MUST validate every field on the server using the same limits as the
  form, including the consent box (FR-003a), and MUST refuse request bodies larger than 10 KB.
- **FR-007**: The Contact page MUST show a short note on what happens to the visitor's
  information, linking to the privacy policy. The link text names its destination ("privacy
  policy"), and links are distinguishable from surrounding text by more than colour
  (underlined).
- **FR-008**: The form MUST meet WCAG 2.2 AA, including labelled fields, errors tied to their
  fields, and announced confirmation and error messages, as made precise in FR-008a to
  FR-008p.
- **FR-008a** (labels): Every control MUST have a visible label that is also its accessible
  name: "Name", "Email", "Organization (optional)", "Message", the consent sentence (FR-008k)
  and "Send". The project is not a control: it is plain text ("About: <project>") inside the
  form, read in order and never focusable.
- **FR-008b** (required and optional): A line before the fields MUST say "All fields are
  required unless marked optional." Required fields MUST be marked required programmatically;
  the one optional field says "(optional)" in its visible label. The indication MUST NOT rely
  on colour or a symbol alone.
- **FR-008c** (input purpose): Name, email and organization MUST declare their input purpose
  (autocomplete `name`, `email`, `organization`), per WCAG 1.3.5.
- **FR-008d** (hidden trap field): The hidden field (FR-011) MUST be hidden from everyone: not
  displayed, not in the tab order, hidden from assistive technology and excluded from autofill.
- **FR-008e** (field errors): Each field error MUST be visible text next to its field that
  names the field and the problem (and the limit, for a length error), MUST be programmatically
  associated with the field (described-by), and MUST mark the field invalid. Errors are never
  shown by colour alone (WCAG 1.4.1). A corrected field's error clears on the next send. The
  consent error ("Tick the box to agree before sending.") follows the same rules on the
  checkbox. All wording is plain language (constitution, Development Workflow).
- **FR-008f** (several errors): When several fields are invalid, every one MUST show its error
  at once, the status area says how many fields need attention, and focus moves to the first
  invalid field in form order.
- **FR-008g** (form-level errors): Errors that belong to no single field (service unavailable,
  too many messages, human check failed or could not load, sent from another site) MUST appear
  as text in one status area directly above Send. Focus stays on Send, so the visitor can
  retry at once.
- **FR-008h** (announcements): The status area MUST be a polite live region. Each message is
  announced once per send attempt; an identical error on a later attempt is announced again
  (the area is cleared before it is set). Messages stay until the next attempt; nothing
  dismisses itself.
- **FR-008i** (sending state): While a message is being sent, Send MUST be disabled and read
  "Sending…", and the status area announces "Sending your message…". Activating Send again
  during this time does nothing, so a double-click stores one message.
- **FR-008j** (success): On success the form MUST be replaced by a confirmation panel with a
  heading; focus moves to that heading so it is announced. The panel stays until the page is
  reloaded.
- **FR-008k** (consent control): The checkbox's label MUST be the whole consent sentence,
  including the link, so its accessible name reads as one sentence. The privacy links (in the
  consent sentence and the note) open in a new tab and say "(opens in a new tab)" in their
  visible text, so following them never loses what the visitor typed. The checkbox target is
  at least 24 by 24 CSS pixels (WCAG 2.5.8), and clicking the label text also toggles it.
- **FR-008l** (human check): The human-check area MUST sit after the consent box and before
  Send, in reading and tab order. Normally it shows nothing. When the service needs
  interaction, it shows a single checkbox challenge that is operable by keyboard and screen
  reader and is never a puzzle or other cognitive test (WCAG 3.3.8). If it cannot load, the
  failure is announced in the status area (FR-008g) and the visitor keeps their values.
- **FR-008m** (without JavaScript): The notice that sending needs JavaScript MUST sit directly
  above the fields, as ordinary visible text that assistive technology reads before the
  fields. The fields stay enabled, so the visitor can type or copy text; Send is disabled and
  exposed as disabled.
- **FR-008n** (visual): Text MUST meet 4.5:1 contrast (3:1 for large text), and field borders,
  the checkbox, focus indicators and error icons 3:1 against adjacent colours, in the light and
  dark themes and in every state (default, focus, error, disabled). Failing pairs from the
  current form are replaced as in the design source's accessibility adjustments. Every control
  has a visible focus indicator, and nothing (including the human-check challenge) covers a
  focused control (WCAG 2.4.11; the site has no sticky header). At 320 CSS pixels wide and at
  400% zoom the form reflows to one column with no horizontal scrolling, and WCAG 1.4.12
  text-spacing overrides lose no content. Any motion respects the reduced-motion setting, and
  there is no time limit on filling in the form: an expired human-check pass is renewed
  without the visitor acting.
- **FR-008o** (tab order): Keyboard focus MUST follow this order: Name, Email, Organization,
  Message, the consent checkbox, the privacy link in the consent sentence, the human-check
  challenge when shown, Send. The hidden trap field and the project line never receive focus.
- **FR-008p** (page): `/contact/` MUST have the title "Contact", inherit the site's page
  language, have exactly one level-1 heading, and give the form an accessible name from a
  visible heading so it is exposed as a form landmark.
- **FR-009**: The Contact page MUST stay within the site's performance budget; the only scripts
  it loads are the form's own submit behaviour and the spam-protection check. The budget is the
  one the release gate already enforces for every page (`tests/e2e/budget.spec.ts`): on mobile,
  LCP ≤ 2.5 s, CLS ≤ 0.1, at most 10 KB of JavaScript and 100 KB in total before the visitor
  interacts. The spam-protection check loads only after the first interaction with the form.
- **FR-010**: The Contact page MUST be reachable from the site's navigation at its already
  planned position.

**Spam and abuse**

- **FR-011**: The form MUST include a hidden field that real visitors never see or fill. A
  submission with it filled MUST NOT be stored, and MUST receive the same response as a
  successful one.
- **FR-012**: Every submission MUST pass an automated human check that normally needs no
  interaction from real visitors; failures MUST NOT be stored.
- **FR-012a** (fail closed): If the human-check service cannot be reached or returns an error,
  or the message store cannot be read for the rate-limit count or cannot be written, the system
  MUST refuse the submission and store nothing. The visitor sees "Your message wasn't sent
  because the service is unavailable. Please try again in a few minutes.", and every value
  stays in the form (FR-005). The system never accepts a message that skipped the human check
  or the rate limit: the visitor keeps their text and can retry, whereas Don has no
  notification channel that would catch a message lost or let through silently.
- **FR-012b** (data sent to the human-check service): The spam-protection service (Cloudflare
  Turnstile) receives only the visitor's IP address and the browser and device signals its own
  script collects, plus the one-time token. No form field is sent to it. The spec, the plan and
  the privacy policy MUST describe this same list.
- **FR-013**: The system MUST refuse submissions from the same sender beyond 3 in any hour or 5
  in any day.
- **FR-013a**: Both windows are rolling: "any hour" is the 60 minutes, and "any day" the 24
  hours, before the new submission. Only accepted, stored messages count. Refused submissions
  (hidden field filled, failed human check, invalid, refused origin, over the limit) are not
  stored and do not count; the human check limits those instead. A submission caught by the
  hidden field gets the normal success response (FR-011) and neither counts nor is limited;
  FR-005's error rules apply only to submissions a real visitor can make.
- **FR-013b**: The sender is identified by the network address the hosting platform reports
  for the connection (Cloudflare's connecting-IP value), never by an address supplied by the
  client, such as a forwarding header. If the platform reports none, the submission counts
  against one shared "unknown" sender, so a missing address can never bypass the limits.
- **FR-014**: The system MUST accept submissions only from the site's own pages: the request's
  origin MUST equal the origin of the address it is sent to (the production address, the
  review address or that preview deployment's own address), and the browser's cross-site
  signal, when present, must say same-origin. A request with no origin header is refused.
  Only HTTPS is accepted, except on the local test addresses `127.0.0.1` and `localhost`.

**Storage and privacy**

- **FR-015**: Each accepted message MUST be stored with name, email, organization, project,
  message, a one-way salted fingerprint of the sender's network address (never the address
  itself), status (new or read) and time received. The fingerprint is a keyed one-way hash
  (HMAC-SHA-256) of the address, whose key (the salt) is held only in that environment's secret
  store and differs between production and preview. Its only use is enforcing FR-013: it is
  never returned, shown or used for anything else. Because the limits look back 24 hours, the
  daily clean-up removes the fingerprint from every message older than 24 hours, so it is kept
  for at most about 48 hours, not for the message's 12-month life.
- **FR-015a**: The salt is not rotated on a schedule. Don replaces it only if it may have
  leaked, using the secret store. Existing fingerprints then stop matching, so the sending
  limits start again from zero for up to 24 hours; that is accepted, and no stored message is
  otherwise affected.
- **FR-016**: The system MUST NOT write message contents or personal details to any log.
  What the Worker may log is limited to: the event name, the outcome code, the type name of an
  error (never its message), and the number of messages deleted by the clean-up. The
  platform's automatic per-request logs are turned off, so the IP address, headers and query
  strings are not logged on the Worker's behalf. No error-reporting service is used, and the
  form keeps nothing in cookies or browser storage.
- **FR-017**: Messages sent from preview deployments MUST be stored separately from production
  messages, and each environment's retrieval MUST return only its own messages.
- **FR-017a**: Separation covers the message store, the retrieval key and the fingerprint salt:
  each has its own value per environment. The human-check widget, and therefore its secret, is
  shared, because one widget lists both the production and the preview hostnames (unless the
  preview uses the service's test keys, as the plan's fallback allows). A message a real
  visitor sends to a preview is personal data: it gets the same protections, the same
  retention clean-up and the same deletion route as a production message.
- **FR-018**: Messages older than the retention period (default 12 months) MUST be deleted
  automatically, at least once a day, whatever their status, in both the production and the
  preview store. "12 months" means 12 calendar months in UTC: a message is deleted by the first
  daily clean-up that runs after the same date and time 12 months after it was received (a
  29 February date maps as the plan pins). In normal operation a message outlives 12 months by
  at most a day. If a run fails or is missed, the next run deletes everything overdue; a
  message may then outlive its period by one more day per missed run, and a lapse longer than
  7 days is treated as a fault to fix.
- **FR-018a**: The retention period is one value in the shared rules that both the clean-up and
  the privacy policy check rely on. Only a reviewed change can alter it; such a change is a
  major change (it touches how contact data is deleted) and MUST update the privacy policy in
  the same pull request.
- **FR-019**: The privacy policy MUST state the fields collected and why, where messages are
  stored (provider and region), the 12-month retention period, the spam-protection service and
  what it receives, and how to ask for a message to be deleted. Its contact-form and
  spam-protection placeholders MUST be replaced. In particular it MUST state:
  - the sender fingerprint: that the IP address is used only to limit repeat sending, is kept
    only as a one-way salted fingerprint, and that the fingerprint is removed after about two
    days;
  - the region as Western North America, not Canada (Cloudflare D1 cannot keep data only in
    Canada), consistent with the Clarifications;
  - what the spam-protection service receives, exactly as FR-012b lists it;
  - how to ask for deletion (a new contact-form message or Don's listed email), that Don
    answers within 30 days, and that deletion removes the message from the store, although
    Cloudflare's database recovery history keeps it for up to 7 more days (the Free plan's
    recovery period) before it is gone.
- **FR-019a**: This requirement is the single source for every fact in the policy's contact and
  spam-protection sections; the plan's policy text follows it. A test MUST check that the
  policy states the retention period taken from the shared rules and the storage region, so
  the policy and the system cannot drift apart. The policy change ships in the same pull
  request as the form, so it is live whenever the form is.

**Retrieval**

- **FR-020**: An automated assistant holding a secret access key MUST be able to list all
  messages with status new, oldest first, with every stored field except the sender
  fingerprint (and the status). The list comes in pages of up to 100 messages (50 by default)
  with a cursor for the next page, so all N new messages arrive in at most ⌈N ÷ page size⌉
  requests.
- **FR-021**: The assistant MUST be able to mark a single message as read by its identifier.
  Marking changes only the status, from new to read; it cannot change any other field and
  reads no request body. Marking a message that is already read reports "already read" and
  changes nothing; an unknown identifier reports "not found". Neither response includes any
  message content.
- **FR-022**: Retrieval MUST offer no other actions: no deletion, editing, creation, or reading
  of messages already marked read. With a valid key, every other path under the retrieval
  address (including reading one message by its identifier) answers "not found", and any other
  method on the two operations answers "method not allowed". Any other `/api/` path answers
  "not found".
- **FR-023**: Any retrieval request without the correct key MUST be refused without revealing
  whether messages exist. The correct key is an exact match for that environment's key, sent as
  a bearer credential in the authorization header. A missing header, another scheme, an empty
  or malformed value, a wrong key and the other environment's key are all refused with one
  identical response (same status, body and headers) whatever the reason, path or method, and
  with no detail. If the environment has no key set, every request is refused.
- **FR-023a** (guessing the key): Each key MUST be at least 32 random bytes (256 bits),
  generated outside the chat, and is compared in constant time. A refusal is "unauthorized"
  with no detail (FR-023), and Cloudflare's edge protections apply to every request. No extra
  rate limiting is added to the retrieval endpoints: with 2^256 possible keys, guessing is
  infeasible even at the Worker's whole daily request allowance, and a counter would only add
  storage reads to every refusal.
- **FR-023b** (browser access): The retrieval endpoints MUST allow no cross-origin access (no
  CORS headers), and the key is accepted only in the authorization header, never from a cookie
  or the query string. A page on another site can therefore neither read a response nor make a
  visitor's browser send the key.
- **FR-024**: Production and preview MUST use different access keys.
- **FR-024a** (a leaked key): A stolen key exposes only that environment's unread messages. It
  cannot delete, change or create messages, or read messages already marked read, and
  retention bounds how old any exposed message can be. To limit exposure, the assistant marks
  messages read once handled. Don revokes a key by replacing it in the secret store; the old
  key is refused from the next request, with no code change or redeploy. The setup
  walkthrough documents this replacement for each secret.

**Operations and setup**

- **FR-025**: The feature MUST add no running cost; expected usage MUST stay within the free
  plan limits of the services already in use.
- **FR-025a**: Every query the system runs against the message store MUST use an index, so no
  query reads the whole table. A test MUST check each query's plan and fail on a full-table
  scan (Principle VIII), which keeps usage within the figures the plan estimates.
- **FR-026**: The feature MUST send no email or other notifications.
- **FR-027**: A numbered walkthrough in the setup documentation MUST cover every step only Don
  can do, each stating what to do, where, and how to confirm it worked. Don enters secrets
  directly into the secret stores. The steps only Don can do are exactly these, in this order:
  1. create the production and preview message stores in the chosen region;
  2. create the spam-protection widget for the production, review and preview hostnames;
  3. set the three secrets (spam-protection secret, retrieval key, fingerprint salt) for
     production and for preview;
  4. connect the preview Worker's builds to the repository and turn off preview builds on the
     production Worker;
  5. add the spam-protection site key as a build setting for both environments;
  6. give the deploy token permission to update the message stores, so preview builds apply the
     store structure and register the clean-up;
  7. after the merge, switch the production deploy command so production applies the structure
     and registers the clean-up.
  Steps 1–6 happen before the pull request merges and step 7 after it. Adding the new read
  permissions to Don's local read-only token is part of the existing credentials step, not a
  new one.
- **FR-027a**: Immediately before the walkthrough step that creates the message stores, the
  walkthrough MUST restate the storage region (Western North America) and that it cannot be
  changed after the stores are created, so Don confirms it at that point.
- **FR-027b**: If Don does not confirm the region at that point, the walkthrough MUST stop
  before any store is created. A different region is first recorded in this spec, the plan and
  the privacy policy text through a reviewed change; the walkthrough then resumes with the new
  region.
- **FR-027c**: Every step MUST be safe to repeat, and the setup check MUST say which part of a
  partly done step is missing (for example which store, or which secret on which Worker). A
  store created with the wrong name or region is deleted (it is still empty) and created again
  before any message is sent to it.
- **FR-028**: The existing setup check MUST be extended so it fails until every step in the
  walkthrough is complete: both message stores exist in the chosen region, their structure is
  up to date, the required secrets exist (checked by name only), the build setting for the
  human check exists, and the scheduled clean-up is registered. There is one check per
  walkthrough step of FR-027, each covering both environments:
  1. both stores exist by name, their identifiers match the committed configuration, and each
     reports the chosen region (no positive evidence of the region counts as missing);
  2. the spam-protection widget exists and lists the production hostname and the preview
     hostname (or the preview test-key fallback is in use);
  3. the three secret names exist on both the production and the preview Worker;
  4. the preview Worker builds every branch with the preview deploy command, and the production
     Worker builds no preview branches;
  5. the site-key build setting exists on every build trigger of both Workers;
  6. the preview store's structure is up to date and the preview clean-up is registered;
  7. (after merge) production's deploy command is switched, its store's structure is up to
     date and its clean-up is registered.
  "Structure is up to date" means the names of the structure changes recorded as applied in
  each store equal the migration files in the repository.
- **FR-028a**: Each item reports one of complete, missing, pending (a build is running) or
  could-not-check. Could-not-check (Cloudflare unreachable, token expired or missing a
  permission) names the cause and the permission needed; it is never read as complete, and
  the check as a whole fails while any before-merge item is not complete. Missing items name
  what is missing, per store or per Worker. The after-merge item is reported separately and
  does not fail the check before the merge.
- **FR-028b**: The setup check MUST never show a secret value, in normal output, error
  messages, debug output or CI logs; readers drop value fields before returning anything, and
  tests with fixtures containing values prove it. It uses Don's local read-only token, which
  holds only the read permissions it needs (listed in the credentials step). A name-only check
  cannot tell a wrong or empty secret from a correct one; that is accepted, and the end-to-end
  preview test (SC-011) is what proves the preview secrets work.
- **FR-029**: Secrets (the spam-protection secret key, the retrieval keys and the fingerprint
  salts) MUST never appear in the repository, client code, build output, CI logs, any log
  output or the chat. They live only in Cloudflare's secret stores and in gitignored local
  files. The spam-protection site key is public by design and is set as a build setting. Local
  tests use only public test values.

### Key Entities

- **Message**: One accepted contact submission. Attributes: identifier, name, email,
  organization (optional), project (optional), message text, sender fingerprint (salted one-way
  hash of the network address, used only for rate limiting), status (new or read), time
  received. Belongs to exactly one environment (production or preview).
- **Retrieval key**: A secret shared with Don's scheduled assistant, one per environment, that
  grants only list-new and mark-read.
- **Secrets and settings** (per environment; values never recorded here): spam-protection
  secret key (secret), retrieval key (secret, different per environment), fingerprint salt
  (secret, different per environment), spam-protection site key (public build setting). The
  plan's data model names each one.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can complete and send the form in under 2 minutes, and sees a
  confirmation or error within 5 seconds of pressing Send on a typical connection. A typical
  connection is the mobile 4G profile the performance gate uses (about 150 ms round trip and
  1.6 Mbps down).
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
  violations and stays within the site's performance budget. Automated: axe-core with the WCAG
  2.0, 2.1 and 2.2 A and AA rule sets, in CI, in both themes, on the page as loaded and with
  errors and the success panel shown. Manual review before approval covers what axe cannot:
  the keyboard-only journey and tab order (FR-008o), screen-reader announcements of errors,
  sending and success (VoiceOver), focus visibility, reflow at 320 px and 400% zoom, text
  spacing, and the human-check challenge.
- **SC-010**: Don can complete the setup walkthrough without help, and the setup check passes
  at the end. "Without help" means every step is completed using only the walkthrough's own
  instructions, with no step needing the agent to handle a credential or Don to look up a
  command elsewhere; any question Don has to ask is recorded as a walkthrough fix.
- **SC-011**: A test message sent from a preview deployment lands in the preview store and can
  be retrieved with the preview key.

## Review on the preview deployment

This is a major change, so Don approves it only after checking the preview deployment:

- the Contact page matches the current site's form and passes a keyboard-only send;
- a test message sent from the preview lands in the preview store and is retrieved with the
  preview key, and the production key is refused there (SC-011, FR-024);
- marking it read removes it from the next list;
- the privacy policy's contact and spam-protection sections read correctly;
- `setup:check` shows every before-merge item complete.

## Rollback

If a deploy or a structure change fails after the merge, the previously deployed version keeps
serving, because structure changes are applied before code, stop the deploy when they fail, and
are additive only. Reverting the merge commit through a reviewed pull request returns the site
to the previous code; the plan describes the steps.

## Out of Scope

- Email or other notifications about new messages (alerts come from Don's scheduled assistant).
- Newsletter sign-up.
- Booking or scheduling links.
- Migrating messages from the old site.
- Any interface for Don to browse, search, reply to or delete messages.
- Self-service deletion of a message through the site (requests are handled by Don manually,
  as the privacy policy describes).
- A legal review of the privacy policy. It is written in plain language to be open about what
  is collected, in the spirit of the fair-information principles of Canada's PIPEDA, but
  confirming compliance with any law is not part of this feature.
- Monitoring of free-plan quotas or costs. Expected usage is under 1% of every limit and the
  Free plan refuses rather than bills (plan, research R10), so no alerting is built.
- Health monitoring of the form, the clean-up or the assistant. With no notifications
  (FR-026), Don learns of a problem through his scheduled assistant, which reports failed
  retrieval requests; the clean-up's log line and `setup:check` show whether the schedule is
  registered and running; and the release gate's end-to-end test exercises the form on every
  change. A silent form failure between changes is an accepted risk.

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
  share a limit. That is accepted: a consulting site expects a few messages a week, five a day
  from one address is well above that, and a visitor who hits the limit can wait or use Don's
  listed email.
- This feature runs in parallel with the blog design and portfolio design features; shared
  files (site configuration, setup documentation, setup check, privacy policy, navigation) are
  merged, not overwritten.
- This is a major change under Constitution Principle III: it changes how contact data is
  collected, stored and retrieved, and adds infrastructure.
