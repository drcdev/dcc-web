# Feature Specification: Right-size listing card images

**Feature Branch**: `021-card-image-size`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Right-size listing card images so series pages stay well under the page budget. Series listing pages such as the convergence series carry one card image per post, and those images are most of the page's weight: on the convergence page the two card images are about 79 KB of its 122 KB. Every new post in a series adds another card, so the page creeps toward the 150 KB budget that PR #72 set. Serve a smaller card-sized candidate (around 400 pixels wide, at a lower WebP quality) for listing cards so a series can grow without breaking the budget. The budget will stay at 150KB."

This feature implements GitHub issue #73, and the pull request closes it.

## Background

A post card is the small summary of one post (image, title, summary, date and topics) that the
site shows in a grid. Post cards appear on the writing landing page (the "latest" and
"featured" grids), the all-posts listing, each topic page, each series page, the home page's
recent-writing section and the "Related posts" section at the end of a post.

Today a card's image is offered in three sizes, and on a phone-width screen the browser picks
a version about 480 pixels wide even though the card is drawn about 360 pixels wide. The image
is also encoded at the site's general image quality, which suits large images more than small
cards. On the convergence series page, two card images make up about 79 KB of the page's
122 KB. Each new post in a series adds another card, so a series page grows toward the 150 KB
total-transfer budget that feature 018 (self-hosted fonts, PR #72) set.

This feature makes card images card-sized and lighter, so listing pages keep clear headroom
under the unchanged 150 KB budget as series and listings grow ("clear headroom" is quantified
under Assumptions, "Expected page weight").

Nothing needed to understand a card depends on its image: the title, summary, date and topics
are text and carry the card's meaning; the image is a visual summary with alternative text.

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
with images) passes with clear headroom, meaning at least 40 KB under the 150 KB budget (see
Assumptions, "Expected page weight").

**Acceptance Scenarios**:

1. **Given** a listing page with a full page of cards that all have images, **When** it is
   measured by the page budget check, **Then** it stays within the 150 KB budget.

---

### Edge Cases

- A post with no feature image is a text-only card: it gets no image at all and no empty or
  placeholder image box, as today.
- A card image that fails to load: the browser shows its alternative text in the card's image
  box, as today, and the card's title, summary, date and topics still carry its meaning. The
  alternative text is the same whichever width version was requested.
- A source image narrower than a listed version: the site never enlarges it. A source narrower
  than 640 pixels offers the listed widths below its own width plus its own width (for example
  320, 400 and 480 for a 480-pixel source); a source narrower than 400 pixels offers 320 and its
  own width. Phones then pick the widest offered version no wider than 400 pixels.
- A feature image with text or fine detail in it: any text in a card image must not be needed
  to understand the post (the card's own text and the image's alternative text carry it), so a
  lower quality cannot hide required information. Quality 65 was picked with a margin for
  detailed photos (research.md R3); if a later image shows artefacts at card size under the
  SC-004 check, retuning the card quality is a follow-up, not a per-image override.
- At 1x pixel density, a browser window whose card slot is between 401 and 480 pixels wide (a
  window 433 to 512 pixels wide, or 890 to 1023 pixels wide where cards take 45% of the width)
  may pick the 640 version where today it picks the dropped 480 one, which can be up to about a
  quarter more bytes for that card. This is the accepted cost of dropping the 480 version
  (Clarifications). No common phone or tablet renders at 1x in those widths, the budget
  viewport is not in them, and Chromium's selection usually picks 400 there anyway.
- The lead story on the writing landing page is not a card and is usually the page's largest
  visible element; its image is unchanged.
- A post's own hero image and the projects index are not cards; their images are unchanged by
  this feature. The "Related posts" cards at the end of a post are post cards and change like
  any other card.
- Dark mode and forced colours: the same image file is drawn in the same 16:9 box with no
  filter or colour change, as today; the card's text and borders follow the existing theme
  rules.
