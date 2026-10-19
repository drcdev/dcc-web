# Feature Specification: Collapsible questions panel on small screens

**Feature Branch**: `046-mobile-questions-disclosure`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: GitHub issue #183, "Mobile optimization for AI Think before you read
questions panel". On screens narrower than 1280 px the "Think before you read" panel sits between
the post title card and the first paragraph, pushing the article below the fold on phones. Below
1280 px it should be a compact, collapsible disclosure (closed: a light trigger; open: the full
questions interface). At 1280 px and wider the current right-hand sticky column stays. No layout
shift when JavaScript starts; with JavaScript off the panel stays hidden with no dead button;
accessible disclosure semantics (`aria-expanded`, keyboard focus) to WCAG 2.2 AA.

## Context

The panel was built by feature 022 (`specs/022-critical-thinking-questions`, contract
`contracts/questions-panel.md`). This feature changes only how the panel is presented below the
`xl` breakpoint (1280 px). Everything the panel does once it is open (the Get questions and New
questions buttons, the status messages, the list, the AI note, the request rules and the site-wide
bucket) is unchanged and keeps 022's contract rows P04, P06–P17 and P21–P24. This feature
replaces 022's row P20 (the full panel as a block above the body below `xl`).

Every width in this spec is a viewport width in CSS px. "Below 1280 px" (the small layout) means
1279 CSS px and narrower; "1280 px and wider" (the wide layout) includes 1280 itself.

## Clarifications

### Session 2026-10-19

- Q: What exact words should the closed bar show on phones and tablets? → A: Don's own wording:
  "Think while you read" on the first line and a smaller second line "Optional AI critical
  thinking questions" (exact strings).
- Q: What should the closed bar look like on the page? → A: The panel's own rounded, bordered
  card cut down to one slim row (label on the left, open/closed arrow on the right); when opened,
  the same card grows to show the content.
- Q: If a reader closes the panel after questions have loaded, or while they are still loading,
  should the closed bar show that? → A: No. The closed bar always reads the same; the questions
  or message are there when the reader reopens.
- Q: Should the panel's heading (shown at 1280 px and wider, and the panel's landmark name) also
  change from "Think before you read" to "Think while you read"? → A: Yes, at every width. Wide
  screens show no second line; SC-005 allows this one wording change. (Closes round 1's open
  item.)
- Q: How tall may the closed bar be on a phone? → A: No taller than 5rem plus its margins at
  390 px wide with default text size.
- Q: Does the open panel on a phone keep the sentence "Get a few questions to keep in mind while
  you read this post."? → A: Yes; the open panel's content matches the wide-screen panel.
- Q: Does the panel open and close instantly or with a slide? → A: Instantly, with no animation;
  only the open/closed arrow changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start reading straight away on a phone (Priority: P1)

A reader opens a writing post on a phone or tablet. Under the title card they see a single, slim
"Think while you read" bar instead of the full panel, and the article's first paragraph begins
within the first screen, so they can start reading without scrolling past a widget.

**Why this priority**: This is the problem the issue reports. Most of the gain comes from the
closed state alone.

**Independent Test**: Load a post at 390×844 and 768×1024 with JavaScript on. The questions
area is one compact bar, the panel's sentence and buttons are not shown, and the top of the
article's first paragraph is inside the first viewport.

**Acceptance Scenarios**:

1. **Given** a writing post at a viewport narrower than 1280 px with JavaScript on, **When**
   the page loads, **Then** the questions area shows only a closed trigger reading "Think
   while you read" with the smaller second line "Optional AI critical thinking questions", and
   the panel's
   description sentence, buttons, status text and list are not displayed.
2. **Given** the same page at 390×844 (and at 768×1024), **When** it loads, **Then** the top
   edge of the first paragraph of the article body is inside the first viewport without
   scrolling.
3. **Given** the same page, **When** it loads and finishes initialising, **Then** nothing on
   the page moves because of the questions area (no layout shift attributable to it).

---

### User Story 2 - Open the panel and get questions on a phone (Priority: P1)

