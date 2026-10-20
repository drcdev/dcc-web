# Feature Specification: Second call to action in the home introduction card

**Feature Branch**: `051-home-dual-cta`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Introduce dual call-to-action to homepage hero card" (GitHub issue #182). The home page's introduction card shows one button, "See how I can help", which goes to the contact page. For a first-time visitor, a contact form straight away is a big ask. The card gains an optional second, quieter button that leads to the writing (or projects) so a visitor has a lower-commitment next step. The main button stays the visually stronger one. On phones the two buttons stack; from tablet width up they sit side by side. Both buttons are at least 44 pixels tall and meet WCAG 2.2 AA contrast in light and dark modes.

## Clarifications

### Session 2026-10-19

- Q: Where should the second, quieter button go, and what should it say? → A: "Read my writing", linking to the writing page (/writing/).
- Q: With two buttons, where should the GitHub and LinkedIn icons go from 640 px up? → A: On their own row above the buttons, at every width.
- Q: On phones (below 640 px), how wide should the stacked buttons be? → A: Both full width of the card's text column.
- Q: What should the second button be called in the home page file? → A: A separate `secondaryCta: { label, href }` field beside the existing `cta` (orchestrator's decision, matching the issue; not put to the user).
- Q: What should happen to the outlined second button when it is hovered, especially in dark mode? → A: A faint background tint (light: mist-200; dark: dusk-700); border and text colours unchanged.
- Q: From 640 px up, when the two buttons sit side by side, should they be the same width or each as wide as its own label? → A: Each as wide as its own label (so they differ in width), left-aligned with the text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A first-time visitor picks a low-commitment next step (Priority: P1)

A visitor lands on the home page and reads the introduction card. They are not ready to get in touch, but they want to see more. Beside the main "See how I can help" button they see a second, visually quieter button that takes them to Don's writing. They choose it and arrive on the writing page.

**Why this priority**: This is the whole point of the change: a second path for visitors who would otherwise leave.

**Independent Test**: Build the site with a second call to action in the home page file and open the home page: the card shows two links, the main one to the contact page and the second to the writing page, and following the second lands on the writing page.

**Acceptance Scenarios**:

1. **Given** the home page file sets a main call to action ("See how I can help", contact page) and a second one ("Read my writing", writing page), **When** a visitor opens the home page, **Then** the introduction card shows both, the main one first in reading order and visually stronger (filled), the second one outlined.
2. **Given** the card shows both calls to action, **When** the visitor activates the second one by mouse, touch or keyboard, **Then** they arrive on the writing page.
3. **Given** JavaScript is turned off, **When** the visitor opens the home page, **Then** both calls to action are shown and work.
4. **Given** a keyboard user tabs through the card, **When** focus reaches each call to action, **Then** each shows a visible focus indicator, and focus moves GitHub, LinkedIn, main call to action, second call to action.

---

### User Story 2 - The buttons fit any screen and stay readable (Priority: P1)

The two buttons look like a balanced pair on any screen. On a phone they are stacked, one above the other, each easy to tap. From tablet width (640 pixels) up they sit side by side on one row. In both light and dark mode their text and outlines are easy to read.

**Why this priority**: A second button that crowds, overflows or fails contrast would make the card worse than it is now. It ships with User Story 1, not after it.

**Independent Test**: Open the home page at 375, 640, 768 and 1280 pixels wide in light and dark mode: the buttons stack at 375, sit on one row from 640, are the same height as each other and at least 44 pixels tall, nothing overflows the card, and the accessibility check passes.

**Acceptance Scenarios**:

1. **Given** a viewport 375 pixels wide, **When** the home page loads, **Then** the two calls to action are stacked vertically, main one on top, each the full width of the card's text column, and neither overflows the card.
2. **Given** a viewport 640 pixels wide or wider, **When** the home page loads, **Then** the two calls to action sit side by side on one row, main one first, each as wide as its own label and left-aligned with the text, with the GitHub and LinkedIn links on their own row above them, and the card has no horizontal overflow.
3. **Given** any viewport, **When** the calls to action are measured, **Then** both have the same rendered height, and that height (the touch target) is at least 44 pixels; each is at least 44 pixels wide.
4. **Given** light mode and dark mode, **When** the home page is checked for contrast, **Then** each call to action's text meets 4.5:1 against its own background, the second call to action's outline meets 3:1 against the card, and the same holds for their hover states.

---

### User Story 3 - Don controls the second call to action from the page file (Priority: P2)

Don sets, changes or removes the second call to action by editing the home page file only: a label and a link, just like the main call to action. If he leaves it out, the card shows the main call to action alone, in the new layout (social links on their own row, 44-pixel button). If he makes a mistake (an empty label, a bad link, or an unknown field), the build fails with a clear error.

**Why this priority**: Content as files (Principle VI) means the copy and destination live in the page file, not in code. It supports User Story 1 but is not visible to visitors on its own.

**Independent Test**: Validate home page front matter with and without a second call to action, and with invalid ones, against the page schema; build the site with the second call to action removed and confirm the card renders one button.

**Acceptance Scenarios**:

1. **Given** the home page file has no second call to action, **When** the site is built, **Then** the build succeeds and the card shows only the main call to action, with no empty slot or stray spacing.
2. **Given** the second call to action has a label and a link to a site page, **When** the site is built, **Then** the build succeeds and the card shows it.
3. **Given** the second call to action has an empty or whitespace-only label, a missing or invalid link, an extra field, a value of the wrong type, is an empty object or is null, **When** the site is built, **Then** the build fails with an error naming the problem field (FR-016).
4. **Given** the main call to action is missing, **When** the site is built, **Then** the build still fails as it does today (the second call to action never replaces the main one).

---

### Edge Cases

- **Second call to action alone**: a page file with a second call to action but no main one is invalid, because the main one stays required.
- **Long labels**: the schema sets no label length limit, and the layout does not rely on one. One behaviour applies: a label too long for its space wraps onto more lines inside its own button. The buttons keep their layout (stacked below 640 pixels, one row from 640) and stay equal in height (the shorter one grows to match); nothing is clipped and the card never scrolls sideways. The launch labels fit on one line at every width.
- **Social links row**: the card's GitHub and LinkedIn icon links currently share a row with the call to action. They move to their own row directly above the calls to action at every width (also when only the main call to action is set), so every link stays visible and tappable at 640 pixels, where the card's text column is narrowest. The row stays a list of two icon links, each named by visually hidden text ("GitHub", "LinkedIn"), as today; it needs no group label.
- **Same destination twice**: nothing stops Don pointing both calls to action at the same page; the schema does not forbid it (no visitor harm, just redundancy). Link purpose still comes from each label (FR-006), so two different labels to one page are acceptable; the labels must differ from each other, which Don checks in review rather than the schema.
- **Link to a hidden or draft page**: the second call to action uses the same link rules as the main one. Pointing it at a page that is hidden or draft would give a 404 on production, as with any other link. This is accepted, not checked: the build adds no check that the target page exists (the main call to action has none either), and Don confirms the link on the preview. The launch content points at the writing page, which always exists.
- **Hover on the second call to action**: hover adds only a faint background tint (light mode mist-200, dark mode dusk-700); the border and text colours stay as at rest, and text contrast never drops below 4.5:1.
- **Reduced motion**: the only motion either button has is the colour transition (background, border and text colour) between rest and hover. For both buttons it runs only when the visitor allows motion, as the existing button does; with reduced motion the colours change instantly.
- **Forced colours (Windows high contrast)**: both buttons keep a visible boundary, drawn as a real border (the main button's transparent border included), so the system colours make the outline visible; the focus indicator uses the system colour, as elsewhere on the site.
- **Text resize and spacing**: at 200 percent text size, or with increased line, letter and word spacing (WCAG 1.4.4, 1.4.12), button labels wrap inside the button and the button grows taller; no label is clipped or overlaps another link. Heights are minimums, never fixed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page's introduction settings MUST accept an optional second call to action, the field `secondaryCta` beside the existing `cta`, with exactly two fields, a label and a link, validated by the same rules as the main call to action: the label is text that is not empty after trimming spaces; the link is text that starts with a single `/` (a site page) or with `https://` (protocol-relative `//host` is rejected); no other fields. "No second call to action" means the field is absent; an empty object, `null` or any other type is invalid. The rules belong to the introduction settings, so they apply on any page that sets them; only the home page does today.
- **FR-002**: The main call to action MUST stay required, and its rules MUST NOT change.
- **FR-003**: The card's links MUST be in this reading and focus order: GitHub, LinkedIn, main call to action, then the second call to action when set. The visual order MUST match the reading order at every width (social row above, main button before the second: on top when stacked, to the left in the row).
- **FR-004**: When no second call to action is set, the card MUST show only the main call to action, with no empty element or stray spacing for the missing one. The one-button card follows the same layout rules as the two-button card (FR-007, FR-008, FR-011): social row above, the button full width of the text column below 640 pixels and as wide as its label, left-aligned, from 640 pixels, at least 44 pixels tall. It meets the same accessibility requirements (FR-008 to FR-011). Apart from these layout changes, the card is unchanged.
- **FR-005**: The main call to action MUST look filled (solid accent background with contrasting text) and the second MUST look outlined (border, no fill at rest), so the main one is clearly the stronger choice in both light and dark mode. On hover the second call to action gains a faint background tint (light mode mist-200, dark mode dusk-700) with its border and text colours unchanged; the main call to action keeps its existing hover.
- **FR-006**: Both calls to action MUST be links (they navigate to a page), each with an accessible name exactly equal to its visible label (no separate hidden name), and MUST work with JavaScript turned off. A screen reader user tells them apart by their labels.
- **FR-007**: Below 640 pixels the two calls to action MUST be stacked vertically, each the full width of the card's text column; from 640 pixels up they MUST sit side by side on one row, each only as wide as its own label (so their widths differ), left-aligned with the card's text. The gap between the two buttons is 12 pixels and the gap between the social row and the buttons is 16 pixels, in both layouts, so no two targets touch.
- **FR-008**: Both calls to action MUST have the same rendered height, at least 44 by 44 pixels of target area, at every viewport width. The target area is the link's rendered box, including its padding and border. 44 pixels is deliberately stricter than the 24-pixel WCAG 2.2 AA minimum (2.5.8) and is the value to test. This applies to the main call to action too, which is currently shorter than 44 pixels. The GitHub and LinkedIn icon links keep their current target size (32 pixels), which meets the 24-pixel minimum, and keep their spacing.
- **FR-009**: In light and dark mode, at rest, on hover and on keyboard focus, each call to action's text MUST have at least 4.5:1 contrast with its background, and the second call to action's border MUST have at least 3:1 contrast with the card background (white in light mode, dusk-800 in dark mode) (WCAG 2.2 AA). This includes the main call to action's existing hover colours in both modes. Focus adds an outline only and changes no button colour, so the rest-state values hold on focus.
- **FR-010**: Each call to action MUST use the site's existing keyboard focus style unchanged: a 2-pixel solid outline offset 2 pixels outside the button, accent-500 in light mode and accent-400 in dark mode, the system colour in forced-colours mode. Because of the offset the outline sits on the card background, not on the button fill, and it MUST have at least 3:1 contrast with the card in both modes (WCAG 1.4.11; about 3.2:1 light and 5.7:1 dark). The outline MUST NOT be clipped by the card's edges or covered by the neighbouring button or social links.
- **FR-011**: The card MUST NOT overflow horizontally at any viewport width from 320 pixels up (320 pixels is also a 1280-pixel window at 400 percent zoom, WCAG 1.4.10). The GitHub and LinkedIn links MUST sit on their own row directly above the calls to action at every width, and stay visible and tappable: at 640 pixels, and at every other tested width, each of the four links lies fully inside the card, meets its target size (FR-008) and does not overlap another link.
- **FR-012**: The colours used MUST come from the site's existing theme colours; no new colours are added. This is checkable in the component: only theme colour classes, no arbitrary colour values, and no change to the theme's colour definitions. At rest the tokens are: main button rust-600 with white text (light) and rust-300 with dusk-900 text (dark), unchanged; second button dusk-800 text with a dusk-500 border (light) and mist-200 text with a dusk-400 border (dark). Hover tokens are in FR-005 and the existing main button.
- **FR-013**: The launch content MUST set the second call to action to the label "Read my writing" (exactly this text, sentence case) linking to `/writing/` (with the trailing slash). The main call to action keeps its current label and link.
- **FR-014**: The change MUST add no client-side script and MUST keep the home page within the site's existing CI performance budget (largest contentful paint, layout shift, long tasks, JavaScript bytes and total bytes transferred on simulated mobile), with the budget values unchanged.
- **FR-015**: Copy added by this feature MUST NOT include Don's job title, and MUST be plain language with no hype: each label is a short verb phrase that says where the link goes, with no exclamation mark, superlative or urgency wording.
- **FR-016**: An invalid second call to action MUST fail the build (Principle VI, invalid content fails the build). The error MUST name the file and the path of each problem field (for example `intro.secondaryCta.href`) and the rule it broke; every problem field in the file is reported in the same failing build, not only the first.

### Key Entities

- **Home introduction**: the settings for the home page's introduction card (photo, name, tagline, bio, main call to action). Gains one optional item, the second call to action.
- **Call to action**: a label (the visible button text) and a link (where it goes). The main one is required; the second is optional and has the same shape.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the built home page, a visitor can reach the writing page from the introduction card in one tap or click, without scrolling past the card on a 375 by 667 pixel screen.
- **SC-002**: At 375, 640, 768 and 1280 pixels wide, both calls to action measure at least 44 pixels tall, their heights are equal, they are stacked and full width at 375 and on one row from 640, the social links sit on their own row above them, and the card has zero horizontal overflow.
- **SC-003**: The home page passes the site's automated accessibility check with zero violations at phone (390 pixels) and desktop (1280 pixels) widths in both light and dark mode, including text contrast for both calls to action at rest. The automated check does not cover hover, focus or border contrast, so those are measured separately: in both modes, hover text is at least 4.5:1, the second button's border at least 3:1 and the focus outline at least 3:1 against the card.
- **SC-004**: Removing the second call to action from the page file and rebuilding gives a card with exactly one call to action, laid out as FR-004 says, and a successful build; each invalid second call to action (FR-001, User Story 3 scenario 3) fails the build with an error naming the field.
- **SC-005**: The home page ships no more client-side script than before (zero JavaScript bytes added), and the CI performance budget check (FR-014) passes with its values unchanged.

## Assumptions

- **Home content file**: the issue's path `src/content/pages/index.mdx` is correct; that file holds the `intro` settings including the current call to action. The schema is in `src/content/schemas/page.ts` and the card in `src/components/page/HomeIntro.astro`, as the issue says.
- **Field name**: `secondaryCta` beside the existing `cta`, as the issue suggests (confirmed in Clarifications).
- **Destination and label**: the issue allows `/writing/` or `/projects/`. Chosen: the writing page, labelled "Read my writing", because the writing list is the broader entry point and the projects page is already reachable from the Start here paths and the header. Don can change either in review by editing the page file. (Confirmed in Clarifications.)
- **Theme colour names**: the issue's suggested colours all exist in the site's theme (rust 200/300/600/700, dusk 100/300/600/700/800/900, mist 200). The issue's primary style omits the existing dark-mode hover (lighter rust); the current hover is kept. The second call to action's hover tint is mist-200 (light) and dusk-700 (dark), per Clarifications. The issue's class strings are a starting point, not a requirement; whatever colours are used must pass FR-009, checked by the accessibility tests.
- **44-pixel target**: the current main button (small text with small vertical padding) is about 36 pixels tall, so it grows to meet FR-008. This is a deliberate visible change to the existing button.
- **Expected test and baseline changes**: the home page's visual baselines (the "home now and start here" shots, phone and desktop, light and dark, macOS and Linux: 8 images) change. Tests that assert the single-button card change with it: the HomeIntro component test (link order and source order) and the home introduction card checks in the pages end-to-end test (its card link count goes from 3 to 4).
- **Breakpoint**: "tablet" means 640 pixels, the site's existing small breakpoint, where the card already switches to the photo-beside-text layout.
- **Spec 040 decision superseded**: spec 040 recorded that the introduction's call to action stays the home page's one button. This feature deliberately adds a second button to the card; the Now section's inline "open to" link stays an ordinary text link. Spec 040 FR-016 carries a one-line note pointing here, so a reader of 040 finds the change.
- **Scope**: only the home introduction card changes. Other pages' calls to action, the Start here section, the header and the contact page are out of scope. The contact form and the contact API are untouched: this feature collects no data and adds no endpoint. Any analytics to measure engagement or bounce rate is out of scope (the site has no tracking beyond optional privacy-focused analytics).
- **Constitution**: no new endpoint, data, service, cost or dependency; Principles V (static, no script), VI (content in files, invalid content fails the build) and X (WCAG 2.2 AA, performance budget) apply directly.
