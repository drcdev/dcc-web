# Feature Specification: Redirect old Ghost addresses

**Feature Branch**: `030-ghost-redirects`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Cutover plan stage 1b (docs/cutover-plan.md): redirect old Ghost
addresses with permanent (301) redirects, each with and without the trailing slash, so inbound
links and search results keep working after doncoleman.ca switches from Ghost to this site."

## Context

When `doncoleman.ca` switches from Ghost to this site, the addresses Ghost used for posts, topic
lists and a few pages stop existing. Links on LinkedIn and other sites, and search results, point
at those addresses. This change sends each of them to the matching page on the new site.

Decisions already made by Don (2026-10-09), recorded here as settled:

- **Old Ghost addresses get permanent redirects.** This reverses the spec 011 (launch) choice that
  old addresses are not redirected (011 User Story 5 and its edge cases). The other Ghost-only
  addresses named there (tag, author, feed and admin paths) still return the not-found page.
- **`/cookie-policy/` redirects to the privacy policy** instead of returning the not-found page.
- **Pipeline**: Don chose `/tweak` for this change, although the `/tweak` triage rule normally
  excludes redirect changes. It is small, adds no page and changes no page's appearance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Old links reach the right page (Priority: P1)

A reader follows an old link or search result to a Ghost address on `doncoleman.ca` (for example
`/drift/2025/self-contained-development-for-ghost-themes/`). They land on the same post, topic
list or page on the new site instead of a not-found page.

**Why this priority**: It is the whole change. Without it, every inbound link to the old site
breaks on switch day.

**Independent Test**: Request each old address, with and without its trailing slash, and confirm
a single permanent redirect to the mapped new address, which then loads.

**Acceptance Scenarios**:

1. **Given** the site is deployed, **When** a reader requests any old address in the mapping
   table, **Then** the response is one permanent (301) redirect to the mapped new address.
2. **Given** the same old address without its trailing slash, **When** it is requested, **Then**
   it redirects permanently to the same new address.
3. **Given** a reader follows the redirect, **When** the new address loads, **Then** it returns the
   page (200), not a further redirect or a not-found page.

---

### User Story 2 - Unmapped Ghost addresses still return not-found (Priority: P2)

Ghost addresses that have no counterpart (tag, author, feed and admin paths, and old posts not in
the table) keep returning the site's not-found page, as spec 011 set out.

**Why this priority**: It stops the redirect list from growing into a catch-all and keeps the
existing not-found behaviour stable.

**Independent Test**: Request `/tag/x/`, `/author/x/`, `/rss/`, `/ghost/` and an unmapped old post
address, and confirm each returns 404.

**Acceptance Scenarios**:

1. **Given** the site is deployed, **When** a reader requests `/tag/x/`, `/author/x/`, `/rss/` or
   `/ghost/`, **Then** the response is the not-found page with status 404.

---

### Edge Cases

- `/cookie-policy/` previously returned 404 (it was on the not-found list); it now redirects to
  `/privacy-policy/` and leaves that list.
- `/news/` maps to the writing index, not to a topic, because the new site has no news topic.
- `www.doncoleman.ca` addresses: the `www` Redirect Rule (launch item L12) keeps the path, so a
  `www` old address reaches these redirects through it. Testing that chain is out of scope here;
  the cutover plan's post-switch redirect spot check covers it.
- The existing redirects (`/writing/topics/*` and the Tempo privacy addresses) are unchanged.

## Mapping

| Ghost address | New address |
|---|---|
| `/convergence/2025/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/` | `/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/` |
| `/news/2025/starting-something-new/` | `/writing/starting-something-new/` |
| `/drift/2025/self-contained-development-for-ghost-themes/` | `/writing/self-contained-development-for-ghost-themes/` |
| `/drift/2025/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/` | `/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/` |
| `/drift/` | `/writing/drift/` |
| `/convergence/` | `/writing/convergence/` |
| `/news/` | `/writing/` |
| `/contact-thank-you/` | `/contact/` |
| `/cookie-policy/` | `/privacy-policy/` |

Each row applies to the Ghost address both with and without its trailing slash (18 redirects).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each Ghost address in the mapping table MUST respond with a single permanent (301)
  redirect to its new address, both with and without the trailing slash.
- **FR-002**: Every new address in the mapping table MUST load as a page (200) on the built site.
- **FR-003**: `/tag/`, `/author/`, `/rss/` and `/ghost/` addresses and old post addresses not in the
  table MUST keep returning the not-found page (404); `/cookie-policy/` leaves the not-found list.
- **FR-004**: The existing redirects (`/writing/topics/*` and the Tempo privacy addresses) MUST
  keep their current behaviour.
- **FR-005**: No rendered page MUST change in content or appearance; the change is redirects only,
  and every page continues to meet WCAG 2.2 AA (Constitution Principle X).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 18 old addresses (9 rows, with and without trailing slash) redirect in one step
  to the mapped address, and each mapped address loads.
- **SC-002**: The four unmapped Ghost-only address types still return 404.
- **SC-003**: No visual baseline or accessibility check changes result, because no page changes.

## Assumptions

- The four mapped posts, the Drift and Convergence topic lists, the writing index, the contact page
  and the privacy policy already exist on the new site (confirmed in the content and pages
  folders).
- Redirects are handled by the platform's static redirect file, alongside the existing ones; no
  Worker code changes.
- Ghost's `/news/` and `/contact-thank-you/` have no closer match than the writing index and the
  contact page.
- Ticking box 1b in `docs/cutover-plan.md` is part of this change and is done when the pull
  request is opened.

## Out of Scope / Follow-up

- Testing `www` old addresses end to end (covered by the cutover plan's post-switch spot check).
- Redirects for other Ghost addresses not listed in the table.
- Amending spec 011's text; this spec records the reversal instead.
