# Feature Specification: Two-column editorial layout for the contact page

**Feature Branch**: `052-contact-editorial-layout`

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
- Q: Should the note column have its own visible heading, given the form column already opens with the "Send a message" h2? → A: Yes, a visible h2 with a short heading such as "Before you write".
- Q: Where does the privacy paragraph sit relative to the "Send a message" heading in the form column? → A: Under the heading: the "Send a message" heading, then the privacy paragraph, then the fields.
- Q: How should the GitHub, LinkedIn and email quick links look in the note? → A: Icon plus visible text: the site's existing GitHub and LinkedIn icons beside visible text labels, and the email address shown as text.
- Q: Should the GitHub and LinkedIn links open in a new tab? → A: No, they open in the same tab, like the footer and home page links.
- Q: On wide screens, where does the "Contact" page title go? → A: Full width above both columns; the note and form columns start level beneath it.
- Q: The site has GitHub and LinkedIn icons but no email icon; what should the email link show? → A: Add a new decorative envelope (mail) icon in the same style as the GitHub and LinkedIn icons; FR-007 stays as written.
- Q: Should the note's h2 be exactly "Before you write"? → A: Yes, the heading text is exactly "Before you write".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read who Don wants to hear from, then write to him, on a wide screen (Priority: P1)

A visitor on a laptop or desktop opens the contact page. On the left they read a short note from Don: the kinds of conversation he welcomes, that he reads every message and replies by email within a few days, that he is on Vancouver Island in the Pacific time zone, and links to his GitHub, LinkedIn and email address. On the right, next to that note, is the form. The form fields are a comfortable reading width rather than stretched across the page.

**Why this priority**: This is the change the issue asks for. The page should feel like an invitation to start a conversation, and the visitor should know what to expect before they write.

**Independent Test**: Open the contact page at a width of 1280 px: the note and its links sit in a column on the left, the "Send a message" form sits in a wider column on the right, and both start at the same height.

**Acceptance Scenarios**:

1. **Given** a viewport 1024 px wide or wider, **When** a visitor opens the contact page, **Then** the "Contact" page title spans the full width above both columns, the note column (headed by its own h2, "Before you write") is on the left, the form column is on the right, the form column is the wider of the two (7 parts to 5 of a 12-part grid), and the two columns are top-aligned beneath the title.
2. **Given** the note column, **When** the visitor reads it, **Then** it names the conversations Don welcomes (speaking and mentoring, on systems leadership and AI experiments), says he reads every message and replies by email within a few days, says "Vancouver Island, BC" and "Pacific Time", and offers links to GitHub, LinkedIn and his email address, each with an icon and visible text, opening in the same tab.
3. **Given** the form column, **When** the visitor reads it, **Then** the "Send a message" heading comes first, followed by the existing privacy notice (what typed details are used for, how long they are kept, and a link to the privacy policy that opens in a new tab), and then the form fields, in that visual and reading order.
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

