# Feature Specification: Right-size listing card images

**Feature Branch**: `021-card-image-size`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Right-size listing card images so series pages stay well under the page budget. Series listing pages such as the convergence series carry one card image per post, and those images are most of the page's weight: on the convergence page the two card images are about 79 KB of its 122 KB. Every new post in a series adds another card, so the page creeps toward the 150 KB budget that PR #72 set. Serve a smaller card-sized candidate (around 400 pixels wide, at a lower WebP quality) for listing cards so a series can grow without breaking the budget. The budget will stay at 150KB."

This feature implements GitHub issue #73, and the pull request closes it.

## Background

A post card is the small summary of one post (image, title, summary, date and topics) that the
site shows in a grid. Post cards appear on the writing landing page (the "latest" and
"featured" grids), the all-posts listing, each topic page, each series page and the home page's
recent-writing section.

Today a card's image is offered in three sizes, and on a phone-width screen the browser picks
a version about 480 pixels wide even though the card is drawn about 360 pixels wide. The image
is also encoded at the site's general image quality, which suits large images more than small
cards. On the convergence series page, two card images make up about 79 KB of the page's
122 KB. Each new post in a series adds another card, so a series page grows toward the 150 KB
total-transfer budget that feature 018 (self-hosted fonts, PR #72) set.

This feature makes card images card-sized and lighter, so listing pages keep clear headroom
under the unchanged 150 KB budget as series and listings grow.

## Clarifications

### Session 2026-10-04

- Q: Which set of widths should a card image offer? → A: 320, 400 and 640 pixels; the 480 version is dropped.
- Q: Should the card's declared display width on phones be corrected from the full screen width to the card's real width? → A: Yes. The phone value becomes the card's real width (about the screen width minus 2rem of page margins), so every phone up to about 430 pixels wide picks the 400 version; the tablet and desktop values stay as they are.
- Q: How should the lower card quality be chosen? → A: The plan picks one WebP quality value between 60 and 70 by comparing file sizes and appearance on the fixture and convergence images.
- Q: Is SC-002 a hard target or a measurement reported in the PR? → A: A reported measurement: before and after figures for the convergence page go in the PR body. The automated gates are the unchanged 150 KB budget and a fixture-site test that no phone-width card download is wider than about 400 pixels (SC-001).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lighter series and listing pages on a phone (Priority: P1)

A reader on a phone opens a series page (for example the convergence series) or any other page
that lists posts as cards. Each card image downloads as a card-sized, lighter file, so the page
loads less data and still looks the same: the image fills the card at the same shape and is not
visibly blurry.

**Why this priority**: This is the whole point of the issue. Card images are most of a series
page's weight, and every new post adds one.

**Independent Test**: Load a listing page at a phone-width viewport, as the page budget check
does, and record which version of each card image the browser downloads and how many bytes the
page transfers in total.

**Acceptance Scenarios**:

1. **Given** a phone-width screen at normal pixel density, **When** a reader opens a series page,
   **Then** every card image the browser downloads is the card-sized version (about 400 pixels
   wide), not a wider one.
2. **Given** the convergence series page as it is today (two cards with images), **When** it is
   measured by the page budget check, **Then** its total transfer is clearly lower than today's
   122 KB (see SC-002) and within the unchanged 150 KB budget.
3. **Given** any page that shows post cards (writing landing, all posts, topic, series, home),
   **When** it is opened at phone width, **Then** its card images are the card-sized, lighter
   version.

---

### User Story 2 - Cards still look right on larger and sharper screens (Priority: P2)

A reader on a tablet, laptop or high-density phone screen sees card images that are sharp at
the size the card is drawn, with the same crop and shape as before.

**Why this priority**: Saving bytes must not make the cards look worse where screens are larger
or sharper.

**Independent Test**: Inspect the image versions a card offers and confirm that a screen wider
or denser than a normal phone can still pick a version at least as wide as it gets today.

**Acceptance Scenarios**:

1. **Given** a card on a high-density or wider screen, **When** the browser chooses an image
   version, **Then** it can still choose one at least as wide as the widest version cards offer
   today.
2. **Given** any card with an image, **When** it is shown, **Then** the image keeps the same
   shape (16:9), crop, alternative text, width and height attributes, and lazy loading as today.

---

### User Story 3 - A series can keep growing within budget (Priority: P3)

Don adds posts to a series over time. A full page of cards (the most a listing page shows
before it paginates) stays within the 150 KB budget, so publishing another post never breaks
the release gate by itself.

**Why this priority**: This is the long-term outcome the issue asks for; it follows from Story 1.

**Independent Test**: The existing budget check on the fixture site's all-posts page (12 cards
with images) passes with clear headroom.

**Acceptance Scenarios**:

