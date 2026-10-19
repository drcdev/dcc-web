# Feature Specification: Two-column editorial layout for the contact page

**Feature Branch**: `042-contact-editorial-layout`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Two-column editorial layout for contact page" (GitHub issue #188). The contact page today is a short text blurb followed by a form that runs the full width of the content area, which reads as austere on a wide screen. On wide screens the page becomes two columns: on the left, a note from Don about the conversations he welcomes, when to expect a reply, where he is and which time zone he works in, and quick links to GitHub, LinkedIn and his email address; on the right, the form (Name, Email, Organization (optional), Message, the project line when the page is opened with `?project=`, the spam check and the consent box). Below 1024 px wide the two columns stack, with the note above the form. The `?project=` handling and the spam check keep working exactly as now, as do sending, validation error announcements and the success message.

## Clarifications

### Session 2026-10-19

- Q: Which conversations should the contact note say Don welcomes (the issue lists consulting inquiries; the home "open to" line names only speaking and mentoring)? → A: Match the home line: speaking and mentoring conversations, with systems leadership and AI experiments as topics; no consulting inquiries.
- Q: How should the note state when a visitor can expect a reply? → A: "Within a few days", as in the issue.
- Q: How should the note show where Don is and his time zone? → A: As in the issue: "Vancouver Island, BC — Pacific Time".
- Q: Should the note show Don's email address as a quick link? → A: Yes, a plain mailto link that shows the address contact@doncoleman.ca as its text.
- Q: Where should the existing privacy paragraph sit on a wide screen? → A: At the top of the form column, directly above the form fields (not in the note column).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read who Don wants to hear from, then write to him, on a wide screen (Priority: P1)

A visitor on a laptop or desktop opens the contact page. On the left they read a short note from Don: the kinds of conversation he welcomes, that he reads every message and replies by email within a few days, that he is on Vancouver Island in the Pacific time zone, and links to his GitHub, LinkedIn and email address. On the right, next to that note, is the form. The form fields are a comfortable reading width rather than stretched across the page.

**Why this priority**: This is the change the issue asks for. The page should feel like an invitation to start a conversation, and the visitor should know what to expect before they write.

**Independent Test**: Open the contact page at a width of 1280 px: the note and its links sit in a column on the left, the "Send a message" form sits in a wider column on the right, and both start at the same height.

**Acceptance Scenarios**:

1. **Given** a viewport 1024 px wide or wider, **When** a visitor opens the contact page, **Then** the note column is on the left, the form column is on the right, the form column is the wider of the two (roughly 7 parts to 5), and the two columns are top-aligned.
2. **Given** the note column, **When** the visitor reads it, **Then** it names the conversations Don welcomes (speaking and mentoring, on systems leadership and AI experiments), says he reads every message and replies by email within a few days, says "Vancouver Island, BC" and "Pacific Time", and offers links to GitHub, LinkedIn and his email address.
3. **Given** the form column, **When** the visitor reads it, **Then** the existing privacy notice (what typed details are used for, how long they are kept, and a link to the privacy policy that opens in a new tab) sits at the top of the form column, directly above the form fields, and comes before them in reading order.
4. **Given** a visitor using a screen reader or the keyboard, **When** they move through the page, **Then** they reach the note and its links first and the form second, matching the visual order.
5. **Given** JavaScript is turned off, **When** the visitor opens the page, **Then** the note and its links are fully readable and the form shows the existing notice that sending needs JavaScript.

---

### User Story 2 - Write to Don on a phone (Priority: P1)

A visitor on a phone opens the contact page. The note comes first in a single column, then the form directly below it, with no side-by-side squeeze and no sideways scrolling.

**Why this priority**: Most visits come from phones, and the layout change must not make the page worse there.

**Independent Test**: Open the contact page at 375 px and at 1023 px wide: everything is in one column, the note is above the form, and the page does not scroll sideways.

**Acceptance Scenarios**:

1. **Given** a viewport narrower than 1024 px, **When** a visitor opens the contact page, **Then** the note and its links appear above the form in one column.
2. **Given** a 375 px viewport, **When** the visitor scrolls the page, **Then** nothing overflows sideways and every field, link and button is usable.

---

### User Story 3 - Everything the form already does keeps working (Priority: P1)

A visitor who arrives from a project story's call to action (the page opens with `?project=<slug>`) still sees the "About: <project>" line in the form and the project still travels with their message. The spam check still loads only after their first interaction with the form. Missing or invalid fields are still marked and announced, the status line still reports progress and failures, and a successful send still replaces the form with the "Message sent" panel and moves focus to its heading.

**Why this priority**: The issue's acceptance criteria require the form's behaviour to stay fully intact. A layout change that breaks sending would be worse than no change.

**Independent Test**: Run the existing contact page journeys (valid send, `?project=` line, validation errors, spam-check failure, back-forward cache) against the new layout at both a wide and a phone width; all pass unchanged.

**Acceptance Scenarios**:

1. **Given** the page is opened with `?project=cadence`, **When** it loads, **Then** the form column shows "About: cadence" and a sent message carries that project, as today.
2. **Given** the page has just loaded, **When** the visitor has not yet interacted with the form, **Then** no request goes to the spam-check service; after the first focus or input in the form it loads as today.
3. **Given** the visitor presses Send with required fields empty, **When** validation runs, **Then** each invalid field is marked and described, the status line announces how many fields need attention, and focus moves to the first invalid field, as today.
4. **Given** a valid message, **When** it is sent successfully, **Then** the form is replaced by the "Message sent" panel in the form column and focus moves to the panel's heading; the note column stays in place.
5. **Given** a send fails (spam check refused, service unavailable, too long), **When** the response arrives, **Then** the same plain-language status messages appear as today.

---