- JavaScript turned off: version choice uses only the image's own HTML attributes (the
  offered widths and declared display widths), so it works the same without JavaScript.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every post card with an image MUST offer exactly three width versions: 320, 400
  and 640 pixels (the 400 version is the card-sized one; today's 480 version is dropped).
- **FR-002**: On a phone-width screen at normal pixel density (the viewport the page budget
  check uses), the browser MUST choose the card-sized version for every card image, on every
  page that shows post cards. To make this hold on real phones too, the card's declared phone
  display width MUST be the card's real width (`calc(100vw - 2rem)`: the screen width minus
  2rem of page margins, with the root font at 16 pixels) instead of the full screen width, so every screen
  up to 432 CSS pixels wide at normal density (card slot at most 400 pixels) picks the 400
  version or a narrower one. The tablet and desktop display widths stay as they are. This
  changes only which file the browser picks; the card's drawn size, shape and layout are
  unchanged.
- **FR-003**: Card images MUST be encoded at a lower quality than the site's general image
  quality, chosen so the image shows no visible artefacts at the size the card is drawn. "No
  visible artefacts" means: in a side-by-side comparison of the candidate quality against
  today's encoding, at the card's drawn size at 1x and 2x, on the fixture images and the two
  convergence images, no banding, blocking, ringing or blur is visible that is absent from
  today's encoding. The plan picks one WebP quality value between 60 and 70 by that comparison
  plus the encoded file sizes at each quality, and records the value, the byte table and the
  comparison result in research.md so the choice can be repeated. (Done in the plan phase:
  quality 65, research.md R3.)
- **FR-004**: Cards MUST still offer versions wide enough for wider and high-density screens; the
  widest version a card offers MUST NOT be narrower than the widest it offers today (640
  pixels), and the narrowest stays at 320 pixels so wide 1x screens download no more than today.
  Expected selection: a phone at 2x or 3x density picks the 640 version (its card slot needs
  more than 640 device pixels), the same width as today at the lower quality, so it downloads
  less than today; a desktop 1024 pixels or wider at 1x draws the card at 320 pixels and picks
  the 320 version, as today; a tablet at 1x picks the narrowest version covering 45% of its
  width.
- **FR-005**: Card images MUST keep their current shape, crop, alternative text, intrinsic width
  and height, lazy loading and image format (WebP), on every width version (320, 400 and 640).
  The alternative text is the post's feature-image text and is the same for every width version;
  neither the version picked nor the lower quality changes it. The width and height attributes
  stay the source image's own dimensions, as today, whichever version the browser picks, and
  the image keeps its 16:9 box, so the card's space is reserved before any version loads and
  the changed version set cannot cause layout shift (SC-003's layout-shift limit). Lazy loading
  changes only when the file downloads: the image stays in the same place in the card, is not
  focusable, and does not change reading or focus order.
- **FR-006**: The lower card quality MUST apply only to post card images. The lead story, post
  hero images, project images and the home page photo MUST keep their current versions and
  quality.
- **FR-007**: The total-transfer page budget MUST stay at 150 KB, and every page template MUST
  still pass it. No page may become heavier than today at the budget check's viewport: pages
  with cards get lighter, and pages without card images (including the lead story and post
  hero images) keep the same image bytes. Apart from the 1x edge case above, the same holds on
  other screens, because the version picked is no wider than today's and is encoded at a lower
  quality (flat-colour fixture images may vary by a few bytes either way).
- **FR-008**: Tests MUST be written first and seen to fail (Constitution Principle I). Each test
  names its primary layer, following `docs/testing.md` "Where a test goes": the versions and
  quality a card offers are observable without a browser; which version a phone-width browser
  downloads and the page's transferred bytes are observable only in a browser. Automated tests
  use fixture content, never a named real post. The convergence page appears only in SC-002,
  which is a manual measurement of the real site reported in the PR body, not an automated
  test, so it does not conflict with this rule.

### Key Entities

- **Post card image**: the feature image of a post as shown in a card. Attributes: the set of
  width versions offered, the encoding quality, alternative text, shape.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every page that shows post cards (the writing landing's latest and featured
  grids, all posts, a topic page, a series page and the home page's recent writing, checked on
  the fixture site), at the budget check's phone-width viewport (390 pixels, 1x), no downloaded
  card image has a width descriptor above 400w. Pass line: the chosen version is 400w or
  narrower for every card image on each page, and each page has at least one image card.
- **SC-002**: The combined weight of the card images on the convergence series page falls by at
  least 40% from today's 79 KB (to about 47 KB or less), and the page's total transfer falls
  below 100 KB. This is a reported measurement, not a hard target or an automated check: the
  before and after figures go in the PR body. The automated gates are the unchanged 150 KB
  budget (SC-003) and a fixture-site test of SC-001. Both figures are measured the same way:
  the page budget check's total-transfer figure for the convergence page (compressed bytes
  including headers, under the conditions in Assumptions) and the card images' share of it,
  with the card image file sizes from the build as a cross-check; the before figures are
  research.md R4's (78,604 of 121,654 bytes). If the reported after figures miss either
  target, the PR still reports them and the miss is recorded as a follow-up issue, not rework
  in this feature, provided the 150 KB budget (SC-003) and SC-001 hold.