A reader who wants questions taps or keyboard-activates the trigger. The panel opens in place and
works exactly as it does today: Get questions, the status message, the list, the AI note and
New questions. They can close it again with the same trigger.

**Why this priority**: Collapsing the panel must not lose the feature; without this story the
change would remove questions from small screens.

**Independent Test**: At 390×844, activate the trigger with a tap and, separately, with the
keyboard (Tab to it, then Enter and Space); the panel opens, "Get questions" works with a stubbed
response, and activating the trigger again closes it.

**Acceptance Scenarios**:

1. **Given** the closed trigger, **When** the reader activates it by pointer, Enter or Space,
   **Then** the full panel content appears directly below the trigger, the trigger reports
   that it is expanded, and focus stays on the trigger.
2. **Given** the open panel, **When** the reader presses "Get questions", **Then** the panel
   behaves exactly as 022's contract describes (states, messages and focus moves unchanged).
3. **Given** the open panel, with or without questions shown, **When** the reader activates the
   trigger again, **Then** the content is hidden, the trigger reports that it is collapsed,
   focus stays on the trigger, and any questions already fetched are kept and shown again on
   the next open without a new request.
4. **Given** the closed trigger, **When** the reader opens it, **Then** no request for
   questions is sent; a request is sent only when the reader presses "Get questions" or
   "New questions".
5. **Given** a screen reader user, **When** they reach the trigger, **Then** it is announced as
   a button with its name and its collapsed or expanded state, and it identifies the content it
   controls.

---

### User Story 3 - Wide screens keep the sidebar (Priority: P2)

A reader on a desktop window 1280 px or wider sees the panel as today (only its heading now reads "Think while you read"): open, in the
right-hand column beside the body, sticky while it fits the window, with no trigger.

**Why this priority**: It protects existing behaviour; nothing new is delivered at this width.

**Independent Test**: Load a post at 1280×800 and 1440×900; the panel is in the right-hand
column with its full content, no disclosure trigger is visible or focusable, and 022's
placement checks (P21, P21a) still pass.

**Acceptance Scenarios**:

1. **Given** a viewport 1280 px or wider, **When** the page loads, **Then** the full panel is
   shown in the right-hand column and no trigger is displayed or reachable by keyboard.
2. **Given** a window that crosses 1280 px while the page is open (resize, rotation or zoom),
   **When** it becomes 1280 px or wider, **Then** the full panel shows in the sidebar whatever
   the small-screen open or closed state was; **When** it becomes narrower again, **Then** the
   trigger returns in the state the reader last left it on the small layout (closed if they
   never opened it), and any fetched questions are kept.

---

### User Story 4 - JavaScript off (Priority: P2)

A reader with JavaScript turned off reads the post normally. Neither the trigger nor the panel
is shown, and there is no button that does nothing.

**Why this priority**: Required by the constitution (Principle V) and by 022's P05; easy to
break when adding a trigger.

**Independent Test**: Load a post with JavaScript disabled at 390×844 and at 1280×800; no part
of the questions area is displayed or reachable by keyboard, and the body follows the title card.

**Acceptance Scenarios**:

1. **Given** JavaScript is off, **When** a post loads at any width, **Then** neither the trigger
   nor any panel content is displayed, and no control in the questions area receives focus.

---

### Edge Cases

- **Zoom and reflow**: at 200% zoom on a 1280 px window and at 400% zoom (320 CSS px) the small
  layout applies, the trigger is shown, and nothing scrolls horizontally (WCAG 1.4.10). Text
  spacing overrides (WCAG 1.4.12) grow the trigger without clipping its label.
- **Narrowest width (320 px)**: the trigger's label wraps rather than overflowing; the trigger
  keeps a target of at least 44×44 CSS px, matching the panel's existing buttons.
- **Request in flight when closed**: if the reader closes the panel while "Getting questions..."
  is running, the request completes and its result (questions or message) is shown when they
  reopen (FR-005, FR-009). Focus is never moved into the closed content: the focus move 022 makes
  on success (to "New questions") has no effect while the panel is closed, and focus stays where
  the reader left it (normally the trigger).