- **Success panel height**: the "Message sent" panel is much shorter than the form. At both layouts the note keeps its content and position (top of the left column on a wide screen, above the panel when stacked), focus moves to the panel's "Message sent" heading, and the browser scrolls that heading into view; the page does not jump the visitor elsewhere.
- **Long project slug**: a `?project=` value at the 100-character limit wraps within the form column at every width and does not widen it or cause sideways scroll.
- **Validation errors on a wide screen**: error messages under fields wrap within the form column, including at exactly 1024 px, and do not push the note column out of line or narrow it.
- **Column heights differ**: either column may be the taller (the form usually is; the note may be when the success panel shows). The shorter column stays at the top of its row; neither column is sticky or scrolls on its own, and the page scrolls as one.
- **Very wide screens (1920 px and up)**: the two columns stay within the site's existing content width (1024 px, the same maximum other pages use), centred, with equal space on both sides; the form does not stretch further.
- **Dark mode**: the note, its links and the form meet the same contrast requirements as the rest of the site in both themes.
- **The form without a note**: when the contact form is placed without a note, it renders alone, with no columns, and fills its space as today at every width. The test site's contact form fixture page now holds a short fixture note, so its screenshots show the two-column layout at the desktop width and the stacked layout at the phone width. It uses the same component and page route as the real page, so it gets the same content security policy; it is never deployed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At viewport widths of 1024 px and above, the contact page MUST show the page title full width above two top-aligned columns: the note on the left and the form on the right, with the form column wider: a 12-part grid with the note taking 5 parts and the form 7, and a 48 px gap between them. "Top-aligned" means the top edges of the two columns (and so of their h2 headings) sit at the same height, within 1 px. The columns share the site's existing page content width of at most 1024 px, centred.
- **FR-001a**: The note MUST open with its own visible h2 with the exact text "Before you write", at the same heading level as the form's "Send a message" heading. The note column is a region whose accessible name is that heading; the form keeps its existing name from "Send a message". No other landmark is added (the page's existing main landmark holds both columns).
- **FR-001b**: The page's heading outline MUST be: one h1 (the page title "Contact"), then the h2 "Before you write", then the h2 "Send a message". After a successful send, the success panel's heading "Message sent" stays an h2, as today. The page's `<title>` and h1 are unchanged.
- **FR-002**: Below 1024 px (1023 px and narrower), the contact page MUST show one column, with the note above the form and a 40 px space between them, and MUST NOT scroll sideways at 320 px and up (320 px is the narrowest supported width; 375 px is the phone width the journeys use). Content MUST reflow without loss at 320 CSS px (WCAG 1.4.10) and stay usable at 200% text zoom.
- **FR-003**: Reading order and keyboard order MUST match the visual order at every width: page title, note (its h2, text, then quick links), then the form column ("Send a message" heading, privacy notice, the "Sending this form needs JavaScript" notice, then form fields). The source order is the visual order: no CSS reordering and no positive tab index is used, so crossing the 1024 px breakpoint changes only placement, never order.
- **FR-004**: The note MUST say which conversations Don welcomes, matching the home page's "open to" line: speaking and mentoring conversations, with systems leadership and AI experiments named as topics. It MUST NOT invite consulting inquiries.
- **FR-005**: The note MUST state the response expectation in plain words: Don reads every message and replies by email within a few days. The note MUST make no promise about how messages are stored, kept or deleted; that stays with the privacy notice and the privacy policy (whose 30-day answer to data requests is a separate commitment and does not conflict).
- **FR-006**: The note MUST state Don's location and time zone as "Vancouver Island, BC" and "Pacific Time".
- **FR-007**: The note MUST offer links to Don's GitHub and LinkedIn profiles, taken from the same list the site footer and home page already use so the three stay in step, and a plain mailto link to the email address the privacy policy and terms of use already publish, with the address contact@doncoleman.ca shown as the link text. Each quick link MUST show an icon beside visible text (GitHub and LinkedIn reuse the site's existing icons; the email link gets a new envelope icon added in the same style; all three icons are decorative and hidden from screen readers, and the visible text is the link name), and the GitHub and LinkedIn links MUST open in the same tab, like the footer and home page links.
- **FR-007a**: Each quick link's accessible name MUST be exactly its visible text ("GitHub", "LinkedIn", "contact@doncoleman.ca"), with no separate accessible label, so the names are unique, make sense out of context and match what is seen (WCAG 2.4.4, 2.5.3). The address as link text is enough to show the link starts an email; no extra wording is added. "Decorative" means each icon is hidden from assistive technology, is not focusable and has no text alternative or title. The same-tab links carry no new-tab warning; the privacy policy links keep their visible "(opens in a new tab)" wording.
- **FR-007b**: The mailto link MUST carry only the address: no subject, body or other prefilled data. The contact page MUST take the address from one site setting, and a check MUST confirm that the privacy policy and terms of use publish that same address, so the three cannot drift apart.
- **FR-007c**: The quick links MUST be a plain list of three items under the note text, one link per line at every width (no wrapping of several links onto one line), with no separate group heading; the note's h2 names the region they sit in. The links show whatever GitHub and LinkedIn entries the shared social link list holds, followed by the email link. Every entry in that list MUST have a matching icon; an entry without one fails the component tests rather than rendering without an icon.
- **FR-008**: The page MUST keep its existing privacy notice (what typed details are used for, that Don keeps them only as long as needed and deletes them on request, and the link to the privacy policy that opens in a new tab), word for word, placed in the form column directly under the "Send a message" heading and directly above the form fields, not in the note column, and in that order for reading. It sits inside the form, so it is read after the form's heading; no extra programmatic association (such as a description reference) is added. The consent box keeps its own label and privacy policy link, unchanged; the notice explains the policy and the box records agreement to it, and both stay.
- **FR-009**: The note's text MUST stay in the contact page's content file so Don can edit it without touching a component (Principle VI), and MUST be readable with JavaScript turned off. The note is static content fixed at build time; nothing from the address bar or any other visitor input reaches it.
- **FR-010**: The note MUST NOT include Don's job title (by Don's standing rule, his title appears only on the About page; a reviewer checks that the note names no role or title), and its copy MUST be plain language with no hype or filler.
- **FR-011**: The form MUST keep every existing field, label, help text and control unchanged in content and behaviour: Name, Email, Organization (optional), Message, the consent box with its privacy policy link, the hidden trap field, the project line, the spam check, the status line, the Send button and the "Sending this form needs JavaScript" notice. No field is added or removed. The trap field keeps its name (`website`), its place inside the form and its hiding method (hidden from view and from assistive technology, and not reachable by keyboard) at every width. The request the form sends, its shape and the contact API's same-origin check are unchanged.
- **FR-012**: The `?project=` behaviour MUST be unchanged: the value is treated as untrusted text, has control characters removed, is trimmed and capped at 100 characters, is shown as plain text (never as markup) as "About: <value>" in the form column, and is sent with the message.
- **FR-013**: The spam check MUST still load only after the visitor's first focus in, or first input to, a form control. Loading the page, scrolling, and moving through or using the note's links do not count. The page's content security policy MUST still allow the spam-check service on the contact page only; no other page's policy gains it (the existing check compares the contact page with the home page).
- **FR-014**: These behaviours MUST stay exactly as they are now, at every width: each invalid field is marked invalid and points to its error text, the status line (a polite live region) announces how many fields need attention, and focus moves to the first invalid field; the status line shows the same progress and failure messages (checking for bots, sending, not sent, try again from doncoleman.ca, too long, bot check failed, service unavailable, spam check failed to load) in the same words; a successful send replaces the form with the success panel in the form column and moves focus to its heading; and a page restored from the back-forward cache still shows the form again with errors, status and spam check reset and the typed values kept.
- **FR-015**: The page MUST meet WCAG 2.2 AA at every width and in both themes. Text and link text in the note MUST have at least 4.5:1 contrast against its background. The icons use the colour of their link text, so they meet at least 3:1 even though they are decorative. The note links MUST show the site's standard focus indicator: a 2 px solid outline, offset 2 px, in the site's focus colour, with at least 3:1 contrast against the background in both themes, and the system focus colour in forced-colors mode. Each quick link MUST be at least 24 px tall (WCAG 2.5.8). Nothing in the note or form clips or overlaps when text spacing is increased to the WCAG 1.4.12 values (no fixed heights on text). The site has no sticky header, so a focused element, including the success heading, is never hidden behind one (WCAG 2.4.11).
- **FR-016**: The page MUST stay within the site's performance budget on simulated mobile (LCP at most 2.5 s, CLS at most 0.1, long-task time at most 200 ms, JavaScript at most 10 KB, total transfer at most 150 KB) and add no client-side script beyond what the form already loads. The note, icons and mailto link add no inline script, no inline style that would need a content security policy change, no third-party origin, and no analytics, logging or tracking.
- **FR-017**: Line lengths stay readable at both layouts: when stacked, the note's text is no wider than about 65 characters per line; the form fields fill their column as today. At 1024 px and up, the form column is wide enough to hold the spam-check widget (at least 300 px) without clipping it; below 1024 px the widget sits as it does today. The email address may wrap at 320 px rather than overflow.

