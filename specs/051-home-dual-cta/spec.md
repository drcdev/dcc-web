# Feature Specification: Second call to action in the home introduction card

**Feature Branch**: `051-home-dual-cta`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Introduce dual call-to-action to homepage hero card" (GitHub issue #182). The home page's introduction card shows one button, "See how I can help", which goes to the contact page. For a first-time visitor, a contact form straight away is a big ask. The card gains an optional second, quieter button that leads to the writing (or projects) so a visitor has a lower-commitment next step. The main button stays the visually stronger one. On phones the two buttons stack; from tablet width up they sit side by side. Both buttons are at least 44 pixels tall and meet WCAG 2.2 AA contrast in light and dark modes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A first-time visitor picks a low-commitment next step (Priority: P1)

A visitor lands on the home page and reads the introduction card. They are not ready to get in touch, but they want to see more. Beside the main "See how I can help" button they see a second, visually quieter button that takes them to Don's writing. They choose it and arrive on the writing page.

**Why this priority**: This is the whole point of the change: a second path for visitors who would otherwise leave.

**Independent Test**: Build the site with a second call to action in the home page file and open the home page: the card shows two links, the main one to the contact page and the second to the writing page, and following the second lands on the writing page.

**Acceptance Scenarios**:

1. **Given** the home page file sets a main call to action ("See how I can help", contact page) and a second one ("Read my writing", writing page), **When** a visitor opens the home page, **Then** the introduction card shows both, the main one first in reading order and visually stronger (filled), the second one outlined.
2. **Given** the card shows both calls to action, **When** the visitor activates the second one by mouse, touch or keyboard, **Then** they arrive on the writing page.
3. **Given** JavaScript is turned off, **When** the visitor opens the home page, **Then** both calls to action are shown and work.
4. **Given** a keyboard user tabs through the card, **When** focus reaches each call to action, **Then** each shows a visible focus indicator, and focus moves from the main call to action to the second one.

---

### User Story 2 - The buttons fit any screen and stay readable (Priority: P1)

The two buttons look like a balanced pair on any screen. On a phone they are stacked, one above the other, each easy to tap. From tablet width (640 pixels) up they sit side by side on one row. In both light and dark mode their text and outlines are easy to read.

**Why this priority**: A second button that crowds, overflows or fails contrast would make the card worse than it is now. It ships with User Story 1, not after it.

**Independent Test**: Open the home page at 375, 640, 768 and 1280 pixels wide in light and dark mode: the buttons stack at 375, sit on one row from 640, are the same height as each other and at least 44 pixels tall, nothing overflows the card, and the accessibility check passes.

**Acceptance Scenarios**:

1. **Given** a viewport 375 pixels wide, **When** the home page loads, **Then** the two calls to action are stacked vertically, main one on top, and neither overflows the card.
2. **Given** a viewport 640 pixels wide or wider, **When** the home page loads, **Then** the two calls to action sit side by side on one row, main one first, and the card has no horizontal overflow.
3. **Given** any viewport, **When** the calls to action are measured, **Then** both have the same rendered height, and that height (the touch target) is at least 44 pixels; each is at least 44 pixels wide.
4. **Given** light mode and dark mode, **When** the home page is checked for contrast, **Then** each call to action's text meets 4.5:1 against its own background, the second call to action's outline meets 3:1 against the card, and the same holds for their hover states.

---

### User Story 3 - Don controls the second call to action from the page file (Priority: P2)

Don sets, changes or removes the second call to action by editing the home page file only: a label and a link, just like the main call to action. If he leaves it out, the card shows the main call to action alone, exactly as it does today. If he makes a mistake (an empty label, a bad link, or an unknown field), the build fails with a clear error.

**Why this priority**: Content as files (Principle VI) means the copy and destination live in the page file, not in code. It supports User Story 1 but is not visible to visitors on its own.

**Independent Test**: Validate home page front matter with and without a second call to action, and with invalid ones, against the page schema; build the site with the second call to action removed and confirm the card renders one button.

**Acceptance Scenarios**:

1. **Given** the home page file has no second call to action, **When** the site is built, **Then** the build succeeds and the card shows only the main call to action, with no empty slot or stray spacing.
2. **Given** the second call to action has a label and a link to a site page, **When** the site is built, **Then** the build succeeds and the card shows it.
3. **Given** the second call to action has an empty label, a missing or invalid link, or an extra field, **When** the site is built, **Then** the build fails with an error naming the problem field.
4. **Given** the main call to action is missing, **When** the site is built, **Then** the build still fails as it does today (the second call to action never replaces the main one).

---

### Edge Cases