- **Script fails to load or throws**: the closed bar is already shown (FR-010), so tapping it
  does nothing, the same failure mode as 022's buttons today; the article still reads normally.
  No fallback is added, because any fallback would itself need script.
- **Back/forward cache**: a page restored from the browser's back/forward cache is the same page
  instance, so it may keep the open or closed state the reader left; a reload or new navigation
  always starts closed (FR-011).
- **Long titles, wrapping and narrow containers**: a long post title or summary grows only the
  title card, not the bar. The label strings are fixed English (the site has no translations).
  When the label wraps (320 px, larger text, text-spacing overrides) the indicator stays on the
  right, vertically centred, and never overlaps the text.
- **Forced colours**: the trigger's boundary, its state indicator and its focus ring stay
  visible using system colours, as 022's P23 requires for the panel.
- **Dark theme**: the trigger meets the same contrast rules as the panel in both themes.
- **Reduced motion**: opening and closing is instant for everyone, with no animation (only the
  open/closed arrow changes), so `prefers-reduced-motion: reduce` needs no special handling.
- **Find in page**: text inside the closed panel is not found by the browser's find, which is
  acceptable because it is generated controls, not article content.
- **Posts without a question hash**: no panel and no trigger, as today.
- **Print**: out of scope; current print behaviour is kept.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Below 1280 CSS px, with JavaScript on, the questions area MUST first appear as a
  closed disclosure: a single trigger in the same place the panel occupies today (after the
  title card, before the body, in DOM and focus order). The closed state is the panel's own
  rounded, bordered card cut down to one slim row, label on the left and the open/closed
  indicator on the right; opening grows the same card to show the content.
- **FR-002**: The trigger's visible label MUST be exactly "Think while you read" on the first
  line and, in smaller text on a second line, exactly "Optional AI critical thinking
  questions", with a non-text indicator of open or closed state on the right that is not the
  only way the state is conveyed: the state is also exposed as the trigger's `aria-expanded`
  value and shown by the content being displayed or not, so a check of the attribute and of the
  content's visibility proves it. The second line is no smaller than 0.875rem and is sized in
  rem so it scales with the reader's text size. The label is fixed: it does not change when questions have
  loaded, are loading or have failed. Copy is plain language with no emoji (constitution,
  Development Workflow). The panel's heading at 1280 px and wider, and the panel's landmark name
  at every width, MUST also read exactly "Think while you read" (replacing "Think before you
  read"); wide screens show no second line.
- **FR-003**: The trigger MUST be a native button that exposes its state through
  `aria-expanded` and names the content it controls through `aria-controls` (the id of the
  content wrapper, which exists in the markup in both states). Its accessible name MUST be its
  visible text, both lines in order, so the name contains the visible label (WCAG 2.5.3); the
  indicator is hidden from assistive technology. It MUST be operable by a single click or tap,
  Enter and Space, with no hover, drag or path gesture (WCAG 2.5.1, 2.5.7). Escape is not
  required to close it: the content is in-flow page content, not an overlay (APG disclosure
  pattern). It MUST use the site's existing focus ring and have a target of at least 44×44 CSS
  px at every width, including 320 px.
- **FR-004**: Opening MUST reveal the panel's existing content (description, buttons, status,
  list, AI note) directly after the trigger; the description sentence "Get a few questions to
  keep in mind while you read this post." is kept, so the open content matches the wide-screen
  panel. Closing MUST hide it from sight, from the accessibility tree and from the focus order.
  Focus MUST stay on the trigger on both open and close. Opening and closing MUST be instant,
  with no animation; only the open/closed indicator changes. The open card grows in the page
  flow to fit its content and pushes the body down; it has no maximum height and no inner
  scroll.
- **FR-005**: Opening or closing MUST NOT send a questions request, and MUST NOT reset the
  panel's state; fetched questions, the current message and a pending request survive closing
  and reopening.
