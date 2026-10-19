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
- Open item for the next clarify round: whether the panel's existing heading ("Think before you
  read", shown at 1280 px and wider and naming the landmark) also changes to "Think while you
  read". Not decided here.

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

A reader on a desktop window 1280 px or wider sees the panel exactly as today: open, in the
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
  reopen (FR-005, FR-009).
- **Forced colours**: the trigger's boundary, its state indicator and its focus ring stay
  visible using system colours, as 022's P23 requires for the panel.
- **Dark theme**: the trigger meets the same contrast rules as the panel in both themes.
- **Reduced motion**: opening and closing is instant, or any transition is removed under
  `prefers-reduced-motion: reduce`.
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
  only way the state is conveyed. The label is fixed: it does not change when questions have
  loaded, are loading or have failed. Copy is plain language with no emoji (constitution,
  Development Workflow). Whether the panel's existing heading (at 1280 px and wider, and the
  landmark name) changes to match is an open item for the next clarify round.
- **FR-003**: The trigger MUST be a native button that exposes its state through
  `aria-expanded` and identifies the content it controls; it MUST be operable by pointer,
  Enter and Space; it MUST use the site's existing focus ring and have a target of at least
  44×44 CSS px.
- **FR-004**: Opening MUST reveal the panel's existing content (description, buttons, status,
  list, AI note) directly after the trigger; closing MUST hide it from sight, from the
  accessibility tree and from the focus order. Focus MUST stay on the trigger on both open and
  close.
- **FR-005**: Opening or closing MUST NOT send a questions request, and MUST NOT reset the
  panel's state; fetched questions, the current message and a pending request survive closing
  and reopening.
- **FR-006**: At 1280 CSS px and wider the panel MUST be shown open in the right-hand column
  exactly as today (022 P21, P21a), with no trigger displayed or focusable, whatever the
  small-layout state.
- **FR-007**: Crossing the 1280 px boundary while the page is open MUST switch layouts without a
  reload and MUST keep the panel's state; below 1280 px the open or closed state the reader last
  chose on the small layout is restored (closed if never opened).
- **FR-008**: With JavaScript off, neither the trigger nor the panel MUST be displayed or
  reachable at any width (022 P05 extended to the trigger).
- **FR-009**: The panel keeps a single live region (022 P08). Status changes that happen while
  the panel is closed MUST NOT be lost: the current message is visible when the panel is
  reopened. Whether a message is announced while closed is left to the plan, provided no
  duplicate live region is added.
- **FR-010**: The closed state MUST be rendered in its final size before first paint when
  JavaScript is on, so the page shows no layout shift from the questions area while scripts
  initialise. Opening and closing are reader-initiated and are not counted as unexpected shift.
- **FR-011**: The open or closed choice MUST NOT be stored between page loads or pages; every
  page load starts closed below 1280 px.
- **FR-012**: The change MUST keep the post template inside the performance budget (JavaScript
  size, LCP, CLS) and the existing content security policy: no inline styles, no style
  attributes set from script, no new third-party code, and no new network requests.
- **FR-013**: The trigger and the open panel MUST meet WCAG 2.2 AA in light and dark themes and
  in forced-colours mode, and pass the automated accessibility scans on the post template in
  both the closed and open states.
- **FR-014**: Nothing else on the post page changes: the title card, body, share area, author
  card and related posts keep their current layout at every width.

### Key Entities

- **Disclosure state (small layout)**: open or closed, held only for the life of the page,
  starting closed. Independent of the panel's request state (idle, loading, ready, limited,
  stale, error), which is unchanged from 022.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a representative post at 390×844 and 768×1024 with JavaScript on, the top of
  the article's first paragraph is within the first viewport, where today it is not at 390×844.
- **SC-002**: The closed questions area is no taller than 4rem plus its margins at 390 px wide
  with default text size (versus the full panel today).
- **SC-003**: Cumulative layout shift attributable to the questions area on page load is 0 at
  390×844 and at 1280×800, and the post template stays within its existing CLS budget.
- **SC-004**: A keyboard-only reader can open the panel, get questions and close it again using
  only Tab, Enter and Space, with focus never lost to the page start.
- **SC-005**: At 1280 px and wider, the panel's position, size and sticky behaviour match the
  current behaviour (existing placement checks and visual baselines for that width pass
  unchanged).
- **SC-006**: With JavaScript off, zero focusable elements are in the questions area at any
  width.

## Assumptions

- The trigger replaces the panel's visible heading on the small layout; the panel remains a
  complementary landmark in both layouts (its name, "Think before you read" today, follows the
  open heading-wording item in Clarifications), and the post title
  stays the page's only `h1`. The plan decides whether the button sits inside the heading (the
  usual disclosure pattern) so the landmark keeps one name.
- The issue's emoji and arrow ("💡 ... ↓") are illustrative. The site's copy rule is plain
  language, so the label has no emoji; the open or closed indicator is a decorative icon hidden
  from assistive technology.
- The panel stays in its current position below 1280 px (between the title card and the body)
  rather than moving after the body; collapsing it is enough to bring the body into the first
  screen.
- The breakpoint stays at the site's `xl` (1280 CSS px), the same as 022, so tablets in either
  orientation get the small layout.
- No new page, component library, dependency or API is needed; first-party HTML disclosure
  behaviour and the panel's existing script are expected to be enough (the plan names the
  first-party option per Principle IV).
- Below-`xl` visual baselines for the post template will change and need refreshing on macOS and
  Linux (`.claude/skills/_shared/visual-baselines.md`); `xl` baselines should not change.
- 022's contract file is history and is not edited; this feature's own contract records the
  replacement for P20.

## Follow-up work (out of scope)

- Remembering the reader's open or closed choice across pages or visits (rejected for now by
  FR-011: it would need browser storage and adds little).
- Offering the questions after the body, or a floating "questions" button, on small screens.
- Any change to the questions API, the prompt, the model or the bucket.
- Print styles for the questions panel.