### Edge Cases

- **Success panel height**: the "Message sent" panel is much shorter than the form. The note column keeps its content and the page does not jump the visitor away from the panel; focus is on the panel heading.
- **Long project slug**: a `?project=` value at the 100-character limit wraps within the form column and does not widen it.
- **Validation errors on a wide screen**: error messages under fields wrap within the form column and do not push the note column out of line.
- **Very wide screens (1920 px and up)**: the two columns stay within the site's existing content width; the form does not stretch further.
- **Dark mode**: the note, its links and the form meet the same contrast requirements as the rest of the site in both themes.
- **The test site's contact form fixture page**: it holds the form without the note; the form must still render correctly there (on its own, the form fills its space as today).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At viewport widths of 1024 px and above, the contact page MUST show two top-aligned columns: the note on the left and the form on the right, with the form column wider (roughly a 5 to 7 split of the content width).
- **FR-002**: Below 1024 px, the contact page MUST show one column, with the note above the form, and MUST NOT scroll sideways at 320 px and up.
- **FR-003**: Reading order and keyboard order MUST match the visual order at every width: page title, note, then the form column (privacy notice, then form fields).
- **FR-004**: The note MUST say which conversations Don welcomes, matching the home page's "open to" line: speaking and mentoring conversations, with systems leadership and AI experiments named as topics. It MUST NOT invite consulting inquiries.
- **FR-005**: The note MUST state the response expectation in plain words: Don reads every message and replies by email within a few days.
- **FR-006**: The note MUST state Don's location and time zone as "Vancouver Island, BC" and "Pacific Time".
- **FR-007**: The note MUST offer links to Don's GitHub and LinkedIn profiles, taken from the same list the site footer and home page already use so the three stay in step, and a plain mailto link to the email address the privacy policy and terms of use already publish, with the address contact@doncoleman.ca shown as the link text.
- **FR-008**: The page MUST keep its existing privacy notice (what typed details are used for, that Don keeps them only as long as needed and deletes them on request, and the link to the privacy policy that opens in a new tab), placed at the top of the form column directly above the form fields, not in the note column, and before the fields in reading order.
- **FR-009**: The note's text MUST stay in the contact page's content file so Don can edit it without touching a component (Principle VI), and MUST be readable with JavaScript turned off.
- **FR-010**: The note MUST NOT include Don's job title, and its copy MUST be plain language with no hype or filler.
- **FR-011**: The form MUST keep every existing field, label, help text and control unchanged in content and behaviour: Name, Email, Organization (optional), Message, the consent box with its privacy policy link, the hidden trap field, the project line, the spam check, the status line, the Send button and the "Sending this form needs JavaScript" notice. No field is added or removed.
- **FR-012**: The `?project=` behaviour MUST be unchanged: the value is read as plain text, cleaned and capped as today, shown as "About: <value>" in the form column and sent with the message.
- **FR-013**: The spam check MUST still load only after the visitor's first interaction with the form, and the page's content security policy MUST still allow it on this page only.
- **FR-014**: Validation errors, status announcements, the success panel with focus on its heading, failure messages and the back-forward cache reset MUST behave exactly as they do now; the success panel appears in the form column.
- **FR-015**: The page MUST meet WCAG 2.2 AA at every width and in both themes, including link contrast and visible focus on the new note links.
- **FR-016**: The page MUST stay within the site's performance budget and add no client-side script beyond what the form already loads.

### Key Entities

- **Contact note**: the short block of text on the contact page's left column (or top, on a phone): welcomed conversations, reply expectation, location and time zone, and quick links. Edited by Don in the contact page's content file.
- **Quick links**: GitHub and LinkedIn (from the site's existing social link list) and the public contact email address, shown as the text of a mailto link.
- **Privacy notice**: the existing paragraph about how typed details are used, at the top of the form column above the fields. It is not part of the note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1024 px wide and above, a visitor sees the note and the start of the form side by side without scrolling on a 1280 x 800 screen.
- **SC-002**: At 375 px and at 1023 px wide, the note is entirely above the form and the page has no sideways scroll.
- **SC-003**: Every existing contact page journey (valid send, project line, validation errors, spam-check failure, back-forward cache) passes unchanged at both a wide and a phone width.
- **SC-004**: The contact page has zero automated accessibility violations in light and dark themes at both widths.
- **SC-005**: A visitor can find the reply expectation, the time zone and a way to reach Don outside the form within 10 seconds of opening the page, without scrolling on a wide screen.

## Assumptions

- **Email address**: the address shown is contact@doncoleman.ca, which the privacy policy and terms of use already publish; showing it on the contact page publishes nothing new. It is a plain mail link, not a form or a script.
- **Location and response time**: "Vancouver Island, BC — Pacific Time" and "replies by email within a few days" are Don's own words from the issue, so they are used as given. "Vancouver Island" already appears on the About page.
- **Existing copy**: the current first paragraph ("Use this form to ask about a project, a talk, something I've written…") is replaced by the note; the privacy paragraph moves to the top of the form column and is kept word for word unless the plan finds a reason to trim it.
- **Fields already present**: the issue lists Organization (optional) and a consent checkbox as if new; both already exist and are kept as they are.
- **Width**: the two columns share the site's existing page content width (the same maximum width other pages use); the page does not get a wider container.
- **Breakpoint**: 1024 px is the site's existing "large" breakpoint in its Tailwind theme, so the issue's grid class names are read as intent and the plan picks how to express it in the theme.
- **Visual baselines**: the contact form's light, dark, desktop and phone screenshots will change and are refreshed on both platforms as part of this work.
- **Out of scope**: changing the form's fields, wording, validation rules, the contact API, the email sent, the spam check settings, the site's footer or header, and the home page's "open to" line.