- **Second call to action alone**: a page file with a second call to action but no main one is invalid, because the main one stays required.
- **Long labels**: if a label is long enough that two buttons do not fit side by side, the text wraps inside its button or the buttons stack; nothing is clipped and the card never scrolls sideways.
- **Social links in the same row**: the card's GitHub and LinkedIn icon links currently share a row with the call to action. With two buttons, the layout must still keep every link visible and tappable at 640 pixels, where the card's text column is narrowest; the social links may move to their own row.
- **Same destination twice**: nothing stops Don pointing both calls to action at the same page; the schema does not forbid it (no visitor harm, just redundancy).
- **Link to a hidden or draft page**: the second call to action uses the same link rules as the main one. Pointing it at a page that is hidden or draft would give a 404 on production, as with any other link; the launch content points at the writing page, which always exists.
- **Dark mode hover**: hover colours change only the background or border, never reduce text contrast below 4.5:1.
- **Reduced motion**: any colour transition on hover respects the visitor's reduced-motion setting, as the existing button does.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page's introduction settings MUST accept an optional second call to action with exactly two fields, a label and a link, validated by the same rules as the main call to action (non-empty label, valid site link, no extra fields).
- **FR-002**: The main call to action MUST stay required, and its rules MUST NOT change.
- **FR-003**: When a second call to action is set, the introduction card MUST show it after the main call to action, in reading order and in focus order.
- **FR-004**: When no second call to action is set, the card MUST render exactly as it does without this feature: one call to action and no empty element for the missing one.
- **FR-005**: The main call to action MUST look filled (solid accent background with contrasting text) and the second MUST look outlined (border, no fill at rest), so the main one is clearly the stronger choice in both light and dark mode.
- **FR-006**: Both calls to action MUST be links (they navigate to a page), each with its label as its accessible name, and MUST work with JavaScript turned off.
- **FR-007**: Below 640 pixels the two calls to action MUST be stacked vertically; from 640 pixels up they MUST sit side by side on one row.
- **FR-008**: Both calls to action MUST have the same rendered height, at least 44 by 44 pixels of target area, at every viewport width. This applies to the main call to action too, which is currently shorter than 44 pixels.
- **FR-009**: In light and dark mode, at rest and on hover, each call to action's text MUST have at least 4.5:1 contrast with its background, and the second call to action's border MUST have at least 3:1 contrast with the card background (WCAG 2.2 AA).
- **FR-010**: Each call to action MUST show a visible keyboard focus indicator that meets WCAG 2.2 AA focus appearance for the site.
- **FR-011**: The card MUST NOT overflow horizontally at any viewport width from 320 pixels up, and the social links MUST stay visible and tappable.
- **FR-012**: The colours used MUST come from the site's existing theme colours; no new colours are added.
- **FR-013**: The launch content MUST set the second call to action to the label "Read my writing" linking to the writing page. The main call to action keeps its current label and link.
- **FR-014**: The change MUST add no client-side script and MUST keep the home page within the existing performance budget.
- **FR-015**: Copy added by this feature MUST NOT include Don's job title, and MUST be plain language with no hype.

### Key Entities

- **Home introduction**: the settings for the home page's introduction card (photo, name, tagline, bio, main call to action). Gains one optional item, the second call to action.
- **Call to action**: a label (the visible button text) and a link (where it goes). The main one is required; the second is optional and has the same shape.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the built home page, a visitor can reach the writing page from the introduction card in one tap or click, without scrolling past the card on a 375 by 667 pixel screen.
- **SC-002**: At 375, 640, 768 and 1280 pixels wide, both calls to action measure at least 44 pixels tall, their heights are equal, they are stacked at 375 and on one row from 640, and the card has zero horizontal overflow.
- **SC-003**: The home page passes the site's automated accessibility check with zero violations in both light and dark mode, including colour contrast for both calls to action.
- **SC-004**: Removing the second call to action from the page file and rebuilding gives a card with exactly one call to action and a successful build; each invalid second call to action (empty label, bad link, extra field) fails the build.
- **SC-005**: The home page ships no more client-side script than before, and the performance budget check passes unchanged.

## Assumptions

- **Home content file**: the issue's path `src/content/pages/index.mdx` is correct; that file holds the `intro` settings including the current call to action. The schema is in `src/content/schemas/page.ts` and the card in `src/components/page/HomeIntro.astro`, as the issue says.
- **Field name**: the issue's suggested name `secondaryCta` (beside the existing `cta`) is taken as the working name; the plan may confirm it.
- **Destination and label**: the issue allows `/writing/` or `/projects/`. Chosen: the writing page, labelled "Read my writing", because the writing list is the broader entry point and the projects page is already reachable from the Start here paths and the header. Don can change either in review by editing the page file. (Answered without the user; flag for clarify.)
- **Theme colour names**: the issue's suggested colours all exist in the site's theme (rust 200/300/600/700, dusk 100/300/600/700/800/900, mist 200). The issue's primary style omits the existing dark-mode hover (lighter rust); the current hover is kept. The issue's class strings are a starting point, not a requirement; whatever colours are used must pass FR-009, checked by the accessibility tests.
- **44-pixel target**: the current main button (small text with small vertical padding) is about 36 pixels tall, so it grows to meet FR-008. This is a deliberate visible change to the existing button and will change the home page's visual baselines.
- **Breakpoint**: "tablet" means 640 pixels, the site's existing small breakpoint, where the card already switches to the photo-beside-text layout.
- **Spec 040 decision superseded**: spec 040 recorded that the introduction's call to action stays the home page's one button. This feature deliberately adds a second button to the card; the Now section's inline "open to" link stays an ordinary text link.
- **Scope**: only the home introduction card changes. Other pages' calls to action, the Start here section, the header and the contact page are out of scope. Any analytics to measure engagement or bounce rate is out of scope (the site has no tracking beyond optional privacy-focused analytics).
- **Constitution**: no new endpoint, data, service, cost or dependency; Principles V (static, no script), VI (content in files, invalid content fails the build) and X (WCAG 2.2 AA, performance budget) apply directly.