- **FR-006**: At 1280 CSS px and wider the panel MUST be shown open in the right-hand column
  exactly as today (022 P21, P21a) apart from the heading wording (FR-002), with no trigger
  displayed or focusable, whatever the small-layout state. The questions area keeps the same DOM
  and focus-order position in both layouts (after the title card, before the body); only its
  visual placement differs.
- **FR-007**: Crossing the 1280 px boundary while the page is open MUST switch layouts without a
  reload and MUST keep the panel's state; below 1280 px the open or closed state the reader last
  chose on the small layout is restored (closed if never opened). Focus on a control inside the
  content stays on it across the boundary when the content is displayed on both sides. The page
  moves no focus on a resize: if the trigger itself has focus when the window becomes 1280 px or
  wider, it stops being displayed and the browser's default handling applies; this is accepted
  because the reader caused the change (resize, rotation or zoom), not the page.
- **FR-008**: With JavaScript off, neither the trigger nor the panel MUST be displayed or
  reachable at any width (022 P05 extended to the trigger): the trigger, the content and the
  panel's landmark are all absent from sight, the accessibility tree and the focus order.
- **FR-009**: The panel keeps a single live region (022 P08), inside the content. Status changes
  that happen while the panel is closed MUST NOT be lost: whatever the request state reached
  while closed (loading, ready with its list, limited, stale or error, each with its 022
  message) is the state shown when the panel is reopened. A change made while the panel is
  closed is not announced, and no duplicate live region is added. This meets WCAG 4.1.3: the
  reader has hidden the area, so the message is not presented until they reopen it, and it is
  then in place and readable in the region.
- **FR-010**: The closed state MUST be rendered in its final size before first paint when
  JavaScript is on, so the page shows no layout shift from the questions area while scripts
  initialise. The bar is visible from first paint (as the whole panel is today), before the
  deferred script attaches its handler; a tap in that short window does nothing and the reader
  can tap again. This is accepted because showing the bar only after the script loads would be
  the layout shift this requirement forbids. Opening and closing are reader-initiated and are not
  counted as unexpected shift; neither is the open card growing when questions or a message
  arrive after the reader pressed "Get questions" or "New questions", which is unchanged from
  022 and outside the page-load measure in SC-003.
- **FR-011**: The open or closed choice MUST NOT be stored between page loads or pages: it is
  never written to cookies, local or session storage or the URL, and every page load (including a
  reload) starts closed below 1280 px.
- **FR-012**: The change MUST keep the post template inside the performance budget (JavaScript
  size, LCP, CLS) without raising any budget limit, and the existing content security policy:
  no `style` attribute in the panel's markup or set by script, no new inline script, the CSP
  header unchanged, no CSP violation reported in the browser on the post page, and no new
  third-party code. The disclosure makes no network request of its own; the only requests from
  the panel remain 022's questions requests, sent only by "Get questions" and "New questions"
  (FR-005).
- **FR-013**: The trigger and the open panel MUST meet WCAG 2.2 AA in light and dark themes and
  in forced-colours mode. Text, including the smaller second line, meets 4.5:1 against the
  card background; the indicator meets 3:1 (WCAG 1.4.11); the card border is decorative (the
  label identifies the control) and keeps the panel's current colours. The focus ring is visible
  in both themes at 3:1 against adjacent colours, uses the system `Highlight` colour in forced
  colours, and the focused trigger is not hidden by other content (WCAG 2.4.7, 2.4.11). The
  automated accessibility scans on the post template MUST pass with the panel closed and open
  at 390 px in light and dark themes, and at 1280 px as today.
- **FR-014**: Nothing else on the post page changes: the title card, body, share area, author
  card and related posts keep their current layout at every width.

### Key Entities

- **Disclosure state (small layout)**: open or closed, held only for the life of the page,
  starting closed. Independent of the panel's request state (idle, loading, ready, limited,
  stale, error), which is unchanged from 022.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the representative post at 390×844 and 768×1024 with JavaScript on, the top
  edge of the article's first paragraph is within the first viewport (its top is less than the
  viewport height, 844 or 1024 px, with the page scrolled to the top), where today it is not at
  390×844. The representative post is the fixture post the existing post-template checks use;
  real posts with unusually long titles or summaries are not bound by this criterion.