- **SC-003**: Every page template, and the fixture site's 12-card all-posts page, passes the
  unchanged 150 KB total-transfer budget along with the existing limits: largest contentful
  paint at most 2.5 s, cumulative layout shift below 0.1, long tasks at most 200 ms in total
  and at most 10 KB of JavaScript. The automated accessibility check (WCAG 2.2 AA) keeps
  passing on every page template, including every page that shows post cards.
- **SC-004**: Card images show no visible blurring or artefacts at their drawn size, as defined
  in FR-003: the plan's side-by-side check (research.md R3) found none at the chosen quality,
  the listing-cards visual check covers the fixture cards, and the convergence cards are looked
  at in a local build of the real site at 390 pixels wide (quickstart step 5). No preview
  deployment check is needed for this criterion.

## Assumptions

- "Listing cards" means post cards wherever they appear: writing landing (latest and featured
  grids), all posts, topic pages, series pages, the home page's recent writing and the "Related
  posts" section at the end of a post. They are one card design, so one change covers them all.
  The related-posts cards sit in the same page margins as a listing, so on a phone they have
  the same real width and the same declared display width; SC-001's browser check uses the
  listing pages, and the shared declared width (FR-002) covers the related-posts cards.
- The phone-width viewport and network settings are those the existing page budget check uses:
  a 390 by 844 viewport at normal pixel density, simulated slow 4G (150 ms round trip, 1.6 Mbps
  down), 4x CPU slowdown and the browser cache disabled. Total transfer is the compressed bytes
  on the wire, headers included, for everything loaded until the page is loaded and the network
  is idle, without scrolling; lazy-loaded card images the browser does not fetch before then
  are not counted.
- Expected page weight. At 400 pixels and quality 65 a real-photo card image is about 20 KB
  (the two convergence cards are about 41 KB together, research.md R3), against about 39 KB per
  card today. The convergence page's non-image weight is about 43 KB, so the page goes from
  about 122 KB to about 85 KB, leaving about 65 KB of headroom, room for about three more
  real-photo cards fetched on first load. The fixture site's 12-card all-posts page uses
  flat-colour fixture images of a few hundred bytes each, so its weight is set by the shell
  and stays far below 150 KB. "Clear headroom" means at least 40 KB under the budget (room for
  two more real-photo cards) on both pages. A real page of 12 photo cards whose images all
  loaded at once would weigh about 43 + 12 x 20 = 283 KB; it stays within budget only because
  lazy loading fetches just the cards near the first screen. Bringing such a page under budget
  if all its cards load early is out of scope (see Out of Scope).
- The site's images are already WebP; the card stays WebP and only its quality drops, to 65,
  the value the plan picked from the 60 to 70 range (FR-003, research.md R3).
- The predicted visual change: the fixture listing-cards visual subject shows lighter, card-sized
  images, so its baselines are refreshed on both platforms as part of this feature. That diff is
  predicted here, so it is not a regression. Other visual subjects should not change; any other
  diff is a regression to fix.
- This is not a major change under Principle III: it adds no dependency, changes no layout,
  design system or visual identity, and does not raise running costs. The card looks the same; it
  only downloads a smaller file. The plan confirms this, so auto-merge applies.
- The convergence figures (79 KB of 122 KB) are the issue's measurements on today's build and
  are the baseline for SC-002.

## Out of Scope / Follow-up

- Right-sizing project images on the projects index rows and story pages, the lead story image
  and post hero images. Each could be its own follow-up if those pages approach the budget.
- Changing the 150 KB budget or any other budget limit.
- Changing how many cards a listing page shows before it paginates, or making a page of 12
  real-photo cards fit the budget if all its images load at once (Assumptions, "Expected page
  weight").
- Changing the source images in the content folders.