1. **Given** a listing page with a full page of cards that all have images, **When** it is
   measured by the page budget check, **Then** it stays within the 150 KB budget.

---

### Edge Cases

- A post with no feature image is a text-only card: it gets no image at all, as today.
- A source image narrower than the card-sized version: the site never enlarges it beyond its
  own width, as today.
- The lead story on the writing landing page is not a card and is usually the page's largest
  visible element; its image is unchanged.
- A post's own page (its hero image) and the projects index are not card listings; their images
  are unchanged by this feature.
- Dark mode, forced colours and JavaScript turned off: card images behave as they do today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every post card with an image MUST offer exactly three width versions: 320, 400
  and 640 pixels (the 400 version is the card-sized one; today's 480 version is dropped).
- **FR-002**: On a phone-width screen at normal pixel density (the viewport the page budget
  check uses), the browser MUST choose the card-sized version for every card image, on every
  page that shows post cards. To make this hold on real phones too, the card's declared phone
  display width MUST be the card's real width (about the screen width minus 2rem of page
  margins) instead of the full screen width, so every phone up to about 430 pixels wide at
  normal density picks the 400 version. The tablet and desktop display widths stay as they are.
- **FR-003**: Card images MUST be encoded at a lower quality than the site's general image
  quality, chosen so the image shows no visible artefacts at the size the card is drawn. The
  plan picks one WebP quality value between 60 and 70 by comparing file sizes and appearance on
  the fixture and convergence images.
- **FR-004**: Cards MUST still offer versions wide enough for wider and high-density screens; the
  widest version a card offers MUST NOT be narrower than the widest it offers today (640
  pixels), and the narrowest stays at 320 pixels so wide 1x screens download no more than today.
- **FR-005**: Card images MUST keep their current shape, crop, alternative text, intrinsic width
  and height, lazy loading and image format.
- **FR-006**: The lower card quality MUST apply only to post card images. The lead story, post
  hero images, project images and the home page photo MUST keep their current versions and
  quality.
- **FR-007**: The total-transfer page budget MUST stay at 150 KB, and every page template MUST
  still pass it.
- **FR-008**: Tests MUST be written first and seen to fail (Constitution Principle I). Each test
  names its primary layer, following `docs/testing.md` "Where a test goes": the versions and
  quality a card offers are observable without a browser; which version a phone-width browser
  downloads and the page's transferred bytes are observable only in a browser. Tests use fixture
  content, never a named real post.

### Key Entities

- **Post card image**: the feature image of a post as shown in a card. Attributes: the set of
  width versions offered, the encoding quality, alternative text, shape.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every page template that shows post cards, at the budget check's phone-width
  viewport, no downloaded card image is wider than about 400 pixels.
- **SC-002**: The combined weight of the card images on the convergence series page falls by at
  least 40% from today's 79 KB (to about 47 KB or less), and the page's total transfer falls
  below 100 KB. This is a reported measurement, not a hard target or an automated check: the
  before and after figures go in the PR body. The automated gates are the unchanged 150 KB
  budget (SC-003) and a fixture-site test of SC-001.
- **SC-003**: Every page template, and the fixture site's 12-card all-posts page, passes the
  unchanged 150 KB total-transfer budget along with the existing LCP, layout-shift, long-task and
  JavaScript limits.
- **SC-004**: Card images show no visible blurring or artefacts at their drawn size, judged on
  the preview deployment and by the listing-cards visual check.

## Assumptions

- "Listing cards" means post cards wherever they appear: writing landing (latest and featured
  grids), all posts, topic pages, series pages and the home page's recent writing. They are one
  card design, so one change covers them all.
- The phone-width viewport and network settings are those the existing page budget check uses
  (390 pixels wide, normal pixel density).
- The site's images are already WebP; the card stays WebP and only its quality drops, to a
  value between 60 and 70 that the plan picks (FR-003).
- The predicted visual change: the fixture listing-cards visual subject shows lighter, card-sized
  images, so its baselines are refreshed on both platforms as part of this feature. That diff is
  predicted here, so it is not a regression. Other visual subjects should not change; any other
  diff is a regression to fix.
- This is not a major change under Principle III: it adds no dependency, changes no layout,
  design system or visual identity, and does not raise running costs. The card looks the same; it
  only downloads a smaller file. Auto-merge applies unless the clarify phase decides otherwise.
- The convergence figures (79 KB of 122 KB) are the issue's measurements on today's build and
  are the baseline for SC-002.

## Out of Scope / Follow-up

- Right-sizing project images on the projects index rows and story pages, the lead story image
  and post hero images. Each could be its own follow-up if those pages approach the budget.
- Changing the 150 KB budget or any other budget limit.
- Changing how many cards a listing page shows before it paginates.
- Changing the source images in the content folders.