### Key Entities

- **Contact note**: the short block of text on the contact page's left column (or top, on a phone), under its own h2 "Before you write": welcomed conversations, reply expectation, location and time zone, and quick links. Edited by Don in the contact page's content file.
- **Quick links**: GitHub and LinkedIn (from the site's existing social link list) and the public contact email address, shown as the text of a mailto link. Each shows an icon beside visible text (a new envelope icon for the email link); GitHub and LinkedIn open in the same tab.
- **Privacy notice**: the existing paragraph about how typed details are used, in the form column between the "Send a message" heading and the fields. It is not part of the note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 1280 x 800 CSS px viewport (browser chrome not counted) at 100% zoom, with the site header in place, the note heading and the "Send a message" heading are both visible side by side without scrolling.
- **SC-002**: At 375 px and at 1023 px wide, the note is entirely above the form and the page has no sideways scroll; at 1024 px the two columns sit side by side (one breakpoint, stated as "1024 px and above" everywhere).
- **SC-003**: Every existing contact page journey (valid send, project line, validation errors, spam-check failure, back-forward cache) passes unchanged at both a wide and a phone width.
- **SC-004**: The contact page has zero axe-core violations for the WCAG 2.0, 2.1 and 2.2 A and AA rule tags, in light and dark themes, at a desktop and a phone width, idle and in the error and success states. Criteria axe cannot test (reading order, focus visibility, target size, text spacing, reflow at 200% zoom) are covered by the layout and order end-to-end tests and by Don's check on the preview.
- **SC-005**: A visitor can find the reply expectation, the time zone and a way to reach Don outside the form within 10 seconds of opening the page. Measured by proxy: in the SC-001 viewport, the reply expectation, "Pacific Time" and all three quick links are visible without scrolling (a preview check for Don).
- **SC-006**: Pressing Tab from the top of the page reaches the three quick links, in order, before the Name field, at a desktop and a phone width (end-to-end test).

## Assumptions

- **Email address**: the address shown is contact@doncoleman.ca, which the privacy policy and terms of use already publish; showing it on the contact page publishes nothing new. It is a plain mail link, not a form or a script. Its exposure to address scrapers is accepted as it already is on those pages; no obfuscation is added (it would need a script). Showing the address does not change where form emails go: the contact API still sends only to its one fixed, verified destination (Principles VII and VIII), which is a separate setting from the address the site displays.
- **Writing directly**: someone who emails the address directly bypasses the form and its notice. The privacy policy already covers contact emails in general (kept only as long as needed, deleted on request), so no new notice is needed.
- **Location and response time**: "Vancouver Island, BC — Pacific Time" and "replies by email within a few days" are Don's own words from the issue, so they are used as given. "Vancouver Island" already appears on the About page.
- **Existing copy**: the current first paragraph ("Use this form to ask about a project, a talk, something I've written…") is replaced by the note; the privacy paragraph moves into the form column, under the "Send a message" heading and above the fields, and is kept word for word (changing its wording is out of scope).
- **Fields already present**: the issue lists Organization (optional) and a consent checkbox as if new; both already exist and are kept as they are.
- **Width**: the two columns share the site's existing page content width (at most 1024 px, the same maximum width other pages use); the page does not get a wider container.
- **Breakpoint**: 1024 px is the site's existing "large" breakpoint in its Tailwind theme, so the issue's grid class names are read as intent and the plan picks how to express it in the theme.
- **Visual baselines**: the contact form's screenshots change and are refreshed as part of this work: desktop light, desktop dark, phone light and phone dark, each on macOS and Linux (eight images). No other baseline should change.
- **Motion and other WCAG 2.2 criteria**: the change adds no animation or transition, so reduced-motion needs nothing new. Forced-colors mode needs nothing new either: the icons use the text colour and the site's global rule already switches focus outlines to the system colour. The form is one step with no sign-in, and the spam check asks no puzzle of the visitor, so accessible authentication (3.3.8) and redundant entry (3.3.7) are unaffected; the contact page itself is the site's help mechanism, reached from the same header link on every page (3.2.6).
- **Out of scope**: changing the form's fields, wording, validation rules, the request it sends, the contact API, the email sent, the spam check settings, the site's footer or header, and the home page's "open to" line.
