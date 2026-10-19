# Feature Specification: Full-card click and hover feedback on post cards

**Feature Branch**: `049-post-card-full-click`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Full-card click affordance and hover elevation on post cards" (GitHub issue #184). On a post card only the title text is a link; clicking the image, summary or empty card area does nothing, and the card gives no hover feedback.

## Current behaviour

- A post card (`PostCard`, used on the writing landing page, the all-posts and topic listings, series pages, related posts and the home page's recent writing) is a list item holding one `article`. The title is the only link to the post. The card also holds topic pills and, for a series post, a series marker; each is its own link to a topic or series page.
- The lead story (`LeadStory`, the large story at the top of the writing landing page) has the same structure and the same limitation.
- Neither has any hover change except the title's underline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a post by clicking anywhere on its card (Priority: P1)

A reader scanning a list of posts clicks or taps the image, the summary or the empty space on a card and lands on that post, the same as clicking the title.

**Why this priority**: This is the reported problem. Readers expect the whole card to open the post, especially on touch screens where the title is a small target.

**Independent Test**: On a listing page, click the image, the summary, the date line and an empty part of the card; each opens the post. Delivers value with no hover change at all.

**Acceptance Scenarios**:

1. **Given** a post card with a feature image, **When** the reader clicks the image, **Then** the post opens.
2. **Given** any post card, **When** the reader clicks the summary, the date line or an empty part of the card, **Then** the post opens.
3. **Given** a text-only post card (no image), **When** the reader clicks anywhere outside a topic pill, **Then** the post opens.
4. **Given** the lead story on the writing landing page, **When** the reader clicks its image, summary or empty area, **Then** the post opens.

---

### User Story 2 - Topic and series links on a card still work on their own (Priority: P1)

A reader clicks a topic pill or series marker on a card and goes to that topic or series page, not to the post.

**Why this priority**: Making the whole card a target must not break the links already inside it.

**Independent Test**: Click a topic pill and a series marker on a card; each opens its own page.

**Acceptance Scenarios**:

1. **Given** a post card with topic pills, **When** the reader clicks a pill, **Then** the topic page opens and the post does not.
2. **Given** a series post card, **When** the reader clicks the series marker, **Then** the series page opens and the post does not.

---

### User Story 3 - Keyboard and screen reader users get one clear link per card (Priority: P1)

A keyboard user tabs through a listing. Each card is one stop for the post (on the title), followed by its topic and series links. A screen reader announces the post link by its title only, once.

**Why this priority**: Principle X requires WCAG 2.2 AA on every page; the change must not add duplicate or unnamed links.

**Independent Test**: Tab through a listing and check the focus order and focus indicator; inspect the accessibility tree for each card.

**Acceptance Scenarios**:

1. **Given** a listing page, **When** the keyboard user tabs to a card, **Then** focus lands on the post link with a clearly visible focus indicator, and Enter opens the post.
2. **Given** a card, **When** its links are listed by assistive technology, **Then** there is exactly one link to the post, named by the post title, plus one link per topic pill or series marker.

---

### User Story 4 - Subtle hover feedback (Priority: P2)

A mouse user moving over a card sees it lift slightly, with a soft shadow, and its image enlarge very slightly, so it is clear the card is clickable. A reader who has asked their system to reduce motion sees no movement.

**Why this priority**: Helpful but secondary to the click target itself.

**Independent Test**: Hover a card with motion allowed and with reduced motion requested; compare.

**Acceptance Scenarios**:

1. **Given** motion is allowed, **When** the pointer moves over a card, **Then** the card rises slightly, gains a shadow and its image enlarges slightly within the card's edges, with a short transition; moving away reverses it.
2. **Given** the reader prefers reduced motion, **When** the pointer moves over a card, **Then** nothing moves or scales and there is no animated transition.

---

### Edge Cases

- A card with no feature image: the whole card is still a target and lifts on hover; there is no image to enlarge.
- The image's slight enlargement stays inside the card's rounded corners and never overlaps neighbouring cards or text.
- The lifted card and its shadow do not cover or get clipped by neighbouring cards in a grid at any breakpoint, and cause no layout shift.
- Featured and draft labels are plain text, not links; clicking them opens the post.
- Selecting summary text with a mouse drag may now start a link drag instead; this is accepted as the normal cost of a whole-card link.
- Forced-colours (high contrast) mode: the focus indicator stays visible, as it is today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicking or tapping any part of a post card or the lead story that is not a topic pill or series marker MUST open that post. This includes the feature image, summary, featured and draft labels, date line and empty card area.
- **FR-002**: Topic pills and series markers inside a card MUST remain separate links that open their own pages and MUST NOT also open the post.
- **FR-003**: Each card MUST keep exactly one link to the post, the existing title link, named by the post title. No second link to the post, no wrapping link around the whole card, and no change to the card's list, article and heading structure.
- **FR-004**: When the post link has keyboard focus, a focus indicator MUST be visible and meet WCAG 2.2 AA (2.4.7 Focus Visible and 2.4.11 Focus Not Obscured), including in forced-colours mode.
- **FR-005**: On pointer hover, a post card and the lead story MUST lift slightly with a soft shadow and their feature image MUST enlarge slightly within the card's edges, with a short transition. When the reader prefers reduced motion, there MUST be no movement, scaling or animated transition.

### Accessibility

WCAG 2.2 AA (Principle X). The whole card becomes one pointer target for the post, named by the title through the existing title link; the accessible name, link count and focus order do not change. Topic and series links stay reachable and separately named. Focus stays visible. Hover motion respects the reduced-motion preference. The existing automated accessibility checks on each page template keep passing.

### Visual impact

- Static (non-hover, non-focus) appearance of every page is intended to be unchanged, so visual baselines should not need refreshing.
- Pages that render post cards or the lead story and have visual baselines, and so could change if the static look shifts: the writing landing page (fixture lead story, fixture series intro), the topic listing (fixture listing cards), the series page (fixture series banner), the home page (home now and start here) and the post template (fixture post template, which shows related posts).
- If the focus indicator is redrawn around the whole card rather than the title, only focused states change; no baseline captures focus.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every page that shows post cards or the lead story, clicking each of image, summary, date line and empty card area opens the post in 100% of checks.
- **SC-002**: Clicking a topic pill or series marker opens its own page in 100% of checks, never the post.
- **SC-003**: Each card exposes exactly one link to the post, named by its title, and the automated accessibility checks report no new violations.
- **SC-004**: With reduced motion requested, a hovered card's position, size and image scale are identical to its resting state.
- **SC-005**: Existing visual baselines pass without being refreshed.

## Assumptions

- "Post cards" means `PostCard` wherever it is used plus the lead story; both share the same treatment so the writing pages look consistent.
- The lift, shadow and image enlargement are small (a few pixels, a light shadow, about 2% scale) and use the site's existing Tailwind theme; exact values are a plan decision.
- Hover feedback applies to the whole card, not only when the title is hovered. The title's existing underline on hover stays.
- No client-side JavaScript is added (Principle V); the behaviour is CSS only.
- The focus indicator stays on the title link; whether it outlines the title or the whole card is a plan decision, as long as FR-004 holds.

## Out of Scope / Follow-ups

- Project rows on `/projects/` and any other card-like components (start-here paths, Now items, series tiles) are not changed; giving them the same treatment is a separate follow-up.
- No change to card content, image sizes, layout or the topic pill and series marker designs.
