# Research: Right-size listing card images

**Feature**: `021-card-image-size` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

The Astro Docs MCP (`astro-docs`) was available and used for every Astro choice below. The
installed versions are Astro 7.3.5 and sharp 0.35.5; where the docs and the installed source
differ, the source is quoted.

## R1. How the card asks for smaller versions: `<Image>` `widths` and `sizes`

**Decision**: Keep Astro's `<Image>` from `astro:assets` in `src/components/post/PostCard.astro`
and change only its props: `widths={[320, 400, 640]}` and
`sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)"`.

**Rationale**:

- `widths` generates the `srcset`, and `sizes` must be given with it
  (docs.astro.build/en/reference/modules/astro-assets/#widths and #sizes). That is exactly the
  control the card needs; nothing custom is required.
- The docs note that the generated `sizes` for `layout` images "assumes the image is displayed
  close to the full width of the screen" and to adjust `sizes` by hand when it is not
  (…/astro-assets/#sizes). The card is not full width on a phone: it sits inside `<main
  class="container mx-auto p-4">` (`src/layouts/BaseLayout.astro`), so it is drawn at the
  viewport width minus 2rem (1rem padding each side). At the budget check's 390 px viewport the
  slot is 358 px; on a 430 px phone it is 398 px. Both pick the 400w candidate at 1x (FR-002).
- The tablet (`45vw`) and desktop (`320px`) values are unchanged (Clarifications, FR-002).
- Upscaling: the docs say widths larger than the original are ignored. The installed
  `baseService.getSrcSet` (`node_modules/astro/dist/assets/services/service.js`) filters widths
  above the source width **and then appends the source width itself**. So a 480 px source (the
  generated fixture posts) offers 320w, 400w and 480w, and a source narrower than 400 px offers
  320w and its own width. Nothing is ever enlarged (spec edge case), and the 400w candidate
  exists for every source at least 400 px wide.

**Alternatives considered**:

- `layout="constrained"` / `"full-width"` with automatic `widths` and `sizes`
  (docs.astro.build/en/guides/images/#responsive-image-behavior): generates its own width set
  from the image's size and default breakpoints, so FR-001's exact 320/400/640 set could not be
  pinned, and it adds Astro's responsive styles. Rejected.
- `densities` (…/astro-assets/#densities): `x` descriptors ignore the drawn slot width, so a
  phone could not be steered to 400 px by layout. Rejected.
- `<Picture>` with a second format (AVIF): changes the image format, which FR-005 forbids, and
  is out of scope.

## R2. How the card gets a lower quality: per-component `quality` prop

**Decision**: Add `quality={65}` to the card's `<Image>`. No change to `astro.config.mjs`.

**Rationale**:

- `quality` on `<Image>` is "a preset (`low`, `mid`, `high`, `max`) … or a number from 0 to 100
  (interpreted differently between formats)" (docs.astro.build/en/reference/modules/astro-assets/#quality).
  A number is needed because the presets map to 25/50/80/100 in the sharp service
  (`qualityTable` in `node_modules/astro/dist/assets/services/sharp.js`), none of which is in the
  60 to 70 range.
- The prop applies to that one `<Image>` only, so the lead story (`LeadStory.astro`), post hero
  (`PostHero.astro`), project images and the home photo keep their encoding (FR-006). A
  global setting cannot do that.
- The quality travels in each candidate's transform, so in the image endpoint URL Astro writes
  it as `q=65` (`getURL` in `service.js`), and in the build it is part of each generated
  file's hash. That makes it observable without a browser (component test, R5).
- The site's "general image quality" today is no quality at all: `astro.config.mjs` has no
  `image` key, `transform.quality` is undefined, and sharp's WebP encoder default of 80 applies.

**Alternatives considered**:

- Global `image.service.config.webp.quality` in `astro.config.mjs`
  (docs.astro.build/en/reference/configuration-reference/#imageservice): changes every image
  on the site, breaking FR-006, and is a configuration change. Rejected.
- `getImage()` with a hand-built `<img>` (docs.astro.build/en/guides/images/#generating-images-with-getimage):
  works, but re-implements what `<Image>` already gives (width, height, lazy loading,
  decoding, srcset). Custom code is not justified when the first-party prop exists
  (Principle IV). Rejected.

## R3. Which quality value: 65

**Decision**: WebP quality **65** for card images.

**Method**: `quality-compare.mjs` (a scratch script outside the repository, not committed)
resized each source to the card width with sharp 0.35.5 (the library Astro's image service
uses), encoded WebP at sharp's default (80, what cards use today) and at 70, 65 and 60, and
measured the encoded bytes and the PSNR against the unencoded resize. The 400 px encodes of the
two convergence images were viewed side by side at q80 and q60.

Bytes at 400 px wide (the phone candidate after this feature):

| Image | Source | q80 (today's encoder) | q70 | q65 | q60 | PSNR dB q80 / 70 / 65 / 60 |
|---|---|---|---|---|---|---|
| convergence: `starting-new-hero.jpg` | 2000×1333 JPEG | 33,392 | 26,936 | 25,644 | 24,124 | 30.9 / 29.9 / 29.6 / 29.3 |
| convergence: `wayfinder-hero.jpg` | 2000×1365 JPEG | 21,500 | 16,292 | 15,370 | 14,530 | 34.9 / 33.2 / 32.9 / 32.5 |
| fixture: `tests/fixtures/posts/images/sample.png` | 1200×675 PNG | 250 | 244 | 248 | 258 | 52.8 / 52.8 / 52.6 / 52.4 |
| fixture: generated solid post image | 480×270 PNG | 254 | 258 | 250 | 300 | 49.9 / 49.7 / 49.9 / 49.2 |
| **Two convergence cards** | | **54,892** | **43,228** | **41,014** | **38,654** | |

Bytes at 640 px wide (what a 2x phone or a wide 1x screen may pick; unchanged width):

| Image | q80 | q70 | q65 | q60 |
|---|---|---|---|---|
| convergence: `starting-new-hero.jpg` | 75,750 | 60,912 | 57,294 | 54,674 |
| convergence: `wayfinder-hero.jpg` | 51,994 | 40,118 | 37,622 | 35,552 |

**Rationale**:

- Appearance: at the drawn size (about 360 px) the q60 and q80 encodes of both convergence
  images could not be told apart by eye; the sky gradient of `wayfinder-hero.jpg`, the likeliest
  place for banding, showed none. PSNR falls by about 1.3 to 2 dB from q80 to q65, a small
  step. The fixture images are flat colour and do not vary with quality in any meaningful way
  (a few bytes either way), so they cannot pick the value; they only show the change does not
  grow small images.
- Size: going from q70 to q65 saves 2,214 bytes on the two convergence cards; going on to q60
  saves only 2,360 more, while the quality loss per step stays the same. 65 takes most of the
  saving and leaves a quality margin for detailed photos added later.
- SC-002 at 65: the two convergence cards go from 77,520 bytes (today's 480w files, R4) to about
  41,014 bytes, a 47% cut, past the 40% target (≤ 47 KB) with room to spare. q70 (43,228, 44%)
  would also pass, but with less margin.

**Alternatives considered**: 70 (safest quality, smallest saving, 44% cut on convergence) and 60
(smallest files, about 2 KB less than 65 for the same quality step). The range ends were
rejected for the reasons above.

## R4. Baseline for the PR (SC-002 "before")

Measured on a fresh `pnpm run build` of this branch before any change (2026-10-04, `dist/`):

- `/writing/convergence/` card `srcset` today: `320w, 480w, 640w`, `sizes="(min-width: 1024px)
  320px, (min-width: 640px) 45vw, 100vw"`. At 390 px (1x) the browser picks 480w.
- Built 480w card files: `starting-new-hero…webp` 46,508 bytes and `wayfinder-hero…webp` 31,012
  bytes, **77,520 bytes** of image body for the two cards.
- Transfer as the budget check counts it (encoded bytes including headers), from feature 018's
  measurement (`specs/018-self-hosted-fonts/plan.md`, research R4 there): the two card images
  are **78,604 bytes** of the page's **121,654 bytes**. These are the issue's "about 79 KB of
  122 KB".
- Expected after: about 41,000 bytes of card image body (R3), so the page drops by about
  36,500 bytes to roughly 85,000 bytes, below SC-002's 100 KB. The real after figure is taken
  from the budget test's `budget` annotation for `writing-series-convergence` once the change
  is built, and both go in the PR body.

## R5. Where each test goes (Principle I, `docs/testing.md` "Where a test goes")

| Behaviour | Primary layer | Why this layer | Second layer |
|---|---|---|---|
| A card offers exactly 320w/400w/640w, the new `sizes`, and quality 65 on every candidate (FR-001, FR-002 `sizes` half, FR-003, FR-004) | **Component** (`tests/component/post/PostCard.test.ts`, Vitest `unit` project, Astro container) | The rendered `srcset`, `sizes` and the `q=65` in each candidate URL are in the component's HTML; no browser or build needed. Cheapest layer. | None. |
| Shape, alt, width/height, lazy loading and WebP kept (FR-005) | **Component** (existing PostCard assertions, extended to check every candidate URL carries `f=webp`) | Same HTML. | None. |
| Other images keep their quality (FR-006) | **Component** (`LeadStory.test.ts`, `PostHero.test.ts`: no `q=` parameter in their `srcset`) | Same reason; one cheap assertion each guards against a later move of `quality` to a shared place. | None. |
| A phone-width (390 px, 1x) browser downloads no card image wider than about 400 px on every page that shows cards (FR-002, SC-001) | **E2E** (`tests/e2e/blog-fixtures.spec.ts`, Playwright `sections` project on the fixture site, port 4322) | Which `srcset` candidate is chosen is only observable in a browser (`currentSrc`). The fixture site is fixture-only content, so the test names no real post. | None. The component test covers what is offered; this covers what is chosen. They observe different behaviours, so this is not a second layer for one behaviour. |
| Every template and the 12-card fixture page stay under 150 KB (FR-007, SC-003) | **Budget** (existing `tests/e2e/budget.spec.ts`, unchanged) | Already the gate. | None; no new test. |
| Cards look the same (SC-004) | **Visual** (existing `listing-cards` subject) | Already covers card pixels on fixture content. | None; baselines refreshed if they diff (plan, "Visual baselines"). |

A build test was considered for the quality (reading generated file names from a real build) and
rejected: the component test sees the same transform without running `astro build`, and
`docs/testing.md` keeps build tests for what only the real build shows.

The E2E check: a fresh 390×844 context with `deviceScaleFactor: 1`, for each fixture-site page
that shows cards with images (`/`, `/writing/`, `/writing/all/`, `/writing/topics/fixture-cards/`,
`/writing/drift/`), scroll every `[data-post-card] img` into view, wait until each is
`complete`, then map its `currentSrc` back to its `srcset` descriptor and assert the
descriptor is at most 400w. On today's code the generated 480 px fixture images offer 320w and
480w, the slot is 390 px, and the browser picks 480w, so the test fails first as Principle I
requires. After the change the slot is 358 px and the browser picks 400w.

Chromium at 1x picks the smallest candidate whose density is at least 1, or a smaller one when
the geometric-mean rule allows; either way it never picks above 400w for a 358 px slot when 400w
is offered, so the assertion is stable.

## After (T014, SC-002 measurement)

Method. Page total: the `totalBytes` field of the `budget` annotation for the
`writing-series-convergence` template, from `pnpm run test:budget` re-run with the JSON reporter
(compressed transfer, headers included). Card images: the two 400w `_astro/` WebP files that the
built `/writing/convergence/` HTML offers at the 390 px slot (`sizes` resolves to 358 px, so 1x
picks 400w), summed from `dist/`. No Network-panel capture was taken; the built file sizes stand
in for the browser-measured transfer figure, so the card figure is file size, not transferred
bytes with headers.

| Measure | Before (R4) | After | Change |
|---|---|---|---|
| Card images (two cards) | 77,520 B (480w files; 78,604 B transferred) | 42,366 B (15,462 + 26,904, 400w q=65) | -35,154 B, -45.3% (-46.1% against 78,604 B transferred) |
| Convergence page total | 121,654 B | 86,741 B | -34,913 B, -28.7% |

Targets. Card images at most about 47 KB: met (42.4 KB). Cut of at least 40%: met (45.3%).
Page below 100 KB: met (86.7 KB, against the unchanged 150 KB budget). The other writing
templates report 69,258 B (`writing-all`) and 67,396 B (12-card fixture `/writing/all/`); the
`budget` project passed in full (73 of 73). No follow-up needed.