- **SC-002**: The closed questions area is no taller than 5rem plus its margins at 390 px wide
  with default text size (versus the full panel today), measured as the closed card's border
  box: its border is included, its outer margins are not. The limit applies only at 390 px with
  default text size and spacing; at 320 px, with larger text or with text-spacing overrides the
  bar may grow to fit its wrapped label (Edge Cases), keeping its 44×44 CSS px minimum.
- **SC-003**: Cumulative layout shift attributable to the questions area on page load is 0 at
  390×844 and at 1280×800 (including the sticky sidebar at 1280×800), and the post template
  stays within its existing CLS budget. Measured from navigation until the page is idle, with
  the web font swap included: no layout-shift entry has a source inside the questions area or
  is caused by it, and the existing budget check passes.
- **SC-004**: A keyboard-only reader can open the panel, get questions and close it again using
  only Tab, Enter and Space, with focus never lost to the page start: at no point in that
  sequence does the document's active element become the page body.
- **SC-005**: At 1280 px and wider, the panel's position, size and sticky behaviour match the
  current behaviour (existing placement checks pass unchanged; visual baselines for that width
  differ only by the heading now reading "Think while you read"). The visual comparison keeps its
  existing threshold, and the reviewer of the refreshed images confirms the only changed region
  is the heading text.
- **SC-006**: With JavaScript off, zero focusable elements are in the questions area at any
  width.
- **SC-007**: The small-layout requirements hold at 320, 390, 768 and 1279 px wide, and the
  wide-layout requirements at 1280 and 1440 px wide.

## Assumptions

- The trigger replaces the panel's visible heading on the small layout; the panel remains a
  complementary landmark in both layouts, named "Think while you read" (FR-002), and the post
  title
  stays the page's only `h1`. Decided in the plan (research R3): below 1280 px the trigger sits
  inside the panel's `h2` (the usual disclosure pattern), so the panel stays in heading
  navigation; at 1280 px and wider the same `h2` shows the plain heading text. The landmark is
  named directly, so it keeps the one name "Think while you read" at every width.
- The issue's emoji and arrow ("💡 ... ↓") are illustrative. The site's copy rule is plain
  language, so the label has no emoji; the open or closed indicator is a decorative icon hidden
  from assistive technology.
- The panel stays in its current position below 1280 px (between the title card and the body)
  rather than moving after the body; collapsing it is enough to bring the body into the first
  screen.
- The breakpoint stays at the site's `xl` (1280 CSS px), the same as 022, so tablets in either
  orientation get the small layout.
- No new page, component library, dependency or API is needed; standard HTML (a native button
  with disclosure attributes) and the panel's existing script are enough. The plan names
  `<details>`/`<summary>` as the first-party option considered and why it falls short
  (Principle IV, research R1).
- Visual baselines: the post-template shots at phone width (390 px, closed bar) and at desktop
  width (1280 px, heading wording) change, each in light and dark, on macOS and Linux: eight
  images. CI compares against the Linux images, which are refreshed in Docker
  (`.claude/skills/_shared/visual-baselines.md`). The open state and tablet widths get no
  baseline; their behaviour is covered by the end-to-end and accessibility checks. Any visual
  diff outside those eight images is a regression. The shots use the fixture post with the panel
  idle (no questions requested), so no generated text appears, and the existing visual helpers
  (self-hosted fonts, lazy images loaded before capture) keep them deterministic.
- The heading rename touches only the panel component, its tests and `docs/testing.md`; no other
  page shows the panel's heading, and 022's spec files are history and keep the old wording.
- 022's contract file is history and is not edited; this feature's own contract records the
  replacement for P20.

## Follow-up work (out of scope)

- Remembering the reader's open or closed choice across pages or visits (rejected for now by
  FR-011: it would need browser storage and adds little).
- Offering the questions after the body, or a floating "questions" button, on small screens.
- Any change to the questions API, the prompt, the model or the bucket.
- Print styles for the questions panel.
